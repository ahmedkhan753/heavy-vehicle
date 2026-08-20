import Link from "next/link";
import Image from "next/image";
import VehicleCard from "@/components/vehicles/VehicleCard";
import PartCard from "@/components/parts/PartCard";
import BrandBrowse from "@/components/home/BrandBrowse";
import CategoryBrowse from "@/components/home/CategoryBrowse";
import PartCategoryBrowse from "@/components/home/PartCategoryBrowse";
import HomeHeroSearch from "@/components/home/HomeHeroSearch";
import DealerCard from "@/components/dealers/DealerCard";
import AdBanner from "@/components/ads/AdBanner";
import { SERVER_API_BASE_URL } from "@/lib/api";
import { fallbackImage } from "@/lib/constants";
import { getT } from "@/lib/i18n-server";

export const revalidate = 60;

// Homepage listings mix vehicles and parts together. Once paid plans are in
// wide use, ?limit here should mostly surface premium/featured slots — free
// ads fill whatever's left. Featured-first ordering already comes from the
// API (vehicle.controller via APIFeatures, part.controller via getSort), so
// merging two already-sorted lists and re-sorting by (featured, recency) is
// enough to interleave them correctly.
const HOME_LISTINGS_LIMIT = 24;

async function getHomeData() {
  try {
    const [vehiclesRes, partsRes, dealersRes] = await Promise.all([
      fetch(`${SERVER_API_BASE_URL}/vehicles?limit=${HOME_LISTINGS_LIMIT}&sort=newest`, { next: { revalidate: 60 } }),
      fetch(`${SERVER_API_BASE_URL}/parts?limit=${HOME_LISTINGS_LIMIT}&sort=newest`, { next: { revalidate: 60 } }),
      // Every admin-approved dealer belongs here. Filtering on verified=true
      // meant the section stayed empty until a dealer also earned the
      // separate "verified" badge, which almost none have.
      fetch(`${SERVER_API_BASE_URL}/dealers?limit=4`, { next: { revalidate: 60 } }),
    ]);

    const vehiclesJson = vehiclesRes.ok ? await vehiclesRes.json() : { data: [] };
    const partsJson = partsRes.ok ? await partsRes.json() : { data: [] };
    const dealers = dealersRes.ok ? await dealersRes.json() : { data: [] };

    const vehicles = (vehiclesJson.data || []).map((v) => ({ kind: "vehicle", item: v }));
    const parts = (partsJson.data || []).map((p) => ({ kind: "part", item: p }));

    const listings = [...vehicles, ...parts]
      .sort((a, b) => {
        if (!!a.item.featured !== !!b.item.featured) return a.item.featured ? -1 : 1;
        return new Date(b.item.bumpedAt || b.item.createdAt) - new Date(a.item.bumpedAt || a.item.createdAt);
      })
      .slice(0, HOME_LISTINGS_LIMIT);

    return {
      listings,
      dealers: dealers.data || [],
    };
  } catch {
    return { listings: [], dealers: [] };
  }
}

