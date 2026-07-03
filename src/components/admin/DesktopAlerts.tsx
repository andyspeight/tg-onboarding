"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AM_KEY = "tg-admin-alert-am";
const SEEN_KEY = "tg-admin-alert-seen";
const POLL_MS = 60_000;
const ALL = "*";

/** Friendly notification lines per signal. Unknown signals stay silent. */
const SIGNAL_LINES: Record<string, string> = {
  "task-updated": "updated their action plan",
  "intake-saved": "saved a section of their details",
  "document-uploaded": "uploaded a file",
  "confidence-rated": "rated their confidence",
  "training-completed": "completed a training item",
  "message-sent": "sent a message",
  "logged-in": "signed in to their portal",
};

interface FeedItem {
  id: string;
  at: string;
  signal: string;
  detail: string;
  clientId: string;
  company: string;
  contactName: string;
  accountManager: string;
}

/**
 * Desktop notifications for AMs, scoped to the clients assigned to them.
 * Pick your name once, allow notifications, and while any dashboard tab is
 * open (even in the background) new client activity pops a notification
 * that clicks through to the client's file. The choice lives in this
 * browser only — each AM sets their own machine up.
 */
export function DesktopAlerts() {
  const [open, setOpen] = useState(false);
  const [amName, setAmName] = useState<string | null>(null);
  const [managers, setManagers] = useState<string[]>([]);
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const enabled = amName !== null && permission === "granted";

  // Hydrate from this browser's saved choice. Deliberately an effect: these
  // values only exist client-side, so reading them during render would
  // mismatch the server HTML.
  useEffect(() => {
    if (typeof Notification === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only value; rendering it would mismatch server HTML
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);
    setAmName(localStorage.getItem(AM_KEY));
  }, []);

  const poll = useCallback(async () => {
    const am = localStorage.getItem(AM_KEY);
    if (!am || Notification.permission !== "granted") return;
    try {
      const response = await fetch("/api/admin/activity-feed");
      if (!response.ok) return;
      const feed = (await response.json()) as { items: FeedItem[] };
      const seen = localStorage.getItem(SEEN_KEY) ?? new Date().toISOString();

      const fresh = feed.items
        .filter(
          (item) =>
            item.at > seen &&
            SIGNAL_LINES[item.signal] !== undefined &&
            (am === ALL || item.accountManager === am),
        )
        // Oldest first so notifications stack in the order things happened.
        .sort((a, b) => a.at.localeCompare(b.at))
        // A burst becomes at most three pops; email + dashboard carry the rest.
        .slice(-3);

      const newest = feed.items[0]?.at;
      if (newest && newest > seen) localStorage.setItem(SEEN_KEY, newest);

      for (const item of fresh) {
        const line = SIGNAL_LINES[item.signal];
        const notification = new Notification(item.company, {
          body: `${item.contactName} ${line}${item.detail ? ` (${item.detail})` : ""}`,
          tag: item.id,
        });
        notification.onclick = () => {
          window.focus();
          window.location.assign(`/admin/clients/${item.clientId}`);
        };
      }
    } catch {
      // Polling is best-effort; the next tick tries again.
    }
  }, []);

  // Poll every minute while enabled, plus immediately when the tab wakes.
  useEffect(() => {
    if (!enabled) return;
    poll();
    pollRef.current = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, poll]);

  // The AM list loads once, for the picker.
  useEffect(() => {
    fetch("/api/admin/activity-feed")
      .then((response) => (response.ok ? response.json() : null))
      .then((feed: { accountManagers: string[] } | null) => {
        if (feed) setManagers(feed.accountManagers);
      })
      .catch(() => {});
  }, []);

  async function enable(name: string) {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;
    localStorage.setItem(AM_KEY, name);
    // Start from now — don't replay history as a notification storm.
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
    setAmName(name);
    setOpen(false);
    new Notification("Desktop alerts are on", {
      body:
        name === ALL
          ? "You'll hear about activity from every client."
          : `You'll hear about activity from ${name}'s clients.`,
    });
  }

  function disable() {
    localStorage.removeItem(AM_KEY);
    setAmName(null);
    setOpen(false);
  }

  if (!supported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="press cursor-pointer rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      >
        {enabled
          ? `Alerts: ${amName === ALL ? "All clients" : amName}`
          : "Alerts: Off"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-card border border-border bg-surface p-4 text-left shadow-card">
          <p className="text-[13px] font-bold text-fg">Desktop alerts</p>
          {permission === "denied" ? (
            <p className="mt-1.5 text-[12px] leading-relaxed text-fg-muted">
              Notifications are blocked for this site in your browser settings.
              Allow them there, then come back and switch alerts on.
            </p>
          ) : (
            <>
              <p className="mt-1.5 text-[12px] leading-relaxed text-fg-muted">
                Get a notification when one of your clients does something,
                while the dashboard is open in any tab. Set per browser.
              </p>
              <div className="mt-3 space-y-1.5">
                {[...managers, ALL].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => enable(name)}
                    className={`press block w-full cursor-pointer rounded-md border px-3 py-1.5 text-left text-[12px] font-medium transition-colors ${
                      enabled && amName === name
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
                    }`}
                  >
                    {name === ALL ? "All clients" : `${name}'s clients`}
                  </button>
                ))}
                {managers.length === 0 && (
                  <p className="text-[12px] text-fg-faint">
                    No account managers found yet.
                  </p>
                )}
              </div>
              {enabled && (
                <button
                  type="button"
                  onClick={disable}
                  className="press mt-3 cursor-pointer text-[12px] font-medium text-fg-faint transition-colors hover:text-fg"
                >
                  Turn alerts off
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
