let translations = {};
let currentLang = "en";
const DEFAULT_LANG = "en";

// Internal reference to the translation function
let tFunction = (key) => `[${key}]`; // Default fallback

// Load translation file based on lang code
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

  // Define translation function after loading
  tFunction = (key) => translations[key] || `[${key}]`;

  callback?.(); // ✅ Optional: run UI after loading
}

// Safe translation lookup
export function t(key) {
  return tFunction(key);
}

// Get current language code (used after load)
export function getCurrentLang() {
  return currentLang;
}

// Persist language and reload to apply it
export function setLang(lang) {
  localStorage.setItem("lang", lang);
  location.reload();
}

// Determine user's preferred language
export function getUserLang() {
  return localStorage.getItem("lang") ||
         navigator.language.split("-")[0] ||
         DEFAULT_LANG;
}

export function getLangFromCountry(code) {
  return countryToLang[code] || "en"; // fallback to English
}

const countryToLang = {
  AT: "de", BE: "fr", BG: "bg", HR: "hr", CY: "el", CZ: "cs", DK: "da",
  EE: "et", FI: "fi", FR: "fr", DE: "de", GR: "el", HU: "hu", IE: "en",
  IT: "it", LV: "lv", LT: "lt", LU: "fr", MT: "mt", NL: "nl", PL: "pl",
  PT: "pt", RO: "ro", SK: "sk", SI: "sl", ES: "es", SE: "sv", IS: "is",
  NO: "no", CH: "de", GB: "en", TR: "tr", IL: "he", RU: "ru", CN: "zh",
  SA: "ar", IN: "hi", KR: "ko", JP: "ja", US: "en", CA: "en"
};

