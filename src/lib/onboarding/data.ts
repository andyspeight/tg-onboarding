import { cache } from "react";
import { makeMockJourney } from "./mock-data";
import type { OnboardingJourney } from "./types";

/**
 * THE SWAP POINT.
 *
 * Phase 1 reads the journey from local mock data. When the Airtable base is
 * decided, this is the one file that changes: replace the body of `getJourney`
 * with an Airtable read (server-side, env-keyed) that returns the same shape.
 * Nothing else in the app should reach for data directly.
 *
 * `cache` dedupes the read within a request, so the layout and the page see
 * the same journey (and the same asOf) on a single render pass.
 */
export const getJourney = cache(async (): Promise<OnboardingJourney> => {
  // Later: fetch from Airtable here and map records -> OnboardingJourney.
  return makeMockJourney();
});

/**
 * Client-facing projection of the journey.
 *
 * Internal-only tasks and other tiers' intake sections are stripped here, on
 * the server, so they never reach the browser bundle or the network. The
 * client portal only ever sees its own work.
 */
export async function getClientJourney(): Promise<OnboardingJourney> {
  const journey = await getJourney();
  const plan = journey.client.plan;

  return {
    ...journey,
    phases: journey.phases.map((phase) => ({
      ...phase,
      tasks: phase.tasks.filter((task) => task.audience === "client"),
    })),
    intake: journey.intake.filter(
      (section) =>
        !section.showForPlans ||
        (plan !== undefined && section.showForPlans.includes(plan)),
    ),
  };
}
