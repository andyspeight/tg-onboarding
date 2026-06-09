import { CheckIcon } from "@/components/icons";
import type { OnboardingTask } from "@/lib/onboarding/types";

interface ChecklistProps {
  tasks: OnboardingTask[];
  onToggle: (taskId: string) => void;
}

export function Checklist({ tasks, onToggle }: ChecklistProps) {
  if (tasks.length === 0) return null;

  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => onToggle(task.id)}
            aria-pressed={task.done}
            className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-surface-2"
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                task.done
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-border-strong bg-surface text-transparent"
              }`}
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </span>

            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    task.done ? "text-fg-faint line-through" : "text-fg"
                  }`}
                >
                  {task.title}
                </span>
                {task.optional && (
                  <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted">
                    Optional
                  </span>
                )}
              </span>
              {task.description && (
                <span className="mt-0.5 block text-[13px] leading-relaxed text-fg-muted">
                  {task.description}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
