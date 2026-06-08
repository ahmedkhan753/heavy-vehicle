/**
 * Monetization config — SINGLE SOURCE OF TRUTH
 * ────────────────────────────────────────────
 * All prices are in PKR. Change values here only — never hardcode
 * prices, slot counts, or the commission rate anywhere else.
 *
 * Phase 0/1 use: COMMISSION_RATE, TC_VERSION.
 * Later phases (subscriptions, per-ad upgrades) read the rest.
 */

const CURRENCY = "PKR";

// Bump this whenever the Terms & Conditions text changes. Each seller's
// consent is stored against the version they actually agreed to.
const TC_VERSION = "2026-06-04";

// Seller success fee on a completed sale: 0.2% of the final sale price.
const COMMISSION_RATE = 0.002;

// Days a seller has to settle a commission before it counts as overdue
// (matches the "within 7 days" wording in the Terms).
const COMMISSION_GRACE_DAYS = 7;

const UNLIMITED = -1; // JSON-safe sentinel for "no slot limit"

// ── Per-ad one-time upgrades (Phase 4) ────────────────────────
const PER_AD = {
  featured: { price: 500, durationDays: 15 },
  premium: { price: 1200, durationDays: 30 },
};

// ── À-la-carte add-ons (Phase 4) ──────────────────────────────
const ADDONS = {
  bump: { price: 200 },
  extend30: { price: 300, durationDays: 30 },
  video: { price: 300 },
  extraPhotos: { price: 150, photos: 5 },
  urgent: { price: 150, durationDays: 15 },
};

// One-time, per-listing boosts a seller can buy WITHOUT a subscription.
// kind "upgrade" changes the ad tier; "addon" is a one-off enhancement.
const BOOSTS = {
  featured: { key: "featured", label: "Featured — top placement, 15 days", price: PER_AD.featured.price, durationDays: PER_AD.featured.durationDays, kind: "upgrade" },
  premium: { key: "premium", label: "Premium — homepage + 30 days", price: PER_AD.premium.price, durationDays: PER_AD.premium.durationDays, kind: "upgrade" },
  bump: { key: "bump", label: "Bump to top of newest", price: ADDONS.bump.price, kind: "addon" },
  extend30: { key: "extend30", label: "Extend listing +30 days", price: ADDONS.extend30.price, durationDays: ADDONS.extend30.durationDays, kind: "addon" },
  urgent: { key: "urgent", label: "Urgent tag, 15 days", price: ADDONS.urgent.price, durationDays: ADDONS.urgent.durationDays, kind: "addon" },
};

function getBoost(key) {
  return BOOSTS[key] || null;
}

// ── Free tier (no subscription) ───────────────────────────────
// maxActiveAds: how many live (active) listings a free user may have.
// graceDays: days to settle a commission before it counts as overdue.
const FREE_PLAN = {
  key: "free",
  name: "Free",
  maxActiveAds: 5,
  graceDays: 10,
};

// ── Dealer subscriptions (Phase 2 — built first) ──────────────
// commissionRate (optional): per-plan override of the default success fee.
//   Only Elite Pro overrides it (reduced 0.15% vs the standard 0.2%).
// keepListings: when true, listings are NOT auto-deleted at 30 days
//   (Pro and higher keep their inventory live).
const DEALER_PLANS = {
  starter: { key: "starter", name: "Starter", monthly: 1500, featuredSlots: 5, premiumSlots: 0, maxActiveAds: 25, graceDays: 15, keepListings: false },
  pro: { key: "pro", name: "Pro", monthly: 5000, featuredSlots: 15, premiumSlots: 2, maxActiveAds: 75, graceDays: 18, keepListings: true },
  elite: { key: "elite", name: "Elite", monthly: 12000, featuredSlots: UNLIMITED, premiumSlots: 5, maxActiveAds: UNLIMITED, graceDays: 20, keepListings: true },
  elitePro: { key: "elitePro", name: "Elite Pro", monthly: 15000, featuredSlots: UNLIMITED, premiumSlots: 5, maxActiveAds: UNLIMITED, graceDays: 20, keepListings: true, commissionRate: 0.0015 },
};

// Plan keys whose sellers' listings are exempt from the 30-day auto-deletion.
const DELETION_EXEMPT_PLANS = Object.values(DEALER_PLANS)
  .filter((p) => p.keepListings)
  .map((p) => p.key);

// Days a free/low-tier listing stays live before the deletion sweep removes
// it (sold or unsold). Pro+ plans are exempt — see DELETION_EXEMPT_PLANS.
const LISTING_LIFESPAN_DAYS = 30;

// Annual billing = pay for 10 months, get 12 (2 months free).
const ANNUAL_MONTHS_CHARGED = 10;

const BILLING_CYCLES = ["monthly", "annual"];

// ── Manual payment instructions (Phase 2 launch rail) ─────────
// EDIT THESE with your real business account details before going live.
// Shown to dealers on the checkout screen for bank/wallet transfers.
const MANUAL_PAYMENT = {
  bank: {
    bankName: "REPLACE_ME Bank",
    accountTitle: "HeavyWheels (Pvt) Ltd",
    accountNumber: "REPLACE_ME",
    iban: "REPLACE_ME",
  },
  jazzcash: { accountTitle: "HeavyWheels", number: "REPLACE_ME" },
  easypaisa: { accountTitle: "HeavyWheels", number: "REPLACE_ME" },
  note: "After transferring, upload your payment screenshot and enter the transaction ID. Your subscription activates once an admin verifies it (usually within 24 hours).",
};

const PAYMENT_METHODS = ["bank", "jazzcash", "easypaisa"];

/**
 * Commission owed on a given final sale price, rounded to whole rupees.
 * @param {number} salePrice
 * @returns {number} commission in PKR
 */
function commissionOn(salePrice) {
  return Math.round(Number(salePrice || 0) * COMMISSION_RATE);
}

/**
 * Look up a dealer plan by key.
 * @param {string} key - starter | pro | elite | elitePro
 * @returns {object|null}
 */
function getPlan(key) {
  return DEALER_PLANS[key] || null;
}

/**
 * Effective success-fee rate for a plan. Falls back to the standard rate
 * for the free tier and any plan that doesn't override it.
 * @param {string} key
 * @returns {number}
 */
function commissionRateForPlan(key) {
  const plan = getPlan(key);
  return plan && plan.commissionRate > 0 ? plan.commissionRate : COMMISSION_RATE;
}

/**
 * Whether a plan's listings survive the 30-day auto-deletion sweep.
 * @param {string} key
 * @returns {boolean}
 */
function keepsListings(key) {
  return DELETION_EXEMPT_PLANS.includes(key);
}

/**
 * Price (PKR) for a plan + billing cycle.
 * @param {string} key
 * @param {string} cycle - monthly | annual
 * @returns {number}
 */
function planPrice(key, cycle = "monthly") {
  const plan = getPlan(key);
  if (!plan) return 0;
  return cycle === "annual" ? plan.monthly * ANNUAL_MONTHS_CHARGED : plan.monthly;
}

/**
 * How many days a billing cycle covers.
 * @param {string} cycle
 * @returns {number}
 */
function cycleDays(cycle = "monthly") {
  return cycle === "annual" ? 365 : 30;
}

module.exports = {
  CURRENCY,
  TC_VERSION,
  COMMISSION_RATE,
  COMMISSION_GRACE_DAYS,
  UNLIMITED,
  PER_AD,
  ADDONS,
  BOOSTS,
  getBoost,
  FREE_PLAN,
  DEALER_PLANS,
  DELETION_EXEMPT_PLANS,
  LISTING_LIFESPAN_DAYS,
  BILLING_CYCLES,
  PAYMENT_METHODS,
  MANUAL_PAYMENT,
  commissionOn,
  commissionRateForPlan,
  keepsListings,
  getPlan,
  planPrice,
  cycleDays,
};
