"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { normalizeApiError, subscriptionApi, uploadApi } from "@/lib/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const slotLabel = (n) => (n === -1 ? "Unlimited" : n);

export default function Billing() {
  const { isAuthenticated, loading } = useAuth();
  const toast = useToast();

  const [plansData, setPlansData] = useState(null);
  const [mine, setMine] = useState(null);
  const [cycle, setCycle] = useState("monthly");
  const [selected, setSelected] = useState(null); // plan key being checked out
  const [method, setMethod] = useState("bank");
  const [reference, setReference] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [proof, setProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payingCard, setPayingCard] = useState(false);
  const [error, setError] = useState("");
  const checkoutRef = useRef(null);

  // "Choose plan" renders the payment form further down the page, which on a
  // phone is entirely below the fold — the button looked broken because
  // nothing visibly happened. Scroll it into view once it has rendered.
  useEffect(() => {
    if (!selected || !checkoutRef.current) return;
    checkoutRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selected]);

  async function loadMine() {
    const res = await subscriptionApi.me().catch(() => null);
    setMine(res?.data || null);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    subscriptionApi.plans().then((res) => setPlansData(res.data)).catch(() => {});
    subscriptionApi.me().then((res) => setMine(res?.data || null)).catch(() => setMine(null));
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

  function resetCheckoutFields() {
    setProof(null);
    setReference("");
    setSenderName("");
    setSenderNumber("");
  }

  async function submitCheckout(planKey) {
    setError("");
    if (!proof?.url || !reference.trim()) {
      setError("Upload your payment screenshot and enter the transaction reference.");
      return;
    }
    if (!senderName.trim() || !senderNumber.trim()) {
      setError("Enter the name and account/wallet number you paid from.");
      return;
    }
    setSubmitting(true);
    try {
      await subscriptionApi.checkout({
        planKey,
        billingCycle: cycle,
        method,
        proof,
        reference: reference.trim(),
        senderName: senderName.trim(),
        senderNumber: senderNumber.trim(),
      });
      toast.success("Payment submitted. Awaiting verification.");
      setSelected(null);
      resetCheckoutFields();
      await loadMine();
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
    } finally {
      setSubmitting(false);
    }
  }

  // Card rail: create a Safepay session and hand the browser off to the secure
  // hosted checkout. On success Safepay redirects to /payment/callback, and its
  // webhook activates the plan — no proof upload, no admin step.
  async function startCardCheckout(planKey) {
    setError("");
    setPayingCard(true);
    try {
      const res = await subscriptionApi.checkoutCard({ planKey, billingCycle: cycle });
      const url = res?.data?.checkoutUrl;
      if (!url) throw new Error("Could not start card checkout. Please try again.");
      window.location.href = url;
    } catch (err) {
      setError(normalizeApiError(err.payload || err));
      setPayingCard(false);
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Login required</h2>
        <Link href="/auth/login?redirect=/dashboard/billing" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Login</Link>
      </div>
    );
  }

  const sub = mine?.subscription;
  const usage = mine?.usage;
  const pending = mine?.pendingPayment;
  const plans = plansData?.plans || [];
  const payInfo = plansData?.payment;

  return (
    <div className="grid gap-6">
      {/* Current status */}
      <section className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
        <h2 className="text-lg font-black text-[var(--hw-text-primary)]">Your subscription</h2>
        {sub ? (
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-[var(--hw-green)] px-3 py-1 text-xs font-black uppercase text-white">{sub.planKey} · active</span>
            <span className="text-sm text-[var(--hw-text-secondary)]">
              Featured slots: <strong>{usage?.featuredUsed || 0} / {slotLabel(usage?.featuredSlots)}</strong>
            </span>
            <span className="text-sm text-[var(--hw-text-muted)]">Renews/ends {new Date(sub.currentPeriodEnd).toLocaleDateString("en-PK")}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">No active subscription. Choose a plan below to start featuring your listings.</p>
        )}
        {pending ? (
          <div className="mt-4 rounded-lg border border-[var(--hw-amber)] bg-[var(--hw-soft-panel)] p-3 text-sm font-bold text-[var(--hw-text-secondary)]">
            ⏳ Payment of Rs {fmt(pending.amount)} is awaiting admin verification.
          </div>
        ) : null}
      </section>

      {/* Billing cycle toggle */}
      <div className="flex items-center gap-2">
        {["monthly", "annual"].map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${cycle === c ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-secondary)]"}`}
          >
            {c}{c === "annual" ? " (2 months free)" : ""}
          </button>
        ))}
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const price = cycle === "annual" ? p.annual : p.monthly;
          const isCurrent = sub?.planKey === p.key;
          return (
            <div key={p.key} className={`flex flex-col rounded-xl border bg-[var(--hw-bg-card)] p-5 ${p.key === "pro" ? "border-[var(--hw-orange)]" : "border-[var(--hw-border-default)]"}`}>
              <h3 className="text-xl font-black text-[var(--hw-text-primary)]">{p.name}</h3>
              <p className="mt-2 text-2xl font-black text-[var(--hw-text-primary)]">Rs {fmt(price)}<span className="text-sm font-bold text-[var(--hw-text-muted)]">/{cycle === "annual" ? "yr" : "mo"}</span></p>
              <ul className="mt-4 grid gap-2 text-sm text-[var(--hw-text-secondary)]">
                <li>★ {slotLabel(p.featuredSlots)} featured slots</li>
                {p.premiumSlots ? <li>★ {p.premiumSlots} premium slots</li> : null}
                <li>★ Dealer badge</li>
              </ul>
              <button
                disabled={isCurrent}
                onClick={() => { setSelected(p.key); resetCheckoutFields(); setError(""); }}
                className="mt-5 h-11 rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)] disabled:opacity-50"
              >
                {isCurrent ? "Current plan" : "Choose plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout panel */}
      {selected ? (
        <section ref={checkoutRef} className="scroll-mt-24 rounded-xl border border-[var(--hw-orange)] bg-[var(--hw-bg-card)] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-[var(--hw-text-primary)]">
              Pay for {plans.find((p) => p.key === selected)?.name} — Rs {fmt(cycle === "annual" ? plans.find((p) => p.key === selected)?.annual : plans.find((p) => p.key === selected)?.monthly)}
            </h2>
            <button onClick={() => setSelected(null)} className="text-sm font-bold text-[var(--hw-text-muted)] hover:text-[var(--hw-text-primary)]">✕ Cancel</button>
          </div>

          {error ? <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</div> : null}

          {/* Method */}
          <div className="mt-4">
            <p className="text-sm font-bold text-[var(--hw-text-secondary)]">Payment method</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(plansData?.methods || ["bank"]).map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${method === m ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"}`}>{m}</button>
              ))}
              {/* Card chip stays "Soon" only until the Safepay gateway is configured. */}
              {!plansData?.cardEnabled ? (
                <span
                  title="Card payments are coming soon"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-dashed border-[var(--hw-border-default)] px-3 py-1.5 text-sm font-bold text-[var(--hw-text-muted)]"
                >
                  Card <span className="rounded bg-[var(--hw-soft-panel)] px-1.5 py-0.5 text-[10px] uppercase">Soon</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Instant card/wallet rail (Safepay) — one click, auto-activates. */}
          {plansData?.cardEnabled ? (
            <div className="mt-4 rounded-lg border border-[var(--hw-green)]/40 bg-[var(--hw-soft-panel)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--hw-text-primary)]">⚡ Pay instantly with Card / Wallet</p>
                  <p className="text-xs text-[var(--hw-text-muted)]">Secure checkout via Safepay — your plan activates automatically, no waiting for verification.</p>
                </div>
                <button
                  disabled={payingCard}
                  onClick={() => startCardCheckout(selected)}
                  className="h-11 shrink-0 rounded-lg bg-[var(--hw-green)] px-5 text-sm font-black text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {payingCard ? "Redirecting…" : "Pay with Card"}
                </button>
              </div>
              <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-wide text-[var(--hw-text-muted)]">— or pay manually by transfer below —</p>
            </div>
          ) : null}

          {/* Instructions */}
          <div className="mt-4 rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-4 text-sm text-[var(--hw-text-secondary)]">
            {method === "bank" && payInfo?.bank ? (
              <div className="grid gap-1">
                <span><strong>Bank:</strong> {payInfo.bank.bankName}</span>
                <span><strong>Title:</strong> {payInfo.bank.accountTitle}</span>
                <span><strong>Account #:</strong> {payInfo.bank.accountNumber}</span>
                <span><strong>IBAN:</strong> {payInfo.bank.iban}</span>
              </div>
            ) : null}
            {method !== "bank" && payInfo?.[method] ? (
              <div className="grid gap-1">
                <span><strong>Title:</strong> {payInfo[method].accountTitle}</span>
                <span><strong>Number:</strong> {payInfo[method].number}</span>
              </div>
            ) : null}
            {payInfo?.note ? <p className="mt-2 text-xs text-[var(--hw-text-muted)]">{payInfo.note}</p> : null}
          </div>

          {/* Who/where the transfer came from + proof + reference */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
              {method === "bank" ? "Account holder name" : "Wallet account name"}
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder={method === "bank" ? "Name on the bank account" : "Name on the wallet"}
                className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none placeholder:text-[var(--hw-text-muted)] focus:border-[var(--hw-orange)]"
              />
            </label>
            <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
              {method === "bank" ? "Account number you paid from" : `${method === "jazzcash" ? "JazzCash" : "Easypaisa"} number you paid from`}
              <input
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                inputMode={method === "bank" ? "text" : "tel"}
                placeholder={method === "bank" ? "e.g. account / IBAN" : "e.g. 03XXXXXXXXX"}
                className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none placeholder:text-[var(--hw-text-muted)] focus:border-[var(--hw-orange)]"
              />
            </label>
            <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
              Transaction ID / reference
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="From your transfer receipt"
                className="mt-2 h-12 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-4 text-[var(--hw-text-primary)] outline-none placeholder:text-[var(--hw-text-muted)] focus:border-[var(--hw-orange)]"
              />
            </label>
            <label className="text-sm font-bold text-[var(--hw-text-secondary)]">
              Payment screenshot
              <input type="file" accept="image/*" onChange={(e) => uploadProof(e.target.files?.[0])} className="mt-2 block w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3 text-sm" />
              {uploading ? <span className="mt-1 block text-xs text-[var(--hw-text-muted)]">Uploading…</span> : null}
              {proof?.url ? <span className="mt-1 block text-xs text-[var(--hw-green)]">✓ Uploaded</span> : null}
            </label>
          </div>

          <button
            disabled={submitting || uploading}
            onClick={() => submitCheckout(selected)}
            className="mt-5 h-12 w-full rounded-lg bg-[var(--hw-orange)] text-sm font-black text-[var(--hw-text-inverse)] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit payment for verification"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
