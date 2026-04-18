"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Receipt, TrendingUp, PoundSterling } from "lucide-react";
import type { ExpenseMetrics } from "@/types/expense";

interface ExpenseMetricsProps {
  metrics: ExpenseMetrics;
}

export function ExpenseMetrics({ metrics }: ExpenseMetricsProps) {
  const chartConfig = {
    amount: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
  };

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
                ? `${((metrics.currentMonthAmount - metrics.previousMonthAmount) / metrics.previousMonthAmount * 100).toFixed(0)}% vs last`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <PoundSterling className="size-4" />
              <span className="text-sm">Tax Deductible</span>
            </div>
            <p className="text-2xl font-semibold">
              £{metrics.taxDeductibleAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Claimable</p>
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

      {/* Category Breakdown */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.byCategory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No expenses yet</p>
            ) : (
              <div className="space-y-3">
                {metrics.byCategory.map((cat) => (
                  <div key={cat.category_id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{cat.category_name}</span>
                      <span className="font-medium">
                        £{cat.amount.toLocaleString()} ({cat.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cat.category_color} transition-all`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-48">
              <BarChart data={metrics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
