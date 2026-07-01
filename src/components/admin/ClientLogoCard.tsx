"use client";

import { useRef, useState } from "react";
import { UploadIcon } from "@/components/icons";
import { fileToBase64, screenFiles } from "@/lib/onboarding/uploads";

const LOGO_IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];

/**
 * Staff logo uploader on the client detail. Uploads to the client's Logo
 * attachment (their dashboard avatar) and reloads so the new logo shows.
 */
export function ClientLogoCard({
  clientId,
  company,
  logoUrl,
}: {
  clientId: string;
  company: string;
  logoUrl?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const { accepted, rejected } = screenFiles(list, LOGO_IMAGE_EXTENSIONS);
    setError(rejected.length > 0 ? `We couldn’t add: ${rejected.join(", ")}` : null);
    const first = accepted[0];
    if (!first) return;

    setBusy(true);
    const base64 = await fileToBase64(first.file);
    if (!base64) {
      setError("Couldn’t read that file. Try another.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/client-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name: first.file.name,
          contentType: first.file.type || undefined,
          data: base64,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      window.location.reload();
    } catch {
      setError("That didn’t upload. Try again in a moment.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-md border border-border bg-white object-contain"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-accent-soft text-lg font-bold text-accent">
            {company.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-fg">Client logo</p>
          <p className="mt-0.5 text-[12px] text-fg-muted">
            Shown as this client’s avatar across the dashboard. PNG, JPG, WebP
            or SVG.
          </p>
          {error && (
            <p aria-live="polite" className="mt-1 text-[12px] text-danger">
              {error}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="press flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-[12px] font-semibold text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:cursor-default disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4" />
          {busy ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={LOGO_IMAGE_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
          aria-label="Upload client logo"
          tabIndex={-1}
        />
      </div>
    </section>
  );
}
