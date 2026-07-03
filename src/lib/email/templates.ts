/**
 * Onboarding email templates. Inline CSS only, no external images, plain
 * "Travelgenix" voice (humaniser rules: warm, plain, no em dashes, no AI
 * tells). Each returns subject + text + html for the SendGrid seam.
 */

const APP_BASE = process.env.APP_BASE_URL || "https://tg-onboarding-gamma.vercel.app";

function shell(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1a2e;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:24px 0;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8ecf0;border-radius:10px;overflow:hidden;">
<tr><td style="background:#0d4f4f;padding:18px 24px;"><span style="color:#ffffff;font-size:17px;font-weight:800;">travelgenix</span></td></tr>
<tr><td style="padding:24px;">${bodyHtml}</td></tr>
<tr><td style="padding:0 24px 24px;color:#7c8493;font-size:12px;line-height:1.5;">You're getting this because Travelgenix is setting up your new website. Questions? Just reply and your account manager will pick it up.</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0d4f4f;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:8px;">${label}</a>`;
}

export interface Template {
  subject: string;
  text: string;
  html: string;
}

export function welcomeEmail(firstName: string, company: string): Template {
  const subject = `Welcome to Travelgenix, ${firstName}`;
  const text = `Hi ${firstName},

Welcome aboard. We're getting ${company} ready to launch, and your onboarding portal is live now. It shows every step of the journey, what's with us and what's with you, all in one place.

Take a look whenever you're ready: ${APP_BASE}

We're looking forward to building something great with you.

The Travelgenix team`;
  const html = shell(
    `<p style="margin:0 0 14px;font-size:16px;font-weight:700;">Welcome aboard, ${firstName}</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6;">We're getting <strong>${company}</strong> ready to launch, and your onboarding portal is live now. It shows every step of the journey, what's with us and what's with you, all in one place.</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Take a look whenever you're ready.</p>
<p style="margin:0;">${button(APP_BASE, "Open your portal")}</p>`,
  );
  return { subject, text, html };
}

export function accessCodeEmail(
  firstName: string,
  company: string,
  email: string,
  code: string,
): Template {
  const loginUrl = `${APP_BASE}/login`;
  const subject = "Your Travelgenix portal login";
  const text = `Hi ${firstName},

Here's your login for the ${company} onboarding portal.

Sign in at: ${loginUrl}
Your email: ${email}
Your access code: ${code}

Keep the code somewhere safe. If you ever lose it, no problem, your account manager can issue a fresh one in seconds.

The Travelgenix team`;
  const html = shell(
    `<p style="margin:0 0 14px;font-size:16px;font-weight:700;">Your portal login, ${firstName}</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6;">Here's your login for the <strong>${company}</strong> onboarding portal.</p>
<p style="margin:0 0 14px;padding:12px 16px;background:#f7f8fa;border-radius:8px;font-size:14px;line-height:1.8;">Your email: <strong>${email}</strong><br/>Your access code: <strong style="letter-spacing:0.05em;">${code}</strong></p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Keep the code somewhere safe. If you ever lose it, no problem, your account manager can issue a fresh one in seconds.</p>
<p style="margin:0;">${button(loginUrl, "Sign in to your portal")}</p>`,
  );
  return { subject, text, html };
}

export function reminderEmail(
  firstName: string,
  taskTitle: string,
  whenLabel: string,
): Template {
  const subject = `A quick nudge: ${taskTitle}`;
  const text = `Hi ${firstName},

Just a friendly nudge that "${taskTitle}" is ${whenLabel}. It's one of the steps we need from you to keep your launch moving.

You can pick it up here: ${APP_BASE}

No rush beyond that, and shout if anything's in your way.

The Travelgenix team`;
  const html = shell(
    `<p style="margin:0 0 14px;font-size:16px;font-weight:700;">A quick nudge, ${firstName}</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6;"><strong>${taskTitle}</strong> is ${whenLabel}. It's one of the steps we need from you to keep your launch moving.</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Shout if anything's in your way.</p>
<p style="margin:0;">${button(APP_BASE, "Pick it up")}</p>`,
  );
  return { subject, text, html };
}

export function milestoneEmail(
  firstName: string,
  pct: number,
): Template {
  const subject = `You're ${pct}% of the way to launch`;
  const text = `Hi ${firstName},

Nice work, you've hit ${pct}% on your onboarding. That's real momentum, and it shows.

See what's next: ${APP_BASE}

The Travelgenix team`;
  const html = shell(
    `<p style="margin:0 0 14px;font-size:16px;font-weight:700;">${pct}% of the way there, ${firstName}</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Nice work. That's real momentum, and it shows. Here's what's next whenever you're ready.</p>
<p style="margin:0;">${button(APP_BASE, "See what's next")}</p>`,
  );
  return { subject, text, html };
}

export function wiltingAlertEmail(
  managerName: string,
  company: string,
  contactName: string,
  reasons: string[],
  clientUrl: string,
): Template {
  const subject = `Onboarding needs a look: ${company}`;
  const reasonLine = reasons.join(". ");
  const text = `Hi ${managerName},

${company} (${contactName}) could use a check-in. ${reasonLine}.

Open their file: ${clientUrl}

The Travelgenix onboarding tool`;
  const html = shell(
    `<p style="margin:0 0 14px;font-size:16px;font-weight:700;">${company} needs a look</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6;">${contactName}'s onboarding could use a check-in. ${reasonLine}.</p>
<p style="margin:0;">${button(clientUrl, "Open their file")}</p>`,
  );
  return { subject, text, html };
}

/** Client-typed text goes into HTML email — escape it at the boundary. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function newMessageEmail(
  company: string,
  contactName: string,
  rawPreview: string,
  lunaAnswered: boolean,
  clientUrl: string,
): Template {
  const preview = escapeHtml(rawPreview);
  const subject = `New message from ${company}`;
  const lunaLine = lunaAnswered
    ? "Luna answered straight away from the knowledge base; worth a quick check that it landed right."
    : "Nothing has gone back to them yet.";
  const text = `${contactName} at ${company} just wrote in:

"${rawPreview}"

${lunaLine}

Reply from their file: ${clientUrl}

The Travelgenix onboarding tool`;
  const html = shell(
    `<p style="margin:0 0 14px;font-size:16px;font-weight:700;">New message from ${company}</p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.6;">${contactName} just wrote in:</p>
<p style="margin:0 0 14px;padding:12px 16px;background:#f7f8fa;border-radius:8px;font-size:14px;line-height:1.6;font-style:italic;">"${preview}"</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">${lunaLine}</p>
<p style="margin:0;">${button(clientUrl, "Open the thread")}</p>`,
  );
  return { subject, text, html };
}
