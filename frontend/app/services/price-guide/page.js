import Link from "next/link";
import { SERVER_API_BASE_URL, buildQuery } from "@/lib/api";
import { VEHICLE_TYPES, VEHICLE_MAKES, CITIES, CONDITIONS, typeLabel, makeLabel, cityLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { getT, getLang } from "@/lib/i18n-server";

export const revalidate = 3600;

export const metadata = {
  title: "Price Guide",
  description: "Typical market prices for trucks, tankers, and machinery in Pakistan, based on real HeavyWheels listings.",
};

async function getGuide(params) {
  try {
    const query = buildQuery({
      make: params.make,
      condition: params.condition,
      city: params.city,
    });
    const res = await fetch(`${SERVER_API_BASE_URL}/meta/price-guide${query}`, { next: { revalidate: 3600 } });
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
  const t = await getT();
  const lang = await getLang();

  // Index stats by type so we can render every vehicle type — showing real
  // numbers where we have enough data and an honest fallback where we don't.
  const byType = new Map(rows.map((r) => [r.type, r]));
  const hasAnyData = rows.length > 0;

  // Build a query string that preserves active filters for the "View listings" links.
  const filterQs = buildQuery({ make: params.make, condition: params.condition, city: params.city });

  return (
    <main className="hw-container py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">{t("services.toolsEyebrow")}</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">{t("services.priceGuideTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--hw-text-muted)]">{t("guide.subtitle")}</p>

        {/* ── FILTERS (server form, GET) ───────────────────────── */}
        <form className="mt-6 grid gap-3 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Select name="make" label={t("filter.make")} value={params.make} all={t("filter.allMakes")}
            options={VEHICLE_MAKES.map((m) => ({ value: m, label: makeLabel(m, lang) }))} />
          <Select name="condition" label={t("filter.condition")} value={params.condition} all={t("filter.anyCondition")}
            options={CONDITIONS} />
          <Select name="city" label={t("filter.city")} value={params.city} all={t("filter.allCities")}
            options={CITIES.map((c) => ({ value: c, label: cityLabel(c, lang) }))} />
          <div className="flex items-end gap-2">
            <button className="h-11 rounded-lg bg-[var(--hw-orange)] px-5 text-sm font-black text-[var(--hw-text-inverse)] hover:bg-[var(--hw-amber)]">
              {t("guide.apply")}
            </button>
            <Link href="/services/price-guide" className="flex h-11 items-center rounded-lg border border-[var(--hw-border-default)] px-4 text-sm font-bold text-[var(--hw-text-secondary)] hover:border-[var(--hw-orange)]">
              {t("guide.reset")}
            </Link>
          </div>
        </form>

        {/* ── TABLE ────────────────────────────────────────────── */}
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--hw-border-default)]">
          <div className="hidden grid-cols-[1.4fr_1fr_1.4fr_0.9fr_auto] gap-4 bg-[var(--hw-bg-deep)] px-5 py-3 text-xs font-black uppercase tracking-wide text-[var(--hw-text-muted)] sm:grid">
            <span>{t("guide.colType")}</span>
            <span>{t("guide.colTypical")}</span>
            <span>{t("guide.colRange")}</span>
            <span>{t("guide.colSamples")}</span>
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
                  <span className="font-bold text-[var(--hw-text-primary)]">{typeLabel(vt, lang)}</span>

                  {stat ? (
                    <>
                      <span className="font-black text-[var(--hw-orange)]">{formatPrice(stat.median)}</span>
                      <span className="text-sm text-[var(--hw-text-secondary)]">
                        {formatPrice(stat.p25)} – {formatPrice(stat.p75)}
                      </span>
                      <span className="text-xs text-[var(--hw-text-muted)]">{stat.count} {t("guide.listingsWord")}</span>
                      <Link href={viewHref} className="text-sm font-bold text-[var(--hw-orange)] hover:underline">
                        {t("guide.view")} →
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-[var(--hw-text-muted)] sm:col-span-3">{t("guide.notEnough")}</span>
                      <Link href={viewHref} className="text-sm font-bold text-[var(--hw-text-secondary)] hover:text-[var(--hw-orange)]">
                        {t("guide.browse")} →
                      </Link>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {!hasAnyData ? (
          <p className="mt-4 text-sm text-[var(--hw-text-muted)]">{t("guide.noData")}</p>
        ) : null}

        <p className="mt-6 text-xs leading-5 text-[var(--hw-text-muted)]">{t("guide.footnote")}</p>
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
