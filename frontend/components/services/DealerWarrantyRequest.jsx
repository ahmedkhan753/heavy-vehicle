"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { dealerApi, normalizeApiError } from "@/lib/api";

const STATUS_TEXT = {
  none: "",
  pending: "⏳ Your warranty badge is awaiting admin review.",
  approved: "✅ Your warranty badge is approved and shows on your listings.",
  rejected: "❌ Your last request was not approved. You can update your terms and resubmit.",
};

export default function DealerWarrantyRequest() {
  const { isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const [dealer, setDealer] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("none");

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) { setReady(true); return; }
    dealerApi.mine()
      .then((res) => { setDealer(res.data || null); setStatus(res.data?.warranty?.status || "none"); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [isAuthenticated, loading]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const terms = String(new FormData(event.currentTarget).get("terms") || "");
    try {
      await dealerApi.requestWarranty(terms);
      setStatus("pending");
      toast.success("Warranty badge requested");
    } catch (err) {
      setError(normalizeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading || !ready) return <div className="h-32 animate-pulse rounded-xl bg-[var(--hw-bg-card)]" />;

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center">
        <p className="font-bold text-[var(--hw-text-primary)]">Sign in as a dealer to offer warranty.</p>
        <Link href="/auth/login?redirect=/services/warranty" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Login</Link>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center">
        <p className="font-bold text-[var(--hw-text-primary)]">Warranty badges are for registered dealers.</p>
        <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">Create a dealer profile first, then request your warranty badge.</p>
        <Link href="/dealers/register" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Become a dealer</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
      {status !== "none" ? (
        <div className={`mb-4 rounded-lg border p-3 text-sm font-bold ${status === "approved" ? "border-[var(--hw-green)] text-[var(--hw-green)]" : "border-[var(--hw-border-strong)] text-[var(--hw-text-secondary)]"}`}>
          {STATUS_TEXT[status]}
        </div>
      ) : null}
      {error ? <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-200">{error}</div> : null}

      <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
        Describe your warranty (what's covered, how long, conditions)
        <textarea
          name="terms"
          required
          minLength={10}
          maxLength={1500}
          defaultValue={dealer.warranty?.terms || ""}
          placeholder="e.g. 6-month warranty on engine & gearbox for vehicles sold by us; covers parts and labour at our workshop…"
          className="mt-2 min-h-32 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-4 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
        />
      </label>
      <p className="mt-2 text-xs text-[var(--hw-text-muted)]">
        Your warranty is between you and the buyer. HeavyWheels only verifies that you offer one — we are not a party to the warranty.
      </p>
      <button disabled={saving} className="mt-4 h-12 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
        {saving ? "Submitting…" : status === "approved" ? "Update warranty terms" : "Request warranty badge"}
      </button>
    </form>
  );
}
