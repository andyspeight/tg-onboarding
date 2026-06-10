import type { Metadata } from "next";
import { SuppliersAdmin } from "@/components/admin/SuppliersAdmin";
import { fetchAdminSuppliers } from "@/lib/onboarding/airtable";

export const metadata: Metadata = {
  title: "Suppliers · Travelgenix onboarding",
  robots: { index: false, follow: false },
};

export default async function SuppliersPage() {
  const suppliers = await fetchAdminSuppliers();

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Suppliers
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
        This list drives the supplier picker in every client’s intake form.
        Add the ones you work with; switch any off to hide them without losing
        the record.
      </p>

      <div className="mt-6">
        {suppliers ? (
          <SuppliersAdmin initial={suppliers} />
        ) : (
          <div className="rounded-card border border-border bg-surface p-8 text-center shadow-soft">
            <p className="text-[15px] font-bold text-fg">No live data yet</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              Connect Airtable on this project and the supplier list appears
              here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
