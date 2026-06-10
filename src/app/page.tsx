import { Header } from "@/components/Header";
import { LunaButton } from "@/components/LunaButton";
import { Portal } from "@/components/portal/Portal";
import { Sidebar } from "@/components/portal/Sidebar";
import { getClientJourney } from "@/lib/onboarding/data";

export default async function Home() {
  // Client-facing journey only — internal tasks are stripped server-side.
  const journey = await getClientJourney();

  return (
    <div className="flex min-h-dvh">
      <Sidebar client={journey.client} notifications={journey.notifications} />

      <div className="min-w-0 flex-1">
        <Header client={journey.client} notifications={journey.notifications} />

        <main className="mx-auto w-full max-w-[45rem] px-5 py-7 sm:px-8 sm:py-9">
          <Portal journey={journey} />
        </main>

        <footer className="mx-auto w-full max-w-[45rem] px-5 pb-24 sm:px-8">
          <p className="border-t border-border pt-5 text-center text-xs text-fg-faint">
            Travelgenix client onboarding · Phase 1 preview · running on mock data
          </p>
        </footer>
      </div>

      <LunaButton />
    </div>
  );
}
