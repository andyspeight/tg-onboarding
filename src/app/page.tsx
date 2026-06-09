import { Header } from "@/components/Header";
import { LunaButton } from "@/components/LunaButton";
import { Portal } from "@/components/portal/Portal";
import { getClientJourney } from "@/lib/onboarding/data";

export default async function Home() {
  // Client-facing journey only — internal tasks are stripped server-side.
  const journey = await getClientJourney();

  return (
    <>
      <Header specialistName={journey.client.specialistName} />

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        <Portal journey={journey} />
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">
        <p className="border-t border-border pt-6 text-center text-xs text-fg-faint">
          Travelgenix client onboarding · Phase 1 preview · running on mock data
        </p>
      </footer>

      <LunaButton />
    </>
  );
}
