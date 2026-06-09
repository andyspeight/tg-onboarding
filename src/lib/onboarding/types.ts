/**
 * Domain model for the client onboarding journey.
 *
 * This is the contract the whole Phase 1 portal is built against. The data
 * layer (`data.ts`) currently fills it from local mock data; later it will be
 * filled from Airtable without anything here needing to change.
 */

export type PhaseStatus = "completed" | "active" | "upcoming";

/** Who a task belongs to. Internal tasks never reach the client view. */
export type TaskAudience = "client" | "internal";

export type TrainingType = "video" | "article";

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  audience: TaskAudience;
  done: boolean;
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
  plan?: string;
  /** ISO date string. */
  onboardingStartedAt?: string;
  /** The Travelgenix human looking after this client. */
  specialistName?: string;
}

export interface OnboardingJourney {
  client: ClientProfile;
  phases: JourneyPhase[];
}
