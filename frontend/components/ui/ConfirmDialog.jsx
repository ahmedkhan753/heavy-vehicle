"use client";

import { useEffect, useRef } from "react";

/**
 * ConfirmDialog — in-app confirmation modal.
 *
 * Replaces window.confirm/window.prompt for destructive or irreversible
 * actions. Native dialogs are unstyled, can't be translated, and several
 * mobile browsers suppress them entirely after the first one — which meant a
 * "delete" that silently did nothing.
 *
 * `tone="danger"` colours the confirm button red for destructive actions.
 * `children` can hold extra inputs (e.g. the sale price field).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
  children,
}) {
  const panelRef = useRef(null);

  // Escape closes; lock background scroll while open.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={() => (busy ? null : onCancel())}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 shadow-2xl sm:rounded-2xl sm:p-5"
      >
        <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-lg">{title}</h2>
        {message ? (
          <p className="mt-1.5 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-sm">{message}</p>
        ) : null}

        {children ? <div className="mt-3.5">{children}</div> : null}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-11 rounded-lg border border-[var(--hw-border-strong)] text-[13px] font-bold text-[var(--hw-text-primary)] transition hover:border-[var(--hw-orange)] disabled:opacity-60 sm:text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-11 rounded-lg text-[13px] font-black text-white transition disabled:opacity-60 sm:text-sm ${
              tone === "danger"
                ? "bg-[var(--hw-red)] hover:opacity-90"
                : "bg-[var(--hw-orange)] text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
