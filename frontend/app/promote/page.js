import Link from "next/link";
import { SERVER_API_BASE_URL } from "@/lib/api";
import { getT } from "@/lib/i18n-server";

export const revalidate = 3600;

export const metadata = {
  title: "Promote Your Ad",
  description: "Feature your listing or subscribe as a dealer to sell heavy vehicles faster on HeavyWheels Pakistan.",
};

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

async function getJson(path) {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Failed");
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export default async function PromotePage() {
  const [boostData, planData] = await Promise.all([
    getJson("/ad-upgrades/options"),
    getJson("/subscriptions/plans"),
  ]);

  const boosts = boostData?.boosts || [];
  const plans = planData?.plans || [];
  const t = await getT();
  const slotLabel = (n) => (n === -1 ? t("promote.unlimited") : n);

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
        <div className="hw-container py-16 text-center">
          <p className="text-xs font-black uppercase tracking-wide text-[var(--hw-orange)]">{t("promote.eyebrow")}</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-black text-[var(--hw-text-primary)] md:text-5xl">
            {t("promote.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--hw-text-secondary)]">
            {t("promote.heroSubtitle")}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/my-ads" className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-6 text-sm font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]">
              {t("promote.boostAnAd")}
            </Link>
            <Link href="/dashboard/billing" className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-6 text-sm font-black text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)]">
              {t("promote.viewDealerPlans")}
            </Link>
            <Link href="/featured" className="inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-bold text-[var(--hw-text-secondary)] underline hover:text-[var(--hw-orange)]">
              {t("promote.seeFeatured")}
            </Link>
          </div>
        </div>
      </section>

      {/* One-time boosts */}
      <section className="hw-container py-14">
        <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("promote.boostSingleTitle")}</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">{t("promote.boostSingleSub")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boosts.map((b) => (
            <div key={b.key} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black capitalize text-[var(--hw-text-primary)]">{b.key}</h3>
                <span className="text-lg font-black text-[var(--hw-orange)]">Rs {fmt(b.price)}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">{b.label}</p>
            </div>
          ))}
        </div>
        <Link href="/dashboard/my-ads" className="mt-6 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
          {t("promote.boostMyAds")}
        </Link>
      </section>

      {/* Dealer plans */}
      <section className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
        <div className="hw-container py-14">
          <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("promote.dealerPlansTitle")}</h2>
          <p className="mt-2 text-[var(--hw-text-secondary)]">{t("promote.dealerPlansSub")}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.key} className={`flex flex-col rounded-xl border bg-[var(--hw-bg-card)] p-6 ${p.key === "pro" ? "border-[var(--hw-orange)]" : "border-[var(--hw-border-default)]"}`}>
                {p.key === "pro" ? <span className="mb-2 inline-block w-fit rounded-full bg-[var(--hw-orange)] px-3 py-0.5 text-[10px] font-black uppercase text-[var(--hw-text-inverse)]">{t("promote.mostPopular")}</span> : null}
                <h3 className="text-xl font-black text-[var(--hw-text-primary)]">{p.name}</h3>
                <p className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">Rs {fmt(p.monthly)}<span className="text-sm font-bold text-[var(--hw-text-muted)]">{t("promote.perMonth")}</span></p>
                <ul className="mt-4 grid flex-1 gap-2 text-sm text-[var(--hw-text-secondary)]">
                  <li>★ {slotLabel(p.featuredSlots)} {t("promote.featuredSlots")}</li>
                  {p.premiumSlots ? <li>★ {p.premiumSlots} {t("promote.premiumSlots")}</li> : null}
                  <li>★ {slotLabel(p.maxActiveAds)} {t("promote.activeAdsWord")}</li>
                  <li>★ {p.graceDays} {t("promote.graceSettle")}</li>
                </ul>
                <Link href="/dashboard/billing" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]">
                  {t("promote.choose")} {p.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--hw-text-muted)]">{t("promote.annualNote")}</p>
        </div>
      </section>

      {/* Free tier note */}
      <section className="hw-container py-12 text-center">
        <p className="text-[var(--hw-text-secondary)]">
          {t("promote.freeNoteBefore")}<strong className="text-[var(--hw-text-primary)]">{planData?.free?.maxActiveAds ?? 5} {t("promote.freeActiveAds")}</strong>{t("promote.freeNoteAfter")}
        </p>
      </section>
    </main>
  );
}
