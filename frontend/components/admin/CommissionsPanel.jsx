"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { commissionApi } from "@/lib/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const STATUSES = ["due", "paid", "waived"];

export default function CommissionsPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("due");
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");

  const isAdmin = user?.role === "admin";

  async function load() {
    const res = await commissionApi.adminList(status).catch(() => null);
    setItems(res?.data || []);
  }

  useEffect(() => {
    if (!isAdmin) return;
    commissionApi.adminList(status).then((res) => setItems(res?.data || [])).catch(() => {});
  }, [isAdmin, status]);

  async function act(id, kind) {
    const note = kind === "waive" ? window.prompt("Reason for waiving (optional):") ?? "" : "";
    setBusyId(id);
    try {
      if (kind === "paid") await commissionApi.adminMarkPaid(id, note);
      else await commissionApi.adminWaive(id, note);
      toast.success(`Commission ${kind === "paid" ? "marked paid" : "waived"}`);
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
          <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${status === s ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-secondary)]"}`}>{s}</button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {items.length ? items.map((c) => (
          <div key={c._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-black text-[var(--hw-text-primary)]">
                {c.userId?.name || "Unknown"} <span className="text-sm font-normal text-[var(--hw-text-muted)]">· {c.userId?.email}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">
                {c.listingTitle} · sold Rs {fmt(c.salePrice)} · owes <strong>Rs {fmt(c.amount)}</strong> ({(c.rate * 100).toFixed(2)}%)
              </p>
              <p className="mt-1 text-xs text-[var(--hw-text-muted)]">
                {c.paymentId ? `Ref: ${c.paymentId.reference || "—"} · ${c.paymentId.method || ""}` : "No payment submitted"}
                {c.dueAt ? ` · due ${new Date(c.dueAt).toLocaleDateString("en-PK")}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {c.paymentId?.proof?.url ? (
                <a href={c.paymentId.proof.url} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-2 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">View proof</a>
              ) : null}
              {c.status === "due" ? (
                <>
                  <button disabled={busyId === c._id} onClick={() => act(c._id, "paid")} className="rounded-lg bg-[var(--hw-green)] px-4 py-2 text-sm font-black text-white disabled:opacity-60">Mark paid</button>
                  <button disabled={busyId === c._id} onClick={() => act(c._id, "waive")} className="rounded-lg border border-[var(--hw-border-strong)] px-4 py-2 text-sm font-bold text-[var(--hw-text-primary)] disabled:opacity-60">Waive</button>
                </>
              ) : (
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${c.status === "paid" ? "bg-[var(--hw-green)] text-white" : "bg-[var(--hw-border-strong)] text-white"}`}>{c.status}</span>
              )}
            </div>
          </div>
        )) : (
          <p className="p-8 text-center text-[var(--hw-text-secondary)]">No {status} commissions.</p>
        )}
      </section>
    </div>
  );
}
