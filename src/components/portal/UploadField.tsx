"use client";

import { useRef, useState } from "react";
import { UploadIcon, XIcon } from "@/components/icons";
import {
  LOGO_EXTENSIONS,
  postUpload,
  screenFiles,
  type UploadedFile,
} from "@/lib/onboarding/uploads";

interface LogoEntry {
  meta: UploadedFile;
  state: "uploading" | "done";
}

/**
 * Compact in-form upload field (used for logos in Branding & design). When
 * live, files are screened and stored straight into the client's Documents
 * in Airtable (so they appear under "Your uploads" too); on mock data they
 * stay in the browser.
 */
export function UploadField({
  id,
  files,
  live,
  initial = [],
  onChange,
}: {
  id: string;
  files: UploadedFile[];
  live: boolean;
  /** Files already uploaded against this field, shown read-only. */
  initial?: { id: string; name: string; fileType: string; url?: string }[];
  onChange: (files: UploadedFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, LogoEntry["state"]>>({});

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const { accepted, rejected } = screenFiles(list, LOGO_EXTENSIONS);
    setError(
      rejected.length > 0 ? `We couldn’t add: ${rejected.join(", ")}` : null,
    );
    if (accepted.length === 0) return;

    if (!live) {
      onChange([...files, ...accepted.map(({ meta }) => meta)]);
      return;
    }

    let current = [...files, ...accepted.map(({ meta }) => meta)];
    onChange(current);
    setStates((prev) => ({
      ...prev,
      ...Object.fromEntries(
        accepted.map(({ meta }) => [meta.id, "uploading" as const]),
      ),
    }));

    const failed: string[] = [];
    for (const { meta, file } of accepted) {
      const ok = await postUpload("logo", file, id);
      if (ok) {
        setStates((prev) => ({ ...prev, [meta.id]: "done" }));
      } else {
        current = current.filter((item) => item.id !== meta.id);
        onChange(current);
        failed.push(meta.name);
      }
    }
    if (failed.length > 0) {
      setError(`These didn’t upload, try again in a moment: ${failed.join(", ")}`);
    }
  }

  return (
    <div>
      <button
        id={id}
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
        className={`press flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border-2 border-dashed px-4 py-4 transition-colors ${
          dragging
            ? "border-accent-bright bg-accent-soft/60"
            : "border-border bg-surface-2/60 hover:border-border-strong"
        }`}
      >
        <UploadIcon className="h-[18px] w-[18px] shrink-0 text-fg-muted" />
        <span className="text-[13px] font-medium text-fg-muted">
          Drop your logo here or click to upload
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={LOGO_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
        className="sr-only"
        aria-label="Upload logo files"
        tabIndex={-1}
      />
      {error && (
        <p aria-live="polite" className="mt-1.5 text-[12px] text-danger">
          {error}
        </p>
      )}

      {initial.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {initial.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2"
            >
              {file.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded border border-border bg-white object-contain"
                />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent-soft text-[9px] font-bold text-accent">
                  {file.fileType}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-fg">
                  {file.name}
                </span>
                <span className="block text-[11px] text-success">
                  ✓ Uploaded — saved to your documents
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((file) => {
            const state = states[file.id];
            return (
              <li
                key={file.id}
                className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent-soft text-[9px] font-bold text-accent">
                  {file.fileType}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-fg">
                    {file.name}
                  </span>
                  <span className="block text-[11px] text-fg-faint">
                    {file.sizeLabel}
                    {live &&
                      (state === "uploading"
                        ? " · Uploading"
                        : " · Saved to your documents")}
                  </span>
                </span>
                {!live && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(files.filter((item) => item.id !== file.id))
                    }
                    aria-label={`Remove ${file.name}`}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-faint transition-colors hover:bg-bg-subtle hover:text-fg"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
