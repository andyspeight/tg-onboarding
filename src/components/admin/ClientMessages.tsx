"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminDetailMessage } from "@/lib/onboarding/health";

const MAX_BODY_CHARS = 2000;

/**
 * The team's side of one client's thread. Opening it marks client
 * messages read (clears the overview chip); replies also drop a portal
 * notification so the client's bell lights up.
 */
export function ClientMessages({
  clientId,
  messages,
  contactName,
}: {
  clientId: string;
  messages: AdminDetailMessage[];
  contactName: string;
}) {
  const [items, setItems] = useState(messages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items.length]);

  useEffect(() => {
    if (markedRef.current || !messages.some((message) => message.unread)) {
      return;
    }
    markedRef.current = true;
    fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    }).catch(() => {
      // Re-marked on the next visit; never interrupt the staff view.
    });
  }, [clientId, messages]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (body.length === 0 || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, body }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setItems((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          from: "team",
          body,
          whenLabel: "Just now",
          unread: false,
        },
      ]);
      setDraft("");
    } catch {
      setError("That didn’t send. Try again in a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      <div className="max-h-80 space-y-3 overflow-y-auto p-4">
        {items.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === "team" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] ${message.from === "team" ? "text-right" : "text-left"}`}
            >
              <div
                className={`inline-block rounded-2xl px-3.5 py-2 text-left text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                  message.from === "team"
                    ? "rounded-br-md bg-accent text-accent-contrast"
                    : "rounded-bl-md bg-bg-subtle text-fg"
                }`}
              >
                {message.body}
              </div>
              <p className="mt-1 text-[10px] text-fg-faint">
                {message.from === "team" ? "Team" : contactName} ·{" "}
                {message.whenLabel}
                {message.unread && (
                  <span className="ml-1.5 font-semibold text-accent">new</span>
                )}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-center text-[12px] text-fg-muted">
            No messages yet.
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t border-border p-3">
        <label htmlFor={`reply-${clientId}`} className="sr-only">
          Reply to {contactName}
        </label>
        <textarea
          id={`reply-${clientId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={2}
          maxLength={MAX_BODY_CHARS}
          placeholder={`Reply to ${contactName}... (Enter to send)`}
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p
            aria-live="polite"
            className={`text-[11px] ${error ? "font-medium text-danger" : "text-fg-faint"}`}
          >
            {error ?? "They get a portal notification with your reply."}
          </p>
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            className="press h-8 shrink-0 cursor-pointer rounded-md bg-accent px-3.5 text-[12px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
