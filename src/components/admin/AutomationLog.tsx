import type { AutomationLogEntry } from "@/lib/onboarding/airtable";

const EVENT_CLS: Record<string, string> = {
  reminder: "bg-orange-soft text-orange",
  milestone: "bg-success-soft text-success",
  "wilting-alert": "bg-danger-soft text-danger",
  welcome: "bg-accent-soft text-accent",
};

/** What the automation engine has done lately, per the prototype panel. */
export function AutomationLog({ entries }: { entries: AutomationLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <section>
        <h2 className="mb-2.5 text-[13px] font-bold text-fg">Automation log</h2>
        <div className="rounded-card border border-border bg-surface p-6 text-center text-[13px] text-fg-muted shadow-soft">
          Nothing automated yet. Nudges, milestones and alerts appear here
          once the daily run has something to do.
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
