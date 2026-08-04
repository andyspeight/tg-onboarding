"use client";

import { useState } from "react";
import {
  CLIENT_STATUS,
  CLIENT_STATUS_OPTIONS,
  isComplete,
  type ClientStatus,
} from "@/lib/onboarding/client-status";
import { STATUS_META } from "@/components/admin/client-status-meta";

/**
 * The chase-suppression control. Staff pick one status; anything but
 * "In progress" silences client reminders and staff wilting alerts. Optimistic
 * save with rollback, mirroring the task-status pattern on this page.
 */
export function ClientStatusCard({
  clientId,
  status,
  setBy,
  setAt,
}: {
  clientId: string;
  status: ClientStatus;
  setBy?: string;
  setAt?: string;
}) {
  const [current, setCurrent] = useState<ClientStatus>(status);
  const [savedBy, setSavedBy] = useState<string | undefined>(setBy);
  const [savedAt, setSavedAt] = useState<string | undefined>(setAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function change(next: ClientStatus) {
    if (next === current) return;
    const prev = { current, savedBy, savedAt };
    setCurrent(next);
    setSaving(true);
    setError(null);
    fetch("/api/admin/client-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, status: next }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        setSavedBy("Staff");
        setSavedAt(new Date().toISOString());
      })
      .catch(() => {
        setCurrent(prev.current);
        setSavedBy(prev.savedBy);
        setSavedAt(prev.savedAt);
        setError("That status didn’t save. Try again in a moment.");
      })
      .finally(() => setSaving(false));
  }

  const meta = STATUS_META[current];
  const chasing = current === CLIENT_STATUS.inProgress;

  const explanation = chasing
    ? "Reminders and wilting alerts run as normal."
    : isComplete(current)
      ? "Onboarding complete — this client has left the active dashboard and is never chased again."
      : "Chasing paused — no client reminders and no wilting alerts. Stays paused until you change it back.";

  const whenLabel = savedAt
    ? new Date(savedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold text-fg">Onboarding status</h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${meta.cls}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.long}
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-fg-muted">
            {explanation}
          </p>
          {(whenLabel || savedBy) && (
            <p className="mt-1 text-[11px] text-fg-faint">
              Set{savedBy ? ` by ${savedBy}` : ""}
              {whenLabel ? ` · ${whenLabel}` : ""}
            </p>
          )}
          <p aria-live="polite" className="mt-1 text-[11px] text-danger">
            {error}
          </p>
        </div>

        <label className="flex shrink-0 flex-col gap-1">
          <span className="sr-only">Set onboarding status</span>
          <select
            value={current}
            disabled={saving}
            onChange={(event) => change(event.target.value as ClientStatus)}
            className="press cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-[13px] font-medium text-fg shadow-soft transition-colors hover:border-border-strong focus:border-accent focus:outline-none disabled:opacity-60"
          >
            {CLIENT_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
