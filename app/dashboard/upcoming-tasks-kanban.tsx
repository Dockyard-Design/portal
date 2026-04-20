"use client";

import { useEffect, useState } from "react";
import { getDashboardTaskOverview } from "@/app/actions/dashboard-tasks";
import { DashboardTaskKanban } from "./dashboard-task-kanban";
import type { DashboardTaskOverview } from "@/types/dashboard-tasks";

const EMPTY_OVERVIEW: DashboardTaskOverview = {
  totalTasks: 0,
  tasksByStatus: {
    backlog: [],
    todo: [],
    in_progress: [],
    complete: [],
  },
};

export function UpcomingTasksKanban() {
  const [overview, setOverview] = useState<DashboardTaskOverview>(EMPTY_OVERVIEW);

  useEffect(() => {
    let cancelled = false;

    getDashboardTaskOverview(null)
      .then((nextOverview) => {
        if (!cancelled) {
          setOverview(nextOverview);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOverview(EMPTY_OVERVIEW);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardTaskKanban
      title="Tasks Due Next 7 Days"
      description="Read-only view of upcoming tasks across all customers."
      tasksByStatus={overview.tasksByStatus}
      showCustomer
    />
  );
}
