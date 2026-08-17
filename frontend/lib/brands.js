/**
 * Heavy-vehicle brands for the homepage "Browse by brand" grid.
 *
 * `slug` is the value sent to the listings filter (?make=<slug>) and must
 * match how the make is stored on listings (lowercase). `logo` points to the
 * brand logo file in the shared frontend/icons folder when the asset exists.
 * If a logo isn't available, the UI falls back to a brand-coloured monogram.
 *
 * `urdu` is the Urdu transliteration shown when the site language is Urdu.
 */

export const BRANDS = [
  { name: "Hino", urdu: "ہینو", slug: "hino", color: "#e11d48", logo: "/icons/hino.PNG" },
  { name: "Isuzu", urdu: "آئسوزو", slug: "isuzu", color: "#dc2626", logo: "/icons/isuzu.PNG" },
  { name: "Nissan", urdu: "نسان", slug: "nissan", color: "#c81e1e", logo: "/icons/nissan.PNG" },
  { name: "Mitsubishi", urdu: "مٹسوبشی", slug: "mitsubishi", color: "#ef4444", logo: "/icons/mitsubishi.PNG" },
  { name: "Hyundai", urdu: "ہنڈائی", slug: "hyundai", color: "#2563eb", logo: "/icons/hyundai.PNG" },
  { name: "Daewoo", urdu: "دائیوو", slug: "daewoo", color: "#1d4ed8", logo: "/icons/daewoo trucks.PNG" },
  { name: "Master", urdu: "ماسٹر", slug: "master", color: "#0891b2", logo: "/icons/master motors.PNG" },
  { name: "FAW", urdu: "فا", slug: "faw", color: "#b91c1c", logo: "/icons/faw.PNG" },
  { name: "Howo", urdu: "ہوو", slug: "howo", color: "#ea580c", logo: "/icons/howo.PNG" },
  { name: "Shacman", urdu: "شیک مین", slug: "shacman", color: "#f59e0b", logo: "/icons/sachman.PNG" },
  { name: "Dongfeng", urdu: "ڈونگ فینگ", slug: "dongfeng", color: "#be123c", logo: "/icons/dongfeng.PNG" },
  { name: "Foton", urdu: "فوٹون", slug: "foton", color: "#0ea5e9", logo: "/icons/foton.PNG" },
  { name: "Volvo", urdu: "وولوو", slug: "volvo", color: "#1e3a8a", logo: "/icons/volvo.PNG" },
  { name: "Scania", urdu: "سکینیا", slug: "scania", color: "#1e40af", logo: "/icons/scania.PNG" },
  { name: "MAN", urdu: "مین", slug: "man", color: "#334155", logo: "/icons/man.PNG" },
  { name: "Mercedes", urdu: "مرسڈیز", slug: "mercedes", color: "#475569", logo: "/icons/mercedees.PNG" },
  { name: "Bedford", urdu: "بیڈفورڈ", slug: "bedford", color: "#16a34a", logo: "/icons/bedford.PNG" },
  { name: "Caterpillar", urdu: "کیٹرپلر", slug: "caterpillar", color: "#f59e0b", logo: "/icons/catterpillar.PNG" },
  { name: "Komatsu", urdu: "کوماٹسو", slug: "komatsu", color: "#1d4ed8", logo: "/icons/komatsu.PNG" },
  { name: "JCB", urdu: "جے سی بی", slug: "jcb", color: "#ca8a04", logo: "/icons/jcb.PNG" },
  { name: "Massey Ferguson", urdu: "میسی فرگوسن", slug: "massey-ferguson", color: "#15803d", logo: "/icons/masset ferguson.PNG" },
];
