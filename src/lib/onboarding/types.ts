/**
 * Domain model for the client onboarding journey.
 *
 * This is the contract the whole Phase 1 portal is built against. The data
 * layer (`data.ts`) currently fills it from local mock data; later it will be
 * filled from Airtable without anything here needing to change.
 */

export type PhaseStatus = "completed" | "active" | "upcoming";

/** Who can SEE a task. Internal tasks never reach the client view. */
export type TaskAudience = "client" | "internal";

/**
 * Who DOES a task. Distinct from audience: a Travelgenix-owned task (e.g.
 * "Build homepage draft") is visible to the client for transparency, while an
 * internal task is hidden entirely.
 */
export type TaskOwner = "client" | "travelgenix" | "both";

/** Tri-state task status, matching the approved prototype's behaviour. */
export type TaskStatus = "todo" | "in-progress" | "done";

export type TrainingType = "video" | "article";

/** Kinds of portal notification — the surface for task-specific nudges. */
export type NotificationKind =
  | "progress"
  | "reminder"
  | "complete"
  | "message"
  | "welcome";

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  audience: TaskAudience;
  owner: TaskOwner;
  status: TaskStatus;
  /** ISO date (YYYY-MM-DD). Relative labels derive from the journey's asOf. */
  dueDate?: string;
  /** Nice-to-have rather than required to progress. */
  optional?: boolean;
}

export interface TrainingResource {
  id: string;
  type: TrainingType;
  title: string;
  description?: string;
  /** e.g. "4 min watch" / "5 min read". */
  durationLabel?: string;
  /** Empty in Phase 1 where the slot is reserved but content isn't ready. */
  url?: string;
}

/**
 * The anti-wilting confidence gate. Sits on the phase it gates the exit of
 * (Go-Live Prep). Go-live is blocked until the client self-rates >= minRating.
 */
export interface ConfidenceGate {
  minRating: number;
  prompt: string;
  helpText?: string;
}

export interface JourneyPhase {
  id: string;
  number: number;
  slug: string;
  title: string;
  summary: string;
  status: PhaseStatus;
  /** Rough time expectation shown to the client, e.g. "About a week". */
  estimateLabel?: string;
  tasks: OnboardingTask[];
  training: TrainingResource[];
  /** Present only on the phase whose exit is gated. */
  gate?: ConfidenceGate;
}

export interface ClientProfile {
  company: string;
  contactName: string;
  /** Package tier, e.g. "Boost". */
  plan?: string;
  /** ISO date string. */
  onboardingStartedAt?: string;
  /** The Travelgenix human looking after this client. */
  accountManager?: string;
}

/** A task-specific nudge or update shown in the notification bell. */
export interface PortalNotification {
  id: string;
  kind: NotificationKind;
  text: string;
  /** Pre-computed relative label ("2h ago") so render stays deterministic. */
  whenLabel: string;
  read: boolean;
}

export type IntakeFieldType = "text" | "textarea" | "select";

export interface IntakeField {
  id: string;
  label: string;
  type: IntakeFieldType;
  placeholder?: string;
  /** For selects. */
  options?: string[];
  required?: boolean;
}

/** One accordion section of the smart intake form. */
export interface IntakeSection {
  id: string;
  title: string;
  description: string;
  /** Only shown to these package tiers; omit to show for all tiers. */
  showForPlans?: string[];
  fields: IntakeField[];
}

export type DocumentStatus = "signed" | "available" | "pending";

/** A document in the client's hub, grouped by category. */
export interface ClientDocument {
  id: string;
  name: string;
  category: string;
  /** Short type label shown on the chip, e.g. "PDF". */
  fileType: string;
  /** ISO date. For `pending` documents this is the expected date. */
  addedAt: string;
  status: DocumentStatus;
}

export interface OnboardingJourney {
  client: ClientProfile;
  /**
   * The date (YYYY-MM-DD) all relative labels are computed against. Comes from
   * the data layer so server and client render identically.
   */
  asOf: string;
  phases: JourneyPhase[];
  notifications: PortalNotification[];
  /** Smart intake form definition. Tier filtering happens in the data layer. */
  intake: IntakeSection[];
  documents: ClientDocument[];
}
