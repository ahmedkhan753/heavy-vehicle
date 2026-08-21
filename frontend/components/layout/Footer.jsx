"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/Context/LanguageContext";
import { useToast } from "@/Context/ToastContext";
import BrandLogo from "@/components/layout/BrandLogo";

// Link tuples are [labelKey, href]. A third `true` marks a feature that
// isn't built yet — it renders as a non-navigating "Coming soon" item
// instead of linking to a route that would 404.
const columns = [
  {
    // Whole destinations, not three arbitrary vehicle types — someone
    // looking for a grader or a trailer got nothing out of a list that
    // named only prime movers, dumpers and tankers.
    title: "footer.buy",
    links: [
      ["footer.link.vehicles", "/vehicles"],
      ["footer.link.spareParts", "/parts"],
      ["footer.link.plans", "/subscription-pricings"],
      ["footer.link.featuredAds", "/featured"],
    ],
  },
  {
    title: "footer.sell",
    links: [
      ["footer.link.postFree", "/post-ad"],
      ["footer.link.dealerReg", "/dealers/register"],
      ["footer.link.featured", "/promote"],
      ["footer.link.manageAds", "/dashboard/my-ads"],
    ],
  },
  {
    title: "footer.services",
    links: [
      ["footer.link.inspection", "/services/inspection"],
      ["footer.link.loan", "/services/loan-calculator"],
      ["footer.link.priceGuide", "/services/price-guide"],
      ["footer.link.warranty", "/services/warranty"],
      ["biz.navLabel", "/businesses"],
    ],
  },
  {
    title: "footer.company",
    links: [
      ["footer.link.about", "/about"],
      ["footer.contact", "/contact"],
      ["footer.link.dealers", "/dealers"],
      ["ad.navLabel", "/advertise"],
    ],
  },
];

export default function Footer() {
  const { t } = useLanguage();
  const toast = useToast();
  // Which section is expanded on mobile. Desktop ignores this entirely —
  // every column is always open there via `sm:block`.
  const [openSection, setOpenSection] = useState(null);

  return (
    <footer className="mt-auto border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
      <div className="hw-container grid gap-6 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-11 w-auto sm:h-14 md:h-16" />
          </Link>
          <p className="mt-3 max-w-sm text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-5 sm:text-sm sm:leading-7">
            {t("footer.tagline")}
          </p>
          {/* Three stacked lines cost three rows on a phone for very little
              information — they wrap into one on mobile, stack on desktop. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--hw-text-muted)] sm:mt-5 sm:grid sm:gap-2 sm:text-sm">
            <span>info@heavywheels.pk</span>
            <span className="text-[var(--hw-border-strong)] sm:hidden">·</span>
            <span>+92 300 0000000</span>
            <span className="text-[var(--hw-border-strong)] sm:hidden">·</span>
            <span>Karachi, Pakistan</span>
          </div>
        </div>

        {/* Mobile: four collapsed rows instead of ~22 stacked links, which
            made the footer longer than most of the pages above it.
            Tablet/desktop keep the plain always-open columns. */}
        <div className="grid divide-y divide-[var(--hw-border-subtle)] border-y border-[var(--hw-border-subtle)] sm:grid-cols-2 sm:gap-8 sm:divide-y-0 sm:border-0 lg:grid-cols-4">
          {columns.map((column) => {
            const isOpen = openSection === column.title;
            return (
              <div key={column.title} className="min-w-0">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : column.title)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between py-3 text-start font-black text-[var(--hw-text-primary)] sm:pointer-events-none sm:py-0"
                >
                  {t(column.title)}
                  <svg
                    className={`h-4 w-4 shrink-0 text-[var(--hw-text-muted)] transition-transform sm:hidden ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                <ul className={`grid gap-3 pb-4 sm:mt-5 sm:block sm:space-y-3 sm:pb-0 ${isOpen ? "grid" : "hidden"}`}>
                  {column.links.map(([labelKey, href, comingSoon]) =>
                    comingSoon ? (
                      <li key={href}>
                        <button
                          type="button"
                          onClick={() => toast.info(`${t(labelKey)} — coming soon!`)}
                          className="flex items-center gap-2 text-left text-sm text-[var(--hw-text-secondary)] cursor-default hover:text-[var(--hw-text-primary)]"
                        >
                          {t(labelKey)}
                          <span className="rounded-full bg-[var(--hw-bg-elevated)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--hw-text-muted)]">
                            Soon
                          </span>
                        </button>
                      </li>
                    ) : (
                      <li key={href}>
                        <Link href={href} className="text-sm text-[var(--hw-text-secondary)] hover:text-[var(--hw-orange)]">
                          {t(labelKey)}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-[var(--hw-border-subtle)] py-4 sm:py-5">
        <div className="hw-container flex flex-col gap-2 text-xs text-[var(--hw-text-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {/* Legal links above the copyright on mobile: they're the reason
              someone scrolls this far, so they shouldn't be the last thing. */}
          <div className="order-1 flex gap-4 sm:order-2">
            <Link href="/privacy" className="hover:text-[var(--hw-orange)]">{t("footer.privacy")}</Link>
            <Link href="/terms" className="hover:text-[var(--hw-orange)]">{t("footer.terms")}</Link>
            <Link href="/contact" className="hover:text-[var(--hw-orange)]">{t("footer.contact")}</Link>
          </div>
          <p className="order-2 sm:order-1">© {new Date().getFullYear()} {t("common.brandSub")}. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
