"use client";

import { useEffect, useRef, useState } from "react";
import type { NotificationKind, PortalNotification } from "@/lib/onboarding/types";
import {
  BellIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  SparkleIcon,
  WrenchIcon,
} from "./icons";

const KIND_STYLE: Record<
  NotificationKind,
  { Icon: typeof BellIcon; cls: string }
> = {
  progress: { Icon: WrenchIcon, cls: "bg-accent-soft text-accent" },
  reminder: { Icon: ClockIcon, cls: "bg-warning-soft text-warning" },
  complete: { Icon: CheckIcon, cls: "bg-success-soft text-success" },
  message: { Icon: ChatIcon, cls: "bg-info-soft text-info" },
  welcome: { Icon: SparkleIcon, cls: "bg-accent-soft text-accent" },
};

/**
 * The nudge surface. Notifications are task-specific by design (an anti-wilting
 * core rule: never a generic nag). Phase 1 renders them from mock data; the
 * read state lives in memory until Airtable persistence lands.
 */
export function NotificationBell({
  notifications,
  tone = "default",
}: {
  notifications: PortalNotification[];
  tone?: "default" | "onDark";
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const containerRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.read).length;

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleOpen() {
    setOpen((value) => !value);
    if (!open && unread > 0) {
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        className={`press relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          tone === "onDark"
            ? "text-white/70 hover:bg-white/10 hover:text-white"
            : "border border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
        }`}
      >
        <BellIcon
          className="h-[18px] w-[18px]"
          style={unread > 0 ? { animation: "tg-bell-ring 0.8s ease" } : undefined}
        />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="anim-pop absolute right-0 top-11 z-50 w-[19rem] origin-top-right overflow-hidden rounded-card border border-border bg-surface text-left shadow-float sm:w-80"
        >
          <p className="border-b border-border px-4 py-3 text-[13px] font-bold text-fg">
            Notifications
          </p>
          <ul className="max-h-80 overflow-y-auto">
            {items.map((item) => {
              const { Icon, cls } = KIND_STYLE[item.kind];
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cls}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-snug text-fg">
                      {item.text}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-fg-faint">
                      {item.whenLabel}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
