# Phase 1 sign-off review — client welcome portal

> Prepared 10 June 2026 against `docs/phase-1-spec.md` (definition of done) and the `travelgenix-security` pre-deploy checklist. Status: **ready for Andy's sign-off**. Live at tg-onboarding-gamma.vercel.app, reading and writing the TG Onboarding Airtable base (`appOSIsT3wpkTmit9`).

## Definition of done — item by item

| Spec requirement | Status | Evidence |
|---|---|---|
| Land and see the seven-phase journey with a live progress bar | ✅ | Welcome landing per approved prototype; journey + progress served live from Airtable (ISR 60s), verified on production |
| Work through the active phase's checklist | ✅ | Tri-state tasks with owner badges and due labels; client ticks persist to the Tasks table (verified live 10 Jun, task `recHrGmh3qW4FY4Sw` → done); Travelgenix-owned and internal tasks reject client writes server-side |
| Upload content | ✅ | Document hub + intake logo field store real files in the Documents table via Airtable's content endpoint (verified live 10 Jun); 3MB/file interim cap (Vercel body limit), type allowlists both sides |
| Complete the tier-aware intake | ✅ | Boost sees Suppliers; Spark never receives that section (filtered server-side). Answers persist to Intake Responses and prefill on reload. Supplier multi-selects driven by the curated Suppliers table |
| View training | ✅ | Training tab indexes all journey content by phase with per-item completion persisted (Training Completions). Content URLs pending: fill the URL column in the Training table and slots go live |
| Hit the confidence gate before go-live | ✅ | 7/10 gate on Go-Live Prep; every rating stored in Confidence Ratings (verified live: score 6 → gate correctly stayed locked) |
| Built to match `reference/onboarding-prototype.html` in look, feel and behaviour | ✅ | Reconciled in slices 1–2, approved by Andy on the live URL. Deliberate deviations, all skill-driven: SVG icons instead of emoji, WCAG-passing greys, mobile layout and dark mode added, light as hard default, 1024px column (Andy's request) |
| Passes the `travelgenix-security` pre-deploy checklist | ✅ with 3 documented interims | See below |
| All client-facing copy passes `travelgenix-humanizer` | ✅ | Full sweep done (em dashes removed including page title); rendered pages verified clean |

Anti-wilting mechanics, all live: visible progress bar; task-specific nudges in the notification bell (Notifications table); engagement capture from day one (Engagement Signals + Last Active on every action, verified); confidence gate enforced.

Luna AI seam in place and stubbed (`src/lib/luna/`), entry point in the UI, per the locked decision.

## Security pre-deploy checklist

**Secrets** ✅ — PAT and base id in env only (Vercel + `.env.local`); `.env*` gitignored; env read only in server modules (no `process.env` anywhere in components, verified); no secret logging; PAT scoped to the one base with `data.records:read/write` only.

**API routes** ✅ — POST-only (auto-405 otherwise); same-origin check; per-IP rate limits (60/min tasks, 30 training, 10 intake, 10 confidence, 5 uploads); body caps (10KB JSON, 4.4MB uploads); strict allowlist validation per field; generic error responses with detail server-side only; all guards verified by test (403/400/405/413/429/503).

**Client code** ✅ — no `innerHTML`/`eval`; React escaping throughout; theme script is a static constant; only first-party requests.

**Airtable** ✅ — stable field IDs; no user input in any filter formula (filtering in code); writes validate and strip unknown fields; write-path ownership checks.

**Transport** ✅ — HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy on every response; no cookies in use.

**PII** ✅ — fictitious demo data only; minimal client fields.

**Documented interims (accepted for sandbox, must close before real client data):**
1. **No client auth.** Control SSO/magic links are a later phase by locked decision. Until then the portal is single-tenant: routes resolve the demo client server-side and the browser never supplies a client id. Do not load real client data before auth lands.
2. **Rate limiting is in-memory per serverless instance.** Swap to a shared store (e.g. Upstash) alongside auth.
3. **No CSP header yet.** Needs nonce wiring for Next's inline runtime; queued with the auth work. Baseline headers are in place.
4. **Dependency note:** one moderate `npm audit` finding in postcss vendored inside next 16.2.7 (XSS in stringifying untrusted CSS, which we never do). Clears with a future Next patch.

## What remains before/after sign-off

- **Andy:** fill Training URLs in the base when ready (slots go live automatically); give Phase 1 sign-off.
- **Phase 2 (next):** internal dashboard, wilting alerts reading Engagement Signals, supplier admin UI, client messaging, auth + the security interims above.
- **Phase 3:** delight features (milestone moments etc.), per the locked phasing.
