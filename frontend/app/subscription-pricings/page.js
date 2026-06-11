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
        <div className="hw-container py-16 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-[var(--hw-orange)]">{t("pricing.eyebrow")}</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-black text-[var(--hw-text-primary)] md:text-5xl">
            {t("pricing.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--hw-text-secondary)]">
            {t("pricing.heroSubtitle")}
          </p>
        </div>
      </section>

      {/* Plan banners */}
      <section className="hw-container py-12">
        {plans.length ? (
          <PlanBanners plans={plans} free={planData?.free} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-12 text-center">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("pricing.loadingTitle")}</h2>
            <p className="mt-2 text-[var(--hw-text-secondary)]">
              {t("pricing.loadingBody")}
            </p>
          </div>
        )}
      </section>

      {/* One-time boosts */}
      {boosts.length ? (
        <section className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
          <div className="hw-container py-14">
            <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("pricing.boostsTitle")}</h2>
            <p className="mt-2 max-w-2xl text-[var(--hw-text-secondary)]">
              {t("pricing.boostsSubBefore")}<strong className="text-[var(--hw-text-primary)]">{t("pricing.boostsMyAds")}</strong>{t("pricing.boostsSubAfter")}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boosts.map((b) => (
                <div
                  key={b.key}
                  className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 transition hover:border-[var(--hw-orange)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black capitalize text-[var(--hw-text-primary)]">{b.key}</h3>
                    <span className="text-lg font-black text-[var(--hw-orange)]">Rs {fmt(b.price)}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="hw-container py-12 text-center">
        <p className="text-[var(--hw-text-secondary)]">
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
