import { formatPrice } from "@/lib/format";

/**
 * PriceFairnessBadge
 * ──────────────────
 * Compares a listing's price against the typical price for its type
 * (from the Price Guide estimate endpoint) and labels it as fair, below,
 * or above the market. Renders nothing unless there's enough data
 * (the API omits `median` below the confidence threshold).
 *
 * `t` is the server-side translator passed from the page.
 */
export default function PriceFairnessBadge({ price, estimate, t }) {
  const numericPrice = Number(price);
  if (!estimate || !estimate.median || estimate.count < 5 || !(numericPrice > 0)) {
    return null;
  }

  const { median, p25, p75 } = estimate;

  let label;
  let color;
  let icon;
  if (numericPrice < p25) {
    label = t("veh.priceBelow");
    color = "var(--hw-green)";
    icon = "▼";
  } else if (numericPrice > p75) {
    label = t("veh.priceAbove");
    color = "var(--hw-amber, #f59e0b)";
    icon = "▲";
  } else {
    label = t("veh.priceFair");
    color = "var(--hw-green)";
    icon = "✓";
  }

  const pct = Math.round(((numericPrice - median) / median) * 100);
  const pctLabel = numericPrice >= p25 && numericPrice <= p75 ? "" : ` (${pct > 0 ? "+" : ""}${pct}%)`;

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        style={{ color, borderColor: color }}
        className="inline-flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold"
      >
        <span aria-hidden="true">{icon}</span>
        {label}{pctLabel}
      </span>
      <span className="text-xs text-[var(--hw-text-muted)]">
        {t("veh.typicalPrice")}: {formatPrice(median)} · {formatPrice(p25)}–{formatPrice(p75)}
      </span>
    </div>
  );
}
