"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/icons";
import type { AdminSupplier, SupplierCategory } from "@/lib/onboarding/health";

const CATEGORIES: SupplierCategory[] = [
  "Package holidays",
  "Accommodation",
  "Flights",
];

const inputClasses =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-[14px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15";

interface SupplierFormState {
  name: string;
  category: SupplierCategory;
  description: string;
  features: string;
  links: { label: string; url: string }[];
}

function emptyForm(): SupplierFormState {
  return {
    name: "",
    category: "Package holidays",
    description: "",
    features: "",
    links: [
      { label: "", url: "" },
      { label: "", url: "" },
      { label: "", url: "" },
    ],
  };
}

function formFromSupplier(supplier: AdminSupplier): SupplierFormState {
  const links = [0, 1, 2].map(
    (index) => supplier.links[index] ?? { label: "", url: "" },
  );
  return {
    name: supplier.name,
    category: supplier.category,
    description: supplier.description,
    features: supplier.features,
    links,
  };
}

function SupplierFields({
  form,
  onChange,
}: {
  form: SupplierFormState;
  onChange: (form: SupplierFormState) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-fg">
            Name<span aria-hidden className="text-danger"> *</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              required
              maxLength={100}
              className={`mt-1 ${inputClasses}`}
            />
          </label>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-fg">
            Category
            <select
              value={form.category}
              onChange={(event) =>
                onChange({
                  ...form,
                  category: event.target.value as SupplierCategory,
                })
              }
              className={`mt-1 cursor-pointer ${inputClasses}`}
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <label className="block text-[12px] font-medium text-fg">
        Short description
        <textarea
          value={form.description}
          onChange={(event) =>
            onChange({ ...form, description: event.target.value })
          }
          maxLength={500}
          rows={2}
          placeholder="One or two sentences the client sees on the card."
          className={`mt-1 resize-y py-2 ${inputClasses} h-auto`}
        />
      </label>

      <label className="block text-[12px] font-medium text-fg">
        Features (comma separated, shown as pills)
        <input
          type="text"
          value={form.features}
          onChange={(event) => onChange({ ...form, features: event.target.value })}
          maxLength={300}
          placeholder="e.g. ATOL protected, Package holidays, Trade support"
          className={`mt-1 ${inputClasses}`}
        />
      </label>

      <fieldset>
        <legend className="text-[12px] font-medium text-fg">
          Links (up to 3, shown as buttons)
        </legend>
        <div className="mt-1 grid gap-2">
          {form.links.map((link, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[180px_1fr]">
              <input
                type="text"
                value={link.label}
                onChange={(event) => {
                  const links = form.links.map((item, i) =>
                    i === index ? { ...item, label: event.target.value } : item,
                  );
                  onChange({ ...form, links });
                }}
                maxLength={40}
                placeholder={`Button ${index + 1} name`}
                aria-label={`Link ${index + 1} button name`}
                className={inputClasses}
              />
              <input
                type="url"
                value={link.url}
                onChange={(event) => {
                  const links = form.links.map((item, i) =>
                    i === index ? { ...item, url: event.target.value } : item,
                  );
                  onChange({ ...form, links });
                }}
                maxLength={300}
                placeholder="https://..."
                aria-label={`Link ${index + 1} URL`}
                className={inputClasses}
              />
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/**
 * Curate the supplier cards clients see: name, description, feature pills
 * and up to three link buttons. Toggle hides without deleting; delete asks
 * twice. Everything lands in the Suppliers table and shows in the portal
 * within a minute.
 */
export function SuppliersAdmin({ initial }: { initial: AdminSupplier[] }) {
  const [suppliers, setSuppliers] = useState(initial);
  const [addForm, setAddForm] = useState<SupplierFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SupplierFormState>(emptyForm());
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function payload(form: SupplierFormState) {
    return {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      features: form.features.trim(),
      links: form.links.filter((link) => link.url.trim() !== ""),
    };
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!addForm.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(addForm)),
      });
      if (!response.ok) throw new Error(String(response.status));
      window.location.reload();
    } catch {
      setError("That didn’t save. Check the links are full URLs and try again.");
      setBusy(false);
    }
  }

  async function saveEdit(supplierId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, ...payload(editForm) }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setSuppliers((prev) =>
        prev.map((item) =>
          item.id === supplierId
            ? {
                ...item,
                ...payload(editForm),
              }
            : item,
        ),
      );
      setEditingId(null);
    } catch {
      setError("That didn’t save. Check the links are full URLs and try again.");
    } finally {
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

  async function remove(supplierId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/suppliers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setSuppliers((prev) => prev.filter((item) => item.id !== supplierId));
      setConfirmingDeleteId(null);
    } catch {
      setError("Delete didn’t go through. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-7">
      <form
        onSubmit={add}
        className="rounded-card border border-border bg-surface p-5 shadow-soft"
      >
        <p className="text-[13px] font-bold text-fg">Add a supplier</p>
        <div className="mt-3">
          <SupplierFields form={addForm} onChange={setAddForm} />
        </div>
        <div className="mt-3 flex items-center justify-end gap-3">
          {error && (
            <p aria-live="polite" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || addForm.name.trim().length === 0}
            className="press h-10 cursor-pointer rounded-md bg-accent px-5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {busy ? "Saving..." : "Add supplier"}
          </button>
        </div>
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
              {inCategory.map((supplier) => {
                const pills = supplier.features
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean);
                const isEditing = editingId === supplier.id;
                const isConfirmingDelete = confirmingDeleteId === supplier.id;

                return (
                  <li key={supplier.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] ${
                            supplier.active
                              ? "font-semibold text-fg"
                              : "text-fg-faint line-through"
                          }`}
                        >
                          {supplier.name}
                        </p>
                        {!isEditing && supplier.description && (
                          <p className="mt-0.5 text-[12px] leading-relaxed text-fg-muted">
                            {supplier.description}
                          </p>
                        )}
                        {!isEditing && (pills.length > 0 || supplier.links.length > 0) && (
                          <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {pills.map((pill) => (
                              <span
                                key={pill}
                                className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent"
                              >
                                {pill}
                              </span>
                            ))}
                            {supplier.links.map((link) => (
                              <span
                                key={link.url}
                                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-fg-faint"
                              >
                                {link.label}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(supplier.id);
                              setEditForm(formFromSupplier(supplier));
                              setConfirmingDeleteId(null);
                            }}
                            className="press cursor-pointer rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                          >
                            Edit
                          </button>
                        )}
                        {isConfirmingDelete ? (
                          <span className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => remove(supplier.id)}
                              disabled={busy}
                              className="press cursor-pointer rounded-md bg-danger px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                            >
                              Yes, delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDeleteId(null)}
                              className="press cursor-pointer rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-fg-muted hover:text-fg"
                            >
                              Keep
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(supplier.id)}
                            aria-label={`Delete ${supplier.name}`}
                            className="press flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-fg-faint transition-colors hover:bg-danger-soft hover:text-danger"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
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
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-3 rounded-md border border-border bg-surface-2/60 p-3">
                        <SupplierFields form={editForm} onChange={setEditForm} />
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="press cursor-pointer rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-fg-muted hover:text-fg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(supplier.id)}
                            disabled={busy || editForm.name.trim().length === 0}
                            className="press cursor-pointer rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:opacity-60"
                          >
                            {busy ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
