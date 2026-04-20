"use server";

import { supabaseAdmin as supabase } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";
import type { DashboardTask, DashboardTaskOverview, DashboardTasksByStatus } from "@/types/dashboard-tasks";
import type { Customer, KanbanBoard, Task, TaskStatus } from "@/types/kanban";

const STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "complete"];

type BoardWithCustomer = KanbanBoard & {
  customers?: Pick<Customer, "id" | "name" | "company" | "email"> | null;
};

function emptyTasksByStatus(): DashboardTasksByStatus {
  return {
    backlog: [],
    todo: [],
    in_progress: [],
    complete: [],
  };
}

function groupDashboardTasks(tasks: DashboardTask[]): DashboardTasksByStatus {
  const grouped = emptyTasksByStatus();

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  for (const status of STATUSES) {
    grouped[status].sort((a, b) => {
      if (a.due_date && b.due_date) {
        const byDueDate = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (byDueDate !== 0) return byDueDate;
      }

      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;

      return a.position - b.position;
    });
  }

  return grouped;
}

export async function getDashboardTaskOverview(customerId?: string | null): Promise<DashboardTaskOverview> {
  await requireAdmin();

  let boardsQuery = supabase
    .from("kanban_boards")
    .select("*, customers(id, name, company, email)")
    .order("created_at");

  if (customerId) {
    boardsQuery = boardsQuery.eq("customer_id", customerId);
  }

  const { data: boardsData, error: boardsError } = await boardsQuery;

  if (boardsError) {
    throw new Error(boardsError.message);
  }

  const boards = (boardsData || []) as BoardWithCustomer[];
  const boardIds = boards.map((board) => board.id);

  if (boardIds.length === 0) {
    return { tasksByStatus: emptyTasksByStatus(), totalTasks: 0 };
  }

  let tasksQuery = supabase
    .from("kanban_tasks")
    .select("*")
    .in("board_id", boardIds)
    .order("position");

  if (!customerId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    tasksQuery = tasksQuery
      .not("due_date", "is", null)
      .gte("due_date", start.toISOString())
      .lte("due_date", end.toISOString());
  }

  const { data: tasksData, error: tasksError } = await tasksQuery;

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  const boardLookup = new Map(boards.map((board) => [board.id, board]));
  const tasks = ((tasksData || []) as Task[]).map<DashboardTask>((task) => {
    const board = boardLookup.get(task.board_id);
    const customer = board?.customers;
    const customerName = customer?.company || customer?.name || customer?.email || "Unassigned customer";

    return {
      ...task,
      board_name: board?.name || "Board",
      customer_id: board?.customer_id || "",
      customer_name: customerName,
      customer_company: customer?.company || null,
    };
  });

  return {
    tasksByStatus: groupDashboardTasks(tasks),
    totalTasks: tasks.length,
  };
}
