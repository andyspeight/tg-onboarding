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

/** A short momentum line keyed to how far along the journey is. */
function momentumLine(pct: number): string {
  if (pct < 15) return "You’re off to a flying start.";
  if (pct < 50) return "Great momentum, keep it rolling.";
  if (pct < 80) return "Over halfway. Launch is getting close.";
  return "Nearly there. Launch is in sight.";
}

interface WelcomeHeroProps {
  contactName: string;
  company: string;
  plan?: string;
  accountManager?: string;
  overall: ProgressStats;
  phasesComplete: number;
  phaseCount: number;
  activePhaseTitle?: string;
  activePhaseHref?: string;
}

/**
 * The welcome landing. A new client has just signed and is fired up; this
 * screen's job is to keep that energy. So: a launch-framed headline, a
 * visible "happening now" signal that Travelgenix is already moving, and
 * progress framed as distance to launch rather than admin done.
 */
export function WelcomeHero({
  contactName,
  company,
  plan,
  accountManager,
  overall,
  phasesComplete,
  phaseCount,
  activePhaseTitle,
  activePhaseHref,
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
        Your journey to launch
      </p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-fg">
        {greeting}, {firstName}
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        Your new{" "}
        <strong className="font-semibold text-fg">{company}</strong> site is
        taking shape. This is your plan all the way to launch and beyond.
      </p>
      {(plan || accountManager) && (
        <p className="mt-1 text-[13px] text-fg-faint lg:hidden">
          {[plan && `${plan} package`, accountManager && `Looked after by ${accountManager}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      {activePhaseTitle && activePhaseHref && (
        <a
          href={activePhaseHref}
          className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-accent-soft py-1.5 pl-3 pr-3.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent-soft/70"
        >
          <span aria-hidden className="relative flex h-2 w-2">
            <span
              className="absolute inset-0 rounded-full bg-accent-bright"
              style={{ animation: "tg-ping 1.8s ease-out infinite" }}
            />
            <span className="relative h-2 w-2 rounded-full bg-accent-bright" />
          </span>
          Happening now: {activePhaseTitle}
        </a>
      )}

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[13px] font-medium text-fg-muted">
            Progress to launch
          </span>
          <span className="text-[28px] font-extrabold tracking-tight text-accent tabular-nums">
            {overall.pct}%
          </span>
        </div>
        <ProgressBar
          value={overall.pct}
          label="Progress to launch"
          className="mt-1.5"
        />
        <p className="mt-2 text-[13px] text-fg-muted">
          {phasesComplete} of {phaseCount} phases complete.{" "}
          {momentumLine(overall.pct)}
        </p>
      </div>
    </section>
  );
}
