"use client";

import Link from "next/link";
import Image from "next/image";
import { VEHICLE_TYPES, typeLabel } from "@/lib/constants";
import { useLanguage } from "@/Context/LanguageContext";
import HScroller from "@/components/ui/HScroller";
import { getVehicleTypeIcon } from "@/lib/iconAssets";

/**
 * CategoryBrowse — homepage "Browse by category" carousel.
 * Shows every listing type (minus the "Other" catch-all) in a horizontal
 * scroller so buyers can page through the full taxonomy with the arrows.
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
          <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-[var(--hw-bg-elevated)]">
            <Image
              src={getVehicleTypeIcon(type.value)}
              alt={typeLabel(type, lang)}
              width={80}
              height={80}
              className="h-16 w-16 object-contain"
            />
          </div>
          <h3 className="text-base font-black leading-snug text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
            {typeLabel(type, lang)}
          </h3>
        </Link>
      ))}
    </HScroller>
  );
}
