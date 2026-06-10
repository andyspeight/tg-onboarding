import type { JourneyPhase } from "./types";
import { daysUntil } from "./dates";

export interface ProgressStats {
  done: number;
  total: number;
  /** 0–100, rounded. */
  pct: number;
}

/** Counts for the quick-stat cards: whose work is left, and what's slipped. */
export interface WorkloadStats {
  /** Open tasks owned by the client (or shared). */
  mine: number;
  /** Open tasks owned by Travelgenix (or shared). */
  theirs: number;
  /** Open tasks past their due date. */
  overdue: number;
}

/** Client-facing, non-optional tasks are what counts toward progress. */
function countableTasks(phase: JourneyPhase) {
  return phase.tasks.filter(
    (task) => task.audience === "client" && !task.optional,
  );
}

export function phaseProgress(phase: JourneyPhase): ProgressStats {
  const tasks = countableTasks(phase);
  const done = tasks.filter((task) => task.status === "done").length;
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

/** Workload split across all client-visible tasks, optional ones included. */
export function workloadStats(
  phases: JourneyPhase[],
  asOf: string,
): WorkloadStats {
  const open = phases
    .flatMap((phase) => phase.tasks)
    .filter((task) => task.audience === "client" && task.status !== "done");

  return {
    mine: open.filter((task) => task.owner !== "travelgenix").length,
    theirs: open.filter((task) => task.owner !== "client").length,
    overdue: open.filter(
      (task) => task.dueDate && daysUntil(task.dueDate, asOf) < 0,
    ).length,
  };
}
