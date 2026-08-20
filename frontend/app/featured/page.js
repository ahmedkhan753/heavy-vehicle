import Link from "next/link";
import { SERVER_API_BASE_URL } from "@/lib/api";
import VehicleCard from "@/components/vehicles/VehicleCard";
import PartCard from "@/components/parts/PartCard";
import PlanBanners from "@/components/marketing/PlanBanners";
import { getT } from "@/lib/i18n-server";

export const revalidate = 60;

export const metadata = {
  title: "Featured listings — HeavyWheels",
  description: "Browse featured heavy vehicles and spare parts on HeavyWheels Pakistan.",
};

async function getJson(path, fallback) {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function FeaturedPage() {
  const [vehicles, parts, planData] = await Promise.all([
    getJson("/vehicles/featured?limit=24", []),
    getJson("/parts/featured?limit=12", []),
    getJson("/subscriptions/plans", null),
  ]);
  const t = await getT();

  const empty = vehicles.length === 0 && parts.length === 0;

  return (
    <main className="hw-container py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("featured.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("home.featured")}</h1>
          <p className="mt-2 max-w-xl text-[var(--hw-text-secondary)]">{t("featured.subtitle")}</p>
        </div>
        <Link href="/promote" className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
          {t("featured.featureYourAd")}
        </Link>
      </div>

      <PlanBanners plans={planData?.plans || []} free={planData?.free} t={t} />

      {empty ? (
        <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-12 text-center">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("featured.emptyTitle")}</h2>
          <p className="mt-2 text-[var(--hw-text-secondary)]">{t("featured.emptyBody")}</p>
          <Link href="/promote" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("featured.seeHow")}</Link>
        </div>
      ) : null}

      {vehicles.length ? (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-black text-[var(--hw-text-primary)]">{t("featured.vehiclesTitle")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vehicles.map((v) => <VehicleCard key={v._id} vehicle={v} />)}
          </div>
        </section>
      ) : null}

      {parts.length ? (
        <section>
          <h2 className="mb-4 text-xl font-black text-[var(--hw-text-primary)]">{t("featured.partsTitle")}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {parts.map((p) => <PartCard key={p._id} part={p} />)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
