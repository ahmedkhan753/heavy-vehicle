import Link from "next/link";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Services — HeavyWheels",
  description: "Inspection, financing, price guidance, and warranty — everything you need to buy and sell heavy vehicles with confidence.",
};

export default async function ServicesPage() {
  const t = await getT();

  const SERVICES = [
    { icon: "🔍", title: t("services.inspectionTitle"), desc: t("services.inspectionDesc"), href: "/services/inspection" },
    { icon: "📊", title: t("services.priceGuideTitle"), desc: t("services.priceGuideDesc"), href: "/services/price-guide" },
    { icon: "💰", title: t("services.loanTitle"), desc: t("services.loanDesc"), href: "/services/loan-calculator" },
    { icon: "🛡️", title: t("services.warrantyTitle"), desc: t("services.warrantyDesc"), href: "/services/warranty" },
    { icon: "📢", title: t("biz.servicesTitle"), desc: t("biz.servicesDesc"), href: "/businesses" },
  ];

  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("services.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("services.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--hw-text-muted)]">{t("services.subtitle")}</p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) =>
            s.href ? (
              <Link
                key={s.title}
                href={s.href}
                className="group flex h-full flex-col rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 transition hover:-translate-y-1 hover:border-[var(--hw-orange)]"
              >
                <div className="text-3xl">{s.icon}</div>
                <h2 className="mt-4 text-lg font-black text-[var(--hw-text-primary)] group-hover:text-[var(--hw-orange)]">{s.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--hw-text-secondary)]">{s.desc}</p>
                <span className="mt-4 text-sm font-bold text-[var(--hw-orange)]">{t("common.open")} →</span>
              </Link>
            ) : (
              <div
                key={s.title}
                className="relative flex h-full flex-col rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6"
              >
                <span className="absolute right-4 top-4 rounded-full bg-[var(--hw-bg-elevated)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--hw-text-muted)]">
                  {t("common.comingSoon")}
                </span>
                <div className="text-3xl opacity-70">{s.icon}</div>
                <h2 className="mt-4 text-lg font-black text-[var(--hw-text-primary)]">{s.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--hw-text-secondary)]">{s.desc}</p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
