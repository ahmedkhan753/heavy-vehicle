/**
 * Inspector Model
 * ───────────────
 * Profile for a vehicle inspection officer or company. Mirrors the Dealer
 * model's shape (one-to-one with a User, self-registered, admin-verified,
 * carries a rating) and adds inspection-specific fields:
 *   - inspectionFee   : what the inspector charges
 *   - commissionRate  : platform's cut (0.5%), applied in Phase 2
 *   - commissionBalance: accrued platform fee the inspector owes (Phase 2)
 *
 * New inspectors start unverified (isVerified=false) and only appear in the
 * public directory once an admin approves them.
 */

const mongoose = require("mongoose");

// Inspector specializations cover every listing type — single source of truth
// in config/taxonomy.js. Re-exported below for any caller that wants the list.
const { VEHICLE_TYPE_SLUGS: VEHICLE_TYPES } = require("../config/taxonomy");

const inspectorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Profile ───────────────────────────────────────────────
    displayName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    type: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
      default: "",
    },

    // ── Contact ───────────────────────────────────────────────
    phone: { type: String, trim: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
    email: { type: String, lowercase: true, trim: true, default: "" },

    // ── Location & coverage ───────────────────────────────────
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      lowercase: true,
    },
    serviceAreas: [{ type: String, lowercase: true, trim: true }],

    // ── Inspection specifics ──────────────────────────────────
    inspectionFee: {
      type: Number,
      required: [true, "Inspection fee is required"],
      min: [0, "Fee cannot be negative"],
    },
    feeNote: { type: String, trim: true, default: "" }, // e.g. "per vehicle, on-site"

    specializations: [{ type: String, enum: VEHICLE_TYPES }],
    experienceYears: { type: Number, min: 0, default: 0 },
    certifications: { type: String, trim: true, default: "" },

    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    // ── Verification & status ─────────────────────────────────
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    isActive: { type: Boolean, default: true },

    // ── Rating (from buyers, Phase 2+) ────────────────────────
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    totalInspections: { type: Number, default: 0 },

    // ── Platform commission (accrual model, activated in Phase 2) ──
    commissionRate: { type: Number, default: 0.005 }, // 0.5%
    commissionBalance: { type: Number, default: 0 }, // PKR owed to platform

    adminNotes: { type: String, select: false, default: "" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        delete ret.adminNotes;
        return ret;
      },
    },
  }
);

inspectorSchema.index({ city: 1 });
inspectorSchema.index({ isVerified: 1, isActive: 1 });
inspectorSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Inspector", inspectorSchema);
module.exports.VEHICLE_TYPES = VEHICLE_TYPES;
