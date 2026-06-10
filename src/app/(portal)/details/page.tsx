import type { Metadata } from "next";
import { IntakeForm } from "@/components/portal/IntakeForm";
import { getClientJourney } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Your details · Travelgenix onboarding",
};

export default async function DetailsPage() {
  // Sections are already filtered to this client's package tier server-side.
  const journey = await getClientJourney();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Your details
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        Tell us about your business so we can tailor everything.
      </p>

      <IntakeForm sections={journey.intake} className="mt-6" />
    </div>
  );
}
