"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { adApi, uploadApi, normalizeApiError } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "rejected", label: "Rejected" },
];

const PLACEMENTS = [
  { value: "header", label: "Top banner (every page)" },
  { value: "home-mid", label: "Homepage banner row" },
  { value: "listing", label: "Listing pages" },
];

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-[13px] text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]";
const labelClass = "text-[11px] font-bold uppercase tracking-wide text-[var(--hw-text-muted)]";

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

/**
 * AdsPanel — create, price and run banner campaigns.
 *
 * An advertiser's enquiry arrives as a `pending` campaign with no creative.
 * The admin uploads the banner, sets the placement/dates, and flips it to
 * `active`, at which point AdBanner starts serving it.
 */
export default function AdsPanel() {
  const { user, loading } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [ads, setAds] = useState([]);
  const [counts, setCounts] = useState({});
  const [busyId, setBusyId] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState("");
  const fileRef = useRef(null);

  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    const res = await adApi.adminList(status).catch(() => null);
    setAds(res?.data?.ads || []);
    setCounts(res?.data?.counts || {});
  }, [status]);

  useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  function startNew() {
    setEditing({ advertiserName: "", placement: "home-mid", status: "pending", priority: 0, image: null });
  }

  async function pickImage(file) {
    if (!file || !editing) return;
    setUploading("img");
    try {
      const res = await uploadApi.image(file);
      setEditing((e) => ({ ...e, image: { url: res.data.url, publicId: res.data.publicId } }));
      toast.success("Banner uploaded — remember to save");
    } catch (err) {
      toast.error(normalizeApiError(err.payload || err));
    } finally {
      setUploading("");
    }
  }

  async function save() {
    const body = {
      advertiserName: editing.advertiserName,
      title: editing.title || "",
      targetUrl: editing.targetUrl || "",
      placement: editing.placement,
      status: editing.status,
      priority: Number(editing.priority) || 0,
      amountPaid: Number(editing.amountPaid) || 0,
      notes: editing.notes || "",
      contactEmail: editing.contactEmail || "",
      contactPhone: editing.contactPhone || "",
      startDate: editing.startDate || null,
      endDate: editing.endDate || null,
    };
    if (editing.image?.url) body.image = editing.image;

    setBusyId(editing._id || "new");
    try {
      if (editing._id) await adApi.adminUpdate(editing._id, body);
      else await adApi.adminCreate(body);
      toast.success("Campaign saved");
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err.payload || err));
    } finally {
      setBusyId("");
    }
  }

  async function quickStatus(ad, next) {
    setBusyId(ad._id);
    try {
      await adApi.adminUpdate(ad._id, { status: next });
      toast.success(`Campaign ${next}`);
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err.payload || err));
    } finally {
      setBusyId("");
    }
  }

  async function confirmDelete() {
    setBusyId(deleting._id);
    try {
      await adApi.adminRemove(deleting._id);
      toast.success("Campaign deleted");
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err.payload || err));
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
        <button onClick={startNew} className="ms-auto rounded-lg bg-[var(--hw-green)] px-3 py-1.5 text-[12px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
          + New campaign
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        {ads.length ? ads.map((ad) => {
          const ctr = ad.impressions ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : "0.0";
          return (
            <div key={ad._id} className="border-b border-[var(--hw-border-subtle)] p-3 last:border-b-0 sm:p-4">
              <div className="flex flex-wrap items-start gap-3">
                {ad.image?.url ? (
                  <img src={ad.image.url} alt="" className="h-12 w-28 shrink-0 rounded border border-[var(--hw-border-subtle)] object-cover" />
                ) : (
                  <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded border border-dashed border-[var(--hw-border-default)] text-[10px] text-[var(--hw-text-muted)]">
                    no creative
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-black text-[var(--hw-text-primary)] sm:text-base">{ad.advertiserName}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                    {PLACEMENTS.find((p) => p.value === ad.placement)?.label || ad.placement}
                    {ad.startDate || ad.endDate ? ` · ${toDateInput(ad.startDate) || "—"} → ${toDateInput(ad.endDate) || "—"}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
                    {ad.impressions || 0} views · {ad.clicks || 0} clicks · {ctr}% CTR
                    {ad.contactPhone ? ` · ${ad.contactPhone}` : ""}
                  </p>
                  {ad.notes ? <p className="mt-1 line-clamp-2 text-[12px] text-[var(--hw-text-secondary)]">{ad.notes}</p> : null}
                </div>

                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                  ad.status === "active" ? "bg-[var(--hw-green)] text-[var(--hw-text-inverse)]"
                  : ad.status === "rejected" ? "bg-[var(--hw-red)] text-white"
                  : "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)]"
                }`}>
                  {ad.status}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button onClick={() => setEditing({ ...ad, startDate: toDateInput(ad.startDate), endDate: toDateInput(ad.endDate) })}
                  className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)]">
                  Edit
                </button>
                {ad.status !== "active" ? (
                  <button disabled={busyId === ad._id || !ad.image?.url} title={!ad.image?.url ? "Upload a banner first" : ""}
                    onClick={() => quickStatus(ad, "active")}
                    className="rounded-lg bg-[var(--hw-green)] px-3 py-1.5 text-[12px] font-black text-[var(--hw-text-inverse)] disabled:opacity-50">
                    Activate
                  </button>
                ) : (
                  <button disabled={busyId === ad._id} onClick={() => quickStatus(ad, "paused")}
                    className="rounded-lg border border-[var(--hw-border-strong)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60">
                    Pause
                  </button>
                )}
                <button disabled={busyId === ad._id} onClick={() => setDeleting(ad)}
                  className="rounded-lg border border-[var(--hw-red)] px-3 py-1.5 text-[12px] font-bold text-[var(--hw-red)] transition hover:bg-[var(--hw-red)] hover:text-white disabled:opacity-60">
                  Delete
                </button>
              </div>
            </div>
          );
        }) : (
          <p className="p-6 text-center text-[13px] text-[var(--hw-text-secondary)] sm:p-8">No campaigns.</p>
        )}
      </div>

      {/* Editor */}
      {editing ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/70 p-0 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 sm:rounded-2xl sm:p-5">
            <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-lg">
              {editing._id ? "Edit campaign" : "New campaign"}
            </h2>

            <div className="mt-3 grid gap-3">
              <div>
                <p className={labelClass}>Banner creative</p>
                <div className="mt-1.5 flex items-center gap-3">
                  {editing.image?.url ? (
                    <img src={editing.image.url} alt="" className="h-12 w-28 rounded border border-[var(--hw-border-subtle)] object-cover" />
                  ) : (
                    <div className="flex h-12 w-28 items-center justify-center rounded border border-dashed border-[var(--hw-border-default)] text-[10px] text-[var(--hw-text-muted)]">none</div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading === "img"}
                    className="h-10 rounded-lg border border-[var(--hw-border-strong)] px-3 text-[12px] font-bold text-[var(--hw-text-primary)] disabled:opacity-60">
                    {uploading === "img" ? "…" : "Upload"}
                  </button>
                </div>
              </div>

              <label className={labelClass}>Advertiser name
                <input value={editing.advertiserName || ""} onChange={(e) => setEditing({ ...editing, advertiserName: e.target.value })} className={inputClass} />
              </label>

              <label className={labelClass}>Target URL
                <input value={editing.targetUrl || ""} onChange={(e) => setEditing({ ...editing, targetUrl: e.target.value })} placeholder="https://…" className={inputClass} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>Placement
                  <select value={editing.placement} onChange={(e) => setEditing({ ...editing, placement: e.target.value })} className={inputClass}>
                    {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </label>
                <label className={labelClass}>Status
                  <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className={inputClass}>
                    {["pending", "active", "paused", "rejected", "expired"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>Start date
                  <input type="date" value={editing.startDate || ""} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} className={inputClass} />
                </label>
                <label className={labelClass}>End date
                  <input type="date" value={editing.endDate || ""} onChange={(e) => setEditing({ ...editing, endDate: e.target.value })} className={inputClass} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className={labelClass}>Priority
                  <input type="number" value={editing.priority ?? 0} onChange={(e) => setEditing({ ...editing, priority: e.target.value })} className={inputClass} />
                </label>
                <label className={labelClass}>Amount paid (PKR)
                  <input type="number" value={editing.amountPaid ?? 0} onChange={(e) => setEditing({ ...editing, amountPaid: e.target.value })} className={inputClass} />
                </label>
              </div>

              <label className={labelClass}>Notes
                <textarea value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={3}
                  className="mt-1 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3 text-[13px] text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]" />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setEditing(null)} className="h-11 rounded-lg border border-[var(--hw-border-strong)] text-[13px] font-bold text-[var(--hw-text-primary)]">
                Cancel
              </button>
              <button onClick={save} disabled={busyId !== "" || !editing.advertiserName}
                className="h-11 rounded-lg bg-[var(--hw-orange)] text-[13px] font-black text-[var(--hw-text-inverse)] disabled:opacity-60">
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={Boolean(deleting) && busyId === deleting._id}
        tone="danger"
        title="Delete this campaign?"
        message="Its impression and click history is removed too. This cannot be undone."
        confirmLabel="Yes, delete"
        cancelLabel="Cancel"
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
