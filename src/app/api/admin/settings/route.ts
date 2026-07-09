import { revalidatePath } from "next/cache";
import { airtableConfig, setLunaReviewMode } from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, jsonError } from "@/lib/api/guard";

/**
 * Staff-only: flip Luna's review-before-send mode. On, Luna drafts an answer
 * for an AM to check and release; off, she replies to the client instantly.
 */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-settings", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const { lunaReviewMode } = guard.body as { lunaReviewMode?: unknown };
  if (typeof lunaReviewMode !== "boolean") {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    await setLunaReviewMode(config, lunaReviewMode);
    revalidatePath("/admin/knowledge");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-settings] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
