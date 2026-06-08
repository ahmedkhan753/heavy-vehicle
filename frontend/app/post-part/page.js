import PostPartForm from "@/components/post-part/PostPartForm";
import { getT } from "@/lib/i18n-server";

export const metadata = {
  title: "Sell Spare Parts | HeavyWheels",
};

export default async function PostPartPage() {
  const t = await getT();
  return (
    <main className="hw-container py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.sellParts")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">
          {t("postpart.title")}
        </h1>
      </div>
      <PostPartForm />
    </main>
  );
}
