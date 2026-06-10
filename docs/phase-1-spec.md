# Phase 1 Spec — Client Welcome Portal

> Scope for the current build. Phase 2 (internal management dashboard) and Phase 3 (delight features) are designed for but out of scope now. Do not build them yet.

## Goal
A branded, client-facing portal a new Travelgenix client lands in after signing, that guides them through a clear seven-phase journey to confident, independent platform use, and that actively works against post go-live "wilting".

## Primary user
A new client (travel agent or operator) who has just signed. Non-technical. First impression matters: warm, professional, reassuring, clearly showing what happens next and what is expected of them.

## The seven-phase journey
Each phase is a stage the client moves through. Each has a short description, a checklist of tasks (some owned by the client, some by Travelgenix), and a completion state.
1. **Welcome and Kickoff**: orientation, what to expect, kickoff scheduling.
2. **Content and Branding Collection**: logo, brand colours, copy, imagery, the assets Travelgenix needs to build the site.
3. **Website Build**: progress visibility while Travelgenix builds, with anything still needed from the client surfaced.
4. **Training**: embedded training content (Travelgenix University style), per-topic completion.
5. **Go-Live Prep**: final checks before launch.
6. **First 30 Days**: post-launch check-ins and early support.
7. **Growth and Independence**: ongoing growth resources, the client now self-sufficient.

## Phase 1 screens and features
1. **Branded welcome landing**
   - Personalised greeting (client name, company, package tier).
   - The seven-phase journey shown as a clear visual path with a prominent **progress bar**.
   - Current phase highlighted; completed phases marked; upcoming phases visible.
2. **Phase detail view**
   - For the active phase: description, checklist of tasks with owner (client vs Travelgenix) and status, and any embedded content (video, links, forms) for that phase.
   - Task status is interactive for client-owned tasks (e.g. to-do / in progress / done).
3. **Content and intake**
   - A document hub for the client to upload assets, organised by category.
   - A smart intake form that adapts to the client's package tier (the prototype shows conditional sections).
4. **Embedded training**
   - Training content surfaced within the Training phase, with per-item completion tracked.
5. **Confidence gate before go-live**
   - The client self-rates their confidence. **Go-live is gated on a self-rating of 7 out of 10 or higher.** Below that, surface the gap and the help available rather than letting them proceed.
6. **Luna AI help seam (stubbed in Phase 1)**
   - Place the contextual-help entry point in the UI now. It can be a stub in Phase 1, but the seam must exist so Phase 2/3 can wire the real Luna AI layer without a redesign.

## Anti-wilting mechanics (core to Phase 1)
- **Visible progress bar** at all times, so the client always sees where they are and what is left.
- **Task-specific nudges**, not generic nag emails. Any prompt references the specific outstanding task.
- **Engagement signals captured** from the start (last active, phase progress) so Phase 2 can raise early-warning alerts when a client goes quiet. Phase 1 records the signals; the alerting UI is Phase 2.

## Data (Airtable)
Confirm the base first (see CLAUDE.md Open Questions). Indicative shape:
- **Clients**: name, company, package tier, current phase, overall progress, last active.
- **Phases / Tasks**: phase, task title, owner (client / Travelgenix), status, due, order.
- **Documents**: client, category, file, uploaded date.
- **Intake responses**: client, field, value (tier-conditional).
- **Confidence rating**: client, score, timestamp.
Use the `airtable-operations` skill for all schema and data work. Do not invent base or table IDs.

## Test data
Reuse the prototype's fictitious client for build and demo: a sample client (the prototype used "Sarah Mitchell" at "Wanderlust Travel" on the Boost package) with clearly fictitious data. No real client data in the trial.

## Out of scope for Phase 1 (do not build yet)
- Internal admin dashboard, wilting alert UI, client health list (Phase 2).
- Agent-to-client messaging panel (Phase 2).
- Live auth / Control SSO, magic-link access (later phase).
- Real Luna AI wiring (seam only in Phase 1).
- Delight features: milestone moments, post-go-live transition flourishes (Phase 3).

## Definition of done for Phase 1
- A client can land, see the seven-phase journey with a live progress bar, work through the active phase's checklist, upload content, complete the tier-aware intake, view training, and hit the confidence gate before go-live.
- Built to match `reference/onboarding-prototype.html` in look, feel and behaviour.
- Passes the `travelgenix-security` pre-deploy checklist.
- All client-facing copy passes `travelgenix-humanizer`.
