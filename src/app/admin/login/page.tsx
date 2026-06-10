import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Staff sign-in · Travelgenix onboarding",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-5">
      <div className="anim-fade-up w-full max-w-sm rounded-card border border-border bg-surface p-7 shadow-card">
        <p className="text-lg font-extrabold lowercase tracking-tight text-fg">
          travelgenix
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-fg-faint">
          Onboarding dashboard
        </p>
        <p className="mt-4 text-sm leading-relaxed text-fg-muted">
          This area is for the Travelgenix team. Sign in with the staff
          passcode.
        </p>
        <div className="mt-5">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
