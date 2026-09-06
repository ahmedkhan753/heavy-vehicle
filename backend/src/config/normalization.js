/**
 * Make / City Normalization
 * ─────────────────────────
 * Listings stored whatever the seller typed. Production ended up holding
 * "hitachi", "hitichi", "hit" and "hino pak" as four different makes, and
 * "karachi" alongside "karachi pakistan" as two different cities.
 *
 * That is not only untidy — it breaks the product. A buyer filtering for
 * Hitachi silently misses the listings typed "hitichi", and the category
 * landing pages the sitemap advertises would carry misspellings as their
 * titles. The listing <title> is built from these fields too.
 *
 * The canonical lists below MIRROR frontend/lib/constants.js (VEHICLE_MAKES
 * and CITIES), which is what the post form offers as suggestions. The two
 * copies must stay in sync: the frontend cannot import from the backend, as
 * they are separate packages in separate containers. If you add a make or a
 * city, add it in both places.
 *
 * Generated from frontend/lib/constants.js — 78 makes, 145 cities.
 */

const Fuse = require("fuse.js");

const VEHICLE_MAKES = [
  "hino", "isuzu", "faw", "jac", "jmc", "shacman", "sinotruk", "howo",
  "sitrak", "dongfeng", "foton", "beiben", "dfac", "volvo", "mercedes",
  "scania", "man", "daf", "iveco", "renault", "hyundai", "nissan",
  "ud-trucks", "mitsubishi", "fuso", "toyota", "tata", "ashok-leyland",
  "bharatbenz", "eicher", "sml-isuzu", "mahindra", "kamaz", "master",
  "daewoo", "bedford", "yutong", "king-long", "golden-dragon", "caterpillar",
  "komatsu", "hitachi", "kobelco", "hyundai-ce", "volvo-ce", "sany", "xcmg",
  "zoomlion", "liugong", "lonking", "sdlg", "doosan", "develon", "shantui",
  "jcb", "case", "liebherr", "terex", "tadano", "grove", "dynapac", "hamm",
  "bomag", "sakai", "heli", "hangcha", "bobcat", "manitou", "dieci",
  "massey-ferguson", "new-holland", "fiat", "al-ghazi", "millat",
  "john-deere", "belarus", "ursus", "kubota",
];

const CITIES = [
  "abbottabad", "ahmedpur-east", "arif-wala", "attock", "badin",
  "bahawalnagar", "bahawalpur", "bannu", "barikot", "batkhela", "bhakkar",
  "bhalwal", "bholari", "burewala", "chakwal", "chaman", "charsadda",
  "chichawatni", "chiniot", "chishtian", "chitral", "dadu", "daska",
  "dera-ghazi-khan", "dera-ismail-khan", "dera-murad-jamali", "dipalpur",
  "faisalabad", "farooqabad", "ferozwala", "ghotki", "gilgit", "gojra",
  "gujar-khan", "gujranwala", "gujranwala-cantt", "gujrat", "gwadar",
  "hafizabad", "hangu", "haripur", "haroonabad", "hasilpur", "haveli-lakha",
  "hub", "hyderabad", "islamabad", "jacobabad", "jalalpur-jattan",
  "jamshoro", "jampur", "jaranwala", "jatoi", "jauharabad", "jhang",
  "jhelum", "kabal", "kamalia", "kamber-ali-khan", "kamoke", "kandhkot",
  "karachi", "kashmore", "kasur", "khairpur", "khanewal", "khanpur",
  "kharian", "khushab", "khuzdar", "kohat", "kot-abdul-malik", "kot-addu",
  "kot-radha-kishan", "kotli", "kotri", "lahore", "lala-musa", "larkana",
  "layyah", "lodhran", "loralai", "ludhewala-waraich", "mailsi",
  "mandi-bahauddin", "mansehra", "mardan", "mian-channu", "mianwali",
  "mingora", "mirpur", "mirpur-khas", "moro", "multan", "muridke",
  "muzaffarabad", "muzaffargarh", "narowal", "nawabshah", "nowshera",
  "okara", "pakpattan", "panjgur", "pasrur", "pattoki", "peshawar",
  "phool-nagar", "pishin", "quetta", "rahim-yar-khan", "rajanpur",
  "rawalpindi", "renala-khurd", "sadiqabad", "sahiwal", "sambrial",
  "samundri", "sangla-hill", "sargodha", "shabqadar", "shahdadkot",
  "shahdadpur", "shakargarh", "sheikhupura", "shikarpur", "shujabad",
  "sialkot", "sibi", "skardu", "sukkur", "swabi", "tando-adam",
  "tando-allahyar", "tando-muhammad-khan", "taunsa", "taxila", "thatta",
  "timergara", "toba-tek-singh", "turbat", "umerkot", "vehari", "wah-cantt",
  "wazirabad", "zhob",
];

