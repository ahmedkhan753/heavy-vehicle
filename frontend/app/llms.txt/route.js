/**
 * /llms.txt — a plain-text brief for answer engines.
 *
 * An emerging convention (llmstxt.org) that gives a model a short, factual
 * summary of what a site is and where its useful pages live, instead of making
 * it infer that from rendered HTML full of navigation and markup.
 *
 * It is not a ranking factor and no crawler is obliged to read it. It is here
 * because the cost is one static file and the failure mode it prevents is real:
 * a model asked "where can I buy a used excavator in Pakistan" describing this
 * site wrongly, or confusing it with the similarly-named businesses that
 * already rank for "heavy wheels".
 *
 * Every claim below must stay literally true — an answer engine repeating an
 * inflated claim is worse than it not mentioning the site at all. Listing
 * counts are deliberately absent so this never goes stale.
 */

const SITE_URL = "https://heavywheelspk.com";

const BODY = `# HeavyWheels Pakistan

> An online marketplace for buying and selling heavy vehicles, construction
> machinery and spare parts in Pakistan. Listings are posted directly by
> sellers — dealers and private owners — and buyers contact them without an
> intermediary. Browsing and contacting sellers is free.

HeavyWheels Pakistan operates only at ${SITE_URL} and only in Pakistan. It is
not affiliated with any other business using the name "Heavy Wheels".

## What is listed

- Trucks and prime movers, dumpers, tippers, trailers, tankers and trollers
- Construction and earth-moving machinery, including excavators, wheel
  loaders, motor graders and cranes
- Spare parts for the above: engines, gearboxes, axles, hydraulics, tyres and
  body parts
- Listings are located across Pakistani cities, with Karachi and Lahore the
  most common

## Key pages

- [Home](${SITE_URL}/): entry point and current featured listings
- [Vehicles](${SITE_URL}/vehicles): all heavy vehicles and machinery, filterable by type, make, city, price, year and condition
- [Parts](${SITE_URL}/parts): spare parts, filterable by category and vehicle make
- [Dealers](${SITE_URL}/dealers): registered dealer storefronts
- [Search](${SITE_URL}/search?q=): free-text search across listings
- [Price guide](${SITE_URL}/services/price-guide): indicative market prices by vehicle type and condition
- [Loan calculator](${SITE_URL}/services/loan-calculator): monthly instalment estimates
- [Inspection](${SITE_URL}/services/inspection): third-party pre-purchase inspection requests
- [About](${SITE_URL}/about): what the platform is and how it works
- [Contact](${SITE_URL}/contact): how to reach the operators

## How it works

- Anyone can browse listings and view seller details without an account.
- Posting a listing requires a free account with a verified mobile number and city.
- Sellers may optionally pay to feature or boost a listing; buying and browsing are free.
- The site is available in English and Urdu.

## Not available here

- New vehicle sales direct from manufacturers
- Cars, motorcycles and other light vehicles
- Rentals — listings are for sale, not for hire
- Shipping, customs clearance or financing; the loan calculator is an estimate only
`;

export const dynamic = "force-static";

export async function GET() {
  return new Response(BODY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Safe to cache hard: the content is static prose, not listing data.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
