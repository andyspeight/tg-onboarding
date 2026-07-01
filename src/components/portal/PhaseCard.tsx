"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ProgressBar";
import type { JourneyPhase } from "@/lib/onboarding/types";
import type { ProgressStats } from "@/lib/onboarding/progress";
import { Checklist } from "./Checklist";
import { TrainingList } from "./TrainingList";

interface PhaseCardProps {
  phase: JourneyPhase;
  stats: ProgressStats;
  asOf: string;
  index: number;
  onCycleTask: (taskId: string) => void;
  /** When shown alone (e.g. in a tab), start expanded even if complete. */
  alwaysExpanded?: boolean;
}

/**
 * One stop on the seven-phase journey, in the prototype's shape: numbered
 * node, mini progress bar, collapsible checklist. Completed phases start
 * collapsed with a green header; everything still to do starts open so the
 * road ahead is visible.
 */
export function PhaseCard({
  phase,
  stats,
  asOf,
  index,
  onCycleTask,
  alwaysExpanded = false,
}: PhaseCardProps) {
  const isComplete = phase.status === "completed";
  const isActive = phase.status === "active";
  const [collapsed, setCollapsed] = useState(alwaysExpanded ? false : isComplete);
  const panelId = `phase-panel-${phase.number}`;

  return (
    <article
      id={`phase-${phase.number}`}
      className={`anim-fade-up scroll-mt-20 overflow-hidden rounded-card border bg-surface ${
        isActive
          ? "border-accent/40 shadow-card ring-1 ring-accent/20"
          : "border-border shadow-soft"
      }`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        aria-controls={panelId}
        className={`flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-colors sm:px-5 ${
          isComplete ? "bg-success-soft" : "hover:bg-surface-2"
        }`}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isComplete
              ? "bg-success text-white"
              : isActive
                ? "bg-accent text-accent-contrast"
                : "border border-border-strong bg-surface-2 text-fg-muted"
          }`}
        >
          {isComplete ? <CheckIcon className="h-4 w-4" /> : phase.number}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-fg">{phase.title}</span>
            {isActive && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                In progress
              </span>
            )}
          </span>
          <span className="mt-1.5 flex items-center gap-2">
            <ProgressBar
              value={stats.pct}
              size="sm"
              label={`${phase.title} progress`}
              className="max-w-[60px]"
            />
            <span className="text-[10px] text-fg-faint tabular-nums">
              {stats.done}/{stats.total}
            </span>
          </span>
        </span>

        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-fg-faint transition-transform ${
            collapsed ? "-rotate-90" : ""
          }`}
        />
      </button>

      {!collapsed && (
        <div id={panelId} className="border-t border-border px-4 pb-5 sm:px-5">
          <p className="max-w-[65ch] pt-3.5 text-[13px] leading-relaxed text-fg-muted">
            {phase.summary}
            {phase.estimateLabel && (
              <span className="text-fg-faint"> · {phase.estimateLabel}</span>
            )}
          </p>
          <Checklist tasks={phase.tasks} asOf={asOf} onCycle={onCycleTask} />
          {phase.training.length > 0 && (
            <div className="mt-4">
              <TrainingList training={phase.training} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
