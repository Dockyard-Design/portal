import {
  getEmailLayout,
  getEmailHeader,
  getEmailFooter,
  getEmailButton,
  getEmailHeading,
  getEmailPanel,
  getEmailSpacer,
  getGreeting,
  escapeHtml,
  styles,
} from "./base-template";
import { emailTemplate } from "@/config/templates";

interface DocumentEmailProps {
  documentType: "quote" | "invoice";
  title: string;
  recipientName: string;
  total: number;
  currency?: string;
  pdfUrl: string;
}

export function getDocumentEmailHtml({
  documentType,
  title,
  recipientName,
  total,
  currency = "GBP",
  pdfUrl,
}: DocumentEmailProps): string {
  const label = documentType === "quote" ? "Quote" : "Invoice";
  const formattedTotal = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(total);

  const content = `
    ${getEmailHeader()}
    ${getEmailHeading({
      eyebrow: emailTemplate.document.readyEyebrow(label),
      title: title,
      body: emailTemplate.document.body(documentType),
    })}
    ${getGreeting({ name: recipientName })}
    ${getEmailPanel(`
      <p style="margin:0 0 6px;color:${styles.textMuted};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Total</p>
      <p style="margin:0;color:${styles.text};font-size:32px;line-height:1.15;font-weight:800;">
        ${formattedTotal}
      </p>
    `)}
    ${getEmailSpacer(20)}
    <tr>
      <td style="padding:0 0 8px;">${getEmailButton({ href: pdfUrl, children: emailTemplate.document.buttonLabel(label) })}</td>
    </tr>
    <tr>
      <td>
        <a href="${escapeHtml(pdfUrl)}" style="font-size:13px;color:${styles.textMuted};">${escapeHtml(emailTemplate.document.downloadLabel)}</a>
      </td>
    </tr>
    ${getEmailFooter()}
  `;

  return getEmailLayout({
    previewText: emailTemplate.document.preview(label),
    children: content,
  });
}
