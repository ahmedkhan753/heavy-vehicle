import Link from "next/link";
import Image from "next/image";
import VehicleCard from "@/components/vehicles/VehicleCard";
import PartCard from "@/components/parts/PartCard";
import { SERVER_API_BASE_URL } from "@/lib/api";
import { cityLabel } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";
import { Icon } from "@/components/listing/ListingBits";

export const revalidate = 60;

async function getSeller(id) {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/users/${id}/public`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch {
    return { data: null };
  }
}

export default async function SellerProfilePage({ params }) {
  const { id } = await params;
  const result = await getSeller(id);
  const data = result.data;
  const t = await getT();
  const lang = await getLang();

  if (!data?.user) {
    return (
      <main className="hw-container py-16">
        <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-8 text-center sm:p-10">
          <h1 className="text-xl font-black text-[var(--hw-text-primary)] sm:text-2xl">{t("seller.notFound")}</h1>
          <Link href="/vehicles" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-[13px] font-black text-[var(--hw-text-inverse)] sm:text-sm">
            {t("veh.backToVehicles")}
          </Link>
        </div>
      </main>
    );
  }

  const { user, dealer, vehicles = [], parts = [], totalActive } = data;
  const initial = (user.name || "?").trim().charAt(0).toUpperCase();
  const joined = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <main className="hw-container py-4 sm:py-8 lg:py-10">
      <section className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--hw-orange)] text-xl font-black text-[var(--hw-text-inverse)] sm:h-20 sm:w-20 sm:text-2xl">
            {user.avatar?.url
              ? <Image src={user.avatar.url} alt="" width={80} height={80} className="h-full w-full object-cover" />
              : initial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="truncate text-lg font-black text-[var(--hw-text-primary)] sm:text-2xl">{user.name}</h1>
              {user.isVerifiedSeller ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--hw-green)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--hw-text-inverse)]">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                  {t("listing.verifiedSeller")}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--hw-text-muted)] sm:text-sm">
              {titleCase(user.role || "user")}
              {user.city ? ` · ${cityLabel(user.city, lang)}` : ""}
              {joined ? ` · ${t("seller.memberSince")} ${joined}` : ""}
            </p>
          </div>
        </div>

        {user.bio ? (
          <p className="mt-3 text-[13px] leading-6 text-[var(--hw-text-secondary)] sm:text-sm">{user.bio}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hw-border-subtle)] bg-[var(--hw-bg-deep)] px-2 py-1 text-[11px] font-bold text-[var(--hw-text-secondary)] sm:px-2.5 sm:text-xs">
            <Icon name="box" className="h-3.5 w-3.5 shrink-0 text-[var(--hw-orange)]" />
            {totalActive} {t("dealerp.activeAds")}
          </span>
          {dealer ? (
            <Link
              href={`/dealers/${dealer._id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hw-orange)] bg-[var(--hw-soft-panel)] px-2 py-1 text-[11px] font-bold text-[var(--hw-orange)] sm:px-2.5 sm:text-xs"
            >
              <Icon name="badge" className="h-3.5 w-3.5 shrink-0" />
              {dealer.businessName}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-3.5 sm:mt-5 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-[var(--hw-text-primary)] sm:text-xl">{t("seller.listings")}</h2>
          <span className="shrink-0 text-[11px] font-bold text-[var(--hw-text-muted)] sm:text-sm">{totalActive}</span>
        </div>

        {totalActive ? (
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-4 lg:grid-cols-3">
            {vehicles.map((v) => <VehicleCard key={`v-${v._id}`} vehicle={v} />)}
            {parts.map((p) => <PartCard key={`p-${p._id}`} part={p} />)}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-[var(--hw-border-default)] p-5 text-center text-[13px] text-[var(--hw-text-secondary)] sm:mt-5 sm:p-6 sm:text-base">
            {t("seller.noListings")}
          </p>
        )}
      </section>
    </main>
  );
}
