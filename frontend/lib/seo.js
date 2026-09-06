/**
 * JSON-LD builders shared by vehicle/part detail pages.
 * Schema.org Product + BreadcrumbList — helps Google understand price,
 * availability and condition for a listing, and the category path it sits
 * under, beyond what plain OG tags convey.
 */

const SITE_URL = "https://heavywheelspk.com";

/**
 * Serialize a JSON-LD object for injection inside a <script> tag.
 *
 * JSON.stringify does NOT escape "<", ">" or "&", so a listing whose seller
 * typed a closing script tag into the title closed this block and ran
 * arbitrary JS on the page — with the access token sitting in localStorage,
 * that was full account takeover on every vehicle and part page. Titles and
 * descriptions are seller-supplied and only length-validated, so the escaping
 * has to happen here, at the point of injection.
 *
 * Each character is replaced with its six-character escape sequence, which
 * JSON reads as the same character but the HTML parser reads as ordinary
 * text — so no substring can close the surrounding tag. U+2028 and U+2029
 * are included because they are valid in JSON but are line terminators in
 * JavaScript, where an unescaped one is a syntax error.
 *
 * @param {unknown} data - any JSON-serializable value
 * @returns {string} safe to place inside <script type="application/ld+json">
 */
export function serializeJsonLd(data) {
  // Written as escape sequences rather than literal characters so this file
  // stays pure ASCII — U+2028 is a line terminator to a JS parser, and an
  // invisible one sitting in source breaks tooling in ways that are very
  // hard to see.
  const ESCAPES = {
    "<": "\\u003c",
    ">": "\\u003e",
    "&": "\\u0026",
    "\u2028": "\\u2028",
    "\u2029": "\\u2029",
  };
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (c) => ESCAPES[c]);
}

// Only "new" maps cleanly to schema.org's NewCondition; everything else
// (used, imported, rebuilt) is UsedCondition — schema.org has no finer
// enum, and guessing at RefurbishedCondition for "rebuilt" would overstate
// a claim the seller never made.
function conditionUrl(condition) {
  return condition === "new"
    ? "https://schema.org/NewCondition"
    : "https://schema.org/UsedCondition";
}

export function productJsonLd({ name, description, image, path, price, condition, brand, status }) {
  const url = `${SITE_URL}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    ...(image ? { image: [image] } : {}),
    url,
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    ...(condition ? { itemCondition: conditionUrl(condition) } : {}),
    ...(Number(price) > 0
      ? {
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "PKR",
            price: Number(price),
            availability: status === "sold" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

// items: [{ name, path }] in order, path relative ("/vehicles") or "" for home.
export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
