export const messagingTemplates = {
  portalAutoReply:
    "Thanks for your message. A member of the Dockyard team will respond within 24 hours.",
  quoteThreadSubject: (reference: string, title: string) =>
    `Quote ${reference}: ${title}`,
  quoteCreated: (input: { title: string; total: string }) =>
    `A new quote has been created: ${input.title}. Total: ${input.total}.`,
  quoteUpdated: (title: string) => `Quote updated: ${title}.`,
  quoteStatusChanged: (input: { status: string; title: string }) =>
    `Quote status changed to ${input.status}: ${input.title}.`,
  quoteAccepted: (title: string) => `Quote accepted: ${title}.`,
  quoteRejected: "Quote rejected by the customer.",
  invoiceCreated: (input: { invoiceReference: string; title: string }) =>
    `Invoice ${input.invoiceReference} has been created for quote ${input.title}.`,
  invoiceCreatedFromAcceptedQuote: (invoiceReference: string) =>
    `Invoice ${invoiceReference} has been created from the accepted quote.`,
  invoiceStatusChanged: (input: { invoiceReference: string; status: string }) =>
    `Invoice ${input.invoiceReference} status changed to ${input.status}.`,
  invoicePaidInFull: (invoiceReference: string) =>
    `Invoice ${invoiceReference} has been paid in full.`,
  invoicePartialPaymentRecorded: (input: {
    invoiceReference: string;
    balanceDue: string;
  }) =>
    `Invoice ${input.invoiceReference} start-of-works payment has been paid. Remaining balance: ${input.balanceDue}.`,
} as const;

