"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/api-keys";
import type {
  Quote,
  QuoteItem,
  Invoice,
  InvoiceItem,
  CreateQuoteInput,
  UpdateQuoteInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CustomerStats,
} from "@/types/agency";

const KNOWN_ERRORS: Record<string, string> = {
  "23505": "A record with this identifier already exists.",
  "23503": "Related record not found.",
};

function sanitizeError(error: { code?: string; message: string }): string {
  if (error.code && KNOWN_ERRORS[error.code]) {
    return KNOWN_ERRORS[error.code];
  }
  return error.message || "Something went wrong. Please try again.";
}

async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

// Calculate totals from items
function calculateTotals(
  items: Array<{ quantity: number; unit_price: number }>,
  taxRate: number
): { subtotal: number; tax_amount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const tax_amount = subtotal * (taxRate / 100);
  const total = subtotal + tax_amount;
  return { subtotal, tax_amount, total };
}

// Quotes
export async function getQuotes(customerId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(sanitizeError(error));
  return (data as Quote[]) || [];
}

export async function getQuote(id: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Quote;
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const userId = await requireAuth();

  const { subtotal, tax_amount, total } = calculateTotals(
    input.items,
    input.tax_rate || 0
  );

  // Create quote
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert({
      customer_id: input.customer_id,
      title: input.title,
      description: input.description || null,
      subtotal,
      tax_rate: input.tax_rate || 0,
      tax_amount,
      total,
      valid_until: input.valid_until || null,
      notes: input.notes || null,
      terms: input.terms || null,
      author_id: userId,
    })
    .select()
    .single();

  if (quoteError) throw new Error(sanitizeError(quoteError));

  // Create quote items
  const itemsToInsert = input.items.map((item, index) => ({
    quote_id: quote.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.quantity * item.unit_price,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase
    .from("quote_items")
    .insert(itemsToInsert);

  if (itemsError) throw new Error(sanitizeError(itemsError));

  revalidatePath(`/dashboard/customers/${input.customer_id}`);
  return quote as Quote;
}

export async function updateQuote(
  id: string,
  input: UpdateQuoteInput
): Promise<Quote> {
  await requireAuth();

  const updateData: Record<string, unknown> = {};
  
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.tax_rate !== undefined) updateData.tax_rate = input.tax_rate;
  if (input.valid_until !== undefined) updateData.valid_until = input.valid_until;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.terms !== undefined) updateData.terms = input.terms;
  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === "accepted") {
      updateData.accepted_at = new Date().toISOString();
    }
    if (input.status === "sent") {
      updateData.sent_at = new Date().toISOString();
    }
  }

  // Recalculate if items or tax_rate changed
  if (input.items !== undefined || input.tax_rate !== undefined) {
    const { data: existingItems } = await supabase
      .from("quote_items")
      .select("quantity, unit_price")
      .eq("quote_id", id);

    const items = input.items || existingItems || [];
    const taxRate = input.tax_rate !== undefined ? input.tax_rate : 0;
    
    const { subtotal, tax_amount, total } = calculateTotals(items, taxRate);
    updateData.subtotal = subtotal;
    updateData.tax_amount = tax_amount;
    updateData.total = total;
  }

  const { data, error } = await supabase
    .from("quotes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));

  // Update items if provided
  if (input.items !== undefined) {
    await supabase.from("quote_items").delete().eq("quote_id", id);

    const itemsToInsert = input.items.map((item, index) => ({
      quote_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      sort_order: index,
    }));

    await supabase.from("quote_items").insert(itemsToInsert);
  }

  revalidatePath(`/dashboard/customers/${data.customer_id}`);
  return data as Quote;
}

