import { CheckIcon, LockIcon } from "@/components/icons";
import type { ConfidenceGate as ConfidenceGateData } from "@/lib/onboarding/types";

interface ConfidenceGateProps {
  gate: ConfidenceGateData;
  value: number | null;
  onChange: (rating: number) => void;
}

/**
 * The anti-wilting gate. Go-live stays locked until the client self-rates their
 * confidence at or above the threshold — so nobody launches feeling shaky.
 */
export function ConfidenceGate({ gate, value, onChange }: ConfidenceGateProps) {
  const ratings = Array.from({ length: 10 }, (_, i) => i + 1);
  const passed = value !== null && value >= gate.minRating;

  return (
    <section
      aria-label="Confidence check before go-live"
      className={`rounded-card border p-5 shadow-soft transition-colors sm:p-6 ${
        passed
          ? "border-success/40 bg-success-soft"
          : "border-accent/30 bg-accent-soft/60"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            passed ? "bg-success text-white" : "bg-accent text-accent-contrast"
          }`}
        >
          {passed ? <CheckIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
            Confidence check
          </p>
          <p className="text-[15px] font-semibold text-fg">Before you go live</p>
        </div>
      </div>

      <p className="mt-4 text-[15px] font-medium text-fg">{gate.prompt}</p>

      <div className="mt-4">
        <div className="flex flex-wrap gap-1.5">
          {ratings.map((rating) => {
            const selected = value === rating;
            return (
              <button
                key={rating}
                type="button"
                onClick={() => onChange(rating)}
                aria-pressed={selected}
                aria-label={`${rating} out of 10`}
                className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-colors ${
                  selected
                    ? "border-transparent bg-brand-gradient text-white shadow-soft"
                    : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
                }`}
              >
                {rating}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-fg-faint">
          <span>Not yet</span>
          <span>Completely confident</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-surface/70 p-3 text-[13px] leading-relaxed">
        {value === null ? (
          <p className="text-fg-muted">
            Choose a number to unlock go-live. We gate this on a {gate.minRating}/10
            or higher — on purpose.
          </p>
        ) : passed ? (
          <p className="font-medium text-success">
            You’re ready — go-live is unlocked. We’ll launch when you are.
          </p>
        ) : (
          <p className="text-fg-muted">
            Thanks for being honest. You’re at {value}/10, and we don’t go live
            below {gate.minRating}.{" "}
            {gate.helpText ?? "We'll spend more time together until you're there."}
          </p>
        )}
      </div>
    </section>
  );
}
