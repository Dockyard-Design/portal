import { getExpenseMetrics } from "@/app/actions/expense-metrics";
import { ExpenseMetrics } from "../expense-metrics";

export const dynamic = "force-dynamic";

export default async function ExpenseMetricsPage() {
  const metrics = await getExpenseMetrics();

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Expense Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Expense volume, monthly trend, recurring spend, and tax-deductible totals.
        </p>
      </div>
      <ExpenseMetrics metrics={metrics} />
    </div>
  );
}
