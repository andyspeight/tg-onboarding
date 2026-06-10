import { cache } from "react";
import { fetchJourneyFromAirtable } from "./airtable";
import { makeMockJourney } from "./mock-data";
import type { OnboardingJourney } from "./types";

/**
 * THE SWAP POINT — now live.
 *
 * The journey reads from the TG Onboarding Airtable base when the env is
 * configured (AIRTABLE_PAT + AIRTABLE_BASE_ID, server-side only), and falls
 * back to local mock data otherwise — so dev without credentials and any
 * Airtable outage both keep the portal rendering. Nothing else in the app
 * reaches for data directly.
 *
 * `cache` dedupes the read within a request, so the layout and the page see
 * the same journey (and the same asOf) on a single render pass.
 */
export const getJourney = cache(async (): Promise<OnboardingJourney> => {
  const live = await fetchJourneyFromAirtable();
  return live ?? makeMockJourney();
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
