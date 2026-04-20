export type TaskStatus = "backlog" | "todo" | "in_progress" | "complete";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddress: string | null;
  imageUrl: string | null;
}

export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
}

export interface KanbanBoard {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  author_id: string;
}

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  board_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  position: number;
  author_id: string;
}

export interface TasksByStatus {
  backlog: Task[];
  todo: Task[];
  in_progress: Task[];
  complete: Task[];
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  company?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string | null;
  company?: string | null;
  notes?: string | null;
}

export interface CreateBoardInput {
  customer_id: string;
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string | null;
  is_default?: boolean;
}

export interface CreateTaskInput {
  board_id: string;
  assigned_to?: string | null;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date: string;
}

export interface UpdateTaskInput {
  assigned_to?: string | null;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}
