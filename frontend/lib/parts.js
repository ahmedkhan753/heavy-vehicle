/**
 * Spare-parts taxonomy (system-based).
 * ────────────────────────────────────
 * `PART_CATEGORIES` are the menu/system groups; `PART_SUBCATEGORIES` lists the
 * specific parts under each. The category slugs mirror the backend enum in
 * backend/src/config/partTaxonomy.js — keep the two in sync. Subcategories are
 * stored as a free string on the listing, so only the frontend needs the list.
 *
 * Subcategory labels are English-only (they fall back to titleCase elsewhere);
 * category labels carry Urdu for the localized menu.
 */

import { titleCase } from "@/lib/format";

export const PART_CATEGORIES = [
  { value: "engine", label: "Engine Parts", urdu: "انجن پارٹس" },
  { value: "transmission", label: "Transmission Parts", urdu: "ٹرانسمیشن پارٹس" },
  { value: "suspension", label: "Suspension Parts", urdu: "سسپینشن پارٹس" },
  { value: "brakes", label: "Brake Parts", urdu: "بریک پارٹس" },
  { value: "steering", label: "Steering Parts", urdu: "اسٹیئرنگ پارٹس" },
  { value: "electrical", label: "Electrical Parts", urdu: "الیکٹریکل پارٹس" },
  { value: "cooling", label: "Cooling Parts", urdu: "کولنگ پارٹس" },
  { value: "body", label: "Body Parts", urdu: "باڈی پارٹس" },
  { value: "tyres", label: "Tyres & Wheels", urdu: "ٹائر اور وہیل" },
  { value: "trailer", label: "Trailer Parts", urdu: "ٹریلر پارٹس" },
  { value: "hydraulic", label: "Hydraulic Parts", urdu: "ہائیڈرولک پارٹس" },
  { value: "cabin", label: "Cabin & Interior", urdu: "کیبن اور انٹیریئر" },
  { value: "filters", label: "Filters & Consumables", urdu: "فلٹرز اور کنزیومیبلز" },
  { value: "other", label: "Other Parts", urdu: "دیگر پارٹس" },
];

