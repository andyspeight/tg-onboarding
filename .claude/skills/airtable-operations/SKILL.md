---
name: airtable-operations
description: Use this skill whenever Andy asks to do anything with Airtable — building bases from scratch, creating tables, adding fields, populating data, querying, updating, deleting, restructuring, or any Airtable task whatsoever. This skill contains the complete capability matrix (what Claude CAN and CANNOT do via the API), all base/table/field IDs for Andy's existing bases, the standard workflow for setting up a new base end-to-end, batch sizing rules, field-type recipes, and a recovery playbook. Triggers include any mention of Airtable, "the database", "set up a base", "create a table", "add a field", "push records", "pull records", "update Airtable", or any reference to bases, tables, fields, or records. Do NOT ask Andy to manually set anything up before checking this skill — Claude can do almost everything itself.
---

# Airtable Operations Skill

## Why this skill exists

Andy uses Airtable for almost everything. There must be **zero friction** when he asks for Airtable work. The single biggest historic problem: Claude sometimes wrongly tells Andy he has to set things up manually, when in fact Claude can do it via the API. This skill exists to stop that, permanently.

**The default answer to "can you do X in Airtable?" is YES, until this skill explicitly says otherwise.**

---

## CAPABILITY MATRIX — read this first, every time

This is the authoritative list. If something is in the "CAN" column, Claude does not refuse it, does not ask Andy to do it manually, and does not say "I'll need you to set this up first."

### ✅ Claude CAN do (via the Airtable MCP)

| Action | Tool | Notes |
|---|---|---|
| List all bases Andy has access to | `Airtable:list_bases` | Paginates with offset |
| Search bases by name | `Airtable:search_bases` | Use this if Andy mentions a base name |
| List all tables in a base + their full schema | `Airtable:list_tables_for_base` | Returns field IDs, types, options |
| Get the schema of specific tables/fields | `Airtable:get_table_schema` | Use to confirm field IDs before writing |
| **Create a new table from scratch** | `Airtable:create_table` | First field = primary field. See recipes below. |
| **Add a new field to an existing table** | `Airtable:create_field` | All field types listed below |
| Rename a table or update its description | `Airtable:update_table` | |
| Rename a field, change its description, or change a formula | `Airtable:update_field` | Cannot change field TYPE — must add new field |
| Create records (up to 10 per call) | `Airtable:create_records_for_table` | Use `typecast: true` for select fields |
| Update records (up to 10 per call) | `Airtable:update_records_for_table` | Supports upsert via `performUpsert` |
| **Delete records (up to 10 per call)** | `Airtable:delete_records_for_table` | YES, this works. Up to 10 IDs per call. |
| List records with filters, sorts, pagination | `Airtable:list_records_for_table` | Up to 8000 per page; uses cursor-based pagination |
| Free-text search across records | `Airtable:search_records` | Fuzzy + token-based; better than filterByFormula for text |
| Add a comment to a record | `Airtable:create_record_comment` | |
| List comments on a record | `Airtable:list_record_comments` | |
| Read interface pages (for interface-only bases) | `Airtable:list_pages_for_base`, `list_records_for_page`, `get_record_for_page` | |

### ❌ Claude CANNOT do (these genuinely require Andy in the Airtable UI)

| Action | Workaround |
|---|---|
| Create a brand-new base | Andy creates the empty base in Airtable UI (takes ~10 seconds), then Claude does everything else inside it |
| Delete a table | Andy deletes manually. Claude can rename it to `_DELETED_xxx` as a marker. |
| Delete a field | Andy deletes manually. Claude can rename it to `_DELETED_xxx`. |
| Change a field's TYPE (e.g. text → number) | Create a new field of the right type, copy values across, ask Andy to delete the old one |
| Create lookup, rollup, count, formula, or AI text fields | Andy creates these in the UI. Reason: the MCP `create_field` tool only supports a fixed list of types (see below). Formula IS supported by the MCP though — the API itself supports more, but our connector is limited. |
| Create attachment fields with content already attached | Andy uploads files manually, OR Claude provides public URLs and Andy pastes them |
| Create dateTime fields with timezones | Supported, but timezone string must be IANA format (e.g. `Europe/London`) |
| Create views, dashboards, interfaces | Andy creates manually in Airtable UI |
| Modify base permissions or share settings | Andy does in UI |

