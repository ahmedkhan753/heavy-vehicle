import Link from "next/link";
import Image from "next/image";
import { API_BASE_URL, buildQuery } from "@/lib/api";
import { titleCase } from "@/lib/format";
import { getT } from "@/lib/i18n-server";

export const revalidate = 60;

async function getDealers(searchParams) {
  const query = buildQuery(await searchParams);
  try {
    const response = await fetch(`${API_BASE_URL}/dealers${query}`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error("Failed");
    return response.json();
  } catch {
    return { data: [], pagination: { total: 0 } };
  }
}

export default async function DealersPage({ searchParams }) {
  const result = await getDealers(searchParams);
  const dealers = result.data || [];
  const t = await getT();

  return (
    <main className="hw-container py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("page.dealers")}</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("dealer.title")}</h1>
        </div>
        <Link href="/dealers/register" className="inline-flex h-11 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
          {t("dealer.become")}
        </Link>
      </div>

      {dealers.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {dealers.map((dealer) => (
            <Link key={dealer._id} href={`/dealers/${dealer._id}`} className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 hover:border-[var(--hw-orange)]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-[var(--hw-orange)] text-xl font-black text-[var(--hw-text-inverse)]">
                  {dealer.logo?.url ? <Image src={dealer.logo.url} alt="" width={56} height={56} className="h-full w-full object-cover" /> : dealer.businessName?.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{dealer.businessName}</h2>
                    {dealer.isVerified ? <span className="rounded-md bg-[var(--hw-green)] px-2 py-1 text-xs font-black text-[var(--hw-text-inverse)]">{t("dealer.verified")}</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--hw-text-muted)]">{titleCase(dealer.city)} | {dealer.activeListings ?? 0} {t("dealer.listingsWord")}</p>
                  <p className="mt-3 text-sm text-[var(--hw-text-secondary)]">{dealer.tagline || dealer.description || t("dealer.fallbackTag")}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">{t("dealer.noneTitle")}</h2>
          <p className="mt-2 text-[var(--hw-text-secondary)]">{t("dealer.noneBody")}</p>
          <Link href="/dealers/register" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">{t("dealer.register")}</Link>
        </div>
      )}
    </main>
  );
}
