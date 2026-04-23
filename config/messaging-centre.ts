export const messagingCentreConfig = {
  automaticMessages: {
    // Adds the automatic confirmation reply after a customer starts a message thread.
    portalAutoReply: true,
    // Adds a system message when a quote is created.
    quoteCreated: true,
    // Adds a system message when a quote is edited without a status change.
    quoteUpdated: true,
    // Adds a system message when a quote status is changed by an admin, including "sent".
    quoteStatusChanged: true,
    // Adds a system message when a customer accepts a quote.
    quoteAccepted: true,
    // Adds a system message when a customer rejects a quote.
    quoteRejected: true,
    // Adds a system message when an invoice is created by an admin and linked to a quote.
    invoiceCreated: true,
    // Adds a system message when an invoice is created automatically after quote acceptance.
    invoiceCreatedFromAcceptedQuote: true,
    // Adds a system message when an invoice status is changed by an admin.
    invoiceStatusChanged: true,
    // Adds a system message when an admin records a partial or full invoice payment.
    invoicePaymentRecorded: true,
  },
} as const;

export type AutomaticMessage =
  keyof typeof messagingCentreConfig.automaticMessages;

export function isAutomaticMessageEnabled(message: AutomaticMessage): boolean {
  return messagingCentreConfig.automaticMessages[message];
}

