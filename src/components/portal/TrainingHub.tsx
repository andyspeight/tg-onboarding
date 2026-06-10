"use client";

import { useMemo, useState } from "react";
import {
  ArticleIcon,
  CheckIcon,
  ClockIcon,
  PlayIcon,
} from "@/components/icons";
import { ProgressBar } from "@/components/ProgressBar";
import type { JourneyPhase, TrainingResource } from "@/lib/onboarding/types";
import { recordEngagement } from "@/lib/onboarding/engagement";

function TrainingCard({
  item,
  done,
  onToggle,
  index,
}: {
  item: TrainingResource;
  done: boolean;
  onToggle: () => void;
  index: number;
}) {
  const isVideo = item.type === "video";
  const ready = Boolean(item.url);
  const actionLabel = ready ? (isVideo ? "Watch" : "Read") : "Coming soon";

  return (
    <article
      className="anim-fade-up flex flex-col rounded-card border border-border bg-surface p-4 shadow-soft"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            done ? "bg-success-soft text-success" : "bg-accent-soft text-accent"
          }`}
        >
          {isVideo ? (
            <PlayIcon className="h-[18px] w-[18px]" />
          ) : (
            <ArticleIcon className="h-[18px] w-[18px]" />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-fg">{item.title}</h3>
          {item.description && (
            <p className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="flex items-center gap-2 text-[11px] text-fg-faint">
          {item.durationLabel && (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              {item.durationLabel}
            </span>
          )}
          {ready ? (
            <a href={item.url} className="font-medium text-accent">
              {actionLabel}
            </a>
          ) : (
            <span className="font-medium">{actionLabel}</span>
          )}
        </span>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          className={`press inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors ${
            done
              ? "bg-success-soft text-success"
              : "border border-border text-fg-muted hover:border-border-strong hover:text-fg"
          }`}
        >
          {done && <CheckIcon className="h-3.5 w-3.5" />}
          {done ? "Done" : "Mark as done"}
        </button>
      </div>
    </article>
  );
}

/**
 * The Training tab: every video and guide from the journey in one place,
 * grouped by the phase it belongs to, with per-item completion tracked.
 * Completion lives in memory for Phase 1 and counts as an engagement signal.
 */
export function TrainingHub({
  phases,
  className = "",
}: {
  phases: JourneyPhase[];
  className?: string;
}) {
  const sections = useMemo(
    () => phases.filter((phase) => phase.training.length > 0),
    [phases],
  );
  const allItems = useMemo(
    () => sections.flatMap((phase) => phase.training),
    [sections],
  );

  const [done, setDone] = useState<Record<string, boolean>>({});
  const doneCount = allItems.filter((item) => done[item.id]).length;
  const pct =
    allItems.length === 0 ? 0 : Math.round((doneCount / allItems.length) * 100);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) recordEngagement("training-completed", id);
      return next;
    });
  }

  if (sections.length === 0) {
    return (
      <p className={`text-sm text-fg-muted ${className}`}>
        Your training content is being lined up. It lands here as your journey
        moves along.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between text-xs text-fg-muted">
        <span>
          {doneCount} of {allItems.length} completed
        </span>
        <span className="font-semibold text-accent tabular-nums">{pct}%</span>
      </div>
      <ProgressBar
        value={pct}
        size="sm"
        label="Training completion"
        className="mt-1.5"
      />

      <div className="mt-6 space-y-7">
        {sections.map((phase) => (
          <section key={phase.id}>
            <h2 className="mb-2.5 flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-bold text-fg-muted">
                {phase.number}
              </span>
              <span className="text-[13px] font-semibold text-fg">
                {phase.title}
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {phase.training.map((item, index) => (
                <TrainingCard
                  key={item.id}
                  item={item}
                  done={Boolean(done[item.id])}
                  onToggle={() => toggle(item.id)}
                  index={index}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
