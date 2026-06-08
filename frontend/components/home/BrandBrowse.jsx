"use client";

import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { useLanguage } from "@/Context/LanguageContext";

/**
 * BrandBrowse — homepage "Browse by brand" grid.
 * Text-only tiles for now (logos to be added later — see /public/brands).
 * Each tile links to the listings page filtered by that make
 * (/vehicles?make=<slug>), where results come back featured-first.
 */
export default function BrandBrowse() {
  const { lang } = useLanguage();
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
      {BRANDS.map((brand) => (
        <Link
          key={brand.slug}
          href={`/vehicles?make=${brand.slug}`}
          className="group flex items-center justify-center rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] px-4 py-6 text-center transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
          style={{ borderTop: `3px solid ${brand.color}` }}
        >
          <span className="text-base font-black text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
            {lang === "ur" && brand.urdu ? brand.urdu : brand.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
