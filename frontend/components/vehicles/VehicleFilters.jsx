"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CITIES, CONDITIONS, FUELS, SORTS, TRANSMISSIONS, VEHICLE_MAKES, VEHICLE_TYPE_GROUPS } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { useLanguage } from "@/Context/LanguageContext";
import MicButton from "@/components/ui/MicButton";

// Params that count as an active filter for the mobile badge (`q` is shown in
// its own search box, `page` is pagination — neither is a filter chip).
const FILTER_PARAMS = ["make", "type", "city", "condition", "transmission", "fuel", "sort"];

// Canonical option lists (alphabetical). We intentionally do NOT merge in
// seller-typed values from the API, so junk like "abc" can never pollute the
// filters. The lists in constants.js are kept comprehensive instead.
const MAKE_OPTIONS = [...VEHICLE_MAKES].sort();
const CITY_OPTIONS = [...CITIES].sort();

function Option({ option }) {
  const itemValue = typeof option === "string" ? option : option.value;
  const itemLabel = typeof option === "string" ? titleCase(option) : option.label;
  return <option value={itemValue}>{itemLabel}</option>;
}

// Pass `groups` ([{ category, types }]) to render an <optgroup> per category,
// or a flat `options` list otherwise.
function SelectFilter({ name, label, options, groups, placeholder }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get(name) || "";

  function update(nextValue) {
    const params = new URLSearchParams(searchParams);
    if (nextValue) params.set(name, nextValue);
    else params.delete(name);
    params.delete("page");
    router.push(`/vehicles?${params.toString()}`);
  }

  return (
    <label className="text-[10px] font-bold uppercase text-[var(--hw-text-muted)] sm:text-xs">
      {label}
      <select
        value={value}
        onChange={(event) => update(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm font-medium text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2"
      >
        <option value="">{placeholder}</option>
        {groups
          ? groups.map((group) => (
              <optgroup key={group.category.value} label={group.category.label}>
                {group.types.map((option) => (
                  <Option key={option.value} option={option} />
                ))}
              </optgroup>
            ))
          : options.map((option) => (
              <Option key={typeof option === "string" ? option : option.value} option={option} />
            ))}
      </select>
    </label>
  );
}

export default function VehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const q = searchParams.get("q") || "";

  // Seven stacked dropdowns fill an entire phone screen before a single
  // listing shows, so below `lg` they collapse behind a Filters toggle.
  // Desktop keeps the always-open sticky sidebar.
  const [open, setOpen] = useState(false);
  const activeCount = FILTER_PARAMS.filter((key) => searchParams.get(key)).length;
  const formRef = useRef(null);
  const inputRef = useRef(null);

  function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams(searchParams);
    const query = String(formData.get("q") || "").trim();
    if (query) params.set("q", query);
    else params.delete("q");
    params.delete("page");
    router.push(`/vehicles?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams);
    FILTER_PARAMS.forEach((key) => params.delete(key));
    params.delete("page");
    router.push(`/vehicles?${params.toString()}`);
  }

  return (
    <aside className="h-fit rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 sm:p-4 lg:sticky lg:top-24">
      <form ref={formRef} onSubmit={submit} className="mb-3 sm:mb-4">
        <label className="text-[10px] font-bold uppercase text-[var(--hw-text-muted)] sm:text-xs">
          {t("filter.search")}
          <div className="relative mt-1.5 sm:mt-2">
            <input
              ref={inputRef}
              name="q"
              defaultValue={q}
              className="h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 pe-12 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              placeholder={t("filter.searchPlaceholder")}
            />
            <MicButton
              variant="sphere"
              size="sm"
              className="absolute inset-y-0 end-1.5 my-auto"
              onResult={(text) => { if (inputRef.current) inputRef.current.value = text; }}
              onFinal={() => setTimeout(() => formRef.current?.requestSubmit(), 350)}
            />
          </div>
        </label>
        <button className="mt-2.5 h-10 w-full rounded-lg bg-[var(--hw-orange)] text-[13px] font-black text-[var(--hw-text-inverse)] sm:mt-3 sm:text-sm">
          {t("filter.apply")}
        </button>
      </form>

      {/* Mobile-only disclosure header */}
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 text-[13px] font-black text-[var(--hw-text-primary)]"
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
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {activeCount ? (
          <button type="button" onClick={clearAll} className="text-[11px] font-bold text-[var(--hw-orange)]">
            {t("filter.clearAll")}
          </button>
        ) : null}
      </div>

      <div className={`${open ? "mt-3 grid" : "hidden"} gap-2.5 lg:mt-0 lg:grid lg:gap-3`}>
        <SelectFilter name="make" label={t("filter.make")} options={MAKE_OPTIONS} placeholder={t("filter.allMakes")} />
        <SelectFilter name="type" label={t("filter.type")} groups={VEHICLE_TYPE_GROUPS} placeholder={t("filter.allTypes")} />
        <SelectFilter name="city" label={t("filter.city")} options={CITY_OPTIONS} placeholder={t("filter.allCities")} />
        <SelectFilter name="condition" label={t("filter.condition")} options={CONDITIONS} placeholder={t("filter.anyCondition")} />
        <SelectFilter name="transmission" label={t("filter.transmission")} options={TRANSMISSIONS} placeholder={t("filter.anyTransmission")} />
        <SelectFilter name="fuel" label={t("filter.fuel")} options={FUELS} placeholder={t("filter.anyFuel")} />
        <SelectFilter name="sort" label={t("filter.sort")} options={SORTS} placeholder={t("filter.newest")} />
      </div>
    </aside>
  );
}
