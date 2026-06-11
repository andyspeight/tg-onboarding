/**
 * Rate limiting with a shared store (travelgenix-security interim closed).
 *
 * When an Upstash Redis REST endpoint is configured (the Vercel
 * Marketplace integration injects UPSTASH_REDIS_REST_URL/_TOKEN, older
 * KV setups inject KV_REST_API_URL/_TOKEN), limits are enforced across
 * every serverless instance with a fixed one-minute window per key —
 * dependency-light, plain fetch, no SDK.
 *
 * Without the env (local dev) or if the store errors, it falls back to
 * the original in-memory per-instance window with a server-side log:
 * degraded limiting beats a portal outage caused by its own limiter.
 */

const memoryHits = new Map<string, number[]>();

function memoryLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (memoryHits.get(key) ?? []).filter(
    (time) => now - time < windowMs,
  );
  if (recent.length >= limit) {
    memoryHits.set(key, recent);
    return true;
  }
  recent.push(now);
  memoryHits.set(key, recent);
  return false;
}

function sharedStore(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

/** True when this hit exceeds `limit` per `windowMs` for the key. */
export async function rateLimited(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const store = sharedStore();
  if (store) {
    try {
      const bucket = Math.floor(Date.now() / windowMs);
      const redisKey = `rl:${key}:${bucket}`;
      const ttlSeconds = Math.ceil((windowMs / 1000) * 2);
      const response = await fetch(`${store.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${store.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, String(ttlSeconds)],
        ]),
        cache: "no-store",
      });
      if (response.ok) {
        const results = (await response.json()) as { result?: unknown }[];
        const count = Number(results?.[0]?.result ?? 0);
        if (count > 0) return count > limit;
      } else {
        console.error(`[rate-limit] shared store responded ${response.status}`);
      }
    } catch (error) {
      console.error("[rate-limit] shared store failed:", error);
    }
    // Store trouble → degraded per-instance limiting, never an outage.
  }
  return memoryLimited(key, limit, windowMs);
}
