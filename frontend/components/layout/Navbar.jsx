"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import MessagesBell from "@/components/chat/MessagesBell";
import BrandLogo from "@/components/layout/BrandLogo";
import { useAuth } from "@/Context/AuthContext";
import { useLanguage } from "@/Context/LanguageContext";
import { VEHICLE_TYPES, makeLabel, cityLabel, typeLabel } from "@/lib/constants";
import { PART_CATEGORIES, partCategoryLabel } from "@/lib/parts";

// ── Menu content (slugs → localized labels at render) ─────────────
const MENU_TYPES = VEHICLE_TYPES.slice(0, 6); // { value, label, urdu }
const MENU_MAKES = ["hino", "isuzu", "faw", "shacman", "sinotruk", "volvo", "mercedes"];
const MENU_CITIES = ["karachi", "lahore", "islamabad", "rawalpindi", "faisalabad", "multan", "peshawar"];
const PART_CATS = PART_CATEGORIES.filter((c) => c.value !== "other"); // { value, label, urdu }

const Caret = () => (
  <svg className="h-3 w-3 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
);

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { t, lang } = useLanguage();

  const close = () => setOpenMenu(null);

  // Mega-menu definitions (cond = "new" | "used"). Labels localize via lang.
  const vehicleMega = (cond, thirdCol) => ({
    columns: [
      {
        title: t("nav.browseByType"),
        links: [
          ...MENU_TYPES.map((vt) => [typeLabel(vt, lang), `/vehicles?condition=${cond}&type=${vt.value}`]),
          [cond === "new" ? t("nav.allNew") : t("nav.allUsed"), `/vehicles?condition=${cond}`],
        ],
      },
      thirdCol === "makes"
        ? { title: t("nav.popularMakes"), links: MENU_MAKES.map((m) => [makeLabel(m, lang), `/vehicles?condition=${cond}&make=${m}`]) }
        : { title: t("nav.byCity"), links: MENU_CITIES.map((c) => [cityLabel(c, lang), `/vehicles?condition=${cond}&city=${c}`]) },
      cond === "new"
        ? { title: t("nav.helpful"), links: [[t("footer.link.priceGuide"), "/services/price-guide"], [t("footer.link.loan"), "/services/loan-calculator"], [t("nav.findDealers"), "/dealers"], [t("nav.postYourAd"), "/post-ad"]] }
        : { title: t("nav.servicesCol"), links: [[t("footer.link.inspection"), "/services/inspection"], [t("footer.link.warranty"), "/services/warranty"], [t("footer.link.priceGuide"), "/services/price-guide"], [t("nav.sellVehicle"), "/post-ad"]] },
    ],
  });

  const serviceItems = [
    [t("footer.link.inspection"), "/services/inspection"],
    [t("footer.link.priceGuide"), "/services/price-guide"],
    [t("footer.link.loan"), "/services/loan-calculator"],
    [t("footer.link.warranty"), "/services/warranty"],
    [t("biz.navLabel"), "/businesses"],
    [t("ad.navLabel"), "/advertise"],
    [t("nav.allServices"), "/services"],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--hw-border-subtle)] bg-[var(--hw-bg-overlay)] backdrop-blur-xl" suppressHydrationWarning={true}>
      <div className="hw-container flex h-20 items-center justify-between gap-4 md:h-24">
        <Link href="/" className="flex items-center" aria-label="HeavyWheels home">
          <BrandLogo className="h-16 w-auto md:h-20" />
        </Link>

        <nav suppressHydrationWarning className="hidden items-center gap-1 lg:flex">
          {/* New Vehicles — mega */}
          <MegaItem label={t("nav.newVehicles")} active={openMenu === "new"} onOpen={() => setOpenMenu("new")} onClose={close}>
            <MegaPanel mega={vehicleMega("new", "makes")} onNavigate={close} />
          </MegaItem>

          {/* Used Vehicles — mega */}
          <MegaItem label={t("nav.usedVehicles")} active={openMenu === "used"} onOpen={() => setOpenMenu("used")} onClose={close}>
            <MegaPanel mega={vehicleMega("used", "cities")} onNavigate={close} />
          </MegaItem>

          {/* Parts — dropdown */}
          <MegaItem label={t("nav.parts")} active={openMenu === "parts"} onOpen={() => setOpenMenu("parts")} onClose={close}>
            <DropdownPanel
              wide
              items={[...PART_CATS.map((c) => [partCategoryLabel(c.value, lang), `/parts?category=${c.value}`]), [t("nav.allParts"), "/parts"], [t("nav.sellPart"), "/post-part"]]}
              onNavigate={close}
            />
          </MegaItem>

          <Link href="/dealers" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--hw-text-secondary)] hover:bg-[var(--hw-soft-panel)] hover:text-[var(--hw-text-primary)]">{t("nav.dealers")}</Link>

          {/* Services — dropdown */}
          <MegaItem label={t("nav.services")} active={openMenu === "services"} onOpen={() => setOpenMenu("services")} onClose={close}>
            <DropdownPanel items={serviceItems} onNavigate={close} />
          </MegaItem>

          <Link href="/subscription-pricings" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--hw-text-secondary)] hover:bg-[var(--hw-soft-panel)] hover:text-[var(--hw-text-primary)]">{t("nav.pricing")}</Link>
        </nav>

        <div suppressHydrationWarning className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <MessagesBell />
              {user?.role === "admin" ? (
                <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--hw-orange)] hover:text-[var(--hw-amber)]">Admin</Link>
              ) : null}
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)]">{user?.name || t("nav.dashboard")}</Link>
              <button onClick={logout} className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)]">{t("nav.logout")}</button>
            </>
          ) : (
            <Link href="/auth/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)]">{t("nav.login")}</Link>
          )}
          <Link href="/post-ad"><Button size="sm">{t("nav.postAd")}</Button></Link>
        </div>

        {/* Always visible below md — language/theme stay reachable without opening the menu */}
        <div className="flex items-center gap-1.5 md:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--hw-border-default)] text-[var(--hw-text-primary)]"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>

        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[var(--hw-border-default)] text-[var(--hw-text-primary)] md:inline-flex lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] p-4 lg:hidden">
          <div className="hw-container grid gap-2">
            {[
              [t("nav.newVehicles"), "/vehicles?condition=new"],
              [t("nav.usedVehicles"), "/vehicles?condition=used"],
              [t("nav.parts"), "/parts"],
              [t("nav.dealers"), "/dealers"],
              [t("nav.services"), "/services"],
              [t("nav.pricing"), "/subscription-pricings"],
              ...(isAuthenticated ? [[t("dash.messages"), "/dashboard/messages"], [t("nav.dashboard"), "/dashboard"]] : []),
            ].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-lg border border-[var(--hw-border-subtle)] px-3 py-3 text-sm text-[var(--hw-text-secondary)]">
                <span>{label}</span>
              </Link>
            ))}
            {isAuthenticated && user?.role === "admin" ? (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center justify-between rounded-lg border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] px-3 py-3 text-sm font-bold text-[var(--hw-orange)]">
                <span>Admin Dashboard</span>
              </Link>
            ) : null}
            <Link href="/post-ad" onClick={() => setMobileOpen(false)}><Button className="w-full">{t("nav.postFreeAd")}</Button></Link>
            {isAuthenticated ? (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="h-11 rounded-lg border border-[var(--hw-border-default)] text-sm font-bold text-[var(--hw-text-primary)]">{t("nav.logout")}</button>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex h-11 items-center justify-center rounded-lg border border-[var(--hw-border-default)] text-sm font-bold text-[var(--hw-text-primary)]">{t("nav.login")}</Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

// A hoverable top-level nav item that reveals a panel.
function MegaItem({ label, active, onOpen, onClose, children }) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-[var(--hw-soft-panel)] text-[var(--hw-text-primary)]" : "text-[var(--hw-text-secondary)] hover:bg-[var(--hw-soft-panel)] hover:text-[var(--hw-text-primary)]"}`}>
        {label}
        <Caret />
      </button>
      {active ? children : null}
    </div>
  );
}

