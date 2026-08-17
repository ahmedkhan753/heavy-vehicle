// Top-level categories for "Browse by Category" and the grouped pickers.
// `icon` maps to an SVG key in BrowseSection; `value` is sent as ?category=
// and expanded to its member types by the backend (config/taxonomy.js).
export const VEHICLE_CATEGORIES = [
  { value: "trucks", label: "Trucks", urdu: "ٹرک", icon: "truck" },
  { value: "buses", label: "Buses & Coaches", urdu: "بسیں", icon: "bus" },
  { value: "construction", label: "Construction Machinery", urdu: "تعمیراتی مشینری", icon: "construction" },
  { value: "trailers", label: "Trailers", urdu: "ٹریلرز", icon: "trailer" },
  { value: "agriculture", label: "Agricultural Machinery", urdu: "زرعی مشینری", icon: "tractor" },
  // Catch-all for the pickers; hidden from the homepage "Browse by Category".
  { value: "other", label: "Other", urdu: "دیگر", icon: "truck" },
];

// Flat list of every listing type (keeps existing consumers simple). `category`
// ties each type to a VEHICLE_CATEGORIES entry. The matching slugs live in the
// backend at backend/src/config/taxonomy.js — keep the two in sync. Existing
// slugs are preserved (never rename a live slug without a migration).
export const VEHICLE_TYPES = [
  // ── Trucks ────────────────────────────────────────────────
  { value: "prime-mover", label: "Prime Mover", urdu: "پرائم موور", category: "trucks" },
  { value: "cargo-truck", label: "Cargo Truck", urdu: "کارگو ٹرک", category: "trucks" },
  { value: "flatbed-truck", label: "Flatbed Truck", urdu: "فلیٹ بیڈ ٹرک", category: "trucks" },
  { value: "dumper", label: "Dump Truck", urdu: "ڈمپ ٹرک", category: "trucks" },
  { value: "tipper", label: "Tipper Truck", urdu: "ٹپر", category: "trucks" },
  { value: "mixer", label: "Mixer Truck", urdu: "مکسر ٹرک", category: "trucks" },
  { value: "tanker-truck", label: "Tanker Truck", urdu: "ٹینکر ٹرک", category: "trucks" },
  { value: "oil-tanker", label: "Oil Tanker", urdu: "آئل ٹینکر", category: "trucks" },
  { value: "garbage-compactor", label: "Garbage Compactor", urdu: "گاربیج کمپیکٹر", category: "trucks" },
  { value: "reefer", label: "Refrigerated Truck", urdu: "ریفر ٹرک", category: "trucks" },
  { value: "recovery-truck", label: "Recovery Truck", urdu: "ریکوری ٹرک", category: "trucks" },
  { value: "car-carrier", label: "Car Carrier", urdu: "کار کیریئر", category: "trucks" },
  { value: "box-truck", label: "Box Truck", urdu: "باکس ٹرک", category: "trucks" },
  { value: "crane-truck", label: "Crane Truck", urdu: "کرین ٹرک", category: "trucks" },
  { value: "fire-truck", label: "Fire Truck", urdu: "فائر ٹرک", category: "trucks" },
  { value: "water-bowser", label: "Water Bowser", urdu: "واٹر باؤزر", category: "trucks" },
  { value: "vacuum-truck", label: "Vacuum Truck", urdu: "ویکیوم ٹرک", category: "trucks" },
  { value: "container-truck", label: "Container Truck", urdu: "کنٹینر ٹرک", category: "trucks" },
  { value: "mini-truck", label: "Mini Truck", urdu: "منی ٹرک", category: "trucks" },

  // ── Buses & Coaches ───────────────────────────────────────
  { value: "bus", label: "Bus / Coach", urdu: "بس", category: "buses" },
  { value: "coaster", label: "Coaster", urdu: "کوسٹر", category: "buses" },
  { value: "mini-bus", label: "Mini Bus", urdu: "منی بس", category: "buses" },

  // ── Construction Machinery ────────────────────────────────
  { value: "excavator", label: "Excavator", urdu: "ایکسکیویٹر", category: "construction" },
  { value: "loader", label: "Wheel Loader", urdu: "وہیل لوڈر", category: "construction" },
  { value: "backhoe-loader", label: "Backhoe Loader", urdu: "بیک ہو لوڈر", category: "construction" },
  { value: "bulldozer", label: "Bulldozer", urdu: "بلڈوزر", category: "construction" },
  { value: "grader", label: "Motor Grader", urdu: "موٹر گریڈر", category: "construction" },
  { value: "road-roller", label: "Road Roller", urdu: "روڈ رولر", category: "construction" },
  { value: "crane", label: "Crane", urdu: "کرین", category: "construction" },
  { value: "forklift", label: "Forklift", urdu: "فورک لفٹ", category: "construction" },
  { value: "telehandler", label: "Telehandler", urdu: "ٹیلی ہینڈلر", category: "construction" },

  // ── Trailers ──────────────────────────────────────────────
  { value: "flatbed", label: "Flatbed Trailer", urdu: "فلیٹ بیڈ ٹریلر", category: "trailers" },
  { value: "low-bed", label: "Low Bed Trailer", urdu: "لو بیڈ ٹریلر", category: "trailers" },
  { value: "container-trailer", label: "Container Trailer", urdu: "کنٹینر ٹریلر", category: "trailers" },
  { value: "skeletal-trailer", label: "Skeletal Trailer", urdu: "سکیلیٹل ٹریلر", category: "trailers" },
  { value: "fuel-tanker", label: "Fuel Tanker", urdu: "فیول ٹینکر", category: "trailers" },
  { value: "water-tanker", label: "Water Tanker", urdu: "واٹر ٹینکر", category: "trailers" },
  { value: "chemical-tanker", label: "Chemical Tanker", urdu: "کیمیکل ٹینکر", category: "trailers" },
  { value: "bitumen-tanker", label: "Bitumen Tanker", urdu: "بٹومن ٹینکر", category: "trailers" },
  { value: "cement-bulker", label: "Cement Bulker", urdu: "سیمنٹ بلکر", category: "trailers" },
  { value: "dump-trailer", label: "Dump Trailer", urdu: "ڈمپ ٹریلر", category: "trailers" },
  { value: "curtain-side-trailer", label: "Curtain Side Trailer", urdu: "کرٹین سائیڈ ٹریلر", category: "trailers" },
  { value: "refrigerated-trailer", label: "Refrigerated Trailer", urdu: "ریفریجریٹڈ ٹریلر", category: "trailers" },
  { value: "livestock-trailer", label: "Livestock Trailer", urdu: "لائیو سٹاک ٹریلر", category: "trailers" },
  { value: "car-carrier-trailer", label: "Car Carrier Trailer", urdu: "کار کیریئر ٹریلر", category: "trailers" },
  { value: "logging-trailer", label: "Logging Trailer", urdu: "لاگنگ ٹریلر", category: "trailers" },

  // ── Agricultural Machinery ────────────────────────────────
  { value: "tractor", label: "Tractor", urdu: "ٹریکٹر", category: "agriculture" },
  { value: "combine-harvester", label: "Combine Harvester", urdu: "کمبائن ہارویسٹر", category: "agriculture" },
  { value: "wheat-harvester", label: "Wheat Harvester", urdu: "گندم ہارویسٹر", category: "agriculture" },
  { value: "rice-harvester", label: "Rice Harvester", urdu: "چاول ہارویسٹر", category: "agriculture" },
  { value: "laser-land-leveler", label: "Laser Land Leveler", urdu: "لیزر لینڈ لیولر", category: "agriculture" },
  { value: "seed-drill", label: "Seed Drill", urdu: "سیڈ ڈرل", category: "agriculture" },
  { value: "rotavator", label: "Rotavator", urdu: "روٹاویٹر", category: "agriculture" },
  { value: "cultivator", label: "Cultivator", urdu: "کلٹیویٹر", category: "agriculture" },
  { value: "plough", label: "Plough", urdu: "ہل", category: "agriculture" },
  { value: "trailer-trolley", label: "Trailer Trolley", urdu: "ٹرالی", category: "agriculture" },
  { value: "baler", label: "Baler", urdu: "بیلر", category: "agriculture" },
  { value: "sprayer", label: "Sprayer", urdu: "سپریئر", category: "agriculture" },

  // ── Other ─────────────────────────────────────────────────
  // Fallback so a seller whose vehicle isn't listed can still post.
  { value: "other", label: "Other", urdu: "دیگر", category: "other" },
];

