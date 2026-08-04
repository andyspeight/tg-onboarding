/**
 * Client onboarding status — the chase-suppression switch.
 *
 * A single mutually-exclusive status per client (Andy's call, 3 Aug 2026 —
 * a dropdown, not independent toggles). Any status except "In progress"
 * silences BOTH directions: no staff wilting/quiet alerts and no client
 * reminder emails. "Website is live" additionally means onboarding is
 * COMPLETE — the client drops off the active dashboard.
 *
 * Pure module, no Airtable — so the rules are testable in one place and both
 * the data layer and the UI read the same source of truth.
 */

export const CLIENT_STATUS = {
  inProgress: "In progress",
  awaitingTraining: "Awaiting training",
  onHoldClient: "On hold — client request",
  onHoldOurs: "On hold — our side",
  live: "Website is live",
} as const;

export type ClientStatus = (typeof CLIENT_STATUS)[keyof typeof CLIENT_STATUS];

/** Order shown in the dropdown. */
export const CLIENT_STATUS_OPTIONS: ClientStatus[] = [
  CLIENT_STATUS.inProgress,
  CLIENT_STATUS.awaitingTraining,
  CLIENT_STATUS.onHoldClient,
  CLIENT_STATUS.onHoldOurs,
  CLIENT_STATUS.live,
];

/** Days an "On hold" status silences a client before chasing auto-resumes. */
export const HOLD_EXPIRY_DAYS = 30;

const HOLD_STATUSES: ClientStatus[] = [
  CLIENT_STATUS.onHoldClient,
  CLIENT_STATUS.onHoldOurs,
];

export function isKnownStatus(value: string): value is ClientStatus {
  return (CLIENT_STATUS_OPTIONS as string[]).includes(value);
}

/** Blank or unrecognised stored values read as the default, "In progress". */
export function normaliseStatus(raw: string | undefined | null): ClientStatus {
  return raw && isKnownStatus(raw) ? raw : CLIENT_STATUS.inProgress;
}

export function isHold(status: ClientStatus): boolean {
  return HOLD_STATUSES.includes(status);
}

/** "Website is live" — onboarding done; leaves the active dashboard list. */
export function isComplete(status: ClientStatus): boolean {
  return status === CLIENT_STATUS.live;
}

/** Every status except "In progress" suppresses chasing, both directions. */
export function suppressesChasing(status: ClientStatus): boolean {
  return status !== CLIENT_STATUS.inProgress;
}

/**
 * Resolve the *effective* status, applying the 30-day auto-resume so a
 * forgotten hold can't silence a client forever. A hold set more than
 * HOLD_EXPIRY_DAYS ago reads as "In progress" again (chasing resumes);
 * "Website is live" never expires. `expired` is true only on the transition,
 * so callers can durably flip the stored field and let staff know once.
 */
export function effectiveStatus(
  raw: string | undefined | null,
  setAtIso: string | undefined | null,
  nowMs: number,
): { status: ClientStatus; expired: boolean } {
  const status = normaliseStatus(raw);
  if (!isHold(status) || !setAtIso) return { status, expired: false };

  const setAt = Date.parse(setAtIso);
  if (Number.isNaN(setAt)) return { status, expired: false };

  const daysHeld = Math.floor((nowMs - setAt) / 86_400_000);
  if (daysHeld >= HOLD_EXPIRY_DAYS) {
    return { status: CLIENT_STATUS.inProgress, expired: true };
  }
  return { status, expired: false };
}
