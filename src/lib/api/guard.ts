/**
 * Shared protection for the portal's write routes (travelgenix-security).
 *
 * Same-origin checks, per-IP rate limits (shared store when configured —
 * see rate-limit.ts), strict input validation in each route, and writes
 * scoped server-side to the session's client.
 */

import { rateLimited } from "./rate-limit";

const DEFAULT_MAX_BODY_BYTES = 10_000;

function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** Browser fetches from our own pages always send a matching Origin. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/**
 * Run the shared checks and parse the JSON body. Returns either the parsed
 * body or a ready-to-return error response. Error messages stay generic;
 * detail goes to the server log only.
 */
export async function guardPost(
  request: Request,
  route: string,
  limitPerMinute: number,
  maxBodyBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  if (!sameOrigin(request)) {
    console.warn(`[api/${route}] rejected: origin check failed`);
    return { ok: false, response: jsonError(403, "Forbidden") };
  }

  if (await rateLimited(`${route}:${clientIp(request)}`, limitPerMinute, 60_000)) {
    console.warn(`[api/${route}] rejected: rate limit`);
    return { ok: false, response: jsonError(429, "Too many requests") };
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maxBodyBytes) {
    return { ok: false, response: jsonError(413, "Request too large") };
  }

  try {
    const text = await request.text();
    if (text.length > maxBodyBytes) {
      return { ok: false, response: jsonError(413, "Request too large") };
    }
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: jsonError(400, "Invalid request") };
  }
}

export function isRecordId(value: unknown): value is string {
  return typeof value === "string" && /^rec[A-Za-z0-9]{14}$/.test(value);
}
