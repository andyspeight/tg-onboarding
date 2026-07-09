"use client";

import { useState } from "react";

/**
 * Staff switch for Luna's review-before-send mode. On, Luna's answers to
 * client messages are parked as drafts on each client's page for an AM to
 * check, edit and release. Off, Luna replies to the client instantly.
 */
export function LunaReviewToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (busy) return;
    const next = !enabled;
    setEnabled(next);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lunaReviewMode: next }),
      });
      if (!response.ok) throw new Error(String(response.status));
    } catch {
      setEnabled(!next);
      setError("Couldn’t save that. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-card border border-border bg-surface p-4 shadow-soft">
      <div className="min-w-0">
        <p className="text-[14px] font-bold text-fg">Review Luna’s replies before they send</p>
        <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-fg-muted">
          {enabled
            ? "On — Luna drafts an answer and parks it on the client’s page. It only reaches the client once you check it, edit if needed, and hit Send."
            : "Off — Luna answers client messages instantly when the knowledge base covers them. Turn on to review each answer first."}
        </p>
        {error && (
          <p className="mt-1.5 text-[12px] font-medium text-danger" aria-live="polite">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        aria-label={`${enabled ? "Turn off" : "Turn on"} review before send`}
        className={`press relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          enabled ? "bg-accent" : "bg-border-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