### Field types the MCP `create_field` and `create_table` tools accept

These are the types Claude can create via the API. Anything else (lookup, rollup, count, AI text) must be added manually by Andy in the UI after Claude creates the table.

- `singleLineText`, `multilineText`, `richText`
- `email`, `url`, `phoneNumber`
- `number`, `percent`, `currency`, `duration`
- `date`, `dateTime`
- `checkbox`
- `singleSelect`, `multipleSelects`
- `rating`
- `multipleRecordLinks` (linked record fields)
- `multipleAttachments`
- `singleCollaborator`, `multipleCollaborators`
- `barcode`
- `formula`

---

## Standard workflow — building a new base from scratch

When Andy says "set up a new base for X" or similar, follow this exact sequence. Do not ask permission at each step — execute.

### Step 1 — Andy creates the empty base
This is the only manual step. Tell Andy: *"Create an empty base in Airtable called [NAME] and tell me when it's done."* Once he confirms, proceed.

### Step 2 — Find the base ID
Use `Airtable:search_bases` with the name Andy used, OR `Airtable:list_bases` and pick the most recent. Confirm the `appXXXXXXXXXXXXXX` ID with Andy if there's any ambiguity.

### Step 3 — Plan the schema
Before creating anything, write out (in chat, briefly) the proposed tables, primary fields, and key field types. Get a quick yes from Andy. Catch design issues before creating 12 fields the wrong way.

### Step 4 — Create tables in dependency order
Linked record fields can only point to tables that already exist. So:
1. Create "leaf" tables (no outgoing links) first
2. Create tables that link to those, second
3. Create tables that link to those, third
4. Continue until done

For each table, use `Airtable:create_table`. The first field in the array becomes the primary field — choose carefully. Primary fields must be one of: `singleLineText`, `email`, `url`, `multilineText`, `number`, `percent`, `currency`, `duration`, `date`, `dateTime`, `phoneNumber`, `barcode`.

### Step 5 — Note the new IDs
After each `create_table` call, capture the returned `tableId` and the `id` of every field. Keep them in your working memory for this conversation. Update this skill (or tell Andy to) if the base will be used long-term.

### Step 6 — Delete the auto-created "Table 1"
Airtable always creates a default "Table 1" when a base is born. Claude can't delete it. After all real tables are made, tell Andy: *"You can now delete the default 'Table 1' in the UI."*

### Step 7 — Populate records
Use `Airtable:create_records_for_table`. Apply the batch sizing rules below.

### Step 8 — Add manual-only fields
If the schema needs lookups, rollups, counts, or AI fields, give Andy a precise list: *"In [Table Name], add these fields manually: 1) Lookup of {Country Name} on the Country link field, 2) Rollup with COUNTALL(values) on the Cities link field…"*

---

## Field type recipes (copy-paste ready)

Always pass these inside `create_table` (`fields` array) or `create_field` (`field` object).

```jsonc
// Plain text
{ "name": "Title", "type": "singleLineText" }

// Long text
{ "name": "Description", "type": "multilineText" }

// Number (integer)
{ "name": "Count", "type": "number", "options": { "precision": 0 } }

// Number (2 dp)
{ "name": "Price", "type": "number", "options": { "precision": 2 } }

// Currency (£)
{ "name": "Cost", "type": "currency", "options": { "precision": 2, "symbol": "£" } }

// Percent
{ "name": "Conversion Rate", "type": "percent", "options": { "precision": 1 } }

// Date (UK format)
{ "name": "Due Date", "type": "date", "options": { "dateFormat": { "name": "european", "format": "D/M/YYYY" } } }

// DateTime (UK timezone, 24h)
{
  "name": "Created At", "type": "dateTime",
  "options": {
    "dateFormat": { "name": "iso", "format": "YYYY-MM-DD" },
    "timeFormat": { "name": "24hour", "format": "HH:mm" },
    "timeZone": "Europe/London"
  }
}

// Single select with predefined options
{
  "name": "Status", "type": "singleSelect",
  "options": { "choices": [
    { "name": "Draft" }, { "name": "Live" }, { "name": "Archived" }
  ]}
}

// Multi select
{
  "name": "Tags", "type": "multipleSelects",
  "options": { "choices": [
    { "name": "Beach" }, { "name": "City" }, { "name": "Family" }
  ]}
}

// Checkbox
{ "name": "Active", "type": "checkbox", "options": { "icon": "check", "color": "greenBright" } }

// Rating (5 stars)
{ "name": "Quality", "type": "rating", "options": { "icon": "star", "color": "yellowBright", "max": 5 } }

// Linked record (must already know the linked table's tableId)
{
  "name": "Country", "type": "multipleRecordLinks",
  "options": { "linkedTableId": "tblXXXXXXXXXXXXX" }
}

// Email / URL / Phone — no options needed
{ "name": "Email", "type": "email" }
{ "name": "Website", "type": "url" }
{ "name": "Phone", "type": "phoneNumber" }

// Attachments (no content yet, just the field)
{ "name": "Images", "type": "multipleAttachments" }

// Formula
{
  "name": "Full Name", "type": "formula",
  "options": { "formula": "CONCATENATE({First Name}, ' ', {Last Name})" }
}
```

