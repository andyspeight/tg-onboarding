# Phase 2 Spec — Internal Dashboard, Auth & Anti-Wilting Automation

> Draft for Andy's review, 10 Jun 2026. Built from the approved prototype's admin view (`reference/onboarding-prototype.html`), the locked decisions, and Andy's scoping answers. Phase 3 (delight features) stays out of scope. Items marked **[Andy]** need his input before the relevant slice starts.

## Goal
The staff-facing half of the product: see every onboarding client's health at a glance, catch wilting before it becomes churn, automate the task-specific nudges, and run client setup end to end — while closing the Phase 1 security interims so real client data can come aboard.

## Decisions carried in (locked)
- **Staff access** uses the existing Travelgenix Control SSO. **[Andy: share how it's integrated — repo, docs or endpoint — before slice 1.]**
- **Clients do not go on SSO.** Staff create client logins from the dashboard and issue a password (simple credential login for the portal).
- **Transactional email** goes through the existing Sendrif wiring used by other Travelgenix developments. **[Andy: point at where it's wired (which repo/env keys) so we reuse the pattern.]**
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
- Task-specific reminders to the client: 2 days before a due date, and the day after one is missed. In-portal notification always; email via Sendrif.
- Milestone emails at 50% and 75% progress.
- Wilting alert emails to staff on health transitions.
- Discipline: max one client email per day, UK working hours only, every send logged to the Automation Log.

## Client auth (closes the security interims)
- `/login` for clients: email + staff-issued password, hashed at rest, sessions via secure httpOnly cookie, forced password change on first sign-in, staff reset from the dashboard. Storage approach (Airtable-held hashes vs a small auth service) decided at review.
- Portal becomes multi-tenant: every read/write scoped to the signed-in client (replaces the single-demo-client interim).
- Lands together with: shared-store rate limiting and the CSP header.
- **Gate: no real client data in the system before this slice ships.**

## Messaging panel
Agent-to-client messaging (per the Phase 1 spec's deferral): Messages tab goes live in the portal, with the staff side in the client detail view; task-linked threads as per the prototype.

## Luna AI wiring
Real contextual help through the Phase 1 seam (`src/lib/luna/`): server-side route, journey-aware context, costs capped per the security skill. **[Andy: confirmed as Phase 2? Read his scoping answer as yes — shout if it should wait for Phase 3.]**

## Proposed slice order
1. Staff SSO gate + `/admin` shell
2. Overview + client health list (read-only dashboard, health rules live)
3. Client detail + team tasks
4. Add client (provisioning + login issuance)
5. Client auth + multi-tenancy + security interims closed
6. Automation engine (nudges, milestones, alert emails via Sendrif)
7. Suppliers admin
8. Messaging panel
9. Luna wiring

## Out of scope (Phase 3)
Milestone *celebrations* in the portal, post-go-live transition flourishes, NPS surveys, and any delight features.
