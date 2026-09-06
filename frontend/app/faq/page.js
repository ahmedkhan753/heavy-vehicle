import Link from "next/link";
import { serializeJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = {
  title: "Frequently Asked Questions",
  description:
    "How HeavyWheels works — buying and selling heavy vehicles, machinery and spare parts in Pakistan. Costs, contacting sellers, posting an ad, and which cities are covered.",
  alternates: { canonical: "/faq" },
};

/**
 * FAQ content.
 *
 * Two jobs beyond answering the question:
 *
 * 1. Answer engines. FAQPage markup is one of the formats ChatGPT, Perplexity
 *    and AI Overviews quote most readily, because each entry is already a
 *    self-contained question and answer. /llms.txt tells a model what this site
 *    is; this tells it what the site does, in the model's preferred shape.
 *
 * 2. Brand queries. The brand is written "HeavyWheels" everywhere in the
 *    product but almost everyone searching types "heavy wheels" as two words.
 *    The Organization schema in the root layout carries that as alternateName;
 *    prose that uses both spellings naturally gives the same signal in body
 *    text, which is where it also has to appear.
 *
 * Every answer must stay literally true. An answer engine repeating an inflated
 * claim is worse than it never mentioning the site — and unlike a marketing
 * page, nobody re-reads this once it ships. No listing counts, for that reason.
 */
const FAQS = [
  {
    q: "What is HeavyWheels?",
    a: "HeavyWheels — also written Heavy Wheels — is a Pakistani online marketplace for buying and selling heavy vehicles, construction machinery and spare parts. Listings are posted directly by the people who own them, dealers and private sellers alike, and buyers contact those sellers themselves. There is no agent in the middle and no commission charged to the buyer.",
  },
  {
    q: "Is HeavyWheels free to use?",
    a: "Browsing listings, searching, saving ads and contacting a seller are all free. Posting an ad is also free. Sellers can optionally pay to feature or boost a listing so it appears higher, and dealers can subscribe for a larger number of active ads — but nothing about buying costs money.",
  },
  {
    q: "What can I buy and sell on HeavyWheels?",
    a: "Trucks and prime movers, dumpers, tippers, trailers, tankers and trollers; construction and earth-moving machinery including excavators, wheel loaders, motor graders and cranes; and spare parts for all of these — engines, gearboxes, axles, hydraulics, tyres and body parts. It is for commercial and heavy vehicles specifically, not cars or motorcycles.",
  },
  {
    q: "Which cities in Pakistan does HeavyWheels cover?",
    a: "The whole country. Listings can be posted from any Pakistani city and filtered by location, so you can search within your own city or look nationwide. Karachi and Lahore are the busiest at the moment, as that is where most heavy-vehicle trade happens.",
  },
  {
    q: "How do I contact a seller?",
    a: "Sign in with a free account and the seller's phone number appears on the listing, along with a WhatsApp link where they have provided one. You can also message them through the site without leaving your own number. Sellers must add a verified mobile number before they can publish, so every listing has a working way to reach someone.",
  },
  {
    q: "How do I post an ad on Heavy Wheels?",
    a: "Create a free account, then use Post an Ad for a vehicle or Post a Part for spares. You will need at least one photo, the make, model, year, condition, price and your city. Your profile needs a mobile number and city before your first ad goes live, so that buyers can actually reach you.",
  },
  {
    q: "Is HeavyWheels available in Urdu?",
    a: "Yes. The whole site can be switched between English and Urdu using the language toggle in the header, and listings are shown in both languages.",
  },
  {
    q: "How do I know a seller or a machine is genuine?",
    a: "Treat it as you would any private sale: speak to the seller, see the machine, and check the documents before paying. HeavyWheels also offers third-party pre-purchase inspection, where an independent inspector examines the vehicle and reports back before you commit. Dealers who have been reviewed by our team carry a verified badge, and any listing can be reported.",
  },
  {
    q: "Does HeavyWheels handle payment, delivery or financing?",
    a: "No. Buyers and sellers arrange payment and collection directly between themselves. HeavyWheels does not hold funds, ship vehicles, clear customs or lend money. The loan calculator on the site is an estimating tool only, not a finance offer.",
  },
  {
    q: "Is Heavy Wheels Pakistan the same as other sites called Heavy Wheels?",
    a: "No. This marketplace operates only at heavywheelspk.com and only in Pakistan. Other businesses using a similar name are unrelated to it.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqPage() {
  return (
    <main className="hw-container py-10">
      {/* Escaped through serializeJsonLd, same as every other JSON-LD block. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqJsonLd) }}
      />

      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase text-[var(--hw-orange)]">Help</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--hw-text-primary)] md:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-3 leading-7 text-[var(--hw-text-secondary)]">
          How buying and selling works on HeavyWheels, Pakistan&apos;s marketplace for
          heavy vehicles, machinery and spare parts.
        </p>

        {/* Plain headings and paragraphs rather than <details>: the answers must
            be present in the rendered text for a crawler and for anyone landing
            here from search, not hidden behind a click. */}
        <div className="mt-8 grid gap-7">
          {FAQS.map(({ q, a }) => (
            <section key={q}>
              <h2 className="text-lg font-black leading-snug text-[var(--hw-text-primary)]">
                {q}
              </h2>
              <p className="mt-2 leading-7 text-[var(--hw-text-secondary)]">{a}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-[var(--hw-border-default)] bg-[var(--hw-bg-card)] p-5">
          <h2 className="text-base font-black text-[var(--hw-text-primary)]">
            Still need help?
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--hw-text-secondary)]">
            Send us a message and we will get back to you.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[var(--hw-orange)] px-4 text-[13px] font-black text-[var(--hw-text-inverse)] transition hover:bg-[var(--hw-amber)]"
          >
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