---

## Batch sizing rules (CRITICAL)

The MCP enforces **max 10 records per call** for create/update/delete. On top of that, payload size matters.

| Record profile | Records per `create_records_for_table` call |
|---|---|
| Short fields only (text under 100 chars, selects, numbers, checkboxes) | **10** |
| Mixed (a couple of multilineText fields, ≤500 chars each) | **5–6** |
| Heavy (multiple long text fields, 150+ words each — e.g. destination Spotlight content) | **1** |
| Resort/Area destination records | **Always 1 per call** |
| Country destination records | **Up to 3 per call** |

When pushing many heavy records, use the **two-pass strategy**:
1. First pass: create skeleton records with primary field, selects, numbers, status only (batch 10)
2. Second pass: backfill long text fields one record at a time via `update_records_for_table`

This is reliably 3–5× faster than trying to push everything in one go and dealing with timeouts.

### Rate limit
5 requests per second per base. Don't fire more than that. If a 429 comes back, wait 30 seconds and retry.

### Pagination
`list_records_for_table` returns up to 8000 records per page (cursor-based). For most queries, the default is fine. For very large tables, use `cursor` from the response to paginate.

---

## Field type reference — how to format values

| Field type | Format when writing | Example |
|---|---|---|
| singleLineText | string | `"Costa del Sol"` |
| multilineText | string with `\n` for newlines | `"Line 1\nLine 2"` |
| richText | markdown string | `"**bold** and *italic*"` |
| singleSelect | string (option name) | `"Europe"` |
| multipleSelects | array of strings | `["Families", "Couples"]` |
| multipleRecordLinks | array of record IDs | `["recXXXXXXXXXXXXX"]` |
| number / percent / currency | number | `42`, `0.85`, `2999.99` |
| rating | integer | `4` |
| checkbox | boolean | `true` |
| url / email / phoneNumber | string | `"https://example.com"` |
| date | ISO date string | `"2026-04-24"` |
| dateTime | ISO datetime string | `"2026-04-24T10:30:00.000Z"` |
| multipleAttachments | array of `{url, filename}` objects | `[{"url": "https://...", "filename": "image.jpg"}]` |

### `typecast: true`
When writing select fields where a new option might not yet exist, ALWAYS pass `typecast: true`. This auto-creates the option instead of erroring. Default to using it for any create/update on tables with select fields.

### Reading vs writing select fields
When `list_records_for_table` returns a singleSelect, it comes back as `{"id": "selXXX", "name": "Europe", "color": "blue"}`. When writing back, only send the `name` as a plain string: `"Europe"`.

---

## Filtering with the structured `filters` parameter

Note: `list_records_for_table` does NOT accept `filterByFormula` — use the `filters` parameter instead.

Common patterns:

