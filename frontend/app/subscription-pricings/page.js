import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import PlanBanners from "@/components/marketing/PlanBanners";
import { getT } from "@/lib/i18n-server";

export const revalidate = 3600;

export const metadata = {
  title: "Subscription pricing — HeavyWheels",
  description:
    "Compare HeavyWheels dealer plans and one-time ad boosts. Free, Starter, Pro, Elite and Elite Pro — featured slots, longer listings, and lower fees as you scale.",
};

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

async function getJson(path, fallback) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return json.data ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function SubscriptionPricingsPage() {
  const [planData, boostData] = await Promise.all([
    getJson("/subscriptions/plans", null),
    getJson("/ad-upgrades/options", null),
  ]);

  const plans = planData?.plans || [];
  const boosts = boostData?.boosts || [];
  const t = await getT();

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] hw-subtle-grid">
        <div className="hw-container py-7 text-center sm:py-12 lg:py-16">
          <p className="text-[10px] font-black uppercase tracking-wide text-[var(--hw-orange)] sm:text-xs">{t("pricing.eyebrow")}</p>
          <h1 className="mx-auto mt-2 max-w-2xl text-[24px] font-black leading-tight text-[var(--hw-text-primary)] sm:mt-3 sm:text-4xl md:text-5xl">
            {t("pricing.heroTitle")}
          </h1>
          <p className="mx-auto mt-2.5 max-w-xl text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-4 sm:text-lg sm:leading-8">
            {t("pricing.heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Plan banners */}
      <section className="hw-container py-6 sm:py-10 lg:py-12">
        {plans.length ? (
          <PlanBanners plans={plans} free={planData?.free} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center sm:p-12">
            <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("pricing.loadingTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--hw-text-secondary)] sm:text-base">
              {t("pricing.loadingBody")}
            </p>
          </div>
        )}
      </section>

      {/* One-time boosts */}
      {boosts.length ? (
        <section className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
          <div className="hw-container py-7 sm:py-12 lg:py-14">
            <h2 className="text-[17px] font-black text-[var(--hw-text-primary)] sm:text-2xl">{t("pricing.boostsTitle")}</h2>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-2 sm:text-base sm:leading-7">
              {t("pricing.boostsSubBefore")}<strong className="text-[var(--hw-text-primary)]">{t("pricing.boostsMyAds")}</strong>{t("pricing.boostsSubAfter")}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-3">
              {boosts.map((b) => (
                <div
                  key={b.key}
                  className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 transition hover:border-[var(--hw-orange)] sm:p-5"
                >
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <h3 className="text-[13px] font-black capitalize text-[var(--hw-text-primary)] sm:text-base">{b.key}</h3>
                    <span className="text-sm font-black text-[var(--hw-orange)] sm:text-lg">Rs {fmt(b.price)}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-[var(--hw-text-secondary)] sm:mt-2 sm:text-sm sm:leading-6">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="hw-container py-7 text-center sm:py-12">
        <p className="text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base sm:leading-7">
          {t("pricing.ctaBefore")}
          <Link href="/dashboard/billing" className="font-bold text-[var(--hw-orange)] hover:underline">
            {t("pricing.choosePlan")}
          </Link>
          {t("pricing.ctaOr")}
          <Link href="/post-ad" className="font-bold text-[var(--hw-orange)] hover:underline">
            {t("pricing.postFreeAd")}
          </Link>
          {t("pricing.ctaAfter")}
        </p>
      </section>
    </main>
  );
}
