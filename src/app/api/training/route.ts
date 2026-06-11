import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  recordSignalAndTouch,
  setTrainingCompletion,
} from "@/lib/onboarding/airtable";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";
import { resolveRouteClientId } from "@/lib/api/client-auth";

/** Toggle a training item's completion for the client. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "training", 30);
  if (!guard.ok) return guard.response;

  const body = guard.body as { trainingId?: unknown; done?: unknown };
  if (!isRecordId(body.trainingId) || typeof body.done !== "boolean") {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const clientId = await resolveRouteClientId(request, config);
    if (!clientId) return jsonError(401, "Sign in first");

    const updated = await setTrainingCompletion(
      config,
      clientId,
      body.trainingId,
      body.done,
    );
    if (!updated) return jsonError(400, "Invalid request");

    if (body.done) {
      await recordSignalAndTouch(
        config,
        clientId,
        "training-completed",
        body.trainingId,
      );
    }
    revalidatePath("/training");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/training] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
