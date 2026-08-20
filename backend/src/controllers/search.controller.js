/**
 * Search Controller
 * ─────────────────
 * Unified search across Vehicles AND Parts for the homepage search bar.
 * Vehicle/part list pages already have their own per-collection `q` search
 * (vehicle.controller's APIFeatures, part.controller's buildPartFilter) —
 * this is a separate, mixed-collection endpoint because the homepage box
 * doesn't know (and shouldn't need to know) which side of the marketplace
 * the visitor means. Previously the homepage form hard-routed every search
 * to /vehicles, so searching "part" (or anything else) against a listing
 * that was actually a part came back empty.
 *
 *   GET /api/search?q=...&limit=24
 */

const Fuse = require("fuse.js");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// Same substring fields each collection's own list search already matches
// on, so results here stay consistent with /vehicles and /parts.
const VEHICLE_OR = (term) => [
  { title: { $regex: term, $options: "i" } },
  { make: { $regex: term, $options: "i" } },
  { model: { $regex: term, $options: "i" } },
  { description: { $regex: term, $options: "i" } },
  { city: { $regex: term, $options: "i" } },
  { type: { $regex: term, $options: "i" } },
];
const PART_OR = (term) => [
  { title: { $regex: term, $options: "i" } },
  { description: { $regex: term, $options: "i" } },
  { make: { $regex: term, $options: "i" } },
  { model: { $regex: term, $options: "i" } },
  { category: { $regex: term, $options: "i" } },
  { city: { $regex: term, $options: "i" } },
];

// Candidate pool for the fuzzy fallback — bounded so this stays cheap on
// the free-tier DB regardless of catalog size, ordered newest-first so a
// truncated pool still favours currently-relevant listings.
const FUZZY_POOL_SIZE = 400;
const FUZZY_FIELDS = ["title", "make", "model", "category", "type", "description"];

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Fuzzy-matching a short (possibly typo'd) query against a whole multi-word
// title scores badly no matter how close the typo is — Fuse's edit-distance
// ratio penalizes the length mismatch, so "hnio" barely beats "Doosan 400"
// for "Hino Jo8c Engine Piston Ring Set" even though one is obviously the
// right answer. Matching against individual words instead (title tokenized,
// one Fuse entry per word, mapped back to its listing) keeps the comparison
// apples-to-apples and produces a threshold that actually separates real
// typos ("hnio"->"hino", "doosn"->"doosan") from unrelated junk queries —
// verified empirically against production data before picking 0.5.
function buildWordPool(listings) {
  const pool = [];
  listings.forEach((entry, idx) => {
    const text = FUZZY_FIELDS.map((f) => entry.item[f]).filter(Boolean).join(" ");
    const words = new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3));
    words.forEach((word) => pool.push({ word, idx }));
  });
  return pool;
}

async function fuzzyFallback(term, limit) {
  const [vehicles, parts] = await Promise.all([
    Vehicle.find({ status: "active" }).sort({ createdAt: -1 }).limit(FUZZY_POOL_SIZE).lean(),
    Part.find({ status: "active", expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).limit(FUZZY_POOL_SIZE).lean(),
  ]);

  const listings = [
    ...vehicles.map((item) => ({ kind: "vehicle", item })),
    ...parts.map((item) => ({ kind: "part", item })),
  ];
  if (!listings.length) return [];

  const fuse = new Fuse(buildWordPool(listings), {
    keys: ["word"],
    threshold: 0.5,
    includeScore: true,
    minMatchCharLength: 3,
  });

  const bestScoreByListing = new Map();
  fuse.search(term).forEach((hit) => {
    const current = bestScoreByListing.get(hit.item.idx);
    if (current === undefined || hit.score < current) bestScoreByListing.set(hit.item.idx, hit.score);
  });

  return [...bestScoreByListing.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, limit)
    .map(([idx]) => listings[idx]);
}

async function search(req, res, next) {
  try {
    const term = String(req.query.q || "").trim();
    const limit = Math.min(48, parseInt(req.query.limit) || 24);

    if (!term) return respond(res, 200, []);

    const safeTerm = escapeRegex(term);

    const [vehicles, parts] = await Promise.all([
      Vehicle.find({ status: "active", $or: VEHICLE_OR(safeTerm) })
        .sort({ featured: -1, bumpedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      Part.find({ status: "active", expiresAt: { $gt: new Date() }, $or: PART_OR(safeTerm) })
        .sort({ featured: -1, bumpedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    let results = [
      ...vehicles.map((item) => ({ kind: "vehicle", item })),
      ...parts.map((item) => ({ kind: "part", item })),
    ]
      .sort((a, b) => {
        if (!!a.item.featured !== !!b.item.featured) return a.item.featured ? -1 : 1;
        return new Date(b.item.bumpedAt || b.item.createdAt) - new Date(a.item.bumpedAt || a.item.createdAt);
      })
      .slice(0, limit);

    // Nothing from a direct substring match — the term might just have a
    // typo, so fall back to fuzzy scoring before concluding there's really
    // nothing relevant.
    if (!results.length) {
      results = await fuzzyFallback(term, limit);
    }

    respond(res, 200, results);
  } catch (err) {
    next(err);
  }
}

module.exports = { search };
