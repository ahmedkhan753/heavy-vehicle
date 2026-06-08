"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { dealerApi, normalizeApiError } from "@/lib/api";
import { CITIES, VEHICLE_MAKES, VEHICLE_TYPES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

export default function DealerRegisterForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        specializations: formData.getAll("specializations"),
        brands: formData.getAll("brands"),
        establishedYear: Number(formData.get("establishedYear") || 0) || null,
        workingHours: String(formData.get("workingHours") || ""),
      });
      toast.success("Dealer profile created");
      router.push(`/dealers/${response.data._id}`);
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("dash.loginRequired")}</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">{t("dealer.noneBody")}</p>
        <Link href="/auth/login?redirect=/dealers/register" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("nav.login")}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      {error ? <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          Business name
          <input name="businessName" required maxLength={100} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          Business type
          <select name="businessType" className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]">
            <option value="individual">Individual</option>
            <option value="company">Company</option>
            <option value="showroom">Showroom</option>
          </select>
        </label>
        {["tagline", "phone", "whatsapp", "email", "website", "address", "province", "establishedYear", "workingHours"].map((name) => (
          <label key={name} className="text-sm font-bold text-[var(--hw-text-secondary)]">
            {titleCase(name)}
            <input name={name} type={name === "establishedYear" ? "number" : "text"} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
          </label>
        ))}
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          City
          <select name="city" required className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-secondary)] outline-none focus:border-[var(--hw-orange)]">
            <option value="">Select city</option>
            {CITIES.map((city) => <option key={city} value={city}>{titleCase(city)}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
          Description
          <textarea name="description" maxLength={1000} className="mt-2 min-h-28 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <CheckboxGroup title="Specializations" name="specializations" items={VEHICLE_TYPES.slice(0, 10)} />
        <CheckboxGroup title="Brands" name="brands" items={VEHICLE_MAKES.slice(0, 10)} />
      </div>

      <button disabled={loading} className="mt-6 h-12 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
        {loading ? "Creating dealer profile..." : "Create Dealer Profile"}
      </button>
    </form>
  );
}

function CheckboxGroup({ title, name, items }) {
  return (
    <fieldset className="rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-4">
      <legend className="px-2 text-sm font-black text-[var(--hw-text-primary)]">{title}</legend>
      <div className="mt-2 grid gap-2">
        {items.map((item) => {
          const value = typeof item === "string" ? item : item.value;
          const label = typeof item === "string" ? titleCase(item) : item.label;
          return (
            <label key={value} className="flex items-center gap-2 text-sm text-[var(--hw-text-secondary)]">
              <input type="checkbox" name={name} value={value} />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
