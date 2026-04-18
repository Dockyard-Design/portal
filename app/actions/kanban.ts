"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabase } from "@/lib/api-keys";
import type { 
  Customer, 
  KanbanBoard,
  Task, 
  CreateCustomerInput, 
  UpdateCustomerInput,
  CreateBoardInput,
  UpdateBoardInput,
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
  revalidatePath("/dashboard/kanban");
  revalidatePath("/dashboard/customers");
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
  revalidatePath("/dashboard/kanban");
  revalidatePath("/dashboard/customers");
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/kanban");
  revalidatePath("/dashboard/customers");
}

// Kanban Boards
export async function getBoards(customerId: string): Promise<KanbanBoard[]> {
  const { data, error } = await supabase
    .from("kanban_boards")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at");

  if (error) throw new Error(sanitizeError(error));
  return (data as KanbanBoard[]) || [];
}

export async function getBoard(id: string): Promise<KanbanBoard | null> {
  const { data, error } = await supabase
    .from("kanban_boards")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as KanbanBoard;
}

export async function getBoardWithCustomer(id: string): Promise<{ board: KanbanBoard; customer: Customer } | null> {
  const { data, error } = await supabase
    .from("kanban_boards")
    .select(`*, customers(*)`)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  
  const { customers, ...board } = data;
  return {
    board: board as KanbanBoard,
    customer: customers as Customer,
  };
}

export async function createBoard(board: CreateBoardInput): Promise<KanbanBoard> {
  const userId = await requireAuth();

  // If this is the first board for this customer, make it default
  const { data: existingBoards } = await supabase
    .from("kanban_boards")
    .select("id")
    .eq("customer_id", board.customer_id)
    .limit(1);

  const isDefault = existingBoards?.length === 0 || board.is_default;

  // If setting as default, unset other default boards
  if (isDefault) {
    await supabase
      .from("kanban_boards")
      .update({ is_default: false })
      .eq("customer_id", board.customer_id);
  }

  const { data, error } = await supabase
    .from("kanban_boards")
    .insert({
      ...board,
      is_default: isDefault,
      author_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/kanban");
  return data as KanbanBoard;
}

export async function updateBoard(id: string, updates: UpdateBoardInput): Promise<KanbanBoard> {
  await requireAuth();

  const { data: board } = await supabase
    .from("kanban_boards")
    .select("customer_id")
    .eq("id", id)
    .single();

  // If setting as default, unset other default boards
  if (updates.is_default && board) {
    await supabase
      .from("kanban_boards")
      .update({ is_default: false })
      .eq("customer_id", board.customer_id);
  }

  const { data, error } = await supabase
    .from("kanban_boards")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/kanban");
  return data as KanbanBoard;
}

export async function deleteBoard(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase
    .from("kanban_boards")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/kanban");
}

// Tasks
export async function getTasks(boardId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("kanban_tasks")
    .select("*")
    .eq("board_id", boardId)
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
    .eq("board_id", task.board_id)
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
  revalidatePath("/dashboard/kanban");
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
  revalidatePath("/dashboard/kanban");
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  await requireAuth();

  const { error } = await supabase
    .from("kanban_tasks")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/kanban");
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
  revalidatePath("/dashboard/kanban");
  return data as Task;
}

// Get tasks grouped by status for a board
export async function getTasksByStatus(boardId: string): Promise<TasksByStatus> {
  const tasks = await getTasks(boardId);
  
  const columns: TasksByStatus = {
    backlog: tasks.filter(t => t.status === "backlog").sort((a, b) => a.position - b.position),
    todo: tasks.filter(t => t.status === "todo").sort((a, b) => a.position - b.position),
    in_progress: tasks.filter(t => t.status === "in_progress").sort((a, b) => a.position - b.position),
    complete: tasks.filter(t => t.status === "complete").sort((a, b) => a.position - b.position),
  };

  return columns;
}

// Legacy: Get tasks grouped by status for a customer (uses default board)
export async function getTasksByStatusForCustomer(customerId: string): Promise<{ board: KanbanBoard | null; tasks: TasksByStatus }> {
  // Get the default board for this customer, or the first board
  const { data: boards } = await supabase
    .from("kanban_boards")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .limit(1);

  const board = (boards?.[0] as KanbanBoard) || null;
  
  if (!board) {
    return { board: null, tasks: { backlog: [], todo: [], in_progress: [], complete: [] } };
  }

  const tasks = await getTasksByStatus(board.id);
  return { board, tasks };
}
