/**
 * Admin Controller
 * ─────────────────
 * Analytics + management for the admin dashboard.
 *   getOverview    → GET   /api/admin/overview        (platform-wide stats)
 *   listSubscribers→ GET   /api/admin/subscribers     (active dealers + plan/expiry)
 *   listUsers      → GET   /api/admin/users           (search/filter accounts)
 *   setUserRole    → PATCH /api/admin/users/:id/role  (promote/demote)
 *   setUserBan     → PATCH /api/admin/users/:id/ban   (ban/unban)
 *
 * All routes are admin-only (enforced in admin.routes.js).
 */

const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Part = require("../models/Part");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Commission = require("../models/Commission");
const Sale = require("../models/Sale");
const pricing = require("../config/pricing");
const { AppError } = require("../middleware/error.middleware");
const { getPaginationMeta } = require("../utils/apiFeatures");

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

const respond = (res, statusCode, data, message = "Success", pagination = null) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
};

// Turn an aggregate [{ _id: key, ... }] into a plain { key: value } map.
function toMap(rows, valueField = "count") {
  return rows.reduce((acc, r) => {
    acc[r._id ?? "unknown"] = r[valueField];
    return acc;
  }, {});
}

// Active = live listing the public can see.
function activeMatch(extra = {}) {
  return { status: "active", expiresAt: { $gt: new Date() }, ...extra };
}

// Per-model listing breakdown: total / active / featured / premium / sold.
async function listingStats(Model) {
  const [total, active, featured, premium, sold] = await Promise.all([
    Model.countDocuments({}),
    Model.countDocuments(activeMatch()),
    Model.countDocuments(activeMatch({ featured: true })),
    Model.countDocuments(activeMatch({ adType: "premium" })),
    Model.countDocuments({ status: "sold" }),
  ]);
  return { total, active, featured, premium, sold };
}

// Daily counts for the last TREND_DAYS, grouped by the createdAt date string.
async function dailyCounts(Model) {
  const since = new Date(Date.now() - TREND_DAYS * DAY_MS);
  const rows = await Model.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
  ]);
  return rows.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {});
}

// Build a zero-padded [{ date, count }] series for the last TREND_DAYS,
// summing one or more date→count maps (e.g. vehicles + parts).
function buildSeries(...maps) {
  const out = [];
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const count = maps.reduce((s, m) => s + (m[key] || 0), 0);
    out.push({ date: key, count });
  }
  return out;
}

// Monthly-equivalent revenue for an active subscription row.
// Annual billing charges 10 months' price for 12 months of cover, so the
// monthly-equivalent is (monthly * 10) / 12.
function mrrFor(planKey, cycle, count) {
  const plan = pricing.getPlan(planKey);
  if (!plan) return 0;
  const monthly = cycle === "annual" ? (plan.monthly * 10) / 12 : plan.monthly;
  return Math.round(monthly * count);
}

