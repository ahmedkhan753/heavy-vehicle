import SavedAds from "@/components/dashboard/SavedAds";
import { getT } from "@/lib/i18n-server";

export default async function SavedPage() {
  const t = await getT();
  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.dashboard")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">{t("dash.savedAds")}</h1>
      </div>
      <SavedAds />
    </>
  );
}
