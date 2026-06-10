# Integration: Transactional Email (SendGrid)

> Platform reference supplied by Andy, 10 Jun 2026. How the platform sends transactional email, so the onboarding tool reuses it instead of adding a new provider. Read this before building any email, notification or nudge sending.

## TL;DR for this build
- The platform's transactional email provider is **SendGrid**. Use it. Do **not** add Resend (evaluated and dropped), Nodemailer/SMTP, SES, Postmark, or any other provider.
- **Brevo** is a separate system used only for **Luna Marketing** bulk/marketing campaigns (the AI composer to `email-send-now.js`). That is not the transactional path. Do not use Brevo for onboarding email.
- **Phase 1 likely sends no email at all** (real nudge/alert automation is out of scope for Phase 1). Put email behind a thin **seam** and stub it in Phase 1, the same way the data layer is stubbed at `src/lib/onboarding/data.ts`. Wire it to SendGrid in a later slice.

## How SendGrid is set up across the platform
- Provider: **SendGrid v3 API**. In use for My Booking confirmation emails, Widget Suite auth emails (password reset, migration notice, colleague invite, password-changed), Enquiry Form routing and auto-reply, and Quick Quote PDF emails.
- Verified sender **domain: `travelify.io`** (e.g. `noreply@travelify.io`).
- **Display name is set to "Travelgenix"** on every email, so the brand the user sees is Travelgenix even though the technical sending domain is `travelify.io`. This avoids needing a second verified sender.
- Env vars (the convention already on the `tg-widgets` Vercel project):
  - `SENDGRID_API_KEY` — the constant across every product.
  - a from-email var, a verified `travelify.io` sender (named per product, e.g. `SENDGRID_FROM_EMAIL` for auth, `QUOTE_PDF_FROM_EMAIL` for Quick Quote).
  - an optional from-name var that defaults to `"Travelgenix"`.
  - `APP_BASE_URL` for building links inside emails.

## Two implementation styles in the codebase (use the cleaner one)
- **`@sendgrid/mail` package** — `sg.setApiKey(process.env.SENDGRID_API_KEY); await sg.send({ to, from:{ email, name }, subject, text, html, attachments })`. Quick Quote uses this. For a Next.js app this is the clean choice.
- **Direct v3 API via `fetch`** with `Authorization: Bearer ${SENDGRID_API_KEY}` — the auth and enquiry routes use a dependency-light inline version.

## Template conventions
- Inline HTML with all CSS inlined (email clients strip `<style>` blocks).
- No external images (keeps the trust signal high and avoids blocked-image rendering).
- From name `"Travelgenix"`.

## For the onboarding tool
- Define an email seam, e.g. `src/lib/email/` exposing a single `send(opts)` function. Phase 1: stub it (log / no-op, return `{ sent: false }`) when `SENDGRID_API_KEY` is absent, exactly the pattern the data layer uses.
- When wired: use `@sendgrid/mail`, read `SENDGRID_API_KEY` plus an onboarding-specific from-email (a verified `travelify.io` sender) and from-name defaulting to `"Travelgenix"`. Inline-HTML templates, no external images.
- Likely onboarding emails (later phases): welcome, phase nudges (task-specific, never generic nag emails), colleague invite, go-live confirmation.
- Setup note: `tg-onboarding` is its own Vercel project, so `SENDGRID_API_KEY` and the from-email must be set on it. The SendGrid account and the verified `travelify.io` domain can be reused, no new sender verification needed.

## Do NOT
- Add Resend, Nodemailer/SMTP, AWS SES, Postmark, or any new provider.
- Use Brevo (that is the marketing-campaign pipeline, not transactional).
- Hardcode the API key. Env var only, server-side only, never in client code.
- Build email sending in Phase 1 beyond the stubbed seam.

## Status in this repo
- Seam in place at `src/lib/email/index.ts`, stubbed (returns `{ sent: false }`).
- Wiring (`@sendgrid/mail`, onboarding from-email, env vars on the tg-onboarding Vercel project) lands with the Phase 2 automation slice — see `docs/phase-2-spec.md`.
