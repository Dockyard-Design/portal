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
  const html = await getFormSubmissionEmailHtml({
    formName: input.formName,
    submittedAt: input.submittedAt,
    details: input.details,
  });

  await sendEmail({
    to: [SUPPORT_EMAIL],
    from: SUPPORT_EMAIL,
    subject: `${input.formName} submission`,
    text: `${input.formName} submission\nSubmitted at: ${input.submittedAt}\n${getTextVersion(input.details)}`,
    html,
  });
}

export async function sendDocumentEmail(input: DocumentEmailInput): Promise<void> {
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
    subject: `${label}: ${input.title}`,
    text: [
      `Hello ${input.recipientName},`,
      "",
      `Your ${input.documentType} "${input.title}" is ready.`,
      `Total: ${formattedTotal}`,
      `View/download: ${input.pdfUrl}`,
      "",
      "Dockyard Design",
    ].join("\n"),
    html,
  });
}

export async function sendCustomerMessageEmail(
  input: CustomerMessageEmailInput
): Promise<void> {
  const html = await getCustomerMessageEmailHtml({
    recipientName: input.recipientName,
    subject: input.subject,
    body: input.body,
  });

  await sendEmail({
    to: [input.recipientEmail],
    from: NO_REPLY_EMAIL,
    subject: `New portal message: ${input.subject}`,
    text: [
      `Hello ${input.recipientName},`,
      "",
      "You have a new message in your Dockyard portal.",
      "",
      input.body,
      "",
      "Dockyard Design",
    ].join("\n"),
    html,
  });
}

export async function sendSupportMessageEmail(
  input: SupportMessageEmailInput
): Promise<void> {
  const html = await getSupportMessageEmailHtml({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    subject: input.subject,
    body: input.body,
  });

  await sendEmail({
    to: [SUPPORT_EMAIL],
    from: NO_REPLY_EMAIL,
    subject: `Customer portal message: ${input.subject}`,
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
  const html = await getCustomerWelcomeEmailHtml({
    recipientName: input.recipientName,
    companyName: input.companyName,
    signInUrl: input.signInUrl,
    password: input.password,
  });

  await sendEmail({
    to: [input.recipientEmail],
    from: SUPPORT_EMAIL,
    subject: `Your Dockyard portal account for ${input.companyName}`,
    text: [
      `Hello ${input.recipientName},`,
      "",
      `Your Dockyard portal account for ${input.companyName} is ready.`,
      `Sign in: ${input.signInUrl}`,
      `Temporary password: ${input.password}`,
      "",
      "You will be asked to change this password after your first sign-in.",
      "",
      "Dockyard Design",
    ].join("\n"),
    html,
  });
}