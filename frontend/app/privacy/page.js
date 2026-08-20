import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Privacy Policy",
  description: "How HeavyWheels collects, uses, and protects your personal information.",
};

export default async function PrivacyPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("privacy.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("privacy.title")}</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
          {t("privacy.lastUpdated")}: {new Date().getFullYear()}
        </p>

        <div className="mt-8 grid gap-8 text-[var(--hw-text-secondary)] leading-7">
          <section>
            <p>{t("privacy.intro")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("privacy.s1Title")}</h2>
            <ul className="mt-3 grid gap-2 list-disc pl-5">
              <li><strong>{t("privacy.s1a")}</strong>{t("privacy.s1aRest")}</li>
              <li><strong>{t("privacy.s1b")}</strong>{t("privacy.s1bRest")}</li>
              <li><strong>{t("privacy.s1c")}</strong>{t("privacy.s1cRest")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("privacy.s2Title")}</h2>
            <ul className="mt-3 grid gap-2 list-disc pl-5">
              <li>{t("privacy.s2a")}</li>
              <li>{t("privacy.s2b")}</li>
              <li>{t("privacy.s2c")}</li>
              <li>{t("privacy.s2d")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("privacy.s3Title")}</h2>
            <p className="mt-3">{t("privacy.s3Body")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("privacy.s4Title")}</h2>
            <p className="mt-3">{t("privacy.s4Body")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("privacy.s5Title")}</h2>
            <p className="mt-3">{t("privacy.s5Body")}</p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("privacy.s6Title")}</h2>
            <p className="mt-3">
              {t("privacy.s6Before")}
              <a href="/contact" className="font-bold text-[var(--hw-orange)] hover:underline">{t("common.contactPage")}</a>
              {t("privacy.s6After")}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("privacy.s7Title")}</h2>
            <p className="mt-3">{t("privacy.s7Body")}</p>
          </section>

          <p className="text-sm text-[var(--hw-text-muted)]">{t("privacy.disclaimer")}</p>
        </div>
      </div>
    </main>
  );
}
