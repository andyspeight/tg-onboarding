"use client";

import { MoonIcon, SunIcon } from "./icons";

const STORAGE_KEY = "tg-theme";

/**
 * Light/dark toggle. The initial theme is applied before paint by the inline
 * script in `layout.tsx` (no flash). Which icon shows is driven purely by the
 * `.dark` class via CSS, so there's no effect and no hydration mismatch.
 */
export function ThemeToggle() {
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      <MoonIcon className="h-[18px] w-[18px] dark:hidden" />
      <SunIcon className="hidden h-[18px] w-[18px] dark:inline" />
    </button>
  );
}
