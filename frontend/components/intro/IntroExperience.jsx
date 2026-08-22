"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/Context/LanguageContext";
import {
  BadgeCheckIcon,
  BusIcon,
  CraneIcon,
  DumperIcon,
  ExcavatorIcon,
  GlobeIcon,
  HandshakeIcon,
  HeadsetIcon,
  MixerIcon,
  PartsIcon,
  ShieldIcon,
  TankerIcon,
} from "./CategoryIcons";

const STORAGE_KEY = "heavywheels_intro_seen";

// The intro greets a first-time visitor wherever they land — a shared link
// to one listing is how most people meet the site, and gating it to "/"
// meant those visitors never saw it at all.
//
// Excluded: flows where an overlay would actively get in the way rather
// than introduce anything. Someone mid-checkout, signing in, or posting an
// ad is already past the point of needing a brand introduction.
const EXCLUDED_PREFIXES = ["/dashboard", "/admin", "/auth", "/payment", "/post-ad", "/post-part"];

const isIntroAllowed = (pathname) =>
  typeof pathname === "string" && !EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

// Every tile is a real destination in the existing marketplace taxonomy —
// nothing here is decorative.
const CATEGORIES = [
  { key: "intro.cat.excavators", href: "/vehicles?type=excavator", Icon: ExcavatorIcon },
  { key: "intro.cat.dumpers", href: "/vehicles?type=dumper", Icon: DumperIcon },
  { key: "intro.cat.tankers", href: "/vehicles?type=oil-tanker", Icon: TankerIcon },
  { key: "intro.cat.mixers", href: "/vehicles?type=mixer", Icon: MixerIcon },
  { key: "intro.cat.cranes", href: "/vehicles?type=crane", Icon: CraneIcon },
  { key: "intro.cat.buses", href: "/vehicles?type=bus", Icon: BusIcon },
  { key: "intro.cat.parts", href: "/parts", Icon: PartsIcon },
];

const VALUES = [
  { key: "intro.trust.dealers", Icon: ShieldIcon },
  { key: "intro.trust.deals", Icon: HandshakeIcon },
  { key: "intro.trust.quality", Icon: BadgeCheckIcon },
  { key: "intro.trust.reach", Icon: GlobeIcon },
  { key: "intro.trust.support", Icon: HeadsetIcon },
];

/**
 * IntroExperience — a single-screen cinematic first-visit intro, shown once
 * per browser (localStorage-gated) on any public route, so a visitor who
 * arrives via a shared listing link meets the brand too. Dismissing it
 * reveals whatever page they actually came for, untouched.
 *
 * Everything is real markup rather than a flattened screenshot: the seven
 * category tiles navigate into the marketplace, the gear actually rotates,
 * and each block fades up in sequence. The poster artwork is used only as
 * an atmospheric background layer beneath it all.
 *
 * Sized to fit one viewport at every breakpoint with no scrolling — type,
 * spacing and iconography scale via clamp() against viewport *height* as
 * well as width, so a short laptop window compresses the same way a phone
 * does instead of overflowing.
 *
 * Still a client-only overlay ON TOP of the already server-rendered
 * homepage (never a route swap), so /, /vehicles, /parts etc. stay fully
 * crawlable exactly as before.
 */
