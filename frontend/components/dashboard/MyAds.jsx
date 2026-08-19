"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { vehicleApi, partApi, subscriptionApi } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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

  // { mode: "delete" | "sold", ad }
  const [dialog, setDialog] = useState(null);
  const [salePrice, setSalePrice] = useState("");
  const [buyerContact, setBuyerContact] = useState("");

  // Vehicles and parts are separate collections but the seller thinks of them
  // as one list of "my ads", so merge them and tag each with its kind.
  const loadAds = useCallback(async () => {
    const [vehicleRes, partRes] = await Promise.all([
      vehicleApi.myAds().catch(() => ({ data: [] })),
      partApi.myParts().catch(() => ({ data: [] })),
    ]);
    const vehicles = (vehicleRes.data || []).map((ad) => ({ ...ad, kind: "vehicle" }));
    const parts = (partRes.data || []).map((ad) => ({ ...ad, kind: "part" }));
    setAds(
      [...vehicles, ...parts].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
    );
  }, []);

  const loadUsage = useCallback(async () => {
    const res = await subscriptionApi.me().catch(() => null);
    setUsage(res?.data?.usage || null);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAds();
    loadUsage();
  }, [isAuthenticated, loadAds, loadUsage]);

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

  function openDialog(mode, ad) {
    setSalePrice("");
    setBuyerContact("");
    setDialog({ mode, ad });
  }

  async function confirmDialog() {
    const { mode, ad } = dialog;
    setBusyId(ad._id);
    try {
      if (mode === "delete") {
        if (ad.kind === "part") await partApi.remove(ad._id);
        else await vehicleApi.remove(ad._id);
        toast.success(t("dash.deleted"));
      } else {
        const price = Number(String(salePrice).replace(/[^\d]/g, ""));
        if (!price || price < 1) {
          toast.error(t("dash.salePriceLabel"));
          setBusyId("");
          return;
        }
        const contact = buyerContact.trim();
        if (ad.kind === "part") await partApi.markSold(ad._id, price, contact);
        else await vehicleApi.markSold(ad._id, price, contact);
        toast.success(t("dash.markedSold"));
      }
      setDialog(null);
      await Promise.all([loadAds(), loadUsage()]);
    } catch (err) {
      toast.error(err?.message || "Something went wrong.");
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
  const isSoldDialog = dialog?.mode === "sold";

  return (
    <div>
      {usage && usage.featuredSlots ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] px-3 py-2.5 text-[12px] sm:mb-4 sm:px-4 sm:py-3 sm:text-sm">
          <span className="font-bold text-[var(--hw-text-secondary)]">
            Featured slots: <strong className="text-[var(--hw-text-primary)]">{usage.featuredUsed} / {slotLabel(usage.featuredSlots)}</strong>
          </span>
          <Link href="/dashboard/billing" className="shrink-0 font-bold text-[var(--hw-orange)] hover:underline">Manage plan</Link>
        </div>
      ) : null}

      <div className="mb-3 flex gap-2 sm:mb-4">
        {tabs.map((tab) => {
          const count = tab.key === "all" ? ads.length : ads.filter((a) => a.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition sm:px-3 sm:text-sm ${
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
        {visible.length ? visible.map((ad) => {
          const href = ad.kind === "part" ? `/parts/${ad._id}` : `/vehicles/${ad._id}`;
          return (
            <div key={`${ad.kind}-${ad._id}`} className="border-b border-[var(--hw-border-subtle)] p-3 last:border-b-0 sm:p-4">
              <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                <Thumb ad={ad} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={href} className="truncate text-[13px] font-black text-[var(--hw-text-primary)] hover:text-[var(--hw-orange)] sm:text-base">{ad.title}</Link>
                    <Badge variant={statusVariant(ad.status)}>{ad.status}</Badge>
                    {ad.featured ? <Badge variant="orange">Featured</Badge> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                    {ad.kind === "part" ? t("dash.partAd") : t("dash.vehicleAd")} · {formatPrice(ad.price, ad.priceDisplay)} · {ad.views || 0} {t("dash.viewsWord")}
                  </p>
                </div>
              </div>

              {/* Actions wrap onto their own row so they never squeeze the title */}
              <div className="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2">
                <Link href={href} className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] sm:px-4 sm:py-2 sm:text-sm">{t("dash.view")}</Link>
                {/* Boosting and featuring apply to part ads too — the boost
                    API already took a listingType, and featuring now resolves
                    across both collections server-side. */}
                {ad.status === "active" ? (
                  <>
                    <button onClick={() => setBoostAd(ad)} className="rounded-lg bg-[var(--hw-orange)] px-3 py-1.5 text-[12px] font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)] sm:px-4 sm:py-2 sm:text-sm">Boost</button>
                    <button disabled={busyId === ad._id} onClick={() => toggleFeature(ad)} className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm ${ad.featured ? "border-[var(--hw-orange)] text-[var(--hw-orange)]" : "border-[var(--hw-border-strong)] text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"}`}>
                      {ad.featured ? "Un-feature" : "Feature"}
                    </button>
                  </>
                ) : null}
                {ad.status !== "sold" ? (
                  <button disabled={busyId === ad._id} onClick={() => openDialog("sold", ad)} className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm">
                    {t("dash.markSold")}
                  </button>
                ) : null}
                <button disabled={busyId === ad._id} onClick={() => openDialog("delete", ad)} className="rounded-lg border border-[var(--hw-red)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-red)] transition hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm">
                  {t("dash.delete")}
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="p-6 text-center sm:p-8">
            <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("dash.noAds")}</h2>
            <Link href="/post-ad" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:mt-5 sm:text-sm">{t("nav.postAd")}</Link>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(dialog)}
        busy={Boolean(dialog) && busyId === dialog.ad._id}
        tone={dialog?.mode === "delete" ? "danger" : "default"}
        title={dialog?.mode === "delete" ? t("dash.deleteTitle") : t("dash.markSoldTitle")}
        message={dialog?.mode === "delete" ? t("dash.deleteConfirm") : t("dash.markSoldBody")}
        confirmLabel={dialog?.mode === "delete" ? t("dash.confirmDelete") : t("dash.confirmMarkSold")}
        cancelLabel={t("dash.cancel")}
        onCancel={() => setDialog(null)}
        onConfirm={confirmDialog}
      >
        {/* Both listing kinds record a commission on sale, so both need the
            final price and (optionally) the buyer for two-party confirmation. */}
        {isSoldDialog ? (
          <div className="grid gap-3">
            <label className="text-[12px] font-bold text-[var(--hw-text-secondary)]">
              {t("dash.salePriceLabel")}
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              />
              <span className="mt-1 block text-[10px] font-normal text-[var(--hw-text-muted)]">{t("dash.salePriceHint")}</span>
            </label>
            <label className="text-[12px] font-bold text-[var(--hw-text-secondary)]">
              {t("dash.buyerContactLabel")}
              <input
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
              />
            </label>
          </div>
        ) : null}
      </ConfirmDialog>

      {boostAd ? (
        <BoostModal
          listing={boostAd}
          listingType={boostAd.kind === "part" ? "Part" : "Vehicle"}
          onClose={() => setBoostAd(null)}
          onDone={() => Promise.all([loadAds(), loadUsage()])}
        />
      ) : null}
    </div>
  );
}

function Thumb({ ad }) {
  const cover = ad.images?.find((i) => i.isCover)?.url || ad.images?.[0]?.url || ad.coverImage;
  return (
    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--hw-bg-elevated)] sm:h-14 sm:w-20">
      {cover ? (
        <Image src={cover} alt="" width={80} height={56} className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

function LoginPrompt({ t }) {
  return (
    <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center sm:p-8">
      <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("dash.loginRequired")}</h2>
      <Link href="/auth/login?redirect=/dashboard/my-ads" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:mt-5 sm:text-sm">{t("nav.login")}</Link>
    </div>
  );
}
