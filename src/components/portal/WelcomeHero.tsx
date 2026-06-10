"use client";

import { useSyncExternalStore } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import type { ProgressStats } from "@/lib/onboarding/progress";

const emptySubscribe = () => () => {};

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface WelcomeHeroProps {
  contactName: string;
  company: string;
  plan?: string;
  accountManager?: string;
  overall: ProgressStats;
  phasesComplete: number;
  phaseCount: number;
}

/**
 * The welcome landing: time-aware greeting and the headline progress readout,
 * sitting directly on the page like the approved prototype (no hero card).
 */
export function WelcomeHero({
  contactName,
  company,
  plan,
  accountManager,
  overall,
  phasesComplete,
  phaseCount,
}: WelcomeHeroProps) {
  const firstName = contactName.split(" ")[0];

  // Time-of-day greeting comes from the visitor's clock; the server renders a
  // neutral fallback so hydration stays clean.
  const greeting = useSyncExternalStore(
    emptySubscribe,
    timeGreeting,
    () => "Welcome back",
  );

  return (
    <section className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        {greeting}, {firstName}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        Here’s where things stand with your{" "}
        <strong className="font-semibold text-fg">{company}</strong> setup.
      </p>
      {(plan || accountManager) && (
        <p className="mt-1 text-[13px] text-fg-faint lg:hidden">
          {[plan && `${plan} package`, accountManager && `Looked after by ${accountManager}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13px] font-medium text-fg-muted">
            Overall progress
          </span>
          <span className="text-[28px] font-extrabold tracking-tight text-accent tabular-nums">
            {overall.pct}%
          </span>
        </div>
        <ProgressBar
          value={overall.pct}
          label="Overall onboarding progress"
          className="mt-1.5"
        />
        <p className="mt-2 text-[13px] text-fg-muted">
          {phasesComplete} of {phaseCount} phases complete
        </p>
      </div>
    </section>
  );
}
