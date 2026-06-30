import {
  airtableConfig,
  createSupplier,
  deleteSupplier,
  setSupplierActive,
  updateSupplier,
  type SupplierInput,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";
import type { SupplierCategory } from "@/lib/onboarding/health";

const CATEGORIES: SupplierCategory[] = [
  "Package holidays",
  "Accommodation",
  "Flights",
];

/** Links render as buttons in the client portal: http(s) only, ever. */
function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return "";
  const trimmed = value.trim();
  if (trimmed.length > 300) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

/** Validate the full supplier payload; null when anything's off. */
function parseSupplierInput(body: Record<string, unknown>): SupplierInput | null {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length === 0 || name.length > 100) return null;
  if (
    typeof body.category !== "string" ||
    !CATEGORIES.includes(body.category as SupplierCategory)
  ) {
    return null;
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 500) return null;

  const features =
    typeof body.features === "string" ? body.features.trim() : "";
  if (features.length > 300) return null;

  const contactEmail =
    typeof body.contactEmail === "string" ? body.contactEmail.trim() : "";
  if (contactEmail.length > 200) return null;
  if (contactEmail !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return null;
  }

  const contactPhone =
    typeof body.contactPhone === "string" ? body.contactPhone.trim() : "";
  if (contactPhone.length > 50) return null;

  const contactNotes =
    typeof body.contactNotes === "string" ? body.contactNotes.trim() : "";
  if (contactNotes.length > 1000) return null;

  const rawLinks = Array.isArray(body.links) ? body.links : [];
  if (rawLinks.length > 3) return null;
  const links: { label: string; url: string }[] = [];
  for (const raw of rawLinks) {
    if (typeof raw !== "object" || raw === null) return null;
    const { label: rawLabel, url: rawUrl } = raw as Record<string, unknown>;
    const url = cleanUrl(rawUrl);
    if (url === null) return null;
    if (url === "") continue;
    const label =
      typeof rawLabel === "string" && rawLabel.trim() !== ""
        ? rawLabel.trim()
        : "Visit website";
    if (label.length > 40) return null;
    links.push({ label, url });
  }

  return {
    name,
    category: body.category as SupplierCategory,
    description,
    features,
    links,
    contactEmail,
    contactPhone,
    contactNotes,
  };
}

/** Staff-only: add a supplier to the central list. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-suppliers", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const input = parseSupplierInput(guard.body as Record<string, unknown>);
  if (!input) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    await createSupplier(config, input);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-suppliers] create failed:", error);
    return jsonError(502, "Something went wrong");
  }
}

/** Staff-only: toggle active, or update the full card when fields present. */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-suppliers", 60);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as Record<string, unknown>;
  if (!isRecordId(body.supplierId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    // Plain active toggle.
    if (typeof body.active === "boolean" && body.name === undefined) {
      const toggled = await setSupplierActive(config, body.supplierId, body.active);
      return toggled ? Response.json({ ok: true }) : jsonError(400, "Invalid request");
    }

    const input = parseSupplierInput(body);
    if (!input) return jsonError(400, "Invalid request");
    const updated = await updateSupplier(config, body.supplierId, input);
    return updated ? Response.json({ ok: true }) : jsonError(400, "Invalid request");
  } catch (error) {
    console.error("[api/admin-suppliers] update failed:", error);
    return jsonError(502, "Something went wrong");
  }
}

/** Staff-only: remove a supplier outright. */
export async function DELETE(request: Request) {
  const guard = await guardPost(request, "admin-suppliers", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as { supplierId?: unknown };
  if (!isRecordId(body.supplierId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const removed = await deleteSupplier(config, body.supplierId);
    return removed ? Response.json({ ok: true }) : jsonError(400, "Invalid request");
  } catch (error) {
    console.error("[api/admin-suppliers] delete failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
