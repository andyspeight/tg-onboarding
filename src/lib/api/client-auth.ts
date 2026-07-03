import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { AirtableConfig } from "@/lib/onboarding/airtable";

/**
 * Client portal authentication (staff-issued access codes — Control SSO
 * stays parked per Andy, 10 Jun 2026).
 *
 * Activation is explicit: everything here is OFF until CLIENT_AUTH_SECRET
 * is set, and while it's off the portal keeps its interim single-client
 * behaviour. Set the secret and the portal starts requiring a session.
 *
 * The flow: staff hit "Issue access code" on a client's file → a random
 * code is generated, its HMAC stored in Airtable, the plaintext shown
 * once. The client signs in with email + code and gets a signed,
 * expiring, httpOnly cookie carrying their client id. Rotating
 * CLIENT_AUTH_SECRET invalidates every session AND every issued code —
 * deliberately, and independently of the staff passcode.
 *
 * SERVER-SIDE ONLY.
 */

export const CLIENT_COOKIE = "tg_onb_client";
export const CLIENT_SESSION_SECONDS = 30 * 24 * 3600;

export function clientAuthConfigured(): boolean {
  return Boolean(process.env.CLIENT_AUTH_SECRET);
}

function key(context: string): Buffer {
  const secret = process.env.CLIENT_AUTH_SECRET ?? "";
  return createHash("sha256").update(`${context}:${secret}`).digest();
}

/* ---------------------------- Access codes ----------------------------- */

// No 0/O/1/I — these get read over the phone.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. "TG-7KQM2-XW4HN-93PFR" — ~77 bits of entropy. */
export function generateAccessCode(): string {
  const bytes = randomBytes(15);
  let raw = "";
  for (let i = 0; i < 15; i++) {
    raw += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return `TG-${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}`;
}

/** Codes are stored hashed, bound to their client, peppered by the secret. */
export function hashAccessCode(clientId: string, code: string): string {
  return createHmac("sha256", key("tg-onb-client-code-v1"))
    .update(`${clientId}:${code.trim().toUpperCase()}`)
    .digest("hex");
}

export function accessCodeMatches(
  clientId: string,
  suppliedCode: string,
  storedHash: string,
): boolean {
  if (!storedHash) return false;
  const a = Buffer.from(hashAccessCode(clientId, suppliedCode));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------------ Sessions ------------------------------- */

function sign(payload: string): string {
  return createHmac("sha256", key("tg-onb-client-session-v1"))
    .update(payload)
    .digest("hex");
}

export function createClientSessionToken(clientId: string): string {
  const expires = Date.now() + CLIENT_SESSION_SECONDS * 1000;
  const payload = `${clientId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

/** The client id inside a valid, unexpired token — else null. */
export function clientIdFromToken(token: string | undefined): string | null {
  if (!token || !clientAuthConfigured()) return null;

  const [clientId, expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (
    !clientId ||
    !/^rec[A-Za-z0-9]{14}$/.test(clientId) ||
    !Number.isFinite(expires) ||
    expires < Date.now() ||
    !signature
  ) {
    return null;
  }

  const expected = sign(`${clientId}.${expires}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? clientId : null;
}

export function clientSessionSetCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CLIENT_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CLIENT_SESSION_SECONDS}${secure}`;
}

export function clientSessionClearCookie(): string {
  return `${CLIENT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** For API routes: the session's client id, or null. */
export function clientIdFromRequest(request: Request): string | null {
  const header = request.headers.get("cookie") ?? "";
  const token = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CLIENT_COOKIE}=`))
    ?.slice(CLIENT_COOKIE.length + 1);
  return clientIdFromToken(token);
}

/**
 * The one resolver every client write route uses: the session's client id,
 * or null (→ 401). With auth unconfigured there is NO client — writes fail
 * closed, matching the read side (pinned-oldest compat removed after the
 * 3 Jul 2026 incident).
 */
export async function resolveRouteClientId(
  request: Request,
  _config: AirtableConfig,
): Promise<string | null> {
  if (!clientAuthConfigured()) return null;
  return clientIdFromRequest(request);
}
