import Link from "next/link";
import Image from "next/image";
import VehicleCard from "@/components/vehicles/VehicleCard";
import PlanBadge from "@/components/marketing/PlanBadge";
import { planBorderStyle } from "@/components/marketing/PlanAdornments";
import { getPlanMeta, isPaidPlan } from "@/lib/plans";
import { API_BASE_URL } from "@/lib/api";
import { titleCase } from "@/lib/format";

export const revalidate = 60;

async function getDealer(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/dealers/${id}`, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error("Failed");
    return response.json();
  } catch {
    return { data: null };
  }
}

export default async function DealerProfilePage({ params }) {
  const { id } = await params;
  const result = await getDealer(id);
  const dealer = result.data?.dealer;
  const listings = result.data?.listings || [];
  const plan = dealer?.userId?.plan;
  const planMeta = getPlanMeta(plan);

  if (!dealer) {
    return (
      <main className="hw-container py-16">
        <div className="rounded-lg border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h1 className="text-2xl font-black text-[var(--hw-text-primary)]">Dealer not found</h1>
          <Link href="/dealers" className="mt-5 inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Back to Dealers</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="hw-container py-10">
      <section style={planBorderStyle(plan)} className="overflow-hidden rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)]">
        <div
          className="relative h-40 bg-[var(--hw-bg-elevated)]"
          style={isPaidPlan(plan) ? { background: `linear-gradient(120deg, color-mix(in srgb, ${planMeta.color} 35%, var(--hw-bg-elevated)), var(--hw-bg-elevated))` } : undefined}
        >
          {dealer.coverImage?.url ? <Image src={dealer.coverImage.url} alt="" fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" /> : null}
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg text-2xl font-black text-[var(--hw-text-inverse)]"
                style={{ background: isPaidPlan(plan) ? planMeta.color : "var(--hw-orange)" }}
              >
                {dealer.logo?.url ? <Image src={dealer.logo.url} alt="" width={64} height={64} className="h-full w-full object-cover" /> : dealer.businessName?.slice(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{dealer.isVerified ? "Verified dealer" : "Dealer"}</p>
                  <PlanBadge plan={plan} size="sm" hideFree />
                </div>
                <h1 className="mt-1 text-3xl font-black text-[var(--hw-text-primary)]">{dealer.businessName}</h1>
                <p className="mt-1 text-sm text-[var(--hw-text-muted)]">{titleCase(dealer.city)} | {dealer.totalListings || listings.length} active ads</p>
              </div>
            </div>
            <div className="flex gap-3">
              {dealer.phone ? <a href={`tel:${dealer.phone}`} className="inline-flex h-11 items-center rounded-lg bg-[var(--hw-green)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Call</a> : null}
              {dealer.whatsapp ? <a href={`https://wa.me/${dealer.whatsapp}`} className="inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)]">WhatsApp</a> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Dealer inventory</h2>
          {listings.length ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {listings.map((item) => <VehicleCard key={item._id} vehicle={item} />)}
            </div>
          ) : (
            <p className="mt-5 rounded-lg border border-dashed border-[var(--hw-border-default)] p-6 text-[var(--hw-text-secondary)]">No active listings yet.</p>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
          {dealer.warranty?.status === "approved" ? (
            <div className="mb-5 rounded-lg border border-[var(--hw-green)] bg-[var(--hw-soft-panel)] p-4">
              <p className="flex items-center gap-2 text-sm font-black text-[var(--hw-green)]">🛡️ Verified Warranty</p>
              {dealer.warranty.terms ? (
                <p className="mt-2 whitespace-pre-line text-sm text-[var(--hw-text-secondary)]">{dealer.warranty.terms}</p>
              ) : null}
              <p className="mt-2 text-xs text-[var(--hw-text-muted)]">Warranty is provided directly by this dealer. HeavyWheels is not a party to it.</p>
            </div>
          ) : null}
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">Business details</h2>
          <div className="mt-4 grid gap-3 text-sm text-[var(--hw-text-secondary)]">
            <p>{dealer.description || dealer.tagline || "Professional heavy vehicle dealer."}</p>
            <p>Address: {dealer.address || "Not listed"}</p>
            <p>Working hours: {dealer.workingHours || "Not listed"}</p>
            <p>Brands: {(dealer.brands || []).map(titleCase).join(", ") || "Multiple brands"}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
