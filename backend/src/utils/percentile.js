/**
 * Percentile / price-stats helpers
 * ────────────────────────────────
 * Used by the Price Guide to summarise a set of listing prices robustly.
 * We rely on median + interquartile range (p25–p75) rather than the average,
 * so a single mispriced or typo'd listing can't distort the "typical" price.
 */

// Linear-interpolation percentile over an ascending-sorted array.
function percentile(sortedAsc, p) {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (n === 1) return sortedAsc[0];

  const idx = (p / 100) * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];

  const frac = idx - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

// Summarise a list of prices. Input order doesn't matter.
function priceStats(prices = []) {
  const sorted = prices
    .filter((p) => typeof p === "number" && Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b);

  const count = sorted.length;
  if (count === 0) {
    return { count: 0, min: 0, max: 0, median: 0, p25: 0, p75: 0, avg: 0 };
  }

  const sum = sorted.reduce((s, n) => s + n, 0);
  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    median: Math.round(percentile(sorted, 50)),
    p25: Math.round(percentile(sorted, 25)),
    p75: Math.round(percentile(sorted, 75)),
    avg: Math.round(sum / count),
  };
}

module.exports = { percentile, priceStats };
