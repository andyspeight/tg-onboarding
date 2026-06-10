import { ProgressBar } from "@/components/ProgressBar";
import { ClientMessages } from "@/components/admin/ClientMessages";
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

/** Staff view of one client: the whole journey, internal tasks included. */
export function ClientDetail({ detail }: { detail: AdminClientDetail }) {
  const { summary } = detail;

  return (
    <div className="space-y-7">
      <section className="rounded-card border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
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

      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-fg">
          Messages
          {summary.unreadMessages > 0 && (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-contrast">
              {summary.unreadMessages} new
            </span>
          )}
        </h2>
        <ClientMessages
          clientId={summary.id}
          messages={detail.messages}
          contactName={summary.contactName}
        />
      </section>

      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-fg">
          Journey (internal tasks included)
        </h2>
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
                {phase.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
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
                        {task.dueDate ? ` · due ${formatShortDate(task.dueDate)}` : ""}
                      </p>
                    </div>
                    {task.audience === "internal" && (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-fg-faint">
                        Internal
                      </span>
                    )}
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_CLS[task.status]}`}
                    >
                      {task.status === "in-progress" ? "In progress" : task.status === "done" ? "Done" : "To do"}
                    </span>
                  </li>
                ))}
                {phase.tasks.length === 0 && (
                  <li className="px-4 py-3 text-[12px] text-fg-faint">No tasks.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-7 lg:grid-cols-2">
        <section>
          <h2 className="mb-2.5 text-[13px] font-bold text-fg">Recent activity</h2>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
            <ul className="divide-y divide-border">
              {detail.signals.map((signal) => (
                <li key={signal.id} className="px-4 py-2.5">
                  <p className="text-[12px] font-medium text-fg">{signal.signal}</p>
                  <p className="text-[11px] text-fg-faint">
                    {signal.detail ? `${signal.detail} · ` : ""}
                    {signal.whenLabel}
                  </p>
                </li>
              ))}
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

      <div className="grid gap-7 lg:grid-cols-2">
        <section>
          <h2 className="mb-2.5 text-[13px] font-bold text-fg">Documents</h2>
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
            <ul className="divide-y divide-border">
              {detail.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-fg">{doc.name}</p>
                    <p className="text-[11px] text-fg-faint">
                      {doc.category}
                      {doc.addedAt ? ` · ${formatShortDate(doc.addedAt)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-bg-subtle px-2.5 py-0.5 text-[10px] font-semibold text-fg-muted">
                    {doc.status}
                  </span>
                </li>
              ))}
              {detail.documents.length === 0 && (
                <li className="px-4 py-6 text-center text-[12px] text-fg-muted">
                  Nothing here yet.
                </li>
              )}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-2.5 text-[13px] font-bold text-fg">Intake answers</h2>
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
      </div>
    </div>
  );
}
