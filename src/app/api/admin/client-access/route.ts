import {
  airtableConfig,
  getClientContact,
  storeAccessCodeHash,
} from "@/lib/onboarding/airtable";
import {
  clientAuthConfigured,
  generateAccessCode,
  hashAccessCode,
} from "@/lib/api/client-auth";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";
import { send } from "@/lib/email";
import { accessCodeEmail } from "@/lib/email/templates";

/**
 * Staff-only: issue (or reissue) a client's portal access code. The code is
 * emailed straight to the client, and the plaintext also comes back in this
 * response once (as a fallback if the email doesn't land) — only its HMAC is
 * stored. Reissuing replaces the old code immediately.
 */
export async function POST(request: Request) {
  const guard = await guardPost(request, "client-access", 10);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  if (!clientAuthConfigured()) {
    // Self-diagnosis for the "set but not seen" case: log the NAMES (never
    // values) of any candidate keys, JSON-escaped so an invisible character
    // pasted into the key shows up, plus whether the value is empty.
    const candidates = Object.keys(process.env).filter((key) =>
      key.toUpperCase().includes("CLIENT") || key.toUpperCase().includes("AUTH"),
    );
    console.error(
      "[api/admin-client-access] CLIENT_AUTH_SECRET not visible.",
      "candidate keys:",
      JSON.stringify(candidates),
      "exact-key present:",
      "CLIENT_AUTH_SECRET" in process.env,
      "value empty:",
      process.env.CLIENT_AUTH_SECRET === "",
    );
    return jsonError(503, "Set CLIENT_AUTH_SECRET to switch client logins on");
  }

  const { clientId } = guard.body as { clientId?: unknown };
  if (!isRecordId(clientId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const contact = await getClientContact(config, clientId);
    if (!contact || !contact.email) return jsonError(400, "Invalid request");

    const code = generateAccessCode();
    await storeAccessCodeHash(config, clientId, hashAccessCode(clientId, code));

    // Email the client their login. If it doesn't send (email seam off or
    // SendGrid trouble), the staff UI shows the code to share by hand.
    const firstName = contact.contactName.split(" ")[0] || "there";
    const tpl = accessCodeEmail(firstName, contact.company, contact.email, code);
    const result = await send({
      to: contact.email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });

    return Response.json({ ok: true, code, emailed: result.sent });
  } catch (error) {
    console.error("[api/admin-client-access] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
