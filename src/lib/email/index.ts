/**
 * Transactional email — SendGrid v3 via the dependency-light fetch style
 * the platform uses (docs/integrations/email-sendgrid.md). No package to
 * install; server-side only. Stays a clean no-op returning { sent: false }
 * until SENDGRID_API_KEY is set, the same pattern the data layer used
 * before its Airtable swap.
 *
 * Verified sender domain travelify.io, display name "Travelgenix".
 */

const SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send";
const DEFAULT_FROM = "noreply@travelify.io";
const FROM_NAME = "Travelgenix";

export interface SendEmailOptions {
  to: string;
  subject: string;
  /** Plain-text body, always provided. */
  text: string;
  /** Inline-CSS HTML only, no external images. */
  html?: string;
}

export interface SendEmailResult {
  sent: boolean;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY);
}

export async function send(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    // Not wired yet: no-op so callers record "not sent" honestly.
    return { sent: false };
  }

  const from = process.env.ONBOARDING_FROM_EMAIL || DEFAULT_FROM;
  const fromName = process.env.ONBOARDING_FROM_NAME || FROM_NAME;

  try {
    const response = await fetch(SENDGRID_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: from, name: fromName },
        subject: options.subject,
        content: [
          { type: "text/plain", value: options.text },
          ...(options.html
            ? [{ type: "text/html", value: options.html }]
            : []),
        ],
      }),
    });
    if (!response.ok) {
      console.error(`[email] SendGrid responded ${response.status}`);
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] send failed:", error);
    return { sent: false };
  }
}
