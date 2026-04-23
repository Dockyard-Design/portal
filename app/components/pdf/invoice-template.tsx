import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { Logo } from "./logo";
import {
  UK_PAYMENT_INSTRUCTIONS,
  getInvoicePaymentPlan,
} from "@/lib/invoice-payments";
import { pdfTemplate } from "@/config/templates";
import type { Invoice, InvoiceItem } from "@/types/agency";
import type { Customer } from "@/types/kanban";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
    color: "#000000",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  logoSection: {
    width: 160,
    height: 40,
  },
  rightSection: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
  },
  docTypeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  docType: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 2,
  },
  docNumber: {
    fontSize: 11,
    color: "#666666",
  },
  statusBadge: {
    padding: "4 10",
    borderWidth: 1.5,
    borderColor: "#000000",
    marginTop: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoLabel: {
    width: 70,
    color: "#666666",
  },
  infoValue: {
    color: "#000000",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 4,
  },
  twoColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    width: "48%",
  },
  customerName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  customerDetail: {
    color: "#333333",
    marginBottom: 2,
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#000000",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    padding: "8 10",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: "8 10",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CCCCCC",
  },
  tableRowLast: {
    flexDirection: "row",
    padding: "8 10",
  },
  tableCell: {
    fontSize: 10,
    color: "#000000",
  },
  descriptionCol: {
    flex: 1,
  },
  qtyCol: {
    width: 60,
    textAlign: "center",
  },
  priceCol: {
    width: 80,
    textAlign: "right",
  },
  totalCol: {
    width: 80,
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 15,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  totalLabel: {
    width: 120,
    textAlign: "right",
    color: "#666666",
    paddingRight: 12,
  },
  totalValue: {
    width: 100,
    textAlign: "right",
    color: "#000000",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: "#000000",
  },
  grandTotalLabel: {
    width: 120,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 12,
    paddingRight: 12,
  },
  grandTotalValue: {
    width: 100,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 14,
  },
  balanceDue: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#999999",
  },
  balanceDueLabel: {
    width: 120,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 11,
    paddingRight: 12,
  },
  balanceDueValue: {
    width: 100,
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 12,
  },
  paymentSchedule: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#000000",
  },
  scheduleHeader: {
    padding: "7 10",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    backgroundColor: "#F0F0F0",
  },
  scheduleTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "7 10",
    borderBottomWidth: 0.5,
    borderBottomColor: "#CCCCCC",
  },
  scheduleRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "7 10",
  },
  scheduleLabel: {
    fontSize: 9,
    color: "#333333",
  },
  scheduleValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  termsSection: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#FAFAFA",
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  termsText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.5,
  },
  instructionsHero: {
    marginTop: 30,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  instructionsEyebrow: {
    fontSize: 9,
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  instructionsGrid: {
    marginTop: 24,
    flexDirection: "row",
    gap: 16,
  },
  instructionsCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#FAFAFA",
  },
  instructionsCardTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  instructionsAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  instructionsTextBlock: {
    marginTop: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#000000",
  },
  instructionsText: {
    fontSize: 11,
    lineHeight: 1.55,
    color: "#222222",
  },
  instructionsSmallText: {
    fontSize: 9,
    lineHeight: 1.45,
    color: "#444444",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#666666",
  },
});

interface InvoicePDFProps {
  invoice: Invoice;
  customer: Customer;
  logoBase64?: string | null;
}

