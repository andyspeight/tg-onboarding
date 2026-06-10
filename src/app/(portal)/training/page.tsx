import type { Metadata } from "next";
import { TrainingHub } from "@/components/portal/TrainingHub";
import { getClientJourney } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Training · Travelgenix onboarding",
};

export default async function TrainingPage() {
  const journey = await getClientJourney();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Training
      </h1>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">
        Short videos and guides from Travelgenix University, matched to each
        step of your journey. Tick things off as you go.
      </p>

      <TrainingHub phases={journey.phases} className="mt-6" />
    </div>
  );
}
