/**
 * Dealer Controller
 * ──────────────────
 * list      → GET  /api/dealers
 * getById   → GET  /api/dealers/:id
 * register  → POST /api/dealers/register
 * update    → PUT  /api/dealers/:id
 */

const { validationResult } = require("express-validator");
const Dealer               = require("../models/Dealer");
const User                 = require("../models/User");
const Vehicle              = require("../models/Vehicle");
const Part                 = require("../models/Part");
const { AppError }         = require("../middleware/error.middleware");
const { getPaginationMeta }= require("../utils/apiFeatures");

const respond = (res, statusCode, data, message = "Success", pagination = null) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
};

// ─────────────────────────────────────────────────────────────
// LIST DEALERS
// GET /api/dealers?city=karachi&page=1&limit=20
// ─────────────────────────────────────────────────────────────
async function list(req, res, next) {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.city)       filter.city       = { $regex: `^${req.query.city}$`, $options: "i" };
    if (req.query.verified)   filter.isVerified  = true;

    const [dealers, total] = await Promise.all([
      Dealer.find(filter)
        .populate("userId", "name phone city avatar createdAt plan")
        .sort({ isVerified: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Dealer.countDocuments(filter),
    ]);

    const pagination = getPaginationMeta(total, page, limit);
    respond(res, 200, dealers, "Dealers fetched", pagination);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET DEALER BY ID (with their active listings)
// GET /api/dealers/:id
// ─────────────────────────────────────────────────────────────
async function getById(req, res, next) {
  try {
    const dealer = await Dealer.findById(req.params.id)
      .populate("userId", "name phone city avatar createdAt totalAds plan")
      .lean();

    if (!dealer || !dealer.isActive) {
      return next(new AppError("Dealer not found.", 404));
    }

    // The dealer's live listings — both kinds. A parts dealer's storefront
    // was previously empty because only vehicles were queried here.
    const liveFilter = {
      sellerId:  dealer.userId._id,
      status:    "active",
      expiresAt: { $gt: new Date() },
    };

    const [vehicles, parts] = await Promise.all([
      Vehicle.find(liveFilter)
        .sort({ createdAt: -1 })
        .limit(12)
        .select("title shortTitle price priceDisplay year city condition make model type images featured createdAt views")
        .lean(),
      Part.find(liveFilter)
        .sort({ createdAt: -1 })
        .limit(12)
        .select("title price priceDisplay city condition make model category quantity negotiable images coverImage featured createdAt views")
        .lean(),
    ]);

    const listings = vehicles.map((v) => ({ ...v, kind: "vehicle" }));
    const partListings = parts.map((p) => ({ ...p, kind: "part" }));

    respond(res, 200, {
      dealer,
      listings,
      partListings,
      totalActive: vehicles.length + parts.length,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// REGISTER AS DEALER
// POST /api/dealers/register
// Requires: protect middleware
// ─────────────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors:  errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    // Check if already a dealer
    const existingDealer = await Dealer.findOne({ userId: req.user._id });
    if (existingDealer) {
      return next(new AppError("You already have a dealer profile.", 409));
    }

    const {
      businessName, businessType, tagline, description,
      phone, whatsapp, email, website,
      city, address, province,
      specialization, establishedYear, workingHours,
    } = req.body;

    const SPECIALIZATIONS = ["vehicles", "parts", "both"];

    const dealer = await Dealer.create({
      userId:          req.user._id,
      businessName:    businessName.trim(),
      businessType:    businessType || "individual",
      tagline:         tagline || "",
      description:     description || "",
      phone:           phone || req.user.phone,
      whatsapp:        whatsapp || phone || req.user.phone,
      email:           email || "",
      website:         website || "",
      city:            city.toLowerCase().trim(),
      address:         address || "",
      province:        (province || "").toLowerCase(),
      specialization:  SPECIALIZATIONS.includes(specialization) ? specialization : "vehicles",
      establishedYear: establishedYear || null,
      workingHours:    workingHours || "Mon–Sat: 9am–6pm",
    });

    // Upgrade user role to dealer
    await User.findByIdAndUpdate(req.user._id, { role: "dealer" });

    respond(res, 201, dealer, "Dealer profile created successfully");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE DEALER PROFILE
// PUT /api/dealers/:id
// Requires: protect + ownership check
// ─────────────────────────────────────────────────────────────
async function update(req, res, next) {
  try {
    const dealer = await Dealer.findById(req.params.id);

    if (!dealer) return next(new AppError("Dealer profile not found.", 404));

    if (dealer.userId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only update your own dealer profile.", 403));
    }

    // Fields that cannot be changed
    const IMMUTABLE = ["userId", "isVerified", "verifiedAt", "createdAt"];
    IMMUTABLE.forEach((f) => delete req.body[f]);

    if (req.body.city) req.body.city = req.body.city.toLowerCase().trim();

    const updated = await Dealer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    respond(res, 200, updated, "Dealer profile updated");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET MY DEALER PROFILE
// GET /api/dealers/me
// ─────────────────────────────────────────────────────────────
async function getMine(req, res, next) {
  try {
    const dealer = await Dealer.findOne({ userId: req.user._id }).lean();
    respond(res, 200, dealer || null);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// REQUEST WARRANTY BADGE (dealer offers their OWN warranty)
// PATCH /api/dealers/me/warranty   body: { terms }
// ─────────────────────────────────────────────────────────────
async function requestWarranty(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const dealer = await Dealer.findOne({ userId: req.user._id });
    if (!dealer) return next(new AppError("Register as a dealer first to offer warranty.", 404));

    if (!dealer.warranty) dealer.warranty = {};
    dealer.warranty.terms = (req.body.terms || "").trim();
    dealer.warranty.status = "pending";
    dealer.warranty.requestedAt = new Date();
    dealer.warranty.reviewNote = "";
    dealer.markModified("warranty");
    await dealer.save();

    respond(res, 200, dealer, "Warranty badge requested. Awaiting admin review.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — list dealers by warranty status (default: pending)
// GET /api/dealers/admin/warranty?status=pending
// ─────────────────────────────────────────────────────────────
async function adminListWarranty(req, res, next) {
  try {
    const status = req.query.status || "pending";
    const dealers = await Dealer.find({ "warranty.status": status })
      .populate("userId", "name email phone")
      .sort({ "warranty.requestedAt": -1 })
      .limit(200)
      .lean();
    respond(res, 200, dealers);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN — approve / reject a dealer's warranty badge
// PATCH /api/dealers/admin/:id/warranty   body: { approve, note }
// On approval, the badge is mirrored onto all of the dealer's listings.
// ─────────────────────────────────────────────────────────────
async function adminReviewWarranty(req, res, next) {
  try {
    const dealer = await Dealer.findById(req.params.id);
    if (!dealer) return next(new AppError("Dealer not found.", 404));

    const approve = req.body.approve === true;
    if (!dealer.warranty) dealer.warranty = {};
    dealer.warranty.status = approve ? "approved" : "rejected";
    dealer.warranty.reviewNote = req.body.note || "";
    if (approve) dealer.warranty.approvedAt = new Date();
    dealer.markModified("warranty");
    await dealer.save();

    // Keep the denormalized flag on the dealer's listings in sync.
    await Vehicle.updateMany(
      { sellerId: dealer.userId },
      { $set: { "seller.warranty": approve } }
    );

    respond(res, 200, dealer, approve ? "Warranty approved." : "Warranty rejected.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list, getById, register, update,
  getMine, requestWarranty, adminListWarranty, adminReviewWarranty,
};
