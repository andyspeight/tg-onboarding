import {
  airtableConfig,
  createKbArticle,
  deleteKbArticle,
  setKbActive,
  updateKbArticle,
  type KbInput,
} from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { guardPost, isRecordId, jsonError } from "@/lib/api/guard";

const CATEGORIES = [
  "Getting set up",
  "Building your site",
  "Training",
  "Suppliers",
  "Going live",
  "General",
];

/** Validate a knowledge article payload; null when anything's off. */
function parseKbInput(body: Record<string, unknown>): KbInput | null {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length === 0 || title.length > 120) return null;

  const articleBody = typeof body.body === "string" ? body.body.trim() : "";
  if (articleBody.length === 0 || articleBody.length > 1500) return null;

  const keywords = typeof body.keywords === "string" ? body.keywords.trim() : "";
  if (keywords.length > 300) return null;

  if (typeof body.category !== "string" || !CATEGORIES.includes(body.category)) {
    return null;
  }

  return { title, body: articleBody, keywords, category: body.category };
}

/** Staff-only: add an article Luna can answer from. */
export async function POST(request: Request) {
  const guard = await guardPost(request, "admin-knowledge", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const input = parseKbInput(guard.body as Record<string, unknown>);
  if (!input) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    await createKbArticle(config, input);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/admin-knowledge] create failed:", error);
    return jsonError(502, "Something went wrong");
  }
}

/** Staff-only: toggle active, or update the full article when fields present. */
export async function PATCH(request: Request) {
  const guard = await guardPost(request, "admin-knowledge", 60);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as Record<string, unknown>;
  if (!isRecordId(body.articleId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    if (typeof body.active === "boolean" && body.title === undefined) {
      const toggled = await setKbActive(config, body.articleId, body.active);
      return toggled ? Response.json({ ok: true }) : jsonError(400, "Invalid request");
    }

    const input = parseKbInput(body);
    if (!input) return jsonError(400, "Invalid request");
    const updated = await updateKbArticle(config, body.articleId, input);
    return updated ? Response.json({ ok: true }) : jsonError(400, "Invalid request");
  } catch (error) {
    console.error("[api/admin-knowledge] update failed:", error);
    return jsonError(502, "Something went wrong");
  }
}

/** Staff-only: remove an article outright. */
export async function DELETE(request: Request) {
  const guard = await guardPost(request, "admin-knowledge", 30);
  if (!guard.ok) return guard.response;
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const body = guard.body as { articleId?: unknown };
  if (!isRecordId(body.articleId)) return jsonError(400, "Invalid request");

  const config = airtableConfig();
  if (!config) return jsonError(503, "Not available");

  try {
    const removed = await deleteKbArticle(config, body.articleId);
    return removed ? Response.json({ ok: true }) : jsonError(400, "Invalid request");
  } catch (error) {
    console.error("[api/admin-knowledge] delete failed:", error);
    return jsonError(502, "Something went wrong");
  }
}
