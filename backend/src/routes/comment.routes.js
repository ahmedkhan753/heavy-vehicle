/**
 * Comment Routes  → mounted at /api/comments
 */

const express = require("express");
const { list, create, remove } = require("../controllers/comment.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", list);                 // public
router.post("/", protect, create);     // auth
router.delete("/:id", protect, remove); // auth (author/owner/admin)

module.exports = router;
