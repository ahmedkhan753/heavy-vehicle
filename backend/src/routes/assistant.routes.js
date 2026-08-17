const express = require("express");
const rateLimit = require("express-rate-limit");
const { getAssistantReply } = require("../services/assistant");

const router = express.Router();

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 12;

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many assistant requests. Please wait a moment and try again.",
  },
});

router.use(assistantLimiter);

router.post("/chat", async (req, res, next) => {
  try {
    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history)
      ? req.body.history.slice(-MAX_HISTORY_ITEMS)
      : [];

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message to continue.",
      });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    const reply = await getAssistantReply({ message, history });

    return res.status(200).json({
      success: reply.success !== false,
      message: reply.text,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
