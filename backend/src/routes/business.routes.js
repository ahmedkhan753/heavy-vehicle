/**
 * Business Routes  → mounted at /api/businesses
 *
 * GET   /api/businesses                    → public directory (approved only)
 * GET   /api/businesses/me                 → my listing
 * POST  /api/businesses/register           → file a listing application
 * GET   /api/businesses/admin/applications → admin queue
 * PATCH /api/businesses/admin/:id/approval → admin approve/reject
 * PATCH /api/businesses/admin/:id/featured → admin toggle promotion
 * GET   /api/businesses/:id                → single listing
 * PUT   /api/businesses/:id                → update own listing
 */

const express = require("express");
const { body } = require("express-validator");
const {
  list, getById, getMine, register, update,
  adminList, adminReview, adminToggleFeatured,
} = require("../controllers/business.controller");
const { protect, restrictTo, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

const registerValidation = [
  body("businessName")
    .trim()
    .notEmpty().withMessage("Business name is required")
    .isLength({ max: 100 }).withMessage("Business name cannot exceed 100 characters"),

  body("category")
    .trim()
    .notEmpty().withMessage("Category is required"),

  body("city")
    .trim()
    .notEmpty().withMessage("City is required"),

  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^(\+92|0092|0)?[3][0-9]{9}$/)
    .withMessage("Enter a valid Pakistani mobile number"),
];

router.get("/", list);

// Specific routes BEFORE the parameterized "/:id".
router.get("/me", protect, getMine);
router.get("/admin/applications", protect, restrictTo("admin"), adminList);
router.patch("/admin/:id/approval", protect, restrictTo("admin"), adminReview);
router.patch("/admin/:id/featured", protect, restrictTo("admin"), adminToggleFeatured);

router.post("/register", protect, registerValidation, register);

// Parameterized (keep last). optionalAuth so an owner can preview their own
// not-yet-approved listing without making the route login-only.
router.get("/:id", optionalAuth, getById);
router.put("/:id", protect, update);

module.exports = router;
