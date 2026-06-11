# Phase 2 Spec — Internal Dashboard, Auth & Anti-Wilting Automation

> Draft for Andy's review, 10 Jun 2026. Built from the approved prototype's admin view (`reference/onboarding-prototype.html`), the locked decisions, and Andy's scoping answers. Phase 3 (delight features) stays out of scope. Items marked **[Andy]** need his input before the relevant slice starts.

## Goal
The staff-facing half of the product: see every onboarding client's health at a glance, catch wilting before it becomes churn, automate the task-specific nudges, and run client setup end to end — while closing the Phase 1 security interims so real client data can come aboard.

## Decisions carried in (locked)
- **Staff access** uses the existing Travelgenix Control SSO by **introspection** (see `docs/integrations/sso-travelgenix-control.md`): a thin auth client forwards the `tg_session` cookie to `SSO_INTROSPECT_URL` (`/api/auth/me`), caches ~30s, fails closed, and reads the staff role from `permissions` for the `onboarding` product slug. No JWT secrets here, no new auth providers, `/api/auth/me` never modified.
- **Slice 1 prerequisites** (before the staff gate can work):
  1. This project gets a `*.travelify.io` subdomain so the cookie reaches it — **proposed: `onboarding.travelify.io`** [Andy to bless].
  2. The `onboarding` product row + role set registered in the Control base (`appAYzWZxvK6qlwXK`), mirroring Contract Loader — done at slice-1 time with Andy's go-ahead (it's the live shared auth base).
  3. `SSO_INTROSPECT_URL` set on this Vercel project [Andy to supply the value].
