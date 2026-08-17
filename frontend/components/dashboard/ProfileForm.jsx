"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { normalizeApiError, userApi } from "@/lib/api";

export default function ProfileForm() {
  const { isAuthenticated, loading, setUser } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    userApi.profile().then((res) => setProfile(res.data)).catch(() => {});
  }, [isAuthenticated]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    
    // Parse links from comma separated string to JSON string array
    const linksValue = formData.get("links");
    if (linksValue && typeof linksValue === "string") {
      const linksArray = linksValue.split(",").map(s => s.trim()).filter(Boolean);
      formData.set("links", JSON.stringify(linksArray));
    }
    
    // We send FormData directly because of the image upload
    try {
      const response = await userApi.updateProfile(formData);
      setProfile(response.data);
      setUser((current) => ({ ...current, ...response.data }));
      toast.success(t("dash.profileSettings"));
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">{t("common.loading")}</p>;
  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("dash.loginRequired")}</h2>
        <Link href="/auth/login?redirect=/dashboard/profile" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("nav.login")}</Link>
      </div>
    );
  }

  return (
    <section className="max-w-2xl rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      {error ? <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</div> : null}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
          Profile Picture
          <input type="file" name="image" accept="image/*" className="mt-2 block w-full text-sm text-[var(--hw-text-primary)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--hw-bg-elevated)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--hw-text-primary)] hover:file:bg-[var(--hw-border-default)] cursor-pointer" />
          {profile?.avatar?.url && <img src={profile.avatar.url} alt="Avatar" className="mt-2 h-16 w-16 rounded-full object-cover border" />}
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("form.name")}
          <input name="name" defaultValue={profile?.name || ""} required className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("form.city")}
          <input name="city" defaultValue={profile?.city || ""} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
          {t("auth.address")}
          <input name="address" defaultValue={profile?.address || ""} maxLength={200} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="Street / area, city" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
          Bio / Description
          <textarea name="bio" defaultValue={profile?.bio || ""} maxLength={500} rows={3} className="mt-2 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="Tell buyers a bit about yourself..." />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.email")}
          <input value={profile?.email || ""} disabled className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-deep)] px-4 text-[var(--hw-text-muted)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          WhatsApp Number
          <input name="whatsapp" defaultValue={profile?.whatsapp || ""} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="e.g. 03001234567" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
          {t("auth.phone")}
          <input value={profile?.phone || ""} disabled className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-deep)] px-4 text-[var(--hw-text-muted)]" />
        </label>
        <label className="text-sm font-bold text-[var(--hw-text-secondary)] sm:col-span-2">
          Social Links (Comma separated)
          <input name="links" defaultValue={profile?.links?.join(", ") || ""} className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" placeholder="https://facebook.com/..., https://instagram.com/..." />
        </label>
        <button disabled={saving} className="h-12 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60 sm:col-span-2">
          {saving ? t("form.saving") : t("form.save")}
        </button>
      </form>
    </section>
  );
}
