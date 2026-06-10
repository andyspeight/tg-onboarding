import type { Metadata } from "next";
import { SupplierCard } from "@/components/portal/SupplierCard";
import { getClientJourney } from "@/lib/onboarding/data";

export const metadata: Metadata = {
  title: "Suppliers · Travelgenix onboarding",
};

export default async function SuppliersDirectoryPage() {
  const journey = await getClientJourney();
  const categories = [
    ...new Set(journey.suppliers.map((supplier) => supplier.category)),
  ];

  return (
    <div className="anim-fade-up">
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">
        Suppliers
      </h1>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">
        The suppliers we can connect to your new site, with the essentials on
        each. Pick yours in Your details, and use the links here whenever you
        need them.
      </p>

      <div className="mt-6 space-y-7">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="mb-2.5 text-[13px] font-bold text-fg">{category}</h2>
            <div className="grid gap-2.5 lg:grid-cols-2">
              {journey.suppliers
                .filter((supplier) => supplier.category === category)
                .map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
            </div>
          </section>
        ))}
        {categories.length === 0 && (
          <div className="rounded-card border border-border bg-surface p-8 text-center shadow-soft">
            <p className="text-[15px] font-bold text-fg">
              Suppliers are being lined up
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              They appear here as your team adds them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
