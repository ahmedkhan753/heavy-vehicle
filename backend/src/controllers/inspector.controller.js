/**
 * Inspector Controller
 * ────────────────────
 * Phase 1: supply acquisition — self-registration, directory, admin approval,
 * and a partnership lead form for inspection companies.
 *
 * Public:
 *   list    → GET /api/inspectors
 *   getById → GET /api/inspectors/:id
 *   partner → POST /api/inspectors/partner   (company partnership lead)
 * User:
 *   register   → POST /api/inspectors/register
 *   getMine    → GET  /api/inspectors/me
 *   updateMine → PUT  /api/inspectors/me
 * Admin:
 *   adminList   → GET   /api/inspectors/admin
 *   adminVerify → PATCH /api/inspectors/admin/:id/verify
 *   adminToggle → PATCH /api/inspectors/admin/:id/active
 */

const { validationResult } = require("express-validator");
const Inspector = require("../models/Inspector");
const { AppError } = require("../middleware/error.middleware");
const { sendPartnershipLead } = require("../utils/email");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

const checkValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// Fields a user is allowed to set on their own profile.
function pickProfile(body) {
  const out = {};
  const fields = [
    "displayName", "type", "bio", "phone", "whatsapp", "email",
    "city", "feeNote", "certifications",
  ];
  fields.forEach((f) => { if (body[f] !== undefined) out[f] = body[f]; });
  if (body.inspectionFee !== undefined) out.inspectionFee = Number(body.inspectionFee) || 0;
  if (body.experienceYears !== undefined) out.experienceYears = Number(body.experienceYears) || 0;
  if (Array.isArray(body.serviceAreas)) out.serviceAreas = body.serviceAreas;
  if (Array.isArray(body.specializations)) out.specializations = body.specializations;
  return out;
}

// ── USER: register as an inspector ────────────────────────────
async function register(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;

    const existing = await Inspector.findOne({ userId: req.user._id });
    if (existing) {
      return next(new AppError("You already have an inspector profile.", 409));
    }

    const doc = await Inspector.create({
      ...pickProfile(req.body),
      userId: req.user._id,
      email: req.body.email || req.user.email,
      phone: req.body.phone || req.user.phone,
      city: req.body.city || req.user.city,
      isVerified: false, // admin approves before going live
    });

    respond(res, 201, doc, "Inspector profile submitted for review.");
  } catch (err) {
    next(err);
  }
}

// ── USER: my inspector profile ────────────────────────────────
async function getMine(req, res, next) {
  try {
    const doc = await Inspector.findOne({ userId: req.user._id });
    respond(res, 200, doc || null);
  } catch (err) {
    next(err);
  }
}

// ── USER: update my profile ───────────────────────────────────
async function updateMine(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const doc = await Inspector.findOne({ userId: req.user._id });
    if (!doc) return next(new AppError("You don't have an inspector profile yet.", 404));

    Object.assign(doc, pickProfile(req.body));
    await doc.save();
    respond(res, 200, doc, "Profile updated.");
  } catch (err) {
    next(err);
  }
}

// ── PUBLIC: directory (verified + active only) ────────────────
async function list(req, res, next) {
  try {
    const filter = { isVerified: true, isActive: true };
    if (req.query.city) filter.city = String(req.query.city).toLowerCase();
    if (req.query.specialization) filter.specializations = String(req.query.specialization).toLowerCase();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 12);

    const [items, total] = await Promise.all([
      Inspector.find(filter).sort({ "rating.average": -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Inspector.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Inspectors fetched",
      data: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── PUBLIC: single inspector ──────────────────────────────────
async function getById(req, res, next) {
  try {
    const doc = await Inspector.findById(req.params.id).lean();
    if (!doc || !doc.isVerified || !doc.isActive) {
      return next(new AppError("Inspector not found.", 404));
    }
    respond(res, 200, doc);
  } catch (err) {
    next(err);
  }
}

// ── PUBLIC: partnership lead (companies) ──────────────────────
async function partner(req, res, next) {
  try {
    if (!checkValidation(req, res)) return;
    const lead = {
      name: String(req.body.name || "").trim(),
      company: String(req.body.company || "").trim(),
      email: String(req.body.email || "").trim(),
      phone: String(req.body.phone || "").trim(),
      city: String(req.body.city || "").trim(),
      message: String(req.body.message || "").trim(),
    };

    // Best-effort email to admin — never block the response on delivery.
    sendPartnershipLead(lead).catch(() => {});

    respond(res, 201, { received: true }, "Thanks! We'll be in touch about partnership.");
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: list all (incl. pending) ───────────────────────────
async function adminList(req, res, next) {
  try {
    const filter = {};
    if (req.query.status === "pending") filter.isVerified = false;
    if (req.query.status === "verified") filter.isVerified = true;

    const items = await Inspector.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(200, parseInt(req.query.limit) || 100))
      .populate("userId", "name email phone")
      .lean();

    respond(res, 200, items);
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: verify / unverify ──────────────────────────────────
async function adminVerify(req, res, next) {
  try {
    const doc = await Inspector.findById(req.params.id);
    if (!doc) return next(new AppError("Inspector not found.", 404));

    const verified = req.body.verified !== false;
    doc.isVerified = verified;
    doc.verifiedAt = verified ? new Date() : undefined;
    await doc.save();

    respond(res, 200, doc, verified ? "Inspector verified." : "Inspector unverified.");
  } catch (err) {
    next(err);
  }
}

// ── ADMIN: toggle active ──────────────────────────────────────
async function adminToggle(req, res, next) {
  try {
    const doc = await Inspector.findById(req.params.id);
    if (!doc) return next(new AppError("Inspector not found.", 404));

    doc.isActive = req.body.active !== false;
    await doc.save();

    respond(res, 200, doc, doc.isActive ? "Inspector activated." : "Inspector deactivated.");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register, getMine, updateMine, list, getById, partner,
  adminList, adminVerify, adminToggle,
};
