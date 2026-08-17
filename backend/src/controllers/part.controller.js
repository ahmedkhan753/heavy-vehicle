/**
 * Part Controller
 * list, getById, getFeatured, getMyParts, create, update, deletePart, markAsSold, incrementView
 */

const { validationResult } = require("express-validator");
const Part = require("../models/Part");
const User = require("../models/User");
const { getPaginationMeta } = require("../utils/apiFeatures");
const { AppError } = require("../middleware/error.middleware");
const pricing = require("../config/pricing");
const Commission = require("../models/Commission");
const { recordSale } = require("../utils/recordSale");
const { getEffectiveLimits, countActiveListings } = require("../utils/planLimits");
const { localizeListing } = require("../services/translation");

const respond = (res, statusCode, data, message = "Success", pagination = null) => {
  const body = { success: true, message, data };
  if (pagination) body.pagination = pagination;
  res.status(statusCode).json(body);
};

function buildPartFilter(query) {
  const filter = {
    status: "active",
    expiresAt: { $gt: new Date() },
  };

  const exactFields = ["category", "subcategory", "partType", "warranty", "make", "city", "condition", "province", "sellerId"];
  exactFields.forEach((field) => {
    if (query[field]) {
      filter[field] = { $regex: `^${query[field]}$`, $options: "i" };
    }
  });

  if (query.type) {
    filter.compatibleTypes = { $regex: `^${query.type}$`, $options: "i" };
  }

  if (query.featured === "true") filter.featured = true;
  if (query.verified === "true") filter["seller.verified"] = true;

  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { make: { $regex: q, $options: "i" } },
      { model: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { city: { $regex: q, $options: "i" } },
    ];
  }

  if (query["price[min]"] || query["price[max]"]) {
    filter.price = {};
    if (query["price[min]"]) filter.price.$gte = Number(query["price[min]"]);
    if (query["price[max]"]) filter.price.$lte = Number(query["price[max]"]);
  }

  return filter;
}

