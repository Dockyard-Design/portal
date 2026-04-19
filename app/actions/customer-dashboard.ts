"use server";

import { supabaseAdmin } from "@/lib/api-keys";
import { requireCustomerAccess } from "@/lib/authz";
import type { CustomerDashboardData } from "@/types/customer-dashboard";
import type { Invoice, Quote } from "@/types/agency";
import type { KanbanBoard, Task } from "@/types/kanban";

export async function getMyCustomerDashboard(): Promise<CustomerDashboardData> {
  const { customerId } = await requireCustomerAccess();

  const [
    customerResult,
    quotesResult,
    invoicesResult,
    boardsResult,
  ] = await Promise.all([
    supabaseAdmin.from("customers").select("name").eq("id", customerId).single(),
    supabaseAdmin.from("quotes").select("*").eq("customer_id", customerId),
    supabaseAdmin.from("invoices").select("*").eq("customer_id", customerId),
    supabaseAdmin.from("kanban_boards").select("*").eq("customer_id", customerId),
  ]);

  if (customerResult.error || !customerResult.data) {
    throw new Error("Customer profile not found");
  }

  const boards = (boardsResult.data || []) as KanbanBoard[];
  const boardIds = boards.map((board) => board.id);
  const tasksResult = boardIds.length > 0
    ? await supabaseAdmin.from("kanban_tasks").select("*").in("board_id", boardIds)
    : { data: [] as Task[], error: null };

  const quotes = (quotesResult.data || []) as Quote[];
  const invoices = (invoicesResult.data || []) as Invoice[];
  const tasks = (tasksResult.data || []) as Task[];
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    customerName: customerResult.data.name,
    quoteCount: quotes.length,
    quoteAcceptedCount: quotes.filter((quote) => quote.status === "accepted").length,
    quotePendingCount: quotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length,
    invoiceCount: invoices.length,
    invoicePaidCount: invoices.filter((invoice) => invoice.status === "paid").length,
    invoiceOverdueCount: invoices.filter((invoice) => invoice.status === "overdue").length,
    outstandingBalance: invoices.reduce((total, invoice) => total + (invoice.balance_due || 0), 0),
    urgentTaskCount: tasks.filter((task) => task.priority === "urgent").length,
    overdueTaskCount: tasks.filter((task) => task.due_date && new Date(task.due_date) < now && task.status !== "complete").length,
    upcomingTaskCount: tasks.filter((task) => {
      if (!task.due_date || task.status === "complete") return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= now && dueDate <= sevenDaysFromNow;
    }).length,
  };
}
