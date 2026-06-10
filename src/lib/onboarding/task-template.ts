import type { TaskAudience, TaskOwner } from "./types";

/**
 * The journey template stamped out for every new client by the add-client
 * flow. Day offsets are from the client's start date and mirror the pacing
 * proven with the seed client. `forPlans` limits a task to certain tiers —
 * Spark clients don't manage their own supplier feeds, so they never get
 * that task (the same rule the intake form applies).
 */

export interface TemplateTask {
  title: string;
  description?: string;
  audience: TaskAudience;
  owner: TaskOwner;
  /** Days after the start date this is due. Omit for undated internal work. */
  dueOffsetDays?: number;
  optional?: boolean;
  forPlans?: string[];
}

/** Keyed by phase number (1–7). */
export const TASK_TEMPLATE: Record<number, TemplateTask[]> = {
  1: [
    {
      title: "Welcome call with Andy",
      description: "A quick hello and a walk through what happens next.",
      audience: "client",
      owner: "both",
      dueOffsetDays: 1,
    },
    {
      title: "Complete your business details form",
      description: "Tells us about your brand, your customers and your goals.",
      audience: "client",
      owner: "client",
      dueOffsetDays: 4,
    },
    {
      title: "Book your kickoff call",
      audience: "client",
      owner: "client",
      dueOffsetDays: 5,
    },
    {
      title: "Provision client workspace",
      audience: "internal",
      owner: "travelgenix",
    },
  ],
  2: [
    {
      title: "Upload your logo and brand assets",
      audience: "client",
      owner: "client",
      dueOffsetDays: 8,
    },
    {
      title: "Share your destination and product content",
      description: "Photos, descriptions, anything that makes your trips sing.",
      audience: "client",
      owner: "client",
      dueOffsetDays: 10,
    },
    {
      title: "Confirm your domain name",
      audience: "client",
      owner: "client",
      dueOffsetDays: 15,
    },
    {
      title: "QA brand assets against guidelines",
      audience: "internal",
      owner: "travelgenix",
    },
  ],
  3: [
    {
      title: "Build your homepage draft",
      description: "We're on this. You'll get a preview link the moment it's ready.",
      audience: "client",
      owner: "travelgenix",
      dueOffsetDays: 21,
    },
    {
      title: "Send us your About Us content",
      description: "Your story, in your words. A few paragraphs is plenty.",
      audience: "client",
      owner: "client",
      dueOffsetDays: 22,
    },
    {
      title: "Configure your search widgets",
      audience: "client",
      owner: "travelgenix",
      dueOffsetDays: 23,
    },
    {
      title: "Send us your supplier account details",
      description: "So we can connect your booking feeds. We'll never share them.",
      audience: "client",
      owner: "client",
      dueOffsetDays: 24,
      forPlans: ["Boost", "Ignite"],
    },
    {
      title: "Review and approve your homepage",
      description: "First look at your new front door. Tell us what you think.",
      audience: "client",
      owner: "client",
      dueOffsetDays: 26,
    },
    {
      title: "Build staging site & run internal design review",
      audience: "internal",
      owner: "travelgenix",
    },
  ],
  4: [
    {
      title: "Complete the Travelgenix University core modules",
      audience: "client",
      owner: "client",
      dueOffsetDays: 32,
    },
    {
      title: "Practise creating a booking in the sandbox",
      audience: "client",
      owner: "client",
      dueOffsetDays: 34,
    },
    {
      title: "1-to-1 training session",
      description: "A live session with Andy, shaped around how you'll actually work.",
      audience: "client",
      owner: "both",
      dueOffsetDays: 35,
    },
    {
      title: "Set up logins for your team",
      audience: "client",
      owner: "client",
      dueOffsetDays: 36,
      optional: true,
    },
  ],
  5: [
    {
      title: "Final content review",
      audience: "client",
      owner: "client",
      dueOffsetDays: 39,
    },
    {
      title: "Confirm your payment gateway details",
      audience: "client",
      owner: "client",
      dueOffsetDays: 40,
    },
    {
      title: "Test your booking flow end-to-end",
      description: "Walk through a test booking from a customer's point of view.",
      audience: "client",
      owner: "both",
      dueOffsetDays: 41,
    },
    {
      title: "Set your go-live date",
      audience: "client",
      owner: "client",
      dueOffsetDays: 42,
    },
    {
      title: "Run pre-launch technical checks",
      audience: "internal",
      owner: "travelgenix",
    },
  ],
  6: [
    {
      title: "Publish your first promotion",
      audience: "client",
      owner: "client",
      dueOffsetDays: 50,
    },
    {
      title: "Review your first week's bookings and enquiries",
      audience: "client",
      owner: "client",
      dueOffsetDays: 53,
    },
    {
      title: "30-day check-in call",
      audience: "client",
      owner: "both",
      dueOffsetDays: 66,
    },
    {
      title: "Monitor engagement signals",
      audience: "internal",
      owner: "travelgenix",
    },
  ],
  7: [
    {
      title: "Explore the advanced marketing tools",
      audience: "client",
      owner: "client",
      dueOffsetDays: 73,
    },
    {
      title: "Join the Travelgenix community",
      audience: "client",
      owner: "client",
      dueOffsetDays: 76,
    },
    {
      title: "Book a growth review",
      audience: "client",
      owner: "both",
      dueOffsetDays: 78,
      optional: true,
    },
  ],
};
