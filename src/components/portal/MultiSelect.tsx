"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, XIcon } from "@/components/icons";

/**
 * Dependency-free multi-select: an input-styled trigger opening a checkbox
 * panel, with selections shown as removable chips underneath. Options come
 * from central lists in the data layer (Airtable-curated after the swap).
 * Long lists get an inline filter.
 */
export function MultiSelect({
  id,
  options,
  selected,
  onChange,
  placeholder = "Select...",
}: {
  id: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleOption(option: string) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  }

  const filtered = query
    ? options.filter((option) =>
        option.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-border bg-surface px-3.5 text-left text-[15px] transition-[border-color,box-shadow] focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15"
      >
        <span className={selected.length > 0 ? "text-fg" : "text-fg-faint"}>
          {selected.length > 0
            ? `${selected.length} selected`
            : placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-fg-faint transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="anim-pop absolute left-0 right-0 top-12 z-30 origin-top overflow-hidden rounded-card border border-border bg-surface shadow-float">
          {options.length > 8 && (
            <div className="border-b border-border p-2">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type to filter..."
                aria-label="Filter options"
                className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-faint focus:border-accent-bright focus:outline-none focus:ring-[3px] focus:ring-accent-bright/15"
              />
            </div>
          )}
          <ul className="max-h-56 overflow-y-auto p-1" role="listbox" aria-multiselectable>
            {filtered.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <li key={option} role="option" aria-selected={isSelected}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-fg transition-colors hover:bg-surface-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(option)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-bright ${
                        isSelected
                          ? "border-accent bg-accent text-accent-contrast"
                          : "border-border-strong bg-surface text-transparent"
                      }`}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {option}
                  </label>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-2.5 py-3 text-center text-[13px] text-fg-muted">
                Nothing matches. Add it under “Anyone we’ve missed?”
              </li>
            )}
          </ul>
        </div>
      )}

      {selected.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((option) => (
            <li key={option}>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-2.5 pr-1 text-[12px] font-medium text-accent">
                {option}
                <button
                  type="button"
                  onClick={() => toggleOption(option)}
                  aria-label={`Remove ${option}`}
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-accent/10"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
