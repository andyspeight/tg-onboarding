import {
  adminConfigured,
  createSessionToken,
  passcodeMatches,
  sessionSetCookie,
} from "@/lib/api/admin-auth";
import { guardPost, jsonError } from "@/lib/api/guard";

/** Exchange the staff passcode for an admin session cookie. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-login", 5);
  if (!guard.ok) return guard.response;

  const body = guard.body as { passcode?: unknown };
  if (typeof body.passcode !== "string" || body.passcode.length > 200) {
    return jsonError(400, "Invalid request");
  }

  if (!adminConfigured()) return jsonError(503, "Not available");

  if (!passcodeMatches(body.passcode)) {
    console.warn("[api/admin-login] failed passcode attempt");
    return jsonError(401, "That passcode isn’t right");
  }

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": sessionSetCookie(createSessionToken()) } },
  );
}
