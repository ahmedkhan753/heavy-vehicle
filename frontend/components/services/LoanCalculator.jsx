"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/Context/LanguageContext";

/**
 * LoanCalculator
 * ──────────────
 * Pure client-side vehicle financing estimator. No backend.
 * EMI (equated monthly installment) via the standard amortization formula:
 *
 *   EMI = P · r · (1+r)^n / ((1+r)^n − 1)
 *
 * where P = financed amount, r = monthly rate, n = number of months.
 * Handles r = 0 (interest-free / Islamic financing) without dividing by zero.
 */

// Parse a possibly-messy input string into a non-negative number.
function toNumber(value) {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Exact PKR rupee formatting (no Lakh/Crore rounding — installments need precision).
function pkr(amount) {
  return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
}

function computeLoan({ price, downPayment, annualRate, years }) {
  const principal = Math.max(price - downPayment, 0);
  const months = Math.max(Math.round(years * 12), 1);
  const monthlyRate = annualRate / 12 / 100;

  let emi;
  if (principal === 0) {
    emi = 0;
  } else if (monthlyRate === 0) {
    emi = principal / months;
  } else {
    const growth = Math.pow(1 + monthlyRate, months);
    emi = (principal * monthlyRate * growth) / (growth - 1);
  }

  const totalPayable = emi * months + downPayment;
  const totalInterest = Math.max(emi * months - principal, 0);

  return { principal, months, emi, totalPayable, totalInterest };
}

const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const DOWN_PERCENTS = [0.1, 0.2, 0.3];

const inputClass =
  "h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-sm font-semibold text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]";
const labelClass = "text-xs font-bold uppercase tracking-wide text-[var(--hw-text-muted)]";

export default function LoanCalculator({ initialPrice }) {
  const { t } = useLanguage();
  const startPrice = toNumber(initialPrice) || 5000000;

  const [price, setPrice] = useState(String(startPrice));
  const [downPayment, setDownPayment] = useState(String(Math.round(startPrice * 0.2)));
  const [rate, setRate] = useState("20");
  const [years, setYears] = useState(5);

  const priceNum = toNumber(price);
  const downRaw = toNumber(downPayment);
  // Down payment can never exceed the price (would imply a negative loan).
  const downNum = Math.min(downRaw, priceNum);
  const downExceeds = downRaw > priceNum && priceNum > 0;
  const downPercent = priceNum > 0 ? Math.round((downNum / priceNum) * 100) : 0;

  const result = useMemo(
    () => computeLoan({ price: priceNum, downPayment: downNum, annualRate: toNumber(rate), years }),
    [priceNum, downNum, rate, years]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      {/* ── INPUTS ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
        <div className="grid gap-5">
          {/* Vehicle price */}
          <label className="grid gap-2">
            <span className={labelClass}>{t("loan.vehiclePrice")}</span>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5,000,000"
            />
          </label>

          {/* Down payment */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className={labelClass}>{t("loan.downPayment")}</span>
              <span className="text-xs font-bold text-[var(--hw-text-muted)]">{downPercent}% {t("loan.ofPrice")}</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              className={inputClass}
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="1,000,000"
            />
            <div className="flex gap-2">
              {DOWN_PERCENTS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDownPayment(String(Math.round(priceNum * pct)))}
                  className="rounded-lg border border-[var(--hw-border-default)] px-3 py-1.5 text-xs font-bold text-[var(--hw-text-secondary)] transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-orange)]"
                >
                  {Math.round(pct * 100)}%
                </button>
              ))}
            </div>
            {downExceeds ? (
              <p className="text-xs font-semibold text-[var(--hw-amber,#f59e0b)]">
                {t("loan.downCapBefore")}{pkr(priceNum)}.
              </p>
            ) : null}
          </div>

          {/* Profit / interest rate */}
          <label className="grid gap-2">
            <span className={labelClass}>{t("loan.rate")}</span>
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="20"
            />
            <span className="text-xs text-[var(--hw-text-muted)]">{t("loan.rateHint")}</span>
          </label>

          {/* Tenure */}
          <div className="grid gap-2">
            <span className={labelClass}>{t("loan.tenure")}</span>
            <div className="flex flex-wrap gap-2">
              {YEAR_OPTIONS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYears(y)}
                  className={`h-10 w-12 rounded-lg border text-sm font-bold transition ${
                    years === y
                      ? "border-[var(--hw-orange)] bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                      : "border-[var(--hw-border-default)] text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)]"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTS ────────────────────────────────────────── */}
      {/* Use --hw-bg-card (solid, theme-aware) not --hw-bg-elevated, which is a
          near-white chip colour in dark mode and made the text invisible. */}
      <div className="rounded-xl border border-[var(--hw-border-strong)] bg-[var(--hw-bg-card)] p-6">
        <p className={labelClass}>{t("loan.estimatedEmi")}</p>
        <p className="mt-2 text-4xl font-black text-[var(--hw-orange)]">{pkr(result.emi)}</p>
        <p className="mt-1 text-xs text-[var(--hw-text-muted)]">
          {t("loan.for")} {result.months} {t("loan.months")} ({years} {years === 1 ? t("loan.year") : t("loan.years")})
        </p>

        <div className="mt-6 grid gap-3">
          <Row label={t("loan.amountFinanced")} value={pkr(result.principal)} />
          <Row label={t("loan.totalInterest")} value={pkr(result.totalInterest)} />
          <div className="my-1 h-px bg-[var(--hw-border-default)]" />
          <Row label={t("loan.totalPayable")} value={pkr(result.totalPayable)} strong />
        </div>

        <p className="mt-6 text-xs leading-5 text-[var(--hw-text-muted)]">{t("loan.disclaimer")}</p>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--hw-text-secondary)]">{label}</span>
      <span
        className={
          strong
            ? "text-base font-black text-[var(--hw-text-primary)]"
            : "text-sm font-bold text-[var(--hw-text-primary)]"
        }
      >
        {value}
      </span>
    </div>
  );
}
