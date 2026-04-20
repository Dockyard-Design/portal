"use server";

import { supabaseAdmin } from "@/lib/api-keys";
import { requireCustomerAccess } from "@/lib/authz";
import type { CustomerDashboardData } from "@/types/customer-dashboard";
import type { KanbanBoard, Task, TaskStatus } from "@/types/kanban";

export async function getMyCustomerDashboard(): Promise<CustomerDashboardData> {
  const { customerId } = await requireCustomerAccess();

  const [
    customerResult,
    boardsResult,
    quotesResult,
    invoicesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("customers")
      .select("name, company")
      .eq("id", customerId)
      .single(),
    supabaseAdmin.from("kanban_boards").select("*").eq("customer_id", customerId),
    supabaseAdmin.from("quotes").select("status, total").eq("customer_id", customerId),
    supabaseAdmin.from("invoices").select("status, total, amount_paid").eq("customer_id", customerId),
  ]);

  if (customerResult.error || !customerResult.data) {
    throw new Error("Customer profile not found");
  }

  const boards = (boardsResult.data || []) as KanbanBoard[];
  const boardIds = boards.map((board) => board.id);
  const tasksResult = boardIds.length > 0
    ? await supabaseAdmin.from("kanban_tasks").select("*").in("board_id", boardIds)
    : { data: [] as Task[], error: null };

  const tasks = (tasksResult.data || []) as Task[];
  const quotes = quotesResult.data || [];
  const invoices = invoicesResult.data || [];
  const statuses: TaskStatus[] = ["backlog", "todo", "in_progress", "complete"];

  return {
    customerName: customerResult.data.name,
    customerCompany: customerResult.data.company,
    stats: {
      totalQuotes: quotes.length,
      quotesAccepted: quotes.filter((quote) => quote.status === "accepted").length,
      quotesPending: quotes.filter((quote) => quote.status === "draft" || quote.status === "sent").length,
      totalInvoices: invoices.length,
      invoicesPaid: invoices.filter((invoice) => invoice.status === "paid").length,
      invoicesOverdue: invoices.filter((invoice) => invoice.status === "overdue").length,
      totalRevenue: invoices.reduce((sum, invoice) => sum + (invoice.amount_paid || 0), 0),
      outstandingBalance: invoices.reduce((sum, invoice) => {
        if (invoice.status !== "paid" && invoice.status !== "cancelled") {
          return sum + (invoice.total - (invoice.amount_paid || 0));
        }
        return sum;
      }, 0),
    },
    boards: boards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      is_default: board.is_default,
      tasks: statuses.reduce(
        (groupedTasks, status) => ({
          ...groupedTasks,
          [status]: tasks
            .filter((task) => task.board_id === board.id && task.status === status)
            .sort((a, b) => a.position - b.position),
        }),
        {
          backlog: [],
          todo: [],
          in_progress: [],
          complete: [],
        } as Record<TaskStatus, Task[]>
      ),
    })),
  };
}
