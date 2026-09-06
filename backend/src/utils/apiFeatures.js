/**
 * API Features — Search, Filter, Sort, Paginate
 * ──────────────────────────────────────────────
 * Usage:
 *   const features = new APIFeatures(Vehicle.find(), req.query)
 *     .search()
 *     .filter()
 *     .sort()
 *     .paginate();
 *   const vehicles = await features.query;
 */

const { CATEGORY_TYPES } = require("../config/taxonomy");

// Neutralise every regex metacharacter so a query value is matched as the
// literal text a buyer typed. Without this, "?q=" went straight into $regex:
// a crafted catastrophic-backtracking pattern is evaluated against every
// document in the collection, and even a stray "(" from a real search like
// "hino (6 wheeler" threw a cast error instead of returning results.
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query values arrive as strings, or as arrays when a param is repeated
// (?make=a&make=b), or as objects when bracket syntax is used (?make[$ne]=x).
// Only a plain string is a usable scalar filter — anything else is ignored
// rather than coerced into "[object Object]" or a comma-joined string.
const asScalar = (value) => (typeof value === "string" ? value.trim() : "");

// Numeric bounds were passed straight to Number(), so "?price[min]=abc"
// became NaN, which Mongoose then failed to cast — a 500 for what is really
// a malformed URL. Returns null for anything that isn't a finite number, and
// the caller omits that bound entirely.
const asFiniteNumber = (value) => {
  const raw = asScalar(value);
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

class APIFeatures {
  /**
   * @param {Object} query      - Mongoose query object (e.g. Vehicle.find())
   * @param {Object} queryString - req.query from Express
   */
  constructor(query, queryString) {
    this.query       = query;
    this.queryString = queryString;
  }

  /**
   * Full-text search on title, make, model, description
   * URL param: ?q=hino+prime+mover
   */
  search() {
    const searchTerm = escapeRegex(asScalar(this.queryString.q));
    if (searchTerm) {
      this.query = this.query.find({
        $or: [
          { title:       { $regex: searchTerm, $options: "i" } },
          { make:        { $regex: searchTerm, $options: "i" } },
          { model:       { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { city:        { $regex: searchTerm, $options: "i" } },
          { type:        { $regex: searchTerm, $options: "i" } },
        ],
      });
    }
    return this;
  }

  /**
   * Filter by exact fields and ranges
   * URL params:
   *   ?make=hino
   *   ?type=prime-mover
   *   ?city=karachi
   *   ?condition=used
   *   ?transmission=manual
   *   ?fuel=diesel
   *   ?featured=true
   *   ?verified=true
   *   ?price[min]=500000&price[max]=20000000
   *   ?year[min]=2018&year[max]=2023
   *   ?mileage[max]=100000
   */
  filter() {
    // Fields that are direct equality matches
    const EXACT_FIELDS = [
      "make", "type", "city", "condition",
      "transmission", "fuel", "color",
      "province", "sellerId",
    ];

    const filterObj = {};

    // Exact matches — anchored and escaped, so "?make=." matches the literal
    // make "." rather than every listing in the collection.
    EXACT_FIELDS.forEach((field) => {
      const value = asScalar(this.queryString[field]);
      if (value) {
        filterObj[field] = {
          $regex: `^${escapeRegex(value)}$`,
          $options: "i", // Case-insensitive
        };
      }
    });

    // Category → expand to its set of type slugs (homepage "Browse by
    // Category"). An explicit ?type= is more specific, so it wins if both
    // are present.
    if (this.queryString.category && !this.queryString.type) {
      const types = CATEGORY_TYPES[String(this.queryString.category).toLowerCase()];
      if (types && types.length) filterObj.type = { $in: types };
    }

    // Boolean fields
    if (this.queryString.featured === "true") {
      filterObj.featured = true;
    }
    if (this.queryString.verified === "true") {
      filterObj["seller.verified"] = true;
    }

    // Only show active listings by default
    filterObj.status = "active";

    // Numeric ranges. A bound that isn't a finite number is dropped rather
    // than passed through as NaN, which Mongoose can't cast — a crawler
    // following a malformed filter URL used to get a 500 instead of results.
    const applyRange = (field, minKey, maxKey) => {
      const min = asFiniteNumber(this.queryString[minKey]);
      const max = asFiniteNumber(this.queryString[maxKey]);
      const range = {};
      if (min !== null) range.$gte = min;
      if (max !== null) range.$lte = max;
      if (Object.keys(range).length) filterObj[field] = range;
    };

    applyRange("price",   "price[min]",   "price[max]");
    applyRange("year",    "year[min]",    "year[max]");
    applyRange("mileage", "mileage[min]", "mileage[max]");

    this.query = this.query.find(filterObj);
    return this;
  }

  /**
   * Sort results
   * URL param: ?sort=newest | price-asc | price-desc | popular | mileage-asc
   */
  sort() {
    const SORT_MAP = {
      "newest":      { bumpedAt: -1 }, // bumpedAt = recency (bumps float to top)
      "oldest":      { createdAt:  1 },
      "price-asc":   { price:      1 },
      "price-desc":  { price:     -1 },
      "popular":     { views:     -1 },
      "mileage-asc": { mileage:    1 },
    };

    const sortKey = this.queryString.sort || "newest";
    const sortObj = SORT_MAP[sortKey] || SORT_MAP["newest"];

    // Pin featured listings to the top for the default browse sorts so a
    // category/brand page reads "featured ads → everything else". When the
    // user explicitly sorts by price/mileage/oldest, respect that order
    // strictly instead.
    const FEATURED_FIRST = !this.queryString.sort || sortKey === "newest" || sortKey === "popular";
    const primary = FEATURED_FIRST ? { featured: -1 } : {};

    // Always secondary sort by createdAt for stability
    this.query = this.query.sort({ ...primary, ...sortObj, createdAt: -1 });
    return this;
  }

  /**
   * Paginate results
   * URL params: ?page=1&limit=20
   */
  paginate() {
    const page  = Math.max(1, parseInt(this.queryString.page)  || 1);
    const limit = Math.min(100, parseInt(this.queryString.limit) || 20);
    const skip  = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // Store for pagination metadata
    this.page  = page;
    this.limit = limit;

    return this;
  }

  /**
   * Select specific fields (exclude sensitive ones)
   */
  selectFields() {
    this.query = this.query.select("-__v");
    return this;
  }
}

/**
 * Build pagination metadata object
 * @param {number} total   - Total documents matching filter
 * @param {number} page    - Current page
 * @param {number} limit   - Items per page
 * @returns {Object}       - Pagination metadata
 */
function getPaginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    pages:    Math.ceil(total / limit),
    hasNext:  page < Math.ceil(total / limit),
    hasPrev:  page > 1,
  };
}

module.exports = { APIFeatures, getPaginationMeta };
