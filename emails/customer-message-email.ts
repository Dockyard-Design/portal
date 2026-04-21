import {
  getEmailLayout,
  getEmailHeader,
  getEmailFooter,
  getEmailHeading,
  getGreeting,
  escapeHtml,
  styles,
} from "./base-template";

interface CustomerMessageEmailProps {
  recipientName: string;
  subject: string;
  body: string;
}

export function getCustomerMessageEmailHtml({
  recipientName,
  subject,
  body,
}: CustomerMessageEmailProps): string {
  const content = `
    ${getEmailHeader()}
    ${getEmailHeading({
      eyebrow: "New portal message",
      title: subject,
      body: "A new message is waiting for you in the Dockyard portal.",
    })}
    ${getGreeting({ name: recipientName })}
    <tr>
      <td style="padding:18px;border:1px solid ${styles.border};border-left:4px solid ${styles.primary};border-radius:10px;background:${styles.surfaceRaised};">
        <div style="white-space:pre-wrap;color:${styles.textMuted};font-size:14px;line-height:1.7;">${escapeHtml(body)}</div>
      </td>
    </tr>
    ${getEmailFooter()}
  `;

  return getEmailLayout({
    previewText: `New message: ${subject}`,
    children: content,
  });
}
