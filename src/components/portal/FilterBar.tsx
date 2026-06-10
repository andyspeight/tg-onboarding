export type TaskFilter = "all" | "client" | "travelgenix";

const FILTERS: { id: TaskFilter; label: string }[] = [
  { id: "all", label: "All tasks" },
  { id: "client", label: "Your tasks" },
  { id: "travelgenix", label: "Our tasks" },
];

/** Pill filter from the prototype: whose tasks are showing in the journey. */
export function FilterBar({
  filter,
  onChange,
}: {
  filter: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}) {
  return (
    <div role="group" aria-label="Filter tasks by owner" className="flex gap-1.5">
      {FILTERS.map(({ id, label }) => {
        const active = filter === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`press h-9 rounded-full border px-4 text-[13px] font-medium transition-colors ${
              active
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
