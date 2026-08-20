"use client";

import { useLanguage } from "@/Context/LanguageContext";
import { useToast } from "@/Context/ToastContext";
import useSpeechToText from "@/lib/useSpeechToText";

/**
 * Drop-in voice-search trigger for a search input. Renders nothing when the
 * browser has no SpeechRecognition support, so there's never a dead mic
 * icon sitting on Firefox/older Safari.
 *
 * `onResult` fires on every partial transcript (for live feedback in the
 * input), `onFinal` fires once recognition settles on a final phrase.
 *
 * `variant="sphere"` renders a solid orange circular button instead of the
 * subtle icon-only style used inside search boxes — used everywhere now for
 * a consistent, recognizable mic affordance (originally chat-only, but a
 * plain icon inside a search field was too easy to miss).
 *
 * `size="sm"` (h-8) fits inside a compact h-11 search field without
 * crowding the typed text; the default (h-9) suits roomier placements like
 * the chat composer. This is a literal class switch, not a template string
 * with an interpolated size — Tailwind can't see classes assembled that
 * way at build time and would silently drop them.
 */
export default function MicButton({ onResult, onFinal, className = "", variant = "icon", size = "md" }) {
  const { t, lang } = useLanguage();
  const toast = useToast();

  const { supported, listening, start } = useSpeechToText({
    lang,
    onResult: (transcript, isFinal) => {
      if (!transcript) return;
      onResult?.(transcript);
      if (isFinal) onFinal?.(transcript);
    },
    onError: (kind) => toast.error(kind === "denied" ? t("mic.denied") : t("mic.error")),
  });

  if (!supported) return null;

  const isSphere = variant === "sphere";
  const sphereDims = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const baseClass = isSphere
    ? `inline-flex ${sphereDims} shrink-0 items-center justify-center rounded-full bg-[var(--hw-orange)] text-white shadow-md transition hover:bg-[var(--hw-amber)] disabled:cursor-default ${listening ? "bg-[var(--hw-amber)]" : ""}`
    : `inline-flex items-center justify-center text-[var(--hw-text-muted)] transition hover:text-[var(--hw-orange)] disabled:cursor-default ${listening ? "text-[var(--hw-orange)]" : ""}`;
  const iconSize = isSphere ? (size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4") : "h-4 w-4 sm:h-[18px] sm:w-[18px]";
  const pingColor = isSphere ? "bg-white" : "bg-[var(--hw-orange)]";

  return (
    <button
      type="button"
      onClick={start}
      disabled={listening}
      aria-label={t("mic.search")}
      title={listening ? t("mic.listening") : t("mic.search")}
      className={`${baseClass} ${className}`}
    >
      <span className={`relative flex items-center justify-center ${iconSize}`}>
        {listening ? (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-50 ${pingColor}`} />
        ) : null}
        <svg className={`relative ${iconSize}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
          <path d="M19 11a7 7 0 0 1-14 0M12 19v3" />
        </svg>
      </span>
    </button>
  );
}
