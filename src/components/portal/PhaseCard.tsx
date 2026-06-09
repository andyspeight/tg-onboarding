import { CheckIcon, ChevronDownIcon, ClockIcon } from "@/components/icons";
import type { JourneyPhase } from "@/lib/onboarding/types";
import type { ProgressStats } from "@/lib/onboarding/progress";
import { Checklist } from "./Checklist";
import { TrainingList } from "./TrainingList";

interface PhaseCardProps {
  phase: JourneyPhase;
  stats: ProgressStats;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleTask: (taskId: string) => void;
}

const STATUS_META: Record<
  JourneyPhase["status"],
  { label: string; pill: string }
> = {
  completed: {
    label: "Complete",
    pill: "bg-success-soft text-success",
  },
  active: {
    label: "In progress",
    pill: "bg-accent-soft text-accent",
  },
  upcoming: {
    label: "Upcoming",
    pill: "bg-bg-subtle text-fg-muted",
  },
};

export function PhaseCard({
  phase,
  stats,
  expanded,
  onToggleExpand,
  onToggleTask,
}: PhaseCardProps) {
  const isComplete = phase.status === "completed";
  const isActive = phase.status === "active";
  const meta = STATUS_META[phase.status];
  const panelId = `phase-panel-${phase.number}`;

  return (
    <article
      id={`phase-${phase.number}`}
      className={`scroll-mt-24 overflow-hidden rounded-card border bg-surface transition-shadow ${
        isActive
          ? "border-accent/40 shadow-card ring-1 ring-accent/20"
          : "border-border shadow-soft"
      }`}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
      >
        {/* Status node */}
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isComplete
              ? "bg-accent text-accent-contrast"
              : isActive
                ? "bg-brand-gradient text-white"
                : "border border-border-strong bg-surface-2 text-fg-muted"
          }`}
        >
          {isComplete ? <CheckIcon className="h-5 w-5" /> : phase.number}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-fg sm:text-base">
              {phase.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.pill}`}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[13px] text-fg-muted sm:text-sm">
            {phase.summary}
          </p>
        </div>

        {/* Right meta: progress + chevron */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            {stats.total > 0 ? (
              <span className="text-sm font-semibold text-fg">
                {stats.done}
                <span className="text-fg-faint">/{stats.total}</span>
              </span>
            ) : null}
            {phase.estimateLabel && (
              <span className="flex items-center justify-end gap-1 text-[11px] text-fg-faint">
                <ClockIcon className="h-3 w-3" />
                {phase.estimateLabel}
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-fg-faint transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
          <Checklist tasks={phase.tasks} onToggle={onToggleTask} />
          {phase.training.length > 0 && (
            <div className="mt-5">
              <TrainingList training={phase.training} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