// Invoices
export async function getInvoices(customerId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, items:invoice_items(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(sanitizeError(error));
  return (data as Invoice[]) || [];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*, items:invoice_items(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Invoice;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const userId = await requireAuth();

  const { subtotal, tax_amount, total } = calculateTotals(
    input.items,
    input.tax_rate || 0
  );

  // Get next invoice number
  const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      customer_id: input.customer_id,
      quote_id: input.quote_id || null,
      invoice_number: invoiceNumber || `INV-${Date.now()}`,
      title: input.title,
      description: input.description || null,
      subtotal,
      tax_rate: input.tax_rate || 0,
      tax_amount,
      total,
      balance_due: total,
      due_date: input.due_date || null,
      notes: input.notes || null,
      terms: input.terms || null,
      payment_instructions: input.payment_instructions || null,
      author_id: userId,
    })
    .select()
    .single();

  if (invoiceError) throw new Error(sanitizeError(invoiceError));

  // Create invoice items
  const itemsToInsert = input.items.map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.quantity * item.unit_price,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(itemsToInsert);

  if (itemsError) throw new Error(sanitizeError(itemsError));

  revalidatePath(`/dashboard/customers/${input.customer_id}`);
  return invoice as Invoice;
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput
): Promise<Invoice> {
  await requireAuth();

  const updateData: Record<string, unknown> = {};
  
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.tax_rate !== undefined) updateData.tax_rate = input.tax_rate;
  if (input.due_date !== undefined) updateData.due_date = input.due_date;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.terms !== undefined) updateData.terms = input.terms;
  if (input.payment_instructions !== undefined) {
    updateData.payment_instructions = input.payment_instructions;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === "paid") {
      updateData.paid_at = new Date().toISOString();
    }
    if (input.status === "sent") {
      updateData.sent_at = new Date().toISOString();
    }
  }

  // Recalculate if items or tax_rate changed
  if (input.items !== undefined || input.tax_rate !== undefined) {
    const { data: existingItems } = await supabase
      .from("invoice_items")
      .select("quantity, unit_price")
      .eq("invoice_id", id);

    const items = input.items || existingItems || [];
    const taxRate = input.tax_rate !== undefined ? input.tax_rate : 0;
    
    const { subtotal, tax_amount, total } = calculateTotals(items, taxRate);
    updateData.subtotal = subtotal;
    updateData.tax_amount = tax_amount;
    updateData.total = total;
    
    const amountPaid = input.amount_paid !== undefined ? input.amount_paid : 0;
    updateData.balance_due = total - amountPaid;
  }

  if (input.amount_paid !== undefined) {
    const { data: current } = await supabase
      .from("invoices")
      .select("total")
      .eq("id", id)
      .single();
    
    const total = current?.total || 0;
    updateData.balance_due = total - input.amount_paid;
    updateData.amount_paid = input.amount_paid;
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(sanitizeError(error));

  // Update items if provided
  if (input.items !== undefined) {
    await supabase.from("invoice_items").delete().eq("invoice_id", id);

    const itemsToInsert = input.items.map((item, index) => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      sort_order: index,
    }));

    await supabase.from("invoice_items").insert(itemsToInsert);
  }

  revalidatePath(`/dashboard/customers/${data.customer_id}`);
  return data as Invoice;
}

// Customer Stats
export async function getCustomerStats(customerId: string): Promise<CustomerStats> {
  const { data: quotes, error: quotesError } = await supabase
    .from("quotes")
    .select("status, total")
    .eq("customer_id", customerId);

  if (quotesError) throw new Error(sanitizeError(quotesError));

  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("status, total, amount_paid")
    .eq("customer_id", customerId);

  if (invoicesError) throw new Error(sanitizeError(invoicesError));

  const quoteList = quotes || [];
  const invoiceList = invoices || [];

  return {
    totalQuotes: quoteList.length,
    quotesAccepted: quoteList.filter((q) => q.status === "accepted").length,
    quotesPending: quoteList.filter((q) => q.status === "draft" || q.status === "sent").length,
    totalInvoices: invoiceList.length,
    invoicesPaid: invoiceList.filter((i) => i.status === "paid").length,
    invoicesOverdue: invoiceList.filter((i) => i.status === "overdue").length,
    totalRevenue: invoiceList.reduce((sum, i) => sum + (i.amount_paid || 0), 0),
    outstandingBalance: invoiceList.reduce((sum, i) => {
      if (i.status !== "paid" && i.status !== "cancelled") {
        return sum + (i.total - (i.amount_paid || 0));
      }
      return sum;
    }, 0),
  };
}