// Types grouped under their category, in category order — for <optgroup>
// pickers (post-ad form, filters). Precomputed so components stay simple.
export const VEHICLE_TYPE_GROUPS = VEHICLE_CATEGORIES.map((category) => ({
  category,
  types: VEHICLE_TYPES.filter((type) => type.category === category.value),
}));

// Canonical make list. Kept comprehensive so sellers can almost always pick
// from it; SuggestInput still lets them type a brand that's missing (stored on
// their ad only — never promoted to the shared search lists).
export const VEHICLE_MAKES = [
  // Trucks & commercial vehicles
  "hino", "isuzu", "faw", "jac", "jmc", "shacman", "sinotruk", "howo", "sitrak",
  "dongfeng", "foton", "beiben", "dfac", "volvo", "mercedes", "scania", "man",
  "daf", "iveco", "renault", "hyundai", "nissan", "ud-trucks", "mitsubishi",
  "fuso", "toyota", "tata", "ashok-leyland", "bharatbenz", "eicher", "sml-isuzu",
  "mahindra", "kamaz", "master", "daewoo", "bedford",
  // Buses & coaches
  "yutong", "king-long", "golden-dragon",
  // Construction & heavy machinery
  "caterpillar", "komatsu", "hitachi", "kobelco", "hyundai-ce", "volvo-ce",
  "sany", "xcmg", "zoomlion", "liugong", "lonking", "sdlg", "doosan", "develon",
  "shantui", "jcb", "case", "liebherr", "terex", "tadano", "grove", "dynapac",
  "hamm", "bomag", "sakai", "heli", "hangcha", "bobcat", "manitou", "dieci",
  // Tractors & agriculture
  "massey-ferguson", "new-holland", "fiat", "al-ghazi", "millat", "john-deere",
  "belarus", "ursus", "kubota",
];

