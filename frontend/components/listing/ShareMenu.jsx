"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/Context/LanguageContext";
import { useToast } from "@/Context/ToastContext";

/**
 * ShareMenu — WhatsApp / Facebook / copy-link, always works.
 *
 * `navigator.share` and `navigator.clipboard` both require a secure context
 * (https), which this site doesn't have yet — silently trying them and
 * swallowing the failure is exactly what the old share button did, and it
 * just did nothing with no visible error. WhatsApp/Facebook share links are
 * plain URLs, no browser API involved, so they work today regardless of
 * HTTPS; copy-link falls back to the legacy `execCommand("copy")` path,
 * which has no secure-context requirement. `navigator.share` is offered as
 * an extra first option when available, so this upgrades for free once the
 * site has HTTPS — never a requirement to make sharing work at all.
 */
export default function ShareMenu({ title, className = "", buttonClassName, iconOnly, align = "end" }) {
  const { t } = useLanguage();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const url = typeof window !== "undefined" ? window.location.href : "";

  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      toast.success(t("listing.linkCopied"));
    } catch {
      toast.error(t("listing.copyFailed"));
    }
    document.body.removeChild(ta);
  }

  function copyLink() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => toast.success(t("listing.linkCopied")),
        () => legacyCopy(url)
      );
    } else {
      legacyCopy(url);
    }
    setOpen(false);
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Dismissed the native sheet — not an error worth surfacing.
    }
    setOpen(false);
  }

  const waText = encodeURIComponent(title ? `${title} — ${url}` : url);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("listing.share")}
        aria-haspopup="menu"
        aria-expanded={open}
        className={buttonClassName || "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] text-[var(--hw-text-primary)]"}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {iconOnly ? null : <span className="ms-1.5 text-[13px] font-bold">{t("listing.share")}</span>}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] shadow-2xl ${align === "start" ? "start-0" : "end-0"}`}
        >
          {canNativeShare ? (
            <button type="button" role="menuitem" onClick={nativeShare} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-[13px] font-bold text-[var(--hw-text-primary)] hover:bg-[var(--hw-soft-panel)]">
              <span aria-hidden>📤</span>{t("listing.shareMore")}
            </button>
          ) : null}
          <a
            role="menuitem"
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-[13px] font-bold text-[var(--hw-text-primary)] hover:bg-[var(--hw-soft-panel)]"
          >
            <span aria-hidden>🟢</span>{t("listing.shareWhatsapp")}
          </a>
          <a
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-[13px] font-bold text-[var(--hw-text-primary)] hover:bg-[var(--hw-soft-panel)]"
          >
            <span aria-hidden>🔵</span>{t("listing.shareFacebook")}
          </a>
          <button type="button" role="menuitem" onClick={copyLink} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-[13px] font-bold text-[var(--hw-text-primary)] hover:bg-[var(--hw-soft-panel)]">
            <span aria-hidden>🔗</span>{t("listing.copyLink")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
