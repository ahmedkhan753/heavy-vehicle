"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/Context/AuthContext";
import { useLanguage } from "@/Context/LanguageContext";
import { userApi, vehicleApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import PlanBadge from "@/components/marketing/PlanBadge";
import { getPlanMeta, isPaidPlan } from "@/lib/plans";

const StatIcon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{d}</svg>
);

const statusVariant = (status) =>
  status === "active" ? "green" : status === "sold" ? "orange" : "default";

export default function DashboardHome() {
  const { isAuthenticated, user, loading } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [ads, setAds] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      userApi.profile().catch(() => null),
      vehicleApi.myAds({ limit: 5 }).catch(() => null),
    ]).then(([profileRes, adsRes]) => {
      setProfile(profileRes?.data || null);
      setAds(adsRes?.data || []);
    });
  }, [isAuthenticated]);

  if (loading) return <DashboardShell title={t("common.loading")} />;

  if (!isAuthenticated) {
    return (
      <DashboardShell title={t("dash.loginRequired")}>
        <p className="text-[var(--hw-text-secondary)]">{t("dash.loginToViewDash")}</p>
        <Link href="/auth/login?redirect=/dashboard" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
          {t("nav.login")}
        </Link>
      </DashboardShell>
    );
  }

  // Live count comes straight from the profile endpoint (status "active" AND
  // not expired. Deleted, sold or expired ads never count). Never fall back
  // to user.totalAds — that's a lifetime counter and stays inflated.
  const activeAds = profile?.activeAds ?? 0;
  const totalViews = ads.reduce((sum, ad) => sum + Number(ad.views || 0), 0);
  const isDealer = user?.role === "dealer";
  const plan = user?.plan || profile?.plan;
  const planMeta = getPlanMeta(plan);
  const onTopTier = plan === "elite" || plan === "elitePro";

  const stats = [
    {
      label: t("dash.activeAds"),
      value: activeAds,
      accent: "var(--hw-orange)",
      icon: <StatIcon d={<><path d="M3 7h18M3 12h18M3 17h12" /></>} />,
    },
    {
      label: t("dash.totalViews"),
      value: totalViews || profile?.totalViews || 0,
      accent: "var(--hw-cyan)",
      icon: <StatIcon d={<><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></>} />,
    },
    {
      label: t("dash.savedAds"),
      value: profile?.savedAds?.length || 0,
      accent: "var(--hw-green)",
      icon: <StatIcon d={<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />} />,
    },
    {
      label: t("dash.accountType"),
      value: profile?.role || user?.role || "user",
      accent: "var(--hw-blue)",
      icon: <StatIcon d={<><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>} />,
    },
  ];

  return (
    <>
      {/* Plan banner */}
      <div
        className="mb-3 flex items-center justify-between gap-3 rounded-xl border bg-[var(--hw-bg-card)] p-3 sm:mb-5 sm:p-5"
        style={{
          borderColor: `color-mix(in srgb, ${planMeta.color} 55%, transparent)`,
          background: `linear-gradient(120deg, color-mix(in srgb, ${planMeta.color} 12%, var(--hw-bg-card)), var(--hw-bg-card) 60%)`,
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <PlanBadge plan={plan} size="lg" />
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--hw-text-muted)] sm:text-sm">{t("dash.yourPlan") || "Your plan"}</p>
            <p className="truncate text-[13px] font-black text-[var(--hw-text-primary)] sm:text-base">
              {isPaidPlan(plan) ? `${planMeta.name} seller` : "Free account"}
            </p>
          </div>
        </div>
        <Link
          href={onTopTier ? "/dashboard/billing" : "/subscription-pricings"}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg px-3 text-[12px] font-black text-[var(--hw-text-inverse)] sm:h-10 sm:px-5 sm:text-sm"
          style={{ background: planMeta.color }}
        >
          {onTopTier ? "Manage" : "Upgrade"}
        </Link>
      </div>

      {/* Stat cards — 2-up on phones instead of four full-width blocks */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[11px] text-[var(--hw-text-muted)] sm:text-sm">{s.label}</p>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9" style={{ color: s.accent, background: "var(--hw-soft-panel)" }}>
                {s.icon}
              </span>
            </div>
            <p className="mt-1.5 truncate text-xl font-black capitalize text-[var(--hw-text-primary)] sm:mt-3 sm:text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-[1fr_320px]">
        {/* Recent ads */}
        <section className="min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("dash.recentAds")}</h2>
            <Link href="/dashboard/my-ads" className="shrink-0 text-[11px] font-bold text-[var(--hw-orange)] hover:underline sm:text-sm">{t("dash.manageAds")}</Link>
          </div>
          <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-3">
            {ads.length ? ads.map((ad) => (
              <Link key={ad._id} href={`/vehicles/${ad._id}`} className="flex items-center gap-2.5 rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-2.5 transition hover:border-[var(--hw-orange)] sm:gap-3 sm:p-3">
                <Thumb ad={ad} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[var(--hw-text-primary)] sm:text-base">{ad.title}</p>
                  <p className="mt-0.5 text-[12px] font-bold text-[var(--hw-text-secondary)] sm:mt-1 sm:text-sm">{formatPrice(ad.price, ad.priceDisplay)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={statusVariant(ad.status)}>{ad.status}</Badge>
                  <span className="whitespace-nowrap text-[10px] text-[var(--hw-text-muted)] sm:text-xs">{ad.views || 0} {t("dash.viewsWord")}</span>
                </div>
              </Link>
            )) : (
              <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] p-5 text-center sm:p-8">
                <p className="text-[13px] text-[var(--hw-text-secondary)] sm:text-base">{t("dash.noAds")}</p>
                <Link href="/post-ad" className="mt-3 inline-flex h-10 items-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] sm:mt-4 sm:text-sm">{t("dash.postNewAd")}</Link>
              </div>
            )}
          </div>
        </section>

        {/* Role-aware callout */}
        <aside className="min-w-0 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
          <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">
            {isDealer ? t("dash.dealerProfile") : t("dash.upgradeDealer")}
          </h2>
          <p className="mt-1.5 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-2 sm:text-sm">
            {isDealer ? t("dash.dealerHint") : t("dash.upgradeHint")}
          </p>
          <Link
            href={isDealer ? "/dealers" : "/dealers/register"}
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-4 text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] sm:mt-4 sm:h-11 sm:text-sm"
          >
            {isDealer ? t("dealer.title") : t("dealer.become")}
          </Link>
        </aside>
      </div>
    </>
  );
}

function Thumb({ ad }) {
  const cover = ad.images?.find((i) => i.isCover)?.url || ad.images?.[0]?.url;
  return (
    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--hw-bg-elevated)]">
      {cover ? (
        <Image src={cover} alt="" width={64} height={48} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

function DashboardShell({ title, children }) {
  return (
    <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8">
      <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{title}</h2>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