- **Deliberate deviation, internal surface only**: `/admin` **fails closed** when `SSO_INTROSPECT_URL` is unset (locked page, not the doc's auth-disabled demo mode — that convention suits client-facing products, not a staff dashboard). Local dev uses an explicit localhost-only bypass flag.
- **Clients do not go on SSO at signup.** Staff create client logins from the dashboard and issue a password (simple credential login for the portal). **[Andy: see open question in the review — Control already runs credential logins for client users of the Widget Suite, so the alternative is creating onboarding clients in Control from day one and skipping a parallel login system entirely.]**
- **Transactional email is SendGrid** (platform-wide convention — see `docs/integrations/email-sendgrid.md`): `@sendgrid/mail`, verified `travelify.io` sender with display name "Travelgenix", inline-HTML templates with no external images. Env on this Vercel project when the automation slice lands: `SENDGRID_API_KEY`, an onboarding from-email, `APP_BASE_URL`. Never Brevo (marketing-only) and no new providers. Seam already in place, stubbed, at `src/lib/email/`.
- **Milestone emails are Phase 2** (anti-wilting, not a Phase 3 delight feature).
- Anti-wilting rules from the original brief: nudges always reference a specific task; never a generic chase.

## The dashboard (per the approved prototype's admin view)
Lives at `/admin` in the same app, behind staff SSO. Reads the same TG Onboarding base.

1. **Overview**: stat cards (active onboardings, average progress, at risk, overdue tasks), the Wilting Alerts panel, and the Automation Log (what the engine sent and why).
2. **Client health list**: every client with health dot, progress, current phase, day count and intake completion; filters for on-track / slowing / at-risk; opens the client detail.
3. **Client detail**: the full journey including internal tasks, engagement history, confidence ratings, documents and intake answers — the staff view of what the client sees.
4. **Team tasks**: all internal/Travelgenix-owned tasks across clients, by due date, with overdue and urgent flags.
5. **Add client**: name, company, contact, package → creates the Clients row, stamps the seven-phase task template for that tier, creates the portal login, issues a first password and produces the welcome details to send.
6. **Suppliers admin**: manage the supplier list behind the intake multi-selects (the UI promised in Phase 1).

## Health rules (proposed — tune at review)
Computed from Last Active, Engagement Signals, task due dates and progress pace:
- **Green**: active in the last 4 days and no client-owned task overdue.
- **Amber (slowing)**: quiet for 5–9 days, or 1–2 client tasks overdue, or clearly behind pace (e.g. under 30% by day 21).
- **Red (at risk)**: quiet for 10+ days, or 3+ client tasks overdue, or no movement at all for 14 days.
Alerts fire on the *transition* into amber/red (no daily re-alerting), are logged, surfaced on the dashboard, and emailed to the account manager.

## Automation engine (scheduled job)
- Task-specific reminders to the client: 2 days before a due date, and the day after one is missed. In-portal notification always; email via SendGrid through the seam.
- Milestone emails at 50% and 75% progress.
- Welcome email on client creation (from the add-client flow, through the same seam).
- Wilting alert emails to staff on health transitions.
- Discipline: max one client email per day, UK working hours only, every send logged to the Automation Log.

## Client auth (closes the security interims)
> **Shipped 10 Jun**, with one deliberate simplification: staff-issued **access codes** instead of passwords. Codes are high-entropy random strings (`TG-XXXXX-XXXXX-XXXXX`, ~77 bits), so HMAC-SHA256 at rest (peppered by `CLIENT_AUTH_SECRET`) replaces bcrypt and there's nothing weak to force a change of — reissue from the dashboard replaces reset. Activation is explicit: **everything ships dark until `CLIENT_AUTH_SECRET` is set on Vercel**; until then the portal keeps the pinned-demo-client behaviour, so flipping auth on is an env change, not a deploy.
- `/login` for clients: email + access code → signed, expiring (30 days), httpOnly session cookie. Hard rate limit (5/min/IP), one generic error for every failure mode, dummy hash compare on unknown emails. Rotating `CLIENT_AUTH_SECRET` invalidates every session and every issued code, independently of the staff passcode.
- Staff side: "Portal access" card on the client detail — issue/reissue shows the code once, never stores plaintext, records issued-at and last-login.
- Portal multi-tenant: the journey resolves from the session inside `getClientJourney` (single enforcement point — new pages are protected by construction); every write route resolves the client from the cookie, never the request body. Per-client tables (tasks, documents, notifications, intake, confidence, completions, messages) are filtered server-side.
- Caching reshaped for per-session rendering: journey reads share a tagged 60s fetch cache; every Airtable write marks it stale (`revalidateTag`, SWR), so cross-client load stays flat.
- Still open from the interims list: shared-store rate limiting (in-memory per instance today) and the CSP header. **The no-real-client-data gate lifts once `CLIENT_AUTH_SECRET` is live and those two land.**

## Messaging panel
Agent-to-client messaging (per the Phase 1 spec's deferral): Messages tab goes live in the portal, with the staff side in the client detail view; task-linked threads as per the prototype.

## Luna AI wiring
Real contextual help through the Phase 1 seam (`src/lib/luna/`): server-side route, journey-aware context, costs capped per the security skill. **[Andy: confirmed as Phase 2? Read his scoping answer as yes — shout if it should wait for Phase 3.]**

## Proposed slice order
> 10 Jun update: Control SSO is **parked** (Andy's call). The staff gate ships as an interim shared passcode (`ADMIN_PASSCODE` env var, signed httpOnly session cookie, fails closed) and swaps for the Control introspection client when revived — the prerequisites list above still applies at that point.

1. ~~Staff SSO gate~~ Interim passcode gate + `/admin` shell — **shipped 10 Jun**
2. Overview + client health list (health rules live) + team tasks — **shipped 10 Jun**
3. Client detail view
4. Add client (provisioning + login issuance)
5. Client auth + multi-tenancy — **shipped 10 Jun** (access codes; dark until `CLIENT_AUTH_SECRET` set; rate-limit store + CSP still open)
6. Automation engine (nudges, milestones, alert emails via SendGrid) — **shipped 10 Jun**
   > Daily Vercel Cron (`/api/cron/automation`, 08:00 UTC, secured by `CRON_SECRET`). Reminders 2 days before / 1 day after a due date (in-portal always, email capped one-per-client-per-day), milestone emails at 50%/75%, staff wilting alerts (to `STAFF_ALERT_EMAIL`) at most weekly per level, UK weekdays only. Every action logged to the new Automation Log table (`tbl6JmGMnuRvHbYuc`), which also dedupes sends and powers the dashboard panel. Welcome email fires from the add-client flow. **Env to set when going live: `SENDGRID_API_KEY`, `ONBOARDING_FROM_EMAIL` (verified travelify.io sender), `APP_BASE_URL`, `CRON_SECRET`, `STAFF_ALERT_EMAIL`.** Until `SENDGRID_API_KEY` is set, sends are clean no-ops and still logged.
7. Suppliers admin — **shipped 10 Jun**
8. Messaging panel
9. Luna wiring
10. Control SSO swap-in (when revived)

## Out of scope (Phase 3)
Milestone *celebrations* in the portal, post-go-live transition flourishes, NPS surveys, and any delight features.
