/**
 * Vehicle Routes
 * GET    /api/vehicles              → list (public)
 * GET    /api/vehicles/featured     → featured (public)
 * GET    /api/vehicles/my-ads       → my ads (protected)
 * GET    /api/vehicles/:id          → single (public)
 * GET    /api/vehicles/:id/similar  → similar (public)
 * POST   /api/vehicles              → create (protected)
 * PUT    /api/vehicles/:id          → update (protected)
 * DELETE /api/vehicles/:id          → delete (protected)
 * PATCH  /api/vehicles/:id/sold     → mark sold (protected)
 * POST   /api/vehicles/:id/view     → increment view (public)
 */

const express        = require("express");
const { body }       = require("express-validator");
const { VEHICLE_TYPE_SLUGS } = require("../config/taxonomy");
const {
  list, getById, getFeatured, getSimilar,
  getMyAds, create, update, deleteVehicle,
  markAsSold, incrementView,
} = require("../controllers/vehicle.controller");
const { protect, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

// ── Validation ────────────────────────────────────────────────

const createValidation = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 10, max: 120 }).withMessage("Title must be 10–120 characters"),

  body("description")
    .trim()
    .notEmpty().withMessage("Description is required")
    .isLength({ min: 30, max: 3000 }).withMessage("Description must be 30–3000 characters"),

  body("type")
    .notEmpty().withMessage("Vehicle type is required")
    .isIn(VEHICLE_TYPE_SLUGS).withMessage("Invalid vehicle type"),

  body("make")
    .trim()
    .notEmpty().withMessage("Make is required"),

  body("model")
    .trim()
    .notEmpty().withMessage("Model is required"),

  body("year")
    .notEmpty().withMessage("Year is required")
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage("Enter a valid year"),

  body("condition")
    .notEmpty().withMessage("Condition is required")
    .isIn(["new", "used", "imported", "rebuilt"]).withMessage("Invalid condition"),

  body("price")
    .notEmpty().withMessage("Price is required")
    .isInt({ min: 1 }).withMessage("Price must be a positive number"),

  body("city")
    .trim()
    .notEmpty().withMessage("City is required"),

  body("images")
    .isArray({ min: 1 }).withMessage("At least one image is required")
    .custom((images) => {
      if (images.length > 15) throw new Error("Maximum 15 images allowed");
      for (const img of images) {
        if (!img.url || !img.publicId) {
          throw new Error("Each image must have url and publicId");
        }
      }
      return true;
    }),
];

const updateValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 10, max: 120 }).withMessage("Title must be 10–120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 30, max: 3000 }).withMessage("Description must be 30–3000 characters"),

  body("price")
    .optional()
    .isInt({ min: 1 }).withMessage("Price must be a positive number"),

  body("year")
    .optional()
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage("Enter a valid year"),
];

// ── Routes ────────────────────────────────────────────────────

// Public routes (no auth required)
router.get("/",              optionalAuth, list);
router.get("/featured",      getFeatured);
router.get("/:id/similar",   getSimilar);
router.post("/:id/view",     incrementView);

// Protected routes (auth required)
router.get("/my-ads",        protect, getMyAds);
router.post("/",             protect, createValidation, create);

// Single vehicle (public with optional auth for saved state)
router.get("/:id",           optionalAuth, getById);

// Owner-only routes
router.put("/:id",           protect, updateValidation, update);
router.delete("/:id",        protect, deleteVehicle);
router.patch("/:id/sold",    protect, markAsSold);

module.exports = router;
