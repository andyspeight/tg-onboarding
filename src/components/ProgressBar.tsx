/**
 * Accessible progress bar. `size="lg"` is the headline journey bar (10px,
 * prototype gradient); `size="sm"` is the mini per-phase bar (3px). The fill
 * turns solid green at 100%, matching the prototype.
 */
interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  size?: "lg" | "sm";
  className?: string;
}

export function ProgressBar({
  value,
  label,
  size = "lg",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const complete = clamped === 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={`w-full overflow-hidden rounded-full bg-bg-subtle ${
        size === "lg" ? "h-2.5" : "h-[3px]"
      } ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-in-out ${
          complete ? "bg-success" : "bg-progress-gradient"
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
