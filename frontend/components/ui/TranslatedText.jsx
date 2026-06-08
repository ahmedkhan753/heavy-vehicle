"use client";

/**
 * TranslatedText — shows the language-appropriate version of bilingual user
 * content (listing description) with a "show original / other language" toggle.
 *
 * The parent (a server component) picks `primary` for the current cookie
 * language and passes the other version as `secondary`, so the initial client
 * render matches the server HTML (no hydration flash). `dir` is derived per
 * shown string so a toggled-in Urdu block renders right-to-left.
 */

import { useState } from "react";

const URDU_RE = /[؀-ۿݐ-ݿ]/;

export default function TranslatedText({ primary, secondary, showLabel, hideLabel, className = "" }) {
  const [showOther, setShowOther] = useState(false);
  const hasOther = secondary && secondary.trim() && secondary !== primary;
  const shown = showOther ? secondary : primary;
  const dir = URDU_RE.test(shown) ? "rtl" : "ltr";

  return (
    <div>
      <p dir={dir} className={`whitespace-pre-line ${dir === "rtl" ? "text-right" : ""} ${className}`}>
        {shown}
      </p>
      {hasOther ? (
        <button
          type="button"
          onClick={() => setShowOther((v) => !v)}
          className="mt-2 text-xs font-black text-[var(--hw-orange)] hover:underline"
        >
          {showOther ? hideLabel : showLabel}
        </button>
      ) : null}
    </div>
  );
}
