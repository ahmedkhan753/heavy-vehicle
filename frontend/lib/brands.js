/**
 * Heavy-vehicle brands for the homepage "Browse by brand" grid.
 *
 * `slug` is the value sent to the listings filter (?make=<slug>) and must
 * match how the make is stored on listings (lowercase). `logo` points at an
 * optional image under /public/brands/<slug>.png — if that file isn't present,
 * BrandBrowse falls back to a brand-coloured monogram, so the grid always
 * renders. Drop real logo files in to replace the monograms.
 *
 * `urdu` is the Urdu transliteration shown when the site language is Urdu.
 */

export const BRANDS = [
  { name: "Hino", urdu: "ہینو", slug: "hino", color: "#e11d48" },
  { name: "Isuzu", urdu: "آئسوزو", slug: "isuzu", color: "#dc2626" },
  { name: "Nissan", urdu: "نسان", slug: "nissan", color: "#c81e1e" },
  { name: "Mitsubishi", urdu: "مٹسوبشی", slug: "mitsubishi", color: "#ef4444" },
  { name: "Hyundai", urdu: "ہنڈائی", slug: "hyundai", color: "#2563eb" },
  { name: "Daewoo", urdu: "دائیوو", slug: "daewoo", color: "#1d4ed8" },
  { name: "Master", urdu: "ماسٹر", slug: "master", color: "#0891b2" },
  { name: "FAW", urdu: "فا", slug: "faw", color: "#b91c1c" },
  { name: "Howo", urdu: "ہوو", slug: "howo", color: "#ea580c" },
  { name: "Shacman", urdu: "شیک مین", slug: "shacman", color: "#f59e0b" },
  { name: "Dongfeng", urdu: "ڈونگ فینگ", slug: "dongfeng", color: "#be123c" },
  { name: "Foton", urdu: "فوٹون", slug: "foton", color: "#0ea5e9" },
  { name: "Volvo", urdu: "وولوو", slug: "volvo", color: "#1e3a8a" },
  { name: "Scania", urdu: "سکینیا", slug: "scania", color: "#1e40af" },
  { name: "MAN", urdu: "مین", slug: "man", color: "#334155" },
  { name: "Mercedes", urdu: "مرسڈیز", slug: "mercedes", color: "#475569" },
  { name: "Bedford", urdu: "بیڈفورڈ", slug: "bedford", color: "#16a34a" },
  { name: "Caterpillar", urdu: "کیٹرپلر", slug: "caterpillar", color: "#f59e0b" },
  { name: "Komatsu", urdu: "کوماٹسو", slug: "komatsu", color: "#1d4ed8" },
  { name: "JCB", urdu: "جے سی بی", slug: "jcb", color: "#ca8a04" },
  { name: "Massey Ferguson", urdu: "میسی فرگوسن", slug: "massey-ferguson", color: "#15803d" },
];
