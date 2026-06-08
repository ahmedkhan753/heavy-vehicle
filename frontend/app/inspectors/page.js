import Link from "next/link";
import { API_BASE_URL, buildQuery } from "@/lib/api";
import { CITIES } from "@/lib/constants";
import { formatPrice, titleCase } from "@/lib/format";

export const revalidate = 60;

export const metadata = {
  title: "Vehicle Inspectors — HeavyWheels",
  description: "Find verified heavy-vehicle inspectors across Pakistan. Compare fees and book an inspection before you buy.",
};

async function getInspectors(params) {
  try {
    const query = buildQuery({ city: params.city, limit: 24 });
    const res = await fetch(`${API_BASE_URL}/inspectors${query}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function InspectorsPage({ searchParams }) {
  const params = (await searchParams) || {};
  const inspectors = await getInspectors(params);

  return (
    <main className="hw-container py-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Inspection</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Vehicle Inspectors</h1>
          <p className="mt-2 text-sm text-[var(--hw-text-muted)]">Verified inspectors you can hire before buying.</p>
        </div>
        <Link href="/inspectors/register" className="inline-flex h-11 w-fit items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">
          Become an inspector
        </Link>
      </div>

      {/* Filter */}
      <form className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-[var(--hw-text-muted)]">City</span>
          <select name="city" defaultValue={params.city || ""} className="h-11 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm font-semibold text-[var(--hw-text-primary)]">
            <option value="">All cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
          </select>
        </label>
        <button className="h-11 rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Apply</button>
        <Link href="/inspectors" className="flex h-11 items-center rounded-lg border border-[var(--hw-border-default)] px-4 text-sm font-bold text-[var(--hw-text-secondary)]">Reset</Link>
      </form>

      {inspectors.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {inspectors.map((ins) => (
            <Link key={ins._id} href={`/inspectors/${ins._id}`} className="rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5 transition hover:-translate-y-1 hover:border-[var(--hw-orange)]">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-[var(--hw-text-primary)]">{ins.displayName}</h2>
                {ins.isVerified ? <span className="rounded-full bg-[var(--hw-green)] px-2 py-0.5 text-[10px] font-black uppercase text-white">Verified</span> : null}
              </div>
              <p className="mt-1 text-sm text-[var(--hw-text-muted)]">{titleCase(ins.city)} · {ins.type === "company" ? "Company" : "Individual"}</p>
              <p className="mt-3 text-lg font-black text-[var(--hw-orange)]">{formatPrice(ins.inspectionFee)}</p>
              {ins.feeNote ? <p className="text-xs text-[var(--hw-text-muted)]">{ins.feeNote}</p> : null}
              {ins.specializations?.length ? (
                <p className="mt-3 text-xs text-[var(--hw-text-secondary)]">{ins.specializations.slice(0, 4).map((s) => titleCase(s)).join(" · ")}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-10 text-center">
          <h2 className="text-xl font-black text-[var(--hw-text-primary)]">No inspectors listed yet</h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--hw-text-secondary)]">
            We&apos;re onboarding inspectors now. Are you an inspector or inspection company? Be the first to join.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/inspectors/register" className="inline-flex h-11 items-center rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)]">Become an inspector</Link>
            <Link href="/services/inspection" className="inline-flex h-11 items-center rounded-lg border border-[var(--hw-border-strong)] px-5 text-sm font-bold text-[var(--hw-text-primary)] hover:border-[var(--hw-orange)]">Partner with us</Link>
          </div>
        </div>
      )}
    </main>
  );
}
