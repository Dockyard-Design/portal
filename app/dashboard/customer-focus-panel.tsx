"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCustomerStats } from "@/app/actions/agency";
import { getBoards, getTasksByStatus } from "@/app/actions/kanban";
import { useKanbanStore } from "@/lib/store";
import type { CustomerStats } from "@/types/agency";
import type { Customer, KanbanBoard, Task } from "@/types/kanban";

export function CustomerFocusPanel({ customers }: { customers: Customer[] }) {
  const { selectedCustomerId } = useKanbanStore();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loadedCustomerId, setLoadedCustomerId] = useState<string | null>(null);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const customer = customers.find((item) => item.id === selectedCustomerId);

  useEffect(() => {
    let cancelled = false;

    if (!selectedCustomerId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadCustomerFocus(customerId: string) {
      const [nextStats, nextBoards] = await Promise.all([
        getCustomerStats(customerId),
        getBoards(customerId),
      ]);
      const taskGroups = await Promise.all(
        nextBoards.map((board) => getTasksByStatus(board.id))
      );
      const nextTasks = taskGroups.flatMap((group) => [
        ...group.backlog,
        ...group.todo,
        ...group.in_progress,
        ...group.complete,
      ]);

      if (!cancelled) {
        setStats(nextStats);
        setLoadedCustomerId(customerId);
        setBoards(nextBoards);
        setTasks(nextTasks);
      }
    }

    loadCustomerFocus(selectedCustomerId).catch(() => {
      if (!cancelled) {
        setStats(null);
        setLoadedCustomerId(null);
        setBoards([]);
        setTasks([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId]);

  const taskMetrics = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      urgent: tasks.filter((task) => task.priority === "urgent").length,
      overdue: tasks.filter((task) => task.due_date && new Date(task.due_date) < now && task.status !== "complete").length,
      dueSoon: tasks.filter((task) => {
        if (!task.due_date || task.status === "complete") return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= now && dueDate <= nextWeek;
      }).length,
    };
  }, [tasks]);

  if (!selectedCustomerId || loadedCustomerId !== selectedCustomerId || !customer || !stats) return null;

  const money = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  });

  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
            <Badge variant="outline">Focused customer</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.company || customer.email || "Customer workspace"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{boards.length} boards · {tasks.length} tasks</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <FocusMetric title="Quotes" value={stats.totalQuotes} detail={`${stats.quotesAccepted} accepted, ${stats.quotesPending} pending`} />
        <FocusMetric title="Invoices" value={stats.totalInvoices} detail={`${stats.invoicesPaid} paid, ${stats.invoicesOverdue} overdue`} />
        <FocusMetric title="Outstanding" value={money.format(stats.outstandingBalance)} detail="Balance due" />
        <FocusMetric title="Kanban" value={taskMetrics.urgent} detail={`${taskMetrics.overdue} overdue, ${taskMetrics.dueSoon} due soon`} />
      </div>
    </section>
  );
}

function FocusMetric({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <Card className="border-border/40 bg-background/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
