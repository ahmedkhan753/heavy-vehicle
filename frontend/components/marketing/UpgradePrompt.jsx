"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/Context/LanguageContext";

/**
 * Shown when a seller hits their plan's active-ad cap.
 *
 * A bare error told them what they *couldn't* do and left them to find the
 * pricing page themselves — most never did. This keeps the message but
 * attaches the two things that actually resolve it: a direct route to
 * checkout, and the case for why upgrading is worth it, collapsed by
 * default so it persuades without burying the buttons.
 */

const BENEFIT_KEYS = [
  "upgrade.benefitExposure",
  "upgrade.benefitFeatured",
  "upgrade.benefitMoreAds",
  "upgrade.benefitTheme",
  "upgrade.benefitFees",
  "upgrade.benefitLonger",
];

export default function UpgradePrompt({ message }) {
  const { t } = useLanguage();
  const [showBenefits, setShowBenefits] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--hw-amber)]/50 bg-[var(--hw-amber)]/10 p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--hw-amber)] text-sm font-black text-black"
        >
          !
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-[var(--hw-text-primary)]">{t("upgrade.limitTitle")}</h3>
          <p className="mt-1 text-[13px] leading-6 text-[var(--hw-text-secondary)]">
            {message || t("upgrade.limitBody")}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/dashboard/billing"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]"
            >
              {t("upgrade.ctaUpgrade")}
            </Link>
            <Link
              href="/subscription-pricings"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-4 text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)]"
            >
              {t("upgrade.ctaComparePlans")}
            </Link>
            <Link
              href="/dashboard/my-ads"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--hw-border-default)] px-4 text-[13px] font-bold text-[var(--hw-text-secondary)] transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-text-primary)]"
            >
              {t("upgrade.ctaManageAds")}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setShowBenefits((v) => !v)}
            aria-expanded={showBenefits}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-black text-[var(--hw-orange)] hover:underline"
          >
            {t("upgrade.whyPremium")}
            <span className={`transition-transform ${showBenefits ? "rotate-180" : ""}`}>▾</span>
          </button>

          {showBenefits ? (
            <ul className="mt-2.5 grid gap-1.5">
              {BENEFIT_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-[12px] leading-5 text-[var(--hw-text-secondary)]">
                  <span className="mt-[3px] text-[var(--hw-green)]">✓</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