```jsonc
// Single condition: status = Draft
{ "operands": [{ "operator": "=", "operands": ["fldXXX", "Draft"] }] }

// AND of two conditions
{ "operator": "and", "operands": [
  { "operator": "=", "operands": ["fldStatus", "Live"] },
  { "operator": ">", "operands": ["fldPriority", 3] }
]}

// OR
{ "operator": "or", "operands": [...] }

// Field is empty / not empty
{ "operands": [{ "operator": "isEmpty", "operands": ["fldXXX"] }] }
{ "operands": [{ "operator": "isNotEmpty", "operands": ["fldXXX"] }] }

// Date in last 7 days
{ "operands": [{ "operator": "isWithin", "operands": [
  "fldDate", { "mode": "pastNumberOfDays", "numberOfDays": 7, "timeZone": "Europe/London" }
]}]}

// Single select equals a specific option (use option ID, not name — get it from get_table_schema)
{ "operands": [{ "operator": "=", "operands": ["fldStatus", "selABC123XYZ"] }] }
```

For free-text search use `Airtable:search_records` instead — it's faster and supports fuzzy matching.

---

## Andy's known bases

### 1. Destination Content
- **Base ID**: `appuZdlMJ7HKUt6qS`
- **Purpose**: Three-tier content library (Countries → Cities/Regions → Resorts/Areas) for Travelgenix client websites
- **Tables**:
  - Countries — `tblsxbqbyhTDoWhbo` (101 records, all 12 Spotlight fields complete; Cyprus blank per FCDO guidance)
  - Cities and Regions — `tblTkKujdVZgWPAQe` (278 records)
  - Resorts and Areas — `tblwV9gnbVEyZ99gI` (483 records, Spotlight A–P done, R next)
- **Canonical lat/lng field IDs**:
  - Resorts: `fld4INRwIKWCG21RV` (lat) / `fldd8CwfdzCDhW68w` (lng)
  - Cities: `fldjk3yUCbVQRuxx8` (lat) / `fldNSlAA0Qb1akknz` (lng)
  - Countries: `fldlxsWrbmU6ELUPW` (lat) / `fldz3whFdzKsZ66hg` (lng)
- **Operating rules**: `typecast: true` on all updates. Resorts = 1 record per call. Countries = 3 max per call.
- **Related skills**: `travelgenix-destinations`, `destination-spotlight-resorts`, `destination-spotlight-cities`, `destination-spotlight-countries`

### 2. Exclusively Lindos
- **Base ID**: `appFmQrDHzripFkAB`
- **Purpose**: Property database for exclusivelylindos.com (250 properties)
- **Tables**: Properties — `tblaPDQfUFkugmayw`
- **Notes**: All 250 records fully populated. Default "Table 1" still needs manual deletion.

### 3. TG Widgets — Configurations
- **Base ID**: `appAYzWZxvK6qlwXK`
- **Purpose**: Widget editor saves configs here (Pricing Table, Weather, Enquiry Form, etc.)
- **Tables**: Configs — `tblpw4TCmQfJHZIlF`

### 4. TG Widgets — Submissions
- **Base ID**: `appQJYiPZVU5jMAml`
- **Purpose**: Enquiry Form submissions inbox + routing log
- **Tables**:
  - Submissions — `tblxtRPhALFjeMVA6`
  - Routing Log — `tblYPXs1yFkXuwPHQ`

### 5. Travelgenix Knowledge Bot / Luna Chat / Luna QA
- **Base ID**: `app6Ot3eOb3DangkB`
- **Purpose**: Shared base for chat conversations, knowledge Q&A, clients, agents, test prompts
- **Key tables**:
  - Conversations — `tblyin27D2J9ejHvf`
  - Messages — `tblGlvZLU8xub2LHK`
  - Agents — `tblAC27rrI3Bn8WDK`
  - Clients — `tbl6CZ7aVzq1wHF2v` (Travelgenix record: `recViuJDDFdMUzw7e`)
  - Luna QA TestPrompts — `tblR6f4jPbYwTwhna`
  - Luna QA TestRuns — `tblVm7kzg2Gs3bNy4`
- **Critical field IDs (Clients table)**:
  - BrandColor — `fld2G74Twqga2bS8A`
  - AccentColor — `fldUvaCo81Rgl95vF`
  - WidgetWelcome — `fldnrq5Qhujv5wFKu`
  - WidgetHints — `fldetuhUzLSuunMJo` (must NOT be confused with WidgetWelcome)
  - BusinessTypes (multi-select) — `fldNH6fmuQjRui5dD`

