"use client";

/**
 * SuggestInput — a free-text field with a <datalist> of suggestions.
 * Users can pick a known option OR type a brand-new value (e.g. a make or
 * city not in the seed list). New values are accepted and posted as-is.
 */

import { useId } from "react";
import { titleCase } from "@/lib/format";

export default function SuggestInput({
  name,
  label,
  options = [],
  required = false,
  placeholder = "Type or pick…",
  defaultValue = "",
}) {
  const listId = useId();
  // Dedupe (case-insensitive) and present nicely.
  const seen = new Set();
  const items = [];
  for (const o of options) {
    const v = String(o || "").trim();
    const key = v.toLowerCase();
    if (!v || seen.has(key)) continue;
    seen.add(key);
    items.push(v);
  }

  return (
    <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
      {label}
      {required ? <span className="text-[var(--hw-red)]" aria-hidden="true"> *</span> : null}
      <input
        name={name}
        list={listId}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
      />
      <datalist id={listId}>
        {items.map((v) => (
          <option key={v} value={titleCase(v)} />
        ))}
      </datalist>
    </label>
  );
}
