// Crawlers that answer questions rather than return links. They were already
// permitted by the wildcard rule below, but naming them makes the intent
// explicit and durable: HeavyWheels is a new marketplace with no brand
// recognition, so being quotable inside an AI answer is a real acquisition
// channel, not a nice-to-have.
//
// Google-Extended is the one that is easy to get wrong. It does not affect
// normal Google indexing at all — it controls only whether content may ground
// Gemini and AI Overviews. Blocking it would remove the site from AI Overviews
// while leaving blue-link ranking untouched, which is the opposite of what we
// want here.
const ANSWER_ENGINE_BOTS = [
  "GPTBot", // OpenAI — training + ChatGPT browsing
  "OAI-SearchBot", // OpenAI — ChatGPT Search index
  "ChatGPT-User", // OpenAI — live fetch when a user asks
  "ClaudeBot", // Anthropic
  "Claude-User",
  "PerplexityBot", // Perplexity index
  "Perplexity-User",
  "Google-Extended", // Gemini / AI Overviews grounding
  "Applebot-Extended", // Apple Intelligence
  "CCBot", // Common Crawl — feeds many downstream models
  "Bingbot", // also the index behind Copilot
  "DuckAssistBot",
];

// Signed-in-only areas and the internal API. The pages themselves also carry
// noindex (dashboard/admin/auth/payment layouts); this additionally keeps
// crawlers from spending budget on them at all.
const PRIVATE_PATHS = ["/dashboard", "/admin", "/api/", "/payment/callback"];

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...ANSWER_ENGINE_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: "https://heavywheelspk.com/sitemap.xml",
    host: "https://heavywheelspk.com",
  };
}
