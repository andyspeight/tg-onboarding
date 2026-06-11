import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  airtableConfig,
  fetchJourneyFromAirtable,
  getPortalClientId,
} from "./airtable";
import {
  CLIENT_COOKIE,
  clientAuthConfigured,
  clientIdFromToken,
} from "@/lib/api/client-auth";
import { makeMockJourney } from "./mock-data";
import type { OnboardingJourney } from "./types";

/**
 * THE SWAP POINT — live, and since client auth landed, the portal's single
 * enforcement gate.
 *
 * Resolution order:
 * - No Airtable env → mock journey, no login (local dev, demos, outages
 *   at the env level).
 * - CLIENT_AUTH_SECRET set → a valid session cookie is required; anything
 *   else redirects to /login, and the journey is the SESSION's client.
 * - Secret unset (compat) → the pre-auth behaviour: pinned to the oldest
 *   client record. This is what production does until Andy flips the env.
 *
 * Every portal layout/page calls this, so protection can't be forgotten
 * on a new page. `cache` dedupes within a request.
 */
const getJourney = cache(async (): Promise<OnboardingJourney> => {
  const config = airtableConfig();
  if (!config) return makeMockJourney();

  let clientId: string | null;
  if (clientAuthConfigured()) {
    const cookieStore = await cookies();
    clientId = clientIdFromToken(cookieStore.get(CLIENT_COOKIE)?.value);
    if (!clientId) redirect("/login");
  } else {
    clientId = await getPortalClientId(config);
  }
  if (!clientId) return makeMockJourney();

  const live = await fetchJourneyFromAirtable(clientId);
  if (!live) {
    // Stale session (client removed) or Airtable trouble. With auth on,
    // never show another journey — back to the door.
    if (clientAuthConfigured()) redirect("/login");
    return makeMockJourney();
  }
  return live;
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
