"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { translate, LANGUAGES } from "@/lib/i18n";

const LanguageContext = createContext(null);

const STORAGE_KEY = "hw_lang";

export function LanguageProvider({ children }) {
  const router = useRouter();
  // Always start at "en" so the server-rendered HTML and the client's first
  // render match (avoids hydration mismatches). The stored preference is
  // applied right after mount in the effect below.
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "ur") setLangState(stored);
  }, []);

  // Keep <html lang>, text direction, and a cookie in sync with the language.
  // The cookie lets server components read the choice and translate too.
  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
    document.cookie = `hw_lang=${lang};path=/;max-age=31536000;samesite=lax`;
  }, [lang]);

  const setLang = useCallback((next) => {
    if (next !== "en" && next !== "ur") return;
    window.localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `hw_lang=${next};path=/;max-age=31536000;samesite=lax`;
    setLangState(next);
    // Re-render server components so they pick up the new language cookie.
    router.refresh();
  }, [router]);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "ur" : "en");
  }, [lang, setLang]);

  const t = useCallback((key) => translate(lang, key), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, isRtl: lang === "ur" }),
    [lang, setLang, toggleLang, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
