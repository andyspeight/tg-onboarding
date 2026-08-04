/**
 * Client onboarding status — the chase-suppression switch.
 *
 * A single mutually-exclusive status per client (Andy's call, 3 Aug 2026 —
 * a dropdown, not independent toggles). Any status except "In progress"
 * silences BOTH directions: no staff wilting/quiet alerts and no client
 * reminder emails. "Website is live" additionally means onboarding is
 * COMPLETE — the client drops off the active dashboard.
 *
 * A suppressed status stays put until a human changes it (manual resume only —
 * Andy's call, 4 Aug 2026). No timed auto-expiry.
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

export function isKnownStatus(value: string): value is ClientStatus {
  return (CLIENT_STATUS_OPTIONS as string[]).includes(value);
}

/** Blank or unrecognised stored values read as the default, "In progress". */
export function normaliseStatus(raw: string | undefined | null): ClientStatus {
  return raw && isKnownStatus(raw) ? raw : CLIENT_STATUS.inProgress;
}

/** "Website is live" — onboarding done; leaves the active dashboard list. */
export function isComplete(status: ClientStatus): boolean {
  return status === CLIENT_STATUS.live;
}

/** Every status except "In progress" suppresses chasing, both directions. */
export function suppressesChasing(status: ClientStatus): boolean {
  return status !== CLIENT_STATUS.inProgress;
}
