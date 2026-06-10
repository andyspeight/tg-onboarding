"use client";

import { useState } from "react";
import type { AdminSupplier, SupplierCategory } from "@/lib/onboarding/health";

const CATEGORIES: SupplierCategory[] = [
  "Package holidays",
  "Accommodation",
  "Flights",
];

const inputClasses =
  "h-11 w-full rounded-md border border-border bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15";

/**
 * Curate the supplier list that drives the intake form's multi-selects.
 * Add a supplier and it appears in the client form; toggle one off to hide
 * it without losing the record. Optimistic, with rollback on failure.
 */
export function SuppliersAdmin({
  initial,
}: {
  initial: AdminSupplier[];
}) {
  const [suppliers, setSuppliers] = useState(initial);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SupplierCategory>("Package holidays");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, category }),
      });
      if (!response.ok) throw new Error(String(response.status));
      // Re-fetch is overkill for one row; reload picks up the new record id.
      window.location.reload();
    } catch {
      setError("That didn’t save. Try again in a moment.");
      setBusy(false);
    }
  }

  function toggle(supplier: AdminSupplier) {
    const next = !supplier.active;
    setSuppliers((prev) =>
      prev.map((item) =>
        item.id === supplier.id ? { ...item, active: next } : item,
      ),
    );
    setError(null);
    fetch("/api/admin/suppliers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: supplier.id, active: next }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
      })
      .catch(() => {
        setSuppliers((prev) =>
          prev.map((item) =>
            item.id === supplier.id ? { ...item, active: !next } : item,
          ),
        );
        setError("That change didn’t save. Try again in a moment.");
      });
  }

  return (
    <div className="space-y-7">
      <form
        onSubmit={add}
        className="rounded-card border border-border bg-surface p-5 shadow-soft"
      >
        <p className="text-[13px] font-bold text-fg">Add a supplier</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            placeholder="Supplier name"
            aria-label="Supplier name"
            className={inputClasses}
          />
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as SupplierCategory)
            }
            aria-label="Category"
            className={`cursor-pointer sm:w-44 ${inputClasses}`}
          >
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy || name.trim().length === 0}
            className="press h-11 cursor-pointer rounded-md bg-accent px-5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {busy ? "Adding..." : "Add"}
          </button>
        </div>
        {error && (
          <p aria-live="polite" className="mt-2 text-[13px] font-medium text-danger">
            {error}
          </p>
        )}
      </form>

      {CATEGORIES.map((cat) => {
        const inCategory = suppliers.filter((item) => item.category === cat);
        if (inCategory.length === 0) return null;
        const activeCount = inCategory.filter((item) => item.active).length;
        return (
          <section key={cat}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-[13px] font-bold text-fg">{cat}</h2>
              <span className="text-[11px] text-fg-faint">
                {activeCount} of {inCategory.length} shown to clients
              </span>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              {inCategory.map((supplier) => (
                <li
                  key={supplier.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span
                    className={`text-[13px] ${
                      supplier.active
                        ? "font-medium text-fg"
                        : "text-fg-faint line-through"
                    }`}
                  >
                    {supplier.name}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={supplier.active}
                    onClick={() => toggle(supplier)}
                    aria-label={`${supplier.active ? "Hide" : "Show"} ${supplier.name}`}
                    className={`press relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                      supplier.active ? "bg-accent" : "bg-border-strong"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] ${
                        supplier.active ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
