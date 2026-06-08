import DashboardHome from "@/components/dashboard/DashboardHome";
import { getT } from "@/lib/i18n-server";

export default async function DashboardPage() {
  const t = await getT();
  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.dashboard")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("dash.commandCenter")}</h1>
      </div>
      <DashboardHome />
    </>
  );
}
