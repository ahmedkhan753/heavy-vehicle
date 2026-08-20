/**
 * Report Routes  → mounted at /api/reports
 */

const express = require("express");
const { create, adminList, adminSetStatus } = require("../controllers/report.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Admin routes first — avoids "admin" ever being read as a listing id.
router.get("/admin", protect, restrictTo("admin"), adminList);
router.patch("/admin/status", protect, restrictTo("admin"), adminSetStatus);

router.post("/", protect, create);

module.exports = router;
