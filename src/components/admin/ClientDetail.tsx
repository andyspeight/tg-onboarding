"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { ClientMessages } from "@/components/admin/ClientMessages";
import { ClientLogoCard } from "@/components/admin/ClientLogoCard";
import { ClientDocumentUpload } from "@/components/admin/ClientDocumentUpload";
import { PortalAccessCard } from "@/components/admin/PortalAccessCard";
import type { AdminClientDetail } from "@/lib/onboarding/health";
import { formatShortDate } from "@/lib/onboarding/dates";

const HEALTH_LABEL = { green: "On track", amber: "Slowing", red: "At risk" };
const HEALTH_DOT = { green: "bg-success", amber: "bg-warning", red: "bg-danger" };

const STATUS_CLS: Record<string, string> = {
  done: "bg-success-soft text-success",
  "in-progress": "bg-info-soft text-info",
  todo: "bg-bg-subtle text-fg-muted",
};

const OWNER_LABEL: Record<string, string> = {
  client: "Client",
  travelgenix: "Travelgenix",
  both: "Both",
};

type TabId = "journey" | "documents" | "intake" | "activity" | "messages";

/**
 * Where clicking a completed client task should jump — to the answer they
 * typed (Intake) or the file they sent (Documents). Tasks with no clear
 * artefact (calls, internal work) aren't linked.
 */
function taskJump(task: {
  title: string;
  audience: string;
  owner: string;
}): TabId | null {
  if (task.audience === "internal" || task.owner === "travelgenix") return null;
  const t = task.title.toLowerCase();
  if (/details|form|domain|go-live date|destination/.test(t)) return "intake";
  if (/logo|brand|product content|image|about|supplier|feedback|review and approve/.test(t)) {
    return "documents";
  }
  return null;
}

/** Where clicking a Recent Activity row should jump. */
function signalJump(signal: string): TabId | null {
  const s = signal.toLowerCase();
  if (s.includes("document")) return "documents";
  if (s.includes("intake")) return "intake";
  if (s.includes("task")) return "journey";
  return null;
}

const JUMP_LABEL: Record<TabId, string> = {
  intake: "View answer",
  documents: "View files",
  journey: "View task",
  activity: "View",
  messages: "View",
};

