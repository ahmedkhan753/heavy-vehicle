"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { businessApi, uploadApi, normalizeApiError } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { BUSINESS_CATEGORIES, businessCategoryLabel } from "@/lib/businesses";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:h-12 sm:px-4";
const labelClass = "text-[13px] font-bold text-[var(--hw-text-secondary)] sm:text-sm";

const OPTIONAL_FIELDS = [
  ["whatsapp", "bizForm.whatsapp", "text"],
  ["email", "bizForm.email", "email"],
  ["website", "bizForm.website", "text"],
  ["tagline", "bizForm.tagline", "text"],
  ["area", "bizForm.area", "text"],
  ["address", "bizForm.address", "text"],
  ["workingHours", "bizForm.workingHours", "text"],
  ["establishedYear", "bizForm.establishedYear", "number"],
];

function Label({ children, required, hint }) {
  return (
    <span className="flex items-baseline gap-1.5">
      {children}
      {required ? <span className="text-[var(--hw-orange)]">*</span> : null}
      {hint ? <span className="text-[10px] font-normal text-[var(--hw-text-muted)]">({hint})</span> : null}
    </span>
  );
}

/**
 * BusinessForm — one component covering both "apply" and "manage".
 *
 * Mirrors the dealer flow: registering files an application that an admin must
 * approve. Which state the user is in decides what they see, so nobody is
 * invited to re-apply while a listing is already pending.
 */
export default function BusinessForm() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [biz, setBiz] = useState(undefined); // undefined = loading, null = none
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [logo, setLogo] = useState(null);
  const [cover, setCover] = useState(null);
  const [uploading, setUploading] = useState("");
  const logoRef = useRef(null);
  const coverRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) { setBiz(null); return; }
    businessApi
      .mine()
      .then((res) => {
        setBiz(res?.data ?? null);
        setLogo(res?.data?.logo?.url ? res.data.logo : null);
        setCover(res?.data?.coverImage?.url ? res.data.coverImage : null);
      })
      .catch(() => setBiz(null));
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
      businessName: String(fd.get("businessName") || ""),
      category: String(fd.get("category") || ""),
      city: String(fd.get("city") || ""),
      phone: String(fd.get("phone") || ""),
      description: String(fd.get("description") || ""),
    };
    OPTIONAL_FIELDS.forEach(([name]) => { body[name] = String(fd.get(name) || ""); });
    if (logo?.url) body.logo = logo;
    if (cover?.url) body.coverImage = cover;

    try {
      // An approved listing is edited in place; anything else files a new one.
      if (biz && biz.approvalStatus === "approved") {
        const res = await businessApi.update(biz._id, body);
        setBiz(res.data);
        toast.success(t("bizForm.updated"));
      } else {
        const res = await businessApi.register(body);
        setBiz(res.data);
        toast.success(t("bizForm.created"));
      }
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
        <Link href="/auth/login?redirect=/businesses/register" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
          {t("nav.login")}
        </Link>
      </Panel>
    );
  }

  if (biz === undefined) return <p className="text-[var(--hw-text-secondary)]">{t("common.loading")}</p>;

  if (biz && biz.approvalStatus === "pending") {
    return (
      <Panel className="border-[var(--hw-orange)]">
        <p className="text-3xl">⏳</p>
        <h2 className="mt-2 text-lg font-black text-[var(--hw-text-primary)] sm:text-2xl">{t("bizForm.pendingTitle")}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-base">{t("bizForm.pendingBody")}</p>
      </Panel>
    );
  }

  const isApproved = biz && biz.approvalStatus === "approved";

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
      {error ? <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] font-bold text-red-200">{error}</div> : null}

      {biz && biz.approvalStatus === "rejected" ? (
        <div className="mb-4 rounded-lg border border-[var(--hw-red)] bg-[var(--hw-soft-panel)] p-3">
          <p className="text-[13px] font-black text-[var(--hw-red)]">{t("bizForm.rejectedTitle")}</p>
          <p className="mt-1 text-[12px] text-[var(--hw-text-secondary)]">{t("bizForm.rejectedBody")}</p>
          {biz.reviewNote ? <p className="mt-1 text-[11px] italic text-[var(--hw-text-muted)]">{biz.reviewNote}</p> : null}
        </div>
      ) : null}

      {!isApproved ? (
        <p className="mb-3 rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-2.5 text-[11px] leading-5 text-[var(--hw-text-secondary)] sm:text-xs">
          {t("bizForm.reviewNotice")}
        </p>
      ) : null}

      <p className="mb-4 text-[11px] text-[var(--hw-text-muted)] sm:text-xs">{t("bizForm.requiredNote")}</p>

      {/* Images */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className={labelClass}>{t("bizForm.logo")}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--hw-orange)] text-xl font-black text-[var(--hw-text-inverse)]">
              {logo?.url
                ? <Image src={logo.url} alt="" width={64} height={64} className="h-full w-full object-cover" />
                : "?"}
            </div>
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => pickImage("logo", e.target.files?.[0])} />
            <button type="button" onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}
              className="h-10 rounded-lg border border-[var(--hw-border-strong)] px-3 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60">
              {uploading === "logo" ? "…" : t("dash.chooseImage")}
            </button>
          </div>
        </div>

        <div>
          <p className={labelClass}>{t("bizForm.cover")}</p>
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
        <label className={labelClass}>
          <Label required>{t("bizForm.businessName")}</Label>
          <input name="businessName" required maxLength={100} defaultValue={biz?.businessName || ""} className={inputClass} />
        </label>

        <label className={labelClass}>
          <Label required>{t("bizForm.category")}</Label>
          <select name="category" required defaultValue={biz?.category || ""} className={inputClass}>
            <option value="">{t("bizForm.selectCategory")}</option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{businessCategoryLabel(c.value)}</option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          <Label required>{t("bizForm.phone")}</Label>
          <input name="phone" type="tel" required defaultValue={biz?.phone || ""} className={inputClass} />
        </label>

        <label className={labelClass}>
          <Label required>{t("bizForm.city")}</Label>
          <select name="city" required defaultValue={biz?.city || ""} className={inputClass}>
            <option value="">{t("bizForm.selectCity")}</option>
            {CITIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>

        {OPTIONAL_FIELDS.map(([name, key, type]) => (
          <label key={name} className={labelClass}>
            <Label hint={t("bizForm.optional")}>{t(key)}</Label>
            <input name={name} type={type} defaultValue={biz?.[name] || ""} className={inputClass} />
          </label>
        ))}

        <label className={`${labelClass} sm:col-span-2`}>
          <Label hint={t("bizForm.optional")}>{t("bizForm.description")}</Label>
          <textarea name="description" defaultValue={biz?.description || ""} maxLength={1500} rows={4}
            className="mt-1.5 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:mt-2 sm:p-4" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={saving} className="h-11 flex-1 rounded-lg bg-[var(--hw-orange)] text-[13px] font-black text-[var(--hw-text-inverse)] disabled:opacity-60 sm:h-12 sm:text-sm">
          {saving ? t("bizForm.submitting") : isApproved ? t("dash.saveChanges") : t("bizForm.submit")}
        </button>
        {isApproved ? (
          <Link href={`/businesses/${biz._id}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-strong)] px-4 text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] sm:h-12 sm:text-sm">
            {t("bizForm.viewListing")}
          </Link>
        ) : null}
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
