"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { dealerApi } from "@/lib/api";
import { titleCase } from "@/lib/format";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const SPEC_LABEL = { vehicles: "Vehicles", parts: "Parts", both: "Vehicles + Parts" };

/**
 * DealersPanel — admin review queue for dealer applications.
 *
 * Registering only creates a request; approving here is what flips the
 * account to the dealer role and makes the storefront public.
 */
export default function DealersPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [dialog, setDialog] = useState(null); // { dealer, approve }
  const [note, setNote] = useState("");

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    const res = await dealerApi.adminApplications(status).catch(() => null);
    setItems(res?.data?.dealers || []);
    setCounts(res?.data?.counts || {});
  }, [status]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  async function confirm() {
    const { dealer, approve } = dialog;
    setBusyId(dealer._id);
    try {
      await dealerApi.adminReviewApplication(dealer._id, approve, note);
      toast.success(approve ? "Dealer approved" : "Application rejected");
      setDialog(null);
      setNote("");
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not update the application.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAdmin) return <p className="text-[var(--hw-text-secondary)]">Admins only.</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition sm:text-sm ${
              status === tab.value
                ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-secondary)]"
            }`}
          >
            {tab.label} ({counts[tab.value] || 0})
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {items.length ? items.map((d) => (
          <div key={d._id} className="border-b border-[var(--hw-border-subtle)] p-3 last:border-b-0 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-black text-[var(--hw-text-primary)] sm:text-base">{d.businessName}</p>
                <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                  {titleCase(d.businessType)} · {SPEC_LABEL[d.specialization] || "Vehicles"} · {titleCase(d.city)}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                  {d.userId?.name} · {d.userId?.email} · {d.phone || d.userId?.phone}
                </p>
                {d.description ? (
                  <p className="mt-1.5 line-clamp-2 text-[12px] text-[var(--hw-text-secondary)]">{d.description}</p>
                ) : null}
                {d.reviewNote ? (
                  <p className="mt-1.5 text-[11px] italic text-[var(--hw-text-muted)]">Note: {d.reviewNote}</p>
                ) : null}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                d.approvalStatus === "approved" ? "bg-[var(--hw-green)] text-[var(--hw-text-inverse)]"
                : d.approvalStatus === "rejected" ? "bg-[var(--hw-red)] text-white"
                : "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
              }`}>
                {d.approvalStatus}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Link href={`/dealers/${d._id}`} className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)]">
                View profile
              </Link>
              {d.approvalStatus !== "approved" ? (
                <button
                  disabled={busyId === d._id}
                  onClick={() => { setNote(""); setDialog({ dealer: d, approve: true }); }}
                  className="rounded-lg bg-[var(--hw-green)] px-3 py-1.5 text-[12px] font-black text-[var(--hw-text-inverse)] disabled:opacity-60"
                >
                  Approve
                </button>
              ) : null}
              {d.approvalStatus !== "rejected" ? (
                <button
                  disabled={busyId === d._id}
                  onClick={() => { setNote(""); setDialog({ dealer: d, approve: false }); }}
                  className="rounded-lg border border-[var(--hw-red)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-red)] transition hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60"
                >
                  Reject
                </button>
              ) : null}
            </div>
          </div>
        )) : (
          <p className="p-6 text-center text-[13px] text-[var(--hw-text-secondary)] sm:p-8">
            No {status} applications.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        busy={Boolean(dialog) && busyId === dialog.dealer._id}
        tone={dialog?.approve ? "default" : "danger"}
        title={dialog?.approve ? "Approve this dealer?" : "Reject this application?"}
        message={
          dialog?.approve
            ? "Their storefront goes live and the account becomes a dealer."
            : "The account stays a normal user. They can re-apply later."
        }
        confirmLabel={dialog?.approve ? "Yes, approve" : "Yes, reject"}
        cancelLabel="Cancel"
        onCancel={() => setDialog(null)}
        onConfirm={confirm}
      >
        <label className="text-[12px] font-bold text-[var(--hw-text-secondary)]">
          Note (optional)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}
