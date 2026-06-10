import { Portal } from "@/components/portal/Portal";
import { getClientJourney } from "@/lib/onboarding/data";

export default async function ActionPlanPage() {
  // Client-facing journey only — internal tasks are stripped server-side.
  const journey = await getClientJourney();

  return <Portal journey={journey} />;
}
