"use server";

import { supabaseAdmin as supabase } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";

export interface KanbanMetrics {
  totalCustomers: number;
  totalBoards: number;
  tasksByStatus: {
    backlog: number;
    todo: number;
    in_progress: number;
    complete: number;
  };
  totalTasks: number;
}

export async function getKanbanMetrics(): Promise<KanbanMetrics> {
  await requireAdmin();

  // Get customers count
  const { data: customers, error: customersError } = await supabase
    .from("customers")
    .select("id");

  if (customersError) {
    console.error("Error fetching customers:", customersError);
  }

  // Get boards count
  const { data: boards, error: boardsError } = await supabase
    .from("kanban_boards")
    .select("id");

  if (boardsError) {
    console.error("Error fetching boards:", boardsError);
  }

  // Get tasks by status
  const { data: tasks, error: tasksError } = await supabase
    .from("kanban_tasks")
    .select("status");

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
  }

  const taskList = tasks || [];
  const tasksByStatus = {
    backlog: taskList.filter((t) => t.status === "backlog").length,
    todo: taskList.filter((t) => t.status === "todo").length,
    in_progress: taskList.filter((t) => t.status === "in_progress").length,
    complete: taskList.filter((t) => t.status === "complete").length,
  };

  return {
    totalCustomers: customers?.length || 0,
    totalBoards: boards?.length || 0,
    tasksByStatus,
    totalTasks: taskList.length,
  };
}
