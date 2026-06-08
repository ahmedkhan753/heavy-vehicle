/**
 * Vehicle Model
 * ──────────────
 * The core listing schema for HeavyWheels.
 * Every field name here is the exact same name used in:
 *   - Frontend components
 *   - API response JSON
 *   - URL filter params
 * Never rename fields after launch without a migration.
 */

const mongoose = require("mongoose");
const { VEHICLE_TYPE_SLUGS } = require("../config/taxonomy");

const vehicleSchema = new mongoose.Schema(
  {
    // ── Core Identity ─────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [10, "Title must be at least 10 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    // Short title for cards (auto-generated if not provided)
    shortTitle: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [30, "Description must be at least 30 characters"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    // ── Urdu translations ─────────────────────────────────────
    // title/description above are canonical English (keeps the text index
    // effective); these hold the Urdu version. Filled at post time by the
    // translation service. Empty when translation is off/unavailable.
    titleUr: { type: String, trim: true, default: "" },
    descriptionUr: { type: String, trim: true, default: "" },

    // ── Vehicle Classification ────────────────────────────────
    type: {
      type: String,
      required: [true, "Vehicle type is required"],
      // Source of truth: backend/src/config/taxonomy.js
      enum: VEHICLE_TYPE_SLUGS,
      lowercase: true,
    },

    make: {
      type: String,
      required: [true, "Make is required"],
      trim: true,
      lowercase: true,
    },

    model: {
      type: String,
      required: [true, "Model is required"],
      trim: true,
    },

    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1980, "Year must be 1980 or later"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },

    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: ["new", "used", "imported", "rebuilt"],
      lowercase: true,
    },

    // ── Pricing ───────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Human-readable price string e.g. "1.85 Crore" (generated on save)
    priceDisplay: {
      type: String,
      default: "",
    },

    negotiable: {
      type: Boolean,
      default: true,
    },

    // ── Engine & Performance ──────────────────────────────────
    engineCC: {
      type: String,
      trim: true,
      default: "",
    },

    engineType: {
      type: String,
      trim: true,
      default: "",
    },

    horsepower: {
      type: String,
      trim: true,
      default: "",
    },

    torque: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Drivetrain ────────────────────────────────────────────
    transmission: {
      type: String,
      enum: ["manual", "automatic", "semi-auto", "hydraulic", ""],
      default: "",
    },

    fuel: {
      type: String,
      enum: ["diesel", "petrol", "cng", "electric", "hybrid", ""],
      default: "diesel",
    },

    axleConfig: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Mileage / Hours ───────────────────────────────────────
    mileage: {
      type: Number,
      default: 0,
      min: [0, "Mileage cannot be negative"],
    },

    // "km" for trucks, "hrs" for machinery
    mileageUnit: {
      type: String,
      enum: ["km", "hrs"],
      default: "km",
    },

    // ── Physical ──────────────────────────────────────────────
    color: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    cabinType: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Location ──────────────────────────────────────────────
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      lowercase: true,
    },

    area: {
      type: String,
      trim: true,
      default: "",
    },

    province: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    registeredCity: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Images ────────────────────────────────────────────────
    // Array of { url, publicId, width, height }
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        isCover: { type: Boolean, default: false },
      },
    ],

    // ── Seller Reference ──────────────────────────────────────
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
    },

    // Denormalized seller info (so we don't need to populate for every list query)
    seller: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      city: { type: String, default: "" },
      verified: { type: Boolean, default: false },
      // Denormalized: seller is a dealer with an approved warranty badge.
      // Synced when admin approves/revokes the dealer's warranty.
      warranty: { type: Boolean, default: false },
      totalAds: { type: Number, default: 0 },
      memberSince: { type: Number, default: 0 },
      avatar: { type: String, default: "" },
      // Seller's subscription tier at the time, synced on plan changes.
      // Drives the plan ribbon/icon/theme shown on the listing card.
      plan: { type: String, default: "free" },
    },

    // ── Ad Status ─────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "pending", "active", "sold", "expired", "rejected"],
      default: "active", // Set to "pending" if you want admin approval first
    },

    adType: {
      type: String,
      enum: ["free", "featured", "premium"],
      default: "free",
    },

    featured: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },

    // When the last "your ad is expiring" reminder was sent. Used by the
    // maintenance sweep to throttle reminders to roughly once a day.
    lastRenewalReminderAt: { type: Date },

    // ── One-time boosts (Phase 4) ─────────────────────────────
    // featuredUntil is set by a one-time featured/premium purchase; the
    // maintenance sweep clears featured when it lapses. Subscription-based
    // featuring leaves featuredUntil null and is not swept.
    featuredUntil: { type: Date },
    bumpedAt: { type: Date, default: Date.now }, // effective recency for sort
    urgent: { type: Boolean, default: false },
    urgentUntil: { type: Date },

    // ── Rejection ─────────────────────────────────────────────
    rejectionReason: {
      type: String,
      default: "",
    },

    // ── Stats ─────────────────────────────────────────────────
    views: {
      type: Number,
      default: 0,
    },

    contactClicks: {
      type: Number,
      default: 0,
    },

    // ── Sale record (set when marked sold) ────────────────────
    soldPrice: { type: Number, default: 0 },
    soldAt: { type: Date },

    // ── Last Service ──────────────────────────────────────────
    lastService: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Admin Notes ───────────────────────────────────────────
    adminNotes: {
      type: String,
      select: false,
      default: "",
    },

    // ── Sales Commission Consent ──────────────────────────────
    // Captured at posting time as the seller's agreement to the 0.2%
    // success fee. Stores which Terms version they accepted (see pricing.js).
    commissionConsent: {
      agreed: { type: Boolean, default: false },
      rate: { type: Number, default: 0 },
      tcVersion: { type: String, default: "" },
      agreedAt: { type: Date },
      ip: { type: String, default: "" },
    },
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

