import InspectorRegisterForm from "@/components/inspectors/InspectorRegisterForm";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Become an Inspector",
  description: "Join HeavyWheels as a vehicle inspector. Set your own fee and reach buyers and sellers across Pakistan.",
};

export default async function InspectorRegisterPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("insp.regEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("insp.regTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">{t("insp.regSubtitle")}</p>
        <div className="mt-8">
          <InspectorRegisterForm />
        </div>
      </div>
    </main>
  );
}
