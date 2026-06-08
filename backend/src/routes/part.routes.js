/**
 * Part Routes
 * GET    /api/parts
 * GET    /api/parts/featured
 * GET    /api/parts/my-parts
 * GET    /api/parts/:id
 * POST   /api/parts
 * PUT    /api/parts/:id
 * DELETE /api/parts/:id
 * PATCH  /api/parts/:id/sold
 * POST   /api/parts/:id/view
 */

const express = require("express");
const { body } = require("express-validator");
const { PART_CATEGORY_SLUGS, PART_TYPE_VALUES, WARRANTY_VALUES } = require("../config/partTaxonomy");
const {
  list, getFeatured, getById, getMyParts,
  create, update, deletePart, markAsSold, incrementView,
} = require("../controllers/part.controller");
const { protect, optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

const createValidation = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 5, max: 120 }).withMessage("Title must be 5-120 characters"),

  body("description")
    .trim()
    .notEmpty().withMessage("Description is required")
    .isLength({ min: 20, max: 2000 }).withMessage("Description must be 20-2000 characters"),

  body("category")
    .notEmpty().withMessage("Category is required")
    .isIn(PART_CATEGORY_SLUGS).withMessage("Invalid category"),

  body("subcategory")
    .optional({ checkFalsy: true })
    .isLength({ max: 50 }).withMessage("Invalid subcategory"),

  body("partType")
    .optional({ checkFalsy: true })
    .isIn(PART_TYPE_VALUES).withMessage("Invalid part type"),

  body("warranty")
    .optional({ checkFalsy: true })
    .isIn(WARRANTY_VALUES).withMessage("Invalid warranty"),

  body("condition")
    .optional()
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
    .isLength({ min: 5, max: 120 }).withMessage("Title must be 5-120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 20, max: 2000 }).withMessage("Description must be 20-2000 characters"),

  body("price")
    .optional()
    .isInt({ min: 1 }).withMessage("Price must be a positive number"),
];

router.get("/", optionalAuth, list);
router.get("/featured", getFeatured);
router.get("/my-parts", protect, getMyParts);
router.post("/", protect, createValidation, create);
router.get("/:id", optionalAuth, getById);
router.post("/:id/view", incrementView);
router.put("/:id", protect, updateValidation, update);
router.delete("/:id", protect, deletePart);
router.patch("/:id/sold", protect, markAsSold);

module.exports = router;
