import { ProgressBar } from "@/components/ProgressBar";
import { ArrowRightIcon } from "@/components/icons";
import type { ProgressStats } from "@/lib/onboarding/progress";

interface WelcomeHeroProps {
  contactName: string;
  company: string;
  overall: ProgressStats;
  phasesComplete: number;
  phaseCount: number;
  currentPhaseTitle?: string;
  currentPhaseHref?: string;
}

export function WelcomeHero({
  contactName,
  company,
  overall,
  phasesComplete,
  phaseCount,
  currentPhaseTitle,
  currentPhaseHref,
}: WelcomeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.4rem] bg-brand-gradient p-7 text-white shadow-card sm:p-10">
      {/* soft decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal/20 blur-3xl"
      />
      <div className="relative">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-teal">
          Your onboarding
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome, {contactName}.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/75">
          We’re getting {company} ready to launch — one clear step at a time.
          Here’s exactly where you are and what’s next.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="max-w-md">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-white/70">Overall progress</span>
              <span className="text-sm font-semibold text-white">
                {overall.pct}%
              </span>
            </div>
            <ProgressBar
              value={overall.pct}
              tone="onDark"
              label="Overall onboarding progress"
              className="mt-2"
            />
            <p className="mt-2.5 text-sm text-white/70">
              {phasesComplete} of {phaseCount} phases complete
            </p>
          </div>

          {currentPhaseTitle && currentPhaseHref && (
            <a
              href={currentPhaseHref}
              className="group inline-flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 text-left ring-1 ring-inset ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              <span>
                <span className="block text-xs text-white/60">Pick up where you left off</span>
                <span className="block text-sm font-semibold text-white">
                  {currentPhaseTitle}
                </span>
              </span>
              <ArrowRightIcon className="h-5 w-5 text-teal transition-transform group-hover:translate-x-0.5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
