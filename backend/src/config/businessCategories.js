/**
 * Business directory categories.
 *
 * These are businesses that SERVE the heavy-vehicle trade without selling
 * vehicles or parts as listings — workshops, tyre shops, crane rental and so
 * on. Kept deliberately broad and Pakistan-specific (truck adda ecosystem).
 *
 * Slugs are stored on the Business document and must stay stable; the frontend
 * holds the matching labels/Urdu in lib/businesses.js — keep the two in sync.
 */

const BUSINESS_CATEGORIES = [
  "workshop",
  "body-builder",
  "denting-painting",
  "auto-electrician",
  "tyres",
  "parts-shop",
  "crane-rental",
  "machinery-rental",
  "transporter",
  "towing-recovery",
  "insurance",
  "tracker-gps",
  "driver-training",
  "fuel-lubricants",
  "ac-cooling",
  "other",
];

module.exports = { BUSINESS_CATEGORIES };
