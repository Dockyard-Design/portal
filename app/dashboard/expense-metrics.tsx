"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Receipt, TrendingUp } from "lucide-react";
import type { ExpenseMetrics } from "@/types/expense";

interface ExpenseMetricsProps {
  metrics: ExpenseMetrics;
}

export function ExpenseMetrics({ metrics }: ExpenseMetricsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Receipt className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Expense Metrics</h2>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Receipt className="size-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.totalExpenses}</p>
            <p className="text-xs text-muted-foreground">
              £{metrics.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <TrendingUp className="size-4" />
              <span className="text-sm">This Month</span>
            </div>
            <p className="text-2xl font-semibold">
              £{metrics.currentMonthAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.previousMonthAmount > 0
                ? `${(((metrics.currentMonthAmount - metrics.previousMonthAmount) / metrics.previousMonthAmount) * 100).toFixed(0)}% vs last`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <TrendingUp className="size-4" />
              <span className="text-sm">Recurring</span>
            </div>
            <p className="text-2xl font-semibold">
              £{metrics.recurringAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">/month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
