"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/Context/LanguageContext";
import { VEHICLE_TYPES, CITIES, typeLabel, cityLabel } from "@/lib/constants";
import MicButton from "@/components/ui/MicButton";

/**
 * Homepage hero search.
 *
 * The keyword box is narrow and always visible; Make/Type/City live behind
 * a "Filters" disclosure below `lg` (same collapse pattern as
 * VehicleFilters/PartFilters) so the hero doesn't burn a screenful of
 * vertical space on a phone before any homepage content shows.
 *
 * Where it routes depends on what's filled in: a plain keyword search goes
 * to /search, the new unified vehicle+part search — plain text search used
 * to hard-route to /vehicles regardless of what was typed, so searching for
 * a part came back "no vehicles found". Setting Type/City is specifically a
 * vehicle-browsing shortcut, so that combination still goes to /vehicles,
 * unchanged from before.
 */
export default function HomeHeroSearch() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const formRef = useRef(null);

  function submit(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const q = String(fd.get("q") || "").trim();
    const type = String(fd.get("type") || "");
    const city = String(fd.get("city") || "");

    if (type || city) {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      if (city) params.set("city", city);
      router.push(`/vehicles?${params.toString()}`);
      return;
    }
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form ref={formRef} onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 shadow-2xl sm:p-4">
      <h2 className="mb-3 text-base font-black text-[var(--hw-text-primary)] sm:mb-4 sm:text-xl">{t("home.findVehicles")}</h2>

      <div className="grid gap-2.5 sm:gap-3">
        <div className="relative">
          <input
            ref={inputRef}
            name="q"
            placeholder={t("home.searchPlaceholder")}
            className="h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 pe-11 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:h-12"
          />
          <MicButton
            className="absolute inset-y-0 end-2 my-auto"
            onResult={(text) => { if (inputRef.current) inputRef.current.value = text; }}
            onFinal={() => setTimeout(() => formRef.current?.requestSubmit(), 350)}
          />
        </div>

        {/* Disclosure — mobile only; desktop keeps Type/City always visible */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white/80 lg:hidden"
        >
          <svg className="h-3.5 w-3.5 text-[var(--hw-orange)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          {t("filter.filters")}
          <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div className={`${open ? "grid" : "hidden"} gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid lg:grid-cols-2`}>
          <Select name="type" label={t("filter.type")} allText={t("filter.allTypes")} options={VEHICLE_TYPES} lang={lang} />
          <Select name="city" label={t("filter.city")} allText={t("filter.allCities")} options={CITIES} lang={lang} />
        </div>

        <button className="mt-0.5 h-11 rounded-lg bg-[var(--hw-green)] px-5 text-sm font-black text-[var(--hw-text-inverse)] sm:mt-1 sm:h-12">
          {t("home.searchBtn")}
        </button>
      </div>
    </form>
  );
}

function Select({ name, label, allText, options, lang }) {
  return (
    <label className="text-[10px] font-bold uppercase text-[var(--hw-text-muted)] sm:text-xs">
      {label}
      <select name={name} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm font-medium text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:h-12">
        <option value="">{allText || label}</option>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const labelText = typeof option === "string" ? cityLabel(option, lang) : typeLabel(option, lang);
          return <option key={value} value={value}>{labelText}</option>;
        })}
      </select>
    </label>
  );
}
