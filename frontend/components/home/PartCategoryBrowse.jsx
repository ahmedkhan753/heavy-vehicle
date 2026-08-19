"use client";

import Link from "next/link";
import Image from "next/image";
import { PART_CATEGORIES, partCategoryLabel } from "@/lib/parts";
import { useLanguage } from "@/Context/LanguageContext";
import HScroller from "@/components/ui/HScroller";
import { getPartCategoryIcon } from "@/lib/iconAssets";

export default function PartCategoryBrowse() {
  const { lang } = useLanguage();
  const parts = PART_CATEGORIES.filter((part) => part.value !== "other");

  return (
    <HScroller ariaLabel="Browse spare parts categories">
      {parts.map((part) => (
        <Link
          key={part.value}
          href={`/parts?category=${part.value}`}
          className="group flex w-20 shrink-0 snap-start flex-col rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-2.5 transition hover:-translate-y-1 hover:border-[var(--hw-orange)] sm:w-44 sm:p-5"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[var(--hw-bg-elevated)] sm:mb-5 sm:h-20 sm:w-20">
            <Image
              src={getPartCategoryIcon(part.value)}
              alt={partCategoryLabel(part.value, lang)}
              width={80}
              height={80}
              className="h-7 w-7 object-contain sm:h-16 sm:w-16"
            />
          </div>
          <h3 className="line-clamp-2 text-[11px] font-black leading-snug text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)] sm:text-base">
            {partCategoryLabel(part.value, lang)}
          </h3>
        </Link>
      ))}
    </HScroller>
  );
}
