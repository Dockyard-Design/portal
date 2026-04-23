import {
  getEmailLayout,
  getEmailHeader,
  getEmailFooter,
  getEmailHeading,
  getEmailMetaRow,
  getEmailPanel,
  getEmailSpacer,
  escapeHtml,
  styles,
} from "./base-template";
import { emailTemplate } from "@/config/templates";

interface SupportMessageEmailProps {
  customerName: string;
  customerEmail: string | null;
  subject: string;
  body: string;
}

export function getSupportMessageEmailHtml({
  customerName,
  customerEmail,
  subject,
  body,
}: SupportMessageEmailProps): string {
  const content = `
    ${getEmailHeader()}
    ${getEmailHeading({
      eyebrow: emailTemplate.supportMessage.eyebrow,
      title: subject,
      body: emailTemplate.supportMessage.body,
    })}
    ${getEmailPanel(`
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${getEmailMetaRow({ label: "Customer", value: customerName })}
        ${getEmailMetaRow({ label: "Email", value: customerEmail || "Not provided" })}
      </table>
    `)}
    ${getEmailSpacer(18)}
    <tr>
      <td style="padding:18px;border:1px solid ${styles.border};border-left:4px solid ${styles.accent};border-radius:10px;background:${styles.surfaceRaised};">
        <div style="white-space:pre-wrap;color:${styles.textMuted};font-size:14px;line-height:1.7;">${escapeHtml(body)}</div>
      </td>
    </tr>
    ${getEmailFooter()}
  `;

  return getEmailLayout({
    previewText: emailTemplate.supportMessage.preview(subject),
    children: content,
  });
}
