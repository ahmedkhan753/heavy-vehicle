import Link from "next/link";
import Image from "next/image";
import VehicleCard from "@/components/vehicles/VehicleCard";
import PartCard from "@/components/parts/PartCard";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { getPlanMeta, isPaidPlan } from "@/lib/plans";
import { SERVER_API_BASE_URL } from "@/lib/api";
import { cityLabel } from "@/lib/constants";
import { getT, getLang } from "@/lib/i18n-server";
import { Icon } from "@/components/listing/ListingBits";

export const revalidate = 60;

async function getDealer(id) {
  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/dealers/${id}`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error("Failed");
    return response.json();
  } catch {
    return { data: null };
  }
}

export default async function DealerProfilePage({ params }) {
  const { id } = await params;
  const result = await getDealer(id);
  const dealer = result.data?.dealer;
  const listings = result.data?.listings || [];
  const partListings = result.data?.partListings || [];
  const totalActive = result.data?.totalActive ?? listings.length + partListings.length;
  const plan = dealer?.userId?.plan;
  const planMeta = getPlanMeta(plan);
  const t = await getT();
  const lang = await getLang();

  if (!dealer) {
    return (
      <main className="hw-container py-16">
        <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h1 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("dealer.notFound")}</h1>
          <Link href="/dealers" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("dealerp.backToDealers")}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      {dealer.approvalStatus !== "approved" ? (
        <p className="mb-3 rounded-lg border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] px-3 py-2 text-[12px] font-bold text-[var(--hw-orange)] sm:text-sm">
          {dealer.approvalStatus === "pending" ? t("dealerForm.pendingTitle") : t("dealerForm.rejectedTitle")}
        </p>
      ) : null}

      {/* Header: cover strip, then the logo — the two used to overlap
          (avatar-over-banner style), but with no uploaded photo it was just
          a plain letter tile half-submerged in the gradient, reading as
          clipped rather than intentional. A plain stacked layout is clearer,
          especially at the mobile sizes this renders at most. */}
      <section style={planBorderStyle(plan)} className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {/* NOTE: --hw-bg-elevated is a near-white tile colour even in dark
            mode (it backs small icon chips), so using it here painted a solid
            white band. Cover falls back to a dark branded gradient instead. */}
        <div
          className="relative h-20 sm:h-28"
          style={{
            background: isPaidPlan(plan)
              ? `linear-gradient(120deg, color-mix(in srgb, ${planMeta.color} 45%, var(--hw-bg-deep)), var(--hw-bg-deep))`
              : `linear-gradient(120deg, color-mix(in srgb, var(--hw-orange) 28%, var(--hw-bg-deep)), var(--hw-bg-deep))`,
          }}
        >
          {dealer.coverImage?.url ? <Image src={dealer.coverImage.url} alt="" fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" /> : null}
          <div className="absolute inset-0 hw-subtle-grid opacity-40" />
        </div>

        <div className="p-3.5 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-black text-[var(--hw-text-inverse)] sm:h-20 sm:w-20 sm:text-2xl"
              style={{ background: isPaidPlan(plan) ? planMeta.color : "var(--hw-orange)" }}
            >
              {dealer.logo?.url ? <Image src={dealer.logo.url} alt="" width={80} height={80} className="h-full w-full object-cover" /> : dealer.businessName?.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">
                  {dealer.isVerified ? t("dealerp.verifiedDealer") : t("dealerp.dealer")}
                </p>
                <PlanBadge plan={plan} size="sm" hideFree />
              </div>
              <h1 className="mt-0.5 truncate text-lg font-black text-[var(--hw-text-primary)] sm:text-3xl">{dealer.businessName}</h1>
            </div>
          </div>

          {dealer.tagline ? (
            <p className="mt-2 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base">{dealer.tagline}</p>
          ) : null}

          {/* Quick facts */}
          <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            <Fact icon="pin">{cityLabel(dealer.city, lang)}</Fact>
            <Fact icon="box">{totalActive} {t("dealerp.activeAds")}</Fact>
            <Fact icon="tag">{t(`dealerForm.spec.${dealer.specialization || "vehicles"}`)}</Fact>
            {dealer.establishedYear ? <Fact icon="calendar">{dealer.establishedYear}</Fact> : null}
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:gap-3">
            {dealer.phone ? (
              <a href={`tel:${dealer.phone}`} className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-green)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
                {t("contact.call")}
              </a>
            ) : null}
            {dealer.whatsapp ? (
              <a href={`https://wa.me/${dealer.whatsapp}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] sm:text-sm">
                {t("contact.whatsapp")}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-3 grid gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("dealer.inventory")}</h2>
            <span className="shrink-0 text-[11px] font-bold text-[var(--hw-text-muted)] sm:text-sm">{totalActive}</span>
          </div>
          {listings.length || partListings.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-4">
              {listings.map((item) => <VehicleCard key={`v-${item._id}`} vehicle={item} />)}
              {partListings.map((item) => <PartCard key={`p-${item._id}`} part={item} />)}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-[var(--hw-border-default)] p-5 text-center text-[13px] text-[var(--hw-text-secondary)] sm:mt-5 sm:p-6 sm:text-base">{t("dealerp.noListings")}</p>
          )}
        </div>

        <aside className="h-fit min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
          {dealer.warranty?.status === "approved" ? (
            <div className="mb-3.5 rounded-lg border border-[var(--hw-green)] bg-[var(--hw-soft-panel)] p-3 sm:mb-5 sm:p-4">
              <p className="flex items-center gap-2 text-[13px] font-black text-[var(--hw-green)] sm:text-sm">{t("dealerp.verifiedWarranty")}</p>
              {dealer.warranty.terms ? (
                <p className="mt-1.5 whitespace-pre-line text-[12px] text-[var(--hw-text-secondary)] sm:text-sm">{dealer.warranty.terms}</p>
              ) : null}
              <p className="mt-1.5 text-[10px] text-[var(--hw-text-muted)] sm:text-xs">{t("dealerp.warrantyNote")}</p>
            </div>
          ) : null}

          <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("dealer.businessDetails")}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-sm">
            {dealer.description || dealer.tagline || t("dealerp.fallbackDesc")}
          </p>
          <dl className="mt-3 grid gap-2 text-[12px] sm:text-sm">
            <Row label={t("dealerp.addressLabel")} value={dealer.address} fallback={t("veh.notListed")} />
            <Row label={t("dealerp.workingHours")} value={dealer.workingHours} fallback={t("veh.notListed")} />
            <Row label={t("dealerForm.businessType")} value={dealer.businessType} />
          </dl>
        </aside>
      </section>
    </main>
  );
}

// Small pill for the at-a-glance row under the dealer name.
function Fact({ icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] px-2 py-1 text-[11px] font-bold text-[var(--hw-text-secondary)] sm:px-2.5 sm:text-xs">
      <Icon name={icon} className="h-3.5 w-3.5 shrink-0 text-[var(--hw-orange)]" />
      {children}
    </span>
  );
}

function Row({ label, value, fallback }) {
  if (!value && !fallback) return null;
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--hw-border-subtle)] pb-2 last:border-b-0 last:pb-0">
      <dt className="shrink-0 text-[var(--hw-text-muted)]">{label}</dt>
      <dd className="text-end font-bold capitalize text-[var(--hw-text-primary)]">{value || fallback}</dd>
    </div>
  );
}
