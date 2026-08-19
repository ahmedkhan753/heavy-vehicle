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
          className="group flex w-20 shrink-0 snap-start flex-col rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-2.5 transition hover:-translate-y-1 hover:border-[var(--hw-orange)] sm:w-44 sm:p-5"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[var(--hw-bg-elevated)] sm:mb-5 sm:h-20 sm:w-20">
            <Image
              src={getVehicleTypeIcon(type.value)}
              alt={typeLabel(type, lang)}
              width={80}
              height={80}
              className="h-7 w-7 object-contain sm:h-16 sm:w-16"
            />
          </div>
          <h3 className="line-clamp-2 text-[11px] font-black leading-snug text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)] sm:text-base">
            {typeLabel(type, lang)}
          </h3>
        </Link>
      ))}
    </HScroller>
  );
}
