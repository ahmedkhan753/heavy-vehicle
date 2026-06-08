"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { dealerApi } from "@/lib/api";
import { titleCase } from "@/lib/format";

const FILTERS = ["pending", "approved", "rejected"];

export default function WarrantyPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");

  const isAdmin = user?.role === "admin";

  async function load() {
    const res = await dealerApi.adminWarrantyList(status).catch(() => null);
    setItems(res?.data || []);
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, status]);

  async function review(id, approve) {
    const note = approve ? "" : (window.prompt("Reason for rejecting (optional):") ?? "");
    setBusyId(id);
    try {
      await dealerApi.adminReviewWarranty(id, approve, note);
      toast.success(approve ? "Warranty approved" : "Warranty rejected");
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
        {FILTERS.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize transition ${status === s ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"}`}>{s}</button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {items.length ? items.map((d) => (
          <div key={d._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-black text-[var(--hw-text-primary)]">
                {d.businessName} <span className="text-sm font-normal text-[var(--hw-text-muted)]">· {titleCase(d.city)} · {d.userId?.email || ""}</span>
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-[var(--hw-text-secondary)]">{d.warranty?.terms || "(no terms provided)"}</p>
              {d.warranty?.reviewNote ? <p className="mt-1 text-xs text-[var(--hw-text-muted)]">Note: {d.warranty.reviewNote}</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {d.warranty?.status !== "approved" ? (
                <button disabled={busyId === d._id} onClick={() => review(d._id, true)} className="rounded-lg bg-[var(--hw-green)] px-4 py-2 text-sm font-black text-white disabled:opacity-60">Approve</button>
              ) : null}
              {d.warranty?.status !== "rejected" ? (
                <button disabled={busyId === d._id} onClick={() => review(d._id, false)} className="rounded-lg border border-[var(--hw-border-strong)] px-4 py-2 text-sm font-bold text-[var(--hw-text-primary)] disabled:opacity-60">
                  {d.warranty?.status === "approved" ? "Revoke" : "Reject"}
                </button>
              ) : null}
            </div>
          </div>
        )) : (
          <p className="p-8 text-center text-[var(--hw-text-secondary)]">No {status} warranty requests.</p>
        )}
      </section>
    </div>
  );
}
