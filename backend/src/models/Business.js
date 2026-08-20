/**
 * Business Model
 * ───────────────
 * A directory listing for a business that serves the heavy-vehicle trade
 * (workshop, tyre shop, crane rental, insurance agent…) rather than selling
 * vehicles or parts.
 *
 * Like Dealer, registering only files an application — the listing stays
 * private and invisible until an admin approves it. One listing per account.
 */

const mongoose = require("mongoose");
const { BUSINESS_CATEGORIES } = require("../config/businessCategories");

const businessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ── Identity ──────────────────────────────────────────────
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      enum: BUSINESS_CATEGORIES,
      required: [true, "Category is required"],
      index: true,
    },
    tagline: { type: String, trim: true, maxlength: 160, default: "" },
    description: { type: String, trim: true, maxlength: 1500, default: "" },

    // ── Contact ───────────────────────────────────────────────
    phone: { type: String, trim: true, default: "" },
    whatsapp: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    website: { type: String, trim: true, default: "" },

    // ── Location ──────────────────────────────────────────────
    city: {
      type: String,
      required: [true, "City is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    area: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, maxlength: 200, default: "" },

    // ── Media ─────────────────────────────────────────────────
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    coverImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    photos: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],

    // ── Operations ────────────────────────────────────────────
    workingHours: { type: String, trim: true, default: "Mon–Sat: 9am–6pm" },
    establishedYear: { type: Number },
    servicesOffered: [{ type: String, trim: true }],

    // ── Admin approval ────────────────────────────────────────
    // Mirrors the Dealer flow: a listing is a request until reviewed.
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 500, default: "" },

    // Admin-controlled promotion — paid placement hooks into this later.
    featured: { type: Boolean, default: false, index: true },

    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Directory browsing is almost always "approved, in this city / category,
// featured first" — this covers the common query shapes.
businessSchema.index({ approvalStatus: 1, isActive: 1, featured: -1, createdAt: -1 });
businessSchema.index({ businessName: "text", description: "text", tagline: "text" });

module.exports = mongoose.model("Business", businessSchema);
