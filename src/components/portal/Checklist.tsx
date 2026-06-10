import { AlertTriangleIcon, ClockIcon } from "@/components/icons";
import type { OnboardingTask, TaskOwner, TaskStatus } from "@/lib/onboarding/types";
import { daysUntil, formatShortDate } from "@/lib/onboarding/dates";

interface ChecklistProps {
  tasks: OnboardingTask[];
  asOf: string;
  onCycle: (taskId: string) => void;
}

const NEXT_STATUS: Record<TaskStatus, string> = {
  todo: "in progress",
  "in-progress": "done",
  done: "to do",
};

const OWNER_META: Record<TaskOwner, { label: string; cls: string }> = {
  client: { label: "You", cls: "bg-orange-soft text-orange" },
  travelgenix: { label: "Travelgenix", cls: "bg-success-soft text-success" },
  both: { label: "Both", cls: "bg-info-soft text-info" },
};

/** Tri-state status circle from the prototype: ring, dashed ring + dot, tick. */
function StatusIcon({ status }: { status: TaskStatus }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      {status === "done" && (
        <>
          <circle cx="11" cy="11" r="10" className="fill-success" />
          <path
            d="M6.5 11.5L9.5 14.5L15.5 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {status === "in-progress" && (
        <>
          <circle
            cx="11"
            cy="11"
            r="10"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className="stroke-info"
          />
          <circle cx="11" cy="11" r="4" className="fill-info" />
        </>
      )}
      {status === "todo" && (
        <circle
          cx="11"
          cy="11"
          r="10"
          strokeWidth="1.5"
          className="stroke-border-strong"
        />
      )}
    </svg>
  );
}

function DueLabel({ task, asOf }: { task: OnboardingTask; asOf: string }) {
  if (task.status === "done") {
    return <span className="text-[11px] text-fg-faint">Completed</span>;
  }
  if (!task.dueDate) return null;

  const diff = daysUntil(task.dueDate, asOf);
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-danger">
        <AlertTriangleIcon className="h-3 w-3" />
        Overdue
      </span>
    );
  }
  if (diff <= 1) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning">
        <ClockIcon className="h-3 w-3" />
        Due {diff === 0 ? "today" : "tomorrow"}
      </span>
    );
  }
  return (
    <span className="text-[11px] text-fg-faint">
      {formatShortDate(task.dueDate)} ({diff} days)
    </span>
  );
}

/**
 * The phase checklist. Client-owned (and shared) tasks cycle through
 * to do → in progress → done on tap, per the prototype; Travelgenix-owned
 * tasks are read-only — we do those, the client just sees the progress.
 */
export function Checklist({ tasks, asOf, onCycle }: ChecklistProps) {
  if (tasks.length === 0) return null;

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => {
        const done = task.status === "done";
        const interactive = task.owner !== "travelgenix";
        const owner = OWNER_META[task.owner];

        return (
          <li
            key={task.id}
            className={`flex items-start gap-3 py-3 transition-opacity ${
              done ? "opacity-60" : ""
            }`}
          >
            {interactive ? (
              <button
                type="button"
                onClick={() => onCycle(task.id)}
                aria-label={`${task.title}: mark as ${NEXT_STATUS[task.status]}`}
                className="press -m-2.5 shrink-0 cursor-pointer p-2.5"
              >
                <StatusIcon status={task.status} />
              </button>
            ) : (
              <span className="shrink-0 py-px" title="Travelgenix is on this one">
                <StatusIcon status={task.status} />
              </span>
            )}

            <span className="min-w-0 pt-0.5">
              <span className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    done ? "text-fg-faint line-through" : "text-fg"
                  }`}
                >
                  {task.title}
                </span>
                {task.optional && (
                  <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-[10px] font-medium text-fg-muted">
                    Optional
                  </span>
                )}
              </span>
              {task.description && !done && (
                <span className="mt-0.5 block text-[13px] leading-relaxed text-fg-muted">
                  {task.description}
                </span>
              )}
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${owner.cls}`}
                >
                  {owner.label}
                </span>
                <DueLabel task={task} asOf={asOf} />
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
