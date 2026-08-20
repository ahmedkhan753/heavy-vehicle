import Link from "next/link";
import VehicleCard from "@/components/vehicles/VehicleCard";
import SellerContact from "@/components/listing/SellerContact";
import PriceFairnessBadge from "@/components/vehicles/PriceFairnessBadge";
import Comments from "@/components/listing/Comments";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { SERVER_API_BASE_URL, buildQuery } from "@/lib/api";
import { fallbackImage } from "@/lib/constants";
import { formatMileage, formatPrice, titleCase, vehicleImage } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";
import TranslatedText from "@/components/ui/TranslatedText";
import VehicleGallery from "@/components/vehicles/VehicleGallery";
import ListingTopBar from "@/components/listing/ListingTopBar";
import ShareMenu from "@/components/listing/ShareMenu";
import { Chip, QuickSpecs, SpecGrid, Panel } from "@/components/listing/ListingBits";
import { productJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

// Same fetch signature as the vehicle fetch inside getDetail() below — Next
// dedupes identical fetches within one render, so this doesn't cost a
// second request and (importantly) doesn't touch the separate, non-cached
// view-count fetch that only getDetail makes.
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/vehicles/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const { data: vehicle } = await res.json();
    if (!vehicle) return {};

    const lang = await getLang();
    const title = lang === "ur" ? (vehicle.titleUr || vehicle.title) : vehicle.title;
    const image = vehicleImage(vehicle) || fallbackImage;
    const description = `${formatPrice(vehicle.price, vehicle.priceDisplay)} — ${titleCase(vehicle.condition)} ${titleCase(vehicle.type)} in ${titleCase(vehicle.city)}`;

    return {
      title, // root layout's title.template appends "| HeavyWheels"
      description,
      alternates: { canonical: `/vehicles/${id}` },
      openGraph: { title, description, images: [{ url: image }], type: "website" },
      twitter: { card: "summary_large_image", title, description, images: [image] },
    };
  } catch {
    return {};
  }
}

