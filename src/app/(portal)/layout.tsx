import { Header } from "@/components/Header";
import { LunaButton } from "@/components/LunaButton";
import { Sidebar } from "@/components/portal/Sidebar";
import { clientAuthConfigured } from "@/lib/api/client-auth";
import { airtableConfig } from "@/lib/onboarding/airtable";
import { getClientJourney } from "@/lib/onboarding/data";

/**
 * The portal shell: teal sidebar (desktop) or top bar + tab nav (mobile),
 * shared across every portal section. Pages render into the content column.
 *
 * Since client auth, rendering is per-session (the journey resolves from
 * the cookie inside getClientJourney, which also redirects signed-out
 * visitors). Freshness comes from the tagged 60s fetch cache in the data
 * layer rather than page-level ISR.
 */
export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const journey = await getClientJourney();
  const showLogout = Boolean(airtableConfig()) && clientAuthConfigured();

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        client={journey.client}
        notifications={journey.notifications}
        unreadMessages={journey.unreadMessages}
        showLogout={showLogout}
      />

      <div className="min-w-0 flex-1">
        <Header
          client={journey.client}
          notifications={journey.notifications}
          unreadMessages={journey.unreadMessages}
          showLogout={showLogout}
        />

        <main className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10">
          {children}
        </main>

        <footer className="mx-auto w-full max-w-5xl px-6 pb-24 sm:px-10">
          <p className="border-t border-border pt-5 text-center text-xs text-fg-faint">
            Travelgenix client onboarding ·{" "}
            {journey.source === "airtable"
              ? "live data"
              : "running on mock data"}
          </p>
        </footer>
      </div>

      <LunaButton />
    </div>
  );
}
