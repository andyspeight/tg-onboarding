"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ClientProfile, PortalNotification } from "@/lib/onboarding/types";
import { formatShortDate } from "@/lib/onboarding/dates";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BookIcon,
  ChatIcon,
  ClipboardCheckIcon,
  FolderIcon,
  PencilIcon,
  TagIcon,
} from "@/components/icons";

export interface NavItem {
  /** Route to navigate to, or null while the section is a later slice. */
  href: string | null;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

/** Portal sections. Live items navigate; the rest land in later slices. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Action plan", Icon: ClipboardCheckIcon },
  { href: "/details", label: "Your details", Icon: PencilIcon },
  { href: "/documents", label: "Documents", Icon: FolderIcon },
  { href: "/training", label: "Training", Icon: BookIcon },
  { href: "/suppliers", label: "Suppliers", Icon: TagIcon },
  { href: "/messages", label: "Messages", Icon: ChatIcon },
];

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Desktop portal shell, per the approved prototype: deep-teal gradient rail
 * with the wordmark, the client's package, navigation and their account
 * manager. Sections without a route yet are marked "Soon". On mobile this
 * collapses into `Header`.
 */
export function Sidebar({
  client,
  notifications,
  unreadMessages = 0,
  showLogout = false,
}: {
  client: ClientProfile;
  notifications: PortalNotification[];
  unreadMessages?: number;
  showLogout?: boolean;
}) {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/client-logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
    window.location.assign("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col bg-brand-gradient text-white lg:flex">
      <div className="flex items-start justify-between gap-2 px-5 pb-4 pt-6">
        <div>
          <p className="text-lg font-extrabold lowercase tracking-tight">
            travelgenix
          </p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Client portal
          </p>
        </div>
        <div className="flex items-center">
          <NotificationBell
            notifications={notifications}
            tone="onDark"
            align="left"
          />
          <ThemeToggle tone="onDark" />
        </div>
      </div>

      <div className="border-y border-white/10 px-5 py-4">
        <p className="text-sm font-semibold tracking-tight">{client.company}</p>
        <p className="mt-1.5 flex items-center gap-2">
          {client.plan && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
              {client.plan}
            </span>
          )}
          {client.onboardingStartedAt && (
            <span className="text-[10px] text-white/40">
              Since {formatShortDate(client.onboardingStartedAt)}
            </span>
          )}
        </p>
      </div>

      <nav aria-label="Portal sections" className="flex-1 space-y-0.5 p-2.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          if (href === null) {
            return (
              <span
                key={label}
                aria-disabled
                className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] text-white/45"
              >
                <Icon className="h-4 w-4 shrink-0 opacity-60" />
                {label}
                <span className="ml-auto rounded-full border border-white/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-white/40">
                  Soon
                </span>
              </span>
            );
          }

          const active = isActivePath(pathname, href);
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] transition-colors ${
                active
                  ? "bg-white/15 font-semibold text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white/90"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${active ? "" : "opacity-70"}`}
              />
              {label}
              {href === "/messages" && unreadMessages > 0 && (
                <span
                  aria-label={`${unreadMessages} unread`}
                  className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-brand"
                >
                  {unreadMessages}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {(client.accountManager || showLogout) && (
        <div className="border-t border-white/10 bg-black/10 px-5 py-4">
          {client.accountManager && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Your account manager
              </p>
              <p className="mt-2 flex items-center gap-2.5 text-[13px] font-medium">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">
                  {client.accountManager.charAt(0)}
                </span>
                {client.accountManager}
              </p>
            </>
          )}
          {showLogout && (
            <button
              type="button"
              onClick={logout}
              className="press mt-3 cursor-pointer text-[11px] font-medium text-white/40 transition-colors hover:text-white/80"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
