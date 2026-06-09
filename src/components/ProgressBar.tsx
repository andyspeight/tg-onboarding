/**
 * Accessible progress bar. Used for the headline journey progress and for
 * per-phase progress. `tone="onDark"` adapts it for the navy hero.
 */
interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  tone?: "default" | "onDark";
  className?: string;
}

export function ProgressBar({
  value,
  label,
  tone = "default",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const onDark = tone === "onDark";

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={`h-2.5 w-full overflow-hidden rounded-full ${
        onDark ? "bg-white/15" : "bg-bg-subtle"
      } ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${
          onDark
            ? "bg-gradient-to-r from-teal to-[var(--tg-teal-300)]"
            : "bg-gradient-to-r from-[var(--tg-teal-600)] to-teal"
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
