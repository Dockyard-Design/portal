import type {
  DocumentEmailInput,
  CustomerWelcomeEmailInput,
  FormSubmissionEmailInput,
  SendEmailInput,
  CustomerMessageEmailInput,
  SupportMessageEmailInput,
} from "@/types/email";
import {
  getFormSubmissionEmailHtml,
  getDocumentEmailHtml,
  getCustomerMessageEmailHtml,
  getSupportMessageEmailHtml,
  getCustomerWelcomeEmailHtml,
} from "@/emails";
import {
  isCustomerEmailEnabled,
  isSupportEmailEnabled,
  type SupportEmailNotification,
} from "@/config/email-notifications";
import { emailTemplate } from "@/config/templates";

const RESEND_API_URL = "https://api.resend.com/emails";
const SUPPORT_EMAIL = "support@dockyard.design";
const NO_REPLY_EMAIL = "no-reply@dockyard.design";

function formatDetailValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function getTextVersion(input: Record<string, unknown>): string {
  const entries = Object.entries(input).map(
    ([key, value]) => `${key}: ${formatDetailValue(value as string | number | boolean | null | undefined)}`
  );
  return entries.join("\n");
}

function getFormSubmissionNotification(
  formName: string
): SupportEmailNotification {
  return formName.toLowerCase() === "project"
    ? "projectNotifications"
    : "contactSubmissions";
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    console.warn(`[email] Skipped email "${input.subject}" because RESEND_API_KEY is not configured.`);
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${errorText}`);
  }
}

export async function sendFormSubmissionEmail(input: FormSubmissionEmailInput): Promise<void> {
  if (!isSupportEmailEnabled(getFormSubmissionNotification(input.formName))) {
    return;
  }

  const html = await getFormSubmissionEmailHtml({
    formName: input.formName,
    submittedAt: input.submittedAt,
    details: input.details,
  });

  await sendEmail({
    to: [SUPPORT_EMAIL],
    from: SUPPORT_EMAIL,
    subject: emailTemplate.formSubmission.subject(input.formName),
    text: `${input.formName} submission\nSubmitted at: ${input.submittedAt}\n${getTextVersion(input.details)}`,
    html,
  });
}

export async function sendDocumentEmail(input: DocumentEmailInput): Promise<void> {
  const notification = input.documentType === "quote" ? "quoteReady" : "invoiceReady";
  if (!isCustomerEmailEnabled(notification)) {
    return;
  }

  const label = input.documentType === "quote" ? "Quote" : "Invoice";
  const formattedTotal = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: input.currency || "GBP",
  }).format(input.total);

  const html = await getDocumentEmailHtml({
    documentType: input.documentType,
    title: input.title,
    recipientName: input.recipientName,
    total: input.total,
    currency: input.currency,
    pdfUrl: input.pdfUrl,
  });

  await sendEmail({
    to: [input.recipientEmail],
    from: SUPPORT_EMAIL,
    subject: emailTemplate.document.subject(label, input.title),
    text: [
      `Hello ${input.recipientName},`,
      "",
      `Your ${input.documentType} "${input.title}" is ready.`,
      `Total: ${formattedTotal}`,
      `View/download: ${input.pdfUrl}`,
      "",
      emailTemplate.brand.name,
    ].join("\n"),
    html,
  });
}

export async function sendCustomerMessageEmail(
  input: CustomerMessageEmailInput
): Promise<void> {
  if (!isCustomerEmailEnabled(input.notification)) {
    return;
  }

  const html = await getCustomerMessageEmailHtml({
    recipientName: input.recipientName,
    subject: input.subject,
    body: input.body,
  });

  await sendEmail({
    to: [input.recipientEmail],
    from: NO_REPLY_EMAIL,
    subject: emailTemplate.customerMessage.subject(input.subject),
    text: [
      `Hello ${input.recipientName},`,
      "",
      emailTemplate.customerMessage.textIntro,
      "",
      input.body,
      "",
      emailTemplate.brand.name,
    ].join("\n"),
    html,
  });
}

export async function sendSupportMessageEmail(
  input: SupportMessageEmailInput
): Promise<void> {
  if (!isSupportEmailEnabled(input.notification)) {
    return;
  }

  const html = await getSupportMessageEmailHtml({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subject: input.subject,
    body: input.body,
  });

  await sendEmail({
    to: [SUPPORT_EMAIL],
    from: NO_REPLY_EMAIL,
    subject: emailTemplate.supportMessage.subject(input.subject),
    text: [
      `Customer: ${input.customerName}`,
      `Email: ${input.customerEmail || "Not provided"}`,
      "",
      input.body,
    ].join("\n"),
    html,
  });
}

export async function sendCustomerWelcomeEmail(
  input: CustomerWelcomeEmailInput
): Promise<void> {
  if (!isCustomerEmailEnabled("accountWelcome")) {
    return;
  }

  const html = await getCustomerWelcomeEmailHtml({
    recipientName: input.recipientName,
    companyName: input.companyName,
    signInUrl: input.signInUrl,
    password: input.password,
  });

  await sendEmail({
    to: [input.recipientEmail],
    from: SUPPORT_EMAIL,
    subject: emailTemplate.customerWelcome.subject(input.companyName),
    text: [
      `Hello ${input.recipientName},`,
      "",
      emailTemplate.customerWelcome.textIntro(input.companyName),
      `${emailTemplate.customerWelcome.signInTextLabel}: ${input.signInUrl}`,
      `${emailTemplate.customerWelcome.temporaryPasswordLabel}: ${input.password}`,
      "",
      emailTemplate.customerWelcome.passwordNotice,
      "",
      emailTemplate.brand.name,
    ].join("\n"),
    html,
  });
}