// Canonical city list (alphabetical), kept comprehensive across all provinces
// so buyers can filter by almost any city. Sellers can still type a town that's
// missing via SuggestInput (stored on their ad only, not added to this list).
export const CITIES = [
  "abbottabad", "ahmedpur-east", "arif-wala", "attock", "badin", "bahawalnagar",
  "bahawalpur", "bannu", "barikot", "batkhela", "bhakkar", "bhalwal", "bholari",
  "burewala", "chakwal", "chaman", "charsadda", "chichawatni", "chiniot",
  "chishtian", "chitral", "dadu", "daska", "dera-ghazi-khan", "dera-ismail-khan",
  "dera-murad-jamali", "dipalpur", "faisalabad", "farooqabad", "ferozwala",
  "ghotki", "gilgit", "gojra", "gujar-khan", "gujranwala", "gujranwala-cantt",
  "gujrat", "gwadar", "hafizabad", "hangu", "haripur", "haroonabad", "hasilpur",
  "haveli-lakha", "hub", "hyderabad", "islamabad", "jacobabad", "jalalpur-jattan",
  "jamshoro", "jampur", "jaranwala", "jatoi", "jauharabad", "jhang", "jhelum",
  "kabal", "kamalia", "kamber-ali-khan", "kamoke", "kandhkot", "karachi",
  "kashmore", "kasur", "khairpur", "khanewal", "khanpur", "kharian", "khushab",
  "khuzdar", "kohat", "kot-abdul-malik", "kot-addu", "kot-radha-kishan", "kotli",
  "kotri", "lahore", "lala-musa", "larkana", "layyah", "lodhran", "loralai",
  "ludhewala-waraich", "mailsi", "mandi-bahauddin", "mansehra", "mardan",
  "mian-channu", "mianwali", "mingora", "mirpur", "mirpur-khas", "moro", "multan",
  "muridke", "muzaffarabad", "muzaffargarh", "narowal", "nawabshah", "nowshera",
  "okara", "pakpattan", "panjgur", "pasrur", "pattoki", "peshawar", "phool-nagar",
  "pishin", "quetta", "rahim-yar-khan", "rajanpur", "rawalpindi", "renala-khurd",
  "sadiqabad", "sahiwal", "sambrial", "samundri", "sangla-hill", "sargodha",
  "shabqadar", "shahdadkot", "shahdadpur", "shakargarh", "sheikhupura", "shikarpur",
  "shujabad", "sialkot", "sibi", "skardu", "sukkur", "swabi", "tando-adam",
  "tando-allahyar", "tando-muhammad-khan", "taunsa", "taxila", "thatta", "timergara",
  "toba-tek-singh", "turbat", "umerkot", "vehari", "wah-cantt", "wazirabad", "zhob",
];

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "imported", label: "Imported" },
  { value: "rebuilt", label: "Rebuilt" },
];

export const TRANSMISSIONS = [
  { value: "manual", label: "Manual" },
  { value: "automatic", label: "Automatic" },
  { value: "semi-auto", label: "Semi Auto" },
  { value: "hydraulic", label: "Hydraulic" },
];

export const FUELS = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
  { value: "popular", label: "Most viewed" },
  { value: "mileage-asc", label: "Lowest mileage" },
];

export const fallbackImage =
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80";

// ── Urdu labels for data values (shown when language = "ur") ──────
import { titleCase } from "@/lib/format";

