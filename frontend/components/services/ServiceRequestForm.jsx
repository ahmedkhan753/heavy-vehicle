"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { serviceRequestApi, normalizeApiError } from "@/lib/api";
import { CITIES, cityLabel } from "@/lib/constants";

/**
 * ServiceRequestForm
 * ──────────────────
 * Reusable request form for all booking-style services. Pass a `serviceType`
 * ("ownership-transfer" | "inspection" | "warranty"). Login-gated. On success
 * it shows the tracking reference and a link to the dashboard.
 *
 * `extraFields` lets a service add its own inputs (rendered into `details`).
 */
const inputClass =
  "mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]";
const labelClass = "text-sm font-bold text-[var(--hw-text-secondary)]";

export default function ServiceRequestForm({ serviceType, redirectTo, initialVehicleId = "", extraFields = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const { t, lang } = useLanguage();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const fd = new FormData(event.currentTarget);

    // Collect service-specific fields into `details`.
    const details = {};
    extraFields.forEach((f) => {
      details[f.name] = String(fd.get(f.name) || "");
    });

    try {
      const res = await serviceRequestApi.create({
        serviceType,
        vehicleId: initialVehicleId || undefined,
        vehicleInfo: {
          make: String(fd.get("make") || ""),
          model: String(fd.get("model") || ""),
          year: Number(fd.get("year") || 0) || null,
          registrationNumber: String(fd.get("registrationNumber") || ""),
        },
        contact: {
          name: String(fd.get("name") || ""),
          phone: String(fd.get("phone") || ""),
          city: String(fd.get("city") || ""),
        },
        notes: String(fd.get("notes") || ""),
        details,
      });
      setCreated(res.data);
      toast.success(t("svc.toastSubmitted"));
    } catch (err) {
      setError(normalizeApiError(err));
      toast.error(t("svc.toastSubmitFail"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-[var(--hw-bg-card)]" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("svc.signinTitle")}</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">{t("svc.signinBody")}</p>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent(redirectTo || "/")}`}
          className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
        >
          {t("form.loginToContinue")}
        </Link>
      </div>
    );
  }

  if (created) {
    return (
      <div className="rounded-xl border border-[var(--hw-green)] bg-[var(--hw-bg-card)] p-8 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-2xl font-black text-[var(--hw-text-primary)]">{t("svc.submittedTitle")}</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">
          {t("svc.refBefore")}
          <span className="font-black text-[var(--hw-orange)]">{created.reference}</span>
          {t("svc.refAfter")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/requests" className="inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
            {t("svc.trackRequests")}
          </Link>
          <button
            onClick={() => setCreated(null)}
            className="inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"
          >
            {t("svc.submitAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      {error ? (
        <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {t("svc.yourName")}
          <input name="name" required defaultValue={user?.name || ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("svc.phone")}
          <input name="phone" required defaultValue={user?.phone || ""} placeholder="03001234567" className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("form.city")}
          <select name="city" required defaultValue={user?.city || ""} className={inputClass}>
            <option value="">{t("svc.selectCity")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{cityLabel(c, lang)}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          {t("svc.regNumber")}
          <input name="registrationNumber" placeholder="e.g. LES-1234" className={inputClass} />
        </label>

        {/* Service-specific fields */}
        {extraFields.map((f) => (
          <label key={f.name} className={labelClass}>
            {f.label}
            {f.type === "select" ? (
              <select name={f.name} defaultValue="" className={inputClass}>
                <option value="">{f.placeholder || "Select"}</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input name={f.name} type={f.type || "text"} placeholder={f.placeholder || ""} className={inputClass} />
            )}
          </label>
        ))}

        <label className={labelClass}>
          {t("svc.vehicleMake")}
          <input name="make" placeholder="e.g. Hino" className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("svc.vehicleModel")}
          <input name="model" placeholder="e.g. 700 Series" className={inputClass} />
        </label>
        <label className={labelClass}>
          {t("form.year")}
          <input name="year" type="number" min="1980" max={new Date().getFullYear() + 1} className={inputClass} />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          {t("svc.detailsMessage")}
          <textarea name="notes" maxLength={2000} placeholder={t("svc.detailsPlaceholder")} className="mt-2 min-h-28 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
      </div>

      <button disabled={submitting} className="mt-6 h-12 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
        {submitting ? t("svc.submitting") : t("svc.submit")}
      </button>
    </form>
  );
}
