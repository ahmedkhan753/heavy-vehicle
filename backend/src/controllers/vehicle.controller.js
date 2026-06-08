/**
 * Vehicle Controller
 * ───────────────────
 * list        → GET  /api/vehicles          (public, with filters)
 * getById     → GET  /api/vehicles/:id      (public)
 * getFeatured → GET  /api/vehicles/featured (public)
 * getSimilar  → GET  /api/vehicles/:id/similar (public)
 * getMyAds    → GET  /api/vehicles/my-ads   (protected)
 * create      → POST /api/vehicles          (protected)
 * update      → PUT  /api/vehicles/:id      (protected, owner only)
 * delete      → DELETE /api/vehicles/:id   (protected, owner only)
 * markAsSold  → PATCH /api/vehicles/:id/sold (protected, owner only)
 * incrementView → POST /api/vehicles/:id/view (public)
 */

const { validationResult } = require("express-validator");
const Vehicle = require("../models/Vehicle");
const User = require("../models/User");
const Dealer = require("../models/Dealer");
const { APIFeatures, getPaginationMeta } = require("../utils/apiFeatures");
const { AppError } = require("../middleware/error.middleware");
const pricing = require("../config/pricing");
const Commission = require("../models/Commission");
const { recordSale } = require("../utils/recordSale");
const { getEffectiveLimits, countActiveListings } = require("../utils/planLimits");
const { localizeListing } = require("../services/translation");

// ── Standard response helper ──────────────────────────────────
const respond = (res, statusCode, data, message = "Success", pagination = null) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
};

