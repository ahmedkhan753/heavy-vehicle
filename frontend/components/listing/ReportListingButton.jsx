"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/Context/AuthContext";
import { useToast } from "@/Context/ToastContext";
import { useLanguage } from "@/Context/LanguageContext";
import { reportApi, normalizeApiError } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const REASONS = ["spam", "inappropriate", "wrong_category", "scam", "sold_elsewhere", "other"];

/**
 * Small, unobtrusive "Report" link for a listing — hidden entirely for the
 * listing's own seller (matches the backend, which also rejects it) rather
 * than showing a control that would just error out.
 */
export default function ReportListingButton({ listingId, listingType, sellerId }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const isOwner = isAuthenticated && sellerId && String(user?._id) === String(sellerId);
  if (isOwner) return null;

  function openModal() {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setReason("");
    setNote("");
    setSent(false);
    setOpen(true);
  }

  async function submit() {
    if (!reason) {
      toast.error(t("report.selectReason"));
      return;
    }
    setBusy(true);
    try {
      await reportApi.create({ listingId, listingType, reasonCode: reason, note: note.trim() });
      setSent(true);
      toast.success(t("report.success"));
      setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      const message = err?.statusCode === 409 ? t("report.alreadyReported") : normalizeApiError(err);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--hw-text-muted)] hover:text-[var(--hw-red)] sm:text-xs"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <path d="M4 22V4" />
        </svg>
        {t("report.button")}
      </button>

      <ConfirmDialog
        open={open}
        busy={busy}
        title={t("report.title")}
        confirmLabel={sent ? t("report.success") : busy ? t("report.submitting") : t("report.submit")}
        cancelLabel={t("report.cancel")}
        onCancel={() => setOpen(false)}
        onConfirm={sent ? () => setOpen(false) : submit}
      >
        <div className="grid gap-3">
          <label className="text-[12px] font-bold text-[var(--hw-text-secondary)]">
            {t("report.reasonLabel")}
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={sent}
              className="mt-1.5 h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] disabled:opacity-60"
            >
              <option value="" disabled>—</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>{t(`report.reason.${r}`)}</option>
              ))}
            </select>
          </label>

          <label className="text-[12px] font-bold text-[var(--hw-text-secondary)]">
            {t("report.noteLabel")}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={sent}
              maxLength={500}
              rows={3}
              placeholder={t("report.notePlaceholder")}
              className="mt-1.5 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] p-3 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] disabled:opacity-60"
            />
          </label>
        </div>
      </ConfirmDialog>
    </>
  );
}
