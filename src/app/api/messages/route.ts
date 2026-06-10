import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  getPortalClientId,
  recordSignalAndTouch,
  sendMessage,
} from "@/lib/onboarding/airtable";
import { guardPost, jsonError } from "@/lib/api/guard";

const MAX_BODY_CHARS = 2000;

/** The client sends a message to the team. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "messages", 20);
  if (!guard.ok) return guard.response;

  const { body } = guard.body as { body?: unknown };
  if (
    typeof body !== "string" ||
    body.trim().length === 0 ||
    body.length > MAX_BODY_CHARS
  ) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const clientId = await getPortalClientId(config);
    if (!clientId) return jsonError(503, "Not available");

    await sendMessage(config, clientId, "client", body.trim());
    // A message IS engagement — it feeds Last Active and the wilting rules.
    await recordSignalAndTouch(config, clientId, "message-sent", "");
    revalidatePath("/messages");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/messages] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