export default async function HomePage() {
  const { listings, dealers } = await getHomeData();
  const t = await getT();

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--hw-border-subtle)]">
        <Image src={fallbackImage} alt="Heavy truck on highway" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,15,0.96),rgba(7,10,15,0.82)_48%,rgba(7,10,15,0.35))]" />
        <div className="absolute inset-0 hw-subtle-grid opacity-40" />

        <div className="hw-container relative grid items-center gap-6 py-7 sm:py-10 lg:min-h-[650px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-12">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[var(--hw-border-default)] bg-black/30 px-2.5 py-1.5 text-[11px] font-bold text-[var(--hw-text-secondary)] sm:mb-5 sm:px-3 sm:py-2 sm:text-xs">
              {t("home.heroBadge")}
              <span className="h-1 w-1 rounded-full bg-[var(--hw-green)]" />
            </div>
            <h1 className="text-[26px] font-black leading-[1.15] text-white sm:text-4xl md:text-6xl">
              {t("home.heroTitle2")}
            </h1>
            <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-white/80 sm:mt-4 sm:text-lg sm:leading-8">
              {t("home.heroSubtitle2")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
              <Link href="/vehicles" className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)] sm:h-12 sm:px-6 sm:text-sm">
                {t("home.browseVehicles")}
              </Link>
              <Link href="/post-ad" className="inline-flex h-10 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-4 text-[13px] font-bold text-white hover:bg-white/15 sm:h-12 sm:px-6 sm:text-sm">
                {t("nav.postFreeAd")}
              </Link>
            </div>
          </div>

          <HomeHeroSearch />
        </div>
      </section>

      <main>
        <section className="hw-section hw-container">
          <SectionHeader eyebrow={t("home.browseEyebrow")} title={t("home.browseTitle")} action={t("common.viewAll")} href="/vehicles" />
          <CategoryBrowse />
        </section>

        <section className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
          <div className="hw-section hw-container">
            <SectionHeader eyebrow={t("home.partsEyebrow")} title={t("home.partsTitle")} action={t("common.viewAll")} href="/parts" />
            <PartCategoryBrowse />
          </div>
        </section>

        <section className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
          <div className="hw-section hw-container">
            <SectionHeader eyebrow={t("home.brandsEyebrow")} title={t("home.brandsTitle")} action={t("common.viewAll")} href="/vehicles" />
            <BrandBrowse />
          </div>
        </section>

        {/* Paid banner row — self-hides when no campaign is running. */}
        <section className="hw-container py-4 sm:py-6 empty:hidden">
          <AdBanner placement="home-mid" limit={3} />
        </section>

        <section className="border-y border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
          <div className="hw-section hw-container">
            <SectionHeader
              eyebrow={t("page.listings")}
              title={listings.some((l) => l.item.featured) ? t("home.featured") : t("home.latestListings")}
              action={t("home.seeAllListings")}
              href="/vehicles"
            />
            {listings.length ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map(({ kind, item }) =>
                  kind === "vehicle"
                    ? <VehicleCard key={item._id} vehicle={item} />
                    : <PartCard key={item._id} part={item} />
                )}
              </div>
            ) : (
              <EmptyState title={t("home.noListings")} body={t("home.noListingsBody")} href="/post-ad" action={t("nav.postFreeAd")} />
            )}
          </div>
        </section>

        <section className="hw-section hw-container">
          <SectionHeader eyebrow={t("page.dealers")} title={t("home.dealerNetwork")} action={t("home.browseDealers")} href="/dealers" />
          {dealers.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {dealers.map((dealer) => (
                <DealerCard key={dealer._id} dealer={dealer} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("dealer.noneTitle")} body={t("home.dealersEmptyBody")} href="/dealers/register" action={t("dealer.register")} />
          )}
        </section>

        <section className="hw-container pb-16">
          <div className="grid gap-6 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("home.readyTitle")}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/post-ad" className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-6 text-sm font-black text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)]">
                {t("nav.postFreeAd")}
              </Link>
              <Link href="/auth/register" className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-6 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">
                {t("auth.createAccount")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// Eyebrow + title on the left, "View all →" pinned to the right on the same
// row at every width — on a phone the old stacked variant burned three lines
// before any listing showed up.
function SectionHeader({ eyebrow, title, action, href }) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[var(--hw-orange)] sm:mb-2 sm:text-xs">{eyebrow}</p>
        <h2 className="text-[17px] font-black leading-tight text-[var(--hw-text-primary)] sm:text-2xl md:text-3xl">{title}</h2>
      </div>
      {action ? (
        <Link href={href} className="shrink-0 whitespace-nowrap text-[11px] font-bold text-[var(--hw-orange)] hover:text-[var(--hw-amber)] sm:text-sm">
          {action} <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}

function EmptyState({ title, body, href, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center sm:p-10">
      <h3 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm text-[var(--hw-text-secondary)] sm:text-base">{body}</p>
      <Link href={href} className="mt-4 inline-flex h-10 items-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] sm:mt-5 sm:h-11 sm:px-5 sm:text-sm">{action}</Link>
    </div>
  );
}
