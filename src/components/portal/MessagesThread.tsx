"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageBubble } from "@/components/MessageBubble";
import { PaperclipIcon, SparkleIcon, XIcon } from "@/components/icons";
import type { PortalMessage } from "@/lib/onboarding/types";
import {
  MESSAGE_EXTENSIONS,
  fileToBase64,
  screenFiles,
  type ScreenedFile,
} from "@/lib/onboarding/uploads";

const MAX_BODY_CHARS = 2000;

/**
 * The client's side of the thread, Luna-fronted: questions the knowledge
 * base covers get an instant Luna answer in the same exchange; everything
 * reaches the team either way. Supports image/PDF attachments. Opening the
 * page marks team messages read (clears the nav badge).
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
  const [file, setFile] = useState<ScreenedFile | null>(null);
  const [sending, setSending] = useState(false);
  const [lunaThinking, setLunaThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items.length, lunaThinking]);

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

  async function sendIt(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if ((body.length === 0 && !file) || sending) return;

    setSending(true);
    if (body.length > 0) setLunaThinking(true);
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

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, attachment }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const result = (await response.json()) as { luna?: string | null };

      const mine: PortalMessage = {
        id: `local-${Date.now()}`,
        from: "client",
        body,
        whenLabel: "Just now",
        attachments: file
          ? [
              {
                url: URL.createObjectURL(file.file),
                filename: file.meta.name,
                isImage: file.file.type.startsWith("image/"),
              },
            ]
          : undefined,
      };
      const appended: PortalMessage[] = [mine];
      if (result.luna) {
        appended.push({
          id: `local-luna-${Date.now()}`,
          from: "luna",
          body: result.luna,
          whenLabel: "Just now",
        });
      }
      setItems((prev) => [...prev, ...appended]);
      setDraft("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("That didn’t send. Give it another go.");
    } finally {
      setSending(false);
      setLunaThinking(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-soft">
      <div className="max-h-[26rem] space-y-3 overflow-y-auto p-4 sm:p-5">
        {items.map((message) => (
          <MessageBubble
            key={message.id}
            self={message.from === "client"}
            luna={message.from === "luna"}
            body={message.body}
            attachments={message.attachments}
            meta={
              <>
                {message.from === "client"
                  ? "You"
                  : message.from === "luna"
                    ? "Luna"
                    : (accountManager ?? "Travelgenix team")}{" "}
                · {message.whenLabel}
              </>
            }
          />
        ))}
        {lunaThinking && (
          <div className="flex justify-start">
            <div className="max-w-[70%]">
              <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent">
                <SparkleIcon className="h-3 w-3" /> Luna
              </p>
              <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md border border-accent/20 bg-accent-soft px-3.5 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        {items.length === 0 && !lunaThinking && (
          <p className="py-10 text-center text-[13px] text-fg-muted">
            No messages yet. Say hello — this goes straight to your team.
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendIt} className="border-t border-border p-3 sm:p-4">
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
              ? "Ask anything... (Enter to send, Shift+Enter for a new line)"
              : "Messaging connects once the portal is live."
          }
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-[14px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15 disabled:opacity-60"
        />

        {file && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-[12px] text-fg">
            <PaperclipIcon className="h-3.5 w-3.5 text-fg-muted" />
            <span className="max-w-[14rem] truncate">{file.meta.name}</span>
            <span className="text-fg-faint">{file.meta.sizeLabel}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Remove attachment"
              className="press cursor-pointer text-fg-faint transition-colors hover:text-danger"
            >
              <XIcon className="h-3.5 w-3.5" />
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
              id="message-file"
              disabled={!live}
            />
            <label
              htmlFor="message-file"
              aria-label="Attach an image or PDF"
              className={`press flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg ${
                live ? "cursor-pointer" : "cursor-default opacity-60"
              }`}
            >
              <PaperclipIcon className="h-4 w-4" />
            </label>
            <p
              aria-live="polite"
              className={`min-w-0 truncate text-[12px] ${error ? "font-medium text-danger" : "text-fg-faint"}`}
            >
              {error ??
                (draft.length > MAX_BODY_CHARS - 200
                  ? `${MAX_BODY_CHARS - draft.length} characters left`
                  : "Luna answers instantly where she can. The team sees everything.")}
            </p>
          </div>
          <button
            type="submit"
            disabled={!live || sending || (draft.trim().length === 0 && !file)}
            className="press h-9 shrink-0 cursor-pointer rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
