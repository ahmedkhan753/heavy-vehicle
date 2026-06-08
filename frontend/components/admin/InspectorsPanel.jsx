"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { inspectorApi } from "@/lib/api";
import { titleCase, formatPrice } from "@/lib/format";

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
];

export default function InspectorsPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");

  const isAdmin = user?.role === "admin";

  async function load() {
    const res = await inspectorApi.adminList(status).catch(() => null);
    setItems(res?.data || []);
  }

  useEffect(() => {
    if (!isAdmin) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, status]);

  async function act(id, fn, ok) {
    setBusyId(id);
    try {
      await fn();
      toast.success(ok);
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
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setStatus(f.value)} className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${status === f.value ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]" : "border border-[var(--hw-border-default)] text-[var(--hw-text-secondary)]"}`}>{f.label}</button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {items.length ? items.map((ins) => (
          <div key={ins._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-black text-[var(--hw-text-primary)]">
                {ins.displayName} <span className="text-sm font-normal text-[var(--hw-text-muted)]">· {ins.type} · {titleCase(ins.city)}</span>
              </p>
              <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">
                Fee {formatPrice(ins.inspectionFee)} · {ins.userId?.name || ""} ({ins.userId?.email || ""}) · {ins.phone || "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--hw-text-muted)]">
                {ins.isVerified ? "Verified" : "Pending"} · {ins.isActive ? "Active" : "Inactive"}
                {ins.specializations?.length ? ` · ${ins.specializations.slice(0, 4).map(titleCase).join(", ")}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {ins.isVerified ? (
                <button disabled={busyId === ins._id} onClick={() => act(ins._id, () => inspectorApi.adminVerify(ins._id, false), "Unverified")} className="rounded-lg border border-[var(--hw-border-strong)] px-4 py-2 text-sm font-bold text-[var(--hw-text-primary)] disabled:opacity-60">Unverify</button>
              ) : (
                <button disabled={busyId === ins._id} onClick={() => act(ins._id, () => inspectorApi.adminVerify(ins._id, true), "Verified")} className="rounded-lg bg-[var(--hw-green)] px-4 py-2 text-sm font-black text-white disabled:opacity-60">Verify</button>
              )}
              <button disabled={busyId === ins._id} onClick={() => act(ins._id, () => inspectorApi.adminToggle(ins._id, !ins.isActive), ins.isActive ? "Deactivated" : "Activated")} className="rounded-lg border border-[var(--hw-border-strong)] px-4 py-2 text-sm font-bold text-[var(--hw-text-primary)] disabled:opacity-60">
                {ins.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        )) : (
          <p className="p-8 text-center text-[var(--hw-text-secondary)]">No inspectors found.</p>
        )}
      </section>
    </div>
  );
}
