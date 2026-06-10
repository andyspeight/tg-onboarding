"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/team-tasks", label: "Team tasks" },
];

/** Top strip of the internal dashboard, per the prototype's admin header. */
export function AdminHeader() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
    window.location.assign("/admin/login");
  }

  return (
    <header className="bg-brand-gradient text-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <div>
          <p className="text-[17px] font-extrabold lowercase tracking-tight">
            travelgenix
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
            Onboarding dashboard
          </p>
        </div>

        <nav aria-label="Dashboard sections" className="flex items-center gap-1">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-white/15 font-semibold text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white/90"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="press cursor-pointer rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
