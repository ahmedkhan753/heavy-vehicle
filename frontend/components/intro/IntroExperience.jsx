"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/Context/LanguageContext";

const STORAGE_KEY = "heavywheels_intro_seen";

/**
 * IntroExperience — a full-screen, single-viewport first-visit poster,
 * shown once per browser (localStorage-gated) on the homepage only.
 *
 * The reference design is used as-is (public/intro-hero.jpg) rather than
 * rebuilt section-by-section in HTML — this is a one-time branded moment,
 * not part of the crawlable marketplace, so pixel-fidelity to the poster
 * matters more than componentizing its text. Only two things are real,
 * interactive layers on top of the image: the rotating gear and the two
 * buttons (Skip, Explore HeavyWheels).
 *
 * Still renders as a client-only overlay ON TOP of the already
 * server-rendered homepage (never a route swap), so /, /vehicles, /parts
 * etc. stay fully crawlable exactly as before.
 */
export default function IntroExperience() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    // ?intro=1 forces a replay — see the footer's "Watch Intro" link.
    const forced = new URLSearchParams(window.location.search).get("intro") === "1";
    let seen;
    try {
      seen = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      seen = "1"; // localStorage unavailable (privacy mode etc.) — don't block the page
    }
    if (forced || !seen) setVisible(true);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return undefined;
    // Locking only <body> is unreliable on iOS Safari, which can still
    // rubber-band/scroll the page via <html> — lock both.
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.cancelAnimationFrame(id);
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Nothing to persist — worst case it shows again next visit.
    }
    setVisible(false);
  }, []);

  if (pathname !== "/" || !visible) return null;

  return (
    <div
      className="hw-intro-scope fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[var(--hw-bg-base)]"
      role="dialog"
      aria-modal="true"
      aria-label={t("intro.ariaLabel")}
    >
      {/* The poster panel — full-bleed on phones (its portrait aspect is
          close enough to a phone screen's that cropping is minor), locked
          to its native 853x1280 aspect ratio and letterboxed on wide
          screens so desktop never sees it stretched or brutally cropped
          top/bottom. Class name must be a literal string, not built from a
          variable — Tailwind scans source files statically and won't
          generate a class assembled at runtime via template interpolation. */}
      <div className="relative h-full w-full sm:h-full sm:w-auto sm:aspect-[853/1280]">
        <Image
          src="/intro-hero.jpg"
          alt="HeavyWheels PK — built for power, driven by trust"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 60vh"
          className="object-cover"
        />

        {/* Slowly rotating gear, layered over the poster's own (static)
            gear artwork — large, faint, mechanical rather than a spinning
            cartoon wheel. Positioned as a percentage of the poster so it
            tracks the logo at any screen size. */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="hw-intro-gear pointer-events-none absolute left-1/2 top-[13%] h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 text-white/25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="50" cy="50" r="34" />
          {Array.from({ length: 14 }).map((_, i) => (
            <rect key={i} x="47.5" y="2" width="5" height="11" transform={`rotate(${i * (360 / 14)} 50 50)`} />
          ))}
        </svg>

        <button
          type="button"
          onClick={dismiss}
          className="absolute end-3 top-3 z-10 rounded-lg border border-white/20 bg-black/35 px-3 py-1.5 text-[11px] font-bold text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white sm:end-5 sm:top-5"
        >
          {t("intro.skip")}
        </button>

        {/* Overlays the poster's own printed button with a real one in the
            same spot, sized/positioned as a percentage of the poster so it
            lines up at any screen size. */}
        <button
          type="button"
          onClick={dismiss}
          className={`hw-cta-glow absolute left-1/2 top-[95%] w-[78%] max-w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-[var(--hw-orange)] bg-black/20 py-2.5 text-center text-[12px] font-black uppercase tracking-wide text-[var(--hw-orange)] backdrop-blur-sm transition hover:bg-[var(--hw-orange)] hover:text-[var(--hw-text-inverse)] sm:py-3 sm:text-sm ${ready ? "hw-rise-in" : "opacity-0"}`}
          style={{ animationDelay: "0.3s" }}
        >
          {t("intro.cta")} →
        </button>
      </div>
    </div>
  );
}
