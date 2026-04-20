"use client";

import { useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardTaskKanban } from "./dashboard-task-kanban";
import type { CustomerDashboardData } from "@/types/customer-dashboard";
import type { DashboardTasksByStatus } from "@/types/dashboard-tasks";
import type { TaskStatus } from "@/types/kanban";

const EMPTY_TASKS_BY_STATUS: DashboardTasksByStatus = {
  backlog: [],
  todo: [],
  in_progress: [],
  complete: [],
};

const STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "complete"];

export function CustomerDashboard({ data }: { data: CustomerDashboardData }) {
  const defaultBoardId = data.boards.find((board) => board.is_default)?.id ?? data.boards[0]?.id ?? "";
  const [selectedBoardId, setSelectedBoardId] = useState(defaultBoardId);
  const selectedBoard = useMemo(
    () => data.boards.find((board) => board.id === selectedBoardId) ?? data.boards[0],
    [data.boards, selectedBoardId]
  );
  const selectedTasksByStatus = useMemo<DashboardTasksByStatus>(() => {
    if (!selectedBoard) return EMPTY_TASKS_BY_STATUS;

    return STATUSES.reduce((grouped, status) => {
      grouped[status] = selectedBoard.tasks[status].map((task) => ({
        ...task,
        board_name: selectedBoard.name,
        customer_id: "",
        customer_name: data.customerCompany || data.customerName,
        customer_company: data.customerCompany,
      }));
      return grouped;
    }, { ...EMPTY_TASKS_BY_STATUS });
  }, [data.customerCompany, data.customerName, selectedBoard]);

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
        <DashboardTaskKanban
          title="Kanban Board"
          description="Read-only view of your selected project board."
          tasksByStatus={selectedTasksByStatus}
        />
      ) : (
        <div className="flex min-h-[50vh] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No project boards are available yet.
        </div>
      )}
    </div>
  );
}
