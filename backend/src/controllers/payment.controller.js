/**
 * Payment Controller (gateway webhook + status)
 * ─────────────────────────────────────────────
 *   safepayWebhook → POST /api/payments/safepay/webhook  (public, signed)
 *   getStatus      → GET  /api/payments/:id/status        (protected, owner)
 *
 * The webhook is the SOURCE OF TRUTH for card fulfillment. It is authenticated
 * by HMAC signature (not a login), runs on the RAW request body, and is
 * idempotent via fulfillPayment().
 */

const Payment = require("../models/Payment");
const { getGateway } = require("../services/payments/gateway");
const { fulfillPayment } = require("../utils/fulfillment");
const { AppError } = require("../middleware/error.middleware");

const respond = (res, statusCode, data, message = "Success") =>
  res.status(statusCode).json({ success: true, message, data });

// ─────────────────────────────────────────────────────────────
// SAFEPAY WEBHOOK — server-to-server, signature-verified
// Mounted with express.raw() so req.body is the exact bytes signed.
// ─────────────────────────────────────────────────────────────
async function safepayWebhook(req, res) {
  const gateway = getGateway("safepay");
  const { valid, tracker, status } = gateway.verifyWebhook(req.body, req.headers);

  // Reject anything we can't cryptographically trust. Nothing is fulfilled.
  if (!valid) {
    return res.status(400).json({ success: false, message: "Invalid signature." });
  }

  // Ack unknown trackers with 200 so Safepay stops retrying; nothing to do.
  if (!tracker) {
    return res.status(200).json({ success: true, message: "No tracker." });
  }

  try {
    const payment = await Payment.findOne({ gatewayRef: tracker });
    if (!payment) {
      return res.status(200).json({ success: true, message: "No matching payment." });
    }

    if (status === "verified") {
      await fulfillPayment(payment, { reviewNote: "Auto-verified via Safepay webhook." });
    } else if (status === "failed" && payment.status === "pending") {
      payment.status = "failed";
      payment.reviewNote = "Marked failed via Safepay webhook.";
      await payment.save();
    }
    // "pending" events: acknowledge, take no action.

    return res.status(200).json({ success: true, message: "Processed." });
  } catch (err) {
    // Log and 500 so Safepay retries (the operation is idempotent, so a retry
    // after a transient DB error is safe).
    console.error("❌ Safepay webhook processing error:", err.message);
    return res.status(500).json({ success: false, message: "Processing error." });
  }
}

// ─────────────────────────────────────────────────────────────
// GET PAYMENT STATUS — for the post-redirect callback page.
// Owner-only. If still pending, does a server-side Safepay re-check and
// fulfills on the spot (fallback for delayed/missing webhooks in dev).
// ─────────────────────────────────────────────────────────────
async function getStatus(req, res, next) {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError("Payment not found.", 404));

    const isOwner = payment.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return next(new AppError("You can only view your own payments.", 403));
    }

    // Fallback confirmation: if a card payment is still pending, ask Safepay
    // directly. If it's actually paid, fulfill now (idempotent).
    if (payment.status === "pending" && payment.gateway === "safepay" && payment.gatewayRef) {
      const gateway = getGateway("safepay");
      const liveStatus = await gateway.fetchPaymentStatus(payment.gatewayRef);
      if (liveStatus === "verified") {
        await fulfillPayment(payment, { reviewNote: "Confirmed via Safepay status check." });
      } else if (liveStatus === "failed") {
        payment.status = "failed";
        await payment.save();
      }
    }

    respond(res, 200, {
      id: payment._id,
      status: payment.status,
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { safepayWebhook, getStatus };
