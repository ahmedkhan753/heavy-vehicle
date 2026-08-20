import BusinessForm from "@/components/businesses/BusinessForm";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "List your business — HeavyWheels",
  description: "Advertise your workshop, parts shop, crane rental or transport service to heavy vehicle owners across Pakistan.",
};

export default async function BusinessRegisterPage() {
  const t = await getT();
  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 sm:mb-6">
          <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">{t("biz.eyebrow")}</p>
          <h1 className="mt-1 text-[22px] font-black leading-tight text-[var(--hw-text-primary)] sm:mt-2 sm:text-3xl md:text-4xl">
            {t("bizForm.title")}
          </h1>
          <p className="mt-1.5 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-2 sm:text-base">
            {t("bizForm.subtitle")}
          </p>
        </div>
        <BusinessForm />
      </div>
    </main>
  );
}
