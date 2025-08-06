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

export async function loadTranslations(lang, callback) {
  currentLang = lang;

  try {
    const res = await fetch(`/data/languages/${lang}.json`);
    if (!res.ok) throw new Error(`Could not load ${lang}.json`);
    translations = await res.json();
  } catch (err) {
    console.warn(`⚠️ Failed to load ${lang}.json`, err);
    translations = {};
  }

  // ✅ Always load fallback language (English)
  if (lang !== DEFAULT_LANG) {
    try {
      const fallbackRes = await fetch(`/data/languages/${DEFAULT_LANG}.json`);
      if (fallbackRes.ok) {
        fallbackTranslations = await fallbackRes.json();
      } else {
        fallbackTranslations = {};
      }
    } catch (err) {
      console.warn(`⚠️ Failed to load fallback (${DEFAULT_LANG}.json)`, err);
      fallbackTranslations = {};
    }
  } else {
    fallbackTranslations = translations;
  }

  // ✅ Updated translation function with fallback support
  tFunction = (key) =>
    translations[key] || fallbackTranslations[key] || `[${key}]`;

  if (callback) callback();
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
  NO: "no", CH: "de", GB: "en", TR: "tr", IL: "he", RU: "ru", CN: "zh",
  SA: "ar", IN: "hi", KR: "ko", JP: "ja", US: "en", CA: "en"
};