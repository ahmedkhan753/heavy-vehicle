/**
 * Dealer Routes
 * GET   /api/dealers                  → list dealers
 * GET   /api/dealers/me               → my dealer profile
 * PATCH /api/dealers/me/warranty      → request warranty badge
 * GET   /api/dealers/admin/warranty   → admin: warranty requests
 * PATCH /api/dealers/admin/:id/warranty → admin: approve/reject warranty
 * GET   /api/dealers/:id              → single dealer + listings
 * POST  /api/dealers/register         → register as dealer
 * PUT   /api/dealers/:id              → update dealer profile
 */

const express = require("express");
const { body } = require("express-validator");
const {
  list, getById, register, update,
  getMine, requestWarranty, adminListWarranty, adminReviewWarranty,
} = require("../controllers/dealer.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

const registerValidation = [
  body("businessName")
    .trim()
    .notEmpty().withMessage("Business name is required")
    .isLength({ max: 100 }).withMessage("Business name cannot exceed 100 characters"),

  body("city")
    .trim()
    .notEmpty().withMessage("City is required"),

  body("phone")
    .optional()
    .matches(/^(\+92|0092|0)?[3][0-9]{9}$/)
    .withMessage("Enter a valid Pakistani mobile number"),
];

const warrantyValidation = [
  body("terms")
    .trim()
    .notEmpty().withMessage("Describe your warranty terms")
    .isLength({ min: 10, max: 1500 }).withMessage("Terms must be 10–1500 characters"),
];

router.get("/", list);

// Specific routes BEFORE the parameterized "/:id".
router.get("/me", protect, getMine);
router.patch("/me/warranty", protect, warrantyValidation, requestWarranty);
router.get("/admin/warranty", protect, restrictTo("admin"), adminListWarranty);
router.patch("/admin/:id/warranty", protect, restrictTo("admin"), adminReviewWarranty);

router.post("/register", protect, registerValidation, register);

// Parameterized (keep last)
router.get("/:id", getById);
router.put("/:id", protect, update);

module.exports = router;
