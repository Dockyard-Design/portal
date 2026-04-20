import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardTasksByStatus } from "@/types/dashboard-tasks";
import type { TaskPriority, TaskStatus } from "@/types/kanban";

const COLUMNS: Array<{ id: TaskStatus; title: string; color: string; icon: LucideIcon }> = [
  { id: "backlog", title: "Backlog", color: "bg-slate-500", icon: Circle },
  { id: "todo", title: "To Do", color: "bg-blue-500", icon: AlertCircle },
  { id: "in_progress", title: "In Progress", color: "bg-amber-500", icon: Clock },
  { id: "complete", title: "Complete", color: "bg-green-500", icon: CheckCircle2 },
];

const PRIORITIES: Record<TaskPriority, { color: string; label: string }> = {
  urgent: { color: "bg-red-500", label: "Urgent" },
  high: { color: "bg-orange-500", label: "High" },
  medium: { color: "bg-yellow-500", label: "Medium" },
  low: { color: "bg-blue-400", label: "Low" },
};

const MAX_VISIBLE_TASK_HEIGHT = "max-h-[52rem]";
const SCROLLBAR_CLASSES =
  "[scrollbar-color:var(--muted)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40";

export function DashboardTaskKanban({
  title,
  description,
  tasksByStatus,
  showCustomer = false,
}: {
  title: string;
  description: string;
  tasksByStatus: DashboardTasksByStatus;
  showCustomer?: boolean;
}) {
  const totalTasks = COLUMNS.reduce((total, column) => total + tasksByStatus[column.id].length, 0);

  return (
    <section className="w-full">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary">{totalTasks} tasks</Badge>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={cn("size-3 rounded-full", column.color)} />
                <span className="text-sm font-medium">{column.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {tasksByStatus[column.id].length}
                </Badge>
              </div>
            </div>
            <div
              className={cn(
                "min-h-24 flex-1 overflow-y-auto rounded-lg border border-transparent p-1 pr-2",
                MAX_VISIBLE_TASK_HEIGHT,
                SCROLLBAR_CLASSES
              )}
            >
              {tasksByStatus[column.id].length === 0 ? (
                <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                  No tasks
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {tasksByStatus[column.id].map((task) => (
                    <article
                      key={task.id}
                      className="group relative rounded-lg border bg-card p-4 transition-colors hover:border-primary/30"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100" />
                        <h3 className="line-clamp-2 flex-1 text-sm font-medium">
                          {task.title}
                        </h3>
                      </div>

                      <div className="mb-3 min-h-[1.5rem]">
                        {task.description && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="mb-3 h-6">
                        <div className="flex items-center gap-1.5">
                          <div className="flex size-5 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[10px] font-medium text-primary">
                            {getInitials(showCustomer ? task.customer_name : task.board_name)}
                          </div>
                          <span className="truncate text-xs text-muted-foreground">
                            {showCustomer ? task.customer_name : task.board_name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          <span className="text-xs text-muted-foreground">
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>

                        {task.due_date && (
                          <div className={cn("flex items-center gap-1 text-xs", getDueDateColor(task.due_date))}>
                            <CalendarIcon className="size-3" />
                            {formatDueDate(task.due_date)}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getPriorityLabel(priority: TaskPriority): string {
  return PRIORITIES[priority]?.label ?? priority;
}

function getPriorityBadge(priority: TaskPriority): React.ReactNode {
  const config = PRIORITIES[priority] || PRIORITIES.medium;
  return <div className={cn("size-2 rounded-full", config.color)} />;
}

function formatDueDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);

  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

function getDueDateColor(dateStr: string | null): string {
  if (!dateStr) return "text-muted-foreground";
  const date = parseISO(dateStr);

  if (isPast(date) && !isToday(date)) return "text-red-400";
  if (isToday(date) || isTomorrow(date)) return "text-amber-400";
  return "text-muted-foreground";
}

function getInitials(value: string): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (parts[0] || "?").slice(0, 2).toUpperCase();
}
