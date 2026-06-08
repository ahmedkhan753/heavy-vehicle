/**
 * Subscription Maintenance
 * ────────────────────────
 * Periodic sweep that:
 *   - expires lapsed subscriptions and downgrades their featured ads,
 *   - clears one-time boosts that have run out,
 *   - reminds sellers (daily, in the final week) to renew an expiring ad,
 *   - deletes ads past their 30-day life and purges their Cloudinary images.
 * Runs on a simple interval (no external cron dependency).
 */

const Subscription = require("../models/Subscription");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const User = require("../models/User");
const pricing = require("../config/pricing");
const { deleteFromCloudinary } = require("../config/cloudinary");
const { sendRenewalReminder } = require("./email");

const DAY_MS = 24 * 60 * 60 * 1000;
// Start nagging this many days before an ad is removed.
const REMINDER_WINDOW_DAYS = 7;
// Don't re-send a reminder more than once per (roughly) day.
const REMINDER_THROTTLE_MS = 20 * 60 * 60 * 1000;

/**
 * User IDs whose listings are exempt from auto-deletion / reminders:
 * anyone with an active Pro-or-higher subscription.
 * @returns {Promise<Array>}
 */
async function getExemptUserIds() {
  const exemptSubs = await Subscription.find({
    planKey: { $in: pricing.DELETION_EXEMPT_PLANS },
    status: "active",
    currentPeriodEnd: { $gt: new Date() },
  }).select("userId");
  return exemptSubs.map((s) => s.userId);
}

/**
 * Expire subscriptions past their period end and free their featured ads.
 * @returns {Promise<{expired:number, downgraded:number}>}
 */
async function runExpirySweep() {
  const now = new Date();

  // Find subscriptions that have lapsed.
  const lapsed = await Subscription.find({
    status: "active",
    currentPeriodEnd: { $lte: now },
  }).select("_id userId");

  if (!lapsed.length) return { expired: 0, downgraded: 0 };

  const userIds = lapsed.map((s) => s.userId);

  // Mark them expired.
  await Subscription.updateMany(
    { _id: { $in: lapsed.map((s) => s._id) } },
    { status: "expired" }
  );

  // Downgrade those users' featured listings back to free.
  // (Only featured ones; a user with a fresh subscription is excluded
  //  because their sub wouldn't be in the lapsed set.)
  const result = await Vehicle.updateMany(
    { sellerId: { $in: userIds }, featured: true },
    { $set: { featured: false, adType: "free" } }
  );

  // Reset their plan tier everywhere it's shown (account + listing badges).
  await User.updateMany({ _id: { $in: userIds } }, { $set: { plan: "free" } });
  await Vehicle.updateMany({ sellerId: { $in: userIds } }, { $set: { "seller.plan": "free" } });
  await Part.updateMany({ sellerId: { $in: userIds } }, { $set: { "seller.plan": "free" } });

  return { expired: lapsed.length, downgraded: result.modifiedCount || 0 };
}

/**
 * Expire one-time boosts: clear featured/premium whose featuredUntil has
 * passed, and remove urgent tags past urgentUntil. Also backfill bumpedAt
 * for any legacy listings missing it (so "newest" sort stays correct).
 */
async function runBoostSweep() {
  const now = new Date();
  for (const Model of [Vehicle, Part]) {
    // Backfill missing bumpedAt from createdAt (self-healing for old docs).
    // Mongoose 9 rejects array (pipeline) updates unless updatePipeline is set.
    await Model.updateMany(
      { bumpedAt: { $exists: false } },
      [{ $set: { bumpedAt: "$createdAt" } }],
      { updatePipeline: true }
    );

    // Lapsed one-time featured/premium → back to free.
    await Model.updateMany(
      { featured: true, featuredUntil: { $lte: now } },
      { $set: { featured: false, adType: "free" }, $unset: { featuredUntil: "" } }
    );

    // Lapsed urgent tags.
    await Model.updateMany(
      { urgent: true, urgentUntil: { $lte: now } },
      { $set: { urgent: false }, $unset: { urgentUntil: "" } }
    );
  }
}

/**
 * Remind sellers whose active ads expire within the reminder window so they
 * can renew (Rs extend30) before the ad is deleted. Throttled to ~once a day
 * per ad via lastRenewalReminderAt. Pro+ sellers are skipped (their ads don't
 * expire). Reminders are best-effort: a failed email won't stamp the ad, so
 * it'll be retried on the next sweep.
 * @returns {Promise<{reminded:number}>}
 */