### 6. Luna Brain
- **Base ID**: `appPKx77relfeiqmq`
- **Tables**:
  - Destinations — `tblirr0vJuQcTLuH2` (230 records, denormalised via Type field)
  - Knowledge — `tblgdLszaPmquxQ7O` (~229 Q&A records)
  - Transport — `tbl8CRDV48QGjDx2a` (141 records)
  - Knowledge Gaps — `tbl6IJzXt2XOvf3RC`

### 7. Luna Marketing
- **Base ID**: `appSoIlSe0sNaJ4BZ`
- **Tables include**: Events Calendar — `tblQxIYrbzd6YlJYV` (80 records)

### 8. Luna Trends
- **Base ID**: `appts2EjZ65zLeXl7`
- **Tables**: Sources, Signals, Trends, Client Profiles, Alerts, Marketing Actions, Competitors

### 9. TG Onboarding
- **Base ID**: `appOSIsT3wpkTmit9`
- **Purpose**: Client onboarding portal data for the `tg-onboarding` repo. Schema built + seeded by Claude Code 10 Jun 2026 (test client: Sarah Mitchell / Wanderlust Travel / Boost).
- **Tables**:
  - Clients — `tblJshqEDEbezPemO` (test client record: `recY6k89hWSw8oUBc`; fields: Company `fldV3aAKMwGbKweMJ`, Contact Name `fldPZiMqRPXgjI2Pi`, Contact Email `fldBzYYxIjn2ERqXN`, Package `fldOf62P3opdqJ5Gx`, Onboarding Started `fldiMG1sZjsRxJuer`, Account Manager `fld4D5xpWTRS7sMUb`, Last Active `fldUegCPTvsPnK5pG`)
  - Phases — `tbl3KczJTtCcBMiMY` (7 rows, journey template; Title `fldJyX52ytUEgAXJT`, Number `fldFT9rDlGXzA8442`, Slug `fld1ZvEe0zYjVkGLO`, Summary `fldpMuN9n4w63QgCC`, Estimate Label `fld5gyVsQjZcFSQBH`, Gate Min Rating `fldZ8sX5gNdrbcPLe`, Gate Prompt `fldOtOnBM6jeqwAwx`, Gate Help `fldVLfUMiuvAkPBaj`)
  - Suppliers — `tblzkvTGKU8dHbwz2` (24 rows; the central list feeding intake multi-selects AND the rich client supplier cards; Name `fldLSsHcN5ofcuT0l`, Category `fldIOHIdyvcf4Lgh0`, Active `fldzPuJyXXsoCylu8`, Description `fldfMbRzmRjw1ELhn`, Features (comma list → pills) `fldeQDdMPLxL7PSMo`, Link 1 Label/URL `fldxyeA1LQ6g5bVJ2`/`fldBHuSBLUusjDL5c`, Link 2 `fldxgEvIbHm70srCL`/`fldHcmlP9R68r9ZUe`, Link 3 `flddXjjm0SOdY0WXr`/`fldM18EpPBCINrBji`)
  - Automation Log — `tbl6JmGMnuRvHbYuc` (engine actions; dedupes sends; powers the dashboard panel)
  - Tasks — `tblrqtEreCM7lF03k` (30 rows; Title `fld19FvLTPM0anxAR`, Client `fldEHOJvbSSxXELFJ`, Phase `fldmOymKdOmuv4Emo`, Description `fldXBJghkP2yZg8vA`, Audience `fld69yi7AgXE4Z2qp`, Owner `fldn32C8OALO65EqR`, Status `fld0VjqmNbReueweZ`, Due Date `fld2naX3VklPlUe6t`, Optional `fldzxDMQptCkAgDff`, Order `fldqdMOSlEYNIuohP`)
  - Training — `tbleBDB9oqkGpxt1t` (10 rows; URL `fld70gfp57xV8WBYw` empty = Coming soon in the portal)
  - Training Completions — `tblPuZGHHSs9Au7JL` (write-side, empty)
  - Documents — `tblmnJ1x0av9sQw0N` (8 rows; File attachment field `fldTGYzEH3L5bUOZ9`)
  - Notifications — `tblx5z4eV3YGWaEBq` (4 rows; task-specific nudges for the portal bell)
  - Intake Responses — `tblUN366QbH6fugHP` (write-side, empty)
  - Confidence Ratings — `tbl1mfOO84zYhnpYR` (write-side, empty)
  - Engagement Signals — `tblUJTgxwcjzGvaRd` (write-side, empty; Phase 2 wilting alerts read from here)
