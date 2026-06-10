/**
 * Date helpers for the journey. Everything is computed from the journey's
 * `asOf` date rather than the wall clock, so server and client renders agree
 * and the demo data stays deterministic within a request.
 */

const DAY_MS = 86_400_000;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Whole days between asOf and the given date. Negative = in the past. */
export function daysUntil(dateIso: string, asOfIso: string): number {
  return Math.round((Date.parse(dateIso) - Date.parse(asOfIso)) / DAY_MS);
}

/** "12 Jun" — manual formatting keeps output identical across runtimes. */
export function formatShortDate(dateIso: string): string {
  const date = new Date(dateIso);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

/** Today's date (YYYY-MM-DD) in the UK, where our clients are. */
export function ukToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
}

/** Shift an ISO date by a number of days. */
export function shiftDays(baseIso: string, days: number): string {
  return new Date(Date.parse(baseIso) + days * DAY_MS).toISOString().slice(0, 10);
}
