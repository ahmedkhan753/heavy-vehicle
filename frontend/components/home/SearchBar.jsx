"use client";

import { useRef } from "react";
import { useLanguage } from "@/Context/LanguageContext";
import MicButton from "@/components/ui/MicButton";

// Plain GET form (works with JS disabled) — used to refine a search from
// the /search results page itself. The homepage hero has its own version
// with a filters disclosure and dual-destination routing; this one is
// deliberately simpler since /search only ever needs the keyword.
export default function SearchBar({ defaultValue = "" }) {
  const { t } = useLanguage();
  const inputRef = useRef(null);

  return (
    <form action="/search" className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          name="q"
          defaultValue={defaultValue}
          placeholder={t("home.searchPlaceholder")}
          className="h-11 w-full rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3.5 pe-10 text-sm text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)] sm:h-12"
        />
        <MicButton
          className="absolute inset-y-0 end-2 my-auto"
          onResult={(text) => { if (inputRef.current) inputRef.current.value = text; }}
          onFinal={() => setTimeout(() => inputRef.current?.form?.requestSubmit(), 350)}
        />
      </div>
      <button className="h-11 shrink-0 rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] sm:h-12 sm:text-sm">
        {t("common.search")}
      </button>
    </form>
  );
}
