import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  setClientStatusAsStaff,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";
import { isKnownStatus } from "@/lib/onboarding/client-status";

/**
 * Staff-only: set a client's onboarding status (the chase-suppression switch).
 * Any status but "In progress" silences reminders and wilting alerts; "Website
 * is live" completes onboarding. Locked to the known status list; the actor is
 * recorded as "Staff" (the shared-passcode gate carries no per-user identity —
 * this becomes the real user when Control SSO lands).
 */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-client-status", 60);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as { clientId?: unknown; status?: unknown };
  if (
    !isRecordId(body.clientId) ||
    typeof body.status !== "string" ||
    !isKnownStatus(body.status)
  ) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const updated = await setClientStatusAsStaff(
      config,
      body.clientId,
      body.status,
      "Staff",
    );
    if (!updated) return jsonError(400, "Invalid request");
    revalidatePath("/admin");
    revalidatePath(`/admin/clients/${body.clientId}`);
    return Response.json({ ok: true, status: body.status });
  } catch (error) {
    console.error("[api/admin-client-status] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
