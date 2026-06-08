"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { inspectorApi, normalizeApiError } from "@/lib/api";
import { CITIES, VEHICLE_TYPES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

const inputClass =
  "mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]";
const labelClass = "text-sm font-bold text-[var(--hw-text-secondary)]";

export default function InspectorRegisterForm() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [existing, setExisting] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { setReady(true); return; }
    inspectorApi.mine()
      .then((res) => setExisting(res.data || null))
      .catch(() => {})
      .finally(() => setReady(true));
  }, [isAuthenticated, loading]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const fd = new FormData(event.currentTarget);
    const body = {
      displayName: String(fd.get("displayName") || ""),
      type: String(fd.get("type") || "individual"),
      inspectionFee: Number(fd.get("inspectionFee") || 0),
      feeNote: String(fd.get("feeNote") || ""),
      city: String(fd.get("city") || ""),
      phone: String(fd.get("phone") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      email: String(fd.get("email") || ""),
      experienceYears: Number(fd.get("experienceYears") || 0),
      certifications: String(fd.get("certifications") || ""),
      bio: String(fd.get("bio") || ""),
      serviceAreas: fd.getAll("serviceAreas"),
      specializations: fd.getAll("specializations"),
    };

    try {
      if (existing) {
        await inspectorApi.updateMine(body);
        toast.success("Profile updated");
      } else {
        await inspectorApi.register(body);
        toast.success("Submitted for review");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !ready) return <div className="h-40 animate-pulse rounded-xl bg-[var(--hw-bg-card)]" />;

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Sign in to become an inspector</h2>
        <Link href="/auth/login?redirect=/inspectors/register" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Login</Link>
      </div>
    );
  }

  const e = existing || {};

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      {existing ? (
        <div className={`mb-5 rounded-lg border p-3 text-sm font-bold ${existing.isVerified ? "border-[var(--hw-green)] text-[var(--hw-green)]" : "border-[var(--hw-border-strong)] text-[var(--hw-text-secondary)]"}`}>
          {existing.isVerified ? "✅ Your profile is verified and live in the directory." : "⏳ Your profile is awaiting admin approval."}
        </div>
      ) : null}
      {error ? <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Name / business name
          <input name="displayName" required maxLength={100} defaultValue={e.displayName || user?.name || ""} className={inputClass} />
        </label>
        <label className={labelClass}>Type
          <select name="type" defaultValue={e.type || "individual"} className={inputClass}>
            <option value="individual">Individual inspector</option>
            <option value="company">Inspection company</option>
          </select>
        </label>
        <label className={labelClass}>Inspection fee (PKR)
          <input name="inspectionFee" type="number" min="0" required defaultValue={e.inspectionFee ?? ""} placeholder="5000" className={inputClass} />
        </label>
        <label className={labelClass}>Fee note
          <input name="feeNote" defaultValue={e.feeNote || ""} placeholder="per vehicle, on-site" className={inputClass} />
        </label>
        <label className={labelClass}>Base city
          <select name="city" required defaultValue={e.city || user?.city || ""} className={inputClass}>
            <option value="">Select city</option>
            {CITIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>
        <label className={labelClass}>Experience (years)
          <input name="experienceYears" type="number" min="0" defaultValue={e.experienceYears || ""} className={inputClass} />
        </label>
        <label className={labelClass}>Phone
          <input name="phone" defaultValue={e.phone || user?.phone || ""} placeholder="03001234567" className={inputClass} />
        </label>
        <label className={labelClass}>WhatsApp
          <input name="whatsapp" defaultValue={e.whatsapp || ""} placeholder="03001234567" className={inputClass} />
        </label>
        <label className={labelClass}>Email
          <input name="email" type="email" defaultValue={e.email || user?.email || ""} className={inputClass} />
        </label>
        <label className={labelClass}>Certifications
          <input name="certifications" defaultValue={e.certifications || ""} placeholder="e.g. mechanical engineer, 3rd-party certified" className={inputClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>About you
          <textarea name="bio" maxLength={1000} defaultValue={e.bio || ""} placeholder="Describe your inspection experience and what's included…" className="mt-2 min-h-28 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <CheckboxGroup title="Service areas (cities)" name="serviceAreas" items={CITIES} selected={e.serviceAreas || []} />
        <CheckboxGroup title="Vehicle specializations" name="specializations" items={VEHICLE_TYPES.slice(0, 12)} selected={e.specializations || []} />
      </div>

      <button disabled={saving} className="mt-6 h-12 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
        {saving ? "Saving…" : existing ? "Update profile" : "Submit for review"}
      </button>
      {!existing ? (
        <p className="mt-3 text-center text-xs text-[var(--hw-text-muted)]">
          Your profile is reviewed by our team before it appears in the directory.
        </p>
      ) : null}
    </form>
  );
}

function CheckboxGroup({ title, name, items, selected }) {
  const set = new Set(selected);
  return (
    <fieldset className="rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-4">
      <legend className="px-2 text-sm font-black text-[var(--hw-text-primary)]">{title}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {items.map((item) => {
          const value = typeof item === "string" ? item : item.value;
          const label = typeof item === "string" ? titleCase(item) : item.label;
          return (
            <label key={value} className="flex items-center gap-2 text-sm text-[var(--hw-text-secondary)]">
              <input type="checkbox" name={name} value={value} defaultChecked={set.has(value)} />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