/** Staff view of one client: the whole journey, internal tasks included. */
export function ClientDetail({ detail }: { detail: AdminClientDetail }) {
  const { summary } = detail;
  const [tab, setTab] = useState<TabId>("journey");
  const [docTab, setDocTab] = useState<"client" | "tg">("client");
  // Staff-edited due dates and statuses, optimistic; roll back if a save fails.
  const [dues, setDues] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);

  function saveDueDate(taskId: string, previous: string, next: string) {
    setDues((prev) => ({ ...prev, [taskId]: next }));
    setEditError(null);
    fetch("/api/admin/task-due", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, dueDate: next }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
      })
      .catch(() => {
        setDues((prev) => ({ ...prev, [taskId]: previous }));
        setEditError("That due date didn’t save. Try again in a moment.");
      });
  }

  function saveStatus(taskId: string, previous: string, next: string) {
    setStatuses((prev) => ({ ...prev, [taskId]: next }));
    setEditError(null);
    fetch("/api/admin/task-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: next }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
      })
      .catch(() => {
        setStatuses((prev) => ({ ...prev, [taskId]: previous }));
        setEditError("That status change didn’t save. Try again in a moment.");
      });
  }

  const clientDocs = detail.documents.filter(
    (doc) => doc.category === "Your uploads",
  );
  const tgDocs = detail.documents.filter(
    (doc) => doc.category !== "Your uploads",
  );
  const shownDocs = docTab === "client" ? clientDocs : tgDocs;

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "journey", label: "Journey" },
    { id: "documents", label: "Documents", badge: detail.documents.length },
    { id: "intake", label: "Intake answers" },
    { id: "activity", label: "Activity" },
    {
      id: "messages",
      label: "Messages",
      badge: summary.unreadMessages || undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {summary.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={summary.logoUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-md border border-border bg-white object-contain"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-sm font-bold text-accent">
                {summary.company.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${HEALTH_DOT[summary.health]}`}
                  title={HEALTH_LABEL[summary.health]}
                />
                <span className="text-lg font-extrabold tracking-tight text-fg">
                  {summary.company}
                </span>
                {summary.plan && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                    {summary.plan}
                  </span>
                )}
              </p>
              <p className="mt-1 text-[13px] text-fg-muted">
                {summary.contactName}
                {detail.contactEmail ? ` · ${detail.contactEmail}` : ""}
                {detail.startedAt
                  ? ` · Started ${formatShortDate(detail.startedAt)} (day ${summary.dayCount})`
                  : ""}
              </p>
              {summary.reasons.length > 0 && (
                <p className="mt-1.5 text-[13px] font-medium text-warning">
                  {summary.reasons.join(". ")}.
                </p>
              )}
            </div>
          </div>
          <div className="w-full max-w-[220px]">
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] font-medium text-fg-muted">Progress</span>
              <span className="text-xl font-extrabold tracking-tight text-accent tabular-nums">
                {summary.pct}%
              </span>
            </div>
            <ProgressBar
              value={summary.pct}
              label={`${summary.company} progress`}
              className="mt-1"
            />
            <p className="mt-1.5 text-[11px] text-fg-faint">
              {summary.phaseTitle} · intake {summary.intakePct}% · quiet{" "}
              {summary.daysQuiet}d
            </p>
          </div>
        </div>
      </section>

      <ClientLogoCard
        clientId={summary.id}
        company={summary.company}
        logoUrl={summary.logoUrl}
      />

      <PortalAccessCard
        clientId={summary.id}
        contactEmail={detail.contactEmail}
        codeIssuedAt={detail.portalAccess.codeIssuedAt}
        lastLoginAt={detail.portalAccess.lastLoginAt}
      />

      <div
        role="tablist"
        aria-label="Client sections"
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-2/60 p-1"
      >
        {tabs.map(({ id, label, badge }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={`press flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-surface text-fg shadow-soft"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {label}
              {badge ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold ${
                    id === "messages"
                      ? "bg-accent text-accent-contrast"
                      : "bg-bg-subtle text-fg-muted"
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "journey" && (
        <section>
          <p aria-live="polite" className="mb-2 text-[12px] font-medium text-danger">
            {editError}
          </p>
          <div className="space-y-3">
            {detail.phases.map((phase) => (
              <div
                key={phase.number}
                className="overflow-hidden rounded-card border border-border bg-surface shadow-soft"
              >
                <p className="border-b border-border px-4 py-2.5 text-[12px] font-bold text-fg">
                  {phase.number}. {phase.title}
                </p>
                <ul className="divide-y divide-border">
                  {phase.tasks.map((task) => {
                    const jump = taskJump(task);
                    return (
                      <li key={task.id}>
                        <div
                          className={`flex items-center gap-3 px-4 py-2.5 ${
                            jump ? "transition-colors hover:bg-surface-2" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-fg">
                              {task.title}
                              {task.optional && (
                                <span className="ml-2 text-[10px] font-normal text-fg-faint">
                                  optional
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[11px] text-fg-faint">
                              {OWNER_LABEL[task.owner]}
                              {task.audience === "internal" ? " · internal" : ""}
                            </p>
                          </div>
                          <label className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-fg-faint">
                            Due
                            <input
                              type="date"
                              value={dues[task.id] ?? task.dueDate ?? ""}
                              onChange={(event) =>
                                saveDueDate(
                                  task.id,
                                  dues[task.id] ?? task.dueDate ?? "",
                                  event.target.value,
                                )
                              }
                              aria-label={`Due date for ${task.title}`}
                              className="h-7 cursor-pointer rounded-md border border-border bg-surface px-1.5 text-[11px] text-fg-muted transition-colors hover:border-border-strong focus:border-accent-bright focus:outline-none focus:ring-2 focus:ring-accent-bright/15"
                            />
                          </label>
                          {jump && (
                            <button
                              type="button"
                              onClick={() => setTab(jump)}
                              className="press shrink-0 cursor-pointer rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent-soft"
                            >
                              {JUMP_LABEL[jump]} →
                            </button>
                          )}
                          {task.audience === "internal" && (
                            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-fg-faint">
                              Internal
                            </span>
                          )}
                          <select
                            value={statuses[task.id] ?? task.status}
                            onChange={(event) =>
                              saveStatus(
                                task.id,
                                statuses[task.id] ?? task.status,
                                event.target.value,
                              )
                            }
                            aria-label={`Status for ${task.title}`}
                            className={`press shrink-0 cursor-pointer rounded-full border-0 py-1 pl-2.5 pr-1 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent-bright/30 ${STATUS_CLS[statuses[task.id] ?? task.status]}`}
                          >
                            <option value="todo">To do</option>
                            <option value="in-progress">In progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </li>
                    );
                  })}
                  {phase.tasks.length === 0 && (
                    <li className="px-4 py-3 text-[12px] text-fg-faint">No tasks.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "documents" && (
        <section>
          <ClientDocumentUpload clientId={summary.id} />
          <div
            role="tablist"
            aria-label="Document source"
            className="mb-3 inline-flex rounded-lg border border-border bg-surface-2/60 p-1"
          >
            {[
              { id: "client" as const, label: "Client documents", count: clientDocs.length },
              { id: "tg" as const, label: "Travelgenix documents", count: tgDocs.length },
            ].map(({ id, label, count }) => {
              const active = docTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setDocTab(id)}
                  className={`press cursor-pointer rounded-md px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                    active
                      ? "bg-surface text-fg shadow-soft"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
            <ul className="divide-y divide-border">
              {shownDocs.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-fg">{doc.name}</p>
                    <p className="text-[11px] text-fg-faint">
                      {doc.category}
                      {doc.addedAt ? ` · ${formatShortDate(doc.addedAt)}` : ""}
                    </p>
                  </div>
                  {doc.url && (
                    <>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="press shrink-0 cursor-pointer rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                      >
                        View
                      </a>
                      <a
                        href={`/api/documents/download?id=${doc.id}`}
                        className="press shrink-0 cursor-pointer rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                      >
                        Download
                      </a>
                    </>
                  )}
                  <span className="shrink-0 rounded-full bg-bg-subtle px-2.5 py-0.5 text-[10px] font-semibold text-fg-muted">
                    {doc.status}
                  </span>
                </li>
              ))}
              {shownDocs.length === 0 && (
                <li className="px-4 py-6 text-center text-[12px] text-fg-muted">
                  {docTab === "client"
                    ? "This client hasn’t uploaded anything yet."
                    : "Nothing shared with this client yet."}
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      {tab === "intake" && (
        <section>
          <div className="space-y-3">
            {detail.intake.map((section) => (
              <div
                key={section.title}
                className="overflow-hidden rounded-card border border-border bg-surface shadow-soft"
              >
                <p className="border-b border-border px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-fg-muted">
                  {section.title}
                </p>
                <ul className="divide-y divide-border">
                  {section.fields.map((field) => (
                    <li key={field.label} className="px-4 py-2">
                      <p className="text-[11px] text-fg-faint">{field.label}</p>
                      <p className="text-[12px] text-fg">
                        {field.value || (
                          <span className="text-fg-faint">Not answered yet</span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "activity" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-2.5 text-[13px] font-bold text-fg">Recent activity</h2>
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              <ul className="divide-y divide-border">
                {detail.signals.map((signal) => {
                  const jump = signalJump(signal.signal);
                  return (
                    <li key={signal.id}>
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-fg">{signal.signal}</p>
                          <p className="text-[11px] text-fg-faint">
                            {signal.detail ? `${signal.detail} · ` : ""}
                            {signal.whenLabel}
                          </p>
                        </div>
                        {jump && (
                          <button
                            type="button"
                            onClick={() => setTab(jump)}
                            className="press shrink-0 cursor-pointer rounded-md border border-border px-2 py-0.5 text-[10px] font-medium text-accent transition-colors hover:bg-accent-soft"
                          >
                            {JUMP_LABEL[jump]} →
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
                {detail.signals.length === 0 && (
                  <li className="px-4 py-6 text-center text-[12px] text-fg-muted">
                    No activity recorded yet.
                  </li>
                )}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-2.5 text-[13px] font-bold text-fg">Confidence ratings</h2>
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              <ul className="divide-y divide-border">
                {detail.confidences.map((rating) => (
                  <li key={rating.id} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-[13px] font-bold tabular-nums text-fg">
                      {rating.score}/10
                    </p>
                    <p className="text-[11px] text-fg-faint">{rating.whenLabel}</p>
                  </li>
                ))}
                {detail.confidences.length === 0 && (
                  <li className="px-4 py-6 text-center text-[12px] text-fg-muted">
                    Not rated yet. The gate sits before go-live.
                  </li>
                )}
              </ul>
            </div>

            <h2 className="mb-2.5 mt-6 text-[13px] font-bold text-fg">Training</h2>
            <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              <ul className="divide-y divide-border">
                {detail.training.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="min-w-0 truncate text-[12px] text-fg">{item.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        item.done
                          ? "bg-success-soft text-success"
                          : "bg-bg-subtle text-fg-muted"
                      }`}
                    >
                      {item.done ? "Done" : "Not yet"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}

      {tab === "messages" && (
        <section>
          <ClientMessages
            clientId={summary.id}
            messages={detail.messages}
            drafts={detail.drafts}
            contactName={summary.contactName}
          />
        </section>
      )}
    </div>
  );
}
