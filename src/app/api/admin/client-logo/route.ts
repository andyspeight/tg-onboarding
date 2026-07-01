import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  clientExists,
  storeClientLogo,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";
import { MAX_UPLOAD_MB } from "@/lib/onboarding/uploads";

// Base64 of a 3MB file is ~4.1MB; this stays inside Vercel's body limit.
const MAX_BODY = 4_400_000;
const MAX_NAME_LENGTH = 150;
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];

/** Staff-only: upload a client's logo (their dashboard avatar). */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-client-logo", 20, MAX_BODY);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as {
    clientId?: unknown;
    name?: unknown;
    contentType?: unknown;
    data?: unknown;
  };
  if (!isRecordId(body.clientId)) return jsonError(400, "Invalid request");
  if (typeof body.name !== "string" || typeof body.data !== "string") {
    return jsonError(400, "Invalid request");
  }

  // Bare filename only — no path tricks — and an image extension.
  const name = body.name.split(/[\\/]/).pop()?.trim().slice(0, MAX_NAME_LENGTH);
  const extension = name?.split(".").pop()?.toLowerCase() ?? "";
  if (!name || !IMAGE_EXTENSIONS.includes(extension)) {
    return jsonError(400, "Invalid request");
  }

  const contentType =
    typeof body.contentType === "string" &&
    /^[\w.+-]+\/[\w.+-]+$/.test(body.contentType) &&
    body.contentType.length <= 100
      ? body.contentType
      : "application/octet-stream";

  let bytes: Buffer;
  try {
    bytes = Buffer.from(body.data, "base64");
  } catch {
    return jsonError(400, "Invalid request");
  }
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_MB * 1024 * 1024) {
    return jsonError(413, "Request too large");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    if (!(await clientExists(config, body.clientId))) {
      return jsonError(400, "Invalid request");
    }
    await storeClientLogo(config, body.clientId, {
      name,
      contentType,
      base64: body.data,
    });
    revalidatePath(`/admin/clients/${body.clientId}`);
    revalidatePath("/admin");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-client-logo] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
