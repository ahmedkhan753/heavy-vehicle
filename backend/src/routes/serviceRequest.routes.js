/**
 * Service Request Routes  → mounted at /api/service-requests
 * Generic for inspection and warranty requests.
 */

const express = require("express");
const { body } = require("express-validator");
const {
  create, getMine, getOne, cancel, adminList, adminUpdateStatus,
} = require("../controllers/serviceRequest.controller");
const ServiceRequest = require("../models/ServiceRequest");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

const createValidation = [
  body("serviceType")
    .notEmpty().withMessage("Service type is required")
    .isIn(ServiceRequest.SERVICE_TYPES).withMessage("Invalid service type"),

  body("notes")
    .optional()
    .isLength({ max: 2000 }).withMessage("Notes cannot exceed 2000 characters"),

  body("contact.phone")
    .optional({ checkFalsy: true })
    .matches(/^(\+92|0092|0)?[3][0-9]{9}$/).withMessage("Enter a valid Pakistani mobile number"),
];

const statusValidation = [
  body("status")
    .notEmpty().withMessage("Status is required")
    .isIn(ServiceRequest.STATUSES).withMessage("Invalid status"),
];

// Specific routes MUST come before the parameterized "/:id" route,
// otherwise "/mine" and "/admin" get captured as an :id.
router.post("/", protect, createValidation, create);
router.get("/mine", protect, getMine);

// Admin
router.get("/admin", protect, restrictTo("admin"), adminList);
router.patch("/admin/:id/status", protect, restrictTo("admin"), statusValidation, adminUpdateStatus);

// Parameterized (keep last)
router.get("/:id", protect, getOne);
router.patch("/:id/cancel", protect, cancel);

module.exports = router;
