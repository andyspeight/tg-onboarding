import { airtableConfig, setTaskDueDate } from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";

/** Staff-only: set or clear a task's due date from the client detail. */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-task-due", 60);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as { taskId?: unknown; dueDate?: unknown };
  if (!isRecordId(body.taskId)) return jsonError(400, "Invalid request");

  // Empty string clears the date; otherwise a real ISO YYYY-MM-DD day.
  const dueDate = typeof body.dueDate === "string" ? body.dueDate : null;
  if (dueDate === null) return jsonError(400, "Invalid request");
  if (dueDate !== "") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return jsonError(400, "Invalid request");
    const parsed = new Date(`${dueDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const updated = await setTaskDueDate(config, body.taskId, dueDate);
    return updated ? Response.json({ ok: true }) : jsonError(400, "Invalid request");
  } catch (error) {
    console.error("[api/admin-task-due] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
