/**
 * Notification Routes → mounted at /api/notifications
 */

const express = require("express");
const { adminPendingCounts, myNotifications } = require("../controllers/notification.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/admin-counts", protect, restrictTo("admin"), adminPendingCounts);
router.get("/me", protect, myNotifications);

module.exports = router;
