/**
 * Engagement signals — the raw material for Phase 2's wilting alerts.
 *
 * Phase 1's job is to capture the signals from day one so the alerting layer
 * has history to work with. Like the Luna seam, this is the single swap
 * point: when the Airtable base is decided, recording goes through a server
 * route here (env-keyed, rate-limited) and nothing at the call sites changes.
 */

export type EngagementSignal =
  | "task-updated"
  | "training-completed"
  | "confidence-rated"
  | "document-uploaded";

export function recordEngagement(
  _signal: EngagementSignal,
  _detail?: string,
): void {
  // Phase 1 stub: no backend yet, so signals are intentionally not sent
  // anywhere. Later: POST to an API route that writes Airtable engagement
  // records (client id, signal, detail, timestamp).
}
