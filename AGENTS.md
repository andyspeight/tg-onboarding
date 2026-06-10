<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

> This repo's `CLAUDE.md` points here. The persistent project brief follows.

# Client Onboarding Tool — `tg-onboarding`

> Persistent project brief for Claude Code. Read this in full at the start of every session. It carries the decisions already made so we never re-litigate them.

## What this is, and why it matters
A client onboarding & post-sale success tool for **Travelgenix** — guiding each new agent/operator client from the moment they sign through to confident, independent use of the platform.

It exists to solve the single biggest problem in the business: **post-go-live "wilting"** — clients drift, disengage, and churn after launch. Post-sale client success is both the **#1 gap in the competitor landscape** and the **#1 churn driver**. Competitors (TProfile, Top Dog, Traveltek) treat onboarding as a professional-services engagement, not a guided client experience — so building this well is a genuine differentiator and a direct lift to retained revenue, product stickiness, and the acquisition narrative.

This is also the **first build being run in Claude Code as a trial** of moving development here. Treat it as a real product, not a throwaway.

## Status
Phase 1 in progress. Next.js app scaffolded; Phase 1 screen 1 (welcome portal + seven-phase journey on mock data) built, then reconciled against the approved prototype (`reference/onboarding-prototype.html`) — slice 1 (welcome landing, seven-phase journey, progress bar) aligned. Live state lives in the Projects Airtable (see below).

## Locked decisions — do NOT re-open these
- **Build it ourselves** on the existing stack. We are *not* buying Dock / OnRamp / Userpilot (all benchmarked already).
- **Luna AI is the contextual help layer** — the differentiator no competitor can match. Bake the seam for it in now even if it's stubbed in Phase 1.
- **Phased build:** Phase 1 MVP client welcome portal → Phase 2 internal management dashboard → Phase 3 delight features. Stay in phase; don't pull Phase 2/3 work forward.
- **Anti-wilting mechanics are core, not nice-to-have:** visible progress bar; task-specific nudges (never generic nag emails); engagement tracking with early-warning alerts when a client goes quiet; **go-live gated on the client self-rating their confidence ≥ 7/10**.

## Phase 1 scope (current)
A branded, client-facing **welcome portal** that walks a new client through the seven-phase journey:
1. Welcome & Kickoff
2. Content & Branding Collection
3. Website Build
4. Training & Familiarisation
5. Go-Live Prep
6. First 30 Days Live
7. Growth & Independence

Each phase shows client-facing tasks, a **progress bar**, **checklists**, and **embedded training** (video/article slots). The **7/10 confidence gate** sits before Go-Live. Internal-only tasks stay hidden from the client view (they belong to Phase 2's dashboard).

Out of scope for Phase 1: the internal staff dashboard, real engagement-alert automation, milestone celebrations, SSO/auth. Stub or mock these cleanly; don't build them yet.

## Stack & architecture
- **Next.js** app (App Router, TypeScript, Tailwind v4 — note the managed rules block above: this is Next 16 with breaking changes; read `node_modules/next/dist/docs/` before writing Next code). Deployed on **Vercel** (team: agendasgroup).
- **Airtable** as the backend/data store, in the same lightweight pattern as **Luna Marketing**. (Which Airtable base — new vs existing — is an open question; until decided, Phase 1 runs off local mock data behind a clean data layer so swapping in Airtable later is a one-file change — see `src/lib/onboarding/data.ts`.)
- **Luna AI** as the contextual help layer — integration seam at `src/lib/luna/`.
- Brand: Inter, light + dark. Tokens in `src/app/globals.css` follow the approved prototype's palette (deep teal `#0D4F4F`, bright accent `#17A2B8` — see `reference/onboarding-prototype.html`); tune against the real Travelgenix brand tokens when available.

## How Andy works — follow these
- **Staged builds, not big-bang.** Ship Phase 1 in reviewable slices. Surface only genuine decisions.
- **Complete files, not patches/snippets.** When you change a file, output/commit the whole file.
- **Never rebuild from scratch** — iterate on what exists. If unsure, ask.
- You can **commit directly to the repo** — the old "hand Andy individual files to paste into GitHub" workaround no longer applies here. Use clear, small commits, and **push straight to `main`**: the production URL (deployed from `main`) is Andy's review surface. No separate review branches unless he asks.
- **Design bar is high.** Before any UI, consult the design skills (below). No generic AI look.
- **Security before ship.** Sandbox/dev only for now — **no live keys, no secrets in client-side code** (env vars only), validate and sanitise all input, lock down any API route.
- **Client-facing copy** gets the humaniser treatment — warm, plain, no AI tells.

## Skills to consult (in this repo's `.claude/skills/`)
`travelgenix-design`, `frontend-design`, `travelgenix-taste` (before any UI) · `travelgenix-security` (before and after any code) · `airtable-operations` (data layer) · `travelgenix-humanizer` (client copy) · `project-handover` (state).
> ✅ All seven skills were ported into `.claude/skills/` on 10 Jun 2026 — consult them directly; the inlined rules above stay as a quick summary.

## State & handover
Live project state — current focus, next steps, decisions log, open questions — lives in the **Projects Airtable** (base `appj9tksreHOwkhYg`, table `tblpyhPNhiQg3XkkT`, record `recgtZ7UP7ltoqced`). Keep it the source of truth across sessions.

## Open questions (from project state)
- Which Airtable base holds onboarding data — new base or reuse existing?
- Integrate Travelgenix Control SSO in a later phase (not Phase 1)? — assumed yes.

## Local development
```bash
npm install      # install dependencies
npm run dev      # start dev server at http://localhost:3000
npm run build    # production build
npm run lint     # eslint
```

## Project layout (Phase 1)
- `src/app/` — App Router pages, layout, global styles + brand tokens.
- `src/lib/onboarding/` — the data layer. `types.ts` (domain model), `mock-data.ts` (seed journey), `data.ts` (**the swap point** — currently mock, Airtable later), `progress.ts` (pure helpers).
- `src/lib/luna/` — Luna AI contextual-help integration seam (stubbed).
- `src/components/` — UI. `portal/` holds the client-facing welcome portal.
