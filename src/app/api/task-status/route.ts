import { revalidatePath } from "next/cache";
import {
  airtableConfig,
  getPortalClientId,
  recordSignalAndTouch,
  setTaskStatus,
} from "@/lib/onboarding/airtable";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";

const STATUSES = ["todo", "in-progress", "done"] as const;
type Status = (typeof STATUSES)[number];

/** Update one of the client's own tasks (tri-state cycle in the portal). */
export async function POST(request: Request) {
  const guard = await guardPost(request, "task-status", 60);
  if (!guard.ok) return guard.response;

  const body = guard.body as { taskId?: unknown; status?: unknown };
  if (
    !isRecordId(body.taskId) ||
    !STATUSES.includes(body.status as Status)
  ) {
    return jsonError(400, "Invalid request");
  }

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const clientId = await getPortalClientId(config);
    if (!clientId) return jsonError(503, "Not available");

    const updated = await setTaskStatus(
      config,
      clientId,
      body.taskId,
      body.status as Status,
    );
    if (!updated) return jsonError(400, "Invalid request");

    await recordSignalAndTouch(config, clientId, "task-updated", body.taskId);
    revalidatePath("/");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/task-status] failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
