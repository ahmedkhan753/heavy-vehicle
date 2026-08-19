"use client";

import { useLanguage } from "@/Context/LanguageContext";

export default function LanguageToggle({ className = "" }) {
  const { lang, toggleLang } = useLanguage();
  const isUrdu = lang === "ur";

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-soft-panel)] px-2 text-xs font-black text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)] hover:text-[var(--hw-text-primary)] sm:px-3 ${className}`}
      aria-label="Switch language"
      title={isUrdu ? "Switch to English" : "اردو میں دیکھیں"}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--hw-bg-elevated)] text-[var(--hw-orange)]">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
        </svg>
      </span>
      <span className="hidden sm:inline">{isUrdu ? "English" : "اردو"}</span>
    </button>
  );
}
