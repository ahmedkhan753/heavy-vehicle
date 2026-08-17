/**
 * HeavyWheels AI assistant service.
 * Reuses the existing Groq/OpenAI-compatible configuration server-side.
 */

const { env } = require("../config/env");
const { buildAssistantSystemPrompt } = require("./assistantPrompt");
const { buildToolContext, fetchLiveVehicleContext } = require("./assistantTools");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TIMEOUT_MS = 15000;
const MAX_HISTORY_ITEMS = 8;
const MAX_HISTORY_CHARS = 2000;

function isEnabled() {
  return Boolean(env.GROQ_API_KEY);
}

function buildFallbackReply() {
  return {
    success: false,
    text: "I'm having trouble connecting right now. Please try again in a moment.",
  };
}

function normalizeHistory(history, prompt) {
  if (!Array.isArray(history)) return [];

  const compact = history
    .filter((item) => item && (item.role === "assistant" || item.role === "user"))
    .slice(-MAX_HISTORY_ITEMS)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content || "").slice(0, MAX_HISTORY_CHARS),
    }))
    .filter((item) => item.content.trim());

  const last = compact[compact.length - 1];
  if (last?.role === "user" && last.content.trim() === prompt) {
    compact.pop();
  }

  return compact;
}

async function getAssistantReply({ message, history = [] }) {
  const prompt = String(message || "").trim();
  if (!prompt) {
    return { success: false, text: "Please type your question so I can help you." };
  }

  if (!isEnabled()) {
    return {
      success: false,
      text:
        "The HeavyWheels assistant is currently unavailable because the AI service is not configured. Please try again later.",
    };
  }

  const compactHistory = normalizeHistory(history, prompt);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const liveContext = await fetchLiveVehicleContext(prompt);

    const systemMessages = [
      {
        role: "system",
        content: buildAssistantSystemPrompt(),
      },
      {
        role: "system",
        content: buildToolContext(prompt) + (liveContext ? "\n\n" + liveContext : ""),
      },
    ];

    const res = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0.7,
        messages: [
          ...systemMessages,
          ...compactHistory,
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[assistant] Groq failed:", res.status, res.statusText, errText);
      return buildFallbackReply();
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) {
      console.error("[assistant] Groq returned empty choice content:", JSON.stringify(json));
      return buildFallbackReply();
    }

    return { text: String(content).trim() };
  } catch (error) {
    console.error("[assistant] failed:", error.message);
    return buildFallbackReply();
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getAssistantReply, isEnabled };
