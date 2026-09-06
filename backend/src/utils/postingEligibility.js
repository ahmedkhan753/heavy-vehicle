/**
 * Posting Eligibility
 * ───────────────────
 * A seller must have a usable contact profile before they can publish a
 * listing. Browsing, saving, messaging and contacting sellers stay open to
 * every signed-in account — this gate applies only at the point of posting.
 *
 * The reason is concrete rather than bureaucratic: vehicle/part create()
 * denormalizes the seller's phone onto the listing (seller.phone, and
 * seller.whatsapp falls back to it). An account with no phone produces a
 * listing that no buyer can act on, which is worse than no listing at all.
 * Social sign-ups start with no phone at all, so without this they could
 * publish uncontactable ads.
 */

const { AppError } = require("../middleware/error.middleware");

// Same rule used at registration and on the User model, so a number accepted
// here is one the rest of the system already considers valid.
const PK_MOBILE_RE = /^(\+92|0092|0)?[3][0-9]{9}$/;

const LABELS = {
  phone: "a valid Pakistani mobile number",
  city:  "your city",
};

/**
 * Which required profile fields are missing or unusable.
 * @param {Object} user - a User document (req.user)
 * @returns {string[]} field names, empty when the profile is complete
 */
function missingProfileFields(user) {
  const missing = [];

  const phone = String(user?.phone || "").trim();
  if (!phone || !PK_MOBILE_RE.test(phone)) missing.push("phone");

  const city = String(user?.city || "").trim();
  if (!city) missing.push("city");

  // Email verification is deliberately NOT required here yet. Requiring it
  // today would block an existing dealer who has a live listing but never
  // clicked their verification link, and outbound mail delivery hasn't been
  // confirmed — so it would be a one-way door for them. Add "email" to this
  // list once verification mail is known to arrive reliably; social accounts
  // (googleId/facebookId) should stay exempt, since the provider already
  // proved ownership of the address.
  return missing;
}

/**
 * Throw unless the user may publish a listing.
 * Carries the stable code PROFILE_INCOMPLETE so the UI can show a "complete
 * your profile" prompt rather than a bare error string — the same pattern
 * PLAN_LIMIT_REACHED already uses.
 * @param {Object} user - req.user
 * @throws {AppError} 403 when the profile is incomplete
 */
function assertCanPost(user) {
  const missing = missingProfileFields(user);
  if (missing.length === 0) return;

  const readable = missing.map((f) => LABELS[f] || f);
  const list =
    readable.length === 1
      ? readable[0]
      : `${readable.slice(0, -1).join(", ")} and ${readable[readable.length - 1]}`;

  throw new AppError(
    `Please add ${list} to your profile before posting an ad.`,
    403,
    missing.map((field) => ({ field, message: `${LABELS[field] || field} is required to post.` })),
    "PROFILE_INCOMPLETE"
  );
}

module.exports = { assertCanPost, missingProfileFields, PK_MOBILE_RE };
