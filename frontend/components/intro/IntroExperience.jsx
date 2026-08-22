"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/Context/LanguageContext";
import BrandLogo from "@/components/layout/BrandLogo";
import { getVehicleTypeIcon, getPartCategoryIcon } from "@/lib/iconAssets";

const STORAGE_KEY = "heavywheels_intro_seen";

// Seven destinations, not a decorative list — every tile is a real link into
// the marketplace taxonomy that already exists.
const CATEGORIES = [
  { key: "intro.cat.excavators", href: "/vehicles?type=excavator", icon: getVehicleTypeIcon("excavator") },
  { key: "intro.cat.dumpers", href: "/vehicles?type=dumper", icon: getVehicleTypeIcon("dumper") },
  { key: "intro.cat.tankers", href: "/vehicles?type=oil-tanker", icon: getVehicleTypeIcon("oil-tanker") },
  { key: "intro.cat.mixers", href: "/vehicles?type=mixer", icon: getVehicleTypeIcon("mixer") },
  { key: "intro.cat.cranes", href: "/vehicles?type=crane", icon: getVehicleTypeIcon("crane") },
  { key: "intro.cat.buses", href: "/vehicles?type=bus", icon: getVehicleTypeIcon("bus") },
  { key: "intro.cat.parts", href: "/parts", icon: getPartCategoryIcon("engine") },
];

