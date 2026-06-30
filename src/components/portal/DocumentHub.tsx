"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "@/components/icons";
import type { ClientDocument, DocumentStatus } from "@/lib/onboarding/types";
import { formatShortDate } from "@/lib/onboarding/dates";
import {
  DOCUMENT_EXTENSIONS,
  postUpload,
  screenFiles,
  type UploadedFile,
} from "@/lib/onboarding/uploads";

const STATUS_META: Record<
  DocumentStatus | "received" | "uploading",
  { label: string; cls: string }
> = {
  signed: { label: "Signed", cls: "bg-success-soft text-success" },
  available: { label: "Available", cls: "bg-info-soft text-info" },
  pending: { label: "Coming soon", cls: "bg-orange-soft text-orange" },
  received: { label: "Received", cls: "bg-success-soft text-success" },
  uploading: { label: "Uploading", cls: "bg-info-soft text-info" },
};

const TYPE_CLS: Record<string, string> = {
  PDF: "bg-danger-soft text-danger",
  DOCX: "bg-info-soft text-info",
  DOC: "bg-info-soft text-info",
  PNG: "bg-accent-soft text-accent",
  JPG: "bg-accent-soft text-accent",
  JPEG: "bg-accent-soft text-accent",
};

interface UploadEntry {
  meta: UploadedFile;
  state: "uploading" | "done";
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
 * grouped by category with type chips and status badges. When live, uploads
 * are screened, sent to /api/upload and stored against the Documents table;
 * on mock data they stay in the browser.
 */
export function DocumentHub({
  documents,
  live,
  className = "",
}: {
  documents: ClientDocument[];
  live: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anything the client uploads is filed under this category server-side.
  const UPLOAD_CATEGORY = "Your uploads";
  const yourDocs = documents.filter((doc) => doc.category === UPLOAD_CATEGORY);
  const providedDocs = documents.filter(
    (doc) => doc.category !== UPLOAD_CATEGORY,
  );
  const providedCategories = [
    ...new Set(providedDocs.map((doc) => doc.category)),
  ];
  const hasYourDocs = uploads.length > 0 || yourDocs.length > 0;

  function setEntryState(id: string, state: UploadEntry["state"]) {
    setUploads((prev) =>
      prev.map((entry) =>
        entry.meta.id === id ? { ...entry, state } : entry,
      ),
    );
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const { accepted, rejected } = screenFiles(files, DOCUMENT_EXTENSIONS);
    setError(
      rejected.length > 0 ? `We couldn’t add: ${rejected.join(", ")}` : null,
    );
    if (accepted.length === 0) return;

    if (!live) {
      setUploads((prev) => [
        ...prev,
        ...accepted.map(({ meta }) => ({ meta, state: "done" as const })),
      ]);
      return;
    }

    setUploads((prev) => [
      ...prev,
      ...accepted.map(({ meta }) => ({ meta, state: "uploading" as const })),
    ]);
    const failed: string[] = [];
    for (const { meta, file } of accepted) {
      const ok = await postUpload("document", file);
      if (ok) {
        setEntryState(meta.id, "done");
      } else {
        setUploads((prev) => prev.filter((entry) => entry.meta.id !== meta.id));
        failed.push(meta.name);
      }
    }
    if (failed.length > 0) {
      setError(`These didn’t upload, try again in a moment: ${failed.join(", ")}`);
    }
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
          Anything you upload here is filed under “Your documents” below
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
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

      <div className="mt-5 space-y-7">
        <section>
          <h2 className="text-[13px] font-bold text-fg">Your documents</h2>
          <p className="mb-2 mt-0.5 text-[12px] text-fg-faint">
            Everything you’ve sent us.
          </p>
          {hasYourDocs ? (
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              {uploads.map((entry) => (
                <DocRow
                  key={entry.meta.id}
                  name={entry.meta.name}
                  fileType={entry.meta.fileType}
                  meta={`${entry.meta.sizeLabel} · Just now`}
                  status={entry.state === "uploading" ? "uploading" : "received"}
                />
              ))}
              {yourDocs.map((doc) => (
                <DocRow
                  key={doc.id}
                  name={doc.name}
                  fileType={doc.fileType}
                  meta={`Added ${formatShortDate(doc.addedAt)}`}
                  status={doc.status}
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-card border border-dashed border-border bg-surface-2/50 px-4 py-5 text-center text-[12px] text-fg-faint">
              Nothing here yet. Anything you upload above appears here.
            </p>
          )}
        </section>

        {providedCategories.length > 0 && (
          <section>
            <h2 className="text-[13px] font-bold text-fg">From Travelgenix</h2>
            <p className="mb-2 mt-0.5 text-[12px] text-fg-faint">
              Guides, contracts and training documents we’ve shared with you.
            </p>
            <div className="space-y-4">
              {providedCategories.map((category) => (
                <div key={category}>
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted">
                    {category}
                  </h3>
                  <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-soft">
                    {providedDocs
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
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
