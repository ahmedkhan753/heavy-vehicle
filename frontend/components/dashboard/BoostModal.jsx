"use client";

/**
 * BoostModal — buy a one-time per-listing upgrade/add-on (no subscription).
 * Self-contained modal (no external deps).
 */

import { useEffect, useState } from "react";
import { useToast } from "@/Context/ToastContext";
import { adUpgradeApi, normalizeApiError, uploadApi } from "@/lib/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

export default function BoostModal({ listing, listingType = "Vehicle", onClose, onDone }) {
  const toast = useToast();
  const [opts, setOpts] = useState(null);
  const [item, setItem] = useState("");
  const [method, setMethod] = useState("bank");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingCard, setPayingCard] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    adUpgradeApi.options().then((res) => setOpts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

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

  async function submit() {
    setError("");
    if (!item) return setError("Choose a boost.");
    if (!proof?.url || !reference.trim()) return setError("Upload your payment screenshot and enter the transaction reference.");
    setSubmitting(true);
    try {
      await adUpgradeApi.checkout({
        listingType,
        listingId: listing._id,
        item,
        method,
        proof,
        reference: reference.trim(),
      });
      toast.success("Payment submitted. Your boost applies once verified.");
      onDone?.();
      onClose?.();
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setSubmitting(false);
    }
  }

  // Card rail: hand off to Safepay's hosted checkout; the webhook applies the
  // boost on success (no proof upload, no admin step).
  async function startCardCheckout() {
    setError("");
    if (!item) return setError("Choose a boost.");
    setPayingCard(true);
    try {
      const res = await adUpgradeApi.checkoutCard({ listingType, listingId: listing._id, item });
      const url = res?.data?.checkoutUrl;
      if (!url) throw new Error("Could not start card checkout. Please try again.");
      window.location.href = url;
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
      setPayingCard(false);
    }
  }

  const boosts = opts?.boosts || [];
  const payInfo = opts?.payment;
  const selected = boosts.find((b) => b.key === item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[var(--hw-text-primary)]">Boost listing</h2>
          <button onClick={onClose} className="text-sm font-bold text-[var(--hw-text-muted)] hover:text-[var(--hw-text-primary)]">✕</button>
        </div>
        <p className="mt-1 truncate text-sm text-[var(--hw-text-muted)]">{listing.title}</p>

        {error ? <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm font-bold text-red-300">{error}</div> : null}

        {/* Boost options */}
        <div className="mt-4 grid gap-2">
          {boosts.map((b) => (
            <button
              key={b.key}
              onClick={() => setItem(b.key)}
              className={`flex items-center justify-between rounded-lg border p-3 text-left transition ${item === b.key ? "border-[var(--hw-orange)] bg-[var(--hw-soft-panel)]" : "border-[var(--hw-border-default)] hover:border-[var(--hw-orange)]"}`}
            >
              <span className="text-sm font-bold text-[var(--hw-text-primary)]">{b.label}</span>
              <span className="text-sm font-black text-[var(--hw-orange)]">Rs {fmt(b.price)}</span>
            </button>
          ))}
        </div>

        {/* Payment */}
        {selected ? (
          <div className="mt-4 border-t border-[var(--hw-border-subtle)] pt-4">
            {/* Instant card/wallet rail (Safepay), shown only when configured. */}
            {opts?.cardEnabled ? (
              <div className="mb-4 rounded-lg border border-[var(--hw-green)]/40 bg-[var(--hw-soft-panel)] p-3">
                <button
                  disabled={payingCard}
                  onClick={startCardCheckout}
                  className="h-11 w-full rounded-lg bg-[var(--hw-green)] text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {payingCard ? "Redirecting…" : `⚡ Pay Rs ${fmt(selected.price)} with Card`}
                </button>
                <p className="mt-2 text-center text-xs text-[var(--hw-text-muted)]">Instant via Safepay · applies automatically. Or pay manually below.</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {(opts?.methods || ["bank"]).map((m) => (
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
            <button disabled={submitting || uploading} onClick={submit} className="mt-4 h-11 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
              {submitting ? "Submitting…" : `Pay Rs ${fmt(selected.price)}`}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
