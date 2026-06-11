import Link from "next/link";
import PartnershipForm from "@/components/inspectors/PartnershipForm";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Vehicle Inspection — HeavyWheels",
  description: "Hire a verified inspector before you buy, or join HeavyWheels as an inspection officer or company.",
};

export default async function InspectionPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("services.serviceEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("services.inspectionTitle")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--hw-text-muted)]">{t("inspection.subtitle")}</p>

        {/* Two paths */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
            <div className="text-3xl">🔍</div>
            <h2 className="mt-3 text-lg font-black text-[var(--hw-text-primary)]">{t("inspection.wantTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">{t("inspection.wantBody")}</p>
            <Link href="/inspectors" className="mt-4 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("inspection.findInspector")}</Link>
          </div>
          <div className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6">
            <div className="text-3xl">🧰</div>
            <h2 className="mt-3 text-lg font-black text-[var(--hw-text-primary)]">{t("inspection.amTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--hw-text-secondary)]">{t("inspection.amBody")}</p>
            <Link href="/inspectors/register" className="mt-4 inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">{t("inspection.become")}</Link>
          </div>
        </div>

        {/* Partnership */}
        <div className="mt-10">
          <h2 className="text-2xl font-black text-[var(--hw-text-primary)]">{t("inspection.partnerTitle")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--hw-text-secondary)]">{t("inspection.partnerBody")}</p>
          <div className="mt-5">
            <PartnershipForm />
          </div>
        </div>
      </div>
    </main>
  );
}
