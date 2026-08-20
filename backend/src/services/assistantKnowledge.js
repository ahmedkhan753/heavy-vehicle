const { CATEGORY_TYPES, CATEGORIES, VEHICLE_TYPE_SLUGS } = require("../config/taxonomy");
const { PART_CATEGORY_SLUGS } = require("../config/partTaxonomy");

const MARKETPLACE_ROUTES = {
  buyVehicles: "/vehicles",
  sellVehicle: "/post-ad",
  parts: "/parts",
  sellPart: "/post-part",
  dealers: "/dealers",
  services: "/services",
  priceGuide: "/services/price-guide",
  loanCalculator: "/services/loan-calculator",
  inspection: "/services/inspection",
  warranty: "/services/warranty",
  messages: "/dashboard/messages",
  profile: "/dashboard/profile",
  myAds: "/dashboard/my-ads",
  savedAds: "/dashboard/saved",
  pricing: "/subscription-pricings",
};

const IMPORTANT_CITIES = [
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

const COMMON_MAKES = [
  "hino",
  "isuzu",
  "nissan / ud",
  "mitsubishi fuso",
  "hyundai",
  "daewoo",
  "master",
  "faw",
  "howo",
  "shacman",
  "dongfeng",
  "foton",
  "volvo",
  "scania",
  "man",
  "mercedes-benz",
  "bedford",
  "caterpillar",
  "komatsu",
  "jcb",
  "massey ferguson",
];

const LISTING_FIELDS = [
  "title",
  "description",
  "type",
  "make",
  "model",
  "year",
  "condition",
  "price",
  "negotiable",
  "city",
  "area",
  "province",
  "registeredCity",
  "mileage",
  "mileageUnit",
  "transmission",
  "fuel",
  "engineCC",
  "engineType",
  "axleConfig",
  "color",
  "cabinType",
  "lastService",
  "images",
  "commissionConsent",
];

const SAFETY_GUIDANCE = [
  "Inspect the vehicle physically before payment.",
  "Verify original registration documents, chassis number, engine number, ownership history, and seller identity.",
  "Avoid advance payments to unknown sellers.",
  "Be cautious with prices that are far below market expectations.",
  "Meet in a safe place and bring a trusted mechanic or inspector for high-value purchases.",
  "HeavyWheels connects buyers and sellers; it does not guarantee a vehicle condition or seller legitimacy unless a specific verified service says so.",
];

function formatList(items, limit = 30) {
  return items.slice(0, limit).join(", ");
}

function buildKnowledgeContext() {
  return [
    "HeavyWheels platform knowledge:",
    `- Main routes: ${Object.entries(MARKETPLACE_ROUTES).map(([key, value]) => `${key}: ${value}`).join("; ")}`,
    `- Vehicle categories: ${formatList(CATEGORIES)}`,
    `- Vehicle types: ${formatList(VEHICLE_TYPE_SLUGS, 80)}`,
    `- Category mapping: ${Object.entries(CATEGORY_TYPES).map(([category, types]) => `${category} = ${types.join(", ")}`).join(" | ")}`,
    `- Spare part categories: ${formatList(PART_CATEGORY_SLUGS, 40)}`,
    `- Common Pakistani heavy vehicle makes: ${formatList(COMMON_MAKES, 40)}`,
    `- Important cities: ${formatList(IMPORTANT_CITIES, 40)}`,
    `- Vehicle listing fields: ${formatList(LISTING_FIELDS, 60)}`,
    `- Safety rules: ${SAFETY_GUIDANCE.join(" ")}`,
    "",
    "Current live-data status:",
    "- Live marketplace inventory search is ENABLED. Real active listings from the database will be injected into prompt context when appropriate.",
    "- When live listing context is available, mention specific titles, prices, cities, and direct paths like /vehicles/<id>.",
    "- If no specific active listing matches, explain how to browse or search on HeavyWheels (/vehicles).",
  ].join("\n");
}

module.exports = {
  MARKETPLACE_ROUTES,
  IMPORTANT_CITIES,
  COMMON_MAKES,
  LISTING_FIELDS,
  SAFETY_GUIDANCE,
  buildKnowledgeContext,
};
