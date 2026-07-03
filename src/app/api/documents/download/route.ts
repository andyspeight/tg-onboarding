import { airtableConfig, getDocumentFile } from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { clientIdFromRequest } from "@/lib/api/client-auth";
import { isRecordId, jsonError } from "@/lib/api/guard";

/**
 * Authenticated file download: streams a document's stored file with a
 * Content-Disposition so the browser saves rather than navigates. Staff
 * sessions can download any document; a client session only its own.
 * (Airtable's raw attachment URLs work for View, but they're cross-origin,
 * so a plain download attribute can't force a save — this route can.)
 */
export async function GET(request: Request) {
  const documentId = new URL(request.url).searchParams.get("id") ?? "";
  if (!isRecordId(documentId)) return jsonError(400, "Invalid request");

  const isStaff = adminSessionFromRequest(request);
  const sessionClientId = clientIdFromRequest(request);
  if (!isStaff && !sessionClientId) return jsonError(401, "Sign in first");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const file = await getDocumentFile(config, documentId);
    // Same 404 for "doesn't exist" and "not yours" — no probing.
    if (!file) return jsonError(404, "Not found");
    if (!isStaff && !file.clientIds.includes(sessionClientId as string)) {
      return jsonError(404, "Not found");
    }

    const upstream = await fetch(file.url);
    if (!upstream.ok || !upstream.body) {
      return jsonError(502, "Something went wrong");
    }

    const safeName = file.filename.replace(/[\r\n"\\]/g, "").slice(0, 150);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[api/documents-download] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
