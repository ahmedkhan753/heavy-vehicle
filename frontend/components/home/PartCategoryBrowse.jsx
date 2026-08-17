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
          className="group flex w-44 shrink-0 snap-start flex-col rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-[var(--hw-bg-elevated)]">
            <Image
              src={getPartCategoryIcon(part.value)}
              alt={partCategoryLabel(part.value, lang)}
              width={80}
              height={80}
              className="h-16 w-16 object-contain"
            />
          </div>
          <h3 className="text-base font-black leading-snug text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
            {partCategoryLabel(part.value, lang)}
          </h3>
        </Link>
      ))}
    </HScroller>
  );
}
