import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  markMessagesRead,
} from "@/lib/onboarding/airtable";
import { guardPost, jsonError } from "@/lib/api/guard";
import { resolveRouteClientId } from "@/lib/api/client-auth";

/** The client opened Messages: mark the team's messages as seen. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "messages-read", 20);
  if (!guard.ok) return guard.response;

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const clientId = await resolveRouteClientId(request, config);
    if (!clientId) return jsonError(401, "Sign in first");

    await markMessagesRead(config, clientId, "client");
    revalidatePath("/messages");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/messages-read] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
