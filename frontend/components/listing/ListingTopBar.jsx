"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { userApi } from "@/lib/api";
import ShareMenu from "@/components/listing/ShareMenu";

/**
 * ListingTopBar — back / share / save row above a listing.
 *
 * Phones get this instead of the text breadcrumb: a breadcrumb that wraps to
 * two lines costs more vertical space than it earns, while "go back" is the
 * action people actually want. Shown only below `lg`; desktop keeps the
 * breadcrumb.
 *
 * `saveId` is optional — saving is only wired up for vehicles (the API is
 * /users/saved/:vehicleId), so parts render the bar without the heart.
 */
export default function ListingTopBar({ saveId, title }) {
  const router = useRouter();
  const toast = useToast();
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Reflect the existing saved state so the heart isn't misleading on load.
  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !saveId) return;
    userApi
      .saved()
      .then((res) => {
        if (!active) return;
        const list = res?.data || [];
        setSaved(list.some((item) => String(item?._id || item) === String(saveId)));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isAuthenticated, saveId]);

  async function toggleSave() {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setBusy(true);
    const next = !saved;
    try {
      if (next) await userApi.saveAd(saveId);
      else await userApi.unsaveAd(saveId);
      setSaved(next);
    } catch (err) {
      toast.error(err?.message || "Couldn't update saved ads.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-primary)]"
      >
        <svg className="h-5 w-5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <ShareMenu title={title} iconOnly />

        {saveId ? (
          <button
            type="button"
            onClick={toggleSave}
            disabled={busy}
            aria-label={saved ? "Remove from saved" : "Save this listing"}
            aria-pressed={saved}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border bg-[var(--hw-bg-card)] disabled:opacity-60 ${
              saved
                ? "border-[var(--hw-red)] text-[var(--hw-red)]"
                : "border-[var(--hw-border-default)] text-[var(--hw-text-primary)]"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
