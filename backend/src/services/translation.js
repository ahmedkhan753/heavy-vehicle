/**
 * Translation service (Groq — free, OpenAI-compatible).
 * ─────────────────────────────────────────────────────
 * Auto-translates a listing's title + description between Urdu and English at
 * post time so any viewer reads it in their chosen language. English is kept as
 * the canonical title/description (so the Mongo text index stays effective);
 * the Urdu versions live in titleUr/descriptionUr.
 *
 * Everything here fails soft: if the key is missing, the API errors, or it
 * times out, we return the original text in BOTH languages so posting an ad is
 * never blocked by translation.
 */

const { env } = require("../config/env");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 12000;

// Arabic-script range covers Urdu. If listing prose contains it, treat the
// source as Urdu; otherwise English.
const URDU_RE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

function hasUrdu(str) {
  return URDU_RE.test(String(str || ""));
}

function isEnabled() {
  return env.TRANSLATION_ENABLED && Boolean(env.GROQ_API_KEY);
}

/**
 * Translate a {title, description} pair into `targetLang` ("en" | "ur").
 * Returns the translated pair, or null on any failure.
 */
async function translatePair({ title, description }, targetLang) {
  const targetName = targetLang === "ur" ? "Urdu" : "English";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              `You translate heavy-vehicle marketplace listings into natural ${targetName}. ` +
              `Preserve EVERY brand name, model, place, and number exactly. Map transliterated ` +
              `brand names to their standard spelling — e.g. شیک مین=Shacman, ہینو=Hino, ` +
              `آئسوزو=Isuzu, فا=FAW, سائنو ٹرک/ہوو=Sinotruk/Howo, وولوو=Volvo, سکینیا=Scania, ` +
              `مرسڈیز=Mercedes, کیٹرپلر=Caterpillar, کوماٹسو=Komatsu, جے سی بی=JCB. Do not add, ` +
              `omit, or explain anything. If a field is already in ${targetName}, return it ` +
              `unchanged. Respond with ONLY a JSON object of the form {"title":"...","description":"..."}.`,
          },
          {
            role: "user",
            content: JSON.stringify({ title: title || "", description: description || "" }),
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error(`[translation] Groq HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      title: String(parsed.title || title || "").trim(),
      description: String(parsed.description || description || "").trim(),
    };
  } catch (err) {
    console.error("[translation] failed:", err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Produce both language versions for a listing.
 * @param {{title:string, description:string}} fields
 * @returns {Promise<{title, description, titleUr, descriptionUr}>}
 *   title/description = canonical English; titleUr/descriptionUr = Urdu.
 *   On any failure the original text is mirrored into both languages.
 */
async function localizeListing({ title, description }) {
  const original = { title: title || "", description: description || "" };

  // No-op fallback used whenever translation is off or fails.
  const mirror = {
    title: original.title,
    description: original.description,
    titleUr: original.title,
    descriptionUr: original.description,
  };

  if (!isEnabled()) return mirror;

  const sourceIsUrdu = hasUrdu(original.title) || hasUrdu(original.description);
  const translated = await translatePair(original, sourceIsUrdu ? "en" : "ur");
  if (!translated) return mirror;

  if (sourceIsUrdu) {
    // Original Urdu → English becomes canonical; keep Urdu originals.
    return {
      title: translated.title || original.title,
      description: translated.description || original.description,
      titleUr: original.title,
      descriptionUr: original.description,
    };
  }
  // Original English stays canonical; store the Urdu translation.
  return {
    title: original.title,
    description: original.description,
    titleUr: translated.title || original.title,
    descriptionUr: translated.description || original.description,
  };
}

module.exports = { localizeListing, hasUrdu, isEnabled };
