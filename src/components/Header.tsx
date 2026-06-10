import type { ClientProfile, PortalNotification } from "@/lib/onboarding/types";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Mobile top bar. On large screens the teal `Sidebar` carries the brand,
 * notifications and theme toggle, so this only renders below `lg`.
 */
export function Header({
  client,
  notifications,
}: {
  client: ClientProfile;
  notifications: PortalNotification[];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/85 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-between px-5">
        <p className="flex items-baseline gap-2">
          <span className="text-[17px] font-extrabold lowercase tracking-tight text-fg">
            travelgenix
          </span>
          {client.plan && (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
              {client.plan}
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <NotificationBell notifications={notifications} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
