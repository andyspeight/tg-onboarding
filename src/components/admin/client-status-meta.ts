import { CLIENT_STATUS, type ClientStatus } from "@/lib/onboarding/client-status";

/**
 * How each status reads on the dashboard. `chip` is the short label for a row
 * badge; `null` for "In progress" — the default needs no chip, keeping rows
 * uncluttered. `dot`/`cls` style the chip and the detail-card indicator.
 */
export const STATUS_META: Record<
  ClientStatus,
  { chip: string | null; long: string; cls: string; dot: string }
> = {
  [CLIENT_STATUS.inProgress]: {
    chip: null,
    long: "In progress",
    cls: "bg-info-soft text-info",
    dot: "bg-info",
  },
  [CLIENT_STATUS.awaitingTraining]: {
    chip: "Awaiting training",
    long: "Awaiting training",
    cls: "bg-info-soft text-info",
    dot: "bg-info",
  },
  [CLIENT_STATUS.onHoldClient]: {
    chip: "On hold · client",
    long: "On hold — client request",
    cls: "bg-orange-soft text-orange",
    dot: "bg-orange",
  },
  [CLIENT_STATUS.onHoldOurs]: {
    chip: "On hold · our side",
    long: "On hold — our side",
    cls: "bg-warning-soft text-warning",
    dot: "bg-warning",
  },
  [CLIENT_STATUS.live]: {
    chip: "Website is live",
    long: "Website is live",
    cls: "bg-success-soft text-success",
    dot: "bg-success",
  },
};
