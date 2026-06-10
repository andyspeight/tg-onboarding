/**
 * Transactional email — the seam, stubbed.
 *
 * Provider is locked platform-wide: SendGrid v3, verified travelify.io
 * sender, display name "Travelgenix". Never Brevo (marketing-only), never a
 * new provider. Full conventions: docs/integrations/email-sendgrid.md.
 *
 * The Phase 2 automation slice wires this with @sendgrid/mail and the
 * onboarding from-email; until then every send is a clean no-op, the same
 * pattern the data layer used before its Airtable swap.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  /** Plain-text body. Always provided; the html variant is optional. */
  text: string;
  /** Inline-CSS HTML only, no external images (email client conventions). */
  html?: string;
}

export interface SendEmailResult {
  sent: boolean;
}

export async function send(_options: SendEmailOptions): Promise<SendEmailResult> {
  // Stub until the automation slice. Returns sent:false so callers can
  // record "not sent" honestly rather than pretending.
  return { sent: false };
}
