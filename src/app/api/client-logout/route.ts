import { clientSessionClearCookie } from "@/lib/api/client-auth";
import { guardPost } from "@/lib/api/guard";

/** Clear the client portal session. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "client-logout", 20);
  if (!guard.ok) return guard.response;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clientSessionClearCookie(),
    },
  });
}
