import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  ADMIN_COOKIE,
  adminConfigured,
  sessionTokenValid,
} from "@/lib/api/admin-auth";

export const metadata: Metadata = {
  title: "Onboarding dashboard · Travelgenix",
  robots: { index: false, follow: false },
};

// The gate must run per request — never bake an auth decision at build time.
export const dynamic = "force-dynamic";

/**
 * The gated staff shell. Fails closed: no ADMIN_PASSCODE configured means a
 * locked notice, not an open dashboard. Valid session required for entry;
 * Control SSO replaces this gate when it's revived.
 */
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!adminConfigured()) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-5">
        <div className="w-full max-w-sm rounded-card border border-border bg-surface p-7 text-center shadow-card">
          <p className="text-[15px] font-bold text-fg">Dashboard locked</p>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            Staff access isn’t configured yet. Set ADMIN_PASSCODE on the
            Vercel project to open it up.
          </p>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  if (!sessionTokenValid(cookieStore.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh bg-bg">
      <AdminHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-6 pb-8">
        <p className="border-t border-border pt-5 text-center text-xs text-fg-faint">
          Travelgenix onboarding · internal dashboard · interim passcode access
        </p>
      </footer>
    </div>
  );
}
