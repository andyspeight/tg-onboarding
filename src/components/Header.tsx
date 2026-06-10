"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ClientProfile, PortalNotification } from "@/lib/onboarding/types";
import { NAV_ITEMS, isActivePath, type NavItem } from "@/components/portal/Sidebar";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Mobile top bar with tab navigation. On large screens the teal `Sidebar`
 * carries the brand, nav, notifications and theme toggle, so this only
 * renders below `lg`. Coming-soon sections are left out here: on a small
 * screen, space goes to what works today.
 */
export function Header({
  client,
  notifications,
  unreadMessages = 0,
}: {
  client: ClientProfile;
  notifications: PortalNotification[];
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const liveItems = NAV_ITEMS.filter(
    (item): item is NavItem & { href: string } => item.href !== null,
  );

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

      <nav
        aria-label="Portal sections"
        className="flex gap-1 overflow-x-auto px-3 pb-2"
      >
        {liveItems.map(({ href, label }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-accent-soft text-accent"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              {label}
              {href === "/messages" && unreadMessages > 0 && (
                <span
                  aria-label={`${unreadMessages} unread`}
                  className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-contrast"
                >
                  {unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
