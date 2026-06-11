import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  createClientDocumentWithFile,
  recordSignalAndTouch,
} from "@/lib/onboarding/airtable";
import { guardPost, jsonError } from "@/lib/api/guard";
import { resolveRouteClientId } from "@/lib/api/client-auth";
import {
  DOCUMENT_EXTENSIONS,
  LOGO_EXTENSIONS,
  MAX_UPLOAD_MB,
} from "@/lib/onboarding/uploads";

// Base64 of a 3MB file is ~4.1MB; this stays inside Vercel's body limit.
const MAX_BODY = 4_400_000;
const MAX_NAME_LENGTH = 150;

/** Store a client upload (document hub or intake logo) in Airtable. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "upload", 5, MAX_BODY);
  if (!guard.ok) return guard.response;

  const body = guard.body as {
    kind?: unknown;
    name?: unknown;
    contentType?: unknown;
    data?: unknown;
  };

  const allowed =
    body.kind === "logo"
      ? LOGO_EXTENSIONS
      : body.kind === "document"
        ? DOCUMENT_EXTENSIONS
        : null;
  if (!allowed) return jsonError(400, "Invalid request");

  if (typeof body.name !== "string" || typeof body.data !== "string") {
    return jsonError(400, "Invalid request");
  }
  // Bare filename only — no path tricks.
  const name = body.name.split(/[\\/]/).pop()?.trim().slice(0, MAX_NAME_LENGTH);
  const extension = name?.split(".").pop()?.toLowerCase() ?? "";
  if (!name || !allowed.includes(extension)) {
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
    const clientId = await resolveRouteClientId(request, config);
    if (!clientId) return jsonError(401, "Sign in first");

    await createClientDocumentWithFile(config, clientId, {
      name,
      fileType: extension.toUpperCase(),
      contentType,
      base64: body.data,
    });
    await recordSignalAndTouch(config, clientId, "document-uploaded", name);
    revalidatePath("/documents");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/upload] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
