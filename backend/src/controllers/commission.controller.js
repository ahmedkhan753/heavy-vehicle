/**
 * Commission Controller
 * ─────────────────────
 * Seller:
 *   getMine → GET  /api/commissions/me
 *   pay     → POST /api/commissions/:id/pay   (submit proof of payment)
 * Admin:
 *   adminList     → GET   /api/commissions/admin
 *   adminMarkPaid → PATCH /api/commissions/admin/:id/paid
 *   adminWaive    → PATCH /api/commissions/admin/:id/waive
 */

const Commission = require("../models/Commission");
const Payment = require("../models/Payment");
const { AppError } = require("../middleware/error.middleware");
const pricing = require("../config/pricing");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// ─────────────────────────────────────────────────────────────
// SELLER — my commissions + totals
// ─────────────────────────────────────────────────────────────
async function getMine(req, res, next) {
  try {
    const commissions = await Commission.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const now = Date.now();
    let totalDue = 0;
    let overdue = 0;
    for (const c of commissions) {
      if (c.status === "due") {
        totalDue += c.amount;
        if (c.dueAt && new Date(c.dueAt).getTime() <= now) overdue += 1;
      }
    }

    respond(res, 200, {
      commissions,
      totalDue,
      overdueCount: overdue,
      currency: pricing.CURRENCY,
      payment: pricing.MANUAL_PAYMENT,
      methods: pricing.PAYMENT_METHODS,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// SELLER — submit a payment for a due commission
// ─────────────────────────────────────────────────────────────
async function pay(req, res, next) {
  try {
    const { method, proof, reference } = req.body;

    const commission = await Commission.findById(req.params.id);
    if (!commission) return next(new AppError("Commission not found.", 404));
    if (commission.userId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only pay your own commissions.", 403));
    }
    if (commission.status !== "due") {
      return next(new AppError("This commission is not due.", 400));
    }
    if (!pricing.PAYMENT_METHODS.includes(method)) {
      return next(new AppError("Invalid payment method.", 400));
    }
    if (!proof?.url || !reference) {
      return next(new AppError("Please upload your payment proof and enter the transaction reference.", 400));
    }

    const payment = await Payment.create({
      userId: req.user._id,
      type: "commission",
      amount: commission.amount,
      currency: commission.currency,
      method,
      status: "pending",
      proof: { url: proof.url, publicId: proof.publicId || "" },
      reference,
      relatedType: "Commission",
      relatedId: commission._id,
      meta: { listingTitle: commission.listingTitle },
    });

    commission.paymentId = payment._id;
    await commission.save();

    respond(res, 201, { commission, payment }, "Payment submitted. Awaiting verification.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — list commissions
// ─────────────────────────────────────────────────────────────
async function adminList(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const commissions = await Commission.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(100, parseInt(req.query.limit) || 50))
      .populate("userId", "name email phone")
      .populate("paymentId", "proof reference method status")
      .lean();

    respond(res, 200, commissions);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — mark a commission paid (verifies its linked payment too)
// ─────────────────────────────────────────────────────────────
async function adminMarkPaid(req, res, next) {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) return next(new AppError("Commission not found.", 404));
    if (commission.status === "paid") {
      return next(new AppError("This commission is already paid.", 400));
    }

    commission.status = "paid";
    commission.paidAt = new Date();
    commission.reviewedBy = req.user._id;
    commission.reviewNote = req.body.note || "";
    await commission.save();

    if (commission.paymentId) {
      await Payment.findByIdAndUpdate(commission.paymentId, {
        status: "verified",
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      });
    }

    respond(res, 200, commission, "Commission marked as paid.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — waive a commission
// ─────────────────────────────────────────────────────────────
async function adminWaive(req, res, next) {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) return next(new AppError("Commission not found.", 404));

    commission.status = "waived";
    commission.reviewedBy = req.user._id;
    commission.reviewNote = req.body.note || "";
    await commission.save();

    respond(res, 200, commission, "Commission waived.");
  } catch (err) {
    next(err);
  }
}

module.exports = { getMine, pay, adminList, adminMarkPaid, adminWaive };
