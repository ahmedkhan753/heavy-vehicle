"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { serviceRequestApi, normalizeApiError } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

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
      toast.success("Request submitted");
    } catch (err) {
      setError(normalizeApiError(err));
      toast.error("Could not submit request");
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
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Sign in to request this service</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">You need an account so we can contact you and you can track your request.</p>
        <Link
          href={`/auth/login?redirect=${encodeURIComponent(redirectTo || "/")}`}
          className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
        >
          Login to continue
        </Link>
      </div>
    );
  }

  if (created) {
    return (
      <div className="rounded-xl border border-[var(--hw-green)] bg-[var(--hw-bg-card)] p-8 text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-3 text-2xl font-black text-[var(--hw-text-primary)]">Request submitted!</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">
          Your reference number is{" "}
          <span className="font-black text-[var(--hw-orange)]">{created.reference}</span>.
          Our team will be in touch soon — we&apos;ve also emailed you a confirmation.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/requests" className="inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
            Track my requests
          </Link>
          <button
            onClick={() => setCreated(null)}
            className="inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"
          >
            Submit another
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
          Your name
          <input name="name" required defaultValue={user?.name || ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Phone
          <input name="phone" required defaultValue={user?.phone || ""} placeholder="03001234567" className={inputClass} />
        </label>
        <label className={labelClass}>
          City
          <select name="city" required defaultValue={user?.city || ""} className={inputClass}>
            <option value="">Select city</option>
            {CITIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Registration number
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
          Vehicle make
          <input name="make" placeholder="e.g. Hino" className={inputClass} />
        </label>
        <label className={labelClass}>
          Vehicle model
          <input name="model" placeholder="e.g. 700 Series" className={inputClass} />
        </label>
        <label className={labelClass}>
          Year
          <input name="year" type="number" min="1980" max={new Date().getFullYear() + 1} className={inputClass} />
        </label>

        <label className={`${labelClass} sm:col-span-2`}>
          Details / message
          <textarea name="notes" maxLength={2000} placeholder="Tell us what you need help with…" className="mt-2 min-h-28 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
        </label>
      </div>

      <button disabled={submitting} className="mt-6 h-12 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
        {submitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
