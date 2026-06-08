/**
 * Part Taxonomy — backend source of truth
 * ───────────────────────────────────────
 * One place for the spare-part `category`, `partType`, and `warranty` enums so
 * the Part model and the route validator can't drift apart.
 *
 * The frontend keeps the matching labels + Urdu and the per-category
 * subcategory lists in frontend/lib/parts.js. `subcategory` is stored as a free
 * string (like `make`/`city`), so it has no backend enum — the frontend
 * controlled list keeps it clean.
 *
 * Consumed by:
 *   - models/Part.js        → category / partType / warranty enums
 *   - routes/part.routes.js → create body(...).isIn(...)
 */

// System-based categories shown in the menu (frontend/lib/parts.js mirrors
// these with labels). Order is the browse/display order.
const PART_CATEGORY_SLUGS = [
  "engine", "transmission", "suspension", "brakes", "steering",
  "electrical", "cooling", "body", "tyres", "trailer",
  "hydraulic", "cabin", "filters", "other",
  // Legacy values kept valid so older listings still save; not in the menu.
  "tanker", "machinery",
];

// OEM vs aftermarket sourcing. "" = unspecified.
const PART_TYPE_VALUES = ["", "oem", "genuine", "aftermarket"];

// Warranty buckets. "" = unspecified, "none" = sold as-is. Others are durations.
const WARRANTY_VALUES = ["", "none", "7-days", "1-month", "3-months", "6-months", "1-year"];

module.exports = { PART_CATEGORY_SLUGS, PART_TYPE_VALUES, WARRANTY_VALUES };
