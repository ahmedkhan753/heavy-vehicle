"use client";

import { useState } from "react";
import { useLanguage } from "@/Context/LanguageContext";
import { CITIES } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { BUSINESS_CATEGORIES, businessCategoryLabel } from "@/lib/businesses";

const FILTER_KEYS = ["category", "city"];

const controlClass =
  "h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]";

/**
 * Search bar first, filters behind a disclosure below `lg` — same pattern as
 * the vehicles and parts pages, so listings are visible without scrolling
 * past a stack of dropdowns on a phone.
 *
 * Plain GET form: submitting reloads with the fields as query params.
 */
export default function BusinessFilters({ params = {}, lang = "en" }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const activeCount = FILTER_KEYS.filter((k) => params[k]).length;

  return (
    <form className="mb-4 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 sm:mb-5 sm:p-4">
      <div className="flex gap-2">
        <input
          name="q"
          defaultValue={params.q || ""}
          className="h-11 min-w-0 flex-1 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
          placeholder={t("biz.searchPlaceholder")}
        />
        <button className="h-11 shrink-0 rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
          {t("common.search")}
        </button>
      </div>

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

      <div className={`${open ? "mt-3 grid" : "hidden"} gap-2.5 lg:mt-3 lg:grid lg:grid-cols-2 lg:gap-3`}>
        <select name="category" defaultValue={params.category || ""} className={controlClass}>
          <option value="">{t("biz.allCategories")}</option>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{businessCategoryLabel(c.value, lang)}</option>
          ))}
        </select>

        <select name="city" defaultValue={params.city || ""} className={controlClass}>
          <option value="">{t("biz.allCities")}</option>
          {CITIES.map((city) => <option key={city} value={city}>{titleCase(city)}</option>)}
        </select>
      </div>
    </form>
  );
}
