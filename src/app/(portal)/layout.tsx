import { Header } from "@/components/Header";
import { LunaButton } from "@/components/LunaButton";
import { Sidebar } from "@/components/portal/Sidebar";
import { getClientJourney } from "@/lib/onboarding/data";

/**
 * The portal shell: teal sidebar (desktop) or top bar + tab nav (mobile),
 * shared across every portal section. Pages render into the content column.
 */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const journey = await getClientJourney();

  return (
    <div className="flex min-h-dvh">
      <Sidebar client={journey.client} notifications={journey.notifications} />

      <div className="min-w-0 flex-1">
        <Header client={journey.client} notifications={journey.notifications} />

        <main className="mx-auto w-full max-w-[45rem] px-5 py-7 sm:px-8 sm:py-9">
          {children}
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
