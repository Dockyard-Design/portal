import type {
  DocumentEmailInput,
  CustomerWelcomeEmailInput,
  FormSubmissionEmailInput,
  SendEmailInput,
} from "@/types/email";

const RESEND_API_URL = "https://api.resend.com/emails";
const SUPPORT_EMAIL = "support@dockyard.design";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDetailValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
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
  const rows = Object.entries(input.details)
    .map(([key, value]) => {
      const label = key
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return `<tr><th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(formatDetailValue(value))}</td></tr>`;
    })
    .join("");

  const text = [
    `${input.formName} submission`,
    `Submitted at: ${input.submittedAt}`,
    ...Object.entries(input.details).map(([key, value]) => `${key}: ${formatDetailValue(value)}`),
  ].join("\n");

  await sendEmail({
    to: [SUPPORT_EMAIL],
    from: SUPPORT_EMAIL,
    subject: `${input.formName} submission`,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
        <h1 style="font-size:20px;">${escapeHtml(input.formName)} submission</h1>
        <p>Submitted at ${escapeHtml(input.submittedAt)}.</p>
        <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:720px;">${rows}</table>
      </div>
    `,
  });
}

export async function sendDocumentEmail(input: DocumentEmailInput): Promise<void> {
  const label = input.documentType === "quote" ? "Quote" : "Invoice";
  const formattedTotal = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: input.currency || "GBP",
  }).format(input.total);

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
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
        <p>Hello ${escapeHtml(input.recipientName)},</p>
        <p>Your ${escapeHtml(input.documentType)} <strong>${escapeHtml(input.title)}</strong> is ready.</p>
        <p><strong>Total:</strong> ${escapeHtml(formattedTotal)}</p>
        <p><a href="${escapeHtml(input.pdfUrl)}">View or download the ${escapeHtml(label.toLowerCase())}</a></p>
        <p>Dockyard Design</p>
      </div>
    `,
  });
}

export async function sendCustomerWelcomeEmail(
  input: CustomerWelcomeEmailInput
): Promise<void> {
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
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;">
        <p>Hello ${escapeHtml(input.recipientName)},</p>
        <p>Your Dockyard portal account for <strong>${escapeHtml(input.companyName)}</strong> is ready.</p>
        <p><strong>Sign in:</strong> <a href="${escapeHtml(input.signInUrl)}">${escapeHtml(input.signInUrl)}</a></p>
        <p><strong>Temporary password:</strong> ${escapeHtml(input.password)}</p>
        <p>You will be asked to change this password after your first sign-in.</p>
        <p>Dockyard Design</p>
      </div>
    `,
  });
}
