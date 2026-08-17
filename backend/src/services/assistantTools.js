const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const { IMPORTANT_CITIES, COMMON_MAKES } = require("./assistantKnowledge");

const SEARCH_HINT_PATTERNS = [
  /\b(show|find|search|available|under|below|less than|buy|looking for)\b/i,
  /\b(karachi|lahore|islamabad|rawalpindi|faisalabad|multan|peshawar|quetta|sialkot|gujranwala|hyderabad|sukkur)\b/i,
  /\b(hino|isuzu|howo|shacman|faw|foton|dongfeng|nissan|fuso|master|daewoo|caterpillar|komatsu|jcb|bedford|volvo)\b/i,
  /\b(truck|dumper|tipper|tanker|trailer|excavator|loader|tractor|mixer|bowser|crane|bus|coaster)\b/i,
  /\b(crore|lakh|lac|million|price|budget|rs|pkr)\b/i,
];

function detectAssistantIntent(message) {
  const text = String(message || "").toLowerCase();
  const wantsMarketplaceSearch = SEARCH_HINT_PATTERNS.filter((pattern) => pattern.test(text)).length >= 1;

  if (wantsMarketplaceSearch) {
    return {
      intent: "VEHICLE_SEARCH_CANDIDATE",
      phase: "live-data",
      note: "User requested vehicle search or marketplace recommendations.",
    };
  }

  if (/\b(post|sell|listing|ad|advertise)\b/i.test(text)) {
    return { intent: "LISTING_HELP", phase: "knowledge" };
  }

  if (/\b(compare|vs|versus|better)\b/i.test(text)) {
    return { intent: "COMPARE_VEHICLES", phase: "knowledge" };
  }

  if (/\b(scam|safe|fraud|documents|advance|payment)\b/i.test(text)) {
    return { intent: "SAFETY_GUIDANCE", phase: "knowledge" };
  }

  return { intent: "GENERAL_SUPPORT", phase: "knowledge" };
}

async function fetchLiveVehicleContext(message) {
  try {
    // If MongoDB is not connected yet, skip live database query gracefully
    if (mongoose.connection.readyState !== 1) {
      return "";
    }

    const text = String(message || "").toLowerCase();
    const query = { status: "active" };

    // Match city if mentioned
    const matchedCity = IMPORTANT_CITIES.find((city) => text.includes(city.toLowerCase()));
    if (matchedCity) {
      query.city = matchedCity.toLowerCase();
    }

    // Match make if mentioned
    const matchedMake = COMMON_MAKES.find((make) => {
      const parts = make.toLowerCase().split("/");
      return parts.some((part) => text.includes(part.trim()));
    });
    if (matchedMake) {
      query.make = new RegExp(matchedMake.split("/")[0].trim(), "i");
    }

    // Fetch matching active vehicles with maxTimeMS timeout safeguard
    let vehicles = await Vehicle.find(query)
      .select("title make model year price priceDisplay city type images _id adType")
      .sort({ featured: -1, bumpedAt: -1, createdAt: -1 })
      .limit(4)
      .maxTimeMS(2500)
      .lean();

    // If query was specific but returned nothing, fallback to latest active vehicles
    if (!vehicles.length && (query.city || query.make)) {
      vehicles = await Vehicle.find({ status: "active" })
        .select("title make model year price priceDisplay city type images _id adType")
        .sort({ featured: -1, bumpedAt: -1, createdAt: -1 })
        .limit(4)
        .maxTimeMS(2500)
        .lean();
    }

    if (!vehicles.length) {
      return "Live HeavyWheels Inventory Status:\n- No active vehicle listings currently found matching this query in database.";
    }

    const listingLines = vehicles.map((v) => {
      const pkrPrice = v.priceDisplay || (v.price ? `Rs ${v.price.toLocaleString()}` : "Contact for Price");
      return `- Title: "${v.title}" | Make: ${v.make} | Year: ${v.year} | City: ${v.city} | Price: ${pkrPrice} | View URL: /vehicles/${v._id}`;
    });

    return [
      "Live HeavyWheels Active Listings (from database):",
      ...listingLines,
      "Guidance: Recommend these actual listings when relevant. Include title, price, city, and full link like /vehicles/<id>.",
    ].join("\n");
  } catch (error) {
    console.error("[assistant] Error fetching live vehicles:", error.message);
    return "";
  }
}

function buildToolContext(message) {
  const detected = detectAssistantIntent(message);
  return [
    "Assistant planning context:",
    `- Detected intent: ${detected.intent}`,
    `- Tool phase: ${detected.phase}`,
    detected.note ? `- Note: ${detected.note}` : "",
  ].filter(Boolean).join("\n");
}

module.exports = { detectAssistantIntent, buildToolContext, fetchLiveVehicleContext };
