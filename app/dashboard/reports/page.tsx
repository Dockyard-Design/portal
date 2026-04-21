import { supabaseAdmin } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";
import type { Expense } from "@/types/expense";
import type { Invoice } from "@/types/agency";
import { ReportsClient } from "./reports-client";

export const dynamic = "force-dynamic";

type MonthlyReportRow = {
  month: string;
  earnings: number;
  expenses: number;
  profit: number;
};

const REPORT_LABELS = ["Year Earnings", "Year Expenses", "Outstanding"] as const;

function monthKey(value: string): string {
  return value.slice(0, 7);
}

function getReportDate(invoice: Invoice): string {
  return invoice.paid_at || invoice.issue_date || invoice.created_at;
}

function buildReports(invoices: Invoice[], expenses: Expense[]): {
  monthly: MonthlyReportRow[];
  availableMonths: string[];
  availableYears: string[];
} {
  const rows = new Map<string, MonthlyReportRow>();

  for (const invoice of invoices) {
    const key = monthKey(getReportDate(invoice));
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

  const availableMonths = monthly.map((row) => row.month);
  const availableYears = [...new Set(monthly.map((row) => row.month.slice(0, 4)))].sort((a, b) =>
    b.localeCompare(a)
  );

  return {
    monthly,
    availableMonths,
    availableYears,
  };
}

export default async function ReportsPage() {
  await requireAdmin();

  const [invoiceResult, expenseResult] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select("*, items:invoice_items(*)")
      .order("issue_date", { ascending: false }),
    supabaseAdmin
      .from("expenses")
      .select("*, category:expense_categories(*)")
      .order("expense_date", { ascending: false }),
  ]);

  if (invoiceResult.error) throw new Error("Failed to load invoices for reports");
  if (expenseResult.error) throw new Error("Failed to load expenses for reports");

  void REPORT_LABELS;

  const invoices = (invoiceResult.data || []) as Invoice[];
  const expenses = (expenseResult.data || []) as Expense[];
  const report = buildReports(
    invoices,
    expenses
  );

  return (
    <ReportsClient
      invoices={invoices}
      expenses={expenses}
      monthlyRows={report.monthly}
      availableMonths={report.availableMonths}
      availableYears={report.availableYears}
    />
  );
}
