/**
 * Dealer Model
 * ─────────────
 * Extended profile for verified dealers.
 * One-to-one relationship with User (userId is unique).
 */

const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
  {
    // Reference to the User account
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true,
    },

    // ── Business Info ─────────────────────────────────────────
    businessName: {
      type:      String,
      required:  [true, "Business name is required"],
      trim:      true,
      maxlength: [100, "Business name cannot exceed 100 characters"],
    },

    businessType: {
      type: String,
      enum: ["individual", "company", "showroom"],
      default: "individual",
    },

    tagline: {
      type:      String,
      trim:      true,
      maxlength: [120, "Tagline cannot exceed 120 characters"],
      default:   "",
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default:   "",
    },

    // ── Contact ───────────────────────────────────────────────
    phone: {
      type:  String,
      trim:  true,
    },

    whatsapp: {
      type:  String,
      trim:  true,
    },

    email: {
      type:      String,
      lowercase: true,
      trim:      true,
      default:   "",
    },

    website: {
      type:  String,
      trim:  true,
      default: "",
    },

    // ── Location ──────────────────────────────────────────────
    city: {
      type:      String,
      required:  [true, "City is required"],
      trim:      true,
      lowercase: true,
    },

    address: {
      type:      String,
      trim:      true,
      maxlength: [200, "Address cannot exceed 200 characters"],
      default:   "",
    },

    province: {
      type:      String,
      trim:      true,
      lowercase: true,
      default:   "",
    },

    // ── Media ─────────────────────────────────────────────────
    logo: {
      url:       { type: String, default: "" },
      publicId:  { type: String, default: "" },
    },

    coverImage: {
      url:       { type: String, default: "" },
      publicId:  { type: String, default: "" },
    },

    // Gallery photos of showroom
    gallery: [
      {
        url:      { type: String },
        publicId: { type: String },
      },
    ],

    // ── Admin approval ────────────────────────────────────────
    // Registering is a *request*: the profile stays hidden and the user keeps
    // their existing role until an admin approves it. Only on approval does
    // the storefront go live and the account become a dealer.
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedAt:  { type: Date },
    rejectedAt:  { type: Date },
    reviewNote:  { type: String, trim: true, maxlength: 500, default: "" },

    // ── Verification ──────────────────────────────────────────
    // Separate from approval: an approved dealer can additionally be marked
    // "verified" to earn the badge.
    isVerified: {
      type:    Boolean,
      default: false,
    },

    verifiedAt: { type: Date },

    // NTN for business verification (Pakistan)
    ntn: {
      type:   String,
      trim:   true,
      select: false,
      default: "",
    },

    // ── Dealer-provided warranty badge ────────────────────────
    // The dealer offers their OWN warranty (HeavyWheels is not a party to it).
    // They request a badge and describe their terms; an admin approves it.
    // Only approved dealers show the "Verified Warranty" badge on their ads.
    warranty: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      terms: { type: String, trim: true, maxlength: 1500, default: "" },
      requestedAt: { type: Date },
      approvedAt: { type: Date },
      reviewNote: { type: String, default: "" },
    },

    // ── Status ────────────────────────────────────────────────
    isActive: {
      type:    Boolean,
      default: true,
    },

    // ── Stats ─────────────────────────────────────────────────
    totalListings: {
      type:    Number,
      default: 0,
    },

    totalViews: {
      type:    Number,
      default: 0,
    },

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },

    // ── Specialization ────────────────────────────────────────
    // A dealer is a business registering on the site, so what matters is
    // simply which side of the marketplace they trade on. This replaces the
    // old per-vehicle-type checkbox list (and the free-text `brands` list),
    // which asked a showroom to tick a dozen boxes to say "we sell trucks".
    specialization: {
      type: String,
      enum: ["vehicles", "parts", "both"],
      default: "vehicles",
    },

    // Years in business
    establishedYear: { type: Number },

    // Working hours
    workingHours: {
      type:    String,
      default: "Mon–Sat: 9am–6pm",
    },

    // Social media
    social: {
      facebook:  { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube:   { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        delete ret.ntn;
        return ret;
      },
    },
  }
);

// ── INDEXES ───────────────────────────────────────────────────
// userId already indexed via `unique: true` above — don't redeclare it.
dealerSchema.index({ city:       1 });
dealerSchema.index({ isVerified: 1 });
dealerSchema.index({ isActive:   1 });
dealerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Dealer", dealerSchema);
