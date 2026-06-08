/**
 * Meta Controller
 * ───────────────
 * Distinct, ever-growing option lists built from real listings, so any new
 * make/city a seller enters automatically becomes available for filtering
 * and search. The frontend merges these with its static seed lists.
 *
 *   getFilters → GET /api/meta/filters  (public)
 */

const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const clean = (arr) =>
  [...new Set(arr.filter((v) => typeof v === "string" && v.trim()))]
    .map((v) => v.trim().toLowerCase())
    .sort();

async function getFilters(req, res, next) {
  try {
    const [vMakes, pMakes, vCities, pCities] = await Promise.all([
      Vehicle.distinct("make", { status: "active" }),
      Part.distinct("make", { status: "active" }),
      Vehicle.distinct("city", { status: "active" }),
      Part.distinct("city", { status: "active" }),
    ]);

    respond(res, 200, {
      makes: clean([...vMakes, ...pMakes]),
      cities: clean([...vCities, ...pCities]),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFilters };
