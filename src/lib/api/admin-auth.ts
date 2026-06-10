import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Interim staff gate for /admin while Control SSO integration is parked
 * (Andy's call, 10 Jun 2026). One shared passcode in ADMIN_PASSCODE,
 * exchanged for a signed, expiring, httpOnly cookie. Fails closed: no env
 * var, no entry. When Control SSO is revived, the introspection client
 * replaces this file and the login page — nothing else changes.
 *
 * SERVER-SIDE ONLY.
 */

export const ADMIN_COOKIE = "tg_onb_admin";
export const SESSION_SECONDS = 12 * 3600;

function signingKey(passcode: string): Buffer {
  return createHash("sha256").update(`tg-onb-admin-v1:${passcode}`).digest();
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSCODE);
}

/** Constant-time passcode comparison (over digests, per the security skill). */
export function passcodeMatches(supplied: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) return false;
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  const passcode = process.env.ADMIN_PASSCODE ?? "";
  const expires = Date.now() + SESSION_SECONDS * 1000;
  const signature = createHmac("sha256", signingKey(passcode))
    .update(String(expires))
    .digest("hex");
  return `${expires}.${signature}`;
}

/** Rotating the passcode invalidates every session — deliberately. */
export function sessionTokenValid(token: string | undefined): boolean {
  const passcode = process.env.ADMIN_PASSCODE;
  if (!token || !passcode) return false;

  const [expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now() || !signature) {
    return false;
  }

  const expected = createHmac("sha256", signingKey(passcode))
    .update(String(expires))
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sessionSetCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function sessionClearCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
