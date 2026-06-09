"use client";

import { useEffect, useRef, useState } from "react";
import { SparkleIcon } from "./icons";

/**
 * Luna contextual-help entry point. Stubbed for Phase 1 — clicking opens a
 * small panel explaining Luna is coming. The seam (props, panel, state) is
 * here so wiring in the real `askLuna` later is a contained change.
 */
export function LunaButton() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-7 sm:right-7"
    >
      {open && (
        <div
          role="dialog"
          aria-label="Ask Luna"
          className="w-[18rem] origin-bottom-right rounded-2xl border border-border bg-surface p-4 shadow-card sm:w-80"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
              <SparkleIcon className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-fg">Ask Luna</p>
            <span className="ml-auto rounded-full bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted">
              Coming soon
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            Luna is your in-product guide — soon you’ll be able to ask a question
            right here and get an answer that knows exactly where you are in your
            onboarding. Until then, your specialist is a message away.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="group inline-flex items-center gap-2 rounded-full bg-brand-gradient py-3 pl-3.5 pr-4 text-sm font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5"
      >
        <SparkleIcon className="h-[18px] w-[18px] text-teal" />
        Ask Luna
      </button>
    </div>
  );
}
