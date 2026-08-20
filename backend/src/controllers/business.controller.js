/**
 * Business Controller
 * ────────────────────
 * Directory of businesses serving the heavy-vehicle trade.
 *
 * list      → GET   /api/businesses
 * getById   → GET   /api/businesses/:id
 * getMine   → GET   /api/businesses/me
 * register  → POST  /api/businesses/register
 * update    → PUT   /api/businesses/:id
 * adminList / adminReview → admin approval queue
 */

const { validationResult } = require("express-validator");
const Business = require("../models/Business");
const { AppError } = require("../middleware/error.middleware");
const { getPaginationMeta } = require("../utils/apiFeatures");
const { BUSINESS_CATEGORIES } = require("../config/businessCategories");

const respond = (res, statusCode, data, message = "Success", pagination = null) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
};

// Fields an owner must never set on themselves — approval and promotion are
// admin decisions. Without this an owner could PUT approvalStatus:"approved"
// and skip review entirely (the same hole that existed on the dealer route).
const IMMUTABLE = [
  "userId", "approvalStatus", "approvedAt", "rejectedAt",
  "reviewNote", "featured", "views", "createdAt",
];

// ─────────────────────────────────────────────────────────────
// LIST (public — approved only)
// GET /api/businesses?category=workshop&city=karachi&q=…&page=1
// ─────────────────────────────────────────────────────────────
async function list(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { approvalStatus: "approved", isActive: true };
    if (req.query.category) filter.category = String(req.query.category).toLowerCase();
    if (req.query.city) filter.city = { $regex: `^${req.query.city}$`, $options: "i" };

    if (req.query.q) {
      const q = String(req.query.q).trim();
      filter.$or = [
        { businessName: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tagline: { $regex: q, $options: "i" } },
        { area: { $regex: q, $options: "i" } },
      ];
    }

    const [businesses, total] = await Promise.all([
      Business.find(filter)
        // Featured (paid placement) first, then newest.
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Business.countDocuments(filter),
    ]);

    respond(res, 200, businesses, "Businesses fetched", getPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET ONE
// Pending/rejected listings are visible only to their owner and admins.
// ─────────────────────────────────────────────────────────────
async function getById(req, res, next) {
  try {
    const business = await Business.findById(req.params.id)
      .populate("userId", "name city avatar createdAt")
      .lean();

    const isOwner = req.user && business && String(business.userId?._id) === String(req.user._id);
    const isAdmin = req.user?.role === "admin";

    if (!business || !business.isActive || (business.approvalStatus !== "approved" && !isOwner && !isAdmin)) {
      return next(new AppError("Business not found.", 404));
    }

    // View count is a side effect, never blocks the response.
    Business.updateOne({ _id: business._id }, { $inc: { views: 1 } }).catch(() => {});

    respond(res, 200, business);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// MY LISTING
// ─────────────────────────────────────────────────────────────
async function getMine(req, res, next) {
  try {
    const business = await Business.findOne({ userId: req.user._id }).lean();
    respond(res, 200, business || null);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// REGISTER (files an application)
// ─────────────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    // One listing per account. A rejected application can be resubmitted.
    const existing = await Business.findOne({ userId: req.user._id });
    if (existing) {
      if (existing.approvalStatus === "pending") {
        return next(new AppError("Your business listing is already awaiting review.", 409));
      }
      if (existing.approvalStatus === "approved") {
        return next(new AppError("You already have a business listing.", 409));
      }
      await Business.deleteOne({ _id: existing._id });
    }

    const {
      businessName, category, tagline, description,
      phone, whatsapp, email, website,
      city, area, address, workingHours, establishedYear,
    } = req.body;

    const business = await Business.create({
      userId: req.user._id,
      businessName: String(businessName).trim(),
      category: BUSINESS_CATEGORIES.includes(category) ? category : "other",
      tagline: tagline || "",
      description: description || "",
      phone: phone || req.user.phone || "",
      whatsapp: whatsapp || phone || req.user.phone || "",
      email: email || "",
      website: website || "",
      city: String(city).toLowerCase().trim(),
      area: area || "",
      address: address || "",
      workingHours: workingHours || "Mon–Sat: 9am–6pm",
      establishedYear: establishedYear || null,
    });

    respond(res, 201, business, "Business listing submitted. An admin will review it shortly.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE (owner or admin)
// ─────────────────────────────────────────────────────────────
async function update(req, res, next) {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return next(new AppError("Business listing not found.", 404));

    if (business.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only update your own business listing.", 403));
    }

    IMMUTABLE.forEach((f) => delete req.body[f]);
    if (req.body.city) req.body.city = String(req.body.city).toLowerCase().trim();
    if (req.body.category && !BUSINESS_CATEGORIES.includes(req.body.category)) {
      delete req.body.category;
    }

    const updated = await Business.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    respond(res, 200, updated, "Business listing updated");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — application queue
// ─────────────────────────────────────────────────────────────
async function adminList(req, res, next) {
  try {
    const status = ["pending", "approved", "rejected"].includes(req.query.status)
      ? req.query.status
      : "pending";

    const [businesses, counts] = await Promise.all([
      Business.find({ approvalStatus: status })
        .populate("userId", "name email phone city createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Business.aggregate([{ $group: { _id: "$approvalStatus", count: { $sum: 1 } } }]),
    ]);

    respond(res, 200, {
      businesses,
      counts: counts.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — approve / reject
// PATCH /api/businesses/admin/:id/approval  { approve, note }
// ─────────────────────────────────────────────────────────────
async function adminReview(req, res, next) {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return next(new AppError("Business listing not found.", 404));

    const approve = req.body.approve === true;
    business.approvalStatus = approve ? "approved" : "rejected";
    business.reviewNote = req.body.note || "";
    if (approve) business.approvedAt = new Date();
    else business.rejectedAt = new Date();
    await business.save({ validateBeforeSave: false });

    respond(res, 200, business, approve ? "Business approved." : "Business listing rejected.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — toggle featured (paid placement)
// ─────────────────────────────────────────────────────────────
async function adminToggleFeatured(req, res, next) {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return next(new AppError("Business listing not found.", 404));

    business.featured = req.body.featured === true;
    await business.save({ validateBeforeSave: false });

    respond(res, 200, business, business.featured ? "Business featured." : "Business un-featured.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list, getById, getMine, register, update,
  adminList, adminReview, adminToggleFeatured,
};
