import type { Metadata } from "next";
import { DocumentHub } from "@/components/portal/DocumentHub";
import { getClientJourney } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Documents · Travelgenix onboarding",
};

export default async function DocumentsPage() {
  const journey = await getClientJourney();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Documents
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        Everything you need in one place.
      </p>

      <DocumentHub documents={journey.documents} className="mt-6" />
    </div>
  );
}
