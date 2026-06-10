import { CheckIcon } from "@/components/icons";
import type { PortalSupplier } from "@/lib/onboarding/types";

/**
 * One supplier as the client sees it: name, short description, feature
 * pills and link buttons. With `onToggle` it becomes selectable (the intake
 * picker); without, it's a plain directory card. Links open in a new tab
 * and never inherit our session (noopener noreferrer).
 */
export function SupplierCard({
  supplier,
  selected,
  onToggle,
}: {
  supplier: PortalSupplier;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const selectable = Boolean(onToggle);

  return (
    <article
      className={`rounded-card border bg-surface p-4 shadow-soft transition-colors ${
        selected
          ? "border-accent/50 ring-1 ring-accent/25"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={selected}
            aria-label={`${selected ? "Remove" : "Add"} ${supplier.name}`}
            className={`press mt-0.5 flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors ${
              selected
                ? "border-accent bg-accent text-accent-contrast"
                : "border-border-strong bg-surface text-transparent hover:border-accent"
            }`}
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{supplier.name}</p>
          {supplier.description && (
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
              {supplier.description}
            </p>
          )}

          {supplier.features.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {supplier.features.map((feature) => (
                <li
                  key={feature}
                  className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent"
                >
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {supplier.links.length > 0 && (
            <p className="mt-3 flex flex-wrap gap-2">
              {supplier.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex h-8 items-center rounded-md border border-border px-3 text-[12px] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  {link.label}
                </a>
              ))}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
