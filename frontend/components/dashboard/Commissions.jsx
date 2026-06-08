"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { commissionApi, normalizeApiError, uploadApi } from "@/lib/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

const statusStyle = {
  due: "bg-[var(--hw-amber)] text-white",
  paid: "bg-[var(--hw-green)] text-white",
  waived: "bg-[var(--hw-border-strong)] text-white",
};

export default function Commissions() {
  const { isAuthenticated, loading } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [payingId, setPayingId] = useState("");
  const [method, setMethod] = useState("bank");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await commissionApi.mine().catch(() => null);
    setData(res?.data || null);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    commissionApi.mine().then((res) => setData(res?.data || null)).catch(() => {});
  }, [isAuthenticated]);

  async function uploadProof(file) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadApi.images([file]);
      setProof(res.data.images[0]);
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setUploading(false);
    }
  }

  function openPay(id) {
    setPayingId(id);
    setProof(null);
    setReference("");
    setError("");
    setMethod("bank");
  }

  async function submitPay(id) {
    setError("");
    if (!proof?.url || !reference.trim()) {
      setError("Upload your payment screenshot and enter the transaction reference.");
      return;
    }
    setSubmitting(true);
    try {
      await commissionApi.pay(id, { method, proof, reference: reference.trim() });
      toast.success("Payment submitted. Awaiting verification.");
      setPayingId("");
      await load();
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Login required</h2>
        <Link href="/auth/login?redirect=/dashboard/commissions" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Login</Link>
      </div>
    );
  }

  const commissions = data?.commissions || [];
  const payInfo = data?.payment;

  return (
    <div className="grid gap-6">
      {/* Summary */}
      <section className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
        <p className="text-sm text-[var(--hw-text-muted)]">Total outstanding</p>
        <p className="mt-1 text-3xl font-black text-[var(--hw-text-primary)]">Rs {fmt(data?.totalDue)}</p>
        {data?.overdueCount ? (
          <div className="mt-3 rounded-lg border border-[var(--hw-red)] bg-red-500/10 p-3 text-sm font-bold text-[var(--hw-red)]">
            ⚠ {data.overdueCount} overdue. Posting new ads is blocked until you settle them.
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {commissions.length ? commissions.map((c) => (
          <div key={c._id} className="border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-black text-[var(--hw-text-primary)]">{c.listingTitle || c.listingType}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${statusStyle[c.status] || ""}`}>{c.status}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
                  Sold for Rs {fmt(c.salePrice)} · {(c.rate * 100).toFixed(2)}% = <strong className="text-[var(--hw-text-secondary)]">Rs {fmt(c.amount)}</strong>
                  {c.status === "due" && c.dueAt ? ` · due ${new Date(c.dueAt).toLocaleDateString("en-PK")}` : ""}
                </p>
              </div>
              {c.status === "due" ? (
                c.paymentId ? (
                  <span className="text-sm font-bold text-[var(--hw-amber)]">Payment submitted ⏳</span>
                ) : (
                  <button onClick={() => openPay(c._id)} className="rounded-lg bg-[var(--hw-orange)] px-4 py-2 text-sm font-black text-[var(--hw-text-inverse)]">Pay now</button>
                )
              ) : null}
            </div>

            {/* Inline pay form */}
            {payingId === c._id ? (
              <div className="mt-4 rounded-lg border border-[var(--hw-orange)] p-4">
                {error ? <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm font-bold text-red-300">{error}</div> : null}
                <div className="flex flex-wrap gap-2">
                  {(data?.methods || ["bank"]).map((m) => (
                    <button key={m} onClick={() => setMethod(m)} className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${method === m ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"}`}>{m}</button>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-3 text-sm text-[var(--hw-text-secondary)]">
                  {method === "bank" && payInfo?.bank ? (
                    <span>{payInfo.bank.bankName} · {payInfo.bank.accountTitle} · {payInfo.bank.accountNumber} · {payInfo.bank.iban}</span>
                  ) : payInfo?.[method] ? (
                    <span>{payInfo[method].accountTitle} · {payInfo[method].number}</span>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
                    Payment screenshot
                    <input type="file" accept="image/*" onChange={(e) => uploadProof(e.target.files?.[0])} className="mt-2 block w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-2 text-sm" />
                    {uploading ? <span className="mt-1 block text-xs text-[var(--hw-text-muted)]">Uploading…</span> : null}
                    {proof?.url ? <span className="mt-1 block text-xs text-[var(--hw-green)]">✓ Uploaded</span> : null}
                  </label>
                  <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
                    Transaction reference
                    <input value={reference} onChange={(e) => setReference(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
                  </label>
                </div>
                <div className="mt-3 flex gap-2">
                  <button disabled={submitting || uploading} onClick={() => submitPay(c._id)} className="h-11 rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">{submitting ? "Submitting…" : "Submit payment"}</button>
                  <button onClick={() => setPayingId("")} className="h-11 rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)]">Cancel</button>
                </div>
              </div>
            ) : null}
          </div>
        )) : (
          <p className="p-8 text-center text-[var(--hw-text-secondary)]">No commissions yet. They appear here when you mark a listing sold.</p>
        )}
      </section>
    </div>
  );
}
