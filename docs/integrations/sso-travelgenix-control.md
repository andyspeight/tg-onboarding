# Integration: Travelgenix Control (SSO / ID)

> Platform reference supplied by Andy, 10 Jun 2026. How the onboarding tool authenticates users and reads their company, role and entitlements. Read this before building anything auth-related.

## TL;DR for this build
- **Phase 1 has NO auth.** Do not build login, sessions or user management in Phase 1. Locked decision.
- When auth is added (a later phase), do **not** roll your own and do **not** add Clerk, Supabase Auth, NextAuth or Auth.js. Integrate with the existing **Travelgenix Control** platform by **introspection** (below).
- There is **no separate SSO/ID service to build**. Control already exists and every product plugs into it the same way.

## What Control is
- The unified auth platform ("Travelgenix Control"). All products share one cookie-based SSO.
- The auth API lives **inside the `tg-widgets` repo** (there is no separate auth repo). It owns Airtable base `appAYzWZxvK6qlwXK`.
- Session cookie: **`tg_session`**, scoped cross-subdomain to `*.travelify.io` (it also accepts `Authorization: Bearer`).
- Any product needing auth runs on a `*.travelify.io` subdomain so the cookie reaches it.

## The integration pattern: introspection (this is the whole trick)
A product holds **no JWT secret and no Airtable token**. It does not verify tokens itself. It calls the existing endpoint:
- `GET {SSO_INTROSPECT_URL}` forwarding the incoming `tg_session` cookie (and/or `Authorization` header).
- One env var: **`SSO_INTROSPECT_URL`** = the full URL of the deployed `/api/auth/me` on a `.travelify.io` host the cookie reaches.
- If that env var is unset, treat auth as **disabled** (demo/dev mode). Its presence turns enforcement on.

**Do NOT modify the `/api/auth/me` endpoint.** It is shared by multiple products.

## `/api/auth/me` response shape (what you get back)
- `user`: `{ email, fullName, role }`
- `client`: `{ recordId, clientName, plan, status, packageName, ... }` — `recordId` is the company's Airtable record id, i.e. the tenant key
- `permissions`: `[ { product, role, expiresAt } ]` — per-product role
- `accessibleProducts`: `[ { slug, name, role } ]`
- `entitledWidgetCodes`: `[ ... ]` — all enabled entitlement codes for the client
- `activeWidgetCodes`: `[ ... ]`

Derive: tenant/company = `client.recordId`; onboarding role = `permissions[product == "<onboarding slug>"].role`; entitled = whether the onboarding product code is in `entitledWidgetCodes`.

## What the onboarding tool needs (later phase, not now)
1. A product registered in Control: a Products row with its own slug (e.g. `onboarding`) and role set, plus any Catalogue/entitlement items, in base `appAYzWZxvK6qlwXK`. This mirrors how Contract Loader registered `contract_loader`.
2. Its own `*.travelify.io` subdomain so `tg_session` reaches it.
3. The `SSO_INTROSPECT_URL` env var pointing at the deployed `/api/auth/me`.
4. A thin auth client (like Contract Loader's `lib/auth.js`) that calls `/api/auth/me`, caches ~30s, fails closed, and exposes `{ user, clientRecordId, clientName, plan, role, entitlements }`.

## Do NOT
- Roll your own auth, or add Clerk / Supabase Auth / NextAuth / Auth.js.
- Store or verify JWTs locally, or hold the shared JWT secret.
- Query the Control Airtable base directly for auth. Go through `/api/auth/me`.
- Modify `/api/auth/me`.
- Build any of this in Phase 1.

## Status in this repo
- Nothing built yet, by design: the staff gate is Phase 2 slice 1 (see `docs/phase-2-spec.md`).
- One deliberate deviation planned, flagged in the spec: for the **internal `/admin` area**, a missing `SSO_INTROSPECT_URL` fails **closed** (locked page), not open — the doc's auth-disabled demo mode suits client-facing products, not a staff dashboard showing client health. Local dev gets an explicit localhost-only bypass flag.
- Prerequisites tracked in the spec: travelify.io subdomain for this project, product row registered in Control (slug `onboarding`), `SSO_INTROSPECT_URL` set on this Vercel project.
