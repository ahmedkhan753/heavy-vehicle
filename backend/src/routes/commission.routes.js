/**
 * Commission Routes  → mounted at /api/commissions
 */

const express = require("express");
const {
  getMine, pay, adminList, adminMarkPaid, adminWaive,
} = require("../controllers/commission.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Seller
router.get("/me", protect, getMine);
router.post("/:id/pay", protect, pay);

// Admin
router.get("/admin", protect, restrictTo("admin"), adminList);
router.patch("/admin/:id/paid", protect, restrictTo("admin"), adminMarkPaid);
router.patch("/admin/:id/waive", protect, restrictTo("admin"), adminWaive);

module.exports = router;
