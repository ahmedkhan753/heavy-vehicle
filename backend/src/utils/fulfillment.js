/**
 * Payment Fulfillment — SINGLE SOURCE OF TRUTH
 * ─────────────────────────────────────────────
 * The effects of a *successful* payment (activate a subscription, apply an ad
 * boost) live here so BOTH rails run identical code:
 *   - Manual rail  → admin verifies → fulfillPayment()
 *   - Safepay rail → signed webhook → fulfillPayment()
 *
 * fulfillPayment() is IDEMPOTENT: a Payment already "verified" is a no-op, so
 * webhook retries / double-fires can never double-activate or double-apply.
 */

const Subscription = require("../models/Subscription");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const pricing = require("../config/pricing");
const { syncUserPlan } = require("./planLimits");
const { AppError } = require("../middleware/error.middleware");

const DAY_MS = 24 * 60 * 60 * 1000;
const modelFor = (type) => (type === "Vehicle" ? Vehicle : type === "Part" ? Part : null);

// Stamp the payment as verified with an optional review trail.
// reviewedBy is omitted for gateway (system) fulfillment.
async function markVerified(payment, { reviewedBy, reviewNote } = {}) {
  payment.status = "verified";
  if (reviewedBy) payment.reviewedBy = reviewedBy;
  payment.reviewedAt = new Date();
  if (reviewNote !== undefined) payment.reviewNote = reviewNote;
  await payment.save();
  return payment;
}

// ── Apply a verified boost to its listing ──────────────────────
// (Moved verbatim from adBoost.controller so the webhook can reuse it without
// a circular import.)
async function applyBoost(payment) {
  const Model = modelFor(payment.meta?.listingType);
  if (!Model) return;
  const listing = await Model.findById(payment.meta.listingId);
  if (!listing) return;

  const boost = pricing.getBoost(payment.meta.item);
  if (!boost) return;
  const now = Date.now();

  switch (boost.key) {
    case "featured":
    case "premium":
      listing.featured = true;
      listing.adType = boost.key;
      listing.featuredUntil = new Date(now + boost.durationDays * DAY_MS);
      break;
    case "bump":
      listing.bumpedAt = new Date(now);
      break;
    case "extend30": {
      const base = listing.expiresAt && listing.expiresAt.getTime() > now ? listing.expiresAt.getTime() : now;
      listing.expiresAt = new Date(base + boost.durationDays * DAY_MS);
      break;
    }
    case "urgent":
      listing.urgent = true;
      listing.urgentUntil = new Date(now + boost.durationDays * DAY_MS);
      break;
    default:
      break;
  }

  await listing.save({ validateBeforeSave: false });
}

// ── Activate a subscription payment ────────────────────────────
async function fulfillSubscriptionPayment(payment, opts = {}) {
  const subscription = await Subscription.findById(payment.relatedId);
  if (!subscription) {
    throw new AppError("Linked subscription not found.", 404);
  }

  await markVerified(payment, opts);

  // Supersede any other active subscriptions for this user.
  await Subscription.updateMany(
    { userId: subscription.userId, status: "active", _id: { $ne: subscription._id } },
    { status: "cancelled" }
  );

  const now = new Date();
  subscription.status = "active";
  subscription.startedAt = now;
  subscription.currentPeriodEnd = new Date(now.getTime() + pricing.cycleDays(subscription.billingCycle) * DAY_MS);
  await subscription.save();

  // Promote the account to dealer and sync the plan everywhere it's shown
  // (account theme + the seller.plan badge on all their listings).
  await User.findByIdAndUpdate(subscription.userId, { role: "dealer" });
  await syncUserPlan(subscription.userId, subscription.planKey);

  return { payment, subscription };
}

// ── Apply a verified boost payment ─────────────────────────────
async function fulfillBoostPayment(payment, opts = {}) {
  await markVerified(payment, opts);
  await applyBoost(payment);
  return { payment };
}

/**
 * Fulfill a successful payment by its type. Idempotent.
 * @param {Document} payment - a Payment mongoose document
 * @param {{reviewedBy?: any, reviewNote?: string}} opts
 * @returns {Promise<object>} fulfillment result (shape depends on type)
 */
async function fulfillPayment(payment, opts = {}) {
  // Idempotency guard — already fulfilled, do nothing.
  if (payment.status === "verified") return { payment, alreadyFulfilled: true };

  if (payment.type === "subscription") {
    return fulfillSubscriptionPayment(payment, opts);
  }
  if (payment.type === "upgrade" || payment.type === "addon") {
    return fulfillBoostPayment(payment, opts);
  }

  // "commission" or anything else: just record it as verified.
  await markVerified(payment, opts);
  return { payment };
}

module.exports = {
  fulfillPayment,
  fulfillSubscriptionPayment,
  fulfillBoostPayment,
  applyBoost,
  markVerified,
};
