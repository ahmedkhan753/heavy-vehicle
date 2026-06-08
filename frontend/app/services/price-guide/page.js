import Link from "next/link";
import { API_BASE_URL, buildQuery } from "@/lib/api";
import { VEHICLE_TYPES, VEHICLE_MAKES, CITIES, CONDITIONS } from "@/lib/constants";
import { formatPrice, titleCase } from "@/lib/format";

export const revalidate = 3600;

export const metadata = {
  title: "Price Guide — HeavyWheels",
  description: "Typical market prices for trucks, tankers, and machinery in Pakistan, based on real HeavyWheels listings.",
};

async function getGuide(params) {
  try {
    const query = buildQuery({
      make: params.make,
      condition: params.condition,
      city: params.city,
    });
    const res = await fetch(`${API_BASE_URL}/meta/price-guide${query}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function PriceGuidePage({ searchParams }) {
  const params = (await searchParams) || {};
  const rows = await getGuide(params);

  // Index stats by type so we can render every vehicle type — showing real
  // numbers where we have enough data and an honest fallback where we don't.
  const byType = new Map(rows.map((r) => [r.type, r]));
  const hasAnyData = rows.length > 0;

  // Build a query string that preserves active filters for the "View listings" links.
  const filterQs = buildQuery({ make: params.make, condition: params.condition, city: params.city });

  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Tools</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">Price Guide</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">
          Typical prices for each vehicle type, based on active HeavyWheels listings.
        </p>

        {/* ── FILTERS (server form, GET) ───────────────────────── */}
        <form className="mt-6 grid gap-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Select name="make" label="Make" value={params.make} all="All makes"
            options={VEHICLE_MAKES.map((m) => ({ value: m, label: titleCase(m) }))} />
          <Select name="condition" label="Condition" value={params.condition} all="Any condition"
            options={CONDITIONS} />
          <Select name="city" label="City" value={params.city} all="All cities"
            options={CITIES.map((c) => ({ value: c, label: titleCase(c) }))} />
          <div className="flex items-end gap-2">
            <button className="h-11 rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)]">
              Apply
            </button>
            <Link href="/services/price-guide" className="flex h-11 items-center rounded-lg border border-[var(--hw-border-default)] px-4 text-sm font-bold text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)]">
              Reset
            </Link>
          </div>
        </form>

        {/* ── TABLE ────────────────────────────────────────────── */}
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--hw-border-default)]">
          <div className="hidden grid-cols-[1.4fr_1fr_1.4fr_0.9fr_auto] gap-4 bg-[var(--hw-bg-deep)] px-5 py-3 text-xs font-black uppercase tracking-wide text-[var(--hw-text-muted)] sm:grid">
            <span>Vehicle type</span>
            <span>Typical price</span>
            <span>Typical range</span>
            <span>Samples</span>
            <span />
          </div>

          <div className="divide-y divide-[var(--hw-border-subtle)]">
            {VEHICLE_TYPES.map((vt) => {
              const stat = byType.get(vt.value);
              const viewHref = `/vehicles?type=${vt.value}${filterQs ? `&${filterQs.slice(1)}` : ""}`;

              return (
                <div
                  key={vt.value}
                  className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1.4fr_0.9fr_auto] sm:items-center sm:gap-4"
                >
                  <span className="font-bold text-[var(--hw-text-primary)]">{vt.label}</span>

                  {stat ? (
                    <>
                      <span className="font-black text-[var(--hw-orange)]">{formatPrice(stat.median)}</span>
                      <span className="text-sm text-[var(--hw-text-secondary)]">
                        {formatPrice(stat.p25)} – {formatPrice(stat.p75)}
                      </span>
                      <span className="text-xs text-[var(--hw-text-muted)]">{stat.count} listings</span>
                      <Link href={viewHref} className="text-sm font-bold text-[var(--hw-orange)] hover:underline">
                        View →
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-[var(--hw-text-muted)] sm:col-span-3">Not enough listings yet</span>
                      <Link href={viewHref} className="text-sm font-bold text-[var(--hw-text-secondary)] hover:text-[var(--hw-orange)]">
                        Browse →
                      </Link>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!hasAnyData ? (
          <p className="mt-4 text-sm text-[var(--hw-text-muted)]">
            We don&apos;t have enough listings yet to calculate typical prices. As more vehicles are
            posted, real price ranges will appear here automatically.
          </p>
        ) : null}

        <p className="mt-6 text-xs leading-5 text-[var(--hw-text-muted)]">
          Prices are estimates based on active listings on HeavyWheels and are not an official
          valuation. The typical range shows the middle of the market (25th–75th percentile).
        </p>
      </div>
    </main>
  );
}

function Select({ name, label, value, all, options }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-[var(--hw-text-muted)]">{label}</span>
      <select
        name={name}
        defaultValue={value || ""}
        className="h-11 rounded-lg border border-[var(--hw-border-default)] bg-[var(--hw-bg-input)] px-3 text-sm font-semibold text-[var(--hw-text-primary)] outline-none focus:border-[var(--hw-orange)]"
      >
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
