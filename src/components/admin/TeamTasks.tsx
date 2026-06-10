"use client";

import { useState } from "react";
import type { AdminTeamTask, TeamTaskUrgency } from "@/lib/onboarding/health";
import { formatShortDate } from "@/lib/onboarding/dates";

const URGENCY_META: Record<TeamTaskUrgency, { label: string; cls: string }> = {
  overdue: { label: "Overdue", cls: "bg-danger-soft text-danger" },
  urgent: { label: "Urgent", cls: "bg-orange-soft text-orange" },
  upcoming: { label: "Upcoming", cls: "bg-info-soft text-info" },
};

const FILTERS: { id: TeamTaskUrgency | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "urgent", label: "Urgent" },
  { id: "upcoming", label: "Upcoming" },
];

/** Open Travelgenix-side work across every client, due-date first. */
export function TeamTasks({ tasks }: { tasks: AdminTeamTask[] }) {
  const [filter, setFilter] = useState<TeamTaskUrgency | "all">("all");
  const visible =
    filter === "all" ? tasks : tasks.filter((task) => task.urgency === filter);

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold text-fg">Your team tasks</h2>
        <div role="group" aria-label="Filter tasks by urgency" className="flex gap-1.5">
          {FILTERS.map(({ id, label }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                aria-pressed={active}
                className={`press h-8 cursor-pointer rounded-full border px-3 text-[12px] font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
        <ul className="divide-y divide-border">
          {visible.map((task) => (
            <li key={task.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-fg">
                  {task.title}
                </p>
                <p className="mt-0.5 text-[11px] text-fg-faint">
                  {task.clientCompany}
                  {task.dueDate ? ` · Due ${formatShortDate(task.dueDate)}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${URGENCY_META[task.urgency].cls}`}
              >
                {URGENCY_META[task.urgency].label}
              </span>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-4 py-8 text-center text-[13px] text-fg-muted">
              Nothing here. Either it’s all done, or change the filter.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