async function runRenewalReminderSweep() {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * DAY_MS);
  const throttleBefore = new Date(now.getTime() - REMINDER_THROTTLE_MS);
  const extendPrice = pricing.ADDONS.extend30.price;
  const exemptUserIds = await getExemptUserIds();

  const filter = {
    status: "active",
    sellerId: { $nin: exemptUserIds },
    expiresAt: { $gt: now, $lte: windowEnd },
    $or: [
      { lastRenewalReminderAt: { $exists: false } },
      { lastRenewalReminderAt: null },
      { lastRenewalReminderAt: { $lte: throttleBefore } },
    ],
  };

  let reminded = 0;
  for (const Model of [Vehicle, Part]) {
    const due = await Model.find(filter)
      .select("_id title expiresAt sellerId")
      .populate("sellerId", "name email")
      .limit(200);

    for (const ad of due) {
      const seller = ad.sellerId;
      if (!seller?.email) continue;
      const daysLeft = Math.max(1, Math.ceil((ad.expiresAt.getTime() - now.getTime()) / DAY_MS));
      try {
        await sendRenewalReminder(seller, ad, daysLeft, extendPrice);
        await Model.updateOne({ _id: ad._id }, { lastRenewalReminderAt: now });
        reminded += 1;
      } catch (err) {
        console.error(`Renewal reminder failed for ${Model.modelName} ${ad._id}:`, err.message);
      }
    }
  }

  return { reminded };
}

/**
 * Delete listings past their 30-day lifespan — both unsold ads whose
 * expiresAt has passed and sold ads 30 days after the sale — and purge their
 * Cloudinary images so they don't orphan. Sellers on a Pro-or-higher plan
 * (DELETION_EXEMPT_PLANS) are skipped: their inventory stays live while the
 * plan is active.
 * @returns {Promise<{vehicles:number, parts:number, images:number, exemptSellers:number}>}
 */
async function runDeletionSweep() {
  const now = new Date();
  const soldCutoff = new Date(now.getTime() - pricing.LISTING_LIFESPAN_DAYS * DAY_MS);
  const exemptUserIds = await getExemptUserIds();

  // A listing is past its life if it's unsold and expired, OR it sold more
  // than the lifespan ago. Exempt sellers are excluded entirely.
  const filter = {
    sellerId: { $nin: exemptUserIds },
    $or: [
      { status: { $ne: "sold" }, expiresAt: { $lte: now } },
      { status: "sold", soldAt: { $lte: soldCutoff } },
    ],
  };

  const counts = { vehicles: 0, parts: 0, images: 0, exemptSellers: exemptUserIds.length };

  for (const [Model, key] of [[Vehicle, "vehicles"], [Part, "parts"]]) {
    // Pull the images first so we can clean up Cloudinary, then delete in bulk.
    const doomed = await Model.find(filter).select("_id images").limit(500);
    if (!doomed.length) continue;

    for (const ad of doomed) {
      for (const img of ad.images || []) {
        if (!img.publicId) continue;
        // Best-effort: a Cloudinary hiccup must not block the DB cleanup.
        await deleteFromCloudinary(img.publicId).then(
          () => { counts.images += 1; },
          (err) => console.error(`Image purge failed (${img.publicId}):`, err.message)
        );
      }
    }

    const res = await Model.deleteMany({ _id: { $in: doomed.map((d) => d._id) } });
    counts[key] = res.deletedCount || 0;
  }

  return counts;
}

/**
 * Start the recurring sweep. Returns the interval handle.
 * @param {number} intervalMs - default 1 hour
 */
async function runAllSweeps() {
  await runExpirySweep();
  await runBoostSweep();
  // Remind before deleting, so an ad expiring this hour still gets a heads-up.
  await runRenewalReminderSweep();
  await runDeletionSweep();
}

function startSubscriptionMaintenance(intervalMs = 60 * 60 * 1000) {
  // Run once shortly after boot, then on the interval.
  const kickoff = setTimeout(() => {
    runAllSweeps().catch((err) => console.error("Maintenance sweep failed:", err.message));
  }, 10 * 1000);
  kickoff.unref?.();

  const handle = setInterval(() => {
    runAllSweeps().catch((err) => console.error("Maintenance sweep failed:", err.message));
  }, intervalMs);
  handle.unref?.();

  return handle;
}

module.exports = { runExpirySweep, runBoostSweep, runRenewalReminderSweep, runDeletionSweep, runAllSweeps, startSubscriptionMaintenance };
