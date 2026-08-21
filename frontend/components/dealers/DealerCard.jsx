import Link from "next/link";
import Image from "next/image";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { titleCase } from "@/lib/format";
import { getT } from "@/lib/i18n-server";

/**
 * DealerCard — shared between the homepage dealer strip and /dealers.
 *
 * The dealer's own logo becomes the card's background (dark gradient
 * overlay for legibility) instead of sitting in a small corner avatar, so a
 * dealer who's uploaded a real photo actually gets to show it. Verified
 * badge and the seller's subscription plan (badge + tinted border, using
 * the same PlanBadge/planBorderStyle already used on listing pages) were
 * previously invisible here even though the data was already in the API
 * response — this just renders what was already being fetched.
 */
export default async function DealerCard({ dealer }) {
  const t = await getT();
  const plan = dealer.userId?.plan;
  const logoUrl = dealer.logo?.url;

  return (
    /* Shorter on phones so a dealer tile sits two-up next to another,
       matching the listing cards instead of taking a full-width slab each. */
    <Link
      href={`/dealers/${dealer._id}`}
      style={planBorderStyle(plan)}
      className="group relative block h-36 overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] transition hover:border-[var(--hw-orange)] sm:h-44"
    >
      {logoUrl ? (
        <>
          <Image src={logoUrl} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,15,0.35)_0%,rgba(7,10,15,0.55)_55%,rgba(7,10,15,0.92)_100%)]" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-[var(--hw-bg-elevated)]">
          {dealer.businessName?.slice(0, 1)}
        </div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-1 p-2 sm:gap-1.5 sm:p-3">
        {plan ? <PlanBadge plan={plan} size="sm" hideFree /> : <span />}
        {dealer.isVerified ? (
          // Icon-only on phones: at half width the word alongside the plan
          // badge pushed one of the two off the card.
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--hw-green)] px-1.5 py-0.5 text-[10px] font-black uppercase text-[var(--hw-text-inverse)] shadow sm:px-2">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            <span className="hidden sm:inline">{t("dealer.verified")}</span>
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5">
        <h3 className="truncate text-[13px] font-black text-white drop-shadow sm:text-base">{dealer.businessName}</h3>
        <p className="mt-0.5 truncate text-[10px] text-white/75 sm:text-[11px]">
          {titleCase(dealer.city)} · {dealer.activeListings ?? 0} {t("dealer.listingsWord")}
        </p>
        {/* The tagline truncates to nothing useful in a half-width card, so
            it only earns its line from the tablet breakpoint up. */}
        <p className="mt-1 hidden truncate text-[12px] text-white/60 sm:block">{dealer.tagline || t("dealer.fallbackTag")}</p>
      </div>
    </Link>
  );
}
