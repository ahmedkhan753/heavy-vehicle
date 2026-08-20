/**
 * Report Controller
 * ─────────────────
 *   create         → POST  /api/reports              { listingId, listingType, reasonCode, note }  (auth)
 *   adminList      → GET   /api/reports/admin?status=pending                                        (admin)
 *   adminSetStatus → PATCH /api/reports/admin/status  { listingId, listingType, status }             (admin)
 *
 * Reports are grouped by listing for the admin view — a single report
 * doesn't mean much, but five distinct users flagging the same ad does,
 * and that's only visible once they're grouped rather than shown as a
 * flat, unrelated queue.
 */

const Report = require("../models/Report");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const { AppError } = require("../middleware/error.middleware");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const LISTING_MODELS = { vehicle: Vehicle, part: Part };
const toModelType = (t) => (String(t || "").toLowerCase() === "part" ? "Part" : "Vehicle");
const toWireType = (t) => String(t || "").toLowerCase();

async function create(req, res, next) {
  try {
    const listingId = req.body.listingId;
    const listingType = toModelType(req.body.listingType);
    const reasonCode = req.body.reasonCode;
    const note = String(req.body.note || "").trim();

    if (!listingId) return next(new AppError("listingId is required.", 400));
    if (!Report.REASON_CODES.includes(reasonCode)) return next(new AppError("Invalid report reason.", 400));

    const Model = LISTING_MODELS[listingType.toLowerCase()];
    const listing = await Model.findById(listingId).select("sellerId");
    if (!listing) return next(new AppError("Listing not found.", 404));

    if (String(listing.sellerId) === String(req.user._id)) {
      return next(new AppError("You can't report your own listing.", 400));
    }

    try {
      const report = await Report.create({
        listing: listingId,
        listingType,
        reporter: req.user._id,
        reasonCode,
        note: note.slice(0, 500),
      });
      respond(res, 201, report, "Report submitted. Thanks for helping keep the marketplace clean.");
    } catch (err) {
      if (err.code === 11000) {
        return next(new AppError("You've already reported this ad.", 409));
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

async function adminList(req, res, next) {
  try {
    const match = {};
    if (req.query.status) match.status = req.query.status;

    const groups = await Report.aggregate([
      { $match: match },
      {
        $group: {
          _id: { listing: "$listing", listingType: "$listingType" },
          count: { $sum: 1 },
          reasonCodes: { $push: "$reasonCode" },
          latestNote: { $last: "$note" },
          lastReportedAt: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1, lastReportedAt: -1 } },
    ]);

    const vehicleIds = groups.filter((g) => g._id.listingType === "Vehicle").map((g) => g._id.listing);
    const partIds = groups.filter((g) => g._id.listingType === "Part").map((g) => g._id.listing);

    const [vehicles, parts] = await Promise.all([
      Vehicle.find({ _id: { $in: vehicleIds } }).select("title images sellerId status").lean(),
      Part.find({ _id: { $in: partIds } }).select("title images coverImage sellerId status").lean(),
    ]);
    const vehicleMap = new Map(vehicles.map((v) => [String(v._id), v]));
    const partMap = new Map(parts.map((p) => [String(p._id), p]));

    // Report/status counts per tab, computed once alongside the grouped list
    // so the admin panel's tab badges don't need a second round trip.
    const counts = await Report.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
    const countMap = counts.reduce((acc, c) => ({ ...acc, [c._id]: c.n }), {});

    const data = groups.map((g) => {
      const id = String(g._id.listing);
      const listingType = toWireType(g._id.listingType);
      const listing = g._id.listingType === "Vehicle" ? vehicleMap.get(id) : partMap.get(id);
      return {
        listingId: id,
        listingType,
        listing: listing
          ? { ...listing, image: listing.coverImage || listing.images?.[0]?.url || "" }
          : null, // the reported listing was already deleted
        count: g.count,
        reasonCodes: g.reasonCodes,
        note: g.latestNote,
        lastReportedAt: g.lastReportedAt,
      };
    });

    respond(res, 200, { groups: data, counts: countMap });
  } catch (err) {
    next(err);
  }
}

async function adminSetStatus(req, res, next) {
  try {
    const listingId = req.body.listingId;
    const listingType = toModelType(req.body.listingType);
    const status = req.body.status;

    if (!["pending", "reviewed", "dismissed"].includes(status)) {
      return next(new AppError("Invalid status.", 400));
    }

    const result = await Report.updateMany({ listing: listingId, listingType }, { $set: { status } });
    respond(res, 200, { modified: result.modifiedCount }, "Reports updated.");
  } catch (err) {
    next(err);
  }
}

module.exports = { create, adminList, adminSetStatus };
