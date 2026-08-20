import AdvertiseForm from "@/components/ads/AdvertiseForm";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Advertise",
  description:
    "Banner advertising on Pakistan's heavy vehicle marketplace. Reach truck owners, dealers and fleet buyers on the homepage and listing pages.",
};

export default async function AdvertisePage() {
  const t = await getT();

  const WHY = [t("ad.why1"), t("ad.why2"), t("ad.why3")];
  const PLACEMENTS = ["header", "home-mid", "listing"];

  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 sm:mb-6">
          <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">{t("ad.eyebrow")}</p>
          <h1 className="mt-1 text-[22px] font-black leading-tight text-[var(--hw-text-primary)] sm:mt-2 sm:text-3xl md:text-4xl">
            {t("ad.title")}
          </h1>
          <p className="mt-1.5 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-2 sm:text-base">
            {t("ad.subtitle")}
          </p>
        </div>

        <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
            <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("ad.whyTitle")}</h2>
            <ul className="mt-3 grid gap-2.5 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-sm">
              {WHY.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 shrink-0 font-black text-[var(--hw-orange)]">✦</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-[13px] font-black uppercase tracking-wide text-[var(--hw-orange)] sm:text-sm">
              {t("ad.placements")}
            </h3>
            <ul className="mt-2 grid gap-2">
              {PLACEMENTS.map((p) => (
                <li key={p} className="rounded-lg border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] px-3 py-2 text-[12px] font-bold text-[var(--hw-text-secondary)] sm:text-sm">
                  {t(`ad.placement.${p}`)}
                </li>
              ))}
            </ul>
          </div>

          <AdvertiseForm />
        </div>
      </div>
    </main>
  );
}
