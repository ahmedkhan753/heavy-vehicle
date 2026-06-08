"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { subscriptionApi } from "@/lib/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const STATUSES = ["pending", "verified", "rejected"];

export default function PaymentsPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const [payments, setPayments] = useState([]);
  const [busyId, setBusyId] = useState("");

  const isAdmin = user?.role === "admin";

  async function load() {
    const res = await subscriptionApi.adminPayments(status).catch(() => null);
    setPayments(res?.data || []);
  }

  useEffect(() => {
    if (!isAdmin) return;
    subscriptionApi.adminPayments(status).then((res) => setPayments(res?.data || [])).catch(() => {});
  }, [isAdmin, status]);

  async function act(id, kind) {
    const note = kind === "reject" ? window.prompt("Reason for rejection (optional):") ?? "" : "";
    setBusyId(id);
    try {
      if (kind === "verify") await subscriptionApi.adminVerify(id, note);
      else await subscriptionApi.adminReject(id, note);
      toast.success(`Payment ${kind === "verify" ? "verified" : "rejected"}`);
      await load();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Not authorized</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">This area is for administrators only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${status === s ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-secondary)]"}`}
          >
            {s}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {payments.length ? payments.map((p) => (
          <div key={p._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-black text-[var(--hw-text-primary)]">
                {p.userId?.name || "Unknown"} <span className="text-sm font-normal text-[var(--hw-text-muted)]">· {p.userId?.email}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">
                {p.meta?.planKey} ({p.meta?.billingCycle}) · <strong>Rs {fmt(p.amount)}</strong> · {p.method} · ref: {p.reference || "—"}
              </p>
              {p.payer?.name || p.payer?.number ? (
                <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">
                  Paid from: <strong>{p.payer?.name || "—"}</strong> · {p.payer?.number || "—"}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-[var(--hw-text-muted)]">{new Date(p.createdAt).toLocaleString("en-PK")}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {p.proof?.url ? (
                <a href={p.proof.url} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-2 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">View proof</a>
              ) : null}
              {p.status === "pending" ? (
                <>
                  <button disabled={busyId === p._id} onClick={() => act(p._id, "verify")} className="rounded-lg bg-[var(--hw-green)] px-4 py-2 text-sm font-black text-white disabled:opacity-60">Verify</button>
                  <button disabled={busyId === p._id} onClick={() => act(p._id, "reject")} className="rounded-lg border border-[var(--hw-red)] px-4 py-2 text-sm font-bold text-[var(--hw-red)] hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60">Reject</button>
                </>
              ) : (
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${p.status === "verified" ? "bg-[var(--hw-green)] text-white" : "bg-[var(--hw-red)] text-white"}`}>{p.status}</span>
              )}
            </div>
          </div>
        )) : (
          <p className="p-8 text-center text-[var(--hw-text-secondary)]">No {status} payments.</p>
        )}
      </section>
    </div>
  );
}
