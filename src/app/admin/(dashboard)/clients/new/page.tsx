import type { Metadata } from "next";
import Link from "next/link";
import { AddClientForm } from "@/components/admin/AddClientForm";

export const metadata: Metadata = {
  title: "Add client · Travelgenix onboarding",
  robots: { index: false, follow: false },
};

export default function AddClientPage() {
  return (
    <div className="anim-fade-up mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="text-[12px] font-medium text-fg-muted transition-colors hover:text-fg"
      >
        ← Back to overview
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-fg">
        Add a client
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
        Creates their record and stamps out their six-phase journey — tailored
        to the contract type and package you choose — with due dates paced from
        the start date. Once created, issue their portal access code from the
        Portal access card on their client page.
      </p>

      <div className="mt-6 rounded-card border border-border bg-surface p-5 shadow-soft sm:p-6">
        <AddClientForm />
      </div>
    </div>
  );
}
