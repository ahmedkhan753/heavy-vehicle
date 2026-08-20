/**
 * Comment Model
 * ─────────────
 * Public comments on a listing — either a Vehicle or a Part — questions,
 * discussion, and offers. `listing` is a polymorphic reference
 * (`refPath: "listingType"`). One level of replies via `parentId`. An
 * `offerAmount` marks a comment as an offer. The listing owner and admins
 * can moderate.
 */

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "listingType" },
    listingType: { type: String, required: true, enum: ["Vehicle", "Part"] },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    text: {
      type: String,
      required: [true, "Comment cannot be empty"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },

    // Optional structured offer (PKR). null = ordinary comment.
    offerAmount: { type: Number, default: null, min: 0 },

    // One level of threading; null = top-level comment.
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
  }
);

commentSchema.index({ listing: 1, listingType: 1, createdAt: 1 });
commentSchema.index({ parentId: 1 });

module.exports = mongoose.model("Comment", commentSchema);
