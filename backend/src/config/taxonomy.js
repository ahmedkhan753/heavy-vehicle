/**
 * Vehicle Taxonomy — backend source of truth
 * ──────────────────────────────────────────
 * One place for the listing `type` slugs and the category → types grouping,
 * so the model enum, the route validator, and the ?category= filter can never
 * drift apart.
 *
 * The frontend keeps the matching display labels + Urdu in
 * frontend/lib/constants.js (VEHICLE_CATEGORIES / VEHICLE_TYPES). Only the
 * slugs are duplicated there — keep the two in sync when adding a type.
 *
 * Consumed by:
 *   - models/Vehicle.js        → the `type` enum
 *   - routes/vehicle.routes.js → create/update body("type").isIn(...)
 *   - utils/apiFeatures.js     → ?category= → { type: { $in: [...] } }
 */

// Category → ordered type slugs. The order here is the browse/display order.
// Existing slugs are preserved (never rename a live slug without a migration).
const CATEGORY_TYPES = {
  trucks: [
    "prime-mover", "cargo-truck", "flatbed-truck", "dumper", "tipper",
    "mixer", "tanker-truck", "oil-tanker", "garbage-compactor", "reefer",
    "recovery-truck", "car-carrier", "box-truck", "crane-truck", "fire-truck",
    "water-bowser", "vacuum-truck", "container-truck", "mini-truck",
  ],
  buses: ["bus", "coaster", "mini-bus"],
  construction: [
    "excavator", "loader", "backhoe-loader", "bulldozer", "grader",
    "road-roller", "crane", "forklift", "telehandler",
  ],
  trailers: [
    "flatbed", "low-bed", "container-trailer", "skeletal-trailer",
    "fuel-tanker", "water-tanker", "chemical-tanker", "bitumen-tanker",
    "cement-bulker", "dump-trailer", "curtain-side-trailer",
    "refrigerated-trailer", "livestock-trailer", "car-carrier-trailer",
    "logging-trailer",
  ],
  agriculture: [
    "tractor", "combine-harvester", "wheat-harvester", "rice-harvester",
    "laser-land-leveler", "seed-drill", "rotavator", "cultivator",
    "plough", "trailer-trolley", "baler", "sprayer",
  ],
  // Catch-all so a seller can always post even if their exact type isn't listed.
  other: ["other"],
};

const CATEGORIES = Object.keys(CATEGORY_TYPES);

// Flat list of every valid type slug (what the enum / validators check against).
const VEHICLE_TYPE_SLUGS = Object.values(CATEGORY_TYPES).flat();

module.exports = { CATEGORY_TYPES, CATEGORIES, VEHICLE_TYPE_SLUGS };
