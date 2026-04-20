import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabaseAdmin } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";
import type { Expense } from "@/types/expense";
import type { Invoice } from "@/types/agency";

export const dynamic = "force-dynamic";

type MonthlyReportRow = {
  month: string;
  earnings: number;
  expenses: number;
  profit: number;
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function monthKey(value: string): string {
  return value.slice(0, 7);
}

function buildReports(invoices: Invoice[], expenses: Expense[]): {
  monthly: MonthlyReportRow[];
  yearExpenses: number;
  yearEarnings: number;
  yearProfit: number;
  outstanding: number;
} {
  const rows = new Map<string, MonthlyReportRow>();

  for (const invoice of invoices) {
    const date = invoice.paid_at || invoice.issue_date || invoice.created_at;
    const key = monthKey(date);
    const row = rows.get(key) ?? { month: key, earnings: 0, expenses: 0, profit: 0 };
    row.earnings += Number(invoice.amount_paid || 0);
    rows.set(key, row);
  }

  for (const expense of expenses) {
    const key = monthKey(expense.expense_date);
    const row = rows.get(key) ?? { month: key, earnings: 0, expenses: 0, profit: 0 };
    row.expenses += Number(expense.amount || 0);
    rows.set(key, row);
  }

  const monthly = [...rows.values()]
    .map((row) => ({ ...row, profit: row.earnings - row.expenses }))
    .sort((a, b) => b.month.localeCompare(a.month));

  const yearExpenses = monthly.reduce((sum, row) => sum + row.expenses, 0);
  const yearEarnings = monthly.reduce((sum, row) => sum + row.earnings, 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due || 0), 0);

  return {
    monthly,
    yearExpenses,
    yearEarnings,
    yearProfit: yearEarnings - yearExpenses,
    outstanding,
  };
}

export default async function ReportsPage() {
  await requireAdmin();

  const [invoiceResult, expenseResult] = await Promise.all([
    supabaseAdmin.from("invoices").select("*").order("issue_date", { ascending: false }),
    supabaseAdmin.from("expenses").select("*, category:expense_categories(*)").order("expense_date", { ascending: false }),
  ]);

  if (invoiceResult.error) throw new Error("Failed to load invoices for reports");
  if (expenseResult.error) throw new Error("Failed to load expenses for reports");

  const report = buildReports(
    (invoiceResult.data || []) as Invoice[],
    (expenseResult.data || []) as Expense[]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monthly and yearly view of earnings, expenses, profit, and outstanding balances.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Year Earnings</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{currency.format(report.yearEarnings)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Year Expenses</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{currency.format(report.yearExpenses)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Year Profit</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{currency.format(report.yearProfit)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm text-muted-foreground">Outstanding</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{currency.format(report.outstanding)}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.monthly.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right">{currency.format(row.earnings)}</TableCell>
                  <TableCell className="text-right">{currency.format(row.expenses)}</TableCell>
                  <TableCell className="text-right font-medium">{currency.format(row.profit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