export const CITY_UR = {
  karachi: "کراچی", lahore: "لاہور", islamabad: "اسلام آباد", rawalpindi: "راولپنڈی",
  faisalabad: "فیصل آباد", multan: "ملتان", peshawar: "پشاور", quetta: "کوئٹہ",
  sukkur: "سکھر", hyderabad: "حیدرآباد", gujranwala: "گوجرانوالہ", sialkot: "سیالکوٹ",
  gujrat: "گجرات", sargodha: "سرگودھا", bahawalpur: "بہاولپور", sahiwal: "ساہیوال",
  sheikhupura: "شیخوپورہ", jhang: "جھنگ", "rahim-yar-khan": "رحیم یار خان",
  kasur: "قصور", okara: "اوکاڑہ", "dera-ghazi-khan": "ڈیرہ غازی خان", jhelum: "جہلم",
  khanewal: "خانیوال", chiniot: "چنیوٹ", attock: "اٹک", mianwali: "میانوالی",
  abbottabad: "ایبٹ آباد", mardan: "مردان", kohat: "کوہاٹ", bannu: "بنوں",
  "dera-ismail-khan": "ڈیرہ اسماعیل خان", swabi: "صوابی", nowshera: "نوشہرہ",
  mansehra: "مانسہرہ", larkana: "لاڑکانہ", "mirpur-khas": "میرپور خاص",
  nawabshah: "نواب شاہ", jacobabad: "جیکب آباد", khairpur: "خیرپور", turbat: "تربت",
  khuzdar: "خضدار", gwadar: "گوادر", gilgit: "گلگت", skardu: "سکردو",
  muzaffarabad: "مظفرآباد", mirpur: "میرپور", "wah-cantt": "واہ کینٹ", taxila: "ٹیکسلا",
};

export const MAKE_UR = {
  hino: "ہینو", isuzu: "آئسوزو", faw: "فا", shacman: "شیک مین", sinotruk: "سائنو ٹرک",
  volvo: "وولوو", mercedes: "مرسڈیز", scania: "سکینیا", caterpillar: "کیٹرپلر",
  komatsu: "کوماٹسو", jcb: "جے سی بی", sany: "سینی", xcmg: "ایکس سی ایم جی",
  "hyundai-ce": "ہنڈائی سی ای", nissan: "نسان", mitsubishi: "مٹسوبشی", hyundai: "ہنڈائی",
  daewoo: "دائیوو", master: "ماسٹر", howo: "ہوو", man: "مین", bedford: "بیڈفورڈ",
  daf: "ڈاف", iveco: "آئیویکو", tata: "ٹاٹا", fuso: "فوسو", dongfeng: "ڈونگ فینگ",
  foton: "فوٹون", beiben: "بائی بین", kamaz: "کاماز", hitachi: "ہٹاچی", doosan: "ڈوسان",
  liebherr: "لیبہر", kobelco: "کوبلکو", terex: "ٹیریکس", kubota: "کوبوٹا",
  "massey-ferguson": "میسی فرگوسن", "new-holland": "نیو ہالینڈ", "al-ghazi": "الغازی",
  "john-deere": "جان ڈیئر", belarus: "بیلارس", "ud-trucks": "یو ڈی ٹرکس",
  "ashok-leyland": "اشوک لے لینڈ", "volvo-ce": "وولوو سی ای",
  // Added with the expanded taxonomy
  toyota: "ٹویوٹا", renault: "رینالٹ", jmc: "جے ایم سی", jac: "جے سی",
  mahindra: "مہندرا", eicher: "آئشر", bharatbenz: "بھارت بینز", "sml-isuzu": "ایس ایم ایل آئسوزو",
  sitrak: "سائٹریک", dfac: "ڈی ایف اے سی", lonking: "لونکنگ",
  yutong: "یوٹونگ", "king-long": "کنگ لانگ", "golden-dragon": "گولڈن ڈریگن",
  sdlg: "ایس ڈی ایل جی", develon: "ڈیولون", shantui: "شانتوئی", liugong: "لیوگانگ",
  zoomlion: "زوم لائن", case: "کیس", tadano: "تاڈانو", grove: "گروو",
  dynapac: "ڈائناپیک", hamm: "ہام", bomag: "بوماگ", sakai: "ساکائی",
  heli: "ہیلی", hangcha: "ہانگچا", manitou: "مینیٹو", dieci: "ڈائیچی", bobcat: "بوب کیٹ",
  fiat: "فیاٹ", millat: "ملت", ursus: "ارسس",
};

// Localization helpers — return Urdu when lang === "ur", else the default.
export function cityLabel(slug, lang) {
  return lang === "ur" && CITY_UR[slug] ? CITY_UR[slug] : titleCase(slug);
}
export function makeLabel(slug, lang) {
  return lang === "ur" && MAKE_UR[slug] ? MAKE_UR[slug] : titleCase(slug);
}
export function typeLabel(type, lang) {
  return lang === "ur" && type?.urdu ? type.urdu : type?.label;
}
