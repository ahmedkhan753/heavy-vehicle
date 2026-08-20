import { TC_VERSION, COMMISSION_LABEL } from "@/lib/pricing";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Terms & Conditions",
  description: "HeavyWheels terms of use, including the sales commission policy for sellers.",
};

export default async function TermsPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("terms.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("terms.title")}</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">{t("terms.version")} {TC_VERSION}</p>

        <div className="mt-8 grid gap-8 text-[var(--hw-text-secondary)] leading-7">
          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("terms.s1Title")}</h2>
            <p className="mt-3">{t("terms.s1Body")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("terms.s2Title")}</h2>
            <p className="mt-3">{t("terms.s2Body")}</p>
          </section>

          {/* The commission clause — highlighted so it is unmistakable. */}
          <section className="rounded-xl border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] p-5">
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("terms.s3Title")}</h2>
            <p className="mt-3">
              {t("terms.s3Body1Before")}
              <strong>{COMMISSION_LABEL} {t("terms.s3Commission")}</strong>.
            </p>
            <p className="mt-3">
              {t("terms.s3Body2Before")}
              <strong>{t("terms.s3Days")}</strong>
              {t("terms.s3Body2After")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("terms.s4Title")}</h2>
            <p className="mt-3">{t("terms.s4Body")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("terms.s5Title")}</h2>
            <p className="mt-3">{t("terms.s5Body")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("terms.s6Title")}</h2>
            <p className="mt-3">{t("terms.s6Body")}</p>
          </section>

          <p className="text-sm text-[var(--hw-text-muted)]">{t("terms.disclaimer")}</p>
        </div>
      </div>
    </main>
  );
}