// ─────────────────────────────────────────────────────────────
// LIST VEHICLES (with filters, search, sort, pagination)
// GET /api/vehicles
// ─────────────────────────────────────────────────────────────
async function list(req, res, next) {
  try {
    // Build base query — only active, non-expired listings
    const baseQuery = Vehicle.find({
      status: "active",
      expiresAt: { $gt: new Date() },
    });

    // Apply search, filter, sort, paginate via APIFeatures
    const features = new APIFeatures(baseQuery, req.query)
      .search()
      .filter()
      .sort()
      .paginate()
      .selectFields();

    // Run query and count in parallel for performance
    const [vehicles, total] = await Promise.all([
      features.query.lean(),
      Vehicle.countDocuments(features.query.getFilter()),
    ]);

    const pagination = getPaginationMeta(total, features.page, features.limit);

    respond(res, 200, vehicles, "Vehicles fetched", pagination);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET SINGLE VEHICLE
// GET /api/vehicles/:id
// ─────────────────────────────────────────────────────────────
async function getById(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("sellerId", "name phone city avatar isVerifiedSeller totalAds createdAt")
      .lean();

    if (!vehicle) {
      return next(new AppError("Vehicle listing not found.", 404));
    }

    // Don't show inactive listings to non-owners
    if (vehicle.status !== "active" && vehicle.sellerId?._id?.toString() !== req.user?._id?.toString()) {
      return next(new AppError("This listing is not available.", 404));
    }

    // Privacy: only reveal the seller's phone number to logged-in users.
    // Anonymous visitors get everything else but must sign in to contact.
    if (!req.user) {
      if (vehicle.sellerId && typeof vehicle.sellerId === "object") delete vehicle.sellerId.phone;
      if (vehicle.seller && typeof vehicle.seller === "object") {
        delete vehicle.seller.phone;
        delete vehicle.seller.whatsapp;
      }
      vehicle.contactLocked = true;
    }

    respond(res, 200, vehicle);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET FEATURED VEHICLES
// GET /api/vehicles/featured
// ─────────────────────────────────────────────────────────────
async function getFeatured(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);

    const vehicles = await Vehicle.find({
      status: "active",
      featured: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title shortTitle price priceDisplay year city condition make model type images seller featured verified views createdAt")
      .lean();

    respond(res, 200, vehicles);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET SIMILAR VEHICLES
// GET /api/vehicles/:id/similar
// ─────────────────────────────────────────────────────────────
async function getSimilar(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 12);
    const vehicle = await Vehicle.findById(req.params.id).lean();

    if (!vehicle) {
      return next(new AppError("Vehicle not found.", 404));
    }

    // Find same type + same city first, then fall back to just same type
    const similar = await Vehicle.find({
      _id: { $ne: vehicle._id },
      status: "active",
      expiresAt: { $gt: new Date() },
      $or: [
        { type: vehicle.type, city: vehicle.city },
        { type: vehicle.type },
        { make: vehicle.make },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title shortTitle price priceDisplay year city condition make model type images seller createdAt")
      .lean();

    respond(res, 200, similar);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET MY ADS (authenticated user's listings)
// GET /api/vehicles/my-ads
// Requires: protect middleware
// ─────────────────────────────────────────────────────────────
async function getMyAds(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter by status if provided

    const filter = { sellerId: req.user._id };
    if (status) filter.status = status;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(filter),
    ]);

    const pagination = getPaginationMeta(total, page, limit);
    respond(res, 200, vehicles, "My ads fetched", pagination);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// CREATE VEHICLE LISTING
// POST /api/vehicles
// Requires: protect middleware
// ─────────────────────────────────────────────────────────────
async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const {
      title, description, type, make, model, year, condition,
      price, negotiable, engineCC, engineType, horsepower, torque,
      transmission, fuel, axleConfig, mileage, mileageUnit,
      color, cabinType, city, area, province, registeredCity,
      lastService, images,
    } = req.body;

    // Must have at least one image
    if (!images || images.length === 0) {
      return next(new AppError("At least one image is required.", 400));
    }

    // Seller must accept the sales commission terms to post.
    if (req.body.commissionConsent !== true) {
      return next(new AppError("You must accept the sales commission terms to post your ad.", 400));
    }

    // Soft lever: block posting while a commission is overdue.
    if (await Commission.hasOverdue(req.user._id)) {
      return next(new AppError("You have an overdue sales commission. Please settle it before posting new ads.", 403));
    }

    // Plan ad cap: free users 5 active ads; paid tiers more (-1 = unlimited).
    const limits = await getEffectiveLimits(req.user._id);
    if (limits.maxActiveAds !== -1) {
      const activeCount = await countActiveListings(req.user._id);
      if (activeCount >= limits.maxActiveAds) {
        return next(new AppError(`You've reached your ${limits.planKey} plan limit of ${limits.maxActiveAds} active ads. Upgrade your plan or remove an ad to post more.`, 403));
      }
    }

    // Fetch seller info for denormalization
    const seller = await User.findById(req.user._id);

    // If the seller is a dealer with an approved warranty badge, stamp it on
    // the listing so cards/detail can show "Verified Warranty" without a lookup.
    const sellerDealer = await Dealer.findOne({ userId: req.user._id }).select("warranty").lean();
    const sellerHasWarranty = sellerDealer?.warranty?.status === "approved";

    // Bilingual: store canonical English + Urdu. Fails soft (mirrors the
    // original into both languages) so a translation hiccup never blocks posting.
    const localized = await localizeListing({ title: title.trim(), description: description.trim() });

    const vehicle = await Vehicle.create({
      title: localized.title,
      description: localized.description,
      titleUr: localized.titleUr,
      descriptionUr: localized.descriptionUr,
      type,
      make: make.toLowerCase().trim(),
      model: model.trim(),
      year: parseInt(year),
      condition,
      price: parseInt(price),
      negotiable: negotiable !== false,
      engineCC: engineCC || "",
      engineType: engineType || "",
      horsepower: horsepower || "",
      torque: torque || "",
      transmission: transmission || "",
      fuel: fuel || "diesel",
      axleConfig: axleConfig || "",
      mileage: parseInt(mileage) || 0,
      mileageUnit: mileageUnit || "km",
      color: (color || "").toLowerCase(),
      cabinType: cabinType || "",
      city: city.toLowerCase().trim(),
      area: area || "",
      province: (province || "").toLowerCase(),
      registeredCity: registeredCity || "",
      lastService: lastService || "",
      images,
      sellerId: req.user._id,
      // Denormalized seller info
      seller: {
        name: seller.name,
        phone: seller.phone,
        whatsapp: seller.phone,
        city: seller.city,
        verified: seller.isVerifiedSeller,
        warranty: sellerHasWarranty,
        totalAds: seller.totalAds + 1,
        memberSince: seller.createdAt?.getFullYear(),
        avatar: seller.avatar?.url || "",
        plan: limits.planKey,
      },
      // Record the seller's commission agreement for this listing.
      // Rate is the seller's effective plan rate (Elite Pro pays a reduced
      // 0.15%); it's locked in here so later plan changes don't alter it.
      commissionConsent: {
        agreed: true,
        rate: limits.commissionRate,
        tcVersion: req.body.tcVersion || pricing.TC_VERSION,
        agreedAt: new Date(),
        ip: req.ip,
      },
    });

    // Increment user's total ads count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalAds: 1 } });

    respond(res, 201, vehicle, "Listing created successfully");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// UPDATE VEHICLE LISTING
// PUT /api/vehicles/:id
// Requires: protect + isOwner middleware
// ─────────────────────────────────────────────────────────────
async function update(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return next(new AppError("Listing not found.", 404));
    }

    // Ownership check
    if (vehicle.sellerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only edit your own listings.", 403));
    }

    // Fields that cannot be changed after creation
    const IMMUTABLE_FIELDS = ["sellerId", "seller", "views", "status", "createdAt"];
    IMMUTABLE_FIELDS.forEach((f) => delete req.body[f]);

    // Normalize some fields
    if (req.body.make) req.body.make = req.body.make.toLowerCase().trim();
    if (req.body.city) req.body.city = req.body.city.toLowerCase().trim();
    if (req.body.color) req.body.color = req.body.color.toLowerCase();
    if (req.body.price) req.body.price = parseInt(req.body.price);
    if (req.body.year) req.body.year = parseInt(req.body.year);

    // Re-translate when the prose changes so both languages stay in sync.
    if (req.body.title !== undefined || req.body.description !== undefined) {
      const newTitle = String(req.body.title ?? vehicle.title ?? "").trim();
      const newDesc = String(req.body.description ?? vehicle.description ?? "").trim();
      const localized = await localizeListing({ title: newTitle, description: newDesc });
      req.body.title = localized.title;
      req.body.description = localized.description;
      req.body.titleUr = localized.titleUr;
      req.body.descriptionUr = localized.descriptionUr;
    }

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    respond(res, 200, updated, "Listing updated successfully");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE VEHICLE LISTING
// DELETE /api/vehicles/:id
// Requires: protect + ownership check
// ─────────────────────────────────────────────────────────────
async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return next(new AppError("Listing not found.", 404));
    }

    if (vehicle.sellerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only delete your own listings.", 403));
    }

    await vehicle.deleteOne();

    // Decrement user's ad count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalAds: -1 } });

    res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// MARK AS SOLD
// PATCH /api/vehicles/:id/sold
// ─────────────────────────────────────────────────────────────
async function markAsSold(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return next(new AppError("Listing not found.", 404));
    }

    if (vehicle.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only update your own listings.", 403));
    }

    // Seller reports the final sale price → commission is recorded.
    const salePrice = Number(req.body.salePrice);
    if (!salePrice || salePrice < 1) {
      return next(new AppError("Please enter the final sale price to mark this as sold.", 400));
    }

    vehicle.status = "sold";
    vehicle.soldPrice = salePrice;
    vehicle.soldAt = new Date();
    await vehicle.save({ validateBeforeSave: false });

    const { sale, commission } = await recordSale(vehicle, "Vehicle", salePrice, req.body.buyerContact);
    const message = commission
      ? "Listing marked as sold. Commission recorded on your ledger."
      : "Listing marked as sold. Awaiting buyer confirmation.";

    respond(res, 200, { vehicle, sale, commission }, message);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// INCREMENT VIEW COUNT
// POST /api/vehicles/:id/view
// Public — no auth required
// ─────────────────────────────────────────────────────────────
async function incrementView(req, res, next) {
  try {
    await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: false } // Don't need the updated document
    );

    res.status(200).json({ success: true, message: "View counted", data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  getFeatured,
  getSimilar,
  getMyAds,
  create,
  update,
  deleteVehicle,
  markAsSold,
  incrementView,
};
