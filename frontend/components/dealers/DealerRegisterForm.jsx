"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { dealerApi, normalizeApiError } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

// Only what the business actually needs to be reachable and findable is
// required; everything else is clearly marked optional so the form doesn't
// look like a wall of obligations.
const OPTIONAL_TEXT_FIELDS = [
  ["whatsapp", "dealerForm.whatsapp", "text"],
  ["email", "dealerForm.email", "email"],
  ["website", "dealerForm.website", "text"],
  ["tagline", "dealerForm.tagline", "text"],
  ["address", "dealerForm.address", "text"],
  ["province", "dealerForm.province", "text"],
  ["establishedYear", "dealerForm.establishedYear", "number"],
  ["workingHours", "dealerForm.workingHours", "text"],
];

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:h-12 sm:px-4";

function Label({ children, required, hint }) {
  return (
    <span className="flex items-baseline gap-1.5">
      {children}
      {required ? <span className="text-[var(--hw-orange)]">*</span> : null}
      {hint ? <span className="text-[10px] font-normal text-[var(--hw-text-muted)]">({hint})</span> : null}
    </span>
  );
}

export default function DealerRegisterForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // null = still checking, false = no application yet, object = existing one.
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    dealerApi
      .mine()
      .then((res) => setExisting(res?.data || false))
      .catch(() => setExisting(false));
  }, [isAuthenticated]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const response = await dealerApi.register({
        businessName: String(formData.get("businessName") || ""),
        businessType: String(formData.get("businessType") || "individual"),
        tagline: String(formData.get("tagline") || ""),
        description: String(formData.get("description") || ""),
        phone: String(formData.get("phone") || ""),
        whatsapp: String(formData.get("whatsapp") || ""),
        email: String(formData.get("email") || ""),
        website: String(formData.get("website") || ""),
        city: String(formData.get("city") || ""),
        address: String(formData.get("address") || ""),
        province: String(formData.get("province") || ""),
        specialization: String(formData.get("specialization") || "vehicles"),
        establishedYear: Number(formData.get("establishedYear") || 0) || null,
        workingHours: String(formData.get("workingHours") || ""),
      });
      toast.success(t("dealerForm.created"));
      setExisting(response.data);
      router.refresh();
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 text-center sm:p-8">
        <h2 className="text-lg font-black text-[var(--hw-text-primary)] sm:text-2xl">{t("dash.loginRequired")}</h2>
        <p className="mt-2 text-[13px] text-[var(--hw-text-secondary)] sm:text-base">{t("dealer.noneBody")}</p>
        <Link href="/auth/login?redirect=/dealers/register" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:mt-5 sm:text-sm">{t("nav.login")}</Link>
      </div>
    );
  }

  // Already applied — show where the application stands instead of a form
  // they'd only be told they can't submit.
  if (existing && existing.approvalStatus === "pending") {
    return (
      <div className="rounded-xl border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] p-5 text-center sm:p-8">
        <p className="text-3xl">⏳</p>
        <h2 className="mt-2 text-lg font-black text-[var(--hw-text-primary)] sm:text-2xl">{t("dealerForm.pendingTitle")}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base">{t("dealerForm.pendingBody")}</p>
      </div>
    );
  }

  if (existing && existing.approvalStatus === "approved") {
    return (
      <div className="rounded-xl border border-[var(--hw-green)] bg-[var(--hw-soft-panel)] p-5 text-center sm:p-8">
        <p className="text-3xl">✅</p>
        <h2 className="mt-2 text-lg font-black text-[var(--hw-text-primary)] sm:text-2xl">{existing.businessName}</h2>
        <Link href={`/dealers/${existing._id}`} className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
          {t("dealerForm.viewStorefront")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
      {error ? <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] font-bold text-red-200">{error}</div> : null}

      {existing && existing.approvalStatus === "rejected" ? (
        <div className="mb-4 rounded-lg border border-[var(--hw-red)] bg-[var(--hw-soft-panel)] p-3">
          <p className="text-[13px] font-black text-[var(--hw-red)]">{t("dealerForm.rejectedTitle")}</p>
          <p className="mt-1 text-[12px] text-[var(--hw-text-secondary)]">{t("dealerForm.rejectedBody")}</p>
          {existing.reviewNote ? (
            <p className="mt-1 text-[11px] italic text-[var(--hw-text-muted)]">{existing.reviewNote}</p>
          ) : null}
        </div>
      ) : null}

      <p className="mb-3 rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-2.5 text-[11px] leading-5 text-[var(--hw-text-secondary)] sm:text-xs">
        {t("dealerForm.reviewNotice")}
      </p>

      <p className="mb-4 text-[11px] text-[var(--hw-text-muted)] sm:text-xs">{t("dealerForm.requiredNote")}</p>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <label className="text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm">
          <Label required>{t("dealerForm.businessName")}</Label>
          <input name="businessName" required maxLength={100} className={inputClass} />
        </label>

        <label className="text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm">
          <Label required>{t("dealerForm.phone")}</Label>
          <input name="phone" type="tel" required className={inputClass} />
        </label>

        <label className="text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm">
          <Label required>{t("dealerForm.city")}</Label>
          <select name="city" required className={inputClass}>
            <option value="">{t("dealerForm.selectCity")}</option>
            {CITIES.map((city) => <option key={city} value={city}>{titleCase(city)}</option>)}
          </select>
        </label>

        <label className="text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm">
          <Label required>{t("dealerForm.specialization")}</Label>
          <select name="specialization" required defaultValue="vehicles" className={inputClass}>
            <option value="vehicles">{t("dealerForm.spec.vehicles")}</option>
            <option value="parts">{t("dealerForm.spec.parts")}</option>
            <option value="both">{t("dealerForm.spec.both")}</option>
          </select>
        </label>

        <label className="text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm">
          <Label required>{t("dealerForm.businessType")}</Label>
          <select name="businessType" required defaultValue="individual" className={inputClass}>
            <option value="individual">{t("dealerForm.type.individual")}</option>
            <option value="company">{t("dealerForm.type.company")}</option>
            <option value="showroom">{t("dealerForm.type.showroom")}</option>
          </select>
        </label>

        {OPTIONAL_TEXT_FIELDS.map(([name, key, type]) => (
          <label key={name} className="text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm">
            <Label hint={t("dealerForm.optional")}>{t(key)}</Label>
            <input name={name} type={type} className={inputClass} />
          </label>
        ))}

        <label className="text-[13px] font-bold text-[var(--hw-text-secondary)] sm:col-span-2 sm:text-sm">
          <Label hint={t("dealerForm.optional")}>{t("dealerForm.description")}</Label>
          <textarea name="description" maxLength={1000} className="mt-1.5 min-h-24 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:min-h-28 sm:p-4" />
        </label>
      </div>

      <button disabled={loading} className="mt-5 h-11 w-full rounded-lg bg-[var(--hw-orange)] text-[13px] font-black text-[var(--hw-text-inverse)] disabled:opacity-60 sm:mt-6 sm:h-12 sm:text-sm">
        {loading ? t("dealerForm.submitting") : t("dealerForm.submit")}
      </button>
    </form>
  );
}
