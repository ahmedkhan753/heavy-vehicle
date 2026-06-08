import Link from "next/link";
import { Suspense } from "react";
import VehicleCard from "@/components/vehicles/VehicleCard";
import VehicleFilters from "@/components/vehicles/VehicleFilters";
import { API_BASE_URL, buildQuery } from "@/lib/api";
import { getT } from "@/lib/i18n-server";

export const revalidate = 60;

async function getVehicles(searchParams) {
  const query = buildQuery({ ...(await searchParams), limit: 12 });
  try {
    const response = await fetch(`${API_BASE_URL}/vehicles${query}`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error("Failed to fetch vehicles");
    return response.json();
  } catch {
    return {
      success: false,
      data: [],
      pagination: { total: 0, page: 1, pages: 0, hasNext: false, hasPrev: false },
    };
  }
}

export default async function VehiclesPage({ searchParams }) {
  const result = await getVehicles(searchParams);
  const vehicles = result.data || [];
  const pagination = result.pagination || {};
  const t = await getT();

  return (
    <main className="hw-container py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.marketplace")}</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("veh.title")}</h1>
        </div>
        <Link
          href="/post-ad"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
        >
          {t("nav.postFreeAd")}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 text-[var(--hw-text-secondary)]">{t("veh.loadingFilters")}</div>}>
          <VehicleFilters />
        </Suspense>

        <section>
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--hw-text-secondary)]">
              <span className="font-black text-[var(--hw-text-primary)]">{pagination.total || vehicles.length}</span> {t("veh.listingsFound")}
            </p>
          </div>

          {vehicles.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle._id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
              <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("veh.noneTitle")}</h2>
              <p className="mt-2 text-[var(--hw-text-secondary)]">
                {t("veh.noneBody")}
              </p>
              <Link
                href="/post-ad"
                className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]"
              >
                {t("veh.createFirst")}
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
