"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { reportApi, vehicleApi, partApi, normalizeApiError } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
];

const REASON_LABELS = {
  spam: "Spam / fake",
  inappropriate: "Inappropriate",
  wrong_category: "Wrong category",
  scam: "Scam",
  sold_elsewhere: "Sold elsewhere",
  other: "Other",
};

/**
 * ReportsPanel — reports grouped by listing (one card per reported ad, not
 * one row per report) so "5 different people flagged this" is immediately
 * visible instead of buried in a flat queue. Deleting the ad reuses the
 * existing owner/admin delete endpoint — no separate moderation-delete
 * path needed since admins already bypass the ownership check there.
 */
export default function ReportsPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [groups, setGroups] = useState([]);
  const [counts, setCounts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [deleting, setDeleting] = useState(null);

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    const res = await reportApi.adminList(status).catch(() => null);
    setGroups(res?.data?.groups || []);
    setCounts(res?.data?.counts || {});
  }, [status]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  async function setGroupStatus(group, next) {
    const key = group.listingId + group.listingType;
    setBusyId(key);
    try {
      await reportApi.adminSetStatus(group.listingId, group.listingType, next);
      toast.success(next === "dismissed" ? "Reports dismissed" : "Marked reviewed");
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err));
    } finally {
      setBusyId("");
    }
  }

  async function confirmDelete() {
    const key = deleting.listingId + deleting.listingType;
    setBusyId(key);
    try {
      const api = deleting.listingType === "part" ? partApi : vehicleApi;
      await api.remove(deleting.listingId);
      await reportApi.adminSetStatus(deleting.listingId, deleting.listingType, "reviewed");
      toast.success("Listing deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err));
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <p className="text-[var(--hw-text-secondary)]">Loading…</p>;
  if (!isAdmin) return <p className="text-[var(--hw-text-secondary)]">Admins only.</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value || "all"}
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition sm:text-sm ${
              status === tab.value
                ? "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                : "border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-secondary)]"
            }`}
          >
            {tab.label}{tab.value ? ` (${counts[tab.value] || 0})` : ""}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {groups.length ? groups.map((group) => {
          const key = group.listingId + group.listingType;
          const busy = busyId === key;
          const href = group.listing ? `/${group.listingType === "part" ? "parts" : "vehicles"}/${group.listingId}` : null;

          return (
            <div key={key} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-4">
              <div className="flex flex-wrap items-start gap-3">
                {group.listing?.image ? (
                  <img src={group.listing.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-[var(--hw-border-default)] text-[10px] text-[var(--hw-text-muted)]">
                    {group.listing ? "no photo" : "deleted"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {href ? (
                      <Link href={href} target="_blank" className="truncate font-black text-[var(--hw-text-primary)] hover:text-[var(--hw-orange)]">
                        {group.listing.title}
                      </Link>
                    ) : (
                      <span className="truncate font-black text-[var(--hw-text-muted)] line-through">Listing already deleted</span>
                    )}
                    <span className="shrink-0 rounded-full bg-[var(--hw-red)] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                      {group.count} report{group.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                    {[...new Set(group.reasonCodes)].map((r) => REASON_LABELS[r] || r).join(", ")}
                  </p>
                  {group.note ? <p className="mt-1 line-clamp-2 text-[12px] text-[var(--hw-text-secondary)]">&ldquo;{group.note}&rdquo;</p> : null}
                  <p className="mt-1 text-[10px] text-[var(--hw-text-muted)]">Last reported {new Date(group.lastReportedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {group.listing ? (
                  <button
                    disabled={busy}
                    onClick={() => setDeleting(group)}
                    className="rounded-lg border border-[var(--hw-red)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-red)] transition hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60"
                  >
                    Delete listing
                  </button>
                ) : null}
                <button
                  disabled={busy}
                  onClick={() => setGroupStatus(group, "dismissed")}
                  className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60"
                >
                  Dismiss (not an issue)
                </button>
              </div>
            </div>
          );
        }) : (
          <p className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center text-[13px] text-[var(--hw-text-secondary)]">
            No reports here.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={Boolean(deleting) && busyId === deleting.listingId + deleting.listingType}
        tone="danger"
        title="Delete this listing?"
        message="This removes the ad permanently and resolves all its reports. The seller isn't notified automatically."
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
