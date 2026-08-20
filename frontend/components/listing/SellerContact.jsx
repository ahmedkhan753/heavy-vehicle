"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { vehicleApi, partApi, chatApi } from "@/lib/api";
import QuickAuthModal from "@/components/auth/QuickAuthModal";

const DETAIL_API = { vehicle: vehicleApi, part: partApi };

/**
 * SellerContact
 * ─────────────
 * In-app chat is the primary way to reach a seller (keeps the conversation
 * on-platform). Phone/WhatsApp remain as secondary options, revealed only to
 * signed-in users. Sellers don't see contact controls on their own listing.
 *
 * Works for either listing kind — pass `listingType="part"` on a part page;
 * defaults to "vehicle" so existing callers don't need to change.
 */
export default function SellerContact({ listingId, listingType = "vehicle", redirectTo, sellerId }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [fetching, setFetching] = useState(false);
  const [starting, setStarting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const isOwner = isAuthenticated && sellerId && String(user?._id) === String(sellerId);

  useEffect(() => {
    let active = true;
    async function loadPhone() {
      if (!isAuthenticated || isOwner || phone) return;
      setFetching(true);
      try {
        const res = await DETAIL_API[listingType].detail(listingId);
        const seller = res?.data?.sellerId || res?.data?.seller || {};
        const found = seller.phone || res?.data?.seller?.phone || "";
        if (active) setPhone(found);
      } catch {
        // Leave contact hidden on error.
      } finally {
        if (active) setFetching(false);
      }
    }
    loadPhone();
    return () => { active = false; };
  }, [isAuthenticated, isOwner, listingId, listingType, phone]);

  async function messageSeller() {
    setStarting(true);
    try {
      const res = await chatApi.start(listingId, listingType);
      router.push(`/dashboard/messages?c=${res.data._id}`);
    } catch (err) {
      toast.error(err?.message || "Couldn't start the chat.");
      setStarting(false);
    }
  }

  if (loading || fetching) {
    return <div className="h-12 animate-pulse rounded-lg bg-[var(--hw-bg-elevated)]" />;
  }

  if (isOwner) {
    return (
      <div className="grid gap-2 text-center">
        <p className="text-sm font-bold text-[var(--hw-text-secondary)]">{t("contact.yourListing")}</p>
        <Link href="/dashboard/messages" className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">
          {t("contact.viewMessages")}
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="grid gap-3">
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--hw-green)] text-sm font-black text-[var(--hw-text-inverse)]"
        >
          {t("contact.loginToMessage")}
        </button>
        <p className="text-center text-xs text-[var(--hw-text-muted)]">
          {t("contact.loginHint")}
        </p>
        <QuickAuthModal open={authOpen} onClose={() => setAuthOpen(false)} redirectPath={redirectTo || "/vehicles"} />
      </div>
    );
  }

  const waNumber = phone.replace(/[^0-9]/g, "");

  return (
    <div className="grid gap-3">
      {/* Primary: in-app chat */}
      <button
        onClick={messageSeller}
        disabled={starting}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)] disabled:opacity-60"
      >
        💬 {starting ? t("contact.opening") : t("contact.message")}
      </button>

      {/* Secondary: phone / WhatsApp */}
      {phone ? (
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${phone}`}
            className="hw-ltr inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"
          >
            {t("contact.call")}
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"
          >
            {t("contact.whatsapp")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
