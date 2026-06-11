"use client";

import Link from "next/link";
import { VEHICLE_TYPES, typeLabel } from "@/lib/constants";
import { useLanguage } from "@/Context/LanguageContext";
import HScroller from "@/components/ui/HScroller";

/**
 * CategoryBrowse — homepage "Browse by category" carousel.
 * Shows every listing type (minus the "Other" catch-all) in a horizontal
 * scroller so buyers can page through the full taxonomy with the arrows
 * instead of seeing only the first handful. Each tile links to the listings
 * page filtered by that type (/vehicles?type=<value>).
 */
export default function CategoryBrowse() {
  const { lang } = useLanguage();
  const types = VEHICLE_TYPES.filter((type) => type.value !== "other");

  return (
    <HScroller ariaLabel="Browse by category">
      {types.map((type) => (
        <Link
          key={type.value}
          href={`/vehicles?type=${type.value}`}
          className="group flex w-44 shrink-0 snap-start flex-col rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--hw-bg-elevated)] text-[var(--hw-orange)]">
            <TruckIcon />
          </div>
          <h3 className="text-base font-black leading-snug text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
            {typeLabel(type, lang)}
          </h3>
        </Link>
      ))}
    </HScroller>
  );
}

function TruckIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8h12v8H3z" />
      <path d="M15 11h3l3 3v2h-6z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}
