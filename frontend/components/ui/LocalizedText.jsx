"use client";

/**
 * LocalizedText — inline span that shows the active-language version of a
 * bilingual string (e.g. a card title). No toggle; for that use TranslatedText.
 * Falls back to whichever version exists and sets dir for Urdu.
 */

import { useLanguage } from "@/Context/LanguageContext";

const URDU_RE = /[؀-ۿݐ-ݿ]/;

export default function LocalizedText({ en, ur, className = "" }) {
  const { lang } = useLanguage();
  const text = (lang === "ur" ? (ur || en) : (en || ur)) || "";
  const dir = URDU_RE.test(text) ? "rtl" : "ltr";
  return (
    <span dir={dir} className={className}>
      {text}
    </span>
  );
}
