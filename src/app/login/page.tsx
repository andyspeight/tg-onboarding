import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientLoginForm } from "@/components/portal/ClientLoginForm";
import { clientAuthConfigured } from "@/lib/api/client-auth";
import { airtableConfig } from "@/lib/onboarding/airtable";

export const metadata: Metadata = {
  title: "Sign in · Travelgenix onboarding",
  robots: { index: false, follow: false },
};

// Auth state is env + cookie driven — never bake it at build time.
export const dynamic = "force-dynamic";

export default function ClientLoginPage() {
  // Mock mode (no Airtable) and compat mode (no auth secret) have no login
  // step — the portal handles both itself.
  if (!airtableConfig() || !clientAuthConfigured()) redirect("/");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-5">
      <div className="anim-fade-up w-full max-w-sm rounded-card border border-border bg-surface p-7 shadow-card">
        <p className="text-lg font-extrabold lowercase tracking-tight text-fg">
          travelgenix
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-fg-faint">
          Client portal
        </p>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">
          Welcome back. Sign in with your email and the access code from your
          account manager.
        </p>
        <div className="mt-5">
          <ClientLoginForm />
        </div>
      </div>
    </div>
  );
}
