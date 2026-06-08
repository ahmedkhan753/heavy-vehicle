/**
 * Subscription Routes  → mounted at /api/subscriptions
 */

const express = require("express");
const {
  getPlans, getMine, checkout, checkoutCard,
  featureListing, unfeatureListing,
  adminListPayments, adminVerify, adminReject,
} = require("../controllers/subscription.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Public
router.get("/plans", getPlans);

// Authenticated
router.get("/me", protect, getMine);
router.post("/checkout", protect, checkout);
router.post("/checkout/card", protect, checkoutCard);
router.post("/feature/:vehicleId", protect, featureListing);
router.delete("/feature/:vehicleId", protect, unfeatureListing);

// Admin
router.get("/admin/payments", protect, restrictTo("admin"), adminListPayments);
router.patch("/admin/payments/:id/verify", protect, restrictTo("admin"), adminVerify);
router.patch("/admin/payments/:id/reject", protect, restrictTo("admin"), adminReject);

module.exports = router;
