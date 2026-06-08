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
      className="group overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--hw-bg-elevated)]">
        <Image
          src={partImage(part)}
          alt={part.title || "Heavy vehicle spare part"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <PlanAdornments plan={plan} />
        {part.featured ? (
          <span className="absolute left-3 top-3 rounded-md bg-[var(--hw-orange)] px-2 py-1 text-xs font-black text-[var(--hw-text-inverse)]">
            FEATURED
          </span>
        ) : null}
        <span className="absolute bottom-3 right-3 rounded-md bg-[var(--hw-bg-card)] px-2 py-1 text-xs font-black text-[var(--hw-green)]">
          {titleCase(part.condition || "used")}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-black text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
              <LocalizedText en={part.title} ur={part.titleUr || part.title} />
            </h3>
            <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
              {titleCase(part.category || "parts")} {part.make ? `| ${titleCase(part.make)}` : ""}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-[var(--hw-bg-elevated)] px-2 py-1 text-xs font-bold text-[var(--hw-cyan)]">
            {titleCase(part.city)}
          </span>
        </div>

        <p className="mt-4 text-xl font-black text-[var(--hw-orange)]">
          {formatPrice(part.price, part.priceDisplay)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[var(--hw-text-secondary)]">
          <span className="rounded-md bg-[var(--hw-bg-deep)] px-2 py-1">{titleCase(part.status || "active")}</span>
          <span className="rounded-md bg-[var(--hw-bg-deep)] px-2 py-1">
            Qty {part.quantity || 1}
          </span>
          {part.negotiable ? (
            <span className="rounded-md bg-[var(--hw-bg-deep)] px-2 py-1">Negotiable</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
