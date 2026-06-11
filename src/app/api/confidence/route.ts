import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  recordSignalAndTouch,
  saveConfidenceRating,
} from "@/lib/onboarding/airtable";
import { guardPost, jsonError } from "@/lib/api/guard";
import { resolveRouteClientId } from "@/lib/api/client-auth";

/** Record a 1–10 confidence self-rating (the go-live gate). */
export async function POST(request: Request) {
  const guard = await guardPost(request, "confidence", 10);
  if (!guard.ok) return guard.response;

  const body = guard.body as { score?: unknown };
  const score = body.score;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 10) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const clientId = await resolveRouteClientId(request, config);
    if (!clientId) return jsonError(401, "Sign in first");

    await saveConfidenceRating(config, clientId, score);
    await recordSignalAndTouch(
      config,
      clientId,
      "confidence-rated",
      String(score),
    );
    revalidatePath("/");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/confidence] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
