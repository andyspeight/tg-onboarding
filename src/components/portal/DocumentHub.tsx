"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "@/components/icons";
import type { ClientDocument, DocumentStatus } from "@/lib/onboarding/types";
import { formatShortDate } from "@/lib/onboarding/dates";

const STATUS_META: Record<
  DocumentStatus | "received",
  { label: string; cls: string }
> = {
  signed: { label: "Signed", cls: "bg-success-soft text-success" },
  available: { label: "Available", cls: "bg-info-soft text-info" },
  pending: { label: "Coming soon", cls: "bg-orange-soft text-orange" },
  received: { label: "Received", cls: "bg-success-soft text-success" },
};

const TYPE_CLS: Record<string, string> = {
  PDF: "bg-danger-soft text-danger",
  DOCX: "bg-info-soft text-info",
  DOC: "bg-info-soft text-info",
  PNG: "bg-accent-soft text-accent",
  JPG: "bg-accent-soft text-accent",
  JPEG: "bg-accent-soft text-accent",
};

const ALLOWED_EXTENSIONS = [
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
const MAX_SIZE_MB = 20;

interface UploadEntry {
  id: string;
  name: string;
  fileType: string;
  sizeLabel: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocRow({
  name,
  fileType,
  meta,
  status,
}: {
  name: string;
  fileType: string;
  meta: string;
  status: keyof typeof STATUS_META;
}) {
  const statusMeta = STATUS_META[status];
  const typeCls = TYPE_CLS[fileType] ?? "bg-bg-subtle text-fg-muted";

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${typeCls}`}
      >
        {fileType}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-fg">
          {name}
        </span>
        <span className="mt-0.5 block text-[11px] text-fg-faint">{meta}</span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusMeta.cls}`}
      >
        {statusMeta.label}
      </span>
    </li>
  );
}

/**
 * The document hub from the prototype: drop zone up top, then everything
 * grouped by category with type chips and status badges. Phase 1 keeps
 * uploads in memory (validated, never sent anywhere) — real storage arrives
 * with the Airtable swap, which is also when "Available" becomes a download.
 */
export function DocumentHub({
  documents,
  className = "",
}: {
  documents: ClientDocument[];
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [...new Set(documents.map((doc) => doc.category))];

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted: UploadEntry[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files)) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        rejected.push(`${file.name} (file type not supported)`);
      } else if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        rejected.push(`${file.name} (over ${MAX_SIZE_MB} MB)`);
      } else {
        accepted.push({
          id: `upload-${Date.now()}-${accepted.length}`,
          name: file.name,
          fileType: extension.toUpperCase(),
          sizeLabel: formatSize(file.size),
        });
      }
    }

    if (accepted.length > 0) setUploads((prev) => [...prev, ...accepted]);
    setError(
      rejected.length > 0 ? `We couldn’t add: ${rejected.join(", ")}` : null,
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`press w-full cursor-pointer rounded-card border-2 border-dashed p-6 text-center transition-colors ${
          dragging
            ? "border-accent-bright bg-accent-soft/60"
            : "border-border bg-surface-2/60 hover:border-border-strong"
        }`}
      >
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-bg-subtle text-fg-muted">
          <UploadIcon className="h-5 w-5" />
        </span>
        <span className="mt-2.5 block text-[13px] font-semibold text-fg-muted">
          Drop files here or click to upload
        </span>
        <span className="mt-1 block text-[11px] text-fg-faint">
          Logo, brand assets, photos, anything we need from you
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
        className="sr-only"
        aria-label="Upload files"
        tabIndex={-1}
      />
      <p aria-live="polite" className="mt-2 text-[12px] text-danger">
        {error}
      </p>

      <div className="mt-4 space-y-5">
        {uploads.length > 0 && (
          <section>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted">
              Your uploads
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              {uploads.map((upload) => (
                <DocRow
                  key={upload.id}
                  name={upload.name}
                  fileType={upload.fileType}
                  meta={`${upload.sizeLabel} · Just now`}
                  status="received"
                />
              ))}
            </ul>
          </section>
        )}

        {categories.map((category) => (
          <section key={category}>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted">
              {category}
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              {documents
                .filter((doc) => doc.category === category)
                .map((doc) => (
                  <DocRow
                    key={doc.id}
                    name={doc.name}
                    fileType={doc.fileType}
                    meta={`${doc.status === "pending" ? "Expected" : "Added"} ${formatShortDate(doc.addedAt)}`}
                    status={doc.status}
                  />
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
