/**
 * Subscription Controller
 * ───────────────────────
 * Dealer subscription lifecycle + featured-slot enforcement.
 *
 * Public:
 *   getPlans        → GET  /api/subscriptions/plans
 * Authenticated:
 *   getMine         → GET  /api/subscriptions/me
 *   checkout        → POST /api/subscriptions/checkout      (manual payment)
 *   featureListing  → POST /api/subscriptions/feature/:vehicleId
 *   unfeatureListing→ DELETE /api/subscriptions/feature/:vehicleId
 * Admin:
 *   adminListPayments → GET   /api/subscriptions/admin/payments
 *   adminVerify       → PATCH /api/subscriptions/admin/payments/:id/verify
 *   adminReject       → PATCH /api/subscriptions/admin/payments/:id/reject
 */

const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Vehicle = require("../models/Vehicle");
const { AppError } = require("../middleware/error.middleware");
const pricing = require("../config/pricing");
const { getGateway } = require("../services/payments/gateway");
const { fulfillSubscriptionPayment } = require("../utils/fulfillment");
const { env } = require("../config/env");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// Find the user's currently-usable subscription, if any.
async function findActiveSubscription(userId) {
  return Subscription.findOne({
    userId,
    status: "active",
    currentPeriodEnd: { $gt: new Date() },
  });
}

// Count a seller's live featured / premium listings (consumed slots).
async function countActiveFeatured(userId) {
  return Vehicle.countDocuments({ sellerId: userId, featured: true, status: "active" });
}

