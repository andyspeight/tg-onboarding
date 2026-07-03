"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "@/components/icons";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_EXTENSIONS,
  fileToBase64,
  screenFiles,
} from "@/lib/onboarding/uploads";

/**
 * Staff share-a-document control on the client detail's Documents tab.
 * Files land in the client's Documents (grouped by the chosen category)
 * and appear on their portal's "Travelgenix documents" tab within a minute.
 */
export function ClientDocumentUpload({ clientId }: { clientId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const { accepted, rejected } = screenFiles(list, DOCUMENT_EXTENSIONS);
    setError(
      rejected.length > 0 ? `We couldn’t add: ${rejected.join(", ")}` : null,
    );
    if (accepted.length === 0) return;

    setBusy(true);
    const failed: string[] = [];
    for (const { file } of accepted) {
      const base64 = await fileToBase64(file);
      if (!base64) {
        failed.push(file.name);
        continue;
      }
      try {
        const response = await fetch("/api/admin/client-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            category,
            name: file.name,
            contentType: file.type || undefined,
            data: base64,
          }),
        });
        if (!response.ok) throw new Error(String(response.status));
      } catch {
        failed.push(file.name);
      }
    }
    if (failed.length > 0) {
      setError(`These didn’t upload, try again in a moment: ${failed.join(", ")}`);
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="mb-3 rounded-card border border-border bg-surface p-4 shadow-soft">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 text-[12px] text-fg-muted">
          <span className="font-semibold text-fg">Share a document</span> — it
          appears on the client’s Documents page under the category you pick.
        </p>
        <label className="flex shrink-0 items-center gap-2 text-[12px] font-medium text-fg">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-9 cursor-pointer rounded-md border border-border bg-surface px-2 text-[12px] text-fg focus:border-accent-bright focus:outline-none"
          >
            {DOCUMENT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="press flex shrink-0 cursor-pointer items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[12px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4" />
          {busy ? "Uploading..." : "Upload"}
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
          aria-label="Upload documents for this client"
          tabIndex={-1}
        />
      </div>
      {error && (
        <p aria-live="polite" className="mt-2 text-[12px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
