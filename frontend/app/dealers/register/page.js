import DealerRegisterForm from "@/components/dealers/DealerRegisterForm";
import { getT } from "@/lib/i18n-server";

export default async function DealerRegisterPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mb-8">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("dealerreg.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("dealerreg.title")}</h1>
      </div>
      <DealerRegisterForm />
    </main>
  );
}
