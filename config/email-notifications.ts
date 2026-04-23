export const emailNotificationConfig = {
  customer: {
    // Sends temporary password and sign-in details when an admin creates a customer account.
    accountWelcome: true,
    // Sends when an admin starts a new portal message thread with a customer.
    portalThreadStartedByDockyard: true,
    // Sends when an admin replies to an existing portal message thread.
    portalReplyFromDockyard: true,
    // Sends the automatic confirmation reply after a customer starts a thread.
    portalAutoReply: true,
    // Sends direct quote-ready email if sendDocumentEmail is used.
    quoteReady: true,
    // Sends direct invoice-ready email if sendDocumentEmail is used.
    invoiceReady: true,
    // Sends when a quote is created as an internal document thread message.
    quoteCreated: true,
    // Sends when a quote is edited without a status change.
    quoteUpdated: true,
    // Sends when a quote status is changed by an admin, including "sent".
    quoteStatusChanged: true,
    // Sends when an invoice is created by an admin and linked to a quote.
    invoiceCreated: true,
    // Sends when an invoice is created automatically after quote acceptance.
    invoiceCreatedFromAcceptedQuote: true,
    // Sends when an invoice status is changed by an admin.
    invoiceStatusChanged: true,
    // Sends when an admin records a partial or full invoice payment.
    invoicePaymentRecorded: true,
  },
  support: {
    // Sends Dockyard an email when the public contact API receives a submission.
    contactSubmissions: true,
    // Sends Dockyard an email when an admin creates a project record.
    projectNotifications: true,
    // Sends when a customer starts a new portal message thread.
    portalThreadStartedByCustomer: true,
    // Sends when a customer replies to an existing portal message thread.
    portalReplyFromCustomer: true,
    // Sends when a quote is created as an internal document thread message.
    quoteCreated: true,
    // Sends when a quote is edited without a status change.
    quoteUpdated: true,
    // Sends when a quote status is changed by an admin, including "sent".
    quoteStatusChanged: true,
    // Sends when a customer accepts a quote.
    quoteAccepted: true,
    // Sends when a customer rejects a quote.
    quoteRejected: true,
    // Sends when an invoice is created by an admin and linked to a quote.
    invoiceCreated: true,
    // Sends when an invoice is created automatically after quote acceptance.
    invoiceCreatedFromAcceptedQuote: true,
    // Sends when an invoice status is changed by an admin.
    invoiceStatusChanged: true,
    // Sends when an admin records a partial or full invoice payment.
    invoicePaymentRecorded: true,
  },
} as const;

export type CustomerEmailNotification =
  keyof typeof emailNotificationConfig.customer;

export type SupportEmailNotification =
  keyof typeof emailNotificationConfig.support;

export function isCustomerEmailEnabled(
  notification: CustomerEmailNotification
): boolean {
  return emailNotificationConfig.customer[notification];
}

export function isSupportEmailEnabled(
  notification: SupportEmailNotification
): boolean {
  return emailNotificationConfig.support[notification];
}
