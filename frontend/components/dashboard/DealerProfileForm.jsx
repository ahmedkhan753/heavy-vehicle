"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { dealerApi, uploadApi, normalizeApiError } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:h-12 sm:px-4";
const labelClass = "text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm";

const TEXT_FIELDS = [
  ["businessName", "dealerForm.businessName", "text"],
  ["phone", "dealerForm.phone", "tel"],
  ["whatsapp", "dealerForm.whatsapp", "text"],
  ["email", "dealerForm.email", "email"],
  ["website", "dealerForm.website", "text"],
  ["tagline", "dealerForm.tagline", "text"],
  ["address", "dealerForm.address", "text"],
  ["workingHours", "dealerForm.workingHours", "text"],
];

/**
 * DealerProfileForm — lets an approved dealer edit their storefront:
 * details, description, logo and cover image.
 *
 * Images go through the existing Cloudinary upload endpoint first, then the
 * returned {url, publicId} is saved onto the dealer document — the dealer PUT
 * takes JSON, not multipart.
 */
export default function DealerProfileForm() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [dealer, setDealer] = useState(null); // null = loading, false = none
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logo, setLogo] = useState(null);
  const [cover, setCover] = useState(null);
  const [uploading, setUploading] = useState("");
  const logoRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    dealerApi
      .mine()
      .then((res) => {
        setDealer(res?.data || false);
        setLogo(res?.data?.logo || null);
        setCover(res?.data?.coverImage || null);
      })
      .catch(() => setDealer(false));
  }, [isAuthenticated]);

  async function pickImage(kind, file) {
    if (!file) return;
    setUploading(kind);
    try {
      const res = await uploadApi.image(file);
      const img = { url: res.data.url, publicId: res.data.publicId };
      if (kind === "logo") setLogo(img);
      else setCover(img);
      toast.success("Image uploaded — remember to save");
    } catch (err) {
      toast.error(normalizeApiError(err.payload || err));
    } finally {
      setUploading("");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData(event.currentTarget);

    const body = {
      description: String(fd.get("description") || ""),
      city: String(fd.get("city") || ""),
      specialization: String(fd.get("specialization") || "vehicles"),
      businessType: String(fd.get("businessType") || "individual"),
    };
    TEXT_FIELDS.forEach(([name]) => { body[name] = String(fd.get(name) || ""); });
    if (logo?.url) body.logo = logo;
    if (cover?.url) body.coverImage = cover;

    try {
      const res = await dealerApi.update(dealer._id, body);
      setDealer(res.data);
      toast.success("Dealer profile updated");
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <Panel>
        <p className="text-[13px] text-[var(--hw-text-secondary)] sm:text-base">{t("dash.loginRequired")}</p>
        <Link href="/auth/login?redirect=/dashboard/dealer" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)]">{t("nav.login")}</Link>
      </Panel>
    );
  }

  if (dealer === null) return <p className="text-[var(--hw-text-secondary)]">{t("common.loading")}</p>;

  if (dealer === false) {
    return (
      <Panel>
        <p className="text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base">{t("dash.noDealerProfile")}</p>
        <Link href="/dealers/register" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
          {t("dealer.become")}
        </Link>
      </Panel>
    );
  }

  if (dealer.approvalStatus === "pending") {
    return (
      <Panel className="border-[var(--hw-orange)]">
        <p className="text-3xl">⏳</p>
        <h2 className="mt-2 text-lg font-black text-[var(--hw-text-primary)]">{t("dealerForm.pendingTitle")}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--hw-text-secondary)]">{t("dealerForm.pendingBody")}</p>
      </Panel>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
      {error ? <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] font-bold text-red-200">{error}</div> : null}

      {/* Images */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className={labelClass}>{t("dash.dealerLogo")}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--hw-orange)] text-xl font-black text-[var(--hw-text-inverse)]">
              {logo?.url
                ? <Image src={logo.url} alt="" width={64} height={64} className="h-full w-full object-cover" />
                : (dealer.businessName || "?").slice(0, 1)}
            </div>
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => pickImage("logo", e.target.files?.[0])} />
            <button type="button" onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}
              className="h-10 rounded-lg border border-[var(--hw-border-strong)] px-3 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60">
              {uploading === "logo" ? "…" : t("dash.chooseImage")}
            </button>
          </div>
        </div>

        <div>
          <p className={labelClass}>{t("dash.dealerCover")}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-[var(--hw-bg-deep)]">
              {cover?.url ? <Image src={cover.url} alt="" fill sizes="112px" className="object-cover" /> : null}
            </div>
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => pickImage("cover", e.target.files?.[0])} />
            <button type="button" onClick={() => coverRef.current?.click()} disabled={uploading === "cover"}
              className="h-10 rounded-lg border border-[var(--hw-border-strong)] px-3 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60">
              {uploading === "cover" ? "…" : t("dash.chooseImage")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {TEXT_FIELDS.map(([name, key, type]) => (
          <label key={name} className={labelClass}>
            {t(key)}
            <input name={name} type={type} defaultValue={dealer[name] || ""} className={inputClass} />
          </label>
        ))}

        <label className={labelClass}>
          {t("dealerForm.city")}
          <select name="city" defaultValue={dealer.city || ""} className={inputClass}>
            {CITIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>

        <label className={labelClass}>
          {t("dealerForm.specialization")}
          <select name="specialization" defaultValue={dealer.specialization || "vehicles"} className={inputClass}>
            <option value="vehicles">{t("dealerForm.spec.vehicles")}</option>
            <option value="parts">{t("dealerForm.spec.parts")}</option>
            <option value="both">{t("dealerForm.spec.both")}</option>
          </select>
        </label>

        <label className={labelClass}>
          {t("dealerForm.businessType")}
          <select name="businessType" defaultValue={dealer.businessType || "individual"} className={inputClass}>
            <option value="individual">{t("dealerForm.type.individual")}</option>
            <option value="company">{t("dealerForm.type.company")}</option>
            <option value="showroom">{t("dealerForm.type.showroom")}</option>
          </select>
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          {t("dealerForm.description")}
          <textarea name="description" defaultValue={dealer.description || ""} maxLength={1000} rows={4}
            className="mt-1.5 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:p-4" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={saving} className="h-11 flex-1 rounded-lg bg-[var(--hw-orange)] text-[13px] font-black text-[var(--hw-text-inverse)] disabled:opacity-60 sm:h-12 sm:text-sm">
          {saving ? t("common.loading") : t("dash.saveChanges")}
        </button>
        <Link href={`/dealers/${dealer._id}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-4 text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] sm:h-12 sm:text-sm">
          {t("dash.view")}
        </Link>
      </div>
    </form>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 text-center sm:p-8 ${className}`}>
      {children}
    </div>
  );
}
