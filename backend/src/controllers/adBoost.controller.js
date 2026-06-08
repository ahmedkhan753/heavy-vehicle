/**
 * Ad Boost Controller
 * ───────────────────
 * One-time, per-listing paid upgrades & add-ons for any seller (no
 * subscription required). Same manual-payment + admin-verify flow as
 * subscriptions; on verify the boost is applied to the listing.
 *
 * Seller:
 *   getOptions → GET  /api/ad-upgrades/options
 *   checkout   → POST /api/ad-upgrades/checkout
 * Admin:
 *   adminList   → GET   /api/ad-upgrades/admin
 *   adminVerify → PATCH /api/ad-upgrades/admin/:id/verify
 *   adminReject → PATCH /api/ad-upgrades/admin/:id/reject
 */

const Payment = require("../models/Payment");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const { AppError } = require("../middleware/error.middleware");
const pricing = require("../config/pricing");
const { getGateway } = require("../services/payments/gateway");
const { fulfillBoostPayment } = require("../utils/fulfillment");
const { env } = require("../config/env");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// applyBoost now lives in utils/fulfillment.js so the Safepay webhook and the
// admin-verify path apply boosts through identical, idempotent code.
const modelFor = (type) => (type === "Vehicle" ? Vehicle : type === "Part" ? Part : null);

// ─────────────────────────────────────────────────────────────
// GET OPTIONS (public)
// ─────────────────────────────────────────────────────────────
async function getOptions(req, res, next) {
  try {
    respond(res, 200, {
      currency: pricing.CURRENCY,
      boosts: Object.values(pricing.BOOSTS),
      payment: pricing.MANUAL_PAYMENT,
      methods: pricing.PAYMENT_METHODS,
      cardEnabled: getGateway("safepay").isEnabled(),
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// CHECKOUT — buy a boost for one of your listings (manual rail)
// ─────────────────────────────────────────────────────────────
async function checkout(req, res, next) {
  try {
    const { listingType, listingId, item, method, proof, reference } = req.body;

    const boost = pricing.getBoost(item);
    if (!boost) return next(new AppError("Invalid boost selected.", 400));

    const Model = modelFor(listingType);
    if (!Model) return next(new AppError("Invalid listing type.", 400));
    if (!pricing.PAYMENT_METHODS.includes(method)) {
      return next(new AppError("Invalid payment method.", 400));
    }
    if (!proof?.url || !reference) {
      return next(new AppError("Please upload your payment proof and enter the transaction reference.", 400));
    }

    const listing = await Model.findById(listingId);
    if (!listing) return next(new AppError("Listing not found.", 404));
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only boost your own listings.", 403));
    }

    const payment = await Payment.create({
      userId: req.user._id,
      type: boost.kind, // "upgrade" | "addon"
      amount: boost.price,
      currency: pricing.CURRENCY,
      method,
      status: "pending",
      proof: { url: proof.url, publicId: proof.publicId || "" },
      reference,
      relatedType: listingType,
      relatedId: listingId,
      meta: { listingType, listingId, item, listingTitle: listing.title },
    });

    respond(res, 201, { payment }, "Payment submitted. Your boost applies once verified.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// CHECKOUT (CARD) — Safepay hosted-checkout session for a boost.
// On success the signed webhook applies the boost (no admin step).
// ─────────────────────────────────────────────────────────────
async function checkoutCard(req, res, next) {
  try {
    const gateway = getGateway("safepay");
    if (!gateway.isEnabled()) {
      return next(new AppError("Card payments are not available right now.", 400));
    }

    const { listingType, listingId, item } = req.body;

    const boost = pricing.getBoost(item);
    if (!boost) return next(new AppError("Invalid boost selected.", 400));

    const Model = modelFor(listingType);
    if (!Model) return next(new AppError("Invalid listing type.", 400));

    const listing = await Model.findById(listingId);
    if (!listing) return next(new AppError("Listing not found.", 404));
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only boost your own listings.", 403));
    }

    const payment = await Payment.create({
      userId: req.user._id,
      type: boost.kind, // "upgrade" | "addon"
      amount: boost.price,
      currency: pricing.CURRENCY,
      method: "card",
      gateway: "safepay",
      status: "pending",
      relatedType: listingType,
      relatedId: listingId,
      meta: { listingType, listingId, item, listingTitle: listing.title },
    });

    const base = env.PUBLIC_APP_URL;
    const session = await gateway.createCheckoutSession({
      amount: boost.price,
      currency: pricing.CURRENCY,
      orderId: payment._id.toString(),
      customer: { name: req.user.name, email: req.user.email, phone: req.user.phone },
      redirectUrl: `${base}/payment/callback?paymentId=${payment._id}`,
      cancelUrl: `${base}/dashboard/my-ads?payment=cancelled`,
    });

    payment.gatewayRef = session.tracker;
    await payment.save();

    respond(res, 201, { checkoutUrl: session.checkoutUrl, paymentId: payment._id }, "Redirecting to secure checkout.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — list upgrade/addon payments
// ─────────────────────────────────────────────────────────────
async function adminList(req, res, next) {
  try {
    const filter = { type: { $in: ["upgrade", "addon"] } };
    if (req.query.status) filter.status = req.query.status;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(100, parseInt(req.query.limit) || 50))
      .populate("userId", "name email phone")
      .lean();

    respond(res, 200, payments);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — verify a payment → apply the boost
// ─────────────────────────────────────────────────────────────
async function adminVerify(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError("Payment not found.", 404));
    if (!["upgrade", "addon"].includes(payment.type)) {
      return next(new AppError("Not a boost payment.", 400));
    }
    if (payment.status === "verified") {
      return next(new AppError("This payment is already verified.", 400));
    }

    // Same fulfillment the Safepay webhook uses — single source of truth.
    await fulfillBoostPayment(payment, {
      reviewedBy: req.user._id,
      reviewNote: req.body.note || "",
    });

    respond(res, 200, payment, "Payment verified and boost applied.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — reject a payment
// ─────────────────────────────────────────────────────────────
async function adminReject(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError("Payment not found.", 404));

    payment.status = "rejected";
    payment.reviewedBy = req.user._id;
    payment.reviewedAt = new Date();
    payment.reviewNote = req.body.note || "";
    await payment.save();

    respond(res, 200, payment, "Payment rejected.");
  } catch (err) {
    next(err);
  }
}

module.exports = { getOptions, checkout, checkoutCard, adminList, adminVerify, adminReject };
