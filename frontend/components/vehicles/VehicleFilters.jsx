"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CITIES, CONDITIONS, FUELS, SORTS, TRANSMISSIONS, VEHICLE_MAKES, VEHICLE_TYPE_GROUPS } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { useLanguage } from "@/Context/LanguageContext";

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
    <label className="text-xs font-bold uppercase text-[var(--hw-text-muted)]">
      {label}
      <select
        value={value}
        onChange={(event) => update(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm font-medium text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]"
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

  return (
    <aside className="h-fit rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 lg:sticky lg:top-24">
      <form onSubmit={submit} className="mb-4">
        <label className="text-xs font-bold uppercase text-[var(--hw-text-muted)]">
          {t("filter.search")}
          <input
            name="q"
            defaultValue={q}
            className="mt-2 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
            placeholder={t("filter.searchPlaceholder")}
          />
        </label>
        <button className="mt-3 h-10 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)]">
          {t("filter.apply")}
        </button>
      </form>

      <div className="grid gap-3">
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
