type ConfirmSignupEmailParams = {
  username: string;
  confirmUrl: string;
};

export function confirmSignupSubject() {
  return "Confirm your KOINA account";
}

export function confirmSignupText({
  username,
  confirmUrl,
}: ConfirmSignupEmailParams) {
  return [
    `Hey ${username},`,
    "",
    "Welcome to KOINA. Open this link, then press Confirm email on the page to finish signing up:",
    "",
    confirmUrl,
    "",
    "If you didn’t create this account, you can ignore this email.",
  ].join("\n");
}

export function confirmSignupHtml({
  username,
  confirmUrl,
}: ConfirmSignupEmailParams) {
  const safeName = escapeHtml(username);
  const safeUrl = escapeHtml(confirmUrl);

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f4f1;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4f1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e4de;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#0B111D;padding:20px 24px;">
                <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">KOINA</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;">Confirm your email</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
                  Hey ${safeName}, thanks for joining. Open the link below, then press <strong>Confirm email</strong> on the page. After that you can sign in.
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#E85A32;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:6px;">
                    Open confirmation page
                  </a>
                </p>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#7a7a7a;">
                  Or paste this link into your browser:
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;color:#7a7a7a;">
                  ${safeUrl}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 24px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#9a9a9a;">
                  If you didn’t create a KOINA account, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
