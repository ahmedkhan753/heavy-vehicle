/**
 * Subscription Model
 * ──────────────────
 * A dealer's plan. Belongs to a User account. Slot counts are snapshotted
 * at purchase time so later price/slot changes don't retroactively alter
 * an active subscription.
 *
 * Lifecycle: pending → active → expired (or cancelled).
 *   - pending: created at checkout, awaiting payment verification
 *   - active:  verified; currentPeriodEnd in the future
 *   - expired: currentPeriodEnd passed without renewal (sweep downgrades ads)
 *   - cancelled: ended early by user/admin
 */

const mongoose = require("mongoose");
const { UNLIMITED } = require("../config/pricing");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    planKey: {
      type: String,
      enum: ["starter", "pro", "elite", "elitePro"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled"],
      default: "pending",
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "annual"],
      default: "monthly",
    },

    // Snapshot of plan allowances at purchase (UNLIMITED = -1).
    featuredSlots: { type: Number, default: 0 },
    premiumSlots: { type: Number, default: 0 },

    startedAt: { type: Date },
    currentPeriodEnd: { type: Date },

    autoRenew: { type: Boolean, default: false },

    lastPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Is this subscription currently usable?
subscriptionSchema.virtual("isCurrentlyActive").get(function () {
  return (
    this.status === "active" &&
    this.currentPeriodEnd &&
    this.currentPeriodEnd.getTime() > Date.now()
  );
});

// Helper: does this subscription allow unlimited featured slots?
subscriptionSchema.methods.hasUnlimitedFeatured = function () {
  return this.featuredSlots === UNLIMITED;
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
