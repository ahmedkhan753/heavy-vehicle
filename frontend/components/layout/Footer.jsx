"use client";

import Link from "next/link";
import { useLanguage } from "@/Context/LanguageContext";
import { useToast } from "@/Context/ToastContext";
import BrandLogo from "@/components/layout/BrandLogo";

// Link tuples are [labelKey, href]. A third `true` marks a feature that
// isn't built yet — it renders as a non-navigating "Coming soon" item
// instead of linking to a route that would 404.
const columns = [
  {
    title: "footer.buy",
    links: [
      ["footer.link.primeMovers", "/vehicles?type=prime-mover"],
      ["footer.link.dumpers", "/vehicles?type=dumper"],
      ["footer.link.tankers", "/vehicles?type=oil-tanker"],
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
      ["footer.link.parts", "/parts"],
    ],
  },
];

export default function Footer() {
  const { t } = useLanguage();
  const toast = useToast();

  return (
    <footer className="mt-auto border-t border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)]">
      <div className="hw-container grid gap-10 py-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-14 w-auto md:h-16" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[var(--hw-text-secondary)]">
            {t("footer.tagline")}
          </p>
          <div className="mt-5 grid gap-2 text-sm text-[var(--hw-text-muted)]">
            <span>info@heavywheels.pk</span>
            <span>+92 300 0000000</span>
            <span>Karachi, Pakistan</span>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-black text-[var(--hw-text-primary)]">{t(column.title)}</h3>
              <ul className="mt-5 grid gap-3">
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
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--hw-border-subtle)] py-5">
        <div className="hw-container flex flex-col gap-3 text-xs text-[var(--hw-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t("common.brandSub")}. {t("footer.rights")}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--hw-orange)]">{t("footer.privacy")}</Link>
            <Link href="/terms" className="hover:text-[var(--hw-orange)]">{t("footer.terms")}</Link>
            <Link href="/contact" className="hover:text-[var(--hw-orange)]">{t("footer.contact")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
