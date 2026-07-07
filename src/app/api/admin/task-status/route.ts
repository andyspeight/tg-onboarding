import { revalidatePath } from "next/cache";
import { airtableConfig, setTaskStatusAsStaff } from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";

const STATUSES = ["todo", "in-progress", "done"] as const;
type Status = (typeof STATUSES)[number];

/**
 * Staff-only: set any task's status from the client detail's Journey tab.
 * Travelgenix-owned tasks are read-only for the client, so this is how "we're
 * on it / done" reaches their checklist. Revalidates the portal home so the
 * client sees the new status on their next load rather than waiting out ISR.
 */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-task-status", 60);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as { taskId?: unknown; status?: unknown };
  if (!isRecordId(body.taskId) || !STATUSES.includes(body.status as Status)) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const updated = await setTaskStatusAsStaff(
      config,
      body.taskId,
      body.status as Status,
    );
    if (!updated) return jsonError(400, "Invalid request");
    revalidatePath("/");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-task-status] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
