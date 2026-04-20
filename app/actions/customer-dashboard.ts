"use server";

import { supabaseAdmin } from "@/lib/api-keys";
import { requireCustomerAccess } from "@/lib/authz";
import type { CustomerDashboardData } from "@/types/customer-dashboard";
import type { KanbanBoard, Task, TaskStatus } from "@/types/kanban";

export async function getMyCustomerDashboard(): Promise<CustomerDashboardData> {
  const { customerId } = await requireCustomerAccess();

  const [
    customerResult,
    boardsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("customers")
      .select("name, company")
      .eq("id", customerId)
      .single(),
    supabaseAdmin.from("kanban_boards").select("*").eq("customer_id", customerId),
  ]);

  if (customerResult.error || !customerResult.data) {
    throw new Error("Customer profile not found");
  }

  const boards = (boardsResult.data || []) as KanbanBoard[];
  const boardIds = boards.map((board) => board.id);
  const tasksResult = boardIds.length > 0
    ? await supabaseAdmin.from("kanban_tasks").select("*").in("board_id", boardIds)
    : { data: [] as Task[], error: null };

  const tasks = (tasksResult.data || []) as Task[];
  const statuses: TaskStatus[] = ["backlog", "todo", "in_progress", "complete"];

  return {
    customerName: customerResult.data.name,
    customerCompany: customerResult.data.company,
    boards: boards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      is_default: board.is_default,
      tasks: statuses.reduce(
        (groupedTasks, status) => ({
          ...groupedTasks,
          [status]: tasks
            .filter((task) => task.board_id === board.id && task.status === status)
            .sort((a, b) => a.position - b.position),
        }),
        {
          backlog: [],
          todo: [],
          in_progress: [],
          complete: [],
        } as Record<TaskStatus, Task[]>
      ),
    })),
  };
}
