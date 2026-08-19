import Link from "next/link";
import PlanIcon from "@/components/marketing/PlanIcon";

/**
 * PlanBanners
 * Vibrant, animated subscription-plan banners for the Featured page.
 * Server component — all motion is CSS (see .hw-neon-card in globals.css),
 * so it ships zero client JS. Each tier carries its own neon accent.
 *
 * Plan data comes from GET /subscriptions/plans (see PromotePage); the Free
 * tier is passed separately as { maxActiveAds, graceDays }.
 */

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const slots = (n) => (n === -1 ? "Unlimited" : n);
const pct = (rate) => `${(Number(rate || 0) * 100).toFixed(2).replace(/\.?0+$/, "")}%`;

// Per-tier presentation: neon accent + one-line pitch. Keyed by plan key.
const TIERS = {
  free: { neon: "var(--hw-text-muted)", tag: "Get started" },
  starter: { neon: "var(--hw-cyan)", tag: "For growing sellers" },
  pro: { neon: "var(--hw-orange)", tag: "Most popular", featured: true },
  elite: { neon: "var(--hw-blue)", tag: "Full-scale dealers" },
  elitePro: { neon: "var(--hw-green)", tag: "High-volume — lowest fee", best: true },
};

function Feature({ children, neon }) {
  return (
    <li className="flex items-start gap-2">
      <span aria-hidden className="mt-0.5 shrink-0 text-sm font-black" style={{ color: neon }}>
        ✦
      </span>
      <span>{children}</span>
    </li>
  );
}

function PlanCard({ plan, neon, tag, featured, best, delay }) {
  const isFree = plan.key === "free";
  return (
    <div
      className={`hw-rise-in flex h-full flex-col rounded-2xl p-4 hw-neon-card sm:p-6${featured ? " hw-neon-card-featured" : ""}`}
      style={{ "--neon": neon, animationDelay: `${delay}ms` }}
    >
      {/* Name, badge and price share the top row on phones — stacking them
          cost three lines per card across five cards. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {(tag && (featured || best)) ? (
            <span
              className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide sm:mb-3 sm:px-3 sm:py-1 sm:text-[10px]"
              style={{ background: `color-mix(in srgb, ${neon} 18%, transparent)`, color: neon }}
            >
              {best ? "★ Best value" : "★ " + tag}
            </span>
          ) : (
            <span className="mb-1.5 block text-[9px] font-black uppercase tracking-wide sm:mb-3 sm:text-[10px]" style={{ color: neon }}>
              {tag}
            </span>
          )}

          <div className="flex items-center gap-2 sm:gap-2.5">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-lg ring-1 ring-white/10 sm:h-9 sm:w-9 sm:rounded-xl"
              style={{
                color: "#fff",
                background: `linear-gradient(135deg, color-mix(in srgb, ${neon} 70%, #000), ${neon})`,
              }}
            >
              <PlanIcon plan={plan.key} size={16} />
            </span>
            <h3 className="truncate text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{plan.name}</h3>
          </div>
        </div>

        <p className="flex shrink-0 items-baseline gap-1 sm:hidden">
          {isFree ? (
            <span className="text-xl font-black text-[var(--hw-text-primary)]">Free</span>
          ) : (
            <>
              <span className="text-[10px] font-bold text-[var(--hw-text-muted)]">Rs</span>
              <span className={`text-xl font-black ${featured || best ? "hw-shimmer" : "hw-neon-text"}`} style={{ "--neon": neon }}>
                {fmt(plan.monthly)}
              </span>
              <span className="text-[10px] font-bold text-[var(--hw-text-muted)]">/mo</span>
            </>
          )}
        </p>
      </div>

      {/* Price — full size from sm up */}
      <p className="mt-2 hidden items-baseline gap-1 sm:flex">
        {isFree ? (
          <span className="text-3xl font-black text-[var(--hw-text-primary)]">Free</span>
        ) : (
          <>
            <span className="text-sm font-bold text-[var(--hw-text-muted)]">Rs</span>
            <span className={`text-4xl font-black ${featured || best ? "hw-shimmer" : "hw-neon-text"}`} style={{ "--neon": neon }}>
              {fmt(plan.monthly)}
            </span>
            <span className="text-sm font-bold text-[var(--hw-text-muted)]">/mo</span>
          </>
        )}
      </p>

      {/* Features */}
      <ul className="mt-3 grid flex-1 gap-1.5 text-[12px] leading-5 text-[var(--hw-text-secondary)] sm:mt-5 sm:gap-2.5 sm:text-sm sm:leading-6">
        <Feature neon={neon}>
          {isFree ? "No featured slots" : `${slots(plan.featuredSlots)} featured slots`}
        </Feature>
        {!isFree && plan.premiumSlots ? (
          <Feature neon={neon}>{plan.premiumSlots} premium (homepage) slots</Feature>
        ) : null}
        <Feature neon={neon}>{slots(plan.maxActiveAds)} active ads</Feature>
        <Feature neon={neon}>{plan.graceDays} days to settle commission</Feature>
        <Feature neon={neon}>
          {plan.keepListings
            ? "Listings never auto-expire"
            : "Listings auto-expire after 30 days"}
        </Feature>
        <Feature neon={neon}>
          {plan.commissionRate < 0.002 ? (
            <span className="font-bold text-[var(--hw-text-primary)]">
              {pct(plan.commissionRate)} success fee · lowest on HeavyWheels
            </span>
          ) : (
            `${pct(plan.commissionRate)} success fee on a sale`
          )}
        </Feature>
      </ul>

      {/* CTA */}
      <Link
        href={isFree ? "/post-ad" : "/dashboard/billing"}
        className="mt-3.5 inline-flex h-10 items-center justify-center rounded-lg text-[13px] font-black transition sm:mt-6 sm:h-11 sm:text-sm"
        style={
          featured || best
            ? { background: neon, color: "var(--hw-text-inverse)" }
            : { border: `1px solid color-mix(in srgb, ${neon} 55%, transparent)`, color: "var(--hw-text-primary)" }
        }
      >
        {isFree ? "Post a free ad" : `Choose ${plan.name}`}
      </Link>
    </div>
  );
}