async function getOverview(req, res, next) {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * DAY_MS);
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const last7 = new Date(now.getTime() - 7 * DAY_MS);
    const last30 = new Date(now.getTime() - 30 * DAY_MS);

    const [
      usersByRole,
      vehicleSellerIds,
      partSellerIds,
      buyerIds,
      vehicles,
      parts,
      subsByPlanCycle,
      expiringSoon,
      pendingPayments,
      verifiedRevenue,
      commissionsByStatus,
      salesAgg,
      signupsToday, signups7, signups30,
      disputedSales, pendingVehicles, pendingParts,
      recentSignups, recentVehicles, recentParts, recentSales,
      uDaily, vDaily, pDaily, sDaily,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Vehicle.distinct("sellerId"),
      Part.distinct("sellerId"),
      Sale.distinct("buyerId", { buyerId: { $ne: null } }),
      listingStats(Vehicle),
      listingStats(Part),
      Subscription.aggregate([
        { $match: { status: "active", currentPeriodEnd: { $gt: now } } },
        { $group: { _id: { plan: "$planKey", cycle: "$billingCycle" }, count: { $sum: 1 } } },
      ]),
      Subscription.countDocuments({ status: "active", currentPeriodEnd: { $gt: now, $lte: soon } }),
      Payment.countDocuments({ type: "subscription", status: "pending" }),
      Payment.aggregate([{ $match: { status: "verified" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Commission.aggregate([{ $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),
      Sale.aggregate([{ $group: { _id: "$listingType", count: { $sum: 1 }, value: { $sum: "$salePrice" } } }]),
      User.countDocuments({ createdAt: { $gte: startToday } }),
      User.countDocuments({ createdAt: { $gte: last7 } }),
      User.countDocuments({ createdAt: { $gte: last30 } }),
      Sale.countDocuments({ status: "disputed" }),
      Vehicle.countDocuments({ status: "pending" }),
      Part.countDocuments({ status: "pending" }),
      User.find().sort({ createdAt: -1 }).limit(6).select("name email role plan createdAt").lean(),
      Vehicle.find().sort({ createdAt: -1 }).limit(6).select("title price priceDisplay featured adType createdAt").lean(),
      Part.find().sort({ createdAt: -1 }).limit(6).select("title price priceDisplay featured adType createdAt").lean(),
      Sale.find().sort({ createdAt: -1 }).limit(6).select("listingTitle listingType salePrice status createdAt").lean(),
      dailyCounts(User), dailyCounts(Vehicle), dailyCounts(Part), dailyCounts(Sale),
    ]);

    const roleMap = toMap(usersByRole);
    const sellerSet = new Set([...vehicleSellerIds, ...partSellerIds].map(String));
    const salesMap = salesAgg.reduce((acc, r) => { acc[r._id] = { count: r.count, value: r.value }; return acc; }, {});
    const commissions = commissionsByStatus.reduce((acc, r) => { acc[r._id ?? "unknown"] = { count: r.count, amount: r.amount }; return acc; }, {});

    // Subscriptions: per-plan counts + MRR (monthly-equivalent revenue).
    const activeByPlan = {};
    let activeTotal = 0;
    let mrr = 0;
    for (const row of subsByPlanCycle) {
      const { plan, cycle } = row._id;
      activeByPlan[plan] = (activeByPlan[plan] || 0) + row.count;
      activeTotal += row.count;
      mrr += mrrFor(plan, cycle, row.count);
    }

    const subscriptionRevenue = verifiedRevenue[0]?.total || 0;
    const commissionsPaid = commissions.paid?.amount || 0;

    // Merge + sort vehicles/parts into one recent-listings feed.
    const recentListings = [...recentVehicles.map((v) => ({ ...v, kind: "Vehicle" })), ...recentParts.map((p) => ({ ...p, kind: "Part" }))]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6);

    respond(res, 200, {
      accounts: {
        total: (roleMap.user || 0) + (roleMap.dealer || 0) + (roleMap.admin || 0),
        buyers: buyerIds.length,
        regularUsers: roleMap.user || 0,
        dealers: roleMap.dealer || 0,
        admins: roleMap.admin || 0,
        activeSellers: sellerSet.size,
        newSignups: { today: signupsToday, last7: signups7, last30: signups30 },
      },
      vehicles,
      parts,
      ads: {
        total: vehicles.total + parts.total,
        active: vehicles.active + parts.active,
        featured: vehicles.featured + parts.featured,
        premium: vehicles.premium + parts.premium,
        sold: vehicles.sold + parts.sold,
      },
      subscriptions: { activeByPlan, activeTotal, expiringSoon, pendingPayments, mrr },
      sales: {
        vehiclesSold: salesMap.Vehicle?.count || 0,
        partsSold: salesMap.Part?.count || 0,
        totalSales: (salesMap.Vehicle?.count || 0) + (salesMap.Part?.count || 0),
        grossValue: (salesMap.Vehicle?.value || 0) + (salesMap.Part?.value || 0),
      },
      finance: {
        subscriptionRevenue,
        commissionsPaid,
        platformEarnings: subscriptionRevenue + commissionsPaid,
        commissions,
      },
      moderation: {
        pendingPayments,
        disputedSales,
        pendingListings: pendingVehicles + pendingParts,
      },
      recent: { signups: recentSignups, listings: recentListings, sales: recentSales },
      trends: {
        signups: buildSeries(uDaily),
        listings: buildSeries(vDaily, pDaily),
        sales: buildSeries(sDaily),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Active subscribers (dealers) with their plan + expiry, soonest-expiry first.
 */
async function listSubscribers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;

    const filter = { status: "active", currentPeriodEnd: { $gt: new Date() } };
    if (req.query.plan) filter.planKey = req.query.plan;

    const [subs, total] = await Promise.all([
      Subscription.find(filter)
        .populate("userId", "name email phone city totalAds createdAt")
        .sort({ currentPeriodEnd: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    respond(res, 200, subs, "Subscribers fetched", getPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
}

/**
 * Search/filter accounts for the user-management table.
 */
async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.q) {
      const rx = { $regex: req.query.q.trim(), $options: "i" };
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("name email phone role plan totalAds isBanned createdAt")
        .lean(),
      User.countDocuments(filter),
    ]);

    respond(res, 200, users, "Users fetched", getPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
}

const ROLES = ["user", "dealer", "admin"];

/**
 * Change a user's role. Cannot change your own (avoids self-lockout).
 */
async function setUserRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) return next(new AppError("Invalid role.", 400));
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError("You can't change your own role.", 400));
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
      .select("name email role plan isBanned");
    if (!user) return next(new AppError("User not found.", 404));

    respond(res, 200, user, `Role updated to ${role}.`);
  } catch (err) {
    next(err);
  }
}

/**
 * Ban / unban a user. Cannot ban yourself or another admin.
 */
async function setUserBan(req, res, next) {
  try {
    const banned = Boolean(req.body.banned);
    if (req.params.id === req.user._id.toString()) {
      return next(new AppError("You can't ban your own account.", 400));
    }

    const target = await User.findById(req.params.id).select("role isBanned");
    if (!target) return next(new AppError("User not found.", 404));
    if (banned && target.role === "admin") {
      return next(new AppError("You can't ban another admin.", 400));
    }

    target.isBanned = banned;
    target.banReason = banned ? (req.body.reason || "") : "";
    await target.save({ validateBeforeSave: false });

    respond(res, 200, { _id: target._id, isBanned: target.isBanned }, banned ? "User banned." : "User unbanned.");
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview, listSubscribers, listUsers, setUserRole, setUserBan };
