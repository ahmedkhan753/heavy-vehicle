/**
 * Sale Routes  → mounted at /api/sales
 */

const express = require("express");
const { getMyPurchases, confirm, dispute } = require("../controllers/sale.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/purchases", protect, getMyPurchases);
router.patch("/:id/confirm", protect, confirm);
router.patch("/:id/dispute", protect, dispute);

module.exports = router;
