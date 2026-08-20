import Link from "next/link";
import BusinessCard from "@/components/businesses/BusinessCard";
import BusinessFilters from "@/components/businesses/BusinessFilters";
import { SERVER_API_BASE_URL, buildQuery } from "@/lib/api";
import { getT, getLang } from "@/lib/i18n-server";

export const revalidate = 60;

export const metadata = {
  title: "Business Directory",
  description:
    "Find workshops, tyre shops, crane rental, transporters, insurance agents and other businesses serving heavy vehicles across Pakistan.",
};

async function getBusinesses(searchParams) {
  const query = buildQuery({ ...(await searchParams), limit: 24 });
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/businesses${query}`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch {
    return { data: [], pagination: { total: 0 } };
  }
}

export default async function BusinessesPage({ searchParams }) {
  const result = await getBusinesses(searchParams);
  const businesses = result.data || [];
  const total = result.pagination?.total ?? businesses.length;
  const params = await searchParams;
  const t = await getT();
  const lang = await getLang();

  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      <div className="mb-4 flex flex-col gap-3 sm:mb-8 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">{t("biz.eyebrow")}</p>
          <h1 className="mt-1 text-[22px] font-black leading-tight text-[var(--hw-text-primary)] sm:mt-2 sm:text-3xl md:text-4xl">
            {t("biz.title")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:mt-2 sm:text-base">
            {t("biz.subtitle")}
          </p>
        </div>
        <Link
          href="/businesses/register"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:h-11 sm:text-sm"
        >
          {t("biz.listYours")}
        </Link>
      </div>

      <BusinessFilters params={params || {}} lang={lang} />

      <p className="mb-3 text-[13px] text-[var(--hw-text-secondary)] sm:mb-4 sm:text-sm">
        <span className="font-black text-[var(--hw-text-primary)]">{total}</span> {t("biz.found")}
      </p>

      {businesses.length ? (
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {businesses.map((b) => <BusinessCard key={b._id} business={b} lang={lang} />)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center sm:p-10">
          <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("biz.noneTitle")}</h2>
          <p className="mt-2 text-[13px] text-[var(--hw-text-secondary)] sm:text-base">{t("biz.noneBody")}</p>
          <Link
            href="/businesses/register"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] sm:mt-5 sm:h-11 sm:px-5 sm:text-sm"
          >
            {t("biz.listYours")}
          </Link>
        </div>
      )}
    </main>
  );
}