// Real variants seen in production data, plus the abbreviations Pakistani
// sellers commonly type. Keys are already slugified, so "Hino Pak" arrives
// here as "hino-pak".
const MAKE_ALIASES = {
  // Observed in live listings — each confirmed against the listing's own
  // title: "Hitichi ex200-1" and "Ex100 pinian kara" are both Hitachi
  // excavator models, and "Hino Jo8c Engine" is a Hino J08C engine.
  hitichi: "hitachi",
  hitchi: "hitachi",
  hitatchi: "hitachi",
  hit: "hitachi",
  "hino-pak": "hino",
  hinopak: "hino",
  // Common trade shorthand.
  cat: "caterpillar",
  caterpiller: "caterpillar",
  komastu: "komatsu",
  "mercedes-benz": "mercedes",
  benz: "mercedes",
  "jcb-india": "jcb",
  "ud-truck": "ud-trucks",
  "nissan-diesel": "ud-trucks",
  "ashok-leylan": "ashok-leyland",
  "sino-truk": "sinotruk",
  sinotruck: "sinotruk",
  "doosan-infracore": "doosan",
};

// Cities are a closed set for Pakistan, so aliases here are abbreviations and
// alternate spellings rather than corrections.
const CITY_ALIASES = {
  khi: "karachi",
  lhr: "lahore",
  isb: "islamabad",
  pindi: "rawalpindi",
  rwp: "rawalpindi",
  fsd: "faisalabad",
  lyallpur: "faisalabad",
  "d-g-khan": "dera-ghazi-khan",
  "d-i-khan": "dera-ismail-khan",
};

const MAKE_SET = new Set(VEHICLE_MAKES);
const CITY_SET = new Set(CITIES);

/**
 * Reduce free text to a comparable slug: lowercase, strip accents, and turn
 * every run of non-alphanumerics into a single hyphen. "Hino Pak" and
 * "hino_pak" both become "hino-pak", which is how the canonical multi-word
 * entries ("ud-trucks", "dera-ghazi-khan") are already written.
 * @param {unknown} value
 * @returns {string}
 */
function slugify(value) {
  return String(value == null ? "" : value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Sellers routinely append the country: "Karachi Pakistan", "Hino Pak".
// Stripping it generically avoids needing an alias for every city.
const COUNTRY_SUFFIX = /-(pakistan|pak|pk)$/;

function resolve(value, set, aliases) {
  const slug = slugify(value);
  if (!slug) return null;
  if (set.has(slug)) return slug;
  if (aliases[slug]) return aliases[slug];

  const trimmed = slug.replace(COUNTRY_SUFFIX, "");
  if (trimmed !== slug) {
    if (set.has(trimmed)) return trimmed;
    if (aliases[trimmed]) return aliases[trimmed];
  }
  return null;
}

// Built once at require time; these lists never change at runtime.
const makeFuse = new Fuse(VEHICLE_MAKES, { threshold: 0.4, includeScore: true });
const cityFuse = new Fuse(CITIES, { threshold: 0.4, includeScore: true });

/**
 * Closest canonical value, for the "did you mean…" half of an error message.
 * Deliberately only used to help the seller correct their own input — never to
 * silently rewrite it, because a wrong auto-correction is invisible and would
 * put the wrong make on someone's listing.
 * @returns {string|null}
 */
function suggestion(value, fuse) {
  const slug = slugify(value).replace(COUNTRY_SUFFIX, "");
  if (!slug) return null;
  const [best] = fuse.search(slug, { limit: 1 });
  return best ? best.item : null;
}

const normalizeMake = (value) => resolve(value, MAKE_SET, MAKE_ALIASES);
const normalizeCity = (value) => resolve(value, CITY_SET, CITY_ALIASES);
const suggestMake = (value) => suggestion(value, makeFuse);
const suggestCity = (value) => suggestion(value, cityFuse);

module.exports = {
  VEHICLE_MAKES,
  CITIES,
  MAKE_ALIASES,
  CITY_ALIASES,
  slugify,
  normalizeMake,
  normalizeCity,
  suggestMake,
  suggestCity,
};
