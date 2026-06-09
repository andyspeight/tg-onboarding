import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Top bar for the client portal. Travelgenix wordmark on the left, theme
 * toggle on the right. Deliberately light — this is a calm, client-facing
 * surface, not an app chrome packed with controls.
 */
export function Header({ specialistName }: { specialistName?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Travelgenix home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white">
            t
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-fg">
            Travel<span className="text-accent">genix</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {specialistName && (
            <span className="hidden text-sm text-fg-muted sm:inline">
              Looked after by{" "}
              <span className="font-medium text-fg">{specialistName}</span>
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
