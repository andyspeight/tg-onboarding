/**
 * Shared upload screening and posting. Files are validated in the browser
 * for fast feedback, and the server enforces the same rules again in
 * /api/upload before anything reaches Airtable.
 */

export interface UploadedFile {
  id: string;
  name: string;
  /** Short type label, e.g. "PNG". */
  fileType: string;
  sizeLabel: string;
}

export interface ScreenedFile {
  meta: UploadedFile;
  file: File;
}

/**
 * Categories staff can file a shared document under. These group the
 * client's "Travelgenix documents" tab; "Your uploads" is reserved for
 * what the client sends us.
 */
export const DOCUMENT_CATEGORIES = [
  "Getting started",
  "Contracts",
  "Supplier guides",
  "Technical",
  "Training",
  "Your site",
];

/** General document hub uploads. */
export const DOCUMENT_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
];

/** Files clients and staff can attach to a thread message. */
export const MESSAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "pdf"];

/** Logo / brand asset uploads — images and the vector formats designers use. */
export const LOGO_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "pdf",
  "ai",
  "eps",
  "zip",
];

/**
 * Per-file size cap. 3MB binary keeps the base64 payload inside Vercel's
 * function body limit; bigger files arrive with real blob storage later.
 */
export const MAX_UPLOAD_MB = 3;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Split a picked file list into accepted entries and rejection reasons. */
export function screenFiles(
  files: FileList | File[],
  allowedExtensions: string[],
): { accepted: ScreenedFile[]; rejected: string[] } {
  const accepted: ScreenedFile[] = [];
  const rejected: string[] = [];

  for (const file of Array.from(files)) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension)) {
      rejected.push(`${file.name} (file type not supported)`);
    } else if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      rejected.push(`${file.name} (over ${MAX_UPLOAD_MB} MB)`);
    } else {
      accepted.push({
        meta: {
          id: makeId(),
          name: file.name,
          fileType: extension.toUpperCase(),
          sizeLabel: formatFileSize(file.size),
        },
        file,
      });
    }
  }

  return { accepted, rejected };
}

/** Browser-side: a File as bare base64, or null when reading fails. */
export async function fileToBase64(file: File): Promise<string | null> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return dataUrl.split(",")[1] || null;
  } catch {
    return null;
  }
}

/**
 * Browser-side: send one screened file to /api/upload. True on success.
 * `field` tags the upload with the intake field it came from, so the form
 * can show it back later.
 */
export async function postUpload(
  kind: "document" | "logo",
  file: File,
  field?: string,
): Promise<boolean> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const base64 = dataUrl.split(",")[1] ?? "";
    if (!base64) return false;

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        name: file.name,
        contentType: file.type || undefined,
        data: base64,
        ...(field ? { field } : {}),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
