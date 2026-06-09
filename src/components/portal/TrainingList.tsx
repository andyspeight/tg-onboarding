import { ArticleIcon, ClockIcon, PlayIcon } from "@/components/icons";
import type { TrainingResource } from "@/lib/onboarding/types";

interface TrainingListProps {
  training: TrainingResource[];
}

export function TrainingList({ training }: TrainingListProps) {
  if (training.length === 0) return null;

  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-fg-faint">
        Learn as you go
      </p>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {training.map((item) => {
          const isVideo = item.type === "video";
          const actionLabel = isVideo ? "Watch" : "Read";
          // Phase 1: slots are reserved; real content lands later.
          const ready = Boolean(item.url);

          const inner = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                {isVideo ? (
                  <PlayIcon className="h-[18px] w-[18px]" />
                ) : (
                  <ArticleIcon className="h-[18px] w-[18px]" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-fg">
                  {item.title}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
                  {item.durationLabel && (
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {item.durationLabel}
                    </span>
                  )}
                  <span className="font-medium text-accent">
                    {ready ? actionLabel : "Coming soon"}
                  </span>
                </span>
              </span>
            </>
          );

          return (
            <li key={item.id}>
              {ready ? (
                <a
                  href={item.url}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-2"
                >
                  {inner}
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface-2/60 p-3">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
