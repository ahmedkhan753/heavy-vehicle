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

module.exports = { rejectHtmlTags, HTML_TAG_RE };
