import {
  getEmailLayout,
  getEmailHeader,
  getEmailFooter,
  getEmailHeading,
  escapeHtml,
  formatDetailValue,
  styles,
} from "./base-template";
import { emailTemplate } from "@/config/templates";

interface FormSubmissionEmailProps {
  formName: string;
  submittedAt: string;
  details: Record<string, string | number | boolean | null | undefined>;
}

export function getFormSubmissionEmailHtml({
  formName,
  submittedAt,
  details,
}: FormSubmissionEmailProps): string {
  const rows = Object.entries(details)
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      return `
        <tr>
          <td style="text-align:left;padding:13px 0;border-bottom:1px solid ${styles.border};font-weight:700;color:${styles.text};font-size:14px;">
            ${escapeHtml(label)}
          </td>
          <td style="text-align:right;padding:13px 0;border-bottom:1px solid ${styles.border};color:${styles.textMuted};font-size:14px;">
            ${escapeHtml(formatDetailValue(value))}
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    ${getEmailHeader()}
    ${getEmailHeading({
      eyebrow: emailTemplate.formSubmission.eyebrow,
      title: emailTemplate.formSubmission.title(formName),
      body: emailTemplate.formSubmission.body(submittedAt),
    })}
    <tr>
      <td style="padding:2px 18px 6px;border:1px solid ${styles.border};border-radius:10px;background:${styles.surfaceRaised};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tbody>${rows}</tbody>
        </table>
      </td>
    </tr>
    ${getEmailFooter()}
  `;

  return getEmailLayout({
    previewText: emailTemplate.formSubmission.preview(formName),
    children: content,
  });
}
