/**
 * Shared express-validator helpers.
 */

// Matches an opening or closing HTML tag: "<" followed by an optional "/" and
// then a letter. Deliberately narrower than "reject every <" — sellers do
// legitimately write things like "mileage < 100000" or "< 5 years old" in a
// description, and rejecting those would be a bad listing form for no gain.
//
// This is defence in depth, not the fix. The XSS this guards against is fully
// closed at the point of injection by serializeJsonLd() in frontend/lib/seo.js:
// listing text reaches the page inside a <script type="application/ld+json">
// block, and everything else renders through React's own escaping. This layer
// exists so a future template that forgets to escape isn't instantly
// exploitable, and because no real heavy-vehicle listing needs markup.
const HTML_TAG_RE = /<\s*\/?\s*[a-zA-Z]/;

/**
 * express-validator .custom() predicate — throws when the value contains
 * something shaped like an HTML tag.
 * @param {string} value
 * @returns {true}
 */
function rejectHtmlTags(value) {
  if (typeof value === "string" && HTML_TAG_RE.test(value)) {
    throw new Error("HTML tags are not allowed here. Please use plain text.");
  }
  return true;
}

// ── Make / city canonicalisation ──────────────────────────────
// Listings previously stored whatever the seller typed, which left production
// holding "hitachi", "hitichi", "hit" and "hino pak" as four separate makes.
// Filtering is an exact match, so a buyer searching Hitachi missed three
// quarters of the Hitachi stock.
//
// These come in pairs, and the ORDER in the validation chain matters:
//   .custom(...)          rejects unrecognised input, with a suggestion
//   .customSanitizer(...) rewrites req.body so the controller stores the
//                         canonical slug rather than the raw text
// The validator runs on what the seller typed so the error can quote it back;
// the sanitizer then normalises what actually gets saved.
const {
  normalizeMake,
  normalizeCity,
  suggestMake,
  suggestCity,
} = require("../config/normalization");

// Turn a slug back into something readable for an error message.
const pretty = (slug) =>
  String(slug || "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function buildChecker(normalize, suggest, label) {
  return (value) => {
    if (normalize(value)) return true;

    const hint = suggest(value);
    throw new Error(
      hint
        ? `We don't recognise "${value}" as a ${label}. Did you mean "${pretty(hint)}"?`
        : `"${value}" isn't a ${label} we recognise. Please pick one from the list.`
    );
  };
}

const isKnownMake = buildChecker(normalizeMake, suggestMake, "make");
const isKnownCity = buildChecker(normalizeCity, suggestCity, "city");

// Fall back to the original value when unresolved so the .custom() above is
// what produces the error, rather than a confusing empty field.
const toCanonicalMake = (value) => normalizeMake(value) || value;
const toCanonicalCity = (value) => normalizeCity(value) || value;

module.exports = {
  rejectHtmlTags,
  HTML_TAG_RE,
  isKnownMake,
  isKnownCity,
  toCanonicalMake,
  toCanonicalCity,
};
