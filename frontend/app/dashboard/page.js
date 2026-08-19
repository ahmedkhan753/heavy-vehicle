import DashboardHome from "@/components/dashboard/DashboardHome";
import { getT } from "@/lib/i18n-server";

export default async function DashboardPage() {
  const t = await getT();
  return (
    <>
      <div className="mb-4 sm:mb-6">
        <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">{t("page.dashboard")}</p>
        <h1 className="mt-1 text-[22px] font-black leading-tight text-[var(--hw-text-primary)] sm:mt-2 sm:text-3xl md:text-4xl">{t("dash.commandCenter")}</h1>
      </div>
      <DashboardHome />
    </>
  );
}
