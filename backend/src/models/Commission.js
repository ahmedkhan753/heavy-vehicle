/**
 * Commission Model (the ledger)
 * ─────────────────────────────
 * One record per sold listing where a commission is owed. Created when a
 * seller marks a listing sold and reports the final sale price.
 *
 * status: due → paid (or waived). A "due" record past its dueAt is "overdue"
 * and triggers the soft lever that blocks new posting until settled.
 */

const mongoose = require("mongoose");
const pricing = require("../config/pricing");

const commissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    listingType: { type: String, enum: ["Vehicle", "Part"], required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    listingTitle: { type: String, default: "" },

    salePrice: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true }, // the rate actually applied
    amount: { type: Number, required: true, min: 0 }, // PKR owed
    currency: { type: String, default: "PKR" },

    status: {
      type: String,
      enum: ["due", "paid", "waived"],
      default: "due",
    },

    tcVersion: { type: String, default: "" },

    // The payment the seller submitted to settle this (proof trail).
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },

    dueAt: { type: Date },
    paidAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

commissionSchema.index({ userId: 1, status: 1 });
commissionSchema.index({ status: 1, dueAt: 1 });

/**
 * Does this user have any overdue (unpaid past grace) commission?
 * Used as the soft lever to block new posting.
 */
commissionSchema.statics.hasOverdue = async function (userId) {
  const count = await this.countDocuments({
    userId,
    status: "due",
    dueAt: { $lte: new Date() },
  });
  return count > 0;
};

/**
 * Create a commission record for a completed sale.
 * Uses the rate the seller consented to on the listing, falling back to the
 * current rate. Returns null when nothing is owed (amount rounds to 0).
 *
 * @param {object} listing      - the Vehicle/Part document
 * @param {string} listingType  - "Vehicle" | "Part"
 * @param {number} salePrice
 * @param {number} [graceDays]   - days until overdue (defaults to config)
 */
commissionSchema.statics.createForSale = async function (listing, listingType, salePrice, graceDays) {
  const rate = listing.commissionConsent?.rate > 0
    ? listing.commissionConsent.rate
    : pricing.COMMISSION_RATE;

  const amount = Math.round(Number(salePrice || 0) * rate);
  if (amount <= 0) return null;

  const days = Number.isFinite(graceDays) ? graceDays : pricing.COMMISSION_GRACE_DAYS;
  const now = Date.now();
  return this.create({
    userId: listing.sellerId,
    listingType,
    listingId: listing._id,
    listingTitle: listing.title,
    salePrice,
    rate,
    amount,
    tcVersion: listing.commissionConsent?.tcVersion || "",
    dueAt: new Date(now + days * 24 * 60 * 60 * 1000),
  });
};

module.exports = mongoose.model("Commission", commissionSchema);
