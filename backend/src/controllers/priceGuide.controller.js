/**
 * Price Guide Controller
 * ──────────────────────
 * Derives "typical price" ranges from real active listings, grouped by
 * vehicle type. Built on aggregation (same spirit as meta.controller.js).
 *
 *   getGuide    → GET /api/meta/price-guide            (public)
 *   getEstimate → GET /api/meta/price-guide/estimate   (public)
 *
 * Design notes:
 *   - price = 0 ("Price on call") listings are excluded from all stats.
 *   - We surface a bucket only when it has enough samples, so a "typical"
 *     price is never claimed from one or two ads.
 *   - Stats use median + IQR (see utils/percentile.js), not the average.
 */

const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const { priceStats } = require("../utils/percentile");

// Minimum sample sizes before we trust a number.
const MIN_SAMPLES_GUIDE = 3; // to show a row on the guide
const MIN_SAMPLES_BADGE = 5; // to compare a single listing on its detail page

// Build a Mongo match from query filters. Only whitelisted fields are used.
function buildMatch(query = {}) {
  const { type, make, condition, city, yearMin, yearMax, excludeId } = query;

  const match = { status: "active", price: { $gt: 0 } };

  if (type) match.type = String(type).toLowerCase();
  if (make) match.make = String(make).toLowerCase();
  if (condition) match.condition = String(condition).toLowerCase();
  if (city) match.city = String(city).toLowerCase();

  const min = Number(yearMin);
  const max = Number(yearMax);
  if (Number.isFinite(min) || Number.isFinite(max)) {
    match.year = {};
    if (Number.isFinite(min)) match.year.$gte = min;
    if (Number.isFinite(max)) match.year.$lte = max;
  }

  if (excludeId && mongoose.isValidObjectId(excludeId)) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  }

  return match;
}

// GET /api/meta/price-guide  → typical price per vehicle type
async function getGuide(req, res, next) {
  try {
    const match = buildMatch(req.query);

    const rows = await Vehicle.aggregate([
      { $match: match },
      { $group: { _id: "$type", prices: { $push: "$price" } } },
    ]);

    const data = rows
      .map((row) => ({ type: row._id, ...priceStats(row.prices) }))
      .filter((row) => row.count >= MIN_SAMPLES_GUIDE)
      .sort((a, b) => String(a.type).localeCompare(String(b.type)));

    res.status(200).json({ success: true, message: "Success", data });
  } catch (err) {
    next(err);
  }
}

// GET /api/meta/price-guide/estimate  → typical price for one listing's bucket
async function getEstimate(req, res, next) {
  try {
    // A type is required to estimate anything meaningful.
    if (!req.query.type) {
      return res.status(200).json({ success: true, message: "Success", data: { count: 0 } });
    }

    const match = buildMatch(req.query);

    const rows = await Vehicle.aggregate([
      { $match: match },
      { $group: { _id: null, prices: { $push: "$price" } } },
    ]);

    const stats = priceStats(rows[0]?.prices || []);

    // Below the confidence threshold we report only the count, so the
    // frontend hides the badge instead of making a weak claim.
    const data =
      stats.count >= MIN_SAMPLES_BADGE
        ? { count: stats.count, median: stats.median, p25: stats.p25, p75: stats.p75 }
        : { count: stats.count };

    res.status(200).json({ success: true, message: "Success", data });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGuide, getEstimate, MIN_SAMPLES_GUIDE, MIN_SAMPLES_BADGE };
