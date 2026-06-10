"use client";

import { MoonIcon, SunIcon } from "./icons";

const STORAGE_KEY = "tg-theme";

/**
 * Light/dark toggle. The initial theme is applied before paint by the inline
 * script in `layout.tsx` (no flash). Which icon shows is driven purely by the
 * `.dark` class via CSS, so there's no effect and no hydration mismatch.
 * `tone="onDark"` restyles it for the teal sidebar.
 */
export function ThemeToggle({ tone = "default" }: { tone?: "default" | "onDark" }) {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      /* storage may be unavailable; theme still applies for the session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      className={`press inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
        tone === "onDark"
          ? "text-white/70 hover:bg-white/10 hover:text-white"
          : "border border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg"
      }`}
    >
      <MoonIcon className="h-[18px] w-[18px] dark:hidden" />
      <SunIcon className="hidden h-[18px] w-[18px] dark:inline" />
    </button>
  );
}
