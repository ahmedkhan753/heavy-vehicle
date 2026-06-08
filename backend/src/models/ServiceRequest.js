/**
 * ServiceRequest Model
 * ────────────────────
 * One generic model for all "booking-style" services, keyed by serviceType.
 * Ownership Transfer is the first; Inspection and Warranty reuse this exact
 * shape (just a different serviceType + their own `details` fields).
 */

const mongoose = require("mongoose");

const SERVICE_TYPES = ["ownership-transfer", "inspection", "warranty"];
const STATUSES = ["pending", "in-progress", "completed", "cancelled", "rejected"];

// Short human-friendly reference prefix per service.
const PREFIX = {
  "ownership-transfer": "OT",
  inspection: "INS",
  warranty: "WR",
};

const serviceRequestSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: SERVICE_TYPES,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    status: {
      type: String,
      enum: STATUSES,
      default: "pending",
    },

    // Optional link to a listing this request is about.
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // For standalone requests (vehicle not listed on HeavyWheels).
    vehicleInfo: {
      make: { type: String, trim: true, default: "" },
      model: { type: String, trim: true, default: "" },
      year: { type: Number, default: null },
      registrationNumber: { type: String, trim: true, default: "" },
    },

    // Contact details (prefilled from the user's profile, editable).
    contact: {
      name: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, lowercase: true, default: "" },
    },

    // Free-text message from the user.
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
      default: "",
    },

    // Service-specific structured fields (e.g. transfer direction).
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Human-friendly tracking reference, e.g. "OT-LXTZ4291".
    reference: {
      type: String,
      unique: true,
      index: true,
    },

    // Status timeline.
    history: [
      {
        status: { type: String, enum: STATUSES },
        note: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],

    adminNotes: {
      type: String,
      select: false,
      default: "",
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

serviceRequestSchema.index({ user: 1, createdAt: -1 });
serviceRequestSchema.index({ serviceType: 1, status: 1, createdAt: -1 });

// Generate a reference + seed the history on first save.
serviceRequestSchema.pre("validate", function () {
  if (!this.reference) {
    const prefix = PREFIX[this.serviceType] || "SR";
    const stamp = Date.now().toString(36).toUpperCase().slice(-5);
    const rand = Math.floor(Math.random() * 900 + 100);
    this.reference = `${prefix}-${stamp}${rand}`;
  }
  if (this.isNew && (!this.history || this.history.length === 0)) {
    this.history = [{ status: this.status || "pending", note: "Request submitted", at: new Date() }];
  }
});

module.exports = mongoose.model("ServiceRequest", serviceRequestSchema);
module.exports.SERVICE_TYPES = SERVICE_TYPES;
module.exports.STATUSES = STATUSES;
