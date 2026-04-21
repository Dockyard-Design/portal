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
      eyebrow: "Account ready",
      title: "Your Dockyard portal is live",
      body: `The workspace for ${companyName} is ready. Use the temporary password below for your first sign-in.`,
    })}
    ${getGreeting({ name: recipientName })}
    ${getEmailPanel(`
      <p style="margin:0 0 10px;color:${styles.text};font-size:14px;font-weight:800;">Login details</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${getEmailMetaRow({ label: "Sign in URL", value: signInUrl })}
        <tr>
          <td style="padding:12px 0 0;">
            <p style="margin:0 0 4px;color:${styles.textMuted};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Temporary password</p>
            <p style="margin:0;color:${styles.text};font-size:18px;font-weight:800;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;letter-spacing:0.5px;">${escapeHtml(password)}</p>
          </td>
        </tr>
      </table>
    `)}
    ${getEmailSpacer(18)}
    <tr>
      <td style="padding:0 0 24px;color:${styles.textMuted};font-size:14px;">
        You will be asked to change this temporary password after your first sign-in.
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 4px;">${getEmailButton({ href: signInUrl, children: "Sign in to portal" })}</td>
    </tr>
    ${getEmailFooter()}
  `;

  return getEmailLayout({
    previewText: `Your Dockyard portal account for ${companyName}`,
    children: content,
  });
}
