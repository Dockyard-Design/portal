"use server";

import { supabaseAdmin as supabase } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";

export interface AgencyMetrics {
  quotes: {
    total: number;
    draft: number;
    sent: number;
    accepted: number;
    rejected: number;
    expired: number;
    totalValue: number;
    acceptedValue: number;
  };
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    partial: number;
    overdue: number;
    cancelled: number;
    totalValue: number;
    paidValue: number;
    outstandingValue: number;
    overdueValue: number;
  };
  monthlyData: {
    month: string;
    quotes: number;
    quoteValue: number;
    invoices: number;
    invoiceValue: number;
  }[];
}

export async function getAgencyMetrics(): Promise<AgencyMetrics> {
  await requireAdmin();

  // Get all quotes
  const { data: quotes, error: quotesError } = await supabase
    .from("quotes")
    .select("status, total, created_at");

  if (quotesError) throw new Error(quotesError.message);

  // Get all invoices
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("status, total, amount_paid, created_at");

  if (invoicesError) throw new Error(invoicesError.message);

  const quoteList = quotes || [];
  const invoiceList = invoices || [];

  // Calculate quote metrics
  const quoteMetrics = {
    total: quoteList.length,
    draft: quoteList.filter((q) => q.status === "draft").length,
    sent: quoteList.filter((q) => q.status === "sent").length,
    accepted: quoteList.filter((q) => q.status === "accepted").length,
    rejected: quoteList.filter((q) => q.status === "rejected").length,
    expired: quoteList.filter((q) => q.status === "expired").length,
    totalValue: quoteList.reduce((sum, q) => sum + (q.total || 0), 0),
    acceptedValue: quoteList
      .filter((q) => q.status === "accepted")
      .reduce((sum, q) => sum + (q.total || 0), 0),
  };

  // Calculate invoice metrics
  const invoiceMetrics = {
    total: invoiceList.length,
    draft: invoiceList.filter((i) => i.status === "draft").length,
    sent: invoiceList.filter((i) => i.status === "sent").length,
    paid: invoiceList.filter((i) => i.status === "paid").length,
    partial: invoiceList.filter((i) => i.status === "partial").length,
    overdue: invoiceList.filter((i) => i.status === "overdue").length,
    cancelled: invoiceList.filter((i) => i.status === "cancelled").length,
    totalValue: invoiceList.reduce((sum, i) => sum + (i.total || 0), 0),
    paidValue: invoiceList.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
    outstandingValue: invoiceList
      .filter((i) => i.status !== "paid" && i.status !== "cancelled")
      .reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0),
    overdueValue: invoiceList
      .filter((i) => i.status === "overdue")
      .reduce((sum, i) => sum + ((i.total || 0) - (i.amount_paid || 0)), 0),
  };

  // Generate last 6 months of data
  const monthlyData: AgencyMetrics["monthlyData"] = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStart = month.toISOString();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1).toISOString();
    const monthKey = month.toLocaleString("default", { month: "short" });

    const monthQuotes = quoteList.filter(
      (q) => q.created_at >= monthStart && q.created_at < monthEnd
    );
    const monthInvoices = invoiceList.filter(
      (i) => i.created_at >= monthStart && i.created_at < monthEnd
    );

    monthlyData.push({
      month: monthKey,
      quotes: monthQuotes.length,
      quoteValue: monthQuotes.reduce((sum, q) => sum + (q.total || 0), 0),
      invoices: monthInvoices.length,
      invoiceValue: monthInvoices.reduce((sum, i) => sum + (i.total || 0), 0),
    });
  }

  return {
    quotes: quoteMetrics,
    invoices: invoiceMetrics,
    monthlyData,
  };
}
