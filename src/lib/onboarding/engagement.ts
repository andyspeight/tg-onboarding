/**
 * Engagement signals — the raw material for Phase 2's wilting alerts.
 *
 * Task updates, training completions, confidence ratings and intake saves
 * are recorded SERVER-SIDE inside their API routes (see
 * `recordSignalAndTouch` in `lib/onboarding/airtable.ts`), which also bumps
 * the client's Last Active. This client-side seam remains only for actions
 * that don't have a route yet (document uploads, until real storage lands).
 */

export type EngagementSignal = "document-uploaded";

export function recordEngagement(
  _signal: EngagementSignal,
  _detail?: string,
): void {
  // No-op until document storage lands; uploads then get their own route.
}
