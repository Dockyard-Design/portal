"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  LayoutGrid,
  ClipboardList,
  Clock,
  Play,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import type { KanbanMetrics as KanbanMetricsType } from "@/app/actions/kanban-metrics";

interface KanbanMetricsProps {
  metrics: KanbanMetricsType;
}

export function KanbanMetrics({ metrics }: KanbanMetricsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {/* Customers */}
        <Link href="/dashboard/customers">
          <Card className="border-border/40 shadow-sm hover:border-primary/40 transition-colors group h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Briefcase className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight">
                  {metrics.totalCustomers}
                </div>
                <div className="text-sm text-muted-foreground">Customers</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.totalBoards} boards
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Total Tasks */}
        <Link href="/dashboard/work">
          <Card className="border-border/40 shadow-sm hover:border-primary/40 transition-colors group h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600">
                  <ClipboardList className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight">
                  {metrics.totalTasks}
                </div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Across all boards
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Backlog */}
        <Link href="/dashboard/work">
          <Card className="border-border/40 shadow-sm hover:border-primary/40 transition-colors group h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-slate-500/10 text-slate-600">
                  <ClipboardList className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight">
                  {metrics.tasksByStatus.backlog}
                </div>
                <div className="text-sm text-muted-foreground">Backlog</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Pending tasks
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Todo */}
        <Link href="/dashboard/work">
          <Card className="border-border/40 shadow-sm hover:border-primary/40 transition-colors group h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Clock className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight">
                  {metrics.tasksByStatus.todo}
                </div>
                <div className="text-sm text-muted-foreground">To Do</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Ready to start
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* In Progress */}
        <Link href="/dashboard/work">
          <Card className="border-border/40 shadow-sm hover:border-primary/40 transition-colors group h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Play className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight">
                  {metrics.tasksByStatus.in_progress}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Active work
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Complete */}
        <Link href="/dashboard/work">
          <Card className="border-border/40 shadow-sm hover:border-primary/40 transition-colors group h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight">
                  {metrics.tasksByStatus.complete}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Done tasks
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
