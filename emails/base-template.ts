const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://dockyard.design";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

function formatDetailValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

const styles = {
  background: "#0f1728",
  surface: "#152033",
  surfaceRaised: "#1b2a42",
  surfaceSoft: "#22324d",
  border: "#31415d",
  borderStrong: "#4f6788",
  text: "#f7fbff",
  textMuted: "#a8b6ca",
  primary: "#63c7ff",
  primaryDark: "#14324a",
  accent: "#f4c95d",
  success: "#6ee7b7",
};

function getEmailHeader(): string {
  return `
    <tr>
      <td style="padding:0 0 28px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:middle;">
              <img
                src="${BASE_URL}/logo.svg"
                alt="Dockyard"
                width="164"
                style="height:auto;display:block;border:0;outline:none;text-decoration:none;"
              />
            </td>
            <td align="right" style="vertical-align:middle;">
              <span style="display:inline-block;border:1px solid ${styles.border};border-radius:999px;padding:7px 11px;color:${styles.textMuted};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">
                Portal
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function getEmailFooter(): string {
  return `
    <tr>
      <td style="padding:30px 0 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-top:1px solid ${styles.border};">
          <tr>
            <td style="padding:22px 0 0;color:${styles.textMuted};font-size:13px;">
              <p style="margin:0 0 6px;color:${styles.text};font-weight:700;">Dockyard Design</p>
              <p style="margin:0;">Project delivery, documents and client communication.</p>
            </td>
            <td align="right" style="padding:22px 0 0;font-size:13px;">
              <a href="${BASE_URL}" style="color:${styles.primary};text-decoration:none;font-weight:700;">dockyard.design</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function getEmailButton({ href, children }: { href: string; children: string }): string {
  return `
    <a 
      href="${escapeHtml(href)}" 
      style="
        display:inline-block;
        background:${styles.primary};
        color:${styles.background};
        padding:13px 20px;
        border-radius:8px;
        text-decoration:none;
        font-weight:800;
        font-size:15px;
        letter-spacing:0.1px;
      "
    >
      ${escapeHtml(children)}
    </a>
  `;
}

function getEmailHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}): string {
  return `
    <tr>
      <td style="padding:0 0 22px;">
        ${
          eyebrow
            ? `<p style="margin:0 0 10px;color:${styles.accent};font-size:12px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>`
            : ""
        }
        <h1 style="margin:0;color:${styles.text};font-size:28px;line-height:1.16;font-weight:800;">${escapeHtml(title)}</h1>
        ${
          body
            ? `<p style="margin:12px 0 0;color:${styles.textMuted};font-size:15px;line-height:1.65;">${escapeHtml(body)}</p>`
            : ""
        }
      </td>
    </tr>
  `;
}

function getEmailPanel(children: string): string {
  return `
    <tr>
      <td style="padding:18px 18px;border:1px solid ${styles.border};border-radius:10px;background:${styles.surfaceRaised};">
        ${children}
      </td>
    </tr>
  `;
}

function getEmailMetaRow({ label, value }: { label: string; value: string }): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${styles.border};">
        <p style="margin:0 0 4px;color:${styles.textMuted};font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(label)}</p>
        <p style="margin:0;color:${styles.text};font-size:15px;font-weight:700;word-break:break-word;">${escapeHtml(value)}</p>
      </td>
    </tr>
  `;
}

function getEmailSpacer(size = 18): string {
  return `<tr><td style="height:${size}px;font-size:${size}px;line-height:${size}px;">&nbsp;</td></tr>`;
}

function getEmailLayout({
  previewText,
  children,
}: {
  previewText?: string;
  children: string;
}): string {
  const preview = previewText
    ? `<span style="display:none;visibility:hidden;">${escapeHtml(previewText)}</span>`
    : "";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
  </head>
  <body style="margin:0;padding:0;background-color:${styles.background};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">
    ${preview}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${styles.background};min-width:320px;">
      <tr>
        <td align="center" style="padding:42px 18px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
            <tr>
              <td style="border:1px solid ${styles.border};border-radius:14px;background:${styles.surface};padding:30px;box-shadow:0 20px 60px rgba(0,0,0,0.26);">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${children}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

function getGreeting({ name }: { name?: string }): string {
  if (!name) return "";
  return `
    <tr>
      <td style="padding:0 0 16px;">
        <p style="margin:0;font-size:17px;font-weight:700;color:${styles.text};">Hello ${escapeHtml(name)},</p>
      </td>
    </tr>
  `;
}

export {
  getEmailLayout,
  getEmailHeader,
  getEmailFooter,
  getEmailButton,
  getEmailHeading,
  getEmailPanel,
  getEmailMetaRow,
  getEmailSpacer,
  getGreeting,
  escapeHtml,
  formatDetailValue,
  styles,
};
