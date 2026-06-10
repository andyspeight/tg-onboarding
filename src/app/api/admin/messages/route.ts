import {
  airtableConfig,
  clientExists,
  markMessagesRead,
  sendMessage,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";
import { parseMessageFile } from "@/lib/api/message-file";

const MAX_BODY_CHARS = 2000;
// Base64 of a 3MB attachment is ~4.1MB; stays inside Vercel's body limit.
const MAX_REQUEST_BYTES = 4_400_000;

/** Staff-only: reply to a client's thread, optionally with a file. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-messages", 30, MAX_REQUEST_BYTES);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const { clientId, body, attachment } = guard.body as {
    clientId?: unknown;
    body?: unknown;
    attachment?: unknown;
  };
  const text = typeof body === "string" ? body.trim() : "";
  const file = parseMessageFile(attachment);
  if (
    !isRecordId(clientId) ||
    file === null ||
    typeof body !== "string" ||
    body.length > MAX_BODY_CHARS ||
    (text.length === 0 && !file)
  ) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    if (!(await clientExists(config, clientId))) {
      return jsonError(400, "Invalid request");
    }

    await sendMessage(config, clientId, "team", text, file);
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