export function InvoicePDF({ invoice, customer, logoBase64 }: InvoicePDFProps) {
  const paymentPlan = getInvoicePaymentPlan(invoice);
  const amountPaid = paymentPlan.amountPaid;
  const balanceDue = paymentPlan.balanceDue;
  const paidInFull = balanceDue <= 0 || invoice.status === "paid";
  const partiallyPaid = !paidInFull && amountPaid > 0;
  const statusLabel =
    invoice.status === "partial"
      ? "PARTIALLY PAID"
      : invoice.status.replace("_", " ").toUpperCase();
  const startPaymentReceived =
    amountPaid >= paymentPlan.startPaymentAmount || paidInFull;
  const finalPaymentReceived = paidInFull;
  const paymentInstructions =
    invoice.payment_instructions?.trim() || UK_PAYMENT_INSTRUCTIONS;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            <Logo logoBase64={logoBase64} />
          </View>
          
          <View style={styles.rightSection}>
            <View style={styles.docTypeRow}>
              <Text style={styles.docType}>{pdfTemplate.invoice.documentTitle}</Text>
              <Text style={styles.docNumber}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>{pdfTemplate.common.billTo}</Text>
            <Text style={styles.customerName}>{customer.name}</Text>
            {customer.company && (
              <Text style={styles.customerDetail}>{customer.company}</Text>
            )}
            {customer.email && (
              <Text style={styles.customerDetail}>{customer.email}</Text>
            )}
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>{pdfTemplate.invoice.detailsTitle}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{pdfTemplate.invoice.issueDateLabel}</Text>
              <Text style={styles.infoValue}>{new Date(invoice.created_at).toLocaleDateString("en-GB")}</Text>
            </View>
            {!paidInFull && invoice.due_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{pdfTemplate.invoice.targetDateLabel}</Text>
                <Text style={styles.infoValue}>{new Date(invoice.due_date).toLocaleDateString("en-GB")}</Text>
              </View>
            )}
            {paidInFull && invoice.paid_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{pdfTemplate.invoice.paidDateLabel}</Text>
                <Text style={styles.infoValue}>{new Date(invoice.paid_at).toLocaleDateString("en-GB")}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Currency:</Text>
              <Text style={styles.infoValue}>{pdfTemplate.currencyLabel}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {invoice.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{pdfTemplate.common.description}</Text>
            <Text style={{ color: "#333333" }}>{invoice.description}</Text>
          </View>
        )}

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{pdfTemplate.common.items}</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.descriptionCol]}>{pdfTemplate.common.table.description}</Text>
              <Text style={[styles.tableHeaderCell, styles.qtyCol]}>{pdfTemplate.common.table.quantity}</Text>
              <Text style={[styles.tableHeaderCell, styles.priceCol]}>{pdfTemplate.common.table.unitPrice}</Text>
              <Text style={[styles.tableHeaderCell, styles.totalCol]}>{pdfTemplate.common.table.total}</Text>
            </View>

            {invoice.items?.map((item: InvoiceItem, index: number) => {
              const isLast = index === (invoice.items?.length || 0) - 1;
              return (
                <View key={index} style={isLast ? styles.tableRowLast : styles.tableRow}>
                  <Text style={[styles.tableCell, styles.descriptionCol]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.qtyCol]}>{item.quantity}</Text>
                  <Text style={[styles.tableCell, styles.priceCol]}>£{item.unit_price.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.totalCol, { fontWeight: "bold" }]}>£{item.total.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{pdfTemplate.invoice.subtotalLabel}</Text>
            <Text style={styles.totalValue}>£{invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{pdfTemplate.invoice.vatLabel(invoice.tax_rate)}</Text>
            <Text style={styles.totalValue}>£{invoice.tax_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{pdfTemplate.invoice.totalLabel}</Text>
            <Text style={styles.grandTotalValue}>£{invoice.total.toFixed(2)}</Text>
          </View>
          {amountPaid > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{pdfTemplate.invoice.amountReceivedLabel}</Text>
              <Text style={styles.totalValue}>£{amountPaid.toFixed(2)}</Text>
            </View>
          )}
          {paidInFull ? (
            <View style={styles.balanceDue}>
              <Text style={styles.balanceDueLabel}>{pdfTemplate.invoice.paidInFullLabel}</Text>
              <Text style={styles.balanceDueValue}>£0.00</Text>
            </View>
          ) : (
            <View style={styles.balanceDue}>
              <Text style={styles.balanceDueLabel}>{pdfTemplate.invoice.outstandingLabel}</Text>
              <Text style={styles.balanceDueValue}>£{balanceDue.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Payment Schedule */}
        <View style={styles.paymentSchedule}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>{pdfTemplate.invoice.paymentScheduleTitle}</Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>
              {pdfTemplate.invoice.startPaymentLabel(startPaymentReceived ? "received" : "outstanding")}
            </Text>
            <Text style={styles.scheduleValue}>
              £{paymentPlan.startPaymentAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>
              {pdfTemplate.invoice.completionPaymentLabel(finalPaymentReceived ? "received" : partiallyPaid ? "outstanding" : "scheduled")}
            </Text>
            <Text style={styles.scheduleValue}>
              £{paymentPlan.finalPaymentAmount.toFixed(2)}
            </Text>
          </View>
          {!paidInFull && paymentPlan.nextPaymentAmount > 0 && (
            <View style={styles.scheduleRowLast}>
              <Text style={styles.scheduleLabel}>{pdfTemplate.invoice.remainingPaymentLabel}</Text>
              <Text style={styles.scheduleValue}>£{paymentPlan.nextPaymentAmount.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {pdfTemplate.brand.name} • {invoice.invoice_number}
          </Text>
        </View>
      </Page>
      {invoice.terms && (
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            <Logo logoBase64={logoBase64} />
          </View>

          <View style={styles.rightSection}>
            <View style={styles.docTypeRow}>
              <Text style={styles.docType}>{pdfTemplate.common.termsTitle}</Text>
              <Text style={styles.docNumber}>{invoice.invoice_number}</Text>
            </View>
          </View>
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>{pdfTemplate.common.termsTitle}</Text>
          <Text style={styles.termsText}>{invoice.terms}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {pdfTemplate.brand.name} • {pdfTemplate.common.termsTitle} • {invoice.invoice_number}
          </Text>
        </View>
      </Page>
      )}
      {!paidInFull && (
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <View style={styles.logoSection}>
            <Logo logoBase64={logoBase64} />
          </View>

          <View style={styles.rightSection}>
            <View style={styles.docTypeRow}>
              <Text style={styles.docType}>{pdfTemplate.paymentInstructions.documentTitle}</Text>
              <Text style={styles.docNumber}>{invoice.invoice_number}</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsHero}>
          <Text style={styles.instructionsEyebrow}>{pdfTemplate.paymentInstructions.eyebrow}</Text>
          <Text style={styles.instructionsTitle}>{pdfTemplate.paymentInstructions.invoiceTitle}</Text>
        </View>

        <View style={styles.instructionsGrid}>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsCardTitle}>{pdfTemplate.paymentInstructions.referenceTitle}</Text>
            <Text style={styles.instructionsText}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsCardTitle}>{pdfTemplate.paymentInstructions.outstandingBalanceTitle}</Text>
            <Text style={styles.instructionsAmount}>£{balanceDue.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.instructionsGrid}>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsCardTitle}>{pdfTemplate.paymentInstructions.startOfWorksTitle}</Text>
            <Text style={styles.instructionsText}>£{paymentPlan.startPaymentAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsCardTitle}>{pdfTemplate.paymentInstructions.completionTitle}</Text>
            <Text style={styles.instructionsText}>£{paymentPlan.finalPaymentAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.instructionsTextBlock}>
          <Text style={styles.instructionsCardTitle}>{pdfTemplate.paymentInstructions.instructionsTitle}</Text>
          <Text style={styles.instructionsText}>{paymentInstructions}</Text>
        </View>

        <View style={styles.instructionsTextBlock}>
          <Text style={styles.instructionsCardTitle}>{pdfTemplate.paymentInstructions.beforeSendingFundsTitle}</Text>
          <Text style={styles.instructionsSmallText}>{pdfTemplate.paymentInstructions.invoiceSafetyNote}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {pdfTemplate.paymentInstructions.footer(invoice.invoice_number)}
          </Text>
        </View>
      </Page>
      )}
    </Document>
  );
}
