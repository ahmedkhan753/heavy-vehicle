import Link from "next/link";
import Image from "next/image";
import { titleCase } from "@/lib/format";
import { businessCategoryLabel } from "@/lib/businesses";
import { Icon } from "@/components/listing/ListingBits";

export default function BusinessCard({ business, lang = "en" }) {
  const initial = (business.businessName || "?").trim().charAt(0).toUpperCase();

  return (
    <Link
      href={`/businesses/${business._id}`}
      className="group flex gap-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 transition hover:border-[var(--hw-orange)] sm:p-4"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--hw-orange)] text-lg font-black text-[var(--hw-text-inverse)] sm:h-16 sm:w-16 sm:text-xl"
      >
        {business.logo?.url
          ? <Image src={business.logo.url} alt="" width={64} height={64} className="h-full w-full object-cover" />
          : initial}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[14px] font-black text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)] sm:text-base">
            {business.businessName}
          </h3>
          {business.featured ? (
            <span className="shrink-0 rounded bg-[var(--hw-orange)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--hw-text-inverse)]">
              ★
            </span>
          ) : null}
        </div>

        <p className="mt-0.5 truncate text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
          {businessCategoryLabel(business.category, lang)}
        </p>

        {business.tagline ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[var(--hw-text-secondary)] sm:text-[13px]">
            {business.tagline}
          </p>
        ) : null}

        <p className="mt-1.5 flex items-center gap-1.5 truncate text-[10px] font-bold text-[var(--hw-text-secondary)] sm:text-xs">
          <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-[var(--hw-orange)]" />
          <span className="truncate">
            {titleCase(business.city)}
            {business.area ? ` · ${business.area}` : ""}
          </span>
        </p>
      </div>
    </Link>
  );
}
