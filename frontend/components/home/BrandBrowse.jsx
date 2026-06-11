"use client";

import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { useLanguage } from "@/Context/LanguageContext";
import HScroller from "@/components/ui/HScroller";

/**
 * BrandBrowse — homepage "Browse by brand" carousel.
 * Text-only tiles for now (logos to be added later — see /public/brands).
 * Tiles live in a horizontal scroller so the full brand list pages through
 * the arrows instead of filling the homepage. Each tile links to the
 * listings page filtered by that make (/vehicles?make=<slug>).
 */
export default function BrandBrowse() {
  const { lang } = useLanguage();
  return (
    <HScroller ariaLabel="Browse by brand">
      {BRANDS.map((brand) => (
        <Link
          key={brand.slug}
          href={`/vehicles?make=${brand.slug}`}
          className="group flex w-36 shrink-0 snap-start items-center justify-center rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] px-4 py-6 text-center transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
          style={{ borderTop: `3px solid ${brand.color}` }}
        >
          <span className="text-base font-black text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
            {lang === "ur" && brand.urdu ? brand.urdu : brand.name}
          </span>
        </Link>
      ))}
    </HScroller>
  );
}
