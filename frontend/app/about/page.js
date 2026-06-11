import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "About Us — HeavyWheels",
  description: "HeavyWheels is Pakistan's marketplace for heavy vehicles, machinery, and commercial vehicle parts.",
};

export default async function AboutPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("about.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("about.title")}</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">{t("about.subtitle")}</p>

        <div className="mt-8 grid gap-8 text-[var(--hw-text-secondary)] leading-7">
          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("about.whoTitle")}</h2>
            <p className="mt-3">{t("about.whoBody")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("about.offerTitle")}</h2>
            <ul className="mt-3 grid gap-2 list-disc pl-5">
              <li>{t("about.offer1")}</li>
              <li>{t("about.offer2")}</li>
              <li>{t("about.offer3")}</li>
              <li>{t("about.offer4")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("about.missionTitle")}</h2>
            <p className="mt-3">{t("about.missionBody")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("about.touchTitle")}</h2>
            <p className="mt-3">
              {t("about.touchBefore")}
              <a href="/contact" className="font-bold text-[var(--hw-orange)] hover:underline">{t("common.contactPage")}</a>
              {t("about.touchAfter")}
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
