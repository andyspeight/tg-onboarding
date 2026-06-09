import type { JourneyPhase } from "./types";

export interface ProgressStats {
  done: number;
  total: number;
  /** 0–100, rounded. */
  pct: number;
}

/** Client-facing, non-optional tasks are what counts toward progress. */
function countableTasks(phase: JourneyPhase) {
  return phase.tasks.filter(
    (task) => task.audience === "client" && !task.optional,
  );
}

export function phaseProgress(phase: JourneyPhase): ProgressStats {
  const tasks = countableTasks(phase);
  const done = tasks.filter((task) => task.done).length;
  const total = tasks.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function overallProgress(phases: JourneyPhase[]): ProgressStats {
  return phases.reduce<ProgressStats>(
    (acc, phase) => {
      const { done, total } = phaseProgress(phase);
      const nextDone = acc.done + done;
      const nextTotal = acc.total + total;
      return {
        done: nextDone,
        total: nextTotal,
        pct: nextTotal === 0 ? 0 : Math.round((nextDone / nextTotal) * 100),
      };
    },
    { done: 0, total: 0, pct: 0 },
  );
}

/** How many phases are fully complete (every countable task done). */
export function phasesComplete(phases: JourneyPhase[]): number {
  return phases.filter((phase) => {
    const { done, total } = phaseProgress(phase);
    return total > 0 && done === total;
  }).length;
}

/** The phase the client should focus on next. */
export function currentPhase(phases: JourneyPhase[]): JourneyPhase | undefined {
  return (
    phases.find((phase) => phase.status === "active") ??
    phases.find((phase) => phaseProgress(phase).pct < 100)
  );
}
