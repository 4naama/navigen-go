
/**
 * emergency-ui.js
 * Usage:
 *   import { loadEmergencyData, pickLocale, getLabelsFor, getNumbersFor } from './emergency-ui.js';
 *
 * Place this in your modal open handler:
 *   const data = await loadEmergencyData('/data/emergency.json'); // adjust path
 *   const locale = pickLocale(navigator.language, Object.keys(data.i18n.labels));
 *   const country = detectedCc || 'US'; // from CF-IPCountry / override
 *   const labels = getLabelsFor(data, locale);
 *   const numbers = getNumbersFor(data, country);
 *   // render buttons using labels and numbers
 */

// --- load JSON (cache-friendly) ---
export async function loadEmergencyData(url) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error('Failed to load emergency data');
  return await res.json();
}

// --- choose UI locale (no hard-coded English) ---
export function pickLocale(lang, supported) {
  // lang like "hu-HU" -> ["hu-HU","hu","en"]
  const guesses = [];
  if (lang) {
    guesses.push(lang);
    const base = lang.split('-')[0];
    if (base && base !== lang) guesses.push(base);
  }
  guesses.push('en');
  return guesses.find(l => supported.includes(l)) || 'en';
}

// --- get label set for chosen locale with fallback to en ---
export function getLabelsFor(data, locale) {
  const L = data?.i18n?.labels || {};
  return { ...L['en'], ...(L[locale] || {}) };
}

// --- get numbers for a country with safe default ---
export function getNumbersFor(data, cc) {
  const def = data.default || {};
  const entry = (data.countries && data.countries[cc]) || {};
  // Merge so country overrides default
  return { ...def, ...entry };
}