// Specific parts under each category. Values are the slugs stored on listings.
const RAW_SUBCATEGORIES = {
  engine: [
    { value: "engine-assembly", label: "Engine Assembly / Long Block" },
    { value: "cylinder-head", label: "Cylinder Head" },
    { value: "cylinder-block", label: "Cylinder Block" },
    { value: "pistons", label: "Pistons" },
    { value: "piston-rings", label: "Piston Rings" },
    { value: "connecting-rods", label: "Connecting Rods" },
    { value: "crankshaft", label: "Crankshaft" },
    { value: "camshaft", label: "Camshaft" },
    { value: "valves", label: "Valves" },
    { value: "valve-cover", label: "Valve Cover" },
    { value: "head-gasket", label: "Head Gasket" },
    { value: "oil-pump", label: "Oil Pump" },
    { value: "turbocharger", label: "Turbocharger" },
    { value: "intercooler", label: "Intercooler" },
    { value: "fan-belt", label: "Fan / Serpentine Belt" },
    { value: "fuel-tank", label: "Fuel Tank" },
    { value: "fuel-pump", label: "Fuel Pump" },
    { value: "fuel-injector", label: "Fuel Injector" },
    { value: "fuel-lines", label: "Fuel Lines" },
    { value: "primer-pump", label: "Primer Pump" },
    { value: "water-separator", label: "Diesel Water Separator" },
    { value: "intake-manifold", label: "Intake Manifold" },
    { value: "exhaust-manifold", label: "Exhaust Manifold" },
    { value: "exhaust-pipe", label: "Exhaust Pipe" },
    { value: "muffler", label: "Muffler / Silencer" },
    { value: "egr-valve", label: "EGR Valve" },
    { value: "air-compressor", label: "Air Compressor" },
    { value: "air-dryer", label: "Air Dryer" },
    { value: "exhaust-brake", label: "Exhaust Brake" },
  ],
  transmission: [
    { value: "gearbox", label: "Gearbox / Transmission" },
    { value: "clutch-plate", label: "Clutch Plate" },
    { value: "pressure-plate", label: "Pressure Plate" },
    { value: "release-bearing", label: "Clutch Release Bearing" },
    { value: "flywheel", label: "Flywheel" },
    { value: "propeller-shaft", label: "Propeller Shaft" },
    { value: "universal-joint", label: "Universal Joint" },
    { value: "differential", label: "Differential" },
    { value: "axle-shaft", label: "Axle Shaft" },
    { value: "rear-axle", label: "Rear Axle Assembly" },
    { value: "transfer-case", label: "Transfer Case" },
    { value: "drive-shaft", label: "Drive Shaft" },
    { value: "torque-converter", label: "Torque Converter" },
  ],
  suspension: [
    { value: "leaf-springs", label: "Leaf Springs" },
    { value: "coil-springs", label: "Coil Springs" },
    { value: "shock-absorbers", label: "Shock Absorbers" },
    { value: "air-bags", label: "Air Suspension Bags" },
    { value: "spring-shackle", label: "Spring Shackle" },
    { value: "u-bolts", label: "U-Bolts" },
    { value: "bushings", label: "Suspension Bushings" },
    { value: "control-arms", label: "Control Arms" },
    { value: "stabilizer-bar", label: "Stabilizer Bar" },
    { value: "equalizer-beam", label: "Equalizer Beam" },
  ],
  brakes: [
    { value: "brake-pads", label: "Brake Pads" },
    { value: "brake-shoes", label: "Brake Shoes" },
    { value: "brake-discs", label: "Brake Discs" },
    { value: "brake-drums", label: "Brake Drums" },
    { value: "brake-chamber", label: "Brake Chamber" },
    { value: "brake-booster", label: "Brake Booster" },
    { value: "brake-valve", label: "Air Brake Valve" },
    { value: "slack-adjuster", label: "Slack Adjuster" },
    { value: "brake-lines", label: "Brake Lines" },
    { value: "abs-sensor", label: "ABS Sensor" },
    { value: "master-cylinder", label: "Master Cylinder" },
    { value: "wheel-cylinder", label: "Wheel Cylinder" },
  ],
  steering: [
    { value: "steering-box", label: "Steering Box" },
    { value: "steering-rack", label: "Steering Rack" },
    { value: "power-steering-pump", label: "Power Steering Pump" },
    { value: "tie-rod", label: "Tie Rod" },
    { value: "drag-link", label: "Drag Link" },
    { value: "steering-column", label: "Steering Column" },
    { value: "steering-knuckle", label: "Steering Knuckle" },
    { value: "steering-arm", label: "Steering Arm" },
    { value: "ball-joints", label: "Ball Joints" },
  ],
  electrical: [
    { value: "battery", label: "Battery" },
    { value: "alternator", label: "Alternator" },
    { value: "starter-motor", label: "Starter Motor" },
    { value: "wiring-harness", label: "Wiring Harness" },
    { value: "fuse-box", label: "Fuse Box" },
    { value: "relay", label: "Relay" },
    { value: "ecu", label: "ECU / Control Module" },
    { value: "sensors", label: "Sensors" },
    { value: "headlights", label: "Headlights" },
    { value: "tail-lights", label: "Tail Lights" },
    { value: "indicators", label: "Indicator Lights" },
    { value: "dashboard-cluster", label: "Dashboard Cluster" },
    { value: "horn", label: "Horn" },
    { value: "switches", label: "Switches" },
    { value: "wiper-motor", label: "Wiper Motor" },
    { value: "ignition-switch", label: "Ignition Switch" },
  ],
  cooling: [
    { value: "radiator", label: "Radiator" },
    { value: "radiator-fan", label: "Radiator Fan" },
    { value: "water-pump", label: "Water Pump" },
    { value: "coolant-tank", label: "Coolant Tank" },
    { value: "thermostat", label: "Thermostat" },
    { value: "cooling-hoses", label: "Hoses" },
    { value: "fan-clutch", label: "Fan Clutch" },
    { value: "oil-cooler", label: "Oil Cooler" },
  ],
  body: [
    { value: "cabin-shell", label: "Cabin / Cab" },
    { value: "doors", label: "Doors" },
    { value: "door-handles", label: "Door Handles" },
    { value: "mirrors", label: "Mirrors" },
    { value: "windshield", label: "Windshield" },
    { value: "side-glass", label: "Side Glass" },
    { value: "seats", label: "Seats" },
    { value: "dashboard", label: "Dashboard" },
    { value: "roof-panel", label: "Roof Panel" },
    { value: "mudguards", label: "Mudguards" },
    { value: "fender", label: "Fender" },
    { value: "bumper", label: "Bumper" },
    { value: "grille", label: "Grille" },
    { value: "step-board", label: "Step Board" },
    { value: "cabin-mounts", label: "Cabin Mounts" },
    { value: "tipper-body", label: "Tipper Body" },
    { value: "flatbed-body", label: "Flatbed Body" },
    { value: "tank-body", label: "Tank Body" },
    { value: "container-chassis", label: "Container Chassis" },
    { value: "mixer-drum", label: "Mixer Drum" },
    { value: "cargo-box", label: "Cargo Box" },
    { value: "side-panels", label: "Side Panels" },
    { value: "tailgate", label: "Rear Tailgate" },
    { value: "ladders", label: "Ladders" },
    { value: "load-hooks", label: "Load Hooks" },
  ],
  tyres: [
    { value: "tyres", label: "Tyres" },
    { value: "rims", label: "Rims" },
    { value: "wheel-hubs", label: "Wheel Hubs" },
    { value: "wheel-bearings", label: "Wheel Bearings" },
    { value: "wheel-nuts", label: "Wheel Nuts" },
    { value: "tubes", label: "Tubes" },
    { value: "valve-stems", label: "Valve Stems" },
    { value: "spare-wheel", label: "Spare Wheel" },
  ],
  trailer: [
    { value: "king-pin", label: "King Pin" },
    { value: "fifth-wheel", label: "Fifth Wheel Plate" },
    { value: "trailer-axle", label: "Trailer Axle" },
    { value: "trailer-brakes", label: "Trailer Brake System" },
    { value: "landing-gear", label: "Landing Gear" },
    { value: "coupling", label: "Coupling" },
    { value: "container-locks", label: "Container Locks" },
    { value: "trailer-lights", label: "Trailer Lights" },
    { value: "suspension-kit", label: "Suspension Kit" },
    { value: "air-hoses", label: "Air Hoses" },
    { value: "mud-flaps", label: "Mud Flaps" },
  ],
  hydraulic: [
    { value: "hydraulic-pump", label: "Hydraulic Pump" },
    { value: "hydraulic-cylinder", label: "Hydraulic Cylinder" },
    { value: "hydraulic-hose", label: "Hydraulic Hose" },
    { value: "control-valve", label: "Control Valve" },
    { value: "hydraulic-motor", label: "Hydraulic Motor" },
    { value: "reservoir-tank", label: "Reservoir Tank" },
    { value: "pto-pump", label: "PTO Pump" },
    { value: "hydraulic-fittings", label: "Hydraulic Fittings" },
  ],
  cabin: [
    { value: "ac-compressor", label: "AC Compressor" },
    { value: "ac-condenser", label: "AC Condenser" },
    { value: "heater-core", label: "Heater Core" },
    { value: "blower-motor", label: "Blower Motor" },
    { value: "seat-covers", label: "Seat Covers" },
    { value: "cabin-mat", label: "Cabin Mat" },
    { value: "dashboard-switches", label: "Dashboard Switches" },
    { value: "stereo", label: "Stereo" },
    { value: "hvac-controls", label: "HVAC Controls" },
  ],
  filters: [
    { value: "oil-filter", label: "Engine Oil Filter" },
    { value: "fuel-filter", label: "Fuel Filter" },
    { value: "air-filter", label: "Air Filter" },
    { value: "hydraulic-filter", label: "Hydraulic Filter" },
    { value: "cabin-filter", label: "Cabin Filter" },
    { value: "brake-lining", label: "Brake Lining" },
    { value: "grease", label: "Grease" },
    { value: "coolant", label: "Coolant" },
    { value: "belts", label: "Belts" },
    { value: "service-hoses", label: "Hoses" },
    { value: "gaskets", label: "Gaskets" },
    { value: "seals", label: "Seals" },
  ],
  other: [],
};

