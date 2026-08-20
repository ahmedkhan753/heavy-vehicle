"use client";

import { useState } from "react";
import { useLanguage } from "@/Context/LanguageContext";
import { adApi, normalizeApiError } from "@/lib/api";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:h-12 sm:px-4";
const labelClass = "text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm";

const PLACEMENTS = ["header", "home-mid", "listing"];

/**
 * AdvertiseForm — an enquiry, not a checkout.
 *
 * Banner pricing depends on placement and duration and is negotiated, so this
 * files a pending campaign for an admin to price and activate rather than
 * pretending to sell a fixed SKU. Deliberately usable while logged out — an
 * outside brand shouldn't need an account to ask for a rate.
 */
export default function AdvertiseForm() {
  const { t } = useLanguage();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSending(true);
    const fd = new FormData(event.currentTarget);

    try {
      await adApi.request({
        advertiserName: String(fd.get("advertiserName") || ""),
        contactEmail: String(fd.get("contactEmail") || ""),
        contactPhone: String(fd.get("contactPhone") || ""),
        targetUrl: String(fd.get("targetUrl") || ""),
        placement: String(fd.get("placement") || "home-mid"),
        notes: String(fd.get("notes") || ""),
      });
      setSent(true);
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-[var(--hw-green)] bg-[var(--hw-soft-panel)] p-5 text-center sm:p-8">
        <p className="text-3xl">✅</p>
        <h2 className="mt-2 text-lg font-black text-[var(--hw-text-primary)] sm:text-2xl">{t("ad.sentTitle")}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base">{t("ad.sentBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
      <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("ad.formTitle")}</h2>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] font-bold text-red-200">{error}</div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        <label className={labelClass}>
          {t("ad.advertiserName")} <span className="text-[var(--hw-orange)]">*</span>
          <input name="advertiserName" required maxLength={100} className={inputClass} />
        </label>

        <label className={labelClass}>
          {t("ad.contactPhone")} <span className="text-[var(--hw-orange)]">*</span>
          <input name="contactPhone" type="tel" required className={inputClass} />
        </label>

        <label className={labelClass}>
          {t("ad.contactEmail")}
          <input name="contactEmail" type="email" className={inputClass} />
        </label>

        <label className={labelClass}>
          {t("ad.targetUrl")}
          <input name="targetUrl" type="text" placeholder="https://…" className={inputClass} />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          {t("ad.preferredPlacement")}
          <select name="placement" defaultValue="home-mid" className={inputClass}>
            {PLACEMENTS.map((p) => (
              <option key={p} value={p}>{t(`ad.placement.${p}`)}</option>
            ))}
          </select>
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          {t("ad.notes")}
          <textarea name="notes" maxLength={500} rows={4}
            className="mt-1.5 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:p-4" />
        </label>
      </div>

      <button disabled={sending} className="mt-5 h-11 w-full rounded-lg bg-[var(--hw-orange)] text-[13px] font-black text-[var(--hw-text-inverse)] disabled:opacity-60 sm:h-12 sm:text-sm">
        {sending ? t("ad.submitting") : t("ad.submit")}
      </button>
    </form>
  );
}
