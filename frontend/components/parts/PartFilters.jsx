"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/Context/LanguageContext";
import { CITIES, CONDITIONS } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import {
  PART_CATEGORIES,
  PART_SUBCATEGORY_GROUPS,
  PART_TYPES,
  WARRANTY_OPTIONS,
} from "@/lib/parts";
import MicButton from "@/components/ui/MicButton";

const FILTER_KEYS = ["category", "subcategory", "condition", "partType", "warranty", "city"];

const controlClass =
  "h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]";

/**
 * PartFilters — search bar first, filters on demand.
 *
 * Six always-open dropdowns filled an entire phone screen before a single
 * part showed up. Below `lg` only the search field and an "Apply filters"
 * disclosure are visible; desktop keeps the full inline grid.
 *
 * Still a plain GET form, so submitting reloads the page with the fields as
 * query params exactly as before — no client-side fetching involved.
 */
export default function PartFilters({ params = {} }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const activeCount = FILTER_KEYS.filter((key) => params[key]).length;
  const formRef = useRef(null);
  const inputRef = useRef(null);

  return (
    <form ref={formRef} className="mb-4 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 sm:mb-5 sm:p-4">
      {/* Search row — always visible */}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            ref={inputRef}
            name="q"
            defaultValue={params.q || ""}
            className="h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 pe-12 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
            placeholder={t("part.searchPlaceholder")}
          />
          <MicButton
            variant="sphere"
            size="sm"
            className="absolute inset-y-0 end-1.5 my-auto"
            onResult={(text) => { if (inputRef.current) inputRef.current.value = text; }}
            onFinal={() => setTimeout(() => formRef.current?.requestSubmit(), 350)}
          />
        </div>
        <button className="h-11 shrink-0 rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
          {t("common.search")}
        </button>
      </div>

      {/* Disclosure — mobile only */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2.5 inline-flex items-center gap-2 text-[13px] font-black text-[var(--hw-text-primary)] lg:hidden"
      >
        <svg className="h-4 w-4 text-[var(--hw-orange)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
        {t("filter.filters")}
        {activeCount ? (
          <span className="rounded-full bg-[var(--hw-orange)] px-1.5 py-0.5 text-[10px] font-black leading-none text-[var(--hw-text-inverse)]">
            {activeCount}
          </span>
        ) : null}
        <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className={`${open ? "mt-3 grid" : "hidden"} gap-2.5 lg:mt-3 lg:grid lg:grid-cols-3 lg:gap-3`}>
        <select name="category" defaultValue={params.category || ""} className={controlClass}>
          <option value="">{t("part.allCategories")}</option>
          {PART_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select name="subcategory" defaultValue={params.subcategory || ""} className={controlClass}>
          <option value="">{t("part.allParts")}</option>
          {PART_SUBCATEGORY_GROUPS.map((group) => (
            <optgroup key={group.category.value} label={group.category.label}>
              {group.subs.map((sub) => <option key={sub.value} value={sub.value}>{sub.label}</option>)}
            </optgroup>
          ))}
        </select>

        <select name="condition" defaultValue={params.condition || ""} className={controlClass}>
          <option value="">{t("part.anyCondition")}</option>
          {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select name="partType" defaultValue={params.partType || ""} className={controlClass}>
          <option value="">{t("part.anyType")}</option>
          {PART_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <select name="warranty" defaultValue={params.warranty || ""} className={controlClass}>
          <option value="">{t("part.anyWarranty")}</option>
          {WARRANTY_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
        </select>

        <select name="city" defaultValue={params.city || ""} className={controlClass}>
          <option value="">{t("part.allCities")}</option>
          {CITIES.map((city) => <option key={city} value={city}>{titleCase(city)}</option>)}
        </select>
      </div>
    </form>
  );
}
