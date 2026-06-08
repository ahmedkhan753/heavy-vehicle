/**
 * User Routes
 * GET    /api/users/profile         → get profile
 * PUT    /api/users/profile         → update profile
 * GET    /api/users/saved           → get saved ads
 * POST   /api/users/saved/:vehicleId→ save ad
 * DELETE /api/users/saved/:vehicleId→ unsave ad
 * PUT    /api/users/password        → change password
 */

const express  = require("express");
const { body } = require("express-validator");
const {
  getProfile, updateProfile, getSavedAds,
  saveAd, unsaveAd, changePassword,
} = require("../controllers/user.controller");
const { protect }            = require("../middleware/auth.middleware");
const { handleSingleUpload } = require("../middleware/upload.middleware");

const router = express.Router();

// All user routes require authentication
router.use(protect);

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage("Name must be 2–60 characters"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),

  body("confirmPassword")
    .custom((val, { req }) => {
      if (val !== req.body.newPassword) throw new Error("Passwords do not match");
      return true;
    }),
];

router.get("/profile",               getProfile);
router.put("/profile", handleSingleUpload, updateProfileValidation, updateProfile);
router.get("/saved",                 getSavedAds);
router.post("/saved/:vehicleId",     saveAd);
router.delete("/saved/:vehicleId",   unsaveAd);
router.put("/password", changePasswordValidation, changePassword);

module.exports = router;
