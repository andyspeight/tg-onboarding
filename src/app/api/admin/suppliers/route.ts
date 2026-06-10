import {
  airtableConfig,
  createSupplier,
  setSupplierActive,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";
import type { SupplierCategory } from "@/lib/onboarding/health";

const CATEGORIES: SupplierCategory[] = [
  "Package holidays",
  "Accommodation",
  "Flights",
];

/** Staff-only: add a supplier to the central list. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-suppliers", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as { name?: unknown; category?: unknown };
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  if (
    name.length === 0 ||
    name.length > 100 ||
    typeof body.category !== "string" ||
    !CATEGORIES.includes(body.category as SupplierCategory)
  ) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    await createSupplier(config, name, body.category as SupplierCategory);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-suppliers] create failed:", error);
    return jsonError(502, "Something went wrong");
  }
}

/** Staff-only: toggle a supplier active/inactive. */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-suppliers", 60);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as { supplierId?: unknown; active?: unknown };
  if (!isRecordId(body.supplierId) || typeof body.active !== "boolean") {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const updated = await setSupplierActive(config, body.supplierId, body.active);
    if (!updated) return jsonError(400, "Invalid request");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-suppliers] toggle failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