// Append a catch-all "Other" to every category that has a list, so a poster
// can still pick something when their exact part isn't listed. Stored as the
// free-string subcategory "other" — the category gives it context.
export const PART_SUBCATEGORIES = Object.fromEntries(
  Object.entries(RAW_SUBCATEGORIES).map(([category, subs]) => [
    category,
    subs.length ? [...subs, { value: "other", label: "Other" }] : subs,
  ])
);

// Subcategories grouped under their category, in category order — for the
// <optgroup> subcategory filter on the parts browse page.
export const PART_SUBCATEGORY_GROUPS = PART_CATEGORIES.filter(
  (category) => (PART_SUBCATEGORIES[category.value] || []).length
).map((category) => ({
  category,
  subs: PART_SUBCATEGORIES[category.value],
}));

// OEM vs aftermarket sourcing (matches backend partTaxonomy.PART_TYPE_VALUES).
export const PART_TYPES = [
  { value: "oem", label: "OEM" },
  { value: "genuine", label: "Genuine" },
  { value: "aftermarket", label: "Aftermarket" },
];

// Warranty buckets (matches backend partTaxonomy.WARRANTY_VALUES).
export const WARRANTY_OPTIONS = [
  { value: "none", label: "No warranty" },
  { value: "7-days", label: "7 days" },
  { value: "1-month", label: "1 month" },
  { value: "3-months", label: "3 months" },
  { value: "6-months", label: "6 months" },
  { value: "1-year", label: "1 year" },
];

// Localized category label — Urdu when lang === "ur", else the English label.
export function partCategoryLabel(slug, lang) {
  const category = PART_CATEGORIES.find((c) => c.value === slug);
  if (!category) return titleCase(slug);
  return lang === "ur" && category.urdu ? category.urdu : category.label;
}

// Friendly label for a stored subcategory slug (searches every category).
export function partSubcategoryLabel(slug) {
  for (const subs of Object.values(PART_SUBCATEGORIES)) {
    const found = subs.find((s) => s.value === slug);
    if (found) return found.label;
  }
  return titleCase(slug);
}

export function partTypeLabel(slug) {
  return PART_TYPES.find((p) => p.value === slug)?.label || titleCase(slug);
}

export function warrantyLabel(slug) {
  return WARRANTY_OPTIONS.find((w) => w.value === slug)?.label || titleCase(slug);
}