// Wide 3-column mega panel for New/Used vehicles.
function MegaPanel({ mega, onNavigate }) {
  return (
    <div className="absolute start-0 top-full z-50 w-[680px] max-w-[min(88vw,680px)] rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 shadow-2xl">
      <div className="grid grid-cols-3 gap-6">
        {mega.columns.map((col) => (
          <div key={col.title}>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-[var(--hw-orange)]">{col.title}</p>
            <div className="grid gap-1">
              {col.links.map(([label, href]) => (
                <Link key={href} href={href} onClick={onNavigate} className="rounded-md px-2 py-1.5 text-sm text-[var(--hw-text-secondary)] hover:bg-[var(--hw-soft-panel)] hover:text-[var(--hw-text-primary)]">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple dropdown panel (optionally two columns).
function DropdownPanel({ items, wide, onNavigate }) {
  return (
    <div className={`absolute start-0 top-full z-50 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-2 shadow-2xl ${wide ? "w-80" : "w-60"}`}>
      <div className={wide ? "grid grid-cols-2 gap-1" : "grid gap-1"}>
        {items.map(([label, href]) => (
          <Link key={href} href={href} onClick={onNavigate} className="rounded-md px-3 py-2 text-sm text-[var(--hw-text-secondary)] hover:bg-[var(--hw-soft-panel)] hover:text-[var(--hw-text-primary)]">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
