import Link from "next/link";
import Image from "next/image";
import VehicleCard from "@/components/vehicles/VehicleCard";
import SellerContact from "@/components/vehicles/SellerContact";
import PriceFairnessBadge from "@/components/vehicles/PriceFairnessBadge";
import Comments from "@/components/vehicles/Comments";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { API_BASE_URL, buildQuery } from "@/lib/api";
import { fallbackImage } from "@/lib/constants";
import { formatMileage, formatPrice, titleCase, vehicleImage } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";
import TranslatedText from "@/components/ui/TranslatedText";
import VehicleGallery from "@/components/vehicles/VehicleGallery";

export const revalidate = 60;

async function getDetail(id) {
  try {
    const [vehicleRes, similarRes] = await Promise.all([
      fetch(`${API_BASE_URL}/vehicles/${id}`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/vehicles/${id}/similar?limit=3`, { next: { revalidate: 60 } }),
      // View count is a mutation — never cache it, so every visit still counts.
      fetch(`${API_BASE_URL}/vehicles/${id}/view`, { method: "POST", cache: "no-store" }).catch(() => null),
    ]);

    if (!vehicleRes.ok) throw new Error("Vehicle not found");
    const vehicle = await vehicleRes.json();
    const similar = similarRes.ok ? await similarRes.json() : { data: [] };
    return { vehicle: vehicle.data, similar: similar.data || [] };
  } catch {
    return { vehicle: null, similar: [] };
  }
}

// Typical price for this listing's bucket (excludes the listing itself),
// used by the fair-price badge. Returns null when data is too sparse.
async function getPriceEstimate(vehicle) {
  try {
    const query = buildQuery({
      type: vehicle.type,
      condition: vehicle.condition,
      excludeId: vehicle._id,
    });
    const res = await fetch(`${API_BASE_URL}/meta/price-guide/estimate${query}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export default async function VehicleDetailPage({ params }) {
  const { id } = await params;
  const { vehicle, similar } = await getDetail(id);
  const t = await getT();
  const lang = await getLang();
  const priceEstimate = vehicle ? await getPriceEstimate(vehicle) : null;

  if (!vehicle) {
    return (
      <main className="hw-container py-16">
        <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h1 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("listing.notFound")}</h1>
          <p className="mt-2 text-[var(--hw-text-secondary)]">
            {t("veh.notFoundBody")}
          </p>
          <Link href="/vehicles" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
            {t("veh.backToVehicles")}
          </Link>
        </div>
      </main>
    );
  }

  const image = vehicleImage(vehicle) || fallbackImage;
  const seller = vehicle.sellerId || vehicle.seller || {};

  // Bilingual content: show the cookie-language version, with the other version
  // available via the TranslatedText toggle.
  const title = lang === "ur" ? (vehicle.titleUr || vehicle.title) : vehicle.title;
  const descPrimary = lang === "ur" ? (vehicle.descriptionUr || vehicle.description) : vehicle.description;
  const descSecondary = lang === "ur" ? vehicle.description : (vehicle.descriptionUr || "");
  const showLabel = lang === "ur" ? t("listing.showEnglish") : t("listing.showUrdu");
  const hideLabel = lang === "ur" ? t("listing.showUrdu") : t("listing.showEnglish");

  const specs = [
    [t("veh.spec.make"), titleCase(vehicle.make)],
    [t("veh.spec.model"), vehicle.model],
    [t("veh.spec.year"), vehicle.year],
    [t("veh.spec.type"), titleCase(vehicle.type)],
    [t("veh.spec.condition"), titleCase(vehicle.condition)],
    [t("veh.spec.mileage"), formatMileage(vehicle)],
    [t("veh.spec.transmission"), titleCase(vehicle.transmission || "not listed")],
    [t("veh.spec.fuel"), titleCase(vehicle.fuel || "diesel")],
    [t("veh.spec.engine"), vehicle.engineType || vehicle.engineCC || t("veh.notListed")],
    [t("veh.spec.axle"), vehicle.axleConfig || t("veh.notListed")],
    [t("veh.spec.city"), titleCase(vehicle.city)],
    [t("veh.spec.area"), vehicle.area || t("veh.notListed")],
  ];

  return (
    <main className="hw-container py-10">
      <div className="mb-6 text-sm text-[var(--hw-text-muted)]">
        <Link href="/vehicles" className="hover:text-[var(--hw-orange)]">{t("nav.vehicles")}</Link>
        <span> / {title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <VehicleGallery 
            images={vehicle.images} 
            title={title} 
            fallbackImage={fallbackImage} 
          />

          <div className="mt-6 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-black text-[var(--hw-text-primary)]">{title}</h1>
                <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
                  {titleCase(vehicle.make)} {vehicle.model} | {vehicle.year} | {titleCase(vehicle.city)}
                </p>
              </div>
              <span className="w-fit rounded-md bg-[var(--hw-bg-elevated)] px-3 py-2 text-xs font-black text-[var(--hw-green)]">
                {titleCase(vehicle.status || "active")}
              </span>
            </div>
            <p className="mt-4 text-3xl font-black text-[var(--hw-orange)]">
              {formatPrice(vehicle.price, vehicle.priceDisplay)}
            </p>
            {Number(vehicle.price) > 0 ? (
              <div className="mt-4 flex flex-wrap items-start gap-x-6 gap-y-2">
                <Link
                  href={`/services/loan-calculator?price=${vehicle.price}`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--hw-border-strong)] px-4 text-sm font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-orange)]"
                >
                  🧮 {t("veh.calculateFinancing")}
                </Link>
                <Link
                  href={`/services/transfer?vehicleId=${vehicle._id}`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--hw-border-strong)] px-4 text-sm font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-orange)]"
                >
                  📄 {t("veh.requestTransfer")}
                </Link>
                <PriceFairnessBadge price={vehicle.price} estimate={priceEstimate} t={t} />
              </div>
            ) : null}
            {vehicle.seller?.warranty ? (
              <div className="mt-4 rounded-lg border border-[var(--hw-green)] bg-[var(--hw-soft-panel)] p-3">
                <p className="flex items-center gap-2 text-sm font-black text-[var(--hw-green)]">
                  🛡️ {t("veh.warrantyVerified")}
                </p>
                <p className="mt-1 text-xs text-[var(--hw-text-muted)]">{t("veh.warrantyByDealer")}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("listing.specifications")}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {specs.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] px-4 py-3">
                  <span className="text-sm text-[var(--hw-text-muted)]">{label}</span>
                  <span className="text-right text-sm font-bold text-[var(--hw-text-primary)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("listing.description")}</h2>
            <TranslatedText
              primary={descPrimary}
              secondary={descSecondary}
              showLabel={showLabel}
              hideLabel={hideLabel}
              className="mt-3 leading-7 text-[var(--hw-text-secondary)]"
            />
          </div>
        </section>

        <aside style={planBorderStyle(vehicle.seller?.plan)} className="h-fit rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("listing.seller")}</p>
            <PlanBadge plan={vehicle.seller?.plan} size="sm" hideFree />
          </div>
          <h2 className="mt-2 text-xl font-black text-[var(--hw-text-primary)]">{seller.name || vehicle.seller?.name || t("listing.seller")}</h2>
          <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
            {seller.isVerifiedSeller || vehicle.seller?.verified ? t("listing.verifiedSeller") : t("listing.seller")} | {titleCase(seller.city || vehicle.seller?.city || vehicle.city)}
          </p>
          <div className="mt-5">
            <SellerContact vehicleId={vehicle._id} redirectTo={`/vehicles/${vehicle._id}`} sellerId={seller?._id || vehicle.sellerId} />
          </div>
          <div className="mt-5 rounded-lg bg-[var(--hw-bg-deep)] p-4 text-sm leading-6 text-[var(--hw-text-secondary)]">
            {t("veh.safetyNote")}
          </div>
        </aside>
      </div>

      <section className="mt-10">
        <Comments vehicleId={vehicle._id} sellerId={seller?._id || vehicle.sellerId} />
      </section>

      {similar.length ? (
        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-black text-[var(--hw-text-primary)]">{t("listing.similar")}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {similar.map((item) => (
              <VehicleCard key={item._id} vehicle={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
