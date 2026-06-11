import {
  airtableConfig,
  clientExists,
  storeAccessCodeHash,
} from "@/lib/onboarding/airtable";
import {
  clientAuthConfigured,
  generateAccessCode,
  hashAccessCode,
} from "@/lib/api/client-auth";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";

/**
 * Staff-only: issue (or reissue) a client's portal access code. The
 * plaintext appears once in this response and is never stored — only its
 * HMAC lands in Airtable. Reissuing replaces the old code immediately.
 */
export async function POST(request: Request) {
  const guard = await guardPost(request, "client-access", 10);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  if (!clientAuthConfigured()) {
    return jsonError(503, "Set CLIENT_AUTH_SECRET to switch client logins on");
  }

  const { clientId } = guard.body as { clientId?: unknown };
  if (!isRecordId(clientId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    if (!(await clientExists(config, clientId))) {
      return jsonError(400, "Invalid request");
    }

    const code = generateAccessCode();
    await storeAccessCodeHash(config, clientId, hashAccessCode(clientId, code));
    return Response.json({ ok: true, code });
  } catch (error) {
    console.error("[api/admin-client-access] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
