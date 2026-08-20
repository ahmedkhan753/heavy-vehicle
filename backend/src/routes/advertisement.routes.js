/**
 * Advertisement Routes → mounted at /api/ads
 *
 * GET   /api/ads?placement=header   → banners to render (public)
 * GET   /api/ads/:id/click          → count + redirect to the advertiser
 * POST  /api/ads/:id/impression     → count a view
 * POST  /api/ads/request            → advertiser enquiry
 * GET   /api/ads/admin              → admin campaign list
 * POST  /api/ads/admin              → admin create campaign
 * PUT   /api/ads/admin/:id          → admin update
 * DELETE/api/ads/admin/:id          → admin delete
 */

const express = require("express");
const { body } = require("express-validator");
const {
  serve, click, impression, request,
  adminList, adminCreate, adminUpdate, adminRemove,
} = require("../controllers/advertisement.controller");
const { protect, restrictTo, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

const requestValidation = [
  body("advertiserName")
    .trim()
    .notEmpty().withMessage("Business or brand name is required")
    .isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),
  body("contactPhone")
    .trim()
    .notEmpty().withMessage("A contact number is required"),
];

// Admin routes first so "/admin" isn't captured by "/:id".
router.get("/admin", protect, restrictTo("admin"), adminList);
router.post("/admin", protect, restrictTo("admin"), adminCreate);
router.put("/admin/:id", protect, restrictTo("admin"), adminUpdate);
router.delete("/admin/:id", protect, restrictTo("admin"), adminRemove);

router.post("/request", optionalAuth, requestValidation, request);

router.get("/", serve);
router.get("/:id/click", click);
router.post("/:id/impression", impression);

module.exports = router;
