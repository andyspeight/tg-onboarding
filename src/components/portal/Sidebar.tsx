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
} from "@/components/icons";

const NAV_ITEMS = [
  { id: "plan", label: "Action plan", Icon: ClipboardCheckIcon, live: true },
  { id: "details", label: "Your details", Icon: PencilIcon, live: false },
  { id: "documents", label: "Documents", Icon: FolderIcon, live: false },
  { id: "training", label: "Training", Icon: BookIcon, live: false },
  { id: "messages", label: "Messages", Icon: ChatIcon, live: false },
];

/**
 * Desktop portal shell, per the approved prototype: deep-teal gradient rail
 * with the wordmark, the client's package, navigation and their account
 * manager. Sections beyond the action plan arrive in later Phase 1 slices and
 * are marked "Soon" until they do. On mobile this collapses into `Header`.
 */
export function Sidebar({
  client,
  notifications,
}: {
  client: ClientProfile;
  notifications: PortalNotification[];
}) {
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
          <NotificationBell notifications={notifications} tone="onDark" />
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
        {NAV_ITEMS.map(({ id, label, Icon, live }) =>
          live ? (
            <a
              key={id}
              href="#"
              aria-current="page"
              className="flex items-center gap-3 rounded-lg bg-white/15 px-3.5 py-2.5 text-[13px] font-semibold text-white"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </a>
          ) : (
            <span
              key={id}
              aria-disabled
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] text-white/45"
            >
              <Icon className="h-4 w-4 shrink-0 opacity-60" />
              {label}
              <span className="ml-auto rounded-full border border-white/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-white/40">
                Soon
              </span>
            </span>
          ),
        )}
      </nav>

      {client.accountManager && (
        <div className="border-t border-white/10 bg-black/10 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Your account manager
          </p>
          <p className="mt-2 flex items-center gap-2.5 text-[13px] font-medium">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">
              {client.accountManager.charAt(0)}
            </span>
            {client.accountManager}
          </p>
        </div>
      )}
    </aside>
  );
}
