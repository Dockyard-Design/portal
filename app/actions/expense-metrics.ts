"use server";

import { supabaseAdmin as supabase } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";
import type { ExpenseMetrics } from "@/types/expense";

export async function getExpenseMetrics(): Promise<ExpenseMetrics> {
  await requireAdmin();

  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // Get all expenses with categories
  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("*, category:expense_categories(*)")
    .order("expense_date", { ascending: false });

  if (expensesError) throw new Error(expensesError.message);

  const expenseList = expenses || [];

  // Calculate current month amount
  const currentMonthAmount = expenseList
    .filter((e) => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate >= currentMonthStart && expenseDate <= currentMonthEnd;
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Calculate previous month amount
  const previousMonthAmount = expenseList
    .filter((e) => {
      const expenseDate = new Date(e.expense_date);
      return expenseDate >= previousMonthStart && expenseDate <= previousMonthEnd;
    })
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Calculate by category
  const categoryTotals = new Map<
    string,
    { category_name: string; category_color: string; amount: number }
  >();

  expenseList.forEach((e) => {
    if (e.category) {
      const existing = categoryTotals.get(e.category_id);
      if (existing) {
        existing.amount += e.amount || 0;
      } else {
        categoryTotals.set(e.category_id, {
          category_name: e.category.name,
          category_color: e.category.color,
          amount: e.amount || 0,
        });
      }
    }
  });

  const totalAmount = expenseList.reduce((sum, e) => sum + (e.amount || 0), 0);
  const byCategory = Array.from(categoryTotals.entries()).map(
    ([category_id, data]) => ({
      category_id,
      category_name: data.category_name,
      category_color: data.category_color,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    })
  );

  // Sort by amount desc
  byCategory.sort((a, b) => b.amount - a.amount);

  // Calculate monthly trend (last 6 months)
  const monthlyTrend: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = month.toLocaleString("default", { month: "short" });
    const monthAmount = expenseList
      .filter((e) => {
        const expenseDate = new Date(e.expense_date);
        return (
          expenseDate.getMonth() === month.getMonth() &&
          expenseDate.getFullYear() === month.getFullYear()
        );
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    monthlyTrend.push({ month: monthKey, amount: monthAmount });
  }

  // Tax deductible amount
  const taxDeductibleAmount = expenseList
    .filter((e) => e.tax_deductible)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Recurring amount (monthly equivalent)
  const recurringAmount = expenseList
    .filter((e) => e.is_recurring && e.recurring_frequency === "monthly")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    totalExpenses: expenseList.length,
    totalAmount,
    currentMonthAmount,
    previousMonthAmount,
    byCategory,
    monthlyTrend,
    taxDeductibleAmount,
    recurringAmount,
  };
}
