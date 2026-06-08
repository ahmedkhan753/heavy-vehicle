import Link from "next/link";
import MyAds from "@/components/dashboard/MyAds";
import { getT } from "@/lib/i18n-server";

export default async function MyAdsPage() {
  const t = await getT();
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.dashboard")}</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)]">{t("dash.myAds")}</h1>
        </div>
        <Link href="/post-ad" className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("nav.postAd")}</Link>
      </div>
      <MyAds />
    </>
  );
}
