/**
 * Inspector Routes  → mounted at /api/inspectors
 */

const express = require("express");
const { body } = require("express-validator");
const {
  register, getMine, updateMine, list, getById, partner,
  adminList, adminVerify, adminToggle,
} = require("../controllers/inspector.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

const profileValidation = [
  body("displayName")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),
  body("city").trim().notEmpty().withMessage("City is required"),
  body("inspectionFee")
    .notEmpty().withMessage("Inspection fee is required")
    .isInt({ min: 0 }).withMessage("Fee must be a positive number"),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^(\+92|0092|0)?[3][0-9]{9}$/).withMessage("Enter a valid Pakistani mobile number"),
];

const partnerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("message").trim().isLength({ min: 5, max: 1500 }).withMessage("Message must be 5–1500 characters"),
];

// Public
router.get("/", list);
router.post("/partner", partnerValidation, partner);

// User (specific routes before "/:id")
router.post("/register", protect, profileValidation, register);
router.get("/me", protect, getMine);
router.put("/me", protect, profileValidation, updateMine);

// Admin
router.get("/admin", protect, restrictTo("admin"), adminList);
router.patch("/admin/:id/verify", protect, restrictTo("admin"), adminVerify);
router.patch("/admin/:id/active", protect, restrictTo("admin"), adminToggle);

// Public single (keep last)
router.get("/:id", getById);

module.exports = router;
