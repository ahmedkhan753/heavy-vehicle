/**
 * Sale Model
 * ──────────
 * Records a reported sale and its two-party confirmation. The seller
 * initiates (markAsSold); if a registered buyer is named, the buyer must
 * confirm before the commission is created and added to the ledger.
 *
 * status:
 *   pending   → awaiting buyer confirmation
 *   confirmed → both parties agree → commission created
 *   disputed  → buyer rejected the reported sale (admin reviews)
 *   cancelled → withdrawn
 */

const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    listingType: { type: String, enum: ["Vehicle", "Part"], required: true },
    listingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    listingTitle: { type: String, default: "" },

    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Registered buyer (if matched). Otherwise just the contact provided.
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    buyerContact: { type: String, default: "" },

    salePrice: { type: Number, required: true, min: 0 },

    sellerConfirmed: { type: Boolean, default: true },
    buyerConfirmed: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["pending", "confirmed", "disputed", "cancelled"],
      default: "pending",
    },

    commissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Commission" },
    disputeNote: { type: String, default: "" },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

saleSchema.index({ buyerId: 1, status: 1 });
saleSchema.index({ sellerId: 1, createdAt: -1 });

module.exports = mongoose.model("Sale", saleSchema);
