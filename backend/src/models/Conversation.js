/**
 * Conversation Model
 * ──────────────────
 * A 1-to-1 chat thread between a buyer and a seller about one listing.
 * Exactly one conversation per (vehicle, buyer). The seller is the listing
 * owner. Unread counts are tracked per side so we can badge the inbox/navbar
 * without scanning messages.
 */

const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    vehicleTitle: { type: String, default: "" }, // denormalized for the inbox

    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date },
    lastSender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    buyerUnread: { type: Number, default: 0 },
    sellerUnread: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
  }
);

// One thread per buyer per listing.
conversationSchema.index({ vehicle: 1, buyer: 1 }, { unique: true });
conversationSchema.index({ buyer: 1, lastMessageAt: -1 });
conversationSchema.index({ seller: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
