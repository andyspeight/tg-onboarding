"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { ProgressBar } from "@/components/ProgressBar";
import type { IntakeField, IntakeSection } from "@/lib/onboarding/types";
import type { UploadedFile } from "@/lib/onboarding/uploads";
import { MultiSelect } from "./MultiSelect";
import { UploadField } from "./UploadField";

const inputClasses =
  "w-full rounded-md border border-border bg-surface px-3.5 text-[15px] text-fg placeholder:text-fg-faint transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15";

function Field({
  field,
  value,
  selections,
  files,
  onChange,
  onSelectionsChange,
  onFilesChange,
}: {
  field: IntakeField;
  value: string;
  selections: string[];
  files: UploadedFile[];
  onChange: (value: string) => void;
  onSelectionsChange: (selections: string[]) => void;
  onFilesChange: (files: UploadedFile[]) => void;
}) {
  return (
    <div>
      <label
        htmlFor={field.id}
        className="mb-1.5 block text-[13px] font-medium text-fg"
      >
        {field.label}
        {field.required && (
          <span aria-hidden className="text-danger">
            {" "}
            *
          </span>
        )}
      </label>
      {field.helper && (
        <p className="-mt-0.5 mb-1.5 text-[12px] text-fg-faint">
          {field.helper}
        </p>
      )}

      {field.type === "text" && (
        <input
          id={field.id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          maxLength={200}
          className={`h-11 ${inputClasses}`}
        />
      )}
      {field.type === "textarea" && (
        <textarea
          id={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          maxLength={2000}
          rows={3}
          className={`resize-y py-2.5 ${inputClasses}`}
        />
      )}
      {field.type === "select" && (
        <select
          id={field.id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={field.required}
          className={`h-11 cursor-pointer ${inputClasses}`}
        >
          <option value="">Select...</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
      {field.type === "multiselect" && (
        <MultiSelect
          id={field.id}
          options={field.options ?? []}
          selected={selections}
          onChange={onSelectionsChange}
          placeholder={field.placeholder}
        />
      )}
      {field.type === "upload" && (
        <UploadField id={field.id} files={files} onChange={onFilesChange} />
      )}
    </div>
  );
}

/**
 * The smart intake form from the prototype: accordion sections, save and
 * continue, per-section completion. Sections are already filtered to the
 * client's package tier server-side. Required fields use native validation,
 * so the browser flags and focuses the first gap on save. Responses live in
 * memory for Phase 1 — persistence arrives with the Airtable swap.
 */
export function IntakeForm({
  sections,
  className = "",
}: {
  sections: IntakeSection[];
  className?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [files, setFiles] = useState<Record<string, UploadedFile[]>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(
    sections[0]?.id ?? null,
  );

  const savedCount = sections.filter((section) => saved[section.id]).length;
  const allSaved = savedCount === sections.length;
  const pct =
    sections.length === 0 ? 0 : Math.round((savedCount / sections.length) * 100);

  function saveSection(sectionId: string) {
    setSaved((prev) => ({ ...prev, [sectionId]: true }));
    const index = sections.findIndex((section) => section.id === sectionId);
    const next = sections
      .slice(index + 1)
      .find((section) => !saved[section.id]);
    setExpandedId(next?.id ?? null);
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between text-xs text-fg-muted">
        <span>
          {savedCount} of {sections.length} sections complete
        </span>
        <span className="font-semibold text-accent tabular-nums">{pct}%</span>
      </div>
      <ProgressBar
        value={pct}
        size="sm"
        label="Form completion"
        className="mt-1.5"
      />

      <div className="mt-5 space-y-2.5">
        {sections.map((section, index) => {
          const isExpanded = expandedId === section.id;
          const isSaved = Boolean(saved[section.id]);
          const panelId = `intake-panel-${section.id}`;

          return (
            <section
              key={section.id}
              className="anim-fade-up overflow-hidden rounded-card border border-border bg-surface shadow-soft"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId((current) =>
                    current === section.id ? null : section.id,
                  )
                }
                aria-expanded={isExpanded}
                aria-controls={panelId}
                className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors sm:px-5 ${
                  isSaved ? "bg-success-soft" : "hover:bg-surface-2"
                }`}
              >
                <span
                  className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isSaved
                      ? "bg-success text-white"
                      : "bg-bg-subtle text-fg-muted"
                  }`}
                >
                  {isSaved ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">
                    {section.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-fg-muted">
                    {section.description}
                  </span>
                </span>
                <ChevronDownIcon
                  className={`h-5 w-5 shrink-0 text-fg-faint transition-transform ${
                    isExpanded ? "" : "-rotate-90"
                  }`}
                />
              </button>

              {isExpanded && (
                <form
                  id={panelId}
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveSection(section.id);
                  }}
                  className="space-y-4 border-t border-border px-4 pb-5 pt-4 sm:px-5"
                >
                  {section.fields.map((field) => (
                    <Field
                      key={field.id}
                      field={field}
                      value={values[field.id] ?? ""}
                      selections={selections[field.id] ?? []}
                      files={files[field.id] ?? []}
                      onChange={(value) =>
                        setValues((prev) => ({ ...prev, [field.id]: value }))
                      }
                      onSelectionsChange={(next) =>
                        setSelections((prev) => ({ ...prev, [field.id]: next }))
                      }
                      onFilesChange={(next) =>
                        setFiles((prev) => ({ ...prev, [field.id]: next }))
                      }
                    />
                  ))}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="press h-10 cursor-pointer rounded-md bg-accent px-6 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
                    >
                      {isSaved ? "Update" : "Save & continue"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          );
        })}
      </div>

      {allSaved && sections.length > 0 && (
        <div className="anim-pop mt-5 rounded-card border border-success-border bg-success-soft p-7 text-center">
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-success text-white">
            <CheckIcon className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[15px] font-bold text-success">
            All details submitted
          </p>
          <p className="mt-1 text-[13px] text-fg-muted">
            Thanks! You can come back and update any section whenever you like.
          </p>
        </div>
      )}
    </div>
  );
}
