"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { saleApi } from "@/lib/api";

const fmt = (n) => Number(n || 0).toLocaleString("en-PK");

const statusStyle = {
  pending: "bg-[var(--hw-amber)] text-white",
  confirmed: "bg-[var(--hw-green)] text-white",
  disputed: "bg-[var(--hw-red)] text-white",
  cancelled: "bg-[var(--hw-border-strong)] text-white",
};

export default function Purchases() {
  const { isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [busyId, setBusyId] = useState("");

  async function load() {
    const res = await saleApi.myPurchases().catch(() => null);
    setSales(res?.data || []);
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    saleApi.myPurchases().then((res) => setSales(res?.data || [])).catch(() => {});
  }, [isAuthenticated]);

  async function act(id, kind) {
    if (kind === "confirm" && !window.confirm("Confirm you bought this item at the stated price?")) return;
    const note = kind === "dispute" ? window.prompt("What's wrong with this sale? (optional)") ?? "" : "";
    setBusyId(id);
    try {
      if (kind === "confirm") await saleApi.confirm(id);
      else await saleApi.dispute(id, note);
      toast.success(kind === "confirm" ? "Purchase confirmed" : "Sale disputed");
      await load();
    } catch (err) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Login required</h2>
        <Link href="/auth/login?redirect=/dashboard/purchases" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Login</Link>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
      {sales.length ? sales.map((s) => (
        <div key={s._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-black text-[var(--hw-text-primary)]">{s.listingTitle || s.listingType}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${statusStyle[s.status] || ""}`}>{s.status}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--hw-text-muted)]">
              Seller: {s.sellerId?.name || "—"} · Price: Rs {fmt(s.salePrice)}
            </p>
          </div>
          {s.status === "pending" ? (
            <div className="flex shrink-0 gap-2">
              <button disabled={busyId === s._id} onClick={() => act(s._id, "confirm")} className="rounded-lg bg-[var(--hw-green)] px-4 py-2 text-sm font-black text-white disabled:opacity-60">Confirm</button>
              <button disabled={busyId === s._id} onClick={() => act(s._id, "dispute")} className="rounded-lg border border-[var(--hw-red)] px-4 py-2 text-sm font-bold text-[var(--hw-red)] hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60">Dispute</button>
            </div>
          ) : null}
        </div>
      )) : (
        <p className="p-8 text-center text-[var(--hw-text-secondary)]">No purchases to confirm. When a seller records a sale to you, it appears here.</p>
      )}
    </section>
  );
}
