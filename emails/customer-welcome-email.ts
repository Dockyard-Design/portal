import {
  getEmailLayout,
  getEmailHeader,
  getEmailFooter,
  getEmailButton,
  getEmailHeading,
  getEmailMetaRow,
  getEmailPanel,
  getEmailSpacer,
  getGreeting,
  escapeHtml,
  styles,
} from "./base-template";
import { emailTemplate } from "@/config/templates";

interface CustomerWelcomeEmailProps {
  recipientName: string;
  companyName: string;
  signInUrl: string;
  password: string;
}

export function getCustomerWelcomeEmailHtml({
  recipientName,
  companyName,
  signInUrl,
  password,
}: CustomerWelcomeEmailProps): string {
  const content = `
    ${getEmailHeader()}
    ${getEmailHeading({
      eyebrow: emailTemplate.customerWelcome.eyebrow,
      title: emailTemplate.customerWelcome.title,
      body: emailTemplate.customerWelcome.body(companyName),
    })}
    ${getGreeting({ name: recipientName })}
    ${getEmailPanel(`
      <p style="margin:0 0 10px;color:${styles.text};font-size:14px;font-weight:800;">${escapeHtml(emailTemplate.customerWelcome.panelTitle)}</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${getEmailMetaRow({ label: "Sign in URL", value: signInUrl })}
        <tr>
          <td style="padding:12px 0 0;">
            <p style="margin:0 0 4px;color:${styles.textMuted};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(emailTemplate.customerWelcome.temporaryPasswordLabel)}</p>
            <p style="margin:0;color:${styles.text};font-size:18px;font-weight:800;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;letter-spacing:0.5px;">${escapeHtml(password)}</p>
          </td>
        </tr>
      </table>
    `)}
    ${getEmailSpacer(18)}
    <tr>
      <td style="padding:0 0 24px;color:${styles.textMuted};font-size:14px;">
        ${escapeHtml(emailTemplate.customerWelcome.passwordNotice)}
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 4px;">${getEmailButton({ href: signInUrl, children: emailTemplate.customerWelcome.buttonLabel })}</td>
    </tr>
    ${getEmailFooter()}
  `;

  return getEmailLayout({
    previewText: emailTemplate.customerWelcome.preview(companyName),
    children: content,
  });
}
