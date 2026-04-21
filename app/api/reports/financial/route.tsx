import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/api-keys";
import { requireAdmin } from "@/lib/authz";
import type { Expense } from "@/types/expense";
import type { Invoice, InvoiceItem } from "@/types/agency";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

type CustomerSummary = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
};

type ReportInvoice = Invoice & {
  items?: InvoiceItem[];
  customer?: CustomerSummary | CustomerSummary[] | null;
};

type ReportPeriod = "month" | "year";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#111827" },
  eyebrow: { color: "#2563EB", fontSize: 8, fontWeight: "bold", textTransform: "uppercase", marginBottom: 5 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 9, color: "#4B5563", marginBottom: 14 },
  pageHeader: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#D1D5DB", paddingBottom: 10 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 7, color: "#111827" },
  sectionIntro: { fontSize: 8, color: "#4B5563", marginBottom: 10, lineHeight: 1.45 },
  summary: { flexDirection: "row", marginBottom: 8 },
  metric: { flex: 1, borderWidth: 1, borderColor: "#D1D5DB", padding: 8, marginRight: 6 },
  metricLast: { marginRight: 0 },
  metricLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase", marginBottom: 3 },
  metricValue: { fontSize: 12, fontWeight: "bold" },
  note: { fontSize: 7, color: "#6B7280", lineHeight: 1.45 },
  table: { borderWidth: 1, borderColor: "#D1D5DB" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", minHeight: 20 },
  head: { backgroundColor: "#EEF2F7", fontWeight: "bold" },
  cell: { padding: 5, borderRightWidth: 1, borderRightColor: "#E5E7EB" },
  lastCell: { borderRightWidth: 0 },
  right: { textAlign: "right" },
  muted: { color: "#6B7280" },
  mono: { fontFamily: "Courier", fontSize: 7 },
});

function inPeriod(date: string, period: ReportPeriod, value: string): boolean {
  if (period === "month") return date.slice(0, 7) === value;
  return date.slice(0, 4) === value;
}

function getReportDate(invoice: Invoice): string {
  return invoice.paid_at || invoice.issue_date || invoice.created_at;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB");
}

function getCustomer(invoice: ReportInvoice): CustomerSummary | null {
  if (Array.isArray(invoice.customer)) return invoice.customer[0] ?? null;
  return invoice.customer ?? null;
}

function getCustomerLabel(invoice: ReportInvoice): string {
  const customer = getCustomer(invoice);
  return customer?.company || customer?.name || "Unknown customer";
}

function normalizePeriodValue(period: ReportPeriod, value: string | null): string {
  const fallback = new Date().toISOString().slice(0, period === "month" ? 7 : 4);
  if (!value) return fallback;
  if (period === "month" && /^\d{4}-\d{2}$/.test(value)) return value;
  if (period === "year" && /^\d{4}$/.test(value)) return value;
  return fallback;
}

function getPeriodLabel(period: ReportPeriod, value: string): string {
  if (period === "year") return value;
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
}

