import { brandTemplate } from "./brand";

export const pdfTemplate = {
  brand: brandTemplate,
  currencyLabel: "GBP (£)",
  common: {
    billTo: "Bill To",
    description: "Description",
    items: "Items",
    termsTitle: "Terms & Conditions",
    table: {
      description: "Description",
      quantity: "Qty",
      unitPrice: "Unit Price",
      total: "Total",
    },
  },
  quote: {
    documentTitle: "QUOTE",
    detailsTitle: "Quote Details",
    referenceLabel: "Quote #:",
    dateLabel: "Date:",
    validUntilLabel: "Valid Until:",
    totalLabel: "TOTAL:",
    footerValidUntil: (dateLabel: string) =>
      `${brandTemplate.name} • Valid until ${dateLabel}`,
  },
  invoice: {
    documentTitle: "INVOICE",
    detailsTitle: "Invoice Details",
    issueDateLabel: "Issue Date:",
    targetDateLabel: "Target Date:",
    paidDateLabel: "Paid Date:",
    subtotalLabel: "Subtotal:",
    vatLabel: (rate: number) => `VAT (${rate}%):`,
    totalLabel: "INVOICE TOTAL:",
    amountReceivedLabel: "Amount received:",
    paidInFullLabel: "PAID IN FULL:",
    outstandingLabel: "OUTSTANDING:",
    paymentScheduleTitle: "Payment Schedule",
    startPaymentLabel: (status: "received" | "outstanding") =>
      `Start of works payment ${status}`,
    completionPaymentLabel: (status: "received" | "outstanding" | "scheduled") =>
      `Completion payment ${status}`,
    remainingPaymentLabel: "Remaining payment",
  },
  paymentInstructions: {
    defaultText: [
      "Please pay by UK bank transfer using BACS or Faster Payments.",
      "Account name: Dockyard Design.",
      "Use the invoice or quote reference as your payment reference so the payment can be matched correctly.",
      "Payment is split into two equal stages: 50% is due at the start of works and the remaining 50% is due at completion before final handover.",
      "Bank account details are provided separately by Dockyard Design. If you need them reissued, confirm through the Dockyard portal before sending funds.",
    ].join("\n\n"),
    documentTitle: "PAYMENT",
    eyebrow: "UK payment instructions",
    invoiceTitle: "Bank transfer details",
    quoteTitle: "Pay by UK bank transfer",
    referenceTitle: "Payment reference",
    outstandingBalanceTitle: "Outstanding balance",
    quoteTotalTitle: "Quote total",
    startOfWorksTitle: "Start of works",
    completionTitle: "Completion",
    instructionsTitle: "Instructions",
    beforeSendingFundsTitle: "Before sending funds",
    invoiceSafetyNote:
      "Include the invoice number as the bank-transfer reference. For fraud prevention, confirm any new or changed bank details through the Dockyard portal before making payment.",
    quoteSafetyNote:
      "Include the quote reference as the bank-transfer reference. For fraud prevention, confirm any new or changed bank details through the Dockyard portal before making payment.",
    footer: (reference: string) =>
      `${brandTemplate.name} • UK bank transfer instructions • ${reference}`,
  },
} as const;
