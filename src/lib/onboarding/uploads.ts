/**
 * Shared client-side upload screening. Phase 1 keeps files in memory and
 * never sends them anywhere; these rules still mirror what the server will
 * enforce once real storage lands, so the UX doesn't change at swap time.
 */

export interface UploadedFile {
  id: string;
  name: string;
  /** Short type label, e.g. "PNG". */
  fileType: string;
  sizeLabel: string;
}

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

export const MAX_UPLOAD_MB = 20;

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
): { accepted: UploadedFile[]; rejected: string[] } {
  const accepted: UploadedFile[] = [];
  const rejected: string[] = [];

  for (const file of Array.from(files)) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension)) {
      rejected.push(`${file.name} (file type not supported)`);
    } else if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      rejected.push(`${file.name} (over ${MAX_UPLOAD_MB} MB)`);
    } else {
      accepted.push({
        id: makeId(),
        name: file.name,
        fileType: extension.toUpperCase(),
        sizeLabel: formatFileSize(file.size),
      });
    }
  }

  return { accepted, rejected };
}
