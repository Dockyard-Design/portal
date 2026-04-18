"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabase } from "@/lib/api-keys";
import type { 
  Customer, 
  Task, 
  CreateCustomerInput, 
  UpdateCustomerInput,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TasksByStatus,
  ClerkUser
} from "@/types/kanban";

const KNOWN_ERRORS: Record<string, string> = {
  "23505": "A task with this title already exists.",
  "23503": "Customer not found.",
};

function sanitizeError(error: { code?: string; message: string }): string {
  if (error.code && KNOWN_ERRORS[error.code]) {
    return KNOWN_ERRORS[error.code];
  }
  return error.message || "Something went wrong. Please try again.";
}

async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

// Team Members (Clerk Users)
export async function getTeamMembers(): Promise<ClerkUser[]> {
  const clerk = await clerkClient();
  
  try {
    const users = await clerk.users.getUserList({
      limit: 100,
    });
    
    return users.data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      emailAddress: user.emailAddresses[0]?.emailAddress || null,
      imageUrl: user.imageUrl,
    }));
  } catch {
    return [];
  }
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");

  if (error) throw new Error(sanitizeError(error));
  return (data as Customer[]) || [];
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Customer;
}

export async function createCustomer(customer: CreateCustomerInput): Promise<Customer> {
  await requireAuth();

  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/work");
  return data as Customer;
}

export async function updateCustomer(id: string, updates: UpdateCustomerInput): Promise<Customer> {
  await requireAuth();

  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/work");
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/work");
}

// Tasks
export async function getTasks(customerId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("kanban_tasks")
    .select("*")
    .eq("customer_id", customerId)
    .order("position");

  if (error) throw new Error(sanitizeError(error));
  return (data as Task[]) || [];
}

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("kanban_tasks")
    .select("*")
    .order("position");

  if (error) throw new Error(sanitizeError(error));
  return (data as Task[]) || [];
}

export async function getTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from("kanban_tasks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Task;
}

export async function createTask(task: CreateTaskInput): Promise<Task> {
  const userId = await requireAuth();

  // Get max position for the status column
  const { data: existingTasks } = await supabase
    .from("kanban_tasks")
    .select("position")
    .eq("customer_id", task.customer_id)
    .eq("status", task.status || "backlog")
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTasks && existingTasks.length > 0 
    ? ((existingTasks[0] as Task).position || 0) + 1 
    : 0;

  const { data, error } = await supabase
    .from("kanban_tasks")
    .insert({
      ...task,
      author_id: userId,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/work");
  return data as Task;
}

export async function updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
  await requireAuth();

  const { data, error } = await supabase
    .from("kanban_tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/work");
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase
    .from("kanban_tasks")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/work");
}

export async function moveTask(id: string, newStatus: TaskStatus, newPosition: number): Promise<Task> {
  await requireAuth();

  const { data, error } = await supabase
    .from("kanban_tasks")
    .update({ status: newStatus, position: newPosition })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/work");
  return data as Task;
}

// Get tasks grouped by status for a customer
export async function getTasksByStatus(customerId: string): Promise<TasksByStatus> {
  const tasks = await getTasks(customerId);
  
  const columns: TasksByStatus = {
    backlog: tasks.filter(t => t.status === "backlog").sort((a, b) => a.position - b.position),
    todo: tasks.filter(t => t.status === "todo").sort((a, b) => a.position - b.position),
    in_progress: tasks.filter(t => t.status === "in_progress").sort((a, b) => a.position - b.position),
    complete: tasks.filter(t => t.status === "complete").sort((a, b) => a.position - b.position),
  };

  return columns;
}
