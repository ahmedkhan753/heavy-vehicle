/**
 * Chat Routes  → mounted at /api/chat
 */

const express = require("express");
const {
  startConversation, listConversations, unreadCount, getMessages, sendMessage,
} = require("../controllers/chat.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect); // all chat requires auth

router.post("/conversations", startConversation);
router.get("/conversations", listConversations);
router.get("/unread", unreadCount);
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);

module.exports = router;
