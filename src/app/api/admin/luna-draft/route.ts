import {
  airtableConfig,
  discardLunaDraft,
  sendLunaDraft,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";

const MAX_BODY_CHARS = 2000;

/**
 * Staff-only: release a reviewed Luna draft. The AM may have edited the text;
 * it goes to the client as a normal team reply, then the draft is cleared.
 */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-luna-draft", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const { draftId, body } = guard.body as { draftId?: unknown; body?: unknown };
  const text = typeof body === "string" ? body.trim() : "";
  if (!isRecordId(draftId) || text.length === 0 || text.length > MAX_BODY_CHARS) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const sent = await sendLunaDraft(config, draftId, text);
    if (!sent) return jsonError(400, "Invalid request");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-luna-draft] send failed:", error);
    return jsonError(502, "Something went wrong");
  }
}

/** Staff-only: discard a Luna draft unsent — the AM will write their own. */
export async function DELETE(request: Request) {
  const guard = await guardPost(request, "admin-luna-draft", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const { draftId } = guard.body as { draftId?: unknown };
  if (!isRecordId(draftId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const removed = await discardLunaDraft(config, draftId);
    if (!removed) return jsonError(400, "Invalid request");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-luna-draft] discard failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
