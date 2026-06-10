import { SparkleIcon } from "@/components/icons";
import type { MessageAttachment } from "@/lib/onboarding/types";

/**
 * One thread message, shared by the client portal and the staff dashboard.
 * Three looks: the viewer's own messages (right, accent), the other human
 * side (left, subtle), and Luna (left, tinted with a sparkle label so AI
 * answers are never mistaken for a person).
 */
export function MessageBubble({
  self,
  luna = false,
  body,
  meta,
  attachments,
}: {
  /** True when the viewer sent it — renders right-aligned on accent. */
  self: boolean;
  luna?: boolean;
  body: string;
  /** The "who · when" line under the bubble. */
  meta: React.ReactNode;
  attachments?: MessageAttachment[];
}) {
  const bubbleCls = self
    ? "rounded-br-md bg-accent text-accent-contrast"
    : luna
      ? "rounded-bl-md border border-accent/20 bg-accent-soft text-fg"
      : "rounded-bl-md bg-bg-subtle text-fg";

  return (
    <div className={`flex ${self ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${self ? "text-right" : "text-left"}`}>
        {luna && (
          <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent">
            <SparkleIcon className="h-3 w-3" /> Luna · instant answer
          </p>
        )}
        <div
          className={`inline-block rounded-2xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed whitespace-pre-wrap break-words ${bubbleCls}`}
        >
          {body}
          {attachments?.map((attachment) =>
            attachment.isImage ? (
              <a
                key={attachment.url}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block ${body ? "mt-2" : ""}`}
              >
                {/* Airtable attachment URLs are short-lived; the server render
                    refreshes them, so next/image's build-time host allowlist
                    doesn't fit here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  loading="lazy"
                  className="max-h-56 w-auto rounded-lg"
                />
              </a>
            ) : (
              <a
                key={attachment.url}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2 ${body ? "mt-2" : ""}`}
              >
                📎 {attachment.filename}
              </a>
            ),
          )}
        </div>
        <p className="mt-1 text-[10px] text-fg-faint">{meta}</p>
      </div>
    </div>
  );
}
