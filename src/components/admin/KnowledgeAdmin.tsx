"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/icons";
import type { AdminKbArticle } from "@/lib/onboarding/airtable";

const CATEGORIES = [
  "Getting set up",
  "Building your site",
  "Training",
  "Suppliers",
  "Going live",
  "General",
];

const inputClasses =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-[14px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15";

interface KbFormState {
  title: string;
  category: string;
  keywords: string;
  body: string;
}

function emptyForm(): KbFormState {
  return { title: "", category: "Getting set up", keywords: "", body: "" };
}

function KbFields({
  form,
  onChange,
}: {
  form: KbFormState;
  onChange: (form: KbFormState) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="block text-[12px] font-medium text-fg">
          Question / title<span aria-hidden className="text-danger"> *</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
            required
            maxLength={120}
            placeholder="e.g. How long does onboarding take?"
            className={`mt-1 ${inputClasses}`}
          />
        </label>
        <label className="block text-[12px] font-medium text-fg">
          Category
          <select
            value={form.category}
            onChange={(event) => onChange({ ...form, category: event.target.value })}
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

      <label className="block text-[12px] font-medium text-fg">
        Trigger words (comma separated — what clients might type)
        <input
          type="text"
          value={form.keywords}
          onChange={(event) => onChange({ ...form, keywords: event.target.value })}
          maxLength={300}
          placeholder="e.g. how long, timeline, weeks, launch date"
          className={`mt-1 ${inputClasses}`}
        />
      </label>

      <label className="block text-[12px] font-medium text-fg">
        Luna&apos;s answer<span aria-hidden className="text-danger"> *</span>
        <textarea
          value={form.body}
          onChange={(event) => onChange({ ...form, body: event.target.value })}
          required
          maxLength={1500}
          rows={4}
          placeholder="Written exactly as the client should read it. Warm and plain."
          className={`mt-1 resize-y py-2 ${inputClasses} h-auto`}
        />
      </label>
    </div>
  );
}

/**
 * Curate what Luna is allowed to say. Each article is a question, the
 * trigger words that match it, and the answer in Travelgenix voice.
 * Toggle pauses an article without losing it; delete asks twice.
 */
export function KnowledgeAdmin({ initial }: { initial: AdminKbArticle[] }) {
  const [articles, setArticles] = useState(initial);
  const [addForm, setAddForm] = useState<KbFormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<KbFormState>(emptyForm());
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function payload(form: KbFormState) {
    return {
      title: form.title.trim(),
      category: form.category,
      keywords: form.keywords.trim(),
      body: form.body.trim(),
    };
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!addForm.title.trim() || !addForm.body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(addForm)),
      });
      if (!response.ok) throw new Error(String(response.status));
      window.location.reload();
    } catch {
      setError("That didn’t save. Try again in a moment.");
      setBusy(false);
    }
  }

  async function saveEdit(articleId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, ...payload(editForm) }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setArticles((prev) =>
        prev.map((item) =>
          item.id === articleId ? { ...item, ...payload(editForm) } : item,
        ),
      );
      setEditingId(null);
    } catch {
      setError("That didn’t save. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(article: AdminKbArticle) {
    const next = !article.active;
    setArticles((prev) =>
      prev.map((item) =>
        item.id === article.id ? { ...item, active: next } : item,
      ),
    );
    setError(null);
    fetch("/api/admin/knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId: article.id, active: next }),
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
      })
      .catch(() => {
        setArticles((prev) =>
          prev.map((item) =>
            item.id === article.id ? { ...item, active: !next } : item,
          ),
        );
        setError("That change didn’t save. Try again in a moment.");
      });
  }

  async function remove(articleId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/knowledge", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setArticles((prev) => prev.filter((item) => item.id !== articleId));
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
        <p className="text-[13px] font-bold text-fg">Add an article</p>
        <div className="mt-3">
          <KbFields form={addForm} onChange={setAddForm} />
        </div>
        <div className="mt-3 flex items-center justify-end gap-3">
          {error && (
            <p aria-live="polite" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !addForm.title.trim() || !addForm.body.trim()}
            className="press h-10 cursor-pointer rounded-md bg-accent px-5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-default disabled:opacity-60"
          >
            {busy ? "Saving..." : "Add article"}
          </button>
        </div>
      </form>

      {CATEGORIES.map((category) => {
        const inCategory = articles.filter((item) => item.category === category);
        if (inCategory.length === 0) return null;
        return (
          <section key={category}>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-[13px] font-bold text-fg">{category}</h2>
              <span className="text-[11px] text-fg-faint">
                {inCategory.filter((item) => item.active).length} of{" "}
                {inCategory.length} live
              </span>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-soft">
              {inCategory.map((article) => {
                const isEditing = editingId === article.id;
                const isConfirmingDelete = confirmingDeleteId === article.id;
                return (
                  <li key={article.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] ${
                            article.active
                              ? "font-semibold text-fg"
                              : "text-fg-faint line-through"
                          }`}
                        >
                          {article.title}
                        </p>
                        {!isEditing && (
                          <>
                            <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">
                              {article.body}
                            </p>
                            {article.keywords && (
                              <p className="mt-1 truncate text-[10px] text-fg-faint">
                                Triggers: {article.keywords}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(article.id);
                              setEditForm({
                                title: article.title,
                                category: article.category,
                                keywords: article.keywords,
                                body: article.body,
                              });
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
                              onClick={() => remove(article.id)}
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
                            onClick={() => setConfirmingDeleteId(article.id)}
                            aria-label={`Delete ${article.title}`}
                            className="press flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-fg-faint transition-colors hover:bg-danger-soft hover:text-danger"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={article.active}
                          onClick={() => toggle(article)}
                          aria-label={`${article.active ? "Pause" : "Activate"} ${article.title}`}
                          className={`press relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                            article.active ? "bg-accent" : "bg-border-strong"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] ${
                              article.active ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-3 rounded-md border border-border bg-surface-2/60 p-3">
                        <KbFields form={editForm} onChange={setEditForm} />
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
                            onClick={() => saveEdit(article.id)}
                            disabled={
                              busy ||
                              !editForm.title.trim() ||
                              !editForm.body.trim()
                            }
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
