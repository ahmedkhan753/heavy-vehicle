/**
 * Part Model
 * HeavyWheels spare parts listing schema.
 */

const mongoose = require("mongoose");
const { VEHICLE_TYPE_SLUGS } = require("../config/taxonomy");
const { PART_CATEGORY_SLUGS, PART_TYPE_VALUES, WARRANTY_VALUES } = require("../config/partTaxonomy");

const partSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Urdu translations of the canonical (English) title/description above,
    // filled at post time by the translation service. Empty when unavailable.
    titleUr: { type: String, trim: true, default: "" },
    descriptionUr: { type: String, trim: true, default: "" },

    category: {
      type: String,
      required: [true, "Category is required"],
      // Source of truth: backend/src/config/partTaxonomy.js
      enum: PART_CATEGORY_SLUGS,
      lowercase: true,
    },

    // Specific part within the category (e.g. "cylinder-head", "brake-pads").
    // Free string validated against the frontend's per-category list — kept
    // schema-free here so the controlled vocabulary lives in one place.
    subcategory: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    // OEM / genuine / aftermarket sourcing.
    partType: {
      type: String,
      enum: PART_TYPE_VALUES,
      default: "",
    },

    // Warranty offered with the part ("" = unspecified, "none" = as-is).
    warranty: {
      type: String,
      enum: WARRANTY_VALUES,
      default: "",
    },

    compatibleTypes: [
      { type: String, enum: VEHICLE_TYPE_SLUGS },
    ],

    make: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    model: {
      type: String,
      trim: true,
      default: "",
    },

    condition: {
      type: String,
      enum: ["new", "used", "imported", "rebuilt"],
      default: "used",
      lowercase: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    priceDisplay: {
      type: String,
      default: "",
    },

    negotiable: {
      type: Boolean,
      default: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: [0, "Quantity cannot be negative"],
    },

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

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        isCover: { type: Boolean, default: false },
      },
    ],

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller ID is required"],
    },

    seller: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      city: { type: String, default: "" },
      verified: { type: Boolean, default: false },
      // Denormalized: seller is a dealer with an approved warranty badge.
      // Synced when admin approves/revokes the dealer's warranty. Mirrors
      // the same field on Vehicle — a part listing shows the badge too.
      warranty: { type: Boolean, default: false },
      totalAds: { type: Number, default: 0 },
      memberSince: { type: Number, default: 0 },
      avatar: { type: String, default: "" },
      // Seller's subscription tier, synced on plan changes. Drives the
      // plan ribbon/icon/theme shown on the listing card.
      plan: { type: String, default: "free" },
    },

    status: {
      type: String,
      enum: ["draft", "pending", "active", "sold", "expired", "rejected"],
      default: "active",
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

    // ── One-time boosts (Phase 4) ─────────────────────────────
    featuredUntil: { type: Date },
    bumpedAt: { type: Date, default: Date.now },
    urgent: { type: Boolean, default: false },
    urgentUntil: { type: Date },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },

    // When the last "your ad is expiring" reminder was sent. Used by the
    // maintenance sweep to throttle reminders to roughly once a day.
    lastRenewalReminderAt: { type: Date },

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
        return ret;
      },
    },
  }
);

partSchema.index({ city: 1 });
partSchema.index({ make: 1 });
partSchema.index({ category: 1 });
partSchema.index({ subcategory: 1 });
partSchema.index({ partType: 1 });
partSchema.index({ price: 1 });
partSchema.index({ condition: 1 });
partSchema.index({ status: 1 });
partSchema.index({ featured: 1 });
partSchema.index({ sellerId: 1 });
partSchema.index({ createdAt: -1 });
partSchema.index({ bumpedAt: -1 });
partSchema.index({ status: 1, category: 1, city: 1 });
partSchema.index({ title: "text", description: "text", make: "text", model: "text", city: "text", category: "text" });

partSchema.pre("save", function () {
  if (this.isModified("price") || !this.priceDisplay) {
    this.priceDisplay = formatPricePKR(this.price);
  }

  if (this.images?.length > 0) {
    this.images.forEach((img, i) => {
      img.isCover = i === 0;
    });
  }
});

partSchema.virtual("coverImage").get(function () {
  return this.images?.[0]?.url || "";
});

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

module.exports = mongoose.model("Part", partSchema);
