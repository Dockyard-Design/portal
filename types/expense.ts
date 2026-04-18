// Expense Types
export type RecurringFrequency = "monthly" | "quarterly" | "yearly";

export interface ExpenseCategory {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  color: string;
  icon: string;
  description: string | null;
  is_active: boolean;
}

export interface CreateExpenseCategoryInput {
  name: string;
  color: string;
  icon: string;
  description?: string;
}

export interface UpdateExpenseCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface Expense {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  category_id: string;
  expense_date: string;
  receipt_url: string | null;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  tax_deductible: boolean;
  vendor: string | null;
  author_id: string;
  category?: ExpenseCategory;
}

export interface CreateExpenseInput {
  title: string;
  description?: string;
  amount: number;
  category_id: string;
  expense_date: string;
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency;
  tax_deductible?: boolean;
  vendor?: string;
}

export interface UpdateExpenseInput {
  title?: string;
  description?: string | null;
  amount?: number;
  category_id?: string;
  expense_date?: string;
  receipt_url?: string | null;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency | null;
  tax_deductible?: boolean;
  vendor?: string | null;
}

// Expense Metrics
export interface ExpenseMetrics {
  totalExpenses: number;
  totalAmount: number;
  currentMonthAmount: number;
  previousMonthAmount: number;
  byCategory: {
    category_id: string;
    category_name: string;
    category_color: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    amount: number;
  }[];
  taxDeductibleAmount: number;
  recurringAmount: number;
}

// Default category icons
export const CATEGORY_ICONS = [
  "Building",
  "Zap",
  "Monitor",
  "Laptop",
  "Megaphone",
  "Plane",
  "Users",
  "User",
  "MoreHorizontal",
  "ShoppingCart",
  "Coffee",
  "Phone",
  "Car",
  "Home",
  "Package",
  "CreditCard",
  "Receipt",
  "FileText",
] as const;

export type CategoryIcon = typeof CATEGORY_ICONS[number];
