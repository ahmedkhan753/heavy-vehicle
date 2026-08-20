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

const PENDING_KEY = "hw_pending_contact_action";

/**
 * SellerContact
 * ─────────────
 * Message/Call/WhatsApp are always visible, even logged out — a visitor
 * shouldn't have to find a separate "log in" button before finding out
 * these options exist at all. Clicking any of them while signed out opens
 * QuickAuthModal instead of performing the action; once sign-in succeeds,
 * whichever button was clicked finishes automatically rather than making
 * them click it a second time.
 *
 * The pending action is stashed in sessionStorage, not just a ref — the
 * modal's Google/Facebook buttons sign in without leaving the page, but its
 * "or continue with email" fallback does a full navigation to /auth/login
 * and back, which unmounts this component and would silently drop an
 * in-memory ref. sessionStorage survives that; a plain useRef doesn't.
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
  const [phoneFetched, setPhoneFetched] = useState(false);
  const [starting, setStarting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const isOwner = isAuthenticated && sellerId && String(user?._id) === String(sellerId);

  useEffect(() => {
    let active = true;
    async function loadPhone() {
      if (!isAuthenticated || isOwner || phoneFetched) return;
      try {
        const res = await DETAIL_API[listingType].detail(listingId);
        const seller = res?.data?.sellerId || res?.data?.seller || {};
        const found = seller.phone || res?.data?.seller?.phone || "";
        if (active) setPhone(found);
      } catch {
        // Leave contact hidden on error.
      } finally {
        if (active) setPhoneFetched(true);
      }
    }
    loadPhone();
    return () => { active = false; };
  }, [isAuthenticated, isOwner, listingId, listingType, phoneFetched]);

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

  function runAction(action) {
    if (action === "message") { messageSeller(); return; }
    if (!phone) { toast.error(t("contact.noPhone")); return; }
    if (action === "call") window.location.href = `tel:${phone}`;
    else if (action === "whatsapp") window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank", "noopener,noreferrer");
  }

  function requireAuth(action) {
    return () => {
      if (!isAuthenticated) {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({ listingId, listingType, action }));
        setAuthOpen(true);
        return;
      }
      runAction(action);
    };
  }

  // Once sign-in succeeds and (for call/WhatsApp) the seller's phone has
  // finished loading, finish whatever action the visitor originally
  // clicked instead of leaving them to click it again. Runs on mount too,
  // since that's exactly when the email-fallback's redirect-back lands.
  useEffect(() => {
    if (!isAuthenticated) return;
    let pending;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
    } catch {
      pending = null;
    }
    if (!pending || pending.listingId !== listingId || pending.listingType !== listingType) return;
    if (pending.action !== "message" && !phoneFetched) return; // still waiting on the phone fetch
    sessionStorage.removeItem(PENDING_KEY);
    runAction(pending.action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, phoneFetched, listingId, listingType]);

  if (loading) {
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

  const phoneBusy = isAuthenticated && !phoneFetched;

  return (
    <div className="grid gap-3">
      {/* Primary: in-app chat */}
      <button
        onClick={requireAuth("message")}
        disabled={starting}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)] disabled:opacity-60"
      >
        💬 {starting ? t("contact.opening") : t("contact.message")}
      </button>

      {/* Secondary: phone / WhatsApp — always visible; the real number only
          exists once signed in, but the buttons themselves never hide. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={requireAuth("call")}
          disabled={phoneBusy}
          className="hw-ltr inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)] disabled:opacity-60"
        >
          {t("contact.call")}
        </button>
        <button
          type="button"
          onClick={requireAuth("whatsapp")}
          disabled={phoneBusy}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)] disabled:opacity-60"
        >
          {t("contact.whatsapp")}
        </button>
      </div>

      <QuickAuthModal open={authOpen} onClose={() => setAuthOpen(false)} redirectPath={redirectTo || "/vehicles"} />
    </div>
  );
}
