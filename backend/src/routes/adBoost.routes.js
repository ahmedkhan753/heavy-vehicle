/**
 * Ad Boost Routes  → mounted at /api/ad-upgrades
 */

const express = require("express");
const {
  getOptions, checkout, checkoutCard, adminList, adminVerify, adminReject,
} = require("../controllers/adBoost.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/options", getOptions);
router.post("/checkout", protect, checkout);
router.post("/checkout/card", protect, checkoutCard);

router.get("/admin", protect, restrictTo("admin"), adminList);
router.patch("/admin/:id/verify", protect, restrictTo("admin"), adminVerify);
router.patch("/admin/:id/reject", protect, restrictTo("admin"), adminReject);

module.exports = router;
