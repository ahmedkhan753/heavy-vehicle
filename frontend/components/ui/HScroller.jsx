"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * HScroller — a horizontal, snap-scrolling row with side arrow buttons.
 *
 * Used by the homepage "Browse by category / brand" sections so the full
 * list stays off-screen (PakWheels-style) and buyers page through it with
 * the arrows instead of every tile being dumped on the homepage.
 *
 * The track is forced to LTR so the scroll math stays consistent in Urdu
 * (RTL) mode; the tiles inside still render their own Urdu text correctly.
 * Arrows hide automatically at each end and when everything already fits.
 */
export default function HScroller({ children, ariaLabel }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const page = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <Arrow side="left" onClick={() => page(-1)} hidden={atStart} label="Scroll left" />

      {/* One row at every width. The two-row mobile grid this replaced ate
          twice the vertical space for the same tiles, and since the row
          scrolls anyway the second row bought nothing — about four tiles
          are visible at a phone width either way. */}
      <div
        ref={trackRef}
        dir="ltr"
        aria-label={ariaLabel}
        className="hw-no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 sm:gap-4"
      >
        {children}
      </div>

      <Arrow side="right" onClick={() => page(1)} hidden={atEnd} label="Scroll right" />
    </div>
  );
}

function Arrow({ side, onClick, hidden, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      tabIndex={hidden ? -1 : 0}
      className={`absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--hw-border-strong)] bg-[var(--hw-bg-elevated)] text-[var(--hw-text-primary)] shadow-lg transition hover:border-[var(--hw-orange)] hover:text-[var(--hw-orange)] sm:flex ${
        side === "left" ? "-left-3" : "-right-3"
      } ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {side === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}
