import Purchases from "@/components/dashboard/Purchases";
import { getT } from "@/lib/i18n-server";

export default async function PurchasesPage() {
  const t = await getT();
  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.dashboard")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">{t("dash.purchases")}</h1>
      </div>
      <Purchases />
    </>
  );
}
