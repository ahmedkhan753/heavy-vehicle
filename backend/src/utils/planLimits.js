/**
 * Plan Limits
 * ───────────
 * Resolves a user's effective limits (ad cap + commission grace) from their
 * active subscription, falling back to the free tier. Also counts a user's
 * live listings for ad-cap enforcement.
 */

const Subscription = require("../models/Subscription");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const User = require("../models/User");
const pricing = require("../config/pricing");

/**
 * Set a user's current plan everywhere it's denormalized: the User record
 * (account theme) and the seller.plan on all their listings (ad badges).
 * Call on activation (planKey = the new plan) and on expiry (planKey="free").
 * @param {ObjectId|string} userId
 * @param {string} planKey - free | starter | pro | elite | elitePro
 */
async function syncUserPlan(userId, planKey) {
  const plan = planKey || "free";
  await Promise.all([
    User.findByIdAndUpdate(userId, { plan }),
    Vehicle.updateMany({ sellerId: userId }, { $set: { "seller.plan": plan } }),
    Part.updateMany({ sellerId: userId }, { $set: { "seller.plan": plan } }),
  ]);
}

/**
 * @param {ObjectId|string} userId
 * @returns {Promise<{planKey:string, maxActiveAds:number, graceDays:number, commissionRate:number}>}
 *          maxActiveAds === -1 means unlimited.
 */
async function getEffectiveLimits(userId) {
  const sub = await Subscription.findOne({
    userId,
    status: "active",
    currentPeriodEnd: { $gt: new Date() },
  }).select("planKey");

  const plan = sub ? pricing.getPlan(sub.planKey) : null;
  if (plan) {
    return {
      planKey: plan.key,
      maxActiveAds: plan.maxActiveAds,
      graceDays: plan.graceDays,
      commissionRate: pricing.commissionRateForPlan(plan.key),
    };
  }

  return {
    planKey: pricing.FREE_PLAN.key,
    maxActiveAds: pricing.FREE_PLAN.maxActiveAds,
    graceDays: pricing.FREE_PLAN.graceDays,
    commissionRate: pricing.COMMISSION_RATE,
  };
}

/**
 * Count a user's live listings across vehicles and parts — i.e. ads that are
 * actually visible on the site. "Live" means status "active" AND not past
 * expiresAt. Deleted, sold, expired, rejected or draft ads never count, even
 * if the 30-day deletion sweep hasn't removed them from the DB yet.
 * @param {ObjectId|string} userId
 * @returns {Promise<number>}
 */
async function countActiveListings(userId) {
  const now = new Date();
  const [vehicles, parts] = await Promise.all([
    Vehicle.countDocuments({ sellerId: userId, status: "active", expiresAt: { $gt: now } }),
    Part.countDocuments({ sellerId: userId, status: "active", expiresAt: { $gt: now } }),
  ]);
  return vehicles + parts;
}

module.exports = { getEffectiveLimits, countActiveListings, syncUserPlan };
