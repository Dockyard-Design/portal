import { getExpenses, getExpenseCategories } from "@/app/actions/expenses";
import { getExpenseMetrics } from "@/app/actions/expense-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, TrendingUp, PoundSterling, Calendar } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function ExpensesPage() {
  const [expenses, categories, metrics] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getExpenseMetrics(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Receipt className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Expense Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage business expenses
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/expenses/new">
            <Plus className="size-4 mr-1" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Receipt className="size-4" />
              <span className="text-sm">Total Expenses</span>
            </div>
            <p className="text-2xl font-semibold">{metrics.totalExpenses}</p>
            <p className="text-xs text-muted-foreground">
              £{metrics.totalAmount.toLocaleString()} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Calendar className="size-4" />
              <span className="text-sm">This Month</span>
            </div>
            <p className="text-2xl font-semibold">
              £{metrics.currentMonthAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {metrics.previousMonthAmount > 0
                ? `${((metrics.currentMonthAmount - metrics.previousMonthAmount) / metrics.previousMonthAmount * 100).toFixed(0)}% vs last month`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <TrendingUp className="size-4" />
              <span className="text-sm">Tax Deductible</span>
            </div>
            <p className="text-2xl font-semibold">
              £{metrics.taxDeductibleAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Claimable expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <PoundSterling className="size-4" />
              <span className="text-sm">Recurring</span>
            </div>
            <p className="text-2xl font-semibold">
              £{metrics.recurringAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">/month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses yet. Add your first expense to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-lg ${expense.category?.color || "bg-slate-500"} flex items-center justify-center`}
                    >
                      <span className="text-white text-sm">
                        {expense.category?.name.charAt(0) || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category?.name} • {expense.vendor || "No vendor"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      £{expense.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </p>
                    {expense.tax_deductible && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Tax deductible
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
