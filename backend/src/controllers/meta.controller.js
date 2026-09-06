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
    const live = { status: "active", expiresAt: { $gt: new Date() } };

    const [vMakes, pMakes, vCities, pCities, vTypes, pCategories] = await Promise.all([
      Vehicle.distinct("make", { status: "active" }),
      Part.distinct("make", { status: "active" }),
      Vehicle.distinct("city", { status: "active" }),
      Part.distinct("city", { status: "active" }),
      // Types and part categories come from validated enums (taxonomy.js and
      // partTaxonomy.js), unlike make/city which are free-text seller input.
      // Only these two are safe to build public URLs from — see the note in
      // frontend/app/sitemap.js.
      Vehicle.distinct("type", live),
      Part.distinct("category", live),
    ]);

    respond(res, 200, {
      makes: clean([...vMakes, ...pMakes]),
      cities: clean([...vCities, ...pCities]),
      // Only values that currently have at least one live listing. The sitemap
      // uses these so it never advertises an empty category page.
      vehicleTypes: clean(vTypes),
      partCategories: clean(pCategories),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFilters };
