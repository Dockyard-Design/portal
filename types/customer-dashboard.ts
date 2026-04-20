import type { Task, TaskStatus } from "@/types/kanban";

export interface CustomerDashboardBoard {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  tasks: Record<TaskStatus, Task[]>;
}

export interface CustomerDashboardData {
  customerName: string;
  customerCompany: string | null;
  boards: CustomerDashboardBoard[];
}
