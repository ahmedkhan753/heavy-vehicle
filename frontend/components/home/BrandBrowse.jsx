"use client";

import Image from "next/image";
import Link from "next/link";
import { BRANDS } from "@/lib/brands";
import { useLanguage } from "@/Context/LanguageContext";
import HScroller from "@/components/ui/HScroller";

/**
 * BrandBrowse — homepage "Browse by brand" carousel.
 * Each tile shows the saved brand logo when available and falls back to a
 * compact monogram if a specific logo file is missing.
 */
export default function BrandBrowse() {
  const { lang } = useLanguage();

  return (
    <HScroller ariaLabel="Browse by brand">
      {BRANDS.map((brand) => {
        const logoSrc = brand.logo ? encodeURI(brand.logo) : null;
        const shortLabel = (brand.name || "")
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <Link
            key={brand.slug}
            href={`/vehicles?make=${brand.slug}`}
            className="group flex w-20 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] px-2 py-2.5 text-center transition hover:-translate-y-1 hover:border-[var(--hw-orange)] sm:w-36 sm:gap-2 sm:px-3 sm:py-5"
            style={{ borderTop: `3px solid ${brand.color}` }}
          >
            {logoSrc ? (
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-[var(--hw-bg-elevated)] p-1 sm:h-16 sm:w-16 sm:p-2">
                <Image
                  src={logoSrc}
                  alt={brand.name}
                  width={64}
                  height={64}
                  className="h-6 w-auto max-w-[30px] object-contain sm:h-12 sm:max-w-[52px]"
                />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--hw-bg-elevated)] text-[10px] font-black text-[var(--hw-text-primary)] sm:h-16 sm:w-16 sm:text-sm">
                {shortLabel || "BR"}
              </div>
            )}

            <span className="line-clamp-1 text-[9px] font-black leading-tight text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)] sm:text-[11px]">
              {lang === "ur" && brand.urdu ? brand.urdu : brand.name}
            </span>
          </Link>
        );
      })}
    </HScroller>
  );
}
