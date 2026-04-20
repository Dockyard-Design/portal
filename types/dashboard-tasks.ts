import type { Task, TaskStatus } from "@/types/kanban";

export interface DashboardTask extends Task {
  board_name: string;
  customer_id: string;
  customer_name: string;
  customer_company: string | null;
}

export type DashboardTasksByStatus = Record<TaskStatus, DashboardTask[]>;

export interface DashboardTaskOverview {
  tasksByStatus: DashboardTasksByStatus;
  totalTasks: number;
}
