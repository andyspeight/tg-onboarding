"use client";

import { useMemo, useState } from "react";
import type { OnboardingJourney, TaskStatus } from "@/lib/onboarding/types";
import {
  overallProgress,
  phaseProgress,
  phasesComplete,
  workloadStats,
} from "@/lib/onboarding/progress";
import { WelcomeHero } from "./WelcomeHero";
import { QuickStats } from "./QuickStats";
import { FilterBar, type TaskFilter } from "./FilterBar";
import { PhaseCard } from "./PhaseCard";
import { ConfidenceGate } from "./ConfidenceGate";

const CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

/**
 * The interactive client portal. Holds the live journey state so cycling a
 * task or rating confidence updates progress immediately. Persistence is out of
 * scope for Phase 1 — this is the swap-in point for Airtable-backed mutations.
 */
export function Portal({ journey }: { journey: OnboardingJourney }) {
  const [phases, setPhases] = useState(journey.phases);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [confidence, setConfidence] = useState<number | null>(null);

  const overall = useMemo(() => overallProgress(phases), [phases]);
  const completeCount = useMemo(() => phasesComplete(phases), [phases]);
  const stats = useMemo(
    () => workloadStats(phases, journey.asOf),
    [phases, journey.asOf],
  );

  function cycleTask(phaseId: string, taskId: string) {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id !== phaseId
          ? phase
          : {
              ...phase,
              tasks: phase.tasks.map((task) =>
                task.id === taskId
                  ? { ...task, status: CYCLE[task.status] }
                  : task,
              ),
            },
      ),
    );
  }

  // Owner filter, prototype-style: shared tasks show in both views, and a
  // phase with nothing matching drops out of the list entirely.
  const visiblePhases = useMemo(() => {
    if (filter === "all") return phases;
    return phases
      .map((phase) => ({
        ...phase,
        tasks: phase.tasks.filter((task) =>
          filter === "client"
            ? task.owner !== "travelgenix"
            : task.owner !== "client",
        ),
      }))
      .filter((phase) => phase.tasks.length > 0);
  }, [phases, filter]);

  return (
    <div className="space-y-6">
      <WelcomeHero
        contactName={journey.client.contactName}
        company={journey.client.company}
        plan={journey.client.plan}
        accountManager={journey.client.accountManager}
        overall={overall}
        phasesComplete={completeCount}
        phaseCount={phases.length}
      />

      <QuickStats stats={stats} />

      <FilterBar filter={filter} onChange={setFilter} />

      <ol className="space-y-3.5">
        {visiblePhases.map((phase, index) => {
          // Mini bars always show true phase progress, not the filtered slice.
          const fullPhase = phases.find((p) => p.id === phase.id) ?? phase;
          return (
            <li key={phase.id} className="space-y-3.5">
              <PhaseCard
                phase={phase}
                stats={phaseProgress(fullPhase)}
                asOf={journey.asOf}
                index={index}
                onCycleTask={(taskId) => cycleTask(phase.id, taskId)}
              />
              {phase.gate && (
                <div className="sm:pl-[2.875rem]">
                  <ConfidenceGate
                    gate={phase.gate}
                    value={confidence}
                    onChange={setConfidence}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {overall.pct === 100 && (
        <div className="anim-pop rounded-card border border-success-border bg-success-soft p-8 text-center">
          <p className="text-lg font-bold text-success">You’re all set</p>
          <p className="mt-1.5 text-sm text-fg-muted">
            Every task is complete. Welcome to Travelgenix. Let’s make great
            things happen.
          </p>
        </div>
      )}
    </div>
  );
}
