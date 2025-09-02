// i18n.js

let translations = {};
let fallbackTranslations = {};
let currentLang = "en";
const DEFAULT_LANG = "en";

// Translation function (initialized after load)
let tFunction = (key) => `[${key}]`; // default placeholder before loading

export const t = (key) => tFunction(key);

export function getCurrentLanguage() {
  return currentLang;
}

// RTL language codes used to set <html dir="rtl">
export const RTL_LANGS = ["ar","he","fa","ur","ps","ckb","dv","syc","yi"];

/**
 * Load translations for `lang` with per-key fallback to DEFAULT_LANG.
 * Also normalizes lang (e.g., "hu-HU" -> "hu") and syncs <html lang>/<html dir>.
 */
export async function loadTranslations(lang, callback) {
  // normalize to primary subtag; default to English
  const primary = String(lang || "").toLowerCase().split("-")[0] || DEFAULT_LANG;
  currentLang = primary;

  // try target language
  try {
    const res = await fetch(`/data/languages/${primary}.json`);
    if (!res.ok) throw new Error(`Could not load ${primary}.json`);
    translations = await res.json();
  } catch (err) {
    console.warn(`⚠️ Failed to load ${primary}.json`, err);
    translations = {};
  }

  // always have a fallback (English)
  if (primary !== DEFAULT_LANG) {
    try {
      const fb = await fetch(`/data/languages/${DEFAULT_LANG}.json`);
      fallbackTranslations = fb.ok ? await fb.json() : {};
    } catch (err) {
      console.warn(`⚠️ Failed to load fallback (${DEFAULT_LANG}.json)`, err);
      fallbackTranslations = {};
    }
  } else {
    fallbackTranslations = translations;
  }

  // per-key fallback; show [key] only if missing in both
  tFunction = (key) => translations[key] ?? fallbackTranslations[key] ?? `[${key}]`;

  // keep document language + direction in sync (idempotent)
  if (document.documentElement.lang !== primary) {
    document.documentElement.lang = primary;
  }
  document.documentElement.dir = RTL_LANGS.includes(primary) ? "rtl" : "ltr";

  if (typeof callback === "function") callback();
}

export function injectStaticTranslations() {
  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
}

const countryToLang = {
  AT: "de", BE: "fr", BG: "bg", HR: "hr", CY: "el", CZ: "cs", DK: "da",
  EE: "et", FI: "fi", FR: "fr", DE: "de", GR: "el", HU: "hu", IE: "en",
  IT: "it", LV: "lv", LT: "lt", LU: "fr", MT: "mt", NL: "nl", PL: "pl",
  PT: "pt", RO: "ro", SK: "sk", SI: "sl", ES: "es", SE: "sv", IS: "is",
  NO: "nb", CH: "de", GB: "en", TR: "tr", IL: "he", RU: "ru", CN: "zh",
  SA: "ar", IN: "hi", KR: "ko", JP: "ja", US: "en", CA: "en"
};