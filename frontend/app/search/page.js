import Link from "next/link";
import VehicleCard from "@/components/vehicles/VehicleCard";
import PartCard from "@/components/parts/PartCard";
import SearchBar from "@/components/home/SearchBar";
import { SERVER_API_BASE_URL } from "@/lib/api";
import { getT } from "@/lib/i18n-server";

export const revalidate = 0; // search results must always reflect the live query

async function getResults(q) {
  if (!q) return [];
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/search?q=${encodeURIComponent(q)}&limit=48`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function SearchPage({ searchParams }) {
  const { q = "" } = await searchParams;
  const results = await getResults(q);
  const t = await getT();

  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-2xl">
        <SearchBar defaultValue={q} />
      </div>

      <div className="mt-5 sm:mt-8">
        {q ? (
          <p className="mb-3 text-[13px] text-[var(--hw-text-muted)] sm:mb-5 sm:text-sm">
            {t("search.resultsFor")} <span className="font-black text-[var(--hw-text-primary)]">&ldquo;{q}&rdquo;</span> — {results.length}
          </p>
        ) : null}

        {results.length ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {results.map(({ kind, item }) =>
              kind === "vehicle" ? <VehicleCard key={item._id} vehicle={item} /> : <PartCard key={item._id} part={item} />
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-6 text-center sm:p-10">
            <h1 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("search.noResults")}</h1>
            <p className="mt-2 text-[13px] text-[var(--hw-text-secondary)] sm:text-base">{t("search.noResultsBody")}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <Link href="/vehicles" className="inline-flex h-10 items-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] sm:h-11 sm:px-5 sm:text-sm">
                {t("search.browseVehicles")}
              </Link>
              <Link href="/parts" className="inline-flex h-10 items-center rounded-lg border border-[var(--hw-border-strong)] px-4 text-[13px] font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)] sm:h-11 sm:px-5 sm:text-sm">
                {t("search.browseParts")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