export default function IntroExperience() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isIntroAllowed(pathname)) return;
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

  if (!isIntroAllowed(pathname) || !visible) return null;

  // Staggered fade-up: same class on every block, only the delay differs so
  // the sequence reads top-to-bottom.
  const revealCls = ready ? "hw-intro-reveal" : "opacity-0";
  const after = (ms) => ({ animationDelay: `${ms}ms` });

  return (
    <div
      className="hw-intro-scope fixed inset-0 z-[999] overflow-hidden bg-[var(--hw-bg-base)]"
      role="dialog"
      aria-modal="true"
      aria-label={t("intro.ariaLabel")}
    >
      {/* Atmospheric backdrop. Uses intro-machinery.jpg — the poster cropped
          to its text-free machinery band — rather than the whole poster:
          at any opacity the full poster ghosted its own headline, category
          tiles and button behind the real UI rendered on top of them.
          Anchored to the bottom as a horizon line so the sunset glow sits
          behind the content without competing with it. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] sm:h-[62%]">
        <Image
          src="/intro-machinery.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45"
        />
        {/* Feathers the band's hard top edge into the background. */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,15,1),rgba(7,10,15,0.45)_38%,rgba(7,10,15,0.9))]" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,15,0.55),rgba(7,10,15,0.25)_45%,rgba(7,10,15,0.8))]" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[16%] h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(249,115,22,0.28), transparent 70%)" }}
      />

      <button
        type="button"
        onClick={dismiss}
        className="absolute end-3 top-3 z-20 rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white/80 backdrop-blur transition hover:border-white/40 hover:text-white sm:end-5 sm:top-5"
      >
        {t("intro.skip")}
      </button>

      {/* Content column — vertically centred, scales with viewport height so
          it never needs to scroll. */}
      {/* overflow-y-auto is a safety net, not the intended state: at every
          tested size the content fits one screen. But a centred flex column
          clips overflow off BOTH ends silently, which previously hid the
          CTA entirely in Urdu — scrolling degrades far better than an
          unreachable button if a translation ever runs long. */}
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-[clamp(0.5rem,1.6vh,1.5rem)] overflow-y-auto px-4 py-[clamp(0.75rem,2vh,2rem)] text-center">

        {/* Logo + rotating gear */}
        <div className={`relative flex shrink-0 items-center justify-center ${ready ? "hw-logo-in" : "opacity-0"}`}>
          <svg
            viewBox="0 0 200 200"
            aria-hidden
            className="hw-intro-gear pointer-events-none absolute h-[clamp(7rem,17vh,13rem)] w-auto opacity-80"
          >
            <defs>
              <linearGradient id="hwIntroSteel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#c3ccd9" />
                <stop offset="60%" stopColor="#697585" />
                <stop offset="100%" stopColor="#e8edf3" />
              </linearGradient>
            </defs>
            {Array.from({ length: 20 }).map((_, i) => (
              <rect
                key={i}
                x="96"
                y="6"
                width="8"
                height="18"
                rx="2"
                fill="url(#hwIntroSteel)"
                transform={`rotate(${(360 / 20) * i} 100 100)`}
              />
            ))}
            <circle cx="100" cy="100" r="78" fill="none" stroke="url(#hwIntroSteel)" strokeWidth="14" />
            <circle cx="100" cy="100" r="58" fill="none" stroke="#3a4657" strokeWidth="2" />
          </svg>

          {/* The real brand asset, never re-drawn as text. */}
          <Image
            src="/heavywheels-logo.png"
            alt="HeavyWheels PK"
            width={420}
            height={120}
            priority
            className="relative z-10 h-[clamp(2.6rem,7vh,5rem)] w-auto drop-shadow-[0_0_30px_rgba(249,115,22,0.35)]"
          />
        </div>

        <p
          className={`${revealCls} shrink-0 text-[clamp(0.55rem,1.5vh,0.85rem)] font-bold uppercase tracking-[0.28em] text-white/75`}
          style={after(150)}
        >
          {t("intro.tagline")}
        </p>

        {/* Welcome */}
        <div className={`${revealCls} flex shrink-0 flex-col items-center gap-1`} style={after(280)}>
          <div className="flex items-center justify-center gap-3">
            <span className="hw-intro-rule w-8 sm:w-16" />
            <span className="text-[clamp(0.5rem,1.3vh,0.75rem)] font-bold uppercase tracking-[0.4em] text-[var(--hw-orange)]">
              {t("intro.welcomeTo")}
            </span>
            <span className="hw-intro-rule w-8 sm:w-16" />
          </div>
          {/* hw-ltr keeps the Latin wordmark in reading order under RTL —
              without it Urdu flips the spans to "PK Wheels Heavy". */}
          <h1 dir="ltr" className="hw-ltr hw-intro-display flex items-baseline justify-center gap-[0.08em] text-[clamp(1.6rem,5.5vh,3.4rem)] leading-none">
            <span className="hw-steel-text">Heavy</span>
            <span className="hw-amber-text">Wheels</span>
            <span className="hw-steel-text text-[0.58em]">PK</span>
          </h1>
          <p className="mt-1 max-w-xl text-[clamp(0.7rem,1.7vh,1rem)] leading-snug text-white/85">
            {t("intro.subtitleLead")}
            <br />
            <span className="font-bold text-[var(--hw-orange)]">{t("intro.subtitleEmphasis")}</span>
          </p>
        </div>

        {/* Category tiles — real links into the marketplace */}
        <ul
          className={`${revealCls} grid w-full max-w-3xl shrink-0 grid-cols-4 gap-[clamp(0.3rem,0.9vh,0.6rem)] sm:grid-cols-7`}
          style={after(420)}
        >
          {CATEGORIES.map(({ key, href, Icon }) => (
            <li key={key} className="min-w-0">
              <Link
                href={href}
                onClick={dismiss}
                className="hw-intro-tile flex h-full w-full flex-col items-center justify-center gap-1.5 px-1 py-[clamp(0.4rem,1.2vh,0.9rem)]"
              >
                <Icon className="h-[clamp(1.1rem,2.6vh,1.9rem)] w-auto text-[var(--hw-orange)]" />
                <span className="text-[clamp(0.4rem,1.05vh,0.62rem)] font-bold uppercase leading-tight tracking-[0.1em] text-white/85">
                  {t(key)}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Our motive */}
        <div className={`${revealCls} flex shrink-0 flex-col items-center gap-1.5`} style={after(560)}>
          <div className="flex items-center justify-center gap-3">
            <span className="hw-intro-rule w-6 sm:w-12" />
            <h2 className="text-[clamp(0.6rem,1.5vh,0.95rem)] font-black uppercase tracking-[0.3em] text-[var(--hw-orange)]">
              {t("intro.motiveEyebrow")}
            </h2>
            <span className="hw-intro-rule w-6 sm:w-12" />
          </div>
          <p className="max-w-2xl text-[clamp(0.65rem,1.6vh,0.95rem)] leading-relaxed text-white/80">
            {t("intro.motiveBody")}
          </p>
        </div>

        {/* Trust points */}
        <ul className={`${revealCls} grid w-full max-w-3xl shrink-0 grid-cols-5 gap-1`} style={after(700)}>
          {VALUES.map(({ key, Icon }) => (
            <li key={key} className="flex min-w-0 flex-col items-center gap-1 px-0.5">
              <Icon className="h-[clamp(0.95rem,2.2vh,1.6rem)] w-auto text-white/70" />
              <span className="text-[clamp(0.38rem,1vh,0.6rem)] font-bold uppercase leading-tight tracking-[0.1em] text-white/60">
                {t(key)}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA — glow lives on the button, fade-up on this wrapper, so the
            two animations never collide on one element. */}
        <div className={`${revealCls} w-full max-w-sm shrink-0`} style={after(840)}>
          <button
            type="button"
            onClick={dismiss}
            className="hw-cta-glow inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[var(--hw-orange)] bg-black/40 px-5 py-[clamp(0.5rem,1.5vh,0.85rem)] text-[clamp(0.7rem,1.8vh,1rem)] font-black uppercase tracking-[0.15em] text-[var(--hw-orange)] transition hover:bg-[var(--hw-orange)] hover:text-[var(--hw-text-inverse)]"
          >
            {t("intro.cta")}
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
