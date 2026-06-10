import type { WorkloadStats } from "@/lib/onboarding/progress";

/**
 * The three at-a-glance numbers from the prototype: what's on the client,
 * what's on us, and anything slipping. Whose-work-is-whose is the heart of the
 * anti-wilting design, so it gets headline treatment.
 */
export function QuickStats({ stats }: { stats: WorkloadStats }) {
  const cards = [
    { label: "Your tasks remaining", value: stats.mine, cls: "text-orange" },
    { label: "Our tasks remaining", value: stats.theirs, cls: "text-success" },
    {
      label: "Overdue",
      value: stats.overdue,
      cls: stats.overdue > 0 ? "text-danger" : "text-fg-faint",
    },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2.5">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="anim-fade-up hover-lift rounded-card border border-border bg-surface px-2 py-3.5 text-center shadow-soft"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <dd
            className={`text-[28px] font-extrabold leading-none tracking-tight tabular-nums ${card.cls}`}
          >
            {card.value}
          </dd>
          <dt className="mt-1.5 text-[11px] font-medium leading-tight text-fg-muted">
            {card.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
