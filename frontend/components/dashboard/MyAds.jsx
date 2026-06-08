"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { vehicleApi, subscriptionApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import BoostModal from "@/components/dashboard/BoostModal";

const slotLabel = (n) => (n === -1 ? "∞" : n);

const statusVariant = (status) =>
  status === "active" ? "green" : status === "sold" ? "orange" : "default";

export default function MyAds() {
  const { isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [ads, setAds] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState("all");
  const [usage, setUsage] = useState(null);
  const [boostAd, setBoostAd] = useState(null);

  async function loadAds() {
    const response = await vehicleApi.myAds().catch(() => ({ data: [] }));
    setAds(response.data || []);
  }

  async function loadUsage() {
    const res = await subscriptionApi.me().catch(() => null);
    setUsage(res?.data?.usage || null);
  }

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    vehicleApi.myAds().then((response) => {
      if (active) setAds(response.data || []);
    }).catch(() => {
      if (active) setAds([]);
    });
    subscriptionApi.me().then((res) => {
      if (active) setUsage(res?.data?.usage || null);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  async function toggleFeature(ad) {
    setBusyId(ad._id);
    try {
      if (ad.featured) {
        await subscriptionApi.unfeature(ad._id);
        toast.success("Listing un-featured");
      } else {
        await subscriptionApi.feature(ad._id);
        toast.success("Listing featured");
      }
      await Promise.all([loadAds(), loadUsage()]);
    } catch (err) {
      toast.error(err?.message || "Could not update featured status");
    } finally {
      setBusyId("");
    }
  }

  async function markSold(id) {
    const input = window.prompt("Enter the final sale price (PKR). A 0.2% commission will be recorded per the Terms.");
    if (input === null) return; // cancelled
    const salePrice = Number(String(input).replace(/[^\d]/g, ""));
    if (!salePrice || salePrice < 1) {
      toast.error("Please enter a valid sale price.");
      return;
    }
    // Optional buyer identity for two-party confirmation.
    const buyerContact = window.prompt("Buyer's registered email or phone (optional). If they confirm, the sale is verified by both sides. Leave blank to self-report.") || "";

    setBusyId(id);
    try {
      const res = await vehicleApi.markSold(id, salePrice, buyerContact.trim());
      toast.success(res?.message || t("dash.markSold"));
      await loadAds();
    } catch (err) {
      toast.error(err?.message || "Could not mark as sold");
    } finally {
      setBusyId("");
    }
  }

  async function remove(id) {
    if (!window.confirm(t("dash.deleteConfirm"))) return;
    setBusyId(id);
    try {
      await vehicleApi.remove(id);
      toast.success(t("dash.deleted"));
      await loadAds();
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">{t("common.loading")}</p>;
  if (!isAuthenticated) return <LoginPrompt t={t} />;

  const tabs = [
    { key: "all", label: t("dash.all") },
    { key: "active", label: t("dash.active") },
    { key: "sold", label: t("dash.sold") },
  ];
  const visible = filter === "all" ? ads : ads.filter((ad) => ad.status === filter);

  return (
    <div>
      {/* Featured slot usage */}
      {usage && usage.featuredSlots ? (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] px-4 py-3 text-sm">
          <span className="font-bold text-[var(--hw-text-secondary)]">
            Featured slots: <strong className="text-[var(--hw-text-primary)]">{usage.featuredUsed} / {slotLabel(usage.featuredSlots)}</strong>
          </span>
          <Link href="/dashboard/billing" className="font-bold text-[var(--hw-orange)] hover:underline">Manage plan</Link>
        </div>
      ) : null}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => {
          const count = tab.key === "all" ? ads.length : ads.filter((a) => a.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                filter === tab.key
                  ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                  : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-secondary)]"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {visible.length ? visible.map((ad) => (
          <div key={ad._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Thumb ad={ad} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/vehicles/${ad._id}`} className="truncate font-black text-[var(--hw-text-primary)] hover:text-[var(--hw-orange)]">{ad.title}</Link>
                  <Badge variant={statusVariant(ad.status)}>{ad.status}</Badge>
                  {ad.featured ? <Badge variant="orange">Featured</Badge> : null}
                  {ad.urgent ? <Badge variant="orange">Urgent</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
                  {formatPrice(ad.price, ad.priceDisplay)} · {ad.views || 0} {t("dash.viewsWord")}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/vehicles/${ad._id}`} className="rounded-lg border border-[var(--hw-border-strong)] px-4 py-2 text-sm font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)]">{t("dash.view")}</Link>
              {ad.status === "active" ? (
                <button onClick={() => setBoostAd(ad)} className="rounded-lg bg-[var(--hw-orange)] px-4 py-2 text-sm font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]">Boost</button>
              ) : null}
              {ad.status === "active" ? (
                <button disabled={busyId === ad._id} onClick={() => toggleFeature(ad)} className={`rounded-lg border px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${ad.featured ? "border-[var(--hw-orange)] text-[var(--hw-orange)]" : "border-[var(--hw-border-strong)] text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"}`}>
                  {ad.featured ? "Un-feature" : "Feature"}
                </button>
              ) : null}
              {ad.status !== "sold" ? (
                <button disabled={busyId === ad._id} onClick={() => markSold(ad._id)} className="rounded-lg border border-[var(--hw-border-strong)] px-4 py-2 text-sm font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60">
                  {t("dash.markSold")}
                </button>
              ) : null}
              <button disabled={busyId === ad._id} onClick={() => remove(ad._id)} className="rounded-lg border border-[var(--hw-red)] px-4 py-2 text-sm font-bold text-[var(--hw-red)] transition hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60">
                {t("dash.delete")}
              </button>
            </div>
          </div>
        )) : (
          <div className="p-8 text-center">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("dash.noAds")}</h2>
            <Link href="/post-ad" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("nav.postAd")}</Link>
          </div>
        )}
      </section>

      {boostAd ? (
        <BoostModal
          listing={boostAd}
          listingType="Vehicle"
          onClose={() => setBoostAd(null)}
          onDone={() => Promise.all([loadAds(), loadUsage()])}
        />
      ) : null}
    </div>
  );
}

function Thumb({ ad }) {
  const cover = ad.images?.find((i) => i.isCover)?.url || ad.images?.[0]?.url;
  return (
    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-[var(--hw-bg-elevated)]">
      {cover ? (
        <Image src={cover} alt="" width={80} height={56} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

function LoginPrompt({ t }) {
  return (
    <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
      <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("dash.loginRequired")}</h2>
      <Link href="/auth/login?redirect=/dashboard/my-ads" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("nav.login")}</Link>
    </div>
  );
}
