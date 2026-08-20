import Link from "next/link";
import PartCard from "@/components/parts/PartCard";
import PartFilters from "@/components/parts/PartFilters";
import { SERVER_API_BASE_URL, buildQuery } from "@/lib/api";
import { getT } from "@/lib/i18n-server";

export const revalidate = 60;

async function getParts(searchParams) {
  const query = buildQuery({ ...(await searchParams), limit: 12 });

  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/parts${query}`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error("Failed to fetch parts");
    return response.json();
  } catch {
    return {
      success: false,
      data: [],
      pagination: { total: 0, page: 1, pages: 0, hasNext: false, hasPrev: false },
    };
  }
}

export default async function PartsPage({ searchParams }) {
  const params = await searchParams;
  const result = await getParts(params);
  const parts = result.data || [];
  const pagination = result.pagination || {};
  const t = await getT();

  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      <div className="mb-4 flex flex-col gap-3 sm:mb-8 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase text-[var(--hw-orange)] sm:text-xs">{t("page.parts")}</p>
          <h1 className="mt-1 text-[22px] font-black leading-tight text-[var(--hw-text-primary)] sm:mt-2 sm:text-3xl md:text-4xl">
            {t("part.title")}
          </h1>
        </div>
        <Link
          href="/post-part"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:h-11 sm:text-sm"
        >
          {t("part.sell")}
        </Link>
      </div>

      <PartFilters params={params} />

      <p className="mb-3 text-[13px] text-[var(--hw-text-secondary)] sm:mb-4 sm:rounded-lg sm:border sm:border-[var(--hw-border-default)] sm:bg-[var(--hw-bg-card)] sm:p-4 sm:text-sm">
        <span className="font-black text-[var(--hw-text-primary)]">{pagination.total || parts.length}</span> {t("part.found")}
      </p>

      {parts.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
          {parts.map((part) => (
            <PartCard key={part._id} part={part} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("part.noneTitle")}</h2>
          <p className="mt-2 text-[var(--hw-text-secondary)]">
            {t("part.noneBody")}
          </p>
          <Link
            href="/post-part"
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
          >
            {t("part.createFirst")}
          </Link>
        </div>
      )}
    </main>
  );
}
