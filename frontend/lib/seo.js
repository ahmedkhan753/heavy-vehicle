/**
 * JSON-LD builders shared by vehicle/part detail pages.
 * Schema.org Product + BreadcrumbList — helps Google understand price,
 * availability and condition for a listing, and the category path it sits
 * under, beyond what plain OG tags convey.
 */

const SITE_URL = "https://heavywheelspk.com";

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
