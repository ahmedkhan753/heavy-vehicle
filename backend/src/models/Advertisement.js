/**
 * Advertisement Model
 * ────────────────────
 * Paid banner placements sold to outside brands (dealers abroad, parts
 * importers, workshops with their own sites…). Distinct from the Business
 * directory, which is a free self-serve listing — these are bought slots that
 * link OFF-site and are billed manually.
 *
 * An advertiser submits a request; an admin uploads/approves the creative and
 * sets the run dates, at which point it starts serving.
 */

const mongoose = require("mongoose");

// Where a banner renders. Sizes are guidance for the advertiser, enforced
// only visually (the frontend letterboxes whatever it's given).
const PLACEMENTS = ["header", "home-mid", "listing"];

const STATUSES = ["pending", "active", "paused", "rejected", "expired"];

const advertisementSchema = new mongoose.Schema(
  {
    // Who bought it. Optional: an admin can create a campaign directly for an
    // advertiser who arranged it over the phone.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    advertiserName: {
      type: String,
      required: [true, "Advertiser name is required"],
      trim: true,
      maxlength: 100,
    },
    contactEmail: { type: String, trim: true, lowercase: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },

    // ── Creative ──────────────────────────────────────────────
    title: { type: String, trim: true, maxlength: 120, default: "" },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    // Optional narrow crop; falls back to `image` when absent.
    mobileImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    targetUrl: { type: String, trim: true, default: "" },

    // ── Placement & scheduling ────────────────────────────────
    placement: {
      type: String,
      enum: PLACEMENTS,
      default: "home-mid",
      index: true,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "pending",
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },

    // Higher shows first within a placement.
    priority: { type: Number, default: 0 },

    // ── Billing (manual, mirrors the subscription rail) ───────
    amountPaid: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    reviewNote: { type: String, trim: true, maxlength: 500, default: "" },

    // ── Performance ───────────────────────────────────────────
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// The serving query is "active, in this placement, inside its date window".
advertisementSchema.index({ status: 1, placement: 1, startDate: 1, endDate: 1 });

/**
 * Is this ad currently servable? A missing start/end means "no bound on that
 * side", so an open-ended campaign runs until paused.
 */
advertisementSchema.methods.isLive = function () {
  if (this.status !== "active") return false;
  const now = new Date();
  if (this.startDate && this.startDate > now) return false;
  if (this.endDate && this.endDate < now) return false;
  return true;
};

module.exports = mongoose.model("Advertisement", advertisementSchema);
module.exports.PLACEMENTS = PLACEMENTS;
module.exports.STATUSES = STATUSES;
