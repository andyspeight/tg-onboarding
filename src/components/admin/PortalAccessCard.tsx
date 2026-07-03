"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/onboarding/dates";

/**
 * Issue and rotate a client's portal login from their file. Issuing emails
 * the code to the client automatically; it's also shown here once as a
 * fallback. Reissuing kills the old code on the spot.
 */
export function PortalAccessCard({
  clientId,
  contactEmail,
  codeIssuedAt,
  lastLoginAt,
}: {
  clientId: string;
  contactEmail?: string;
  codeIssuedAt?: string;
  lastLoginAt?: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const issued = Boolean(codeIssuedAt) || code !== null;

  async function issue() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/client-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (response.status === 503) {
        setError(
          "Client logins aren’t switched on yet — set CLIENT_AUTH_SECRET on the Vercel project first.",
        );
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      const result = (await response.json()) as {
        code?: string;
        emailed?: boolean;
      };
      setCode(result.code ?? null);
      setEmailed(Boolean(result.emailed));
      setCopied(false);
    } catch {
      setError("That didn’t work. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Selection fallback: the code is visible to copy by hand.
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-fg">Portal access</p>
          <p className="mt-0.5 text-[12px] text-fg-muted">
            {issued ? (
              <>
                Code issued{" "}
                {code
                  ? "just now"
                  : codeIssuedAt
                    ? formatShortDate(codeIssuedAt)
                    : ""}
                {" · "}
                {lastLoginAt
                  ? `last signed in ${formatShortDate(lastLoginAt)}`
                  : "hasn’t signed in yet"}
                {contactEmail ? ` · signs in as ${contactEmail}` : ""}
              </>
            ) : (
              <>
                No login issued yet
                {contactEmail
                  ? ` — they’ll sign in as ${contactEmail}`
                  : " — add their email first"}
                .
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={issue}
          disabled={busy || !contactEmail}
          className="press h-9 shrink-0 cursor-pointer rounded-md border border-border px-3.5 text-[12px] font-semibold text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:cursor-default disabled:opacity-60"
        >
          {busy
            ? "Issuing..."
            : issued
              ? "Reissue access code"
              : "Issue access code"}
        </button>
      </div>

      {code && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-accent/25 bg-accent-soft px-3.5 py-3">
          <code className="text-[15px] font-bold tracking-wide text-accent">
            {code}
          </code>
          <button
            type="button"
            onClick={copy}
            className="press cursor-pointer rounded-md border border-accent/30 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-contrast"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <p className="w-full text-[11px] leading-relaxed text-fg-muted">
            {emailed
              ? `Emailed to ${contactEmail ?? "the client"} with their sign-in link. Shown here once as backup — reissuing replaces it.`
              : `The email didn’t send, so share it with ${contactEmail ?? "the client"} yourself — shown once only. Reissuing replaces it.`}
          </p>
        </div>
      )}

      {error && (
        <p aria-live="polite" className="mt-2 text-[12px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
