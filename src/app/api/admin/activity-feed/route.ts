import { fetchActivityFeed } from "@/lib/onboarding/airtable";
import { adminSessionFromRequest } from "@/lib/api/admin-auth";
import { jsonError } from "@/lib/api/guard";

/**
 * Staff-only: recent client activity plus the AM list, polled every minute
 * by the dashboard's desktop-alerts control. Reads are cached in the data
 * layer, so polling adds no extra Airtable traffic.
 */
export async function GET(request: Request) {
  if (!adminSessionFromRequest(request)) return jsonError(401, "Sign in first");

  const feed = await fetchActivityFeed();
  if (!feed) return jsonError(503, "Not available");

  return Response.json(feed, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