async function getDetail(id) {
  try {
    const [vehicleRes, similarRes] = await Promise.all([
      fetch(`${SERVER_API_BASE_URL}/vehicles/${id}`, { next: { revalidate: 60 } }),
      fetch(`${SERVER_API_BASE_URL}/vehicles/${id}/similar?limit=3`, { next: { revalidate: 60 } }),
      // View count is a mutation — never cache it, so every visit still counts.
      fetch(`${SERVER_API_BASE_URL}/vehicles/${id}/view`, { method: "POST", cache: "no-store" }).catch(() => null),
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
    const res = await fetch(`${SERVER_API_BASE_URL}/meta/price-guide/estimate${query}`, { next: { revalidate: 3600 } });
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

  const seller = vehicle.sellerId || vehicle.seller || {};
  const isSold = vehicle.status === "sold";

  // Bilingual content: show the cookie-language version, with the other version
  // available via the TranslatedText toggle.
  const title = lang === "ur" ? (vehicle.titleUr || vehicle.title) : vehicle.title;
  const descPrimary = lang === "ur" ? (vehicle.descriptionUr || vehicle.description) : vehicle.description;
  const descSecondary = lang === "ur" ? vehicle.description : (vehicle.descriptionUr || "");
  const showLabel = lang === "ur" ? t("listing.showEnglish") : t("listing.showUrdu");
  const hideLabel = lang === "ur" ? t("listing.showUrdu") : t("listing.showEnglish");

  const specs = [
    [t("veh.spec.make"), titleCase(vehicle.make), "badge"],
    [t("veh.spec.model"), vehicle.model, "hash"],
    [t("veh.spec.year"), vehicle.year, "calendar"],
    [t("veh.spec.type"), titleCase(vehicle.type), "truck"],
    [t("veh.spec.condition"), titleCase(vehicle.condition), "tag"],
    [t("veh.spec.mileage"), formatMileage(vehicle), "gauge"],
    [t("veh.spec.transmission"), titleCase(vehicle.transmission || "not listed"), "gear"],
    [t("veh.spec.fuel"), titleCase(vehicle.fuel || "diesel"), "fuel"],
    [t("veh.spec.engine"), vehicle.engineType || vehicle.engineCC || t("veh.notListed"), "engine"],
    [t("veh.spec.axle"), vehicle.axleConfig || t("veh.notListed"), "axle"],
    [t("veh.spec.city"), titleCase(vehicle.city), "pin"],
    [t("veh.spec.area"), vehicle.area || t("veh.notListed"), "pin"],
  ];

  // The four numbers a buyer scans first, pulled out above the full table.
  const quickSpecs = [
    [t("veh.spec.condition"), titleCase(vehicle.condition)],
    [t("veh.spec.make"), titleCase(vehicle.make)],
    [t("veh.spec.model"), vehicle.model],
    [t("veh.spec.mileage"), formatMileage(vehicle)],
  ];

  const breadcrumbItems = [
    { name: "HeavyWheels", path: "" },
    { name: t("nav.vehicles"), path: "/vehicles" },
    { name: titleCase(vehicle.type), path: `/vehicles?type=${vehicle.type}` },
    { name: title, path: `/vehicles/${vehicle._id}` },
  ];

  return (
    <main className="hw-container py-3 sm:py-6 lg:py-10">
      {/* Product + BreadcrumbList JSON-LD — the visible breadcrumb below
          mirrors this, so a reader and a crawler get the same hierarchy. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            productJsonLd({
              name: title,
              description: descPrimary,
              image: vehicle.images?.[0]?.url || fallbackImage,
              path: `/vehicles/${vehicle._id}`,
              price: vehicle.price,
              condition: vehicle.condition,
              brand: titleCase(vehicle.make),
              status: vehicle.status,
            }),
            breadcrumbJsonLd(breadcrumbItems),
          ]),
        }}
      />

      <ListingTopBar saveId={vehicle._id} title={title} />

      <div className="mb-6 hidden items-center gap-1.5 text-sm text-[var(--hw-text-muted)] lg:flex">
        <Link href="/" className="hover:text-[var(--hw-orange)]">{t("nav.home")}</Link>
        <span aria-hidden>/</span>
        <Link href="/vehicles" className="hover:text-[var(--hw-orange)]">{t("nav.vehicles")}</Link>
        <span aria-hidden>/</span>
        <Link href={`/vehicles?type=${vehicle.type}`} className="hover:text-[var(--hw-orange)]">{titleCase(vehicle.type)}</Link>
        <span aria-hidden>/</span>
        <span className="truncate text-[var(--hw-text-secondary)]">{title}</span>
      </div>

      {/* Explicit row/column placement at lg keeps the desktop two-column
          layout, while `order` puts the seller card second on phones — right
          after the price, instead of below the whole spec table. */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <section className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
          <VehicleGallery
            images={vehicle.images}
            title={title}
            fallbackImage={fallbackImage}
          />

          <div className="mt-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:mt-4 sm:p-5">
            <div className="mb-2 hidden justify-end lg:flex">
              <ShareMenu title={title} iconOnly />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-black leading-tight text-[var(--hw-text-primary)] sm:text-2xl lg:text-3xl">{title}</h1>
                <p className="mt-1 truncate text-[11px] text-[var(--hw-text-muted)] sm:mt-2 sm:text-sm">
                  {vehicle.year} · {formatMileage(vehicle)}
                  {vehicle.axleConfig ? ` · ${vehicle.axleConfig}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-base font-black leading-tight text-[var(--hw-orange)] sm:text-2xl lg:text-3xl">
                  {formatPrice(vehicle.price, vehicle.priceDisplay)}
                </p>
                <p className={`mt-0.5 text-[10px] font-bold uppercase sm:text-xs ${isSold ? "text-[var(--hw-text-muted)]" : "text-[var(--hw-green)]"}`}>
                  {titleCase(vehicle.status || "active")}
                </p>
              </div>
            </div>

            {isSold ? (
              <p className="mt-2.5 flex items-center gap-2 rounded-lg border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] px-3 py-2 text-[13px] font-black text-[var(--hw-orange)] sm:mt-4 sm:text-sm">
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" />
                </svg>
                {t("listing.soldNotice")}
              </p>
            ) : null}

            <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
              <Chip icon="truck">{titleCase(vehicle.type)}</Chip>
              <Chip icon="fuel">{titleCase(vehicle.fuel || "diesel")}</Chip>
              <Chip icon="gear">{titleCase(vehicle.transmission || "manual")}</Chip>
              <Chip icon="pin">{titleCase(vehicle.city)}</Chip>
            </div>

            {vehicle.seller?.warranty ? (
              <div className="mt-3 rounded-lg border border-[var(--hw-green)] bg-[var(--hw-soft-panel)] p-2.5 sm:p-3">
                <p className="flex items-center gap-2 text-[13px] font-black text-[var(--hw-green)] sm:text-sm">
                  🛡️ {t("veh.warrantyVerified")}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-xs">{t("veh.warrantyByDealer")}</p>
              </div>
            ) : null}
          </div>
        </section>

        <aside
          style={planBorderStyle(vehicle.seller?.plan)}
          className="order-2 h-fit min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:row-span-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">{t("listing.seller")}</p>
            <PlanBadge plan={vehicle.seller?.plan} size="sm" hideFree />
          </div>
          <h2 className="mt-1.5 text-base font-black text-[var(--hw-text-primary)] sm:mt-2 sm:text-xl">
            {seller.name || vehicle.seller?.name || t("listing.seller")}
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:mt-1 sm:text-sm">
            {seller.isVerifiedSeller || vehicle.seller?.verified ? t("listing.verifiedSeller") : t("listing.seller")} · {titleCase(seller.city || vehicle.seller?.city || vehicle.city)}
          </p>
          {seller?._id || vehicle.sellerId ? (
            <Link href={`/sellers/${seller?._id || vehicle.sellerId}`} className="mt-1 inline-block text-[11px] font-bold text-[var(--hw-orange)] hover:underline sm:text-sm">
              {t("listing.viewProfile")}
            </Link>
          ) : null}
          <div className="mt-3.5 sm:mt-5">
            <SellerContact listingId={vehicle._id} listingType="vehicle" redirectTo={`/vehicles/${vehicle._id}`} sellerId={seller?._id || vehicle.sellerId} />
          </div>
          <div className="mt-3.5 rounded-lg bg-[var(--hw-bg-deep)] p-3 text-[11px] leading-5 text-[var(--hw-text-secondary)] sm:mt-5 sm:p-4 sm:text-sm sm:leading-6">
            {t("veh.safetyNote")}
          </div>
        </aside>

        <div className="order-3 grid min-w-0 gap-3 sm:gap-4 lg:col-start-1 lg:row-start-2">
          <QuickSpecs items={quickSpecs} />

          <Panel title={t("listing.overview")}>
            <TranslatedText
              primary={descPrimary}
              secondary={descSecondary}
              showLabel={showLabel}
              hideLabel={hideLabel}
              className="text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base sm:leading-7"
            />
          </Panel>

          <Panel title={t("listing.specifications")}>
            <SpecGrid specs={specs} />
          </Panel>

          {Number(vehicle.price) > 0 ? (
            <div className="grid gap-2">
              <Link
                href={`/services/loan-calculator?price=${vehicle.price}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--hw-border-strong)] px-4 text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-orange)] sm:text-sm"
              >
                🧮 {t("veh.calculateFinancing")}
              </Link>
              <PriceFairnessBadge price={vehicle.price} estimate={priceEstimate} t={t} />
            </div>
          ) : null}
        </div>
      </div>

      <section className="mt-6 sm:mt-10">
        <Comments listingId={vehicle._id} listingType="vehicle" sellerId={seller?._id || vehicle.sellerId} />
      </section>

      {similar.length ? (
        <section className="mt-6 sm:mt-10">
          <h2 className="mb-3 text-[17px] font-black text-[var(--hw-text-primary)] sm:mb-5 sm:text-2xl">{t("listing.similar")}</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3">
            {similar.map((item) => (
              <VehicleCard key={item._id} vehicle={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
