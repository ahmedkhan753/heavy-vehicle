/**
 * Payment Model
 * ─────────────
 * One record per payment attempt. Payment-agnostic by design so new rails
 * (JazzCash/Easypaisa webhooks, card gateway) can be added later without
 * schema changes — they just write to the same record.
 *
 * Phase 2 uses type "subscription" with the manual (bank/wallet) flow:
 * the dealer uploads a transfer screenshot + reference, an admin verifies.
 */

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What the payment is for. Only "subscription" is used in Phase 2;
    // the rest are reserved for later phases.
    type: {
      type: String,
      enum: ["subscription", "upgrade", "addon", "commission"],
      required: true,
    },

    amount: { type: Number, required: true, min: 0 }, // PKR
    currency: { type: String, default: "PKR" },

    method: {
      type: String,
      enum: ["bank", "jazzcash", "easypaisa", "card"],
      required: true,
    },

    // Which rail processed this payment. "manual" = the bank/wallet screenshot
    // flow (admin-verified). "safepay" = automated card/wallet gateway whose
    // signed webhook fulfills the payment with no admin step.
    gateway: {
      type: String,
      enum: ["manual", "safepay"],
      default: "manual",
    },

    // Gateway's own reference for this payment (Safepay tracker/token). The
    // webhook looks the Payment up by this, so it's indexed.
    gatewayRef: { type: String, default: "", index: true },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "failed"],
      default: "pending",
    },

    // Manual-payment proof (Cloudinary upload) + user-entered reference.
    proof: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    reference: { type: String, trim: true, default: "" },

    // Who sent the transfer — captured so an admin can match it against the
    // received bank/wallet payment. (Manual rails only; never card data.)
    payer: {
      name: { type: String, trim: true, default: "" },
      number: { type: String, trim: true, default: "" },
    },

    // What this payment relates to (e.g. a Subscription).
    relatedType: { type: String, default: "" },
    relatedId: { type: mongoose.Schema.Types.ObjectId },

    // Free-form context (planKey, billingCycle, etc.)
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Admin review trail.
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
