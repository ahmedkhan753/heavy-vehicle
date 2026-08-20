/**
 * Report Model
 * ────────────
 * A user flagging a listing (vehicle or part) as spam, irrelevant, or
 * otherwise not belonging on the marketplace. `listing` is a polymorphic
 * reference (refPath: listingType), same pattern as Conversation/Comment.
 *
 * One report per (listing, reporter) — the unique index below stops a
 * single user from spamming the same ad with repeat reports to inflate its
 * count; admin-facing severity comes from distinct reporters, not repeats.
 */

const mongoose = require("mongoose");

const REASON_CODES = ["spam", "inappropriate", "wrong_category", "scam", "sold_elsewhere", "other"];

const reportSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "listingType" },
    listingType: { type: String, required: true, enum: ["Vehicle", "Part"] },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    reasonCode: { type: String, required: true, enum: REASON_CODES },
    note: { type: String, trim: true, maxlength: 500, default: "" },

    // pending = awaiting admin review; reviewed = admin acted on it (e.g.
    // deleted the listing); dismissed = admin looked and decided it's fine.
    status: { type: String, enum: ["pending", "reviewed", "dismissed"], default: "pending", index: true },
  },
  { timestamps: true }
);

reportSchema.index({ listing: 1, listingType: 1, reporter: 1 }, { unique: true });
reportSchema.index({ listing: 1, listingType: 1 });

module.exports = mongoose.model("Report", reportSchema);
module.exports.REASON_CODES = REASON_CODES;