- **Operating rules**: `typecast: true` on writes. The portal reads server-side only, with a PAT scoped to THIS base alone (`data.records:read` + `data.records:write`); never in client code. Portal writes go through validated, rate-limited API routes. Default "Table 1" awaiting manual deletion by Andy.
- **Related skills**: `travelgenix-security` (PAT scoping), `project-handover` (state)

### When Andy creates a NEW base
1. Andy creates the empty base in the UI
2. Run `Airtable:list_bases` or `Airtable:search_bases` to find the new ID
3. Build everything else via the API following the Standard Workflow above
4. After the base is built, append it to this skill's "Known bases" section so future sessions don't have to rediscover it. Andy can say *"Update the Airtable skill with this base"* — Claude should produce the updated section and Andy pastes it into the SKILL.md file.

---

## Content standards (Travelgenix bases)

When pushing content to any Travelgenix-related base:

- **UK English** (colour, favourite, centre, travelling, organising)
- **No em dashes** anywhere — use en dashes sparingly or restructure
- **No Oxford comma**
- **Status** field: always set to `"Draft"` on creation
- **Image fields**: leave empty unless explicitly told otherwise
- **URL slugs**: lowercase, hyphenated, no special characters: `costa-del-sol`
- **SEO titles**: ≤ 60 characters
- **SEO descriptions**: ≤ 155 characters
- For destination content specifically, defer to the relevant `destination-spotlight-*` skill for field-by-field rules

---

## Error handling playbook

| Error | Cause | Fix |
|---|---|---|
| `INVALID_REQUEST_BODY` / payload too large | Too many records or too much text per batch | Halve the batch size; if still failing, push 1 at a time |
| `Invalid field value for field <X>` | Type mismatch (e.g. string sent to number field) | Check the field type via `get_table_schema`, format value correctly |
| `Unknown field name` / `Field <name> does not exist` | Used field name instead of field ID, or typo | Use field IDs (fldXXX...) not names. Run `list_tables_for_base` to verify. |
| `INVALID_MULTIPLE_CHOICE_OPTIONS` | Trying to set a select option that doesn't exist | Add `typecast: true` to the call to auto-create the option |
| `NOT_FOUND` on base | Base ID wrong, or connector lacks access | Verify the base ID with `list_bases`. If still failing, Andy may need to re-share the base with the connector. |
| `INVALID_PERMISSIONS` | Connector token scope insufficient | Andy needs to re-auth the Airtable MCP from the connector settings |
| `RATE_LIMIT_REACHED` (429) | More than 5 req/sec to one base | Wait 30 seconds, retry. For bulk work, add small pauses between batches. |
| First field of `create_table` rejected | Primary field type not allowed | Use one of: singleLineText, email, url, multilineText, number, percent, currency, duration, date, dateTime, phoneNumber, barcode |
| Linked record field rejected | `linkedTableId` doesn't exist yet | Create the target table first; then add the link field via `create_field` |

---

## Quick-start checklist (run at the top of every Airtable session)

1. **Identify the base.** If Andy named it, use `search_bases`. If he gave the appXXX ID, use it directly. If unclear, list bases.
2. **Confirm the table(s).** Run `list_tables_for_base` once to cache the schema. Don't re-fetch on every call.
3. **Use field IDs (fldXXX) not field names** — names break when renamed; IDs are stable.
4. **For writes with selects**, default to `typecast: true`.
5. **Size batches according to the rules table above.**
6. **After any failure**, halve the batch and retry before changing anything else.

---

## What "I can't do that" means in this skill

If Claude is about to tell Andy he needs to do something manually, it must first verify the action is in the **❌ CANNOT** column above. If it's not in that column, Claude does it. The only genuinely manual steps are: creating an empty base, deleting tables/fields, creating lookup/rollup/count/AI text fields, building views/dashboards/interfaces, and uploading attachment files. Everything else — including creating tables, adding fields, populating data, restructuring schema, deleting records — Claude does itself.
