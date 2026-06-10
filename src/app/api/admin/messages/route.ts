import {
  airtableConfig,
  clientExists,
  markMessagesRead,
  sendMessage,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";

const MAX_BODY_CHARS = 2000;

/** Staff-only: reply to a client's thread. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-messages", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const { clientId, body } = guard.body as {
    clientId?: unknown;
    body?: unknown;
  };
  if (
    !isRecordId(clientId) ||
    typeof body !== "string" ||
    body.trim().length === 0 ||
    body.length > MAX_BODY_CHARS
  ) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    if (!(await clientExists(config, clientId))) {
      return jsonError(400, "Invalid request");
    }

    await sendMessage(config, clientId, "team", body.trim());
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-messages] send failed:", error);
    return jsonError(502, "Something went wrong");
  }
}

/** Staff-only: the thread was opened — mark client messages as read. */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-messages", 60);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const { clientId } = guard.body as { clientId?: unknown };
  if (!isRecordId(clientId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    await markMessagesRead(config, clientId, "team");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-messages] mark read failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
