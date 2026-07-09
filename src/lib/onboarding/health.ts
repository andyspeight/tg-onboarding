/**
 * Client health rules — the wilting detector. Pure functions over numbers
 * the data layer derives, so thresholds are tunable in one place and the
 * rules are testable without Airtable. Proposed values per docs/phase-2-spec.md;
 * tune with Andy as real behaviour comes in.
 */

export type HealthLevel = "green" | "amber" | "red";

export const HEALTH_RULES = {
  /** Days without portal activity before a client counts as slowing. */
  quietAmberDays: 5,
  /** Days quiet before they're at risk. */
  quietRedDays: 10,
  /** Overdue client-owed tasks: slowing at this many... */
  overdueAmberCount: 1,
  /** ...at risk at this many. */
  overdueRedCount: 3,
  /** Behind pace when under pacePct progress by paceDay days in. */
  paceDay: 21,
  pacePct: 30,
};

export interface ClientHealthInput {
  daysQuiet: number;
  overdueCount: number;
  dayCount: number;
  pct: number;
}

export interface ClientHealth {
  health: HealthLevel;
  /** Plain-English reasons, e.g. "Quiet for 12 days". Empty when green. */
  reasons: string[];
}

export function deriveHealth(input: ClientHealthInput): ClientHealth {
  const reasons: string[] = [];
  let health: HealthLevel = "green";

  const overdueLabel =
    input.overdueCount === 1 ? "1 task overdue" : `${input.overdueCount} tasks overdue`;

  if (
    input.daysQuiet >= HEALTH_RULES.quietRedDays ||
    input.overdueCount >= HEALTH_RULES.overdueRedCount
  ) {
    health = "red";
    if (input.daysQuiet >= HEALTH_RULES.quietRedDays) {
      reasons.push(`Quiet for ${input.daysQuiet} days`);
    }
    if (input.overdueCount >= HEALTH_RULES.overdueRedCount) {
      reasons.push(overdueLabel);
    }
    return { health, reasons };
  }

  if (input.daysQuiet >= HEALTH_RULES.quietAmberDays) {
    health = "amber";
    reasons.push(`Quiet for ${input.daysQuiet} days`);
  }
  if (input.overdueCount >= HEALTH_RULES.overdueAmberCount) {
    health = "amber";
    reasons.push(overdueLabel);
  }
  if (input.dayCount >= HEALTH_RULES.paceDay && input.pct < HEALTH_RULES.pacePct) {
    health = "amber";
    reasons.push(`Only ${input.pct}% complete by day ${input.dayCount}`);
  }

  return { health, reasons };
}

/* Shapes the admin dashboard renders. */

export interface AdminClientSummary {
  id: string;
  company: string;
  contactName: string;
  plan?: string;
  pct: number;
  phaseTitle: string;
  dayCount: number;
  daysQuiet: number;
  overdueCount: number;
  intakePct: number;
  /** Client messages the team hasn't read yet. */
  unreadMessages: number;
  health: HealthLevel;
  reasons: string[];
  /** The client's uploaded logo, shown as their dashboard avatar. */
  logoUrl?: string;
}

export type TeamTaskUrgency = "overdue" | "urgent" | "upcoming";

export interface AdminTeamTask {
  id: string;
  title: string;
  clientCompany: string;
  dueDate?: string;
  urgency: TeamTaskUrgency;
}

export interface AdminSnapshot {
  clients: AdminClientSummary[];
  teamTasks: AdminTeamTask[];
}

/* Client detail view shapes. */

export interface AdminDetailTask {
  id: string;
  title: string;
  description?: string;
  audience: "client" | "internal";
  owner: "client" | "travelgenix" | "both";
  status: "todo" | "in-progress" | "done";
  dueDate?: string;
  optional: boolean;
}

export interface AdminDetailPhase {
  number: number;
  title: string;
  tasks: AdminDetailTask[];
}

export interface AdminDetailSignal {
  id: string;
  signal: string;
  detail: string;
  whenLabel: string;
}

export interface AdminDetailConfidence {
  id: string;
  score: number;
  whenLabel: string;
}

export interface AdminDetailDocument {
  id: string;
  name: string;
  category: string;
  status: string;
  addedAt: string;
  /** The stored file, for View/Download. Absent while a doc is pending. */
  url?: string;
}

export interface AdminDetailIntakeSection {
  title: string;
  fields: { label: string; value: string }[];
}

export interface AdminDetailTraining {
  id: string;
  title: string;
  type: "video" | "article";
  done: boolean;
}

export interface AdminDetailMessage {
  id: string;
  from: "team" | "client" | "luna";
  body: string;
  whenLabel: string;
  /** True for client messages the team hadn't read when the page loaded. */
  unread: boolean;
  attachments?: { url: string; filename: string; isImage: boolean }[];
}

/** A Luna answer parked for AM review before it reaches the client. */
export interface AdminDetailDraft {
  id: string;
  /** The client message Luna was answering. */
  question: string;
  body: string;
  whenLabel: string;
}

export interface AdminClientDetail {
  summary: AdminClientSummary;
  contactEmail?: string;
  startedAt?: string;
  phases: AdminDetailPhase[];
  signals: AdminDetailSignal[];
  confidences: AdminDetailConfidence[];
  documents: AdminDetailDocument[];
  intake: AdminDetailIntakeSection[];
  training: AdminDetailTraining[];
  /** Thread oldest-first, capped to the recent window. */
  messages: AdminDetailMessage[];
  /** Luna answers awaiting review — only populated in review-before-send mode. */
  drafts: AdminDetailDraft[];
  /** Portal login state — staff issue and rotate codes from the detail page. */
  portalAccess: { codeIssuedAt?: string; lastLoginAt?: string };
}

export type SupplierCategory =
  | "Package holidays"
  | "Accommodation"
  | "Flights"
  | "Events & Attractions"
  | "Car Hire & Transfers"
  | "Payment Provider";

export interface AdminSupplier {
  id: string;
  name: string;
  category: SupplierCategory;
  active: boolean;
  description: string;
  /** Raw comma-delimited string as stored; split for pills at render. */
  features: string;
  links: { label: string; url: string }[];
  contactEmail: string;
  contactPhone: string;
  contactNotes: string;
}
