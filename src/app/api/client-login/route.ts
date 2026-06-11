import {
  airtableConfig,
  findClientByEmail,
  markClientLogin,
  recordSignalAndTouch,
} from "@/lib/onboarding/airtable";
import {
  accessCodeMatches,
  clientAuthConfigured,
  clientSessionSetCookie,
  createClientSessionToken,
  hashAccessCode,
} from "@/lib/api/client-auth";
import { guardPost, jsonError } from "@/lib/api/guard";

/**
 * Client sign-in: email + staff-issued access code → signed session
 * cookie. Hard rate limit, one generic error for every failure mode, and
 * a dummy hash compare when the email is unknown so timing doesn't leak
 * which addresses exist.
 */
export async function POST(request: Request) {
  const guard = await guardPost(request, "client-login", 5);
  if (!guard.ok) return guard.response;

  if (!clientAuthConfigured()) return jsonError(503, "Not available");
  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  const { email, code } = guard.body as { email?: unknown; code?: unknown };
  if (
    typeof email !== "string" ||
    typeof code !== "string" ||
    email.length === 0 ||
    email.length > 200 ||
    code.length === 0 ||
    code.length > 40
  ) {
    return jsonError(400, "Invalid request");
  }

  try {
    const client = await findClientByEmail(config, email);

    const matched = client
      ? accessCodeMatches(client.id, code, client.codeHash)
      : // Burn comparable time for unknown emails.
        (hashAccessCode("recAAAAAAAAAAAAAA", code), false);

    if (!client || !matched) {
      console.warn("[api/client-login] failed sign-in attempt");
      return jsonError(401, "That email and code don't match");
    }

    await markClientLogin(config, client.id);
    await recordSignalAndTouch(config, client.id, "logged-in", "");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": clientSessionSetCookie(
          createClientSessionToken(client.id),
        ),
      },
    });
  } catch (error) {
    console.error("[api/client-login] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