export default function PlanBanners({ plans = [], free }) {
  if (!plans.length) return null;

  // Build the Free tier as a card so the whole ladder is visible.
  const freeCard = free
    ? {
        key: "free",
        name: "Free",
        monthly: 0,
        featuredSlots: 0,
        premiumSlots: 0,
        maxActiveAds: free.maxActiveAds,
        graceDays: free.graceDays,
        keepListings: false,
        commissionRate: 0.002,
      }
    : null;

  const cards = [freeCard, ...plans].filter(Boolean);

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-3.5 hw-subtle-grid sm:mb-12 sm:rounded-3xl sm:p-8">
      <div className="mb-4 max-w-2xl sm:mb-7">
        <p className="text-[10px] font-black uppercase tracking-wide text-[var(--hw-orange)] sm:text-xs">Sell like a pro</p>
        <h2 className="mt-1.5 text-[17px] font-black leading-tight text-[var(--hw-text-primary)] sm:mt-2 sm:text-2xl md:text-3xl">
          Plans that put your ads up here
        </h2>
        <p className="mt-1.5 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-2 sm:text-base sm:leading-7">
          Featured slots, longer listings, and lower fees as you scale. Upgrade any time — pay once a month, cancel whenever.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((plan, i) => {
          const tier = TIERS[plan.key] || TIERS.starter;
          return (
            <PlanCard
              key={plan.key}
              plan={plan}
              neon={tier.neon}
              tag={tier.tag}
              featured={tier.featured}
              best={tier.best}
              delay={i * 90}
            />
          );
        })}
      </div>

      <p className="mt-4 text-[11px] text-[var(--hw-text-muted)] sm:mt-6 sm:text-sm">
        Annual billing available — pay for 10 months, get 12.{" "}
        <Link href="/promote" className="font-bold text-[var(--hw-orange)] hover:underline">
          Compare all plans →
        </Link>
      </p>
    </section>
  );
}
