// Warranty is dealer-provided (badge model); HeavyWheels does not sell warranty.
import Link from "next/link";
import DealerWarrantyRequest from "@/components/services/DealerWarrantyRequest";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Warranty Program",
  description: "Dealer-provided warranty on heavy vehicles. Look for the Verified Warranty badge, or — if you're a dealer — get your own warranty badge.",
};

export default async function WarrantyPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("services.serviceEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("services.warrantyTitle")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--hw-text-muted)]">
          {t("warranty.subtitleBefore")}
          <span className="font-bold text-[var(--hw-green)]"> {t("warranty.verifiedBadge")}</span> {t("warranty.subtitleAfter")}
        </p>

        {/* Disclaimer */}
        <div className="mt-6 rounded-xl border border-[var(--hw-border-strong)] bg-[var(--hw-soft-panel)] p-4 text-sm text-[var(--hw-text-secondary)]">
          <strong className="text-[var(--hw-text-primary)]">{t("warranty.importantLabel")}</strong>{t("warranty.importantBefore")}<strong>{t("warranty.directlyByDealer")}</strong>{t("warranty.importantAfter")}
        </div>

        {/* For buyers */}
        <div className="mt-8">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("warranty.buyingTitle")}</h2>
          <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">
            {t("warranty.buyingBefore")}<span className="font-bold text-[var(--hw-green)]">{t("warranty.badgeWithShield")}</span>{t("warranty.buyingAfter")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/vehicles" className="inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("home.browseVehicles")}</Link>
            <Link href="/dealers" className="inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">{t("home.browseDealers")}</Link>
          </div>
        </div>

        {/* For dealers */}
        <div className="mt-10">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("warranty.dealerTitle")}</h2>
          <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">{t("warranty.dealerBody")}</p>
          <div className="mt-5">
            <DealerWarrantyRequest />
          </div>
        </div>
      </div>
    </main>
  );
}
