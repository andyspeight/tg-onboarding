"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PortalMessage } from "@/lib/onboarding/types";

const MAX_BODY_CHARS = 2000;

/**
 * The client's side of the thread. Team messages sit left on surface,
 * the client's sit right on accent. Opening the page marks team messages
 * read (clears the nav badge); sending appends optimistically and the
 * server render catches up on the next revalidation.
 */
export function MessagesThread({
  messages,
  unread,
  live,
  accountManager,
}: {
  messages: PortalMessage[];
  unread: number;
  live: boolean;
  accountManager?: string;
}) {
  const router = useRouter();
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
    if (!live || unread === 0 || markedRef.current) return;
    markedRef.current = true;
    fetch("/api/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(() => router.refresh())
      .catch(() => {
        // Quietly retried next visit; reading shouldn't ever error at them.
      });
  }, [live, unread, router]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (body.length === 0 || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setItems((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          from: "client",
          body,
          whenLabel: "Just now",
        },
      ]);
      setDraft("");
    } catch {
      setError("That didn’t send. Give it another go.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      <div className="max-h-[26rem] space-y-3 overflow-y-auto p-4 sm:p-5">
        {items.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.from === "client" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] ${
                message.from === "client" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                  message.from === "client"
                    ? "rounded-br-md bg-accent text-accent-contrast"
                    : "rounded-bl-md bg-bg-subtle text-fg"
                }`}
              >
                {message.body}
              </div>
              <p className="mt-1 text-[10px] text-fg-faint">
                {message.from === "client"
                  ? "You"
                  : (accountManager ?? "Travelgenix team")}{" "}
                · {message.whenLabel}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-10 text-center text-[13px] text-fg-muted">
            No messages yet. Say hello — this goes straight to your team.
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t border-border p-3 sm:p-4">
        <label htmlFor="message-draft" className="sr-only">
          Write a message
        </label>
        <textarea
          id="message-draft"
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
          disabled={!live}
          placeholder={
            live
              ? "Write a message... (Enter to send, Shift+Enter for a new line)"
              : "Messaging connects once the portal is live."
          }
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-[14px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15 disabled:opacity-60"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p
            aria-live="polite"
            className={`text-[12px] ${error ? "font-medium text-danger" : "text-fg-faint"}`}
          >
            {error ??
              (draft.length > MAX_BODY_CHARS - 200
                ? `${MAX_BODY_CHARS - draft.length} characters left`
                : "We usually reply within a working day.")}
          </p>
          <button
            type="submit"
            disabled={!live || sending || draft.trim().length === 0}
            className="press h-9 shrink-0 cursor-pointer rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
