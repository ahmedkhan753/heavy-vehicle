"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { serviceRequestApi } from "@/lib/api";

const TYPES = [
  { value: "", label: "All services" },
  { value: "inspection", label: "Inspection" },
  { value: "warranty", label: "Warranty" },
];
const STATUSES = ["pending", "in-progress", "completed", "cancelled", "rejected"];

const dateLabel = (v) => (v ? new Date(v).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function ServiceRequestsPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");

  const isAdmin = user?.role === "admin";

  async function load() {
    const res = await serviceRequestApi.adminList({ type, status }).catch(() => null);
    setItems(res?.data || []);
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, type, status]);

  async function updateStatus(id, next) {
    const note = window.prompt(`Note for "${next}" (optional):`) ?? "";
    setBusyId(id);
    try {
      await serviceRequestApi.adminUpdateStatus(id, next, note);
      toast.success(`Marked ${next}`);
      await load();
    } catch (err) {
      toast.error(err?.message || "Update failed");
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
      <div className="mb-4 flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm font-bold text-[var(--hw-text-primary)]">
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={() => setStatus("")} className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize ${status === "" ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"}`}>all</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-lg px-3 py-1.5 text-sm font-bold capitalize ${status === s ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"}`}>{s}</button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {items.length ? items.map((r) => (
          <div key={r._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-black text-[var(--hw-text-primary)]">
                {r.reference} <span className="text-sm font-normal text-[var(--hw-text-muted)]">· {r.serviceType}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">
                {r.user?.name || "Unknown"} · {r.user?.email} · {r.contact?.phone || "—"} · {r.contact?.city || "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--hw-text-muted)]">
                {r.vehicle?.title || [r.vehicleInfo?.make, r.vehicleInfo?.model, r.vehicleInfo?.year].filter(Boolean).join(" ") || "No vehicle info"}
                {r.vehicleInfo?.registrationNumber ? ` · ${r.vehicleInfo.registrationNumber}` : ""}
                {r.details?.direction ? ` · ${r.details.direction}` : ""}
                {` · ${dateLabel(r.createdAt)}`}
              </p>
              {r.notes ? <p className="mt-1 text-xs text-[var(--hw-text-secondary)]">“{r.notes}”</p> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-[var(--hw-soft-panel)] px-3 py-1 text-xs font-black uppercase text-[var(--hw-text-secondary)]">{r.status}</span>
              <select
                value=""
                disabled={busyId === r._id}
                onChange={(e) => { if (e.target.value) updateStatus(r._id, e.target.value); }}
                className="h-10 rounded-lg border border-[var(--hw-border-strong)] bg-[var(--hw-bg-input)] px-3 text-sm font-bold text-[var(--hw-text-primary)] disabled:opacity-60"
              >
                <option value="">Set status…</option>
                {STATUSES.filter((s) => s !== r.status).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )) : (
          <p className="p-8 text-center text-[var(--hw-text-secondary)]">No requests found.</p>
        )}
      </section>
    </div>
  );
}