function buildMonthlyRows(invoices: ReportInvoice[], expenses: Expense[]) {
  const rows = new Map<string, { month: string; earnings: number; expenses: number; profit: number }>();

  for (const invoice of invoices) {
    const month = getReportDate(invoice).slice(0, 7);
    const row = rows.get(month) ?? { month, earnings: 0, expenses: 0, profit: 0 };
    row.earnings += Number(invoice.amount_paid || 0);
    rows.set(month, row);
  }

  for (const expense of expenses) {
    const month = expense.expense_date.slice(0, 7);
    const row = rows.get(month) ?? { month, earnings: 0, expenses: 0, profit: 0 };
    row.expenses += Number(expense.amount || 0);
    rows.set(month, row);
  }

  return [...rows.values()]
    .map((row) => ({ ...row, profit: row.earnings - row.expenses }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function DataCell({
  children,
  width,
  right,
  last,
  mono,
}: {
  children: React.ReactNode;
  width: string | number;
  right?: boolean;
  last?: boolean;
  mono?: boolean;
}) {
  return (
    <Text
      style={[
        styles.cell,
        { width },
        right ? styles.right : {},
        last ? styles.lastCell : {},
        mono ? styles.mono : {},
      ]}
    >
      {children}
    </Text>
  );
}

function PageHeader({
  title,
  periodLabel,
  generatedAt,
}: {
  title: string;
  periodLabel: string;
  generatedAt: string;
}) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.eyebrow}>Dockyard Design financial report</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Period: {periodLabel} • Generated: {new Date(generatedAt).toLocaleString("en-GB")}
      </Text>
    </View>
  );
}

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const period: ReportPeriod = searchParams.get("period") === "year" ? "year" : "month";
  const value = normalizePeriodValue(period, searchParams.get("value"));

  const [invoiceResult, expenseResult] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select("*, items:invoice_items(*), customer:customers(id, name, company, email)")
      .order("issue_date", { ascending: false }),
    supabaseAdmin.from("expenses").select("*, category:expense_categories(*)").order("expense_date", { ascending: false }),
  ]);

  if (invoiceResult.error || expenseResult.error) {
    return NextResponse.json({ error: "Failed to load report data" }, { status: 500 });
  }

  const invoices = ((invoiceResult.data || []) as ReportInvoice[]).filter((invoice) =>
    inPeriod(getReportDate(invoice), period, value)
  );
  const expenses = ((expenseResult.data || []) as Expense[]).filter((expense) =>
    inPeriod(expense.expense_date, period, value)
  );
  const earnings = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
  const invoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const tax = invoices.reduce((sum, invoice) => sum + Number(invoice.tax_amount || 0), 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due || 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const taxDeductible = expenses
    .filter((expense) => expense.tax_deductible)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const recurringTotal = expenses
    .filter((expense) => expense.is_recurring)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const profit = earnings - expenseTotal;
  const generatedAt = new Date().toISOString();
  const periodLabel = getPeriodLabel(period, value);
  const monthlyRows = buildMonthlyRows(invoices, expenses);
  const invoiceItemCount = invoices.reduce((sum, invoice) => sum + (invoice.items?.length ?? 0), 0);

  const pdf = (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageHeader title="Summary and Reconciliation" periodLabel={periodLabel} generatedAt={generatedAt} />
        <Text style={styles.subtitle}>
          Report key: {period}-{value} • Source scope: paid invoices, invoice balances, invoice line
          items, expenses, categories, receipts and tax flags.
        </Text>

        <View style={styles.summary}>
          <View style={styles.metric}><Text style={styles.metricLabel}>Paid earnings</Text><Text style={styles.metricValue}>{currency.format(earnings)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Expenses</Text><Text style={styles.metricValue}>{currency.format(expenseTotal)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Profit</Text><Text style={styles.metricValue}>{currency.format(profit)}</Text></View>
          <View style={[styles.metric, styles.metricLast]}><Text style={styles.metricLabel}>Outstanding</Text><Text style={styles.metricValue}>{currency.format(outstanding)}</Text></View>
        </View>

        <View style={styles.summary}>
          <View style={styles.metric}><Text style={styles.metricLabel}>Invoiced value</Text><Text style={styles.metricValue}>{currency.format(invoiced)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Invoice VAT/tax</Text><Text style={styles.metricValue}>{currency.format(tax)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>Tax deductible expenses</Text><Text style={styles.metricValue}>{currency.format(taxDeductible)}</Text></View>
          <View style={[styles.metric, styles.metricLast]}><Text style={styles.metricLabel}>Recurring expenses</Text><Text style={styles.metricValue}>{currency.format(recurringTotal)}</Text></View>
        </View>

        <Text style={styles.note}>
          Traceability: invoice earnings are allocated by paid_at, then issue_date, then created_at.
          Expenses are allocated by expense_date. This report contains {invoices.length} invoices,
          {invoiceItemCount} invoice line items, and {expenses.length} expenses.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly reconciliation</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.head]}>
              <DataCell width="28%">Month</DataCell>
              <DataCell width="24%" right>Earnings</DataCell>
              <DataCell width="24%" right>Expenses</DataCell>
              <DataCell width="24%" right last>Profit</DataCell>
            </View>
            {monthlyRows.map((row) => (
              <View key={row.month} style={styles.row}>
                <DataCell width="28%">{row.month}</DataCell>
                <DataCell width="24%" right>{currency.format(row.earnings)}</DataCell>
                <DataCell width="24%" right>{currency.format(row.expenses)}</DataCell>
                <DataCell width="24%" right last>{currency.format(row.profit)}</DataCell>
              </View>
            ))}
            {monthlyRows.length === 0 && (
              <View style={styles.row}>
                <DataCell width="100%" last>No financial activity in this period.</DataCell>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reconciliation rows</Text>
          <Text style={styles.sectionIntro}>
            This section is needed to reconcile the selected period before reviewing source records.
          </Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.head]}>
              <DataCell width="28%">Month</DataCell>
              <DataCell width="24%" right>Earnings</DataCell>
              <DataCell width="24%" right>Expenses</DataCell>
              <DataCell width="24%" right last>Profit</DataCell>
            </View>
            {monthlyRows.map((row) => (
              <View key={row.month} style={styles.row}>
                <DataCell width="28%">{row.month}</DataCell>
                <DataCell width="24%" right>{currency.format(row.earnings)}</DataCell>
                <DataCell width="24%" right>{currency.format(row.expenses)}</DataCell>
                <DataCell width="24%" right last>{currency.format(row.profit)}</DataCell>
              </View>
            ))}
            {monthlyRows.length === 0 && (
              <View style={styles.row}>
                <DataCell width="100%" last>No financial activity in this period.</DataCell>
              </View>
            )}
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader title="Invoice Register" periodLabel={periodLabel} generatedAt={generatedAt} />
        <Text style={styles.sectionIntro}>
          This section is needed to trace revenue, payment status and outstanding balances back to
          invoice numbers, customer identities and source invoice IDs.
        </Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <DataCell width="11%">Date</DataCell>
            <DataCell width="14%">Invoice</DataCell>
            <DataCell width="18%">Customer</DataCell>
            <DataCell width="13%">Status</DataCell>
            <DataCell width="12%" right>Total</DataCell>
            <DataCell width="12%" right>Paid</DataCell>
            <DataCell width="12%" right>Balance</DataCell>
            <DataCell width="8%" last>ID</DataCell>
          </View>
          {invoices.map((invoice) => (
            <View key={invoice.id} style={styles.row} wrap={false}>
              <DataCell width="11%">{formatDate(getReportDate(invoice))}</DataCell>
              <DataCell width="14%">{invoice.invoice_number}</DataCell>
              <DataCell width="18%">{getCustomerLabel(invoice)}</DataCell>
              <DataCell width="13%">{invoice.status}</DataCell>
              <DataCell width="12%" right>{currency.format(Number(invoice.total || 0))}</DataCell>
              <DataCell width="12%" right>{currency.format(Number(invoice.amount_paid || 0))}</DataCell>
              <DataCell width="12%" right>{currency.format(Number(invoice.balance_due || 0))}</DataCell>
              <DataCell width="8%" mono last>{invoice.id.slice(0, 8)}</DataCell>
            </View>
          ))}
          {invoices.length === 0 && (
            <View style={styles.row}>
              <DataCell width="100%" last>No invoices in this period.</DataCell>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice lifecycle trace</Text>
          <View style={styles.table}>
            <View style={[styles.row, styles.head]}>
              <DataCell width="14%">Invoice</DataCell>
              <DataCell width="14%">Quote ID</DataCell>
              <DataCell width="17%">Issue / Due</DataCell>
              <DataCell width="17%">Sent / Paid</DataCell>
              <DataCell width="14%" right>Subtotal</DataCell>
              <DataCell width="12%" right>Tax</DataCell>
              <DataCell width="12%" right last>Lines</DataCell>
            </View>
            {invoices.map((invoice) => (
              <View key={`${invoice.id}-trace`} style={styles.row} wrap={false}>
                <DataCell width="14%">{invoice.invoice_number}</DataCell>
                <DataCell width="14%" mono>{invoice.quote_id?.slice(0, 8) || "None"}</DataCell>
                <DataCell width="17%">{formatDate(invoice.issue_date)} / {formatDate(invoice.due_date)}</DataCell>
                <DataCell width="17%">{formatDate(invoice.sent_at)} / {formatDate(invoice.paid_at)}</DataCell>
                <DataCell width="14%" right>{currency.format(Number(invoice.subtotal || 0))}</DataCell>
                <DataCell width="12%" right>{currency.format(Number(invoice.tax_amount || 0))}</DataCell>
                <DataCell width="12%" right last>{invoice.items?.length ?? 0}</DataCell>
              </View>
            ))}
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader title="Invoice Line Items" periodLabel={periodLabel} generatedAt={generatedAt} />
        <Text style={styles.sectionIntro}>
          This section is needed to trace invoice totals back to the billed work, quantities, unit
          prices and line totals.
        </Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <DataCell width="16%">Invoice</DataCell>
            <DataCell width="44%">Description</DataCell>
            <DataCell width="12%" right>Qty</DataCell>
            <DataCell width="14%" right>Unit</DataCell>
            <DataCell width="14%" right last>Total</DataCell>
          </View>
          {invoices.flatMap((invoice) =>
            (invoice.items ?? []).map((item) => (
              <View key={item.id} style={styles.row} wrap={false}>
                <DataCell width="16%">{invoice.invoice_number}</DataCell>
                <DataCell width="44%">{item.description}</DataCell>
                <DataCell width="12%" right>{Number(item.quantity || 0).toLocaleString("en-GB")}</DataCell>
                <DataCell width="14%" right>{currency.format(Number(item.unit_price || 0))}</DataCell>
                <DataCell width="14%" right last>{currency.format(Number(item.total || 0))}</DataCell>
              </View>
            ))
          )}
          {invoiceItemCount === 0 && (
            <View style={styles.row}>
              <DataCell width="100%" last>No invoice line items in this period.</DataCell>
            </View>
          )}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader title="Expense Register" periodLabel={periodLabel} generatedAt={generatedAt} />
        <Text style={styles.sectionIntro}>
          This section is needed to trace deductions and cash outflows by vendor, category, receipt
          availability, recurrence and tax treatment.
        </Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]}>
            <DataCell width="12%">Date</DataCell>
            <DataCell width="20%">Title</DataCell>
            <DataCell width="15%">Vendor</DataCell>
            <DataCell width="15%">Category</DataCell>
            <DataCell width="10%">Flags</DataCell>
            <DataCell width="12%" right>Amount</DataCell>
            <DataCell width="8%">Receipt</DataCell>
            <DataCell width="8%" mono last>ID</DataCell>
          </View>
          {expenses.map((expense) => (
            <View key={expense.id} style={styles.row} wrap={false}>
              <DataCell width="12%">{formatDate(expense.expense_date)}</DataCell>
              <DataCell width="20%">{expense.title}</DataCell>
              <DataCell width="15%">{expense.vendor || "Not provided"}</DataCell>
              <DataCell width="15%">{expense.category?.name || expense.category_id.slice(0, 8)}</DataCell>
              <DataCell width="10%">
                {[
                  expense.tax_deductible ? "tax" : null,
                  expense.is_recurring ? expense.recurring_frequency || "recurring" : null,
                ].filter(Boolean).join(", ") || "standard"}
              </DataCell>
              <DataCell width="12%" right>{currency.format(Number(expense.amount || 0))}</DataCell>
              <DataCell width="8%">{expense.receipt_url ? "Attached" : "None"}</DataCell>
              <DataCell width="8%" mono last>{expense.id.slice(0, 8)}</DataCell>
            </View>
          ))}
          {expenses.length === 0 && (
            <View style={styles.row}>
              <DataCell width="100%" last>No expenses in this period.</DataCell>
            </View>
          )}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader title="Audit Trail" periodLabel={periodLabel} generatedAt={generatedAt} />
        <Text style={styles.sectionIntro}>
          This section is needed to explain how the report was produced and how records were
          included, so the PDF can be interpreted consistently later.
        </Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <DataCell width="30%">Report key</DataCell>
            <DataCell width="70%" last>{period}-{value}</DataCell>
          </View>
          <View style={styles.row}>
            <DataCell width="30%">Generated at</DataCell>
            <DataCell width="70%" last>{generatedAt}</DataCell>
          </View>
          <View style={styles.row}>
            <DataCell width="30%">Source tables</DataCell>
            <DataCell width="70%" last>
              invoices, invoice_items, customers, expenses, expense_categories
            </DataCell>
          </View>
          <View style={styles.row}>
            <DataCell width="30%">Invoice inclusion rule</DataCell>
            <DataCell width="70%" last>
              paid_at if present, otherwise issue_date, otherwise created_at.
            </DataCell>
          </View>
          <View style={styles.row}>
            <DataCell width="30%">Expense inclusion rule</DataCell>
            <DataCell width="70%" last>expense_date within selected period.</DataCell>
          </View>
          <View style={styles.row}>
            <DataCell width="30%">Record counts</DataCell>
            <DataCell width="70%" last>
              {invoices.length} invoices, {invoiceItemCount} invoice line items, {expenses.length} expenses.
            </DataCell>
          </View>
          <View style={styles.row}>
            <DataCell width="30%">Currency rendering</DataCell>
            <DataCell width="70%" last>GBP formatted with en-GB locale.</DataCell>
          </View>
        </View>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(pdf);
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dockyard-${period}-report-${value}.pdf"`,
    },
  });
}
