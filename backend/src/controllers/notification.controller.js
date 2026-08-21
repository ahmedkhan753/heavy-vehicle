/**
 * Notifications
 * ─────────────
 * Two read-only endpoints that power the badge/alert UI:
 *
 *   adminPendingCounts → GET /api/notifications/admin-counts  (admin)
 *   myNotifications    → GET /api/notifications/me            (any user)
 *
 * Both are pure counts/summaries — nothing here mutates state. They're
 * polled by the nav components, so every query is a countDocuments on an
 * indexed field rather than a find(); the admin one runs ~10 of those in
 * a single Promise.all.
 *
 * "Pending" deliberately means *needs a human decision*, not merely
 * "recent". A tab only lights up when the admin actually has something to
 * approve, verify or review — otherwise the badges become wallpaper and
 * stop being read.
 */

const Advertisement = require("../models/Advertisement");
const Business = require("../models/Business");
const Commission = require("../models/Commission");
const Conversation = require("../models/Conversation");
const Dealer = require("../models/Dealer");
const Inspector = require("../models/Inspector");
const Part = require("../models/Part");
const Payment = require("../models/Payment");
const Report = require("../models/Report");
const ServiceRequest = require("../models/ServiceRequest");
const Subscription = require("../models/Subscription");
const Vehicle = require("../models/Vehicle");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// How far ahead an expiry/due date counts as "coming up" for user alerts.
const SOON_DAYS = 7;
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const daysUntil = (date) => Math.ceil((new Date(date) - Date.now()) / (24 * 60 * 60 * 1000));

/**
 * Per-tab counts of items awaiting an admin decision. Keys match the tab
 * hrefs in AdminNav so the client can look them up directly.
 */
async function adminPendingCounts(req, res, next) {
  try {
    const [
      dealers,
      businesses,
      reports,
      ads,
      payments,
      upgrades,
      commissions,
      requests,
      warranty,
      inspectors,
      pendingVehicles,
      pendingParts,
    ] = await Promise.all([
      Dealer.countDocuments({ approvalStatus: "pending" }),
      Business.countDocuments({ approvalStatus: "pending" }),
      Report.countDocuments({ status: "pending" }),
      Advertisement.countDocuments({ status: "pending" }),
      Payment.countDocuments({ type: "subscription", status: "pending" }),
      Payment.countDocuments({ type: "upgrade", status: "pending" }),
      // Only overdue commissions ping the admin — a commission that's due
      // next week isn't an action item yet.
      Commission.countDocuments({ status: "due", dueAt: { $lte: new Date() } }),
      ServiceRequest.countDocuments({ serviceType: "inspection", status: "pending" }),
      ServiceRequest.countDocuments({ serviceType: "warranty", status: "pending" }),
      Inspector.countDocuments({ isVerified: false, isActive: true }),
      Vehicle.countDocuments({ status: "pending" }),
      Part.countDocuments({ status: "pending" }),
    ]);

    const counts = {
      "/admin/dealers": dealers,
      "/admin/businesses": businesses,
      "/admin/reports": reports,
      "/admin/ads": ads,
      "/admin/payments": payments,
      "/admin/upgrades": upgrades,
      "/admin/commissions": commissions,
      "/admin/requests": requests,
      "/admin/warranty": warranty,
      "/admin/inspectors": inspectors,
    };

    respond(res, 200, {
      counts,
      // Surfaced on the overview tab itself so a listing stuck in
      // moderation isn't invisible just because it has no dedicated tab.
      pendingListings: pendingVehicles + pendingParts,
      total: Object.values(counts).reduce((sum, n) => sum + n, 0),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * A user's own unread count + time-sensitive alerts.
 *
 * Alerts are returned pre-rendered (message + href + severity) rather than
 * as raw dates, so the badge UI doesn't have to re-implement the
 * "expiring in N days" phrasing in two languages and two components.
 */
async function myNotifications(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const soon = daysFromNow(SOON_DAYS);

    const [conversations, subscription, overdueCommissions, dueSoonCommissions, expiringVehicles, expiringParts] =
      await Promise.all([
        Conversation.find({ $or: [{ buyer: userId }, { seller: userId }] })
          .select("buyer seller buyerUnread sellerUnread")
          .lean(),
        Subscription.findOne({ userId, status: "active", currentPeriodEnd: { $gt: now } })
          .select("planKey currentPeriodEnd")
          .lean(),
        Commission.countDocuments({ userId, status: "due", dueAt: { $lte: now } }),
        Commission.countDocuments({ userId, status: "due", dueAt: { $gt: now, $lte: soon } }),
        Vehicle.countDocuments({ sellerId: userId, status: "active", expiresAt: { $gt: now, $lte: soon } }),
        Part.countDocuments({ sellerId: userId, status: "active", expiresAt: { $gt: now, $lte: soon } }),
      ]);

    const unreadMessages = conversations.reduce((total, c) => {
      const isBuyer = String(c.buyer) === String(userId);
      return total + (isBuyer ? c.buyerUnread || 0 : c.sellerUnread || 0);
    }, 0);

    const alerts = [];

    if (overdueCommissions > 0) {
      alerts.push({
        id: "commission-overdue",
        severity: "critical",
        key: "alert.commissionOverdue",
        count: overdueCommissions,
        href: "/dashboard/commissions",
      });
    } else if (dueSoonCommissions > 0) {
      alerts.push({
        id: "commission-due-soon",
        severity: "warning",
        key: "alert.commissionDueSoon",
        count: dueSoonCommissions,
        href: "/dashboard/commissions",
      });
    }

    if (subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) <= soon) {
      alerts.push({
        id: "subscription-expiring",
        severity: "warning",
        key: "alert.subscriptionExpiring",
        days: Math.max(daysUntil(subscription.currentPeriodEnd), 0),
        plan: subscription.planKey,
        href: "/dashboard/billing",
      });
    }

    const expiringAds = expiringVehicles + expiringParts;
    if (expiringAds > 0) {
      alerts.push({
        id: "ads-expiring",
        severity: "warning",
        key: "alert.adsExpiring",
        count: expiringAds,
        href: "/dashboard/my-ads",
      });
    }

    respond(res, 200, {
      counts: { "/dashboard/messages": unreadMessages },
      alerts,
      // One number for the collapsed mobile menu button: unread messages
      // plus anything needing attention.
      total: unreadMessages + alerts.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { adminPendingCounts, myNotifications };
