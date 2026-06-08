/**
 * Payment Gateway Registry
 * ────────────────────────
 * Gateway-agnostic indirection so controllers never import a specific provider.
 * Adding PayFast later = write one driver file with the same interface
 * (isEnabled/createCheckoutSession/verifyWebhook/fetchPaymentStatus) and
 * register it in PROVIDERS below.
 */

const safepay = require("./safepay");

const PROVIDERS = {
  safepay,
};

// The provider that powers the "Pay with Card" button. Single place to switch.
const DEFAULT_PROVIDER = "safepay";

/**
 * @param {string} [name] - provider key; defaults to DEFAULT_PROVIDER
 * @returns {object} the provider driver
 */
function getGateway(name = DEFAULT_PROVIDER) {
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(`Unknown payment gateway: ${name}`);
  }
  return provider;
}

// Is *any* automated card rail available right now?
function cardEnabled() {
  return getGateway().isEnabled();
}

module.exports = { getGateway, cardEnabled, DEFAULT_PROVIDER };
