/**
 * Sale Controller — two-party sale confirmation
 * ─────────────────────────────────────────────
 *   getMyPurchases → GET   /api/sales/purchases   (buyer's sales to confirm)
 *   confirm        → PATCH /api/sales/:id/confirm  (buyer confirms → commission)
 *   dispute        → PATCH /api/sales/:id/dispute  (buyer rejects)
 */

const Sale = require("../models/Sale");
const Commission = require("../models/Commission");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const { AppError } = require("../middleware/error.middleware");
const { getEffectiveLimits } = require("../utils/planLimits");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const modelFor = (type) => (type === "Vehicle" ? Vehicle : Part);

// ─────────────────────────────────────────────────────────────
// BUYER — sales awaiting my confirmation (+ recent history)
// ─────────────────────────────────────────────────────────────
async function getMyPurchases(req, res, next) {
  try {
    const sales = await Sale.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sellerId", "name")
      .lean();

    respond(res, 200, sales);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// BUYER — confirm a sale → create the seller's commission
// ─────────────────────────────────────────────────────────────
async function confirm(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return next(new AppError("Sale not found.", 404));
    if (!sale.buyerId || sale.buyerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only confirm your own purchases.", 403));
    }
    if (sale.status !== "pending") {
      return next(new AppError("This sale is not pending confirmation.", 400));
    }

    sale.buyerConfirmed = true;
    sale.status = "confirmed";
    sale.confirmedAt = new Date();

    // Build the listing context for the commission (rate/consent live on it).
    const listing = await modelFor(sale.listingType).findById(sale.listingId);
    const listingObj = listing || {
      sellerId: sale.sellerId,
      _id: sale.listingId,
      title: sale.listingTitle,
      commissionConsent: {},
    };

    const limits = await getEffectiveLimits(sale.sellerId);
    const commission = await Commission.createForSale(listingObj, sale.listingType, sale.salePrice, limits.graceDays);
    if (commission) sale.commissionId = commission._id;
    await sale.save();

    respond(res, 200, { sale, commission }, "Purchase confirmed. Thank you!");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// BUYER — dispute a reported sale
// ─────────────────────────────────────────────────────────────
async function dispute(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return next(new AppError("Sale not found.", 404));
    if (!sale.buyerId || sale.buyerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only dispute your own purchases.", 403));
    }
    if (sale.status !== "pending") {
      return next(new AppError("This sale can no longer be disputed.", 400));
    }

    sale.status = "disputed";
    sale.disputeNote = req.body.note || "";
    await sale.save();

    respond(res, 200, sale, "Sale marked as disputed. Our team will review it.");
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyPurchases, confirm, dispute };
