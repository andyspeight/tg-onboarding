import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  getPortalClientId,
  recordSignalAndTouch,
  saveIntakeResponses,
} from "@/lib/onboarding/airtable";
import { guardPost, jsonError } from "@/lib/api/guard";
import { INTAKE_SECTIONS } from "@/lib/onboarding/mock-data";
import type { IntakeField } from "@/lib/onboarding/types";

const TEXT_MAX = 200;
const TEXTAREA_MAX = 2000;
const MULTI_ITEM_MAX = 100;
const MULTI_ITEMS_MAX = 50;

/**
 * Validate one field's submitted value against the form definition.
 * Returns the normalised string to store, or null when invalid.
 * Multi-select options are curated in Airtable, so membership isn't checked
 * here — sizes and types are.
 */
function normaliseValue(field: IntakeField, value: unknown): string | null {
  switch (field.type) {
    case "text":
      return typeof value === "string" && value.length <= TEXT_MAX
        ? value.trim()
        : null;
    case "textarea":
      return typeof value === "string" && value.length <= TEXTAREA_MAX
        ? value.trim()
        : null;
    case "select":
      if (typeof value !== "string") return null;
      if (value === "") return "";
      return field.options?.includes(value) ? value : null;
    case "multiselect":
      if (!Array.isArray(value) || value.length > MULTI_ITEMS_MAX) return null;
      if (
        !value.every(
          (item) => typeof item === "string" && item.length <= MULTI_ITEM_MAX,
        )
      ) {
        return null;
      }
      return value.join(", ");
    case "upload":
      // Files aren't persisted through this route; uploads land with storage.
      return null;
  }
}

/** Save one intake section's answers. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "intake", 10);
  if (!guard.ok) return guard.response;

  const body = guard.body as { sectionId?: unknown; values?: unknown };
  const section = INTAKE_SECTIONS.find((item) => item.id === body.sectionId);
  if (
    !section ||
    typeof body.values !== "object" ||
    body.values === null ||
    Array.isArray(body.values)
  ) {
    return jsonError(400, "Invalid request");
  }

  // Strict allowlist: only this section's fields, every value validated.
  const submitted = body.values as Record<string, unknown>;
  const toSave: Record<string, string> = {};
  for (const [fieldId, rawValue] of Object.entries(submitted)) {
    const field = section.fields.find((item) => item.id === fieldId);
    if (!field) return jsonError(400, "Invalid request");
    if (field.type === "upload") continue;
    const value = normaliseValue(field, rawValue);
    if (value === null) return jsonError(400, "Invalid request");
    if (value !== "") toSave[fieldId] = value;
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const clientId = await getPortalClientId(config);
    if (!clientId) return jsonError(503, "Not available");

    if (Object.keys(toSave).length > 0) {
      await saveIntakeResponses(config, clientId, toSave);
    }
    await recordSignalAndTouch(config, clientId, "intake-saved", section.id);
    revalidatePath("/details");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/intake] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