// ─────────────────────────────────────────────────────────────
// GET PLANS (public)
// ─────────────────────────────────────────────────────────────
async function getPlans(req, res, next) {
  try {
    const plans = Object.values(pricing.DEALER_PLANS).map((p) => ({
      key: p.key,
      name: p.name,
      monthly: p.monthly,
      annual: pricing.planPrice(p.key, "annual"),
      featuredSlots: p.featuredSlots,
      premiumSlots: p.premiumSlots,
      maxActiveAds: p.maxActiveAds,
      graceDays: p.graceDays,
      unlimitedFeatured: p.featuredSlots === pricing.UNLIMITED,
      unlimitedAds: p.maxActiveAds === pricing.UNLIMITED,
      keepListings: !!p.keepListings,
      commissionRate: pricing.commissionRateForPlan(p.key),
    }));

    respond(res, 200, {
      currency: pricing.CURRENCY,
      free: {
        maxActiveAds: pricing.FREE_PLAN.maxActiveAds,
        graceDays: pricing.FREE_PLAN.graceDays,
      },
      plans,
      payment: pricing.MANUAL_PAYMENT,
      methods: pricing.PAYMENT_METHODS,
      // True when the Safepay card rail is configured — drives the
      // "Pay with Card" button in the UI.
      cardEnabled: getGateway("safepay").isEnabled(),
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET MY SUBSCRIPTION + slot usage (protected)
// ─────────────────────────────────────────────────────────────
async function getMine(req, res, next) {
  try {
    const subscription = await findActiveSubscription(req.user._id);
    const pendingPayment = await Payment.findOne({
      userId: req.user._id,
      type: "subscription",
      status: "pending",
    }).sort({ createdAt: -1 });

    const featuredUsed = await countActiveFeatured(req.user._id);
    const featuredSlots = subscription ? subscription.featuredSlots : 0;

    respond(res, 200, {
      subscription,
      pendingPayment,
      usage: {
        featuredUsed,
        featuredSlots,
        unlimitedFeatured: featuredSlots === pricing.UNLIMITED,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// CHECKOUT — create pending subscription + payment (manual rail)
// ─────────────────────────────────────────────────────────────
async function checkout(req, res, next) {
  try {
    const { planKey, billingCycle = "monthly", method, proof, reference } = req.body;
    const senderName = (req.body.senderName || "").trim();
    const senderNumber = (req.body.senderNumber || "").trim();

    const plan = pricing.getPlan(planKey);
    if (!plan) return next(new AppError("Invalid plan selected.", 400));
    if (!pricing.BILLING_CYCLES.includes(billingCycle)) {
      return next(new AppError("Invalid billing cycle.", 400));
    }
    if (!pricing.PAYMENT_METHODS.includes(method)) {
      return next(new AppError("Invalid payment method.", 400));
    }

    // Manual rails require proof of transfer + who/where it came from.
    if (!proof?.url || !reference) {
      return next(new AppError("Please upload your payment proof and enter the transaction reference.", 400));
    }
    if (!senderName || !senderNumber) {
      return next(new AppError("Please enter the name and account/wallet number you paid from.", 400));
    }

    const amount = pricing.planPrice(planKey, billingCycle);

    // Create the pending subscription (snapshot allowances).
    const subscription = await Subscription.create({
      userId: req.user._id,
      planKey,
      billingCycle,
      status: "pending",
      featuredSlots: plan.featuredSlots,
      premiumSlots: plan.premiumSlots,
    });

    const payment = await Payment.create({
      userId: req.user._id,
      type: "subscription",
      amount,
      currency: pricing.CURRENCY,
      method,
      status: "pending",
      proof: { url: proof.url, publicId: proof.publicId || "" },
      reference,
      payer: { name: senderName, number: senderNumber },
      relatedType: "Subscription",
      relatedId: subscription._id,
      meta: { planKey, billingCycle },
    });

    subscription.lastPaymentId = payment._id;
    await subscription.save();

    respond(res, 201, { subscription, payment }, "Payment submitted. Awaiting verification.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// CHECKOUT (CARD) — create a Safepay hosted-checkout session.
// On success the signed webhook activates the subscription (no admin step).
// ─────────────────────────────────────────────────────────────
async function checkoutCard(req, res, next) {
  try {
    const gateway = getGateway("safepay");
    if (!gateway.isEnabled()) {
      return next(new AppError("Card payments are not available right now.", 400));
    }

    const { planKey, billingCycle = "monthly" } = req.body;
    const plan = pricing.getPlan(planKey);
    if (!plan) return next(new AppError("Invalid plan selected.", 400));
    if (!pricing.BILLING_CYCLES.includes(billingCycle)) {
      return next(new AppError("Invalid billing cycle.", 400));
    }

    // Amount is computed server-side from pricing — never trust the client.
    const amount = pricing.planPrice(planKey, billingCycle);

    // Pending subscription (snapshot allowances) + pending card payment.
    const subscription = await Subscription.create({
      userId: req.user._id,
      planKey,
      billingCycle,
      status: "pending",
      featuredSlots: plan.featuredSlots,
      premiumSlots: plan.premiumSlots,
    });

    const payment = await Payment.create({
      userId: req.user._id,
      type: "subscription",
      amount,
      currency: pricing.CURRENCY,
      method: "card",
      gateway: "safepay",
      status: "pending",
      relatedType: "Subscription",
      relatedId: subscription._id,
      meta: { planKey, billingCycle },
    });

    subscription.lastPaymentId = payment._id;
    await subscription.save();

    const base = env.PUBLIC_APP_URL;
    const session = await gateway.createCheckoutSession({
      amount,
      currency: pricing.CURRENCY,
      orderId: payment._id.toString(),
      customer: { name: req.user.name, email: req.user.email, phone: req.user.phone },
      redirectUrl: `${base}/payment/callback?paymentId=${payment._id}`,
      cancelUrl: `${base}/dashboard/billing?payment=cancelled`,
    });

    payment.gatewayRef = session.tracker;
    await payment.save();

    respond(res, 201, { checkoutUrl: session.checkoutUrl, paymentId: payment._id }, "Redirecting to secure checkout.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// FEATURE A LISTING (consumes a slot)
// ─────────────────────────────────────────────────────────────
async function featureListing(req, res, next) {
  try {
    const subscription = await findActiveSubscription(req.user._id);
    if (!subscription) {
      return next(new AppError("You need an active subscription to feature listings.", 403));
    }

    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return next(new AppError("Listing not found.", 404));
    if (vehicle.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only feature your own listings.", 403));
    }

    if (vehicle.featured) {
      return respond(res, 200, vehicle, "Listing is already featured.");
    }

    // Slot check (UNLIMITED = -1 bypasses the cap).
    if (subscription.featuredSlots !== pricing.UNLIMITED) {
      const used = await countActiveFeatured(req.user._id);
      if (used >= subscription.featuredSlots) {
        return next(new AppError(`All ${subscription.featuredSlots} featured slots are in use. Un-feature a listing or upgrade your plan.`, 400));
      }
    }

    vehicle.featured = true;
    if (vehicle.adType === "free") vehicle.adType = "featured";
    await vehicle.save({ validateBeforeSave: false });

    respond(res, 200, vehicle, "Listing featured.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// UN-FEATURE A LISTING (frees a slot)
// ─────────────────────────────────────────────────────────────
async function unfeatureListing(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return next(new AppError("Listing not found.", 404));
    if (vehicle.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only modify your own listings.", 403));
    }

    vehicle.featured = false;
    if (vehicle.adType === "featured") vehicle.adType = "free";
    await vehicle.save({ validateBeforeSave: false });

    respond(res, 200, vehicle, "Listing un-featured.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — list payments (optionally by status)
// ─────────────────────────────────────────────────────────────
async function adminListPayments(req, res, next) {
  try {
    const filter = { type: "subscription" };
    if (req.query.status) filter.status = req.query.status;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(100, parseInt(req.query.limit) || 50))
      .populate("userId", "name email phone role")
      .lean();

    respond(res, 200, payments);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — verify a payment → activate subscription
// ─────────────────────────────────────────────────────────────
async function adminVerify(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError("Payment not found.", 404));
    if (payment.status === "verified") {
      return next(new AppError("This payment is already verified.", 400));
    }

    // Same fulfillment the Safepay webhook uses — single source of truth.
    const { subscription } = await fulfillSubscriptionPayment(payment, {
      reviewedBy: req.user._id,
      reviewNote: req.body.note || "",
    });

    respond(res, 200, { payment, subscription }, "Payment verified and subscription activated.");
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

    // Cancel the pending subscription tied to it.
    if (payment.relatedId) {
      await Subscription.findOneAndUpdate(
        { _id: payment.relatedId, status: "pending" },
        { status: "cancelled" }
      );
    }

    respond(res, 200, payment, "Payment rejected.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPlans,
  getMine,
  checkout,
  checkoutCard,
  featureListing,
  unfeatureListing,
  adminListPayments,
  adminVerify,
  adminReject,
};
