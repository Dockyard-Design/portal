import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { Logo } from "./logo";
import type { Quote, QuoteItem } from "@/types/agency";
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
    width: 100,
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
    width: 100,
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
  termsSection: {
    marginTop: 20,
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

interface QuotePDFProps {
  quote: Quote;
  customer: Customer;
  logoBase64?: string | null;
}

export function QuotePDF({ quote, customer, logoBase64 }: QuotePDFProps) {
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
              <Text style={styles.docType}>QUOTE</Text>
              <Text style={styles.docNumber}>Ref: {quote.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{quote.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.customerName}>{customer.name}</Text>
            {customer.company && (
              <Text style={styles.customerDetail}>{customer.company}</Text>
            )}
            {customer.email && (
              <Text style={styles.customerDetail}>{customer.email}</Text>
            )}
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Quote Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(quote.created_at).toLocaleDateString("en-GB")}
              </Text>
            </View>
            {quote.valid_until && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valid Until:</Text>
                <Text style={styles.infoValue}>
                  {new Date(quote.valid_until).toLocaleDateString("en-GB")}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Currency:</Text>
              <Text style={styles.infoValue}>GBP (£)</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {quote.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={{ color: "#333333" }}>{quote.description}</Text>
          </View>
        )}

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.descriptionCol]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Qty</Text>
              <Text style={[styles.tableHeaderCell, styles.priceCol]}>Unit Price</Text>
              <Text style={[styles.tableHeaderCell, styles.totalCol]}>Total</Text>
            </View>

            {quote.items?.map((item: QuoteItem, index: number) => {
              const isLast = index === (quote.items?.length || 0) - 1;
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
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>£{quote.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT ({quote.tax_rate}%):</Text>
            <Text style={styles.totalValue}>£{quote.tax_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>£{quote.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Terms */}
        {quote.terms && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{quote.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dockyard Design • Valid until {quote.valid_until 
              ? new Date(quote.valid_until).toLocaleDateString("en-GB") 
              : "further notice"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
