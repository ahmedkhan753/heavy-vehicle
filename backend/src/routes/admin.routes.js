/**
 * Admin Routes → mounted at /api/admin
 * All admin-only: dashboard analytics, subscribers, user management.
 */

const express = require("express");
const {
  getOverview, listSubscribers, listUsers, setUserRole, setUserBan,
} = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

const router = express.Router();

// Everything here is admin-only.
router.use(protect, restrictTo("admin"));

router.get("/overview", getOverview);
router.get("/subscribers", listSubscribers);
router.get("/users", listUsers);
router.patch("/users/:id/role", setUserRole);
router.patch("/users/:id/ban", setUserBan);

module.exports = router;
