"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { businessApi } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { businessCategoryLabel } from "@/lib/businesses";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/**
 * BusinessesPanel — admin review queue for directory listings.
 * Approving publishes the listing; "Feature" is the paid-placement toggle.
 */
export default function BusinessesPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [dialog, setDialog] = useState(null); // { biz, approve }
  const [note, setNote] = useState("");

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    const res = await businessApi.adminApplications(status).catch(() => null);
    setItems(res?.data?.businesses || []);
    setCounts(res?.data?.counts || {});
  }, [status]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  async function confirm() {
    const { biz, approve } = dialog;
    setBusyId(biz._id);
    try {
      await businessApi.adminReview(biz._id, approve, note);
      toast.success(approve ? "Business approved" : "Listing rejected");
      setDialog(null);
      setNote("");
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not update the listing.");
    } finally {
      setBusyId("");
    }
  }

  async function toggleFeatured(biz) {
    setBusyId(biz._id);
    try {
      await businessApi.adminToggleFeatured(biz._id, !biz.featured);
      toast.success(biz.featured ? "Un-featured" : "Featured");
      await load();
    } catch (err) {
      toast.error(err?.message || "Could not update.");
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
        {items.length ? items.map((b) => (
          <div key={b._id} className="border-b border-[var(--hw-border-subtle)] p-3 last:border-b-0 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-black text-[var(--hw-text-primary)] sm:text-base">
                  {b.businessName}
                  {b.featured ? <span className="ms-2 rounded bg-[var(--hw-orange)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--hw-text-inverse)]">★</span> : null}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                  {businessCategoryLabel(b.category)} · {titleCase(b.city)}{b.area ? ` · ${b.area}` : ""}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                  {b.userId?.name} · {b.userId?.email} · {b.phone}
                </p>
                {b.description ? (
                  <p className="mt-1.5 line-clamp-2 text-[12px] text-[var(--hw-text-secondary)]">{b.description}</p>
                ) : null}
                {b.reviewNote ? (
                  <p className="mt-1.5 text-[11px] italic text-[var(--hw-text-muted)]">Note: {b.reviewNote}</p>
                ) : null}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                b.approvalStatus === "approved" ? "bg-[var(--hw-green)] text-[var(--hw-text-inverse)]"
                : b.approvalStatus === "rejected" ? "bg-[var(--hw-red)] text-white"
                : "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
              }`}>
                {b.approvalStatus}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Link href={`/businesses/${b._id}`} className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)]">
                View listing
              </Link>
              {b.approvalStatus !== "approved" ? (
                <button disabled={busyId === b._id} onClick={() => { setNote(""); setDialog({ biz: b, approve: true }); }}
                  className="rounded-lg bg-[var(--hw-green)] px-3 py-1.5 text-[12px] font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
                  Approve
                </button>
              ) : (
                <button disabled={busyId === b._id} onClick={() => toggleFeatured(b)}
                  className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold transition disabled:opacity-60 ${b.featured ? "border-[var(--hw-orange)] text-[var(--hw-orange)]" : "border-[var(--hw-border-strong)] text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]"}`}>
                  {b.featured ? "Un-feature" : "Feature"}
                </button>
              )}
              {b.approvalStatus !== "rejected" ? (
                <button disabled={busyId === b._id} onClick={() => { setNote(""); setDialog({ biz: b, approve: false }); }}
                  className="rounded-lg border border-[var(--hw-red)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-red)] transition hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60">
                  Reject
                </button>
              ) : null}
            </div>
          </div>
        )) : (
          <p className="p-6 text-center text-[13px] text-[var(--hw-text-secondary)] sm:p-8">
            No {status} listings.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        busy={Boolean(dialog) && busyId === dialog.biz._id}
        tone={dialog?.approve ? "default" : "danger"}
        title={dialog?.approve ? "Approve this business?" : "Reject this listing?"}
        message={
          dialog?.approve
            ? "It goes live in the public directory immediately."
            : "It stays hidden. The owner can update details and submit again."
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
