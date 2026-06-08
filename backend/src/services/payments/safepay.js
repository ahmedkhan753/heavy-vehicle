/**
 * Safepay Driver — ISOLATED PROVIDER ADAPTER
 * ───────────────────────────────────────────
 * Every Safepay-specific HTTP/signature detail lives in THIS file and nowhere
 * else. The rest of the app talks to a stable interface:
 *   isEnabled(), createCheckoutSession(), verifyWebhook(), fetchPaymentStatus()
 *
 * No npm dependency — uses Node 18+ global fetch + the built-in crypto module.
 *
 * ⚠️  VERIFY-AGAINST-DOCS SURFACE
 * Safepay has versioned its API over time. The endpoint paths, request/response
 * field names, and the webhook signature header below follow Safepay's published
 * checkout pattern, but MUST be confirmed against your Safepay dashboard docs and
 * validated with real sandbox keys. Everything is centralised in the CONFIG block
 * and the small parse helpers, so any change is a one-spot edit.
 */

const crypto = require("crypto");
const { env } = require("../../config/env");

// ── CONFIG (the verify-against-docs surface) ──────────────────
const HOSTS = {
  sandbox: "https://sandbox.api.getsafepay.com",
  production: "https://api.getsafepay.com",
};

// Path that creates a payment session and returns a tracker token.
const INIT_PATH = "/order/v1/init";
// Path used to read an order/payment's current status by tracker.
const STATUS_PATH = "/order/v1/payments"; // + `/${tracker}`
// Hosted checkout page the buyer is redirected to.
const CHECKOUT_PATH = "/embedded/";
// Header Safepay signs each webhook payload with (HMAC-SHA256 hex of raw body).
const SIGNATURE_HEADER = "x-sfpy-signature";

function environment() {
  return env.SAFEPAY_ENVIRONMENT === "production" ? "production" : "sandbox";
}

function host() {
  return HOSTS[environment()];
}

/**
 * Card rail is available only when the gateway is configured. Keeps the whole
 * feature dark (and the UI button hidden) until real keys are added to .env.
 */
function isEnabled() {
  return Boolean(env.SAFEPAY_API_KEY && env.SAFEPAY_SECRET_KEY && env.SAFEPAY_WEBHOOK_SECRET);
}

// Defensive extraction — tolerate small response-shape differences so a docs
// tweak is contained to these helpers.
function pickToken(json) {
  return (
    json?.data?.token ||
    json?.data?.tracker ||
    json?.token ||
    json?.tracker ||
    ""
  );
}

function pickStatus(json) {
  const raw = (
    json?.data?.payment?.state ||
    json?.data?.state ||
    json?.data?.status ||
    json?.status ||
    ""
  );
  return String(raw).toUpperCase();
}

// Map Safepay's state strings onto our internal Payment.status vocabulary.
const SUCCESS_STATES = new Set(["PAID", "TRACKER_ENDED", "COMPLETED", "SUCCEEDED", "CAPTURED"]);
const FAILED_STATES = new Set(["FAILED", "DECLINED", "CANCELLED", "ERROR", "EXPIRED", "VOIDED"]);

function normalizeStatus(safepayState) {
  const s = String(safepayState || "").toUpperCase();
  if (SUCCESS_STATES.has(s)) return "verified";
  if (FAILED_STATES.has(s)) return "failed";
  return "pending";
}

/**
 * Create a hosted-checkout session.
 * @param {{amount:number, currency:string, orderId:string, customer?:object,
 *          redirectUrl:string, cancelUrl:string}} params
 * @returns {Promise<{checkoutUrl:string, tracker:string}>}
 */
async function createCheckoutSession({ amount, currency, orderId, customer = {}, redirectUrl, cancelUrl }) {
  if (!isEnabled()) {
    throw new Error("Safepay is not configured.");
  }

  // 1. Initialise the order → get a tracker token.
  const initRes = await fetch(`${host()}${INIT_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client: env.SAFEPAY_API_KEY,
      amount,
      currency,
      environment: environment(),
      order_id: String(orderId),
    }),
  });

  const initJson = await initRes.json().catch(() => ({}));
  if (!initRes.ok) {
    throw new Error(`Safepay init failed (${initRes.status}): ${initJson?.error || initRes.statusText}`);
  }

  const tracker = pickToken(initJson);
  if (!tracker) {
    throw new Error("Safepay init returned no tracker token.");
  }

  // 2. Build the hosted-checkout URL the browser is redirected to.
  const qs = new URLSearchParams({
    env: environment(),
    beacon: tracker,
    source: "custom",
    order_id: String(orderId),
    redirect_url: redirectUrl,
    cancel_url: cancelUrl,
  });
  const checkoutUrl = `${host()}${CHECKOUT_PATH}?${qs.toString()}`;

  return { checkoutUrl, tracker };
}

/**
 * Verify a webhook's signature against the raw request body and extract the
 * tracker + normalized status. NEVER trust an unsigned/invalid webhook.
 * @param {Buffer|string} rawBody - exact bytes Express received
 * @param {object} headers - req.headers
 * @returns {{valid:boolean, tracker:string, status:string, raw:object}}
 */
function verifyWebhook(rawBody, headers = {}) {
  const provided = headers[SIGNATURE_HEADER] || headers[SIGNATURE_HEADER.toLowerCase()] || "";
  const payload = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");

  const expected = crypto
    .createHmac("sha256", env.SAFEPAY_WEBHOOK_SECRET || "")
    .update(payload, "utf8")
    .digest("hex");

  const valid = safeEqualHex(provided, expected);

  let raw = {};
  try {
    raw = JSON.parse(payload);
  } catch {
    raw = {};
  }

  const tracker = pickToken(raw) || raw?.data?.tracker || raw?.tracker || "";
  const status = normalizeStatus(pickStatus(raw));

  return { valid, tracker, status, raw };
}

// Constant-time compare of two hex strings (avoids leaking via timing).
function safeEqualHex(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Read a payment's current status from Safepay (used by the callback page as a
 * fallback so we don't depend solely on webhook timing).
 * @param {string} tracker
 * @returns {Promise<string>} normalized status: "verified"|"failed"|"pending"
 */
async function fetchPaymentStatus(tracker) {
  if (!isEnabled() || !tracker) return "pending";
  try {
    const res = await fetch(`${host()}${STATUS_PATH}/${encodeURIComponent(tracker)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Safepay reads the secret via this header for server-to-server calls.
        "X-SFPY-MERCHANT-SECRET": env.SAFEPAY_SECRET_KEY || "",
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return "pending";
    return normalizeStatus(pickStatus(json));
  } catch {
    return "pending";
  }
}

module.exports = {
  name: "safepay",
  isEnabled,
  environment,
  createCheckoutSession,
  verifyWebhook,
  fetchPaymentStatus,
  normalizeStatus,
};
