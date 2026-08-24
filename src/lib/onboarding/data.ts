import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { airtableConfig, fetchJourneyFromAirtable } from "./airtable";
import {
  CLIENT_COOKIE,
  clientAuthConfigured,
  clientIdFromToken,
} from "@/lib/api/client-auth";
import { makeMockJourney } from "./mock-data";
import { visibleIntakeSections } from "./contract-type";
import type { OnboardingJourney } from "./types";

/**
 * THE SWAP POINT — live, and since client auth landed, the portal's single
 * enforcement gate.
 *
 * Resolution order:
 * - CLIENT_AUTH_SECRET set → a valid session cookie is required; anything
 *   else redirects to /login, and the journey is the SESSION's client.
 * - Secret unset or missing Airtable env → the MOCK journey only. A real
 *   client's data is never served without a session. (This replaced the
 *   old pinned-oldest-client compat after the 3 Jul 2026 incident: an
 *   accidentally-empty secret plus a real client in the base let that
 *   client see the demo journey unauthenticated. Fail closed, always.)
 *
 * Every portal layout/page calls this, so protection can't be forgotten
 * on a new page. `cache` dedupes within a request.
 */
const getJourney = cache(async (): Promise<OnboardingJourney> => {
  const config = airtableConfig();
  if (!config || !clientAuthConfigured()) return makeMockJourney();

  const cookieStore = await cookies();
  const clientId = clientIdFromToken(cookieStore.get(CLIENT_COOKIE)?.value);
  if (!clientId) redirect("/login");

  const live = await fetchJourneyFromAirtable(clientId);
  // Stale session (client removed) or Airtable trouble: never show another
  // journey — back to the door.
  if (!live) redirect("/login");
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
  const { plan, contractType } = journey.client;

  return {
    ...journey,
    phases: journey.phases.map((phase) => ({
      ...phase,
      tasks: phase.tasks.filter((task) => task.audience === "client"),
    })),
    // Strip sections/fields this client's tier or contract doesn't include, so
    // the widget-only intake never reaches the browser.
    intake: visibleIntakeSections(journey.intake, plan, contractType ?? "full"),
  };
}
