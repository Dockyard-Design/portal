"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin as supabase } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";
import type {
  Expense,
  ExpenseCategory,
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from "@/types/expense";

const KNOWN_ERRORS: Record<string, string> = {
  "23505": "A record with this information already exists.",
  "23503": "Category not found.",
  "23514": "Invalid data. Please check your inputs.",
};

function sanitizeError(error: { code?: string; message: string }): string {
  if (error.code && KNOWN_ERRORS[error.code]) {
    return KNOWN_ERRORS[error.code];
  }
  return error.message || "Something went wrong. Please try again.";
}

// Expense Categories
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  await requireAdmin();

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw new Error(sanitizeError(error));
  return (data as ExpenseCategory[]) || [];
}

export async function getAllExpenseCategories(): Promise<ExpenseCategory[]> {
  await requireAdmin();

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name");

  if (error) throw new Error(sanitizeError(error));
  return (data as ExpenseCategory[]) || [];
}

export async function getExpenseCategory(id: string): Promise<ExpenseCategory | null> {
  await requireAdmin();

  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ExpenseCategory;
}

export async function createExpenseCategory(
  input: CreateExpenseCategoryInput
): Promise<ExpenseCategory> {
  await requireAdmin();

  const { data, error } = await supabase
    .from("expense_categories")
    .insert({
      name: input.name,
      color: input.color,
      icon: input.icon,
      description: input.description || null,
    })
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/expenses");
  return data as ExpenseCategory;
}

export async function updateExpenseCategory(
  id: string,
  input: UpdateExpenseCategoryInput
): Promise<ExpenseCategory> {
  await requireAdmin();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.is_active !== undefined) updateData.is_active = input.is_active;

  const { data, error } = await supabase
    .from("expense_categories")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/expenses");
  return data as ExpenseCategory;
}

// Expenses
export async function getExpenses(filters?: {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  taxDeductible?: boolean;
}): Promise<Expense[]> {
  await requireAdmin();

  let query = supabase
    .from("expenses")
    .select("*, category:expense_categories(*)")
    .order("expense_date", { ascending: false });

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters?.startDate) {
    query = query.gte("expense_date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("expense_date", filters.endDate);
  }
  if (filters?.taxDeductible) {
    query = query.eq("tax_deductible", true);
  }

  const { data, error } = await query;

  if (error) throw new Error(sanitizeError(error));
  return (data as Expense[]) || [];
}

export async function getExpense(id: string): Promise<Expense | null> {
  await requireAdmin();

  const { data, error } = await supabase
    .from("expenses")
    .select("*, category:expense_categories(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Expense;
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<Expense> {
  const userId = await requireAdmin();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      title: input.title,
      description: input.description || null,
      amount: input.amount,
      category_id: input.category_id,
      expense_date: input.expense_date,
      receipt_url: input.receipt_url || null,
      is_recurring: input.is_recurring || false,
      recurring_frequency: input.recurring_frequency || null,
      tax_deductible: input.tax_deductible || false,
      vendor: input.vendor || null,
      author_id: userId,
    })
    .select("*, category:expense_categories(*)")
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return data as Expense;
}

export async function updateExpense(
  id: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  await requireAdmin();

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amount !== undefined) updateData.amount = input.amount;
  if (input.category_id !== undefined) updateData.category_id = input.category_id;
  if (input.expense_date !== undefined) updateData.expense_date = input.expense_date;
  if (input.receipt_url !== undefined) updateData.receipt_url = input.receipt_url;
  if (input.is_recurring !== undefined) updateData.is_recurring = input.is_recurring;
  if (input.recurring_frequency !== undefined) updateData.recurring_frequency = input.recurring_frequency;
  if (input.tax_deductible !== undefined) updateData.tax_deductible = input.tax_deductible;
  if (input.vendor !== undefined) updateData.vendor = input.vendor;

  const { data, error } = await supabase
    .from("expenses")
    .update(updateData)
    .eq("id", id)
    .select("*, category:expense_categories(*)")
    .single();

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  await requireAdmin();

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard");
}
