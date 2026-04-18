// Quote Types
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

export interface Quote {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  title: string;
  description: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: QuoteStatus;
  valid_until: string | null;
  accepted_at: string | null;
  sent_at: string | null;
  notes: string | null;
  terms: string | null;
  author_id: string;
  items?: QuoteItem[];
}

export interface CreateQuoteInput {
  customer_id: string;
  title: string;
  description?: string;
  tax_rate?: number;
  valid_until?: string;
  notes?: string;
  terms?: string;
  items: CreateQuoteItemInput[];
}

export interface UpdateQuoteInput {
  title?: string;
  description?: string | null;
  tax_rate?: number;
  valid_until?: string | null;
  notes?: string | null;
  terms?: string | null;
  status?: QuoteStatus;
  items?: CreateQuoteItemInput[];
}

export interface CreateQuoteItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

// Invoice Types
export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  quote_id: string | null;
  invoice_number: string;
  title: string;
  description: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  sent_at: string | null;
  notes: string | null;
  terms: string | null;
  payment_instructions: string | null;
  author_id: string;
  items?: InvoiceItem[];
}

export interface CreateInvoiceInput {
  customer_id: string;
  quote_id?: string;
  title: string;
  description?: string;
  tax_rate?: number;
  due_date?: string;
  notes?: string;
  terms?: string;
  payment_instructions?: string;
  items: CreateInvoiceItemInput[];
}

export interface UpdateInvoiceInput {
  title?: string;
  description?: string | null;
  tax_rate?: number;
  due_date?: string | null;
  notes?: string | null;
  terms?: string | null;
  payment_instructions?: string | null;
  status?: InvoiceStatus;
  amount_paid?: number;
  items?: CreateInvoiceItemInput[];
}

export interface CreateInvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

// Customer with related data
export interface CustomerWithRelations {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  quotes: Quote[];
  invoices: Invoice[];
}

// Summary stats for customer
export interface CustomerStats {
  totalQuotes: number;
  quotesAccepted: number;
  quotesPending: number;
  totalInvoices: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  totalRevenue: number;
  outstandingBalance: number;
}
