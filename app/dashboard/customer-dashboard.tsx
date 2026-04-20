"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Clock, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerDashboardData } from "@/types/customer-dashboard";
import type { Task, TaskPriority, TaskStatus } from "@/types/kanban";

export function CustomerDashboard({ data }: { data: CustomerDashboardData }) {
  const defaultBoardId = data.boards.find((board) => board.is_default)?.id ?? data.boards[0]?.id ?? "";
  const [selectedBoardId, setSelectedBoardId] = useState(defaultBoardId);
  const selectedBoard = useMemo(
    () => data.boards.find((board) => board.id === selectedBoardId) ?? data.boards[0],
    [data.boards, selectedBoardId]
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{data.customerCompany || data.customerName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedBoard?.name ?? "Customer project board"}
            </p>
          </div>
        </div>
        {data.boards.length > 1 && (
          <Select value={selectedBoard?.id ?? ""} onValueChange={(value) => setSelectedBoardId(value ?? "")}>
            <SelectTrigger className="w-full lg:w-80">
              <SelectValue placeholder="Select board" />
            </SelectTrigger>
            <SelectContent>
              {data.boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}{board.is_default ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedBoard ? (
        <div className="grid min-h-[calc(100vh-12rem)] gap-4 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <section key={column.id} className="flex min-h-0 flex-col rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <column.icon className="size-4 text-muted-foreground" />
                  <h2 className="font-medium">{column.title}</h2>
                </div>
                <Badge variant="secondary">{selectedBoard.tasks[column.id].length}</Badge>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                {selectedBoard.tasks[column.id].length === 0 ? (
                  <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed bg-background/60 text-sm text-muted-foreground">
                    No tasks
                  </div>
                ) : (
                  selectedBoard.tasks[column.id].map((task) => (
                    <CustomerTaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[50vh] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No project boards are available yet.
        </div>
      )}
    </div>
  );
}

const COLUMNS: Array<{ id: TaskStatus; title: string; icon: typeof Circle }> = [
  { id: "backlog", title: "Backlog", icon: Circle },
  { id: "todo", title: "To Do", icon: Clock },
  { id: "in_progress", title: "In Progress", icon: LayoutGrid },
  { id: "complete", title: "Complete", icon: CheckCircle2 },
];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function CustomerTaskCard({ task }: { task: Task }) {
  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-5">{task.title}</h3>
        <Badge variant={task.priority === "urgent" ? "destructive" : "outline"}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>
      {task.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {task.description}
        </p>
      )}
      {task.due_date && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(task.due_date))}
        </div>
      )}
    </article>
  );
}
