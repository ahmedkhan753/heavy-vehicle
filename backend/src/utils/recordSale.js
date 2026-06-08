/**
 * recordSale
 * ──────────
 * Shared logic for marking a listing sold. Creates a Sale record and, when
 * appropriate, the Commission.
 *
 *   - If a registered buyer is named → Sale is "pending"; the commission is
 *     created only when the buyer confirms (see sale.controller.confirm).
 *   - Otherwise → seller-attested: Sale is "confirmed" and the commission is
 *     created immediately.
 *
 * The commission's grace period comes from the SELLER's plan limits.
 */

const User = require("../models/User");
const Sale = require("../models/Sale");
const Commission = require("../models/Commission");
const { getEffectiveLimits } = require("./planLimits");

/**
 * @param {object} listing     - Vehicle/Part document
 * @param {string} listingType - "Vehicle" | "Part"
 * @param {number} salePrice
 * @param {string} [buyerContact] - buyer email or phone
 * @returns {Promise<{sale:object, commission:object|null}>}
 */
async function recordSale(listing, listingType, salePrice, buyerContact) {
  let buyer = null;
  const contact = (buyerContact || "").trim();
  if (contact) {
    buyer = await User.findOne({
      $or: [{ email: contact.toLowerCase() }, { phone: contact }],
    }).select("_id");
  }

  // A buyer can't "buy" their own listing.
  const buyerIsSeller = buyer && buyer._id.toString() === listing.sellerId.toString();
  const registeredBuyer = buyer && !buyerIsSeller;

  const sale = await Sale.create({
    listingType,
    listingId: listing._id,
    listingTitle: listing.title,
    sellerId: listing.sellerId,
    buyerId: registeredBuyer ? buyer._id : undefined,
    buyerContact: contact,
    salePrice,
    sellerConfirmed: true,
    buyerConfirmed: !registeredBuyer, // auto-confirmed when no registered buyer
    status: registeredBuyer ? "pending" : "confirmed",
  });

  let commission = null;
  if (!registeredBuyer) {
    const limits = await getEffectiveLimits(listing.sellerId);
    commission = await Commission.createForSale(listing, listingType, salePrice, limits.graceDays);
    if (commission) {
      sale.commissionId = commission._id;
      sale.confirmedAt = new Date();
      await sale.save();
    }
  }

  return { sale, commission };
}

module.exports = { recordSale };
