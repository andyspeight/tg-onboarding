import type { AutomationLogEntry } from "@/lib/onboarding/airtable";

const EVENT_CLS: Record<string, string> = {
  reminder: "bg-orange-soft text-orange",
  milestone: "bg-success-soft text-success",
  "wilting-alert": "bg-danger-soft text-danger",
  "activity-alert": "bg-info-soft text-info",
  "client-alert": "bg-accent-soft text-accent",
  welcome: "bg-accent-soft text-accent",
};

/** What the automation engine has done lately, per the prototype panel. */
export function AutomationLog({ entries }: { entries: AutomationLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-fg">Automation log</h2>
        <div className="rounded-card border border-border bg-surface p-6 text-[13px] leading-relaxed text-fg-muted shadow-soft">
          <p className="font-semibold text-fg">
            This is the onboarding autopilot — nothing to set up.
          </p>
          <p className="mt-1.5">
            Every weekday it checks each client and acts on its own: task
            reminders 2 days before and 1 day after a due date, milestone
            congratulations at 50% and 75%, and an alert to the team when a
            client goes quiet. Everything it does is recorded here, so you can
            see exactly what’s been sent to whom.
          </p>
          <p className="mt-1.5 text-[12px] text-fg-faint">
            Empty so far — it hasn’t needed to nudge anyone yet. Entries appear
            after its daily run has something to do.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="text-[13px] font-bold text-fg">Automation log</h2>
        <span className="text-[11px] text-fg-faint">Recent activity</span>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-soft">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                EVENT_CLS[entry.event] ?? "bg-bg-subtle text-fg-muted"
              }`}
            >
              {entry.event}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-fg">
              {entry.summary}
            </span>
            <span className="shrink-0 text-[11px] text-fg-faint">
              {entry.channel === "email" ? "emailed" : "logged"} ·{" "}
              {entry.whenLabel}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
