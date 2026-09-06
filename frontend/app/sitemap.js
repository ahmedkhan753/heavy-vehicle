import { SERVER_API_BASE_URL } from "@/lib/api";

// Force this to render at request time, never prerendered at build time.
// At build time the only reachable backend is the public HTTPS URL (the
// internal Docker network / API_INTERNAL_URL doesn't exist yet — the
// backend container isn't even running as part of that build), and on this
// VPS a container reaching its own public IP is exactly the hairpin-NAT
// situation documented elsewhere in this project — unreliable at best. At
// request time the container's already up and SERVER_API_BASE_URL resolves
// to the internal backend:5000 address, which just works.
export const dynamic = "force-dynamic";

const SITE_URL = "https://heavywheelspk.com";

// Static, always-worth-indexing routes. Dashboard/admin/auth/payment are
// deliberately absent — those already carry noindex via their own layouts,
// and a sitemap entry for a page that says "don't index me" just wastes
// crawl budget arguing with itself.
const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/vehicles", priority: 0.9, changeFrequency: "hourly" },
  { path: "/parts", priority: 0.9, changeFrequency: "hourly" },
  { path: "/dealers", priority: 0.7, changeFrequency: "daily" },
  { path: "/businesses", priority: 0.6, changeFrequency: "daily" },
  // All three are indexable pages with their own title and description that
  // were simply never listed here, so nothing pointed a crawler at them.
  { path: "/featured", priority: 0.7, changeFrequency: "daily" },
  { path: "/inspectors", priority: 0.6, changeFrequency: "weekly" },
  { path: "/promote", priority: 0.4, changeFrequency: "monthly" },
  { path: "/post-ad", priority: 0.5, changeFrequency: "monthly" },
  { path: "/post-part", priority: 0.5, changeFrequency: "monthly" },
  { path: "/advertise", priority: 0.3, changeFrequency: "monthly" },
  { path: "/services", priority: 0.4, changeFrequency: "monthly" },
  { path: "/services/inspection", priority: 0.3, changeFrequency: "monthly" },
  { path: "/services/loan-calculator", priority: 0.3, changeFrequency: "monthly" },
  { path: "/services/price-guide", priority: 0.3, changeFrequency: "monthly" },
  { path: "/services/warranty", priority: 0.3, changeFrequency: "monthly" },
  { path: "/subscription-pricings", priority: 0.4, changeFrequency: "monthly" },
  { path: "/about", priority: 0.2, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.1, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.1, changeFrequency: "yearly" },
];

async function fetchSitemapIds(path) {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

// Category landing pages. /vehicles?type=excavator and /parts?category=engine
// already render with their own titles ("Excavators for Sale in Pakistan",
// "Engine Parts for Sale in Pakistan") and self-canonicalise — the metadata
// work was done, but nothing ever pointed a crawler at them. Search Console
// shows impressions for exactly these phrasings ("excavator", "engines for
// sale", "heavy machinery for sale in pakistan"), so these are the pages that
// should be competing for them.
//
// Built from live data rather than the full taxonomy, so a category page is
// only advertised while it actually has listings — an empty landing page is
// worse than no landing page.
//
// Deliberately limited to type and category. Both come from validated enums.
// make and city are free-text seller input and currently contain "hitichi",
// "hit" and "karachi pakistan", so building public URLs from them would
// publish misspellings as page titles.
async function fetchFacets() {
  try {
    const res = await fetch(`${SERVER_API_BASE_URL}/meta/filters`, { next: { revalidate: 3600 } });
    if (!res.ok) return { vehicleTypes: [], partCategories: [] };
    const json = await res.json();
    return {
      vehicleTypes: json.data?.vehicleTypes || [],
      partCategories: json.data?.partCategories || [],
    };
  } catch {
    return { vehicleTypes: [], partCategories: [] };
  }
}

export default async function sitemap() {
  const [vehicles, parts, facets] = await Promise.all([
    fetchSitemapIds("/vehicles/sitemap"),
    fetchSitemapIds("/parts/sitemap"),
    fetchFacets(),
  ]);

  const facetEntries = [
    ...facets.vehicleTypes.map((type) => ({
      url: `${SITE_URL}/vehicles?type=${encodeURIComponent(type)}`,
      changeFrequency: "daily",
      priority: 0.8,
    })),
    ...facets.partCategories.map((category) => ({
      url: `${SITE_URL}/parts?category=${encodeURIComponent(category)}`,
      changeFrequency: "daily",
      priority: 0.7,
    })),
  ];

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const vehicleEntries = vehicles.map((v) => ({
    url: `${SITE_URL}/vehicles/${v._id}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const partEntries = parts.map((p) => ({
    url: `${SITE_URL}/parts/${p._id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Category pages sit ahead of individual listings: they are stable URLs that
  // stay useful as stock turns over, whereas a listing URL dies when it sells.
  return [...staticEntries, ...facetEntries, ...vehicleEntries, ...partEntries];
}
