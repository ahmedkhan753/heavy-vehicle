import Link from "next/link";
import Image from "next/image";
import { fallbackImage } from "@/lib/constants";
import { formatPrice, titleCase } from "@/lib/format";
import PlanAdornments, { planBorderStyle } from "@/components/marketing/PlanAdornments";
import LocalizedText from "@/components/ui/LocalizedText";

function partImage(part) {
  return part?.coverImage || part?.images?.[0]?.url || fallbackImage;
}

export default function PartCard({ part }) {
  const href = `/parts/${part._id || part.id}`;
  const plan = part.seller?.plan;

  return (
    <Link
      href={href}
      style={planBorderStyle(plan)}
      className="group flex flex-col overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] transition hover:border-[var(--hw-orange)] sm:hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--hw-bg-elevated)] sm:aspect-[16/10]">
        <Image
          src={partImage(part)}
          alt={part.title || "Heavy vehicle spare part"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <PlanAdornments plan={plan} />
        {part.status === "sold" ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/55">
            <span className="rounded-md bg-[var(--hw-orange)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[var(--hw-text-inverse)] sm:text-sm">
              Sold
            </span>
          </span>
        ) : null}
        {part.featured ? (
          <span className="absolute left-1.5 top-1.5 rounded bg-[var(--hw-orange)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--hw-text-inverse)] sm:left-3 sm:top-3 sm:rounded-md sm:px-2 sm:py-1 sm:text-xs">
            Featured
          </span>
        ) : null}
        <span className="absolute bottom-1.5 right-1.5 rounded bg-[var(--hw-bg-card)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--hw-green)] sm:bottom-3 sm:right-3 sm:rounded-md sm:px-2 sm:py-1 sm:text-xs">
          {titleCase(part.condition || "used")}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
        <h3 className="line-clamp-2 text-[13px] font-black leading-snug text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)] sm:text-base">
          <LocalizedText en={part.title} ur={part.titleUr || part.title} />
        </h3>

        <p className="mt-0.5 truncate text-[11px] text-[var(--hw-text-muted)] sm:mt-1 sm:text-sm">
          {titleCase(part.category || "parts")}
          {part.make ? ` · ${titleCase(part.make)}` : ""}
        </p>

        <p className="mt-1.5 text-sm font-black text-[var(--hw-orange)] sm:mt-3 sm:text-xl">
          {formatPrice(part.price, part.priceDisplay)}
        </p>

        {/* Two facts only — a third (Negotiable) shrank all three into
            unreadable stubs on a ~165px-wide phone card. It still shows on
            the detail page next to the price. */}
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-[10px] font-bold text-[var(--hw-text-secondary)] sm:mt-3 sm:gap-2 sm:text-xs">
          <span className="truncate">{titleCase(part.city)}</span>
          <span className="shrink-0 text-[var(--hw-border-strong)]">·</span>
          <span className="shrink-0">Qty {part.quantity || 1}</span>
        </p>
      </div>
    </Link>
  );
}
