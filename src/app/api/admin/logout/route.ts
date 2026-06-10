import { sessionClearCookie } from "@/lib/api/admin-auth";
import { guardPost } from "@/lib/api/guard";

/** End the admin session. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-logout", 10);
  if (!guard.ok) return guard.response;

  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": sessionClearCookie() } },
  );
}
