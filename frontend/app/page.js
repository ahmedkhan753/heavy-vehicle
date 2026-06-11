import Link from "next/link";
import Image from "next/image";
import VehicleCard from "@/components/vehicles/VehicleCard";
import BrandBrowse from "@/components/home/BrandBrowse";
import CategoryBrowse from "@/components/home/CategoryBrowse";
import { API_BASE_URL } from "@/lib/api";
import { CITIES, VEHICLE_TYPES, fallbackImage, typeLabel, cityLabel } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";

export const revalidate = 60;

async function getHomeData() {
  try {
    const [featuredRes, latestRes, dealersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/vehicles/featured?limit=4`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/vehicles?limit=6&sort=newest`, { next: { revalidate: 60 } }),
      fetch(`${API_BASE_URL}/dealers?limit=4&verified=true`, { next: { revalidate: 60 } }),
    ]);

    const featured = featuredRes.ok ? await featuredRes.json() : { data: [] };
    const latest = latestRes.ok ? await latestRes.json() : { data: [] };
    const dealers = dealersRes.ok ? await dealersRes.json() : { data: [] };

    return {
      featured: featured.data || [],
      latest: latest.data || [],
      dealers: dealers.data || [],
    };
  } catch {
    return { featured: [], latest: [], dealers: [] };
  }
}

export default async function HomePage() {
  const { featured, latest, dealers } = await getHomeData();
  const vehicles = featured.length ? featured : latest;
  const t = await getT();
  const lang = await getLang();

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--hw-border-subtle)]">
        <Image src={fallbackImage} alt="Heavy truck on highway" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,10,15,0.96),rgba(7,10,15,0.82)_48%,rgba(7,10,15,0.35))]" />
        <div className="absolute inset-0 hw-subtle-grid opacity-40" />

        <div className="hw-container relative grid min-h-[650px] items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[var(--hw-border-default)] bg-black/30 px-3 py-2 text-xs font-bold text-[var(--hw-text-secondary)]">
              {t("home.heroBadge")}
              <span className="h-1 w-1 rounded-full bg-[var(--hw-green)]" />
            </div>
            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">
              {t("home.heroTitle2")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">
              {t("home.heroSubtitle2")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vehicles" className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-6 text-sm font-black text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)]">
                {t("home.browseVehicles")}
              </Link>
              <Link href="/post-ad" className="inline-flex h-12 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-6 text-sm font-bold text-white hover:bg-white/15">
                {t("nav.postFreeAd")}
              </Link>
            </div>
          </div>

          <form action="/vehicles" className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 shadow-2xl">
            <h2 className="mb-4 text-xl font-black text-[var(--hw-text-primary)]">{t("home.findVehicles")}</h2>
            <div className="grid gap-3">
              <input name="q" className="h-12 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder={t("home.searchPlaceholder")} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select name="type" label={t("filter.type")} allText={t("filter.allTypes")} options={VEHICLE_TYPES.slice(0, 8)} lang={lang} />
                <Select name="city" label={t("filter.city")} allText={t("filter.allCities")} options={CITIES.slice(0, 8)} lang={lang} />
              </div>
              <button className="mt-1 h-12 rounded-lg bg-[var(--hw-green)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
                {t("home.searchBtn")}
              </button>
            </div>
          </form>
        </div>
      </section>

      <main>
        <section className="hw-section hw-container">
          <SectionHeader eyebrow={t("home.browseEyebrow")} title={t("home.browseTitle")} action={t("common.viewAll")} href="/vehicles" />
          <CategoryBrowse />
        </section>

        <section className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
          <div className="hw-section hw-container">
            <SectionHeader eyebrow={t("home.brandsEyebrow")} title={t("home.brandsTitle")} action={t("common.viewAll")} href="/vehicles" />
            <BrandBrowse />
          </div>
        </section>

        <section className="border-y border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
          <div className="hw-section hw-container">
            <SectionHeader eyebrow={t("page.listings")} title={featured.length ? t("home.featured") : t("home.latestListings")} action={t("home.seeAllListings")} href="/vehicles" />
            {vehicles.length ? (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {vehicles.slice(0, 4).map((vehicle) => <VehicleCard key={vehicle._id} vehicle={vehicle} />)}
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
                <Link key={dealer._id} href={`/dealers/${dealer._id}`} className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 hover:border-[var(--hw-orange)]">
                  <h3 className="font-black text-[var(--hw-text-primary)]">{dealer.businessName}</h3>
                  <p className="mt-2 text-sm text-[var(--hw-text-muted)]">{titleCase(dealer.city)} | {dealer.totalListings || 0} {t("dealer.listingsWord")}</p>
                  <p className="mt-4 text-sm text-[var(--hw-text-secondary)]">{dealer.tagline || t("dealer.fallbackTag")}</p>
                </Link>
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

function Select({ name, label, allText, options, lang }) {
  return (
    <label className="text-xs font-bold uppercase text-[var(--hw-text-muted)]">
      {label}
      <select name={name} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm font-medium text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]">
        <option value="">{allText || label}</option>
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const labelText = typeof option === "string" ? cityLabel(option, lang) : typeLabel(option, lang);
          return <option key={value} value={value}>{labelText}</option>;
        })}
      </select>
    </label>
  );
}

function SectionHeader({ eyebrow, title, action, href }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-bold uppercase text-[var(--hw-orange)]">{eyebrow}</p>
        <h2 className="text-2xl font-black text-[var(--hw-text-primary)] md:text-3xl">{title}</h2>
      </div>
      {action ? <Link href={href} className="text-sm font-bold text-[var(--hw-orange)] hover:text-[var(--hw-amber)]">{action}</Link> : null}
    </div>
  );
}

function EmptyState({ title, body, href, action }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
      <h3 className="text-xl font-black text-[var(--hw-text-primary)]">{title}</h3>
      <p className="mt-2 text-[var(--hw-text-secondary)]">{body}</p>
      <Link href={href} className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{action}</Link>
    </div>
  );
}
