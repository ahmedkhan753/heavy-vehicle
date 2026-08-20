/**
 * Business directory categories — labels + Urdu.
 * Slugs must match backend/src/config/businessCategories.js.
 */

export const BUSINESS_CATEGORIES = [
  { value: "workshop", label: "Workshop / Repair", urdu: "ورکشاپ / مرمت", icon: "wrench" },
  { value: "body-builder", label: "Body Building & Fabrication", urdu: "باڈی سازی", icon: "box" },
  { value: "denting-painting", label: "Denting & Painting", urdu: "ڈینٹنگ اور پینٹنگ", icon: "tag" },
  { value: "auto-electrician", label: "Auto Electrician", urdu: "آٹو الیکٹریشن", icon: "engine" },
  { value: "tyres", label: "Tyres & Wheels", urdu: "ٹائر اور وہیل", icon: "gauge" },
  { value: "parts-shop", label: "Spare Parts Shop", urdu: "پرزہ جات کی دکان", icon: "layers" },
  { value: "crane-rental", label: "Crane Rental", urdu: "کرین کرایہ", icon: "truck" },
  { value: "machinery-rental", label: "Machinery Rental", urdu: "مشینری کرایہ", icon: "truck" },
  { value: "transporter", label: "Transport & Logistics", urdu: "ٹرانسپورٹ", icon: "truck" },
  { value: "towing-recovery", label: "Towing & Recovery", urdu: "ٹوئنگ اور ریکوری", icon: "truck" },
  { value: "insurance", label: "Insurance", urdu: "انشورنس", icon: "shield" },
  { value: "tracker-gps", label: "GPS / Tracker Installation", urdu: "جی پی ایس ٹریکر", icon: "pin" },
  { value: "driver-training", label: "Driver & Operator Training", urdu: "ڈرائیور ٹریننگ", icon: "badge" },
  { value: "fuel-lubricants", label: "Fuel & Lubricants", urdu: "فیول اور آئل", icon: "fuel" },
  { value: "ac-cooling", label: "AC & Cooling", urdu: "اے سی اور کولنگ", icon: "gear" },
  { value: "other", label: "Other", urdu: "دیگر", icon: "tag" },
];

const BY_VALUE = Object.fromEntries(BUSINESS_CATEGORIES.map((c) => [c.value, c]));

export function businessCategoryLabel(value, lang = "en") {
  const c = BY_VALUE[value];
  if (!c) return value || "";
  return lang === "ur" && c.urdu ? c.urdu : c.label;
}

export function businessCategoryIcon(value) {
  return BY_VALUE[value]?.icon || "tag";
}
