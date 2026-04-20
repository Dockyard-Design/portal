"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin as supabase } from "@/lib/api-keys";
import { getCurrentUserAccess, requireAdmin } from "@/lib/authz";
import { sendDocumentEmail, sendFormSubmissionEmail } from "@/lib/email";
import type {
  Quote,
  Invoice,
  CreateQuoteInput,
  UpdateQuoteInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CustomerStats,
} from "@/types/agency";
import type { UserRole } from "@/types/auth";

const KNOWN_ERRORS: Record<string, string> = {
  "23505": "A record with this identifier already exists.",
  "23503": "Related record not found.",
};

const DEFAULT_QUOTE_TERMS =
  "This quote is valid for 14 days from creation. Payment is due within 30 days of acceptance.";

function sanitizeError(error: { code?: string; message: string }): string {
  if (error.code && KNOWN_ERRORS[error.code]) {
    return KNOWN_ERRORS[error.code];
  }
  return error.message || "Something went wrong. Please try again.";
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

function isQuotePastValidityDate(quote: Quote): boolean {
  if (!quote.valid_until) return false;
  const validUntil = new Date(quote.valid_until);
  validUntil.setHours(23, 59, 59, 999);
  return validUntil.getTime() < Date.now();
}

function getDefaultQuoteExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  return expiresAt.toISOString().slice(0, 10);
}

function getQuoteTerms(inputTerms?: string): string {
  const terms = inputTerms?.trim();
  if (!terms) return DEFAULT_QUOTE_TERMS;

  if (terms.toLowerCase().includes("14 days")) {
    return terms;
  }

  return `${DEFAULT_QUOTE_TERMS}\n\n${terms}`;
}

// Quotes
export async function getQuotes(customerId?: string): Promise<Quote[]> {
  const access = await getCurrentUserAccess();

  let query = supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .order("created_at", { ascending: false });

  if (access.role === "customer") {
    query = query
      .eq("customer_id", access.customerId)
      .neq("status", "draft");
  } else if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;

  if (error) throw new Error(sanitizeError(error));
  return (data as Quote[]) || [];
}

export async function getQuote(id: string): Promise<Quote | null> {
  const access = await getCurrentUserAccess();

  let query = supabase
    .from("quotes")
    .select("*, items:quote_items(*)")
    .eq("id", id);

  if (access.role === "customer") {
    query = query
      .eq("customer_id", access.customerId)
      .neq("status", "draft");
  }

  const { data, error } = await query.single();

  if (error) return null;
  return data as Quote;
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const userId = await requireAdmin();

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
      valid_until: input.valid_until || getDefaultQuoteExpiryDate(),
      notes: input.notes || null,
      terms: getQuoteTerms(input.terms),
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

  await sendFormSubmissionEmail({
    formName: "Quote",
    submittedAt: new Date().toISOString(),
    details: {
      action: "created",
      title: quote.title,
      customer_id: input.customer_id,
      total,
      status: quote.status,
    },
  }).catch((emailError) => {
    console.error("[createQuote] Email notification failed:", emailError);
  });

  revalidatePath(`/dashboard/customers/${input.customer_id}`);
  return quote as Quote;
}

export async function updateQuote(
  id: string,
  input: UpdateQuoteInput
): Promise<Quote> {
  await requireAdmin();

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
export async function getInvoices(customerId?: string): Promise<Invoice[]> {
  const access = await getCurrentUserAccess();

  let query = supabase
    .from("invoices")
    .select("*, items:invoice_items(*)")
    .order("created_at", { ascending: false });

  if (access.role === "customer") {
    query = query
      .eq("customer_id", access.customerId)
      .neq("status", "draft");
  } else if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query;

  if (error) throw new Error(sanitizeError(error));
  return (data as Invoice[]) || [];
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const access = await getCurrentUserAccess();

  let query = supabase
    .from("invoices")
    .select("*, items:invoice_items(*)")
    .eq("id", id);

  if (access.role === "customer") {
    query = query
      .eq("customer_id", access.customerId)
      .neq("status", "draft");
  }

  const { data, error } = await query.single();

  if (error) return null;
  return data as Invoice;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const userId = await requireAdmin();

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

  await sendFormSubmissionEmail({
    formName: "Invoice",
    submittedAt: new Date().toISOString(),
    details: {
      action: "created",
      title: invoice.title,
      invoice_number: invoice.invoice_number,
      customer_id: input.customer_id,
      total,
      status: invoice.status,
    },
  }).catch((emailError) => {
    console.error("[createInvoice] Email notification failed:", emailError);
  });

  revalidatePath(`/dashboard/customers/${input.customer_id}`);
  return invoice as Invoice;
}

export async function updateInvoice(
  id: string,
  input: UpdateInvoiceInput
): Promise<Invoice> {
  await requireAdmin();

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

async function assertCustomerDocumentAccess(
  table: "quotes" | "invoices",
  id: string,
  role: UserRole,
  customerId: string | null
): Promise<void> {
  if (role === "admin") return;

  const { data, error } = await supabase
    .from(table)
    .select("customer_id")
    .eq("id", id)
    .single();

  if (error || data?.customer_id !== customerId) {
    throw new Error("Forbidden");
  }
}

async function createInvoiceFromAcceptedQuote(
  quote: Quote,
  authorId: string
): Promise<Invoice> {
  const { data: existingInvoice, error: existingError } = await supabase
    .from("invoices")
    .select("*, items:invoice_items(*)")
    .eq("quote_id", quote.id)
    .maybeSingle();

  if (existingError) throw new Error(sanitizeError(existingError));
  if (existingInvoice) return existingInvoice as Invoice;

  const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      customer_id: quote.customer_id,
      quote_id: quote.id,
      invoice_number: invoiceNumber || `INV-${Date.now()}`,
      title: quote.title,
      description: quote.description,
      subtotal: quote.subtotal,
      tax_rate: quote.tax_rate,
      tax_amount: quote.tax_amount,
      total: quote.total,
      amount_paid: 0,
      balance_due: quote.total,
      currency: quote.currency,
      status: "sent",
      sent_at: new Date().toISOString(),
      notes: quote.notes,
      terms: quote.terms,
      payment_instructions: "Payment can be completed from the customer invoice screen.",
      author_id: authorId,
    })
    .select()
    .single();

  if (invoiceError) throw new Error(sanitizeError(invoiceError));

  const itemsToInsert = (quote.items || []).map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: item.total,
    sort_order: item.sort_order ?? index,
  }));

  if (itemsToInsert.length > 0) {
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemsToInsert);

    if (itemsError) throw new Error(sanitizeError(itemsError));
  }

  return invoice as Invoice;
}