const TRUST_POINTS = [
  { key: "intro.trust.dealers", icon: <path d="m5 12 5 5L20 7" /> },
  { key: "intro.trust.deals", icon: <><path d="M7 11V7a5 5 0 0 1 10 0v4" /><rect x="4" y="11" width="16" height="10" rx="2" /></> },
  { key: "intro.trust.quality", icon: <><path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></> },
  { key: "intro.trust.reach", icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 4 6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-6-4-9s1.5-6.4 4-9z" /></> },
  { key: "intro.trust.support", icon: <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3z" /><path d="M3 19a2 2 0 0 0 2 2h1v-6H3z" /></> },
];

/**
 * IntroExperience — a full-screen cinematic first-visit overlay, shown once
 * per browser (localStorage-gated) on the homepage only.
 *
 * This renders ON TOP of the real, already-server-rendered homepage rather
 * than replacing it or living on a separate route: the homepage's actual
 * markup is always present in the DOM, just visually covered while this is
 * open. That's what keeps /,  /vehicles, /parts etc. fully crawlable —
 * nothing here blocks or delays the real content, it's a client-only layer
 * that adds itself after mount and removes itself on dismiss.
 *
 * Fixed positioning + a solid background is also what makes the navbar,
 * footer and mobile nav disappear visually without unmounting or
 * restructuring any of them — they're simply behind an opaque full-screen
 * layer for as long as this is open.
 */
export default function IntroExperience() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    // ?intro=1 forces a replay (linked from the footer's "Watch Intro") —
    // read directly off window.location rather than next/navigation's
    // useSearchParams, which would force every route in the app out of
    // static rendering since this component is mounted app-wide in the
    // root layout, not scoped to a single page.
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // One frame so the entrance animations run instead of snapping straight
    // to their end state.
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => {
      document.body.style.overflow = previousOverflow;
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
      className="hw-intro-scope fixed inset-0 z-[999] overflow-y-auto bg-[var(--hw-bg-base)]"
      role="dialog"
      aria-modal="true"
      aria-label={t("intro.ariaLabel")}
    >
      <button
        type="button"
        onClick={dismiss}
        className="fixed end-3 top-3 z-10 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-[11px] font-bold text-white/70 backdrop-blur transition hover:border-white/30 hover:text-white sm:end-6 sm:top-6"
      >
        {t("intro.skip")}
      </button>

      {/* Hero */}
      <div className="hw-subtle-grid relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-16 text-center sm:px-8">
        {/* Ambient orange glow behind the logo/gear. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--hw-orange) 30%, transparent), transparent 70%)" }}
        />

        {/* Slowly rotating industrial gear behind the logo — a mechanical
            backdrop, not a spinning cartoon wheel: large, faint, and slow. */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="hw-intro-gear pointer-events-none absolute left-1/2 top-[20%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 text-white/[0.06] sm:h-[380px] sm:w-[380px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="12" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect
              key={i}
              x="47"
              y="4"
              width="6"
              height="14"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </svg>

        <div className={ready ? "hw-logo-in" : "opacity-0"}>
          <BrandLogo className="h-16 w-auto drop-shadow-[0_0_30px_rgba(249,115,22,0.35)] sm:h-24" />
        </div>

        <p className={`mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/80 sm:mt-6 sm:text-sm ${ready ? "hw-rise-in" : "opacity-0"}`} style={{ animationDelay: "0.15s" }}>
          {t("intro.tagline")}
        </p>

        <div className={`mt-10 sm:mt-14 ${ready ? "hw-rise-in" : "opacity-0"}`} style={{ animationDelay: "0.3s" }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--hw-orange)]">{t("intro.welcomeTo")}</p>
          <h1 className="mt-2 text-[28px] font-black leading-tight text-white sm:text-5xl">
            HEAVY<span className="text-[var(--hw-orange)]">WHEELS</span> PK
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-white/70 sm:max-w-xl sm:text-lg sm:leading-8">
            {t("intro.subtitle")}
          </p>
        </div>
      </div>

      {/* Category showcase */}
      <div className={`mx-auto max-w-5xl px-5 pb-12 sm:px-8 ${ready ? "hw-rise-in" : "opacity-0"}`} style={{ animationDelay: "0.45s" }}>
        <div className="hw-no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible lg:grid-cols-7">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={cat.href}
              onClick={dismiss}
              className="group flex w-24 shrink-0 snap-start flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center transition hover:border-[var(--hw-orange)] hover:bg-white/[0.06] sm:w-auto"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 sm:h-12 sm:w-12">
                <Image src={cat.icon} alt="" width={40} height={40} className="h-6 w-6 object-contain opacity-80 sm:h-7 sm:w-7" />
              </span>
              <span className="text-[10px] font-bold uppercase leading-tight tracking-wide text-white/75 group-hover:text-white sm:text-[11px]">
                {t(cat.key)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Motive */}
      <div className={`mx-auto max-w-2xl px-5 pb-12 text-center sm:px-8 ${ready ? "hw-rise-in" : "opacity-0"}`} style={{ animationDelay: "0.6s" }}>
        <p className="text-[11px] font-black uppercase tracking-widest text-[var(--hw-orange)]">{t("intro.motiveEyebrow")}</p>
        <p className="mt-3 text-[13px] leading-6 text-white/70 sm:text-base sm:leading-7">{t("intro.motiveBody")}</p>
      </div>

      {/* Trust points */}
      <div className={`mx-auto max-w-4xl px-5 pb-14 sm:px-8 ${ready ? "hw-rise-in" : "opacity-0"}`} style={{ animationDelay: "0.75s" }}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
          {TRUST_POINTS.map((point) => (
            <div key={point.key} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                  {point.icon}
                </svg>
              </span>
              <span className="text-[10px] font-bold uppercase leading-tight tracking-wide text-white/65 sm:text-[11px]">
                {t(point.key)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={`flex justify-center px-5 pb-16 sm:pb-20 ${ready ? "hw-rise-in" : "opacity-0"}`} style={{ animationDelay: "0.9s" }}>
        <button
          type="button"
          onClick={dismiss}
          className="hw-cta-glow inline-flex h-12 items-center gap-2 rounded-lg border-2 border-[var(--hw-orange)] px-7 text-[13px] font-black uppercase tracking-wide text-[var(--hw-orange)] transition hover:bg-[var(--hw-orange)] hover:text-[var(--hw-text-inverse)] sm:h-14 sm:px-9 sm:text-sm"
        >
          {t("intro.cta")}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