function getSort(sortKey = "newest") {
  const sortMap = {
    newest: { bumpedAt: -1 }, // bumpedAt = recency (bumps float to top)
    oldest: { createdAt: 1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    popular: { views: -1 },
  };
  return { ...(sortMap[sortKey] || sortMap.newest), createdAt: -1 };
}

async function list(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = buildPartFilter(req.query);

    const [parts, total] = await Promise.all([
      Part.find(filter).sort(getSort(req.query.sort)).skip(skip).limit(limit).lean(),
      Part.countDocuments(filter),
    ]);

    respond(res, 200, parts, "Parts fetched", getPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
}

async function getFeatured(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const parts = await Part.find({ status: "active", featured: true, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    respond(res, 200, parts);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const part = await Part.findById(req.params.id)
      .populate("sellerId", "name phone city avatar isVerifiedSeller totalAds createdAt")
      .lean();

    if (!part) return next(new AppError("Part listing not found.", 404));

    if (part.status !== "active" && part.sellerId?._id?.toString() !== req.user?._id?.toString()) {
      return next(new AppError("This part listing is not available.", 404));
    }

    // Privacy: hide seller contact details from anonymous visitors.
    if (!req.user) {
      if (part.sellerId && typeof part.sellerId === "object") delete part.sellerId.phone;
      if (part.seller && typeof part.seller === "object") {
        delete part.seller.phone;
        delete part.seller.whatsapp;
      }
      part.contactLocked = true;
    }

    respond(res, 200, part);
  } catch (err) {
    next(err);
  }
}

async function getMyParts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const filter = { sellerId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [parts, total] = await Promise.all([
      Part.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Part.countDocuments(filter),
    ]);

    respond(res, 200, parts, "My parts fetched", getPaginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
}

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
      title, description, category, subcategory, partType, warranty,
      compatibleTypes, make, model, condition, price, negotiable, quantity,
      city, area, province, images,
    } = req.body;

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

    const seller = await User.findById(req.user._id);

    // Bilingual: canonical English + Urdu, failing soft so a translation
    // hiccup never blocks posting.
    const localized = await localizeListing({ title: title.trim(), description: description.trim() });

    const part = await Part.create({
      title: localized.title,
      description: localized.description,
      titleUr: localized.titleUr,
      descriptionUr: localized.descriptionUr,
      category,
      subcategory: (subcategory || "").toLowerCase().trim(),
      partType: partType || "",
      warranty: warranty || "",
      compatibleTypes: compatibleTypes || [],
      make: (make || "").toLowerCase().trim(),
      model: model || "",
      condition: condition || "used",
      price: parseInt(price),
      negotiable: negotiable !== false,
      quantity: parseInt(quantity) || 1,
      city: city.toLowerCase().trim(),
      area: area || "",
      province: (province || "").toLowerCase(),
      images,
      sellerId: req.user._id,
      seller: {
        name: seller.name,
        phone: seller.phone,
        whatsapp: seller.phone,
        city: seller.city,
        verified: seller.isVerifiedSeller,
        totalAds: seller.totalAds,
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

    respond(res, 201, part, "Part listing created successfully");
  } catch (err) {
    next(err);
  }
}

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

    const part = await Part.findById(req.params.id);
    if (!part) return next(new AppError("Part listing not found.", 404));

    if (part.sellerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only edit your own part listings.", 403));
    }

    const immutable = ["sellerId", "seller", "views", "status", "createdAt"];
    immutable.forEach((field) => delete req.body[field]);

    if (req.body.make) req.body.make = req.body.make.toLowerCase().trim();
    if (req.body.city) req.body.city = req.body.city.toLowerCase().trim();
    if (req.body.category) req.body.category = req.body.category.toLowerCase().trim();
    if (req.body.subcategory) req.body.subcategory = req.body.subcategory.toLowerCase().trim();
    if (req.body.price) req.body.price = parseInt(req.body.price);

    // Re-translate when the prose changes so both languages stay in sync.
    if (req.body.title !== undefined || req.body.description !== undefined) {
      const newTitle = String(req.body.title ?? part.title ?? "").trim();
      const newDesc = String(req.body.description ?? part.description ?? "").trim();
      const localized = await localizeListing({ title: newTitle, description: newDesc });
      req.body.title = localized.title;
      req.body.description = localized.description;
      req.body.titleUr = localized.titleUr;
      req.body.descriptionUr = localized.descriptionUr;
    }

    const updated = await Part.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    respond(res, 200, updated, "Part listing updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deletePart(req, res, next) {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return next(new AppError("Part listing not found.", 404));

    if (part.sellerId.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("You can only delete your own part listings.", 403));
    }

    await part.deleteOne();

    // Keep the lifetime counter consistent with vehicle deletion so both
    // listing types behave the same.
    await User.findByIdAndUpdate(part.sellerId, { $inc: { totalAds: -1 } });

    res.status(200).json({ success: true, message: "Part listing deleted successfully", data: null });
  } catch (err) {
    next(err);
  }
}

async function markAsSold(req, res, next) {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return next(new AppError("Part listing not found.", 404));

    if (part.sellerId.toString() !== req.user._id.toString()) {
      return next(new AppError("You can only update your own part listings.", 403));
    }

    const salePrice = Number(req.body.salePrice);
    if (!salePrice || salePrice < 1) {
      return next(new AppError("Please enter the final sale price to mark this as sold.", 400));
    }

    part.status = "sold";
    part.soldPrice = salePrice;
    part.soldAt = new Date();
    await part.save({ validateBeforeSave: false });

    const { sale, commission } = await recordSale(part, "Part", salePrice, req.body.buyerContact);
    const message = commission
      ? "Part listing marked as sold. Commission recorded on your ledger."
      : "Part listing marked as sold. Awaiting buyer confirmation.";
    respond(res, 200, { part, sale, commission }, message);
  } catch (err) {
    next(err);
  }
}

async function incrementView(req, res, next) {
  try {
    await Part.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: false });
    res.status(200).json({ success: true, message: "View counted", data: null });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getFeatured,
  getById,
  getMyParts,
  create,
  update,
  deletePart,
  markAsSold,
  incrementView,
};
