"use client";

import { useMemo, useState } from "react";
import type { OnboardingJourney, TaskStatus } from "@/lib/onboarding/types";
import {
  currentPhase,
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
import { CheckIcon } from "@/components/icons";

const CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: "in-progress",
  "in-progress": "done",
  done: "todo",
};

const SAVE_ERROR =
  "That last change didn’t save. Check your connection and try again.";

/**
 * The interactive client portal. Updates are optimistic: the screen responds
 * instantly, the change persists to Airtable in the background, and on
 * failure the change rolls back with a plain explanation. On mock data
 * (no Airtable configured) everything stays local.
 */
export function Portal({ journey }: { journey: OnboardingJourney }) {
  const live = journey.source === "airtable";
  const [phases, setPhases] = useState(journey.phases);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [confidence, setConfidence] = useState<number | null>(
    journey.confidence,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(
    () =>
      currentPhase(journey.phases)?.id ?? journey.phases[0]?.id ?? "",
  );

  const overall = useMemo(() => overallProgress(phases), [phases]);
  const completeCount = useMemo(() => phasesComplete(phases), [phases]);
  const stats = useMemo(
    () => workloadStats(phases, journey.asOf),
    [phases, journey.asOf],
  );
  const active = useMemo(() => currentPhase(phases), [phases]);

  function applyTaskStatus(phaseId: string, taskId: string, status: TaskStatus) {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id !== phaseId
          ? phase
          : {
              ...phase,
              tasks: phase.tasks.map((task) =>
                task.id === taskId ? { ...task, status } : task,
              ),
            },
      ),
    );
  }

  function cycleTask(phaseId: string, taskId: string) {
    const task = phases
      .find((phase) => phase.id === phaseId)
      ?.tasks.find((item) => item.id === taskId);
    if (!task) return;

    const previous = task.status;
    const next = CYCLE[previous];
    applyTaskStatus(phaseId, taskId, next);
    setSaveError(null);
    if (!live) return;

    fetch("/api/task-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: next }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
      })
      .catch(() => {
        applyTaskStatus(phaseId, taskId, previous);
        setSaveError(SAVE_ERROR);
      });
  }

  function rateConfidence(rating: number) {
    setConfidence(rating);
    setSaveError(null);
    if (!live) return;

    fetch("/api/confidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: rating }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
      })
      .catch(() => setSaveError(SAVE_ERROR));
  }

  // The phase whose tab is open. Owner filter is applied to its tasks;
  // shared tasks show in both views.
  const selectedPhase =
    phases.find((phase) => phase.id === selectedPhaseId) ?? phases[0] ?? null;
  const selectedForRender =
    selectedPhase && filter !== "all"
      ? {
          ...selectedPhase,
          tasks: selectedPhase.tasks.filter((task) =>
            filter === "client"
              ? task.owner !== "travelgenix"
              : task.owner !== "client",
          ),
        }
      : selectedPhase;

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
        activePhaseTitle={active?.title}
        onJumpToActive={
          active ? () => setSelectedPhaseId(active.id) : undefined
        }
      />

      <QuickStats stats={stats} />

      <FilterBar filter={filter} onChange={setFilter} />

      <p aria-live="polite" className="text-[13px] font-medium text-danger">
        {saveError}
      </p>

      {/* Phase tabs — one per stage of the journey, so the plan reads a step
          at a time rather than one long page. */}
      <div
        role="tablist"
        aria-label="Journey phases"
        className="flex flex-wrap gap-1.5"
      >
        {phases.map((phase) => {
          const done = phaseProgress(phase).pct === 100;
          const selected = phase.id === selectedPhaseId;
          return (
            <button
              key={phase.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSelectedPhaseId(phase.id)}
              className={`press flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                selected
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                  done
                    ? "bg-success text-white"
                    : selected
                      ? "bg-accent text-accent-contrast"
                      : "bg-bg-subtle text-fg-muted"
                }`}
              >
                {done ? <CheckIcon className="h-2.5 w-2.5" /> : phase.number}
              </span>
              {phase.title}
            </button>
          );
        })}
      </div>

      {selectedPhase && selectedForRender && (
        <div className="space-y-3.5">
          <PhaseCard
            key={selectedPhase.id}
            phase={selectedForRender}
            stats={phaseProgress(selectedPhase)}
            asOf={journey.asOf}
            index={0}
            alwaysExpanded
            onCycleTask={(taskId) => cycleTask(selectedPhase.id, taskId)}
          />
          {filter !== "all" && selectedForRender.tasks.length === 0 && (
            <p className="rounded-card border border-dashed border-border bg-surface-2/50 px-4 py-5 text-center text-[13px] text-fg-muted">
              No {filter === "client" ? "tasks for you" : "Travelgenix tasks"} in
              this phase.
            </p>
          )}
          {selectedPhase.gate && (
            <div className="sm:pl-[2.875rem]">
              <ConfidenceGate
                gate={selectedPhase.gate}
                value={confidence}
                onChange={rateConfidence}
              />
            </div>
          )}
        </div>
      )}

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
