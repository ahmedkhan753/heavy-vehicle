"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { serviceRequestApi } from "@/lib/api";

const SERVICE_LABEL = {
  inspection: "Vehicle Inspection",
  warranty: "Warranty Program",
};

const STATUS_STYLE = {
  pending: "bg-[var(--hw-soft-panel)] text-[var(--hw-text-secondary)]",
  "in-progress": "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]",
  completed: "bg-[var(--hw-green)] text-white",
  cancelled: "bg-[var(--hw-border-strong)] text-white",
  rejected: "bg-[var(--hw-red,#ef4444)] text-white",
};

const dateLabel = (v) => (v ? new Date(v).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "");

export default function ServiceRequests() {
  const { isAuthenticated, loading } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [busyId, setBusyId] = useState("");

  async function load() {
    try {
      const res = await serviceRequestApi.mine();
      setItems(res?.data || []);
    } catch {
      setItems([]);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setFetching(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading]);

  async function cancel(id) {
    if (!window.confirm("Cancel this request?")) return;
    setBusyId(id);
    try {
      await serviceRequestApi.cancel(id);
      toast.success("Request cancelled");
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not cancel");
    } finally {
      setBusyId("");
    }
  }

  if (loading || fetching) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Please sign in</h2>
        <Link href="/auth/login?redirect=/dashboard/requests" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Login</Link>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
        <h2 className="text-xl font-black text-[var(--hw-text-primary)]">No service requests yet</h2>
        <p className="mt-2 text-[var(--hw-text-secondary)]">Book a vehicle inspection or request warranty cover.</p>
        <Link href="/services" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Request a service</Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
      {items.map((r) => (
        <div key={r._id} className="flex flex-col gap-3 border-b border-[var(--hw-border-subtle)] p-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-[var(--hw-text-primary)]">{SERVICE_LABEL[r.serviceType] || r.serviceType}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLE[r.status] || ""}`}>
                {r.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--hw-text-secondary)]">
              Ref <strong>{r.reference}</strong>
              {r.vehicle?.title ? ` · ${r.vehicle.title}` : r.vehicleInfo?.make ? ` · ${r.vehicleInfo.make} ${r.vehicleInfo.model || ""}` : ""}
            </p>
            <p className="mt-1 text-xs text-[var(--hw-text-muted)]">Submitted {dateLabel(r.createdAt)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {["pending", "in-progress"].includes(r.status) ? (
              <button
                disabled={busyId === r._id}
                onClick={() => cancel(r._id)}
                className="rounded-lg border border-[var(--hw-border-strong)] px-4 py-2 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)] disabled:opacity-60"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
