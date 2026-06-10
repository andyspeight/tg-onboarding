"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/components/MessageBubble";
import { PaperclipIcon, XIcon } from "@/components/icons";
import type { AdminDetailMessage } from "@/lib/onboarding/health";
import {
  MESSAGE_EXTENSIONS,
  fileToBase64,
  screenFiles,
  type ScreenedFile,
} from "@/lib/onboarding/uploads";

const MAX_BODY_CHARS = 2000;

/**
 * The team's side of one client's thread. Luna's instant answers appear
 * inline so staff see exactly what was already said before replying.
 * Opening it marks client messages read; replies notify the client's bell.
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
  const [file, setFile] = useState<ScreenedFile | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  function pickFile(list: FileList | null) {
    setError(null);
    if (!list || list.length === 0) return;
    const { accepted, rejected } = screenFiles(list, MESSAGE_EXTENSIONS);
    if (rejected.length > 0) {
      setError(rejected[0]);
      return;
    }
    setFile(accepted[0] ?? null);
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if ((body.length === 0 && !file) || sending) return;

    setSending(true);
    setError(null);
    try {
      let attachment: { name: string; contentType: string; data: string } | undefined;
      if (file) {
        const base64 = await fileToBase64(file.file);
        if (!base64) throw new Error("read failed");
        attachment = {
          name: file.meta.name,
          contentType: file.file.type || "application/octet-stream",
          data: base64,
        };
      }

      const response = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, body, attachment }),
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
          attachments: file
            ? [
                {
                  url: URL.createObjectURL(file.file),
                  filename: file.meta.name,
                  isImage: file.file.type.startsWith("image/"),
                },
              ]
            : undefined,
        },
      ]);
      setDraft("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          <MessageBubble
            key={message.id}
            self={message.from === "team"}
            luna={message.from === "luna"}
            body={message.body}
            attachments={message.attachments}
            meta={
              <>
                {message.from === "team"
                  ? "Team"
                  : message.from === "luna"
                    ? "Luna"
                    : contactName}{" "}
                · {message.whenLabel}
                {message.unread && (
                  <span className="ml-1.5 font-semibold text-accent">new</span>
                )}
              </>
            }
          />
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

        {file && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-[11px] text-fg">
            <PaperclipIcon className="h-3 w-3 text-fg-muted" />
            <span className="max-w-[12rem] truncate">{file.meta.name}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Remove attachment"
              className="press cursor-pointer text-fg-faint transition-colors hover:text-danger"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={MESSAGE_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
              onChange={(event) => pickFile(event.target.files)}
              className="sr-only"
              id={`reply-file-${clientId}`}
            />
            <label
              htmlFor={`reply-file-${clientId}`}
              aria-label="Attach an image or PDF"
              className="press flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <PaperclipIcon className="h-3.5 w-3.5" />
            </label>
            <p
              aria-live="polite"
              className={`min-w-0 truncate text-[11px] ${error ? "font-medium text-danger" : "text-fg-faint"}`}
            >
              {error ?? "They get a portal notification with your reply."}
            </p>
          </div>
          <button
            type="submit"
            disabled={sending || (draft.trim().length === 0 && !file)}
            className="press h-8 shrink-0 cursor-pointer rounded-md bg-accent px-3.5 text-[12px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
