type VibeCodeRegistrationEmailParams = {
  firstName: string;
};

export function vibeCodeRegistrationSubject() {
  return "We've received your Vibe Code registration";
}

export function vibeCodeRegistrationText({
  firstName,
}: VibeCodeRegistrationEmailParams) {
  return [
    `Hey ${firstName},`,
    "",
    "Thanks for registering for Vibe Code — the free 4-night online workshop from KOINA.",
    "",
    "We've received your registration and will get back to you with next steps soon.",
    "",
    "Workshop details:",
    "• Wednesdays · 4 weeks",
    "• 10–11PM SGT on Zoom",
    "• Free · limited seats",
    "",
    "If you have questions in the meantime, reply to this email.",
    "",
    "— The KOINA team",
  ].join("\n");
}

export function vibeCodeRegistrationHtml({
  firstName,
}: VibeCodeRegistrationEmailParams) {
  const safeName = escapeHtml(firstName);

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#05081A;font-family:Arial,Helvetica,sans-serif;color:#edeff7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#05081A;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#0e1533;border:1px solid #1c2551;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#080d20;padding:20px 24px;border-bottom:1px solid #1c2551;">
                <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#f5a524;">Vibe Code</div>
                <div style="margin-top:6px;font-size:20px;font-weight:700;color:#edeff7;letter-spacing:-0.02em;">KOINA</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#edeff7;">Registration received</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#9aa3c4;">
                  Hey ${safeName}, thanks for signing up for <strong style="color:#edeff7;">Vibe Code</strong> — the free 4-night online workshop.
                </p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#9aa3c4;">
                  We've got your registration and <strong style="color:#edeff7;">will get back to you</strong> with next steps soon.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;background:#080d20;border:1px solid #1c2551;border-radius:6px;">
                  <tr>
                    <td style="padding:16px 18px;font-size:13px;line-height:1.7;color:#9aa3c4;">
                      <div><strong style="color:#f5a524;">Wednesdays</strong> · 4 weeks</div>
                      <div><strong style="color:#f5a524;">10–11PM</strong> SGT · Zoom</div>
                      <div><strong style="color:#f5a524;">Free</strong> · limited seats</div>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#9aa3c4;">
                  Questions? Just reply to this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 24px 24px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#6b7394;">
                  You received this because you registered for Vibe Code on koina.space.
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
