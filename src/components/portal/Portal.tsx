"use client";

import { useMemo, useState } from "react";
import type { OnboardingJourney } from "@/lib/onboarding/types";
import {
  currentPhase,
  overallProgress,
  phaseProgress,
  phasesComplete,
} from "@/lib/onboarding/progress";
import { WelcomeHero } from "./WelcomeHero";
import { PhaseCard } from "./PhaseCard";
import { ConfidenceGate } from "./ConfidenceGate";

/**
 * The interactive client portal. Holds the live journey state so checking a
 * task or rating confidence updates progress immediately. Persistence is out of
 * scope for Phase 1 — this is the swap-in point for Airtable-backed mutations.
 */
export function Portal({ journey }: { journey: OnboardingJourney }) {
  const [phases, setPhases] = useState(journey.phases);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    () => currentPhase(journey.phases)?.id ?? journey.phases[0]?.id ?? null,
  );

  const overall = useMemo(() => overallProgress(phases), [phases]);
  const completeCount = useMemo(() => phasesComplete(phases), [phases]);
  const active = useMemo(() => currentPhase(phases), [phases]);

  function toggleTask(phaseId: string, taskId: string) {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id !== phaseId
          ? phase
          : {
              ...phase,
              tasks: phase.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task,
              ),
            },
      ),
    );
  }

  function toggleExpand(phaseId: string) {
    setExpandedId((current) => (current === phaseId ? null : phaseId));
  }

  return (
    <div className="space-y-8">
      <WelcomeHero
        contactName={journey.client.contactName}
        company={journey.client.company}
        overall={overall}
        phasesComplete={completeCount}
        phaseCount={phases.length}
        currentPhaseTitle={active?.title}
        currentPhaseHref={active ? `#phase-${active.number}` : undefined}
      />

      <div>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-fg">
            Your seven-phase journey
          </h2>
          <span className="text-sm text-fg-muted">
            {completeCount}/{phases.length} complete
          </span>
        </div>

        <ol className="space-y-3">
          {phases.map((phase) => (
            <li key={phase.id} className="space-y-3">
              <PhaseCard
                phase={phase}
                stats={phaseProgress(phase)}
                expanded={expandedId === phase.id}
                onToggleExpand={() => toggleExpand(phase.id)}
                onToggleTask={(taskId) => toggleTask(phase.id, taskId)}
              />

              {phase.gate && (
                <div className="pl-0 sm:pl-[3.5rem]">
                  <ConfidenceGate
                    gate={phase.gate}
                    value={confidence}
                    onChange={setConfidence}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
