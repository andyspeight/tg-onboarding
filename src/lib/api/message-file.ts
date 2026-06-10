import type { MessageFile } from "@/lib/onboarding/airtable";
import { MAX_UPLOAD_MB, MESSAGE_EXTENSIONS } from "@/lib/onboarding/uploads";

/**
 * Validate an optional message attachment from a request body. Mirrors the
 * /api/upload rules: bare filename, allowed extension, sane content type,
 * binary size cap. Returns:
 * - undefined  → no attachment sent (fine)
 * - null       → attachment sent but invalid (reject the request)
 * - MessageFile → safe to store
 */
export function parseMessageFile(
  raw: unknown,
): MessageFile | null | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object") return null;

  const { name, contentType, data } = raw as {
    name?: unknown;
    contentType?: unknown;
    data?: unknown;
  };
  if (typeof name !== "string" || typeof data !== "string") return null;

  // Bare filename only — no path tricks.
  const safeName = name.split(/[\\/]/).pop()?.trim().slice(0, 150);
  const extension = safeName?.split(".").pop()?.toLowerCase() ?? "";
  if (!safeName || !MESSAGE_EXTENSIONS.includes(extension)) return null;

  const safeType =
    typeof contentType === "string" &&
    /^[\w.+-]+\/[\w.+-]+$/.test(contentType) &&
    contentType.length <= 100
      ? contentType
      : "application/octet-stream";

  let bytes: Buffer;
  try {
    bytes = Buffer.from(data, "base64");
  } catch {
    return null;
  }
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_MB * 1024 * 1024) {
    return null;
  }

  return { name: safeName, contentType: safeType, base64: data };
}
