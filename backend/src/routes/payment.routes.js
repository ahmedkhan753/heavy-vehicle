/**
 * Payment Routes  → mounted at /api/payments
 *
 * NOTE: the webhook's RAW-body parser is mounted in server.js BEFORE the global
 * express.json(), scoped to the webhook path, so signatures verify against the
 * exact bytes Safepay sent.
 */

const express = require("express");
const { safepayWebhook, getStatus } = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

// Public, signature-authenticated (server-to-server).
router.post("/safepay/webhook", safepayWebhook);

// Authenticated — owner reads their payment status (callback page).
router.get("/:id/status", protect, getStatus);

module.exports = router;
