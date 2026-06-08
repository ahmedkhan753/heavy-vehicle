import { cookies } from "next/headers";
import { translate } from "@/lib/i18n";

/**
 * Server-side language helpers.
 * Reads the `hw_lang` cookie (set by LanguageContext on the client) so
 * server components can render in the user's chosen language.
 */
export async function getLang() {
  const store = await cookies();
  const value = store.get("hw_lang")?.value;
  return value === "ur" ? "ur" : "en";
}

/**
 * Returns a translator bound to the current request's language:
 *   const t = await getT();  t("some.key")
 */
export async function getT() {
  const lang = await getLang();
  return (key) => translate(lang, key);
}
