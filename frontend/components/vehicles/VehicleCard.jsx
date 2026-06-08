import Link from "next/link";
import Image from "next/image";
import { fallbackImage } from "@/lib/constants";
import { formatMileage, formatPrice, titleCase, vehicleImage } from "@/lib/format";
import PlanAdornments, { planBorderStyle } from "@/components/marketing/PlanAdornments";
import LocalizedText from "@/components/ui/LocalizedText";

export default function VehicleCard({ vehicle }) {
  const image = vehicleImage(vehicle) || fallbackImage;
  const href = `/vehicles/${vehicle._id || vehicle.id}`;
  const plan = vehicle.seller?.plan;

  return (
    <Link
      href={href}
      style={planBorderStyle(plan)}
      className="group overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--hw-bg-elevated)]">
        <Image
          src={image}
          alt={vehicle.title || "Heavy vehicle listing"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <PlanAdornments plan={plan} />
        {vehicle.featured ? (
          <span className="absolute left-3 top-3 rounded-md bg-[var(--hw-orange)] px-2 py-1 text-xs font-black text-[var(--hw-text-inverse)]">
            FEATURED
          </span>
        ) : null}
        {vehicle.seller?.verified ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-[var(--hw-green)] px-2 py-1 text-xs font-black text-[var(--hw-text-inverse)]">
            VERIFIED
          </span>
        ) : null}
        {vehicle.seller?.warranty ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-[var(--hw-bg-deep)]/90 px-2 py-1 text-xs font-black text-[var(--hw-green)] ring-1 ring-[var(--hw-green)]">
            🛡️ WARRANTY
          </span>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-black text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">
              <LocalizedText
                en={vehicle.shortTitle || vehicle.title}
                ur={vehicle.titleUr || vehicle.shortTitle || vehicle.title}
              />
            </h3>
            <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
              {titleCase(vehicle.make)} {vehicle.model} | {vehicle.year}
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-[var(--hw-bg-elevated)] px-2 py-1 text-xs font-bold text-[var(--hw-cyan)]">
            {titleCase(vehicle.city)}
          </span>
        </div>

        <p className="mt-4 text-xl font-black text-[var(--hw-orange)]">
          {formatPrice(vehicle.price, vehicle.priceDisplay)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[var(--hw-text-secondary)]">
          <span className="rounded-md bg-[var(--hw-bg-deep)] px-2 py-1">{titleCase(vehicle.type)}</span>
          <span className="rounded-md bg-[var(--hw-bg-deep)] px-2 py-1">{titleCase(vehicle.condition)}</span>
          <span className="rounded-md bg-[var(--hw-bg-deep)] px-2 py-1">{formatMileage(vehicle)}</span>
        </div>
      </div>
    </Link>
  );
}
