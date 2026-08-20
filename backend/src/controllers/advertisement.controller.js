/**
 * Advertisement Controller
 * ─────────────────────────
 * serve        → GET  /api/ads?placement=header      (public, what to render)
 * click        → GET  /api/ads/:id/click             (public, counts + redirects)
 * impression   → POST /api/ads/:id/impression        (public, fire-and-forget)
 * request      → POST /api/ads/request               (advertiser enquiry)
 * adminList / adminCreate / adminUpdate / adminRemove
 */

const { validationResult } = require("express-validator");
const Advertisement = require("../models/Advertisement");
const { AppError } = require("../middleware/error.middleware");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// The "currently servable" filter, shared by the public serve endpoint.
function liveFilter(placement) {
  const now = new Date();
  return {
    status: "active",
    ...(placement ? { placement } : {}),
    $and: [
      { $or: [{ startDate: { $lte: now } }, { startDate: null }, { startDate: { $exists: false } }] },
      { $or: [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// SERVE — what the frontend should render in a placement
// ─────────────────────────────────────────────────────────────
async function serve(req, res, next) {
  try {
    const placement = req.query.placement;
    const limit = Math.min(parseInt(req.query.limit) || 3, 6);

    const ads = await Advertisement.find(liveFilter(placement))
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      // Never leak the advertiser's contact details to the public.
      .select("title image mobileImage targetUrl placement advertiserName")
      .lean();

    respond(res, 200, ads);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// CLICK — count then redirect
// A redirect (rather than a JS beacon) means the count is reliable even if
// the click opens in a new tab or scripts are blocked.
// ─────────────────────────────────────────────────────────────
async function click(req, res, next) {
  try {
    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    ).select("targetUrl");

    if (!ad || !ad.targetUrl) return res.redirect("/");

    // Only ever bounce to an absolute http(s) URL — an attacker-supplied
    // "javascript:" or protocol-relative value must not be reflected here.
    const safe = /^https?:\/\//i.test(ad.targetUrl) ? ad.targetUrl : `https://${ad.targetUrl}`;
    return res.redirect(safe);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// IMPRESSION — fire-and-forget, never fails the page
// ─────────────────────────────────────────────────────────────
async function impression(req, res) {
  Advertisement.updateOne({ _id: req.params.id }, { $inc: { impressions: 1 } }).catch(() => {});
  res.status(204).end();
}

// ─────────────────────────────────────────────────────────────
// ADVERTISER ENQUIRY — creates a pending campaign for an admin to price
// ─────────────────────────────────────────────────────────────
async function request(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { advertiserName, contactEmail, contactPhone, targetUrl, placement, notes } = req.body;

    const ad = await Advertisement.create({
      createdBy: req.user?._id,
      advertiserName: String(advertiserName).trim(),
      contactEmail: contactEmail || req.user?.email || "",
      contactPhone: contactPhone || req.user?.phone || "",
      targetUrl: targetUrl || "",
      placement: Advertisement.PLACEMENTS.includes(placement) ? placement : "home-mid",
      notes: notes || "",
      status: "pending",
    });

    respond(res, 201, ad, "Advertising enquiry received. We'll contact you with pricing shortly.");
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────
async function adminList(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [ads, counts] = await Promise.all([
      Advertisement.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
      Advertisement.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    respond(res, 200, {
      ads,
      counts: counts.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
    });
  } catch (err) {
    next(err);
  }
}

async function adminCreate(req, res, next) {
  try {
    const ad = await Advertisement.create({ ...req.body, createdBy: req.user._id });
    respond(res, 201, ad, "Campaign created");
  } catch (err) {
    next(err);
  }
}

async function adminUpdate(req, res, next) {
  try {
    // Counters are earned, never set by hand.
    delete req.body.impressions;
    delete req.body.clicks;

    const ad = await Advertisement.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!ad) return next(new AppError("Campaign not found.", 404));
    respond(res, 200, ad, "Campaign updated");
  } catch (err) {
    next(err);
  }
}

async function adminRemove(req, res, next) {
  try {
    const ad = await Advertisement.findByIdAndDelete(req.params.id);
    if (!ad) return next(new AppError("Campaign not found.", 404));
    respond(res, 200, null, "Campaign deleted");
  } catch (err) {
    next(err);
  }
}

module.exports = {
  serve, click, impression, request,
  adminList, adminCreate, adminUpdate, adminRemove,
};