export async function acceptQuote(id: string): Promise<Invoice> {
  const access = await getCurrentUserAccess();
  await assertCustomerDocumentAccess("quotes", id, access.role, access.customerId);

  const quote = await getQuote(id);
  if (!quote) throw new Error("Quote not found");
  if (quote.status === "rejected" || quote.status === "expired" || isQuotePastValidityDate(quote)) {
    throw new Error("This quote can no longer be accepted");
  }

  if (quote.status !== "accepted") {
    const { error } = await supabase
      .from("quotes")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(sanitizeError(error));
  }

  const invoice = await createInvoiceFromAcceptedQuote(
    { ...quote, status: "accepted", accepted_at: quote.accepted_at ?? new Date().toISOString() },
    access.userId
  );

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/customers/${quote.customer_id}`);
  return invoice;
}

export async function rejectQuote(id: string): Promise<void> {
  const access = await getCurrentUserAccess();
  await assertCustomerDocumentAccess("quotes", id, access.role, access.customerId);

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("customer_id, status, valid_until")
    .eq("id", id)
    .single();

  if (quoteError || !quote) throw new Error("Quote not found");
  if (quote.status === "accepted" || quote.status === "expired" || isQuotePastValidityDate(quote as Quote)) {
    throw new Error("This quote can no longer be rejected");
  }

  const { error } = await supabase
    .from("quotes")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));

  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/customers/${quote.customer_id}`);
}

export async function payInvoice(id: string): Promise<void> {
  const access = await getCurrentUserAccess();
  await assertCustomerDocumentAccess("invoices", id, access.role, access.customerId);

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("customer_id, total")
    .eq("id", id)
    .single();

  if (invoiceError || !invoice) throw new Error("Invoice not found");

  const { error } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      amount_paid: invoice.total,
      balance_due: 0,
      paid_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/customers/${invoice.customer_id}`);
}

// Customer Stats
export async function getCustomerStats(customerId: string): Promise<CustomerStats> {
  await requireAdmin();

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

// Delete Quote
export async function deleteQuote(id: string): Promise<void> {
  await requireAdmin();

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/quotes");
}

// Delete Invoice
export async function deleteInvoice(id: string): Promise<void> {
  await requireAdmin();

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id);

  if (error) throw new Error(sanitizeError(error));
  revalidatePath("/dashboard/invoices");
}

export async function sendQuoteToCustomer(id: string): Promise<void> {
  await requireAdmin();

  const quote = await getQuote(id);
  if (!quote) throw new Error("Quote not found");

  const { data: customer, error } = await supabase
    .from("customers")
    .select("name, email")
    .eq("id", quote.customer_id)
    .single();

  if (error || !customer?.email) {
    throw new Error("Customer email is required before sending a quote");
  }

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4567";
  await sendDocumentEmail({
    documentType: "quote",
    recipientEmail: customer.email,
    recipientName: customer.name,
    title: quote.title,
    total: quote.total,
    currency: quote.currency,
    pdfUrl: `${baseUrl}/api/pdf/quote/${quote.id}`,
  });

  await updateQuote(id, { status: "sent" });
  revalidatePath("/dashboard/quotes");
}

export async function sendInvoiceToCustomer(id: string): Promise<void> {
  await requireAdmin();

  const invoice = await getInvoice(id);
  if (!invoice) throw new Error("Invoice not found");

  const { data: customer, error } = await supabase
    .from("customers")
    .select("name, email")
    .eq("id", invoice.customer_id)
    .single();

  if (error || !customer?.email) {
    throw new Error("Customer email is required before sending an invoice");
  }

  const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4567";
  await sendDocumentEmail({
    documentType: "invoice",
    recipientEmail: customer.email,
    recipientName: customer.name,
    title: invoice.title,
    total: invoice.total,
    currency: invoice.currency,
    pdfUrl: `${baseUrl}/api/pdf/invoice/${invoice.id}`,
  });

  await updateInvoice(id, { status: "sent" });
  revalidatePath("/dashboard/invoices");
}