// ── INDEXES ───────────────────────────────────────────────────
// These are the fields most commonly used in filters — index them all
vehicleSchema.index({ city: 1 });
vehicleSchema.index({ make: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ price: 1 });
vehicleSchema.index({ year: 1 });
vehicleSchema.index({ condition: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ featured: 1 });
vehicleSchema.index({ sellerId: 1 });
vehicleSchema.index({ createdAt: -1 });
vehicleSchema.index({ views: -1 });
vehicleSchema.index({ expiresAt: 1 });
vehicleSchema.index({ bumpedAt: -1 });

// Compound index for common combined filters
vehicleSchema.index({ status: 1, city: 1, type: 1 });
vehicleSchema.index({ status: 1, make: 1, city: 1 });
vehicleSchema.index({ status: 1, price: 1, createdAt: -1 });

// Full-text search index
vehicleSchema.index({
  title: "text",
  description: "text",
  make: "text",
  model: "text",
  city: "text",
});

// ── PRE-SAVE: Generate priceDisplay and shortTitle ─────────────
vehicleSchema.pre("save", function () {
  // Generate human-readable price
  if (this.isModified("price") || !this.priceDisplay) {
    this.priceDisplay = formatPricePKR(this.price);
  }

  // Auto-generate shortTitle from title if not set
  if (!this.shortTitle && this.title) {
    this.shortTitle = this.title.length > 75
      ? this.title.substring(0, 72) + "..."
      : this.title;
  }

  // Mark first image as cover
  if (this.images?.length > 0) {
    this.images.forEach((img, i) => {
      img.isCover = i === 0;
    });
  }
});

// ── VIRTUAL: Cover image URL ──────────────────────────────────
vehicleSchema.virtual("coverImage").get(function () {
  return this.images?.[0]?.url || "";
});

// ── VIRTUAL: Days since posted ────────────────────────────────
vehicleSchema.virtual("postedAgo").get(function () {
  if (!this.createdAt) return "";
  const diffMs = Date.now() - new Date(this.createdAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
});

// ── VIRTUAL: Is expired ───────────────────────────────────────
vehicleSchema.virtual("isExpired").get(function () {
  return this.expiresAt && new Date() > new Date(this.expiresAt);
});

// ── HELPER: Format price to PKR display ──────────────────────
function formatPricePKR(price) {
  if (!price) return "";
  if (price >= 10000000) {
    const crore = (price / 10000000).toFixed(2).replace(/\.?0+$/, "");
    return `${crore} Crore`;
  }
  if (price >= 100000) {
    const lakh = (price / 100000).toFixed(1).replace(/\.?0+$/, "");
    return `${lakh} Lakh`;
  }
  return price.toLocaleString("en-PK");
}

module.exports = mongoose.model("Vehicle", vehicleSchema);
