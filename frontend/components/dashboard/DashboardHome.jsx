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
        className="mb-5 flex flex-col gap-3 rounded-xl border bg-[var(--hw-bg-card)] p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: `color-mix(in srgb, ${planMeta.color} 55%, transparent)`,
          background: `linear-gradient(120deg, color-mix(in srgb, ${planMeta.color} 12%, var(--hw-bg-card)), var(--hw-bg-card) 60%)`,
        }}
      >
        <div className="flex items-center gap-3">
          <PlanBadge plan={plan} size="lg" />
          <div>
            <p className="text-sm text-[var(--hw-text-muted)]">{t("dash.yourPlan") || "Your plan"}</p>
            <p className="font-black text-[var(--hw-text-primary)]">
              {isPaidPlan(plan) ? `${planMeta.name} seller` : "Free account"}
            </p>
          </div>
        </div>
        <Link
          href={onTopTier ? "/dashboard/billing" : "/subscription-pricings"}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-5 text-sm font-black text-[var(--hw-text-inverse)]"
          style={{ background: planMeta.color }}
        >
          {onTopTier ? "Manage plan" : "Upgrade plan"}
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--hw-text-muted)]">{s.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ color: s.accent, background: "var(--hw-soft-panel)" }}>
                {s.icon}
              </span>
            </div>
            <p className="mt-3 text-3xl font-black capitalize text-[var(--hw-text-primary)]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Recent ads */}
        <section className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("dash.recentAds")}</h2>
            <Link href="/dashboard/my-ads" className="text-sm font-bold text-[var(--hw-orange)] hover:underline">{t("dash.manageAds")}</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {ads.length ? ads.map((ad) => (
              <Link key={ad._id} href={`/vehicles/${ad._id}`} className="flex items-center gap-3 rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-3 transition hover:border-[var(--hw-orange)]">
                <Thumb ad={ad} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[var(--hw-text-primary)]">{ad.title}</p>
                  <p className="mt-1 text-sm font-bold text-[var(--hw-text-secondary)]">{formatPrice(ad.price, ad.priceDisplay)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant={statusVariant(ad.status)}>{ad.status}</Badge>
                  <span className="text-xs text-[var(--hw-text-muted)]">{ad.views || 0} {t("dash.viewsWord")}</span>
                </div>
              </Link>
            )) : (
              <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] p-8 text-center">
                <p className="text-[var(--hw-text-secondary)]">{t("dash.noAds")}</p>
                <Link href="/post-ad" className="mt-4 inline-flex h-10 items-center rounded-lg bg-[var(--hw-orange)] px-4 text-sm font-black text-[var(--hw-text-inverse)]">{t("dash.postNewAd")}</Link>
              </div>
            )}
          </div>
        </section>

        {/* Role-aware callout */}
        <aside className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">
            {isDealer ? t("dash.dealerProfile") : t("dash.upgradeDealer")}
          </h2>
          <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">
            {isDealer ? t("dash.dealerHint") : t("dash.upgradeHint")}
          </p>
          <Link
            href={isDealer ? "/dealers" : "/dealers/register"}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-4 text-sm font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)]"
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
