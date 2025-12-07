import {
  buildAccordion,
  createMyStuffModal,
  createAlertModal,
  createDonationModal,
  createHelpModal,
  setupMyStuffModalLogic,
  createShareModal,
  showModal,
  showShareModal,
  createIncomingLocationModal,
  saveToLocationHistory,
  showToast,
  showMyStuffModal,
  flagStyler,
  setupTapOutClose,
  showLocationProfileModal,
  showThankYouToast as showThankYouToastUI,
  openViewSettingsModal,
  createFavoritesModal,
  showFavoritesModal,
  createPromotionsModal,
  showPromotionsModal
} from './modal-injector.js';

// PWA: register SW only in production (keeps install prompt there)
/* In preview/dev (pages.dev, localhost), skip SW to force fresh CSS/JS on reload */
if ('serviceWorker' in navigator) {
  const PREVIEW = location.hostname.endsWith('pages.dev') ||
                  location.hostname === 'localhost' ||
                  location.hostname === '127.0.0.1';
  if (!PREVIEW) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW reg failed', err));
  }
}

// Force phones to forget old cache on new deploy; one-time per BUILD_ID. (Disabled: no redirect, no purge)
const BUILD_ID = '2025-08-30-03'; // disabled cache-buster
try { localStorage.setItem('BUILD_ID', BUILD_ID); } catch {}
// (No redirect; leave URL untouched)

// Helper: Match locationName OR tag keys (strip "tag."), case-insensitive; supports multi-word queries.
function matchesQueryByNameOrTag(loc, q) {
  const qStr = String(q || '').toLowerCase().trim();
  if (!qStr) return true;
  const tokens = qStr.split(/\s+/).filter(Boolean);
  const name = String((loc?.locationName?.en ?? loc?.locationName ?? '')).toLowerCase();
  const tags = (Array.isArray(loc?.tags) ? loc.tags : []).map(t => String(t).toLowerCase().replace(/^tag\./,''));
  return tokens.every(tok => name.includes(tok) || tags.some(tag => tag.includes(tok)));
}

// 🌍 Emergency data + localization helpers
// Served as a static ES module from /public/scripts
import {
  loadEmergencyData,
  pickLocale,
  getLabelsFor,
  getNumbersFor
} from './scripts/emergency-ui.js';

// Use local injectStaticTranslations() defined later in this file
import { loadTranslations, t, RTL_LANGS } from "./scripts/i18n.js"; // keep: static import

// Early: ?lang → path-locale; /{lang}/ respected; root stays EN; persist prefix.
// Also persists the decision before i18n module side-effects run.
(() => {
  const DEFAULT = "en";
  const qs = new URLSearchParams(location.search);
  const parts = location.pathname.split("/").filter(Boolean);
  const seg0 = (parts[0] || "").toLowerCase();
  const pathLang = /^[a-z]{2}$/.test(seg0) ? seg0 : null;
  const norm = (l) => (l || "").slice(0, 2);

  // ?lang normalization → path
  const urlLang = (qs.get("lang") || "").toLowerCase();
  if (urlLang) {
    const lang = norm(urlLang);
    const rest = "/" + (pathLang ? parts.slice(1).join("/") : parts.join("/"));
    const target =
      lang === DEFAULT
        ? rest === "/" ? "/" : rest
        : `/${lang}${rest === "/" ? "" : rest}`;
    qs.delete("lang");
    const query = qs.toString() ? `?${qs}` : "";
    const next = `${target}${query}${location.hash || ""}`;
    if (next !== location.pathname + location.search + location.hash) {
      location.replace(next);
    }
    return; // stop; navigation continues at new URL
  }

  // --- NEW: allow structured context paths (e.g., /language-schools/...) without lang prefix
  const structured = /^\/(language|events|schools|services|places|experiences|guides)/i.test(location.pathname);
  if (!pathLang && structured) {
    // do not rewrite; keep current path and treat as default language
    document.documentElement.lang = DEFAULT;
    document.documentElement.dir = "ltr";
    try { localStorage.setItem("lang", DEFAULT); } catch {}
    return;
  }

  // Decide from path (root → EN), persist immediately so i18n sees the right value
  const chosen = pathLang || DEFAULT;
  document.documentElement.lang = chosen;
  // Early RTL hint; i18n confirms later
  const RTL_EARLY = ["ar", "he", "fa", "ur"];
  document.documentElement.dir = RTL_EARLY.includes(chosen) ? "rtl" : "ltr";

  try {
    localStorage.setItem("lang", chosen);
  } catch {}
})();

// ✅ Determines whether app is running in standalone/PWA mode
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

function getUserLang() {
  // Use browser setting or override with ?lang=fr
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  return urlLang || navigator.language.split("-")[0] || "en"; // e.g. "fr"
}

const BACKEND_URL = "https://navigen-go.onrender.com";

// ULID checker: keep client ULID-only (2 lines)
const isUlid = (v) => /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(String(v || '').trim());

// ✅ Stripe Block
import { initStripe, handleDonation } from "./scripts/stripe.js";

// ✅ Stripe public key (inject securely in production)
const STRIPE_PUBLIC_KEY = "pk_live_51P45KEFf2RZOYEdOgWX6B7Juab9v0lbDw7xOhxCv1yLDa2ck06CXYUt3g5dLGoHrv2oZZrC43P3olq739oFuWaTq00mw8gxqXF";

// 🔄 Initialize Stripe loader overlay controls
function showStripeLoader() {
  const loader = document.getElementById("stripe-loader");
  if (loader) loader.style.display = "flex";
}

function hideStripeLoader() {
  const loader = document.getElementById("stripe-loader");
  if (loader) loader.style.display = "none";
}

const setVH = () =>
  document.documentElement.style.setProperty('--vh', window.innerHeight + 'px');

setVH();
window.addEventListener('resize', () => requestAnimationFrame(setVH));
window.addEventListener('orientationchange', setVH);
window.addEventListener('pageshow', (e) => { if (e.persisted) setVH(); }); // bfcache

// Root hard-lock: if no /{lang}/ prefix, force EN and refresh labels (BFCache-safe)
window.addEventListener('pageshow', async () => {
  const hasPrefix = /^[a-z]{2}(?:\/|$)/.test(location.pathname.slice(1));
  // allow deep structured paths such as /language-schools/... to stay intact
  const isStructured = /^\/(language|events|schools|services|places)/i.test(location.pathname);
  if (!hasPrefix && !isStructured) {
    const locked = "en";
    if (document.documentElement.lang !== locked) {
      document.documentElement.lang = locked;
      document.documentElement.dir = "ltr";
      try { localStorage.setItem("lang", locked); } catch {}
      await loadTranslations(locked);
      injectStaticTranslations();
      document.dispatchEvent(new CustomEvent('app:lang-changed', { detail: { lang: locked } }));
    }
  }
});

if (window.visualViewport) visualViewport.addEventListener('resize', setVH);

const state = {};
let geoPoints = [];
let structure_data = [];
let deferredPrompt = null;
let searchInput;
let clearBtn;

let acknowledgedAlerts = new Set();
  
  function openModal(modalId) {
    // Hide all modals and modal backgrounds
    document.querySelectorAll('[id$="-modal"]').forEach(modal => modal.classList.add('hidden'));
    document.querySelectorAll('.modal-bg').forEach(bg => bg.classList.add('hidden'));

    // Show the requested modal and its background
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.querySelector('.modal-bg')?.classList.remove('hidden');
    }
  }

function handleAccordionToggle(header, contentEl) {
  const scroller = document.getElementById('locations-scroll');
  const wasOpen = header.classList.contains("open");
  const { top: beforeTop } = header.getBoundingClientRect();

  // Close all sections
  document.querySelectorAll(".accordion-body").forEach(b => b.style.display = "none");
  document.querySelectorAll(".accordion-button, .group-header-button").forEach(b => b.classList.remove("open"));
  document.querySelectorAll(".group-buttons").forEach(b => b.classList.add("hidden"));

  // Open tapped section if closed
  if (!wasOpen) {
    if (contentEl) {
      contentEl.classList.remove("hidden");
      contentEl.style.display = "block";
    }
    header.classList.add("open");
  }

  // Adjust ONLY the internal scroller to compensate layout shift
  if (scroller) {
    const { top: afterTop } = header.getBoundingClientRect();
    const delta = afterTop - beforeTop;
    if (Math.abs(delta) > 4) scroller.scrollTop += delta;
  }
}

// ✅ Render ⭐ Popular group (normal accordion section)
function renderPopularGroup(list = geoPoints) {
  const container = document.querySelector("#locations");
  if (!container) { console.warn('⚠️ #locations not found; skipping Popular group'); return; }

  // Popular = Priority:"Yes" only; no fallback; ignore Visible
  const isPriority = (rec) => String(rec?.Priority || '').toLowerCase() === 'yes';
  const popular = (Array.isArray(list) ? list : []).filter(isPriority);

  const section = document.createElement("div");
  section.classList.add("accordion-section");

  const groupKey = "group.popular";
  const groupLabel = t(groupKey);

  const header = document.createElement("button");
  header.classList.add("group-header-button");
  header.setAttribute("data-group", groupKey);
  header.style.backgroundColor = 'var(--group-color)';
  header.innerHTML = `
    <span class="header-title">${groupLabel}</span>
    <span class="header-meta">( ${popular.length} )</span>
    <span class="header-arrow"></span>
  `;

  const content = document.createElement("div");
  content.className = "accordion-body";
  content.style.display = "none";

  const subWrap = document.createElement("div");
  subWrap.className = "subgroup-items";
  content.appendChild(subWrap);

  header.addEventListener("click", () => {
    const scroller = document.getElementById('locations-scroll');
    const wasOpen = header.classList.contains("open");
    const { top: beforeTop } = header.getBoundingClientRect();

    document.querySelectorAll(".accordion-body").forEach(b => b.style.display = "none");
    document.querySelectorAll(".accordion-button, .group-header-button").forEach(b => b.classList.remove("open"));

    if (!wasOpen) {
      content.style.display = "block";
      header.classList.add("open");
    }

    if (scroller) {
      const { top: afterTop } = header.getBoundingClientRect();
      const delta = afterTop - beforeTop;
      if (Math.abs(delta) > 4) scroller.scrollTop += delta;
    }
  });

  section.appendChild(header);
  section.appendChild(content);

  popular.forEach((loc) => {
    const btn = document.createElement("button");
    btn.classList.add("quick-button", "popular-button");
    const locLabel = String((loc?.locationName?.en ?? loc?.locationName ?? "Unnamed")).trim(); // location display label

    btn.textContent = locLabel;
    btn.setAttribute("data-group", groupKey);
    const rawId = String(loc.locationID || loc.ID || loc.id || loc.slug || loc.alias || '').trim(); // raw id or slug (fallback to slug/alias)
    const uid   = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(rawId) ? rawId : '';               // ULID-only
    btn.setAttribute('data-id', uid);                                                 // ULID for tracking

    // dataset-only: use profiles.json locationID as-is (alias or ULID) — no derivation, no fallbacks
    {
      const ident = String(loc?.locationID || '').trim();
      if (ident) {
        btn.setAttribute('data-locationid', ident);  // used by UI/search and LPM/Stats
      }
    }

    const _tags = Array.isArray(loc?.tags) ? loc.tags : [];
    btn.setAttribute('data-name', locLabel); // use visible label; keep search consistent
    btn.setAttribute('data-tags', _tags.map(k => String(k).replace(/^tag\./,'')).join(' '));

    // contactInformation is the single source
    const c = (loc && loc.contactInformation) || {};
    const addrBits = [c.city, c.adminArea, c.postalCode, c.countryCode, c.address].filter(Boolean).join(' ');
    const addrNorm = addrBits.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    btn.setAttribute('data-addr', addrNorm);

    let lat = "", lng = "";
    const cc = loc["Coordinate Compound"];
    if (typeof cc === "string" && cc.includes(",")) {
      [lat, lng] = cc.split(',').map(s => s.trim());
      btn.setAttribute("data-lat", lat);
      btn.setAttribute("data-lng", lng);
      btn.title = `Open profile / Route (${lat}, ${lng})`;
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      // Always prefer profiles.json media (cover + images) for slider
      const media   = (loc && typeof loc.media === 'object') ? loc.media : {};
      const gallery = Array.isArray(media.images) ? media.images : [];
      const images  = gallery.map(m => (m && typeof m === 'object' ? m.src : m)).filter(Boolean);
      // Use explicit cover first, then first image; never use placeholders
      const cover = (media.cover && String(media.cover).trim()) || images[0];

      // guard for strict data model; require cover only (align with Accordion)
      if (!cover) { console.warn('Data error: cover required'); return; }

      // prefer ULID from data-id; fallback to human slug from data-locationid
      const uid   = String(btn.getAttribute('data-id') || '').trim();            // ULID if present
      const locid = String(btn.getAttribute('data-locationid') || '').trim();    // human slug

      // need at least one identifier (ULID or slug)
      if (!uid && !locid) { console.warn('Data error: identifier missing (Popular)'); return; }

      // single-field payload: locationID from the button’s slug attribute; id stays ULID-only
      showLocationProfileModal({
        locationID: String(locid || loc?.locationID || ''),  // prefer button’s slug; fallback to dataset
        id:         String(uid || ''),                       // ULID for tracking/beacons only
        displayName: locLabel, name: locLabel,
        lat, lng,
        imageSrc: cover,
        images,
        media,
        qrUrl: loc?.qrUrl || '',
        descriptions: (loc && typeof loc.descriptions === 'object') ? loc.descriptions : {},
        tags: _tags,
        contactInformation: (loc && loc.contactInformation) || {},
        links: (loc && loc.links) || {},
        ratings: (loc && loc.ratings) || {},
        pricing: (loc && loc.pricing) || {},
        originEl: btn
      });
    });

    subWrap.appendChild(btn);
  });

  container.prepend(section);
}

function navigate(name, lat, lon) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  window.open(url, '_blank');
}

// showActionModal: opens a modal with title, message, and action buttons; closes on backdrop tap.
function showActionModal(action) {
  const modal = document.createElement("div");
  modal.className = "modal visible";

  // CSS-backdrop only; close on clicking container
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); }, { passive: true });

  const box = document.createElement("div");
  box.className = "modal-content";

  const heading = document.createElement("h2");
  heading.textContent = action.name;
  box.appendChild(heading);

  const desc = document.createElement("p");
  desc.textContent = action.message;
  box.appendChild(desc);

  // Actions footer (buttons only; no accordion markup)
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "modal-actions";

  action.buttons.forEach(b => {
    const bEl = document.createElement("button");
    bEl.className = "modal-action-button";
    bEl.textContent = b.status ? `${b.label} (${b.status})` : b.label;
    bEl.onclick = () => alert(`TODO: handle "${b.label}"`); // keep: placeholder handler
    buttonContainer.appendChild(bEl);
  });

  box.appendChild(buttonContainer);
  modal.appendChild(box);
  document.body.appendChild(modal);
}

// 🎨 Group-specific background color (based on translation keys only)
// app.js
// ---------------------------------------------------------------------
// Palette: 22 hues, gradient from brown → yellow → green → blue → violet → red.
// Each entry has base + ink (slightly darker). No repeats.
// ---------------------------------------------------------------------
const PALETTE = [
  { base: '#EAD9C4', ink: '#D2BFA8' }, // 0 brownish sand
  { base: '#F4E2B8', ink: '#E0CC9E' }, // 1 pale yellow-ochre
  { base: '#F0EDB3', ink: '#D6D394' }, // 2 soft yellow
  { base: '#E4F2B8', ink: '#CAD79C' }, // 3 yellow-green
  { base: '#D2F2B8', ink: '#B8D89E' }, // 4 light green
  { base: '#B8F2C2', ink: '#9ED8AA' }, // 5 mint green
  { base: '#B8F2E4', ink: '#9ED8C9' }, // 6 aqua
  { base: '#B8E4F2', ink: '#9EC9D8' }, // 7 sky blue
  { base: '#B8CFF2', ink: '#9EB4D8' }, // 8 periwinkle
  { base: '#C9B8F2', ink: '#AD9ED8' }, // 9 soft violet
  { base: '#DDB8F2', ink: '#C19ED8' }, // 10 lavender
  { base: '#EAB8F2', ink: '#CE9ED8' }, // 11 pink-violet
  { base: '#F2B8E4', ink: '#D89EC9' }, // 12 rosy pink
  { base: '#F2B8CC', ink: '#D89EB4' }, // 13 soft rose
  { base: '#F2B8B8', ink: '#D89E9E' }, // 14 salmon
  { base: '#F2C4B8', ink: '#D8AA9E' }, // 15 warm coral
  { base: '#F2D0B8', ink: '#D8B69E' }, // 16 peach
  { base: '#F2DCB8', ink: '#D8C29E' }, // 17 pale tan
  { base: '#F2E8B8', ink: '#D8CE9E' }, // 18 sandy yellow
  { base: '#F2E2D0', ink: '#D8C9B6' }, // 19 warm beige
  { base: '#F2B8A8', ink: '#D89E91' }, // 20 deep coral
  { base: '#E85C5C', ink: '#CC4C4C' }, // 21 strong red → reserved for Emergency
];

// ---------------------------------------------------------------------
// Map each group key to a unique palette index (no repeats).
// Adjust the keys to your actual set; keep uniqueness.
// ---------------------------------------------------------------------
const GROUP_COLOR_INDEX = {
  'group.popular':        11,  // pink-violet
  'group.stages':         1,   // ochre
  'group.activities':     2,   // soft yellow
  'group.event-food':     3,   // yellow-green
  'group.facilities':     4,   // light green
  'group.gates':          5,   // mint green
  'group.transport':      6,   // aqua
  'group.guests':         7,   // sky blue
  'group.social-points':  8,   // periwinkle
  'group.landmarks':      9,   // violet
  'group.museums':        10,  // lavender
  'group.spots':          0,   // brownish sand
  'group.parks-nature':   12,  // rosy pink
  'group.spas':           13,  // soft rose
  'group.food-drink':     14,  // salmon
  'group.shops':          15,  // warm coral
  'group.services':       16,  // peach
  'group.experiences':    17,  // pale tan
  // leave 18 + 19 free for future categories if needed
  'group.emergency':      21   // strong red
};

// ---------------------------------------------------------------------
// Apply colors: set CSS vars on each accordion section
// Assumes .group-header-button holds data-group and is followed by .accordion-body
// ---------------------------------------------------------------------
function paintAccordionColors() {
  /** add concise comments only **/
  document.querySelectorAll('.group-header-button[data-group]').forEach((header) => {
    const key = header.dataset.group;
    const idx = GROUP_COLOR_INDEX[key];
    if (idx == null) return; // unknown group → skip without breaking anything

    const { base, ink } = PALETTE[idx];

    // header colors (visible + CSS custom properties for nested elements)
    header.style.setProperty('--group-color', base);
    header.style.setProperty('--group-color-ink', ink);

    // tint the corresponding body (nested buttons live here)
    const body = header.nextElementSibling;
    if (body && body.classList.contains('accordion-body')) {
      body.style.setProperty('--group-color', base);
      body.style.setProperty('--group-color-ink', ink);
    }
    
    const section = header.closest('.accordion-section');
    if (section) {
      section.style.setProperty('--group-color', base);
      section.style.setProperty('--group-color-ink', ink);
    }    
      
    });
}

// Call after the accordion is rendered (e.g., after your build/init)
document.addEventListener('DOMContentLoaded', paintAccordionColors);
// If accordion is re-rendered dynamically, call paintAccordionColors() again afterward.

// Accept injectedGeoPoints to avoid window.*; keep tags in sync
function wireAccordionGroups(structure_data, injectedGeoPoints = []) {
  structure_data.forEach(group => {
    const title = group["Drop-down"]?.trim();
    if (!title) return console.warn('⛔ Missing Drop-down in group:', group);

    const allAccordionButtons = [...document.querySelectorAll('#accordion .accordion-button')];
    const matchingBtn = allAccordionButtons.find(btn =>
      btn.textContent.trim().replace(/\s+/g, ' ').includes(title)
    );

    if (!matchingBtn) {
      // console.warn('❌ No match found for Drop-down title:', title);
      return;
    }

    const groupKey = group.Group || `group.${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    
    const translatedTitle = t(groupKey) || title;

    matchingBtn.dataset.group = groupKey;
    matchingBtn.classList.remove('accordion-button');
    matchingBtn.classList.add('group-header-button');

    const titleEl = matchingBtn.querySelector('.header-title');
    const metaEl = matchingBtn.querySelector('.header-meta');
    const arrowEl = matchingBtn.querySelector('.header-arrow');

    if (titleEl) {
      titleEl.classList.add('group-header-title');
      titleEl.textContent = t(groupKey) || title; // ✅ Set translated title
    }
    if (metaEl) metaEl.classList.add('group-header-meta');
    if (arrowEl) arrowEl.classList.add('group-header-arrow');

    matchingBtn.style.backgroundColor = 'var(--group-color)';

    const sibling = matchingBtn.nextElementSibling;
    if (!sibling || !sibling.classList.contains('accordion-body')) {
      console.warn('⚠️ No matching .accordion-body after button for:', title);
      return;
    }

    sibling.querySelectorAll('button').forEach(locBtn => {
      // Accordion wiring pass: for each location button, stamp authoritative identifiers onto the element.
      // - Always set `data-locationid` (and mirror to `data-alias`) from the dataset record’s `locationID` (e.g., hd-…-####).
      // - Set `data-id` only if a real ULID exists; never place slugs/aliases in `data-id`.
      // Rationale: LPM CTAs resolve identifiers via `data.id || data.locationID`; this guarantees one is always valid.
      try {
        const visibleLabel = String((locBtn.querySelector('.location-name')?.textContent || locBtn.textContent || '')).trim();
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String((x?.locationName?.en ?? x?.locationName ?? '')).trim() === visibleLabel)
          : null;

        if (!rec) return;

        const datasetSlug = String(rec?.locationID || '').trim();
        const rawId       = String(rec?.ID || rec?.id || '').trim();
        const isULID      = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(rawId);

        // publish dataset slug for all non-ULID actions (single source)
        if (datasetSlug) {
          locBtn.setAttribute('data-locationid', datasetSlug);
        }

        // keep only a true ULID in data-id
        if (isULID) {
          locBtn.setAttribute('data-id', rawId);
        } else if (locBtn.hasAttribute('data-id')) {
          locBtn.removeAttribute('data-id');
        }
      } catch { /* keep going; styling below still applies */ }

      // keep styling
      locBtn.classList.add('quick-button', 'location-button');
      locBtn.style.border = '1px solid var(--group-color-ink)';
      locBtn.style.backgroundColor = 'transparent';

      // keep label wrap
      if (!locBtn.querySelector('.location-name')) {
        const label = locBtn.textContent.trim();
        locBtn.innerHTML = `<span class="location-name">${label}</span>`;
      }

      // ensure searchable metadata for regular + tag search (use locationName only)
      if (!locBtn.hasAttribute('data-name')) {
        locBtn.setAttribute('data-name', locBtn.textContent.trim());
      }

      if (!locBtn.hasAttribute('data-tags')) {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.locationID || x?.ID || x?.id) === String(id)) // accept new id too
          : null;

        const tags = Array.isArray(rec?.tags)
          ? rec.tags.map(k => String(k).replace(/^tag\./,'')).join(' ')
          : '';
        locBtn.setAttribute('data-tags', tags);
      }

      // ✅ Always set/refresh address tokens (now includes CountryCode)
      // short: prefer contactInformation; fallback to flat/export keys and listedAddress
      {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.locationID || x?.ID || x?.id) === String(id)) // accept new id too
          : null;

        const c = (rec && rec.contactInformation) || {};
        const addrBits = [
          c.city       ?? rec?.City,
          c.adminArea  ?? rec?.AdminArea,
          c.postalCode ?? rec?.PostalCode,
          c.countryCode?? rec?.CountryCode,
          c.address    ?? rec?.Address ?? rec?.listedAddress
        ].filter(Boolean).join(' ');
        const addrNorm = addrBits.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        locBtn.setAttribute('data-addr', addrNorm);
      }

      // ✅ Expose contact tokens for search (phone/email only; normalized)
      // short: include contactPerson + messaging fallbacks so queries match
      {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.locationID || x?.ID || x?.id) === String(id)) // accept new id too
          : null;

        const c = (rec && rec.contactInformation) || {};
        const person = c.contactPerson ?? rec?.contactPerson ?? '';
        const raw = [
          person,
          c.phone        ?? rec?.['Contact phone'],
          c.email        ?? rec?.['Contact email'],
          c.whatsapp     ?? rec?.WhatsApp,
          c.telegram     ?? rec?.Telegram,
          c.messenger    ?? rec?.Messenger
        ].filter(Boolean).join(' ');
        const contactNorm = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        locBtn.setAttribute('data-contact', contactNorm);
        locBtn.setAttribute('data-contact-person', String(person));  // name used by search
      }

      // ✅ Ensure lat/lng & helpful title for navigation (used by LPM / route)
      {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.locationID || x?.ID || x?.id) === String(id)) // accept new id too
          : null;

        const cc = rec ? (rec.coord || rec["Coordinate Compound"] || '') : '';
        if (cc) {
          const [lat, lng] = cc.split(',').map(s => s.trim());
          if (lat && lng) {
            if (!locBtn.hasAttribute('data-lat')) locBtn.setAttribute('data-lat', lat);
            if (!locBtn.hasAttribute('data-lng')) locBtn.setAttribute('data-lng', lng);
            if (!locBtn.title) locBtn.title = `Open profile / Route (${lat}, ${lng})`;
          }
        }
      }

      // ✅ Preserve media cover for previews (non-blocking)
      {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.locationID || x?.ID || x?.id) === String(id)) // accept new id too
          : null;

        const cover = rec?.media?.cover || rec?.cover || '';
        if (cover && !locBtn.hasAttribute('data-cover')) {
          locBtn.setAttribute('data-cover', cover);
        }
      }

      // ✅ Expose Popular/Featured flag and group keys for quick filters
      {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.locationID || x?.ID || x?.id) === String(id)) // accept new id too
          : null;

        if (rec) {
          // Popular/Featured detection (keeps your earlier mapper logic)
          const pri = (String(rec?.Priority || '').toLowerCase() === 'yes') ? 'Yes' : 'No';
          locBtn.setAttribute('data-priority', pri);

          // group/subgroup attributes (keys)
          if (rec.groupKey || rec.Group) {
            locBtn.setAttribute('data-group', String(rec.groupKey || rec.Group));
          }
          if (rec.subgroupKey || rec["Subgroup key"]) {
            locBtn.setAttribute('data-subgroup', String(rec.subgroupKey || rec["Subgroup key"]));
          }
        }
      }
    });

  });
}

// Name + tag search; supports multi-word queries (no cross-scope fetch)
function filterLocations(q) {
  // include Popular's buttons too
  var itemSel = '.location-button, .popular-button, .location-item, [data-role="location-item"]';

  const norm = (s) => String(s||'')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // strip accents
    .replace(/[-_.\/]/g,' ')                         // hyphen-like → space
    .replace(/\s+/g,' ').trim();

  var query = norm(q);

  // show/hide the clear button based on query state
  var clearBtnEl = document.getElementById('clear-search');
  if (clearBtnEl) clearBtnEl.style.display = query ? '' : 'none';

  // --- RESET when empty: show everything and return ---
  if (!query) {
    // show all items
    document.querySelectorAll(itemSel).forEach(function (el) {
      el.style.display = '';
      el.setAttribute('aria-hidden', 'false');
    });

    // unhide all subgroup headers + lists
    document.querySelectorAll('.subheader').forEach(function (h) {
      h.style.display = '';
      h.setAttribute('aria-hidden', 'false');
    });
    document.querySelectorAll('.subgroup-items').forEach(function (wrap) {
      wrap.style.display = '';
      if (wrap.classList) wrap.classList.remove('is-collapsed');
    });

    // unhide all groups & refresh counts
    document.querySelectorAll('div.accordion-section').forEach(function (section) {
      section.style.display = '';
      section.setAttribute('aria-hidden', 'false');

      var meta = section.querySelector('.group-header-button .header-meta');
      if (meta) {
        var total = section.querySelectorAll(itemSel).length;
        meta.textContent = '( ' + total + ' )';
      }
    });

    return; // nothing to filter
  }

  // --- 1) Item-level filtering (names + tags + inline text) ---  // include contact person in haystack
  const items = document.querySelectorAll(itemSel);
  items.forEach((el) => {
    // include contact tokens too (person/phone/email); addr already holds postal/city/region)
    const lower = el.dataset.lower || '';
    const nameAttr = el.getAttribute('data-name') || '';
    // include tags even if data-tags is missing: read visible tag chips too
    let tags = el.getAttribute('data-tags') || '';
    if (!tags) {
      tags = Array.from(el.querySelectorAll('[data-tag], .tag, .tags [data-tag], .tags .tag'))
        .map(n => n.textContent || '')
        .join(' ');
    }
    const addr = el.getAttribute('data-addr') || '';
    const contactPerson = el.dataset.contactPerson || '';
    const contact = el.getAttribute('data-contact') || '';
    const hay = norm(`${lower} ${nameAttr} ${tags} ${addr} ${contactPerson} ${contact}`);

    // token-AND match: every word in the query must appear in hay
    const tokens = norm(query).split(/\s+/).filter(Boolean);
    const show = tokens.every(tok => hay.includes(tok));

    el.style.display = show ? '' : 'none';
    el.setAttribute('aria-hidden', String(!show));
  });

  // --- 2) Subgroup-level: hide header + list if empty (no items OR none visible) ---
  document.querySelectorAll('div.accordion-section').forEach(function (section) {
  // Popular is no longer skipped — treat like any other group


    var subHeaders = section.querySelectorAll('.subheader');
    subHeaders.forEach(function (subHeader) {
      var sib = subHeader.nextElementSibling;
      var subWrap = (sib && sib.classList && sib.classList.contains('subgroup-items')) ? sib : null;
      if (!subWrap) return;

      var locBtns = subWrap.querySelectorAll(itemSel);
      var visibleInSub = 0;
      locBtns.forEach(function (btn) { if (btn.style.display !== 'none') visibleInSub++; });

      var subEmpty = (locBtns.length === 0 || visibleInSub === 0);
      subHeader.style.display = subEmpty ? 'none' : '';
      subHeader.setAttribute('aria-hidden', subEmpty ? 'true' : 'false');
      subWrap.style.display = subEmpty ? 'none' : '';
      if (subWrap.classList) subWrap.classList.toggle('is-collapsed', subEmpty);

      if (!subEmpty) subHeader.dataset.count = String(visibleInSub); // short, accurate count
    });

    // --- 3) Group-level: hide section if ALL items are hidden ---
    var childCandidates = section.querySelectorAll(itemSel);
    var visibleCount = 0;
    childCandidates.forEach(function (btn) { if (btn.style.display !== 'none') visibleCount++; });

    var hideSection = (childCandidates.length > 0 && visibleCount === 0);
    section.style.display = hideSection ? 'none' : '';
    section.setAttribute('aria-hidden', hideSection ? 'true' : 'false');

    var meta = section.querySelector('.group-header-button .header-meta');
    if (meta) meta.textContent = '( ' + visibleCount + ' )';
  });
}

function clearSearch() {
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.value = "";

  filterLocations();

  document.querySelectorAll('.quick-button').forEach(btn => {
    btn.style.display = '';
  });

  document.querySelectorAll('.accordion-section').forEach(section => {
    section.style.display = '';
  });

  const clearBtn = document.getElementById("clear-search");
  if (clearBtn) clearBtn.style.display = 'none';
}

// --- Emergency block bootstrap (runs when help modal opens) ---
// Adds concise comments per block; preserves your style.
async function initEmergencyBlock(countryOverride) {
  // 1) Load JSON (cached by browser/SW)
  const data = await loadEmergencyData('/data/emergency.json');

  // 2) Locale (no hard-coded English)
  const supported = Object.keys(data.i18n?.labels || {});
  const locale = pickLocale(navigator.language, supported);
  const L = getLabelsFor(data, locale);

  // 3) Country code (override → saved → meta/lang → default)
  const metaCountry =
    document.querySelector('meta[name="cf-country"]')?.content ||   // e.g., injected by CDN/edge
    document.querySelector('meta[name="app-country"]')?.content ||  // your own server meta
    document.documentElement.getAttribute('data-country') ||        // optional <html data-country="HU">
    (() => { try { return new Intl.Locale(document.documentElement.lang || navigator.language).region; } catch { return ''; } })();

  const cc = (countryOverride || localStorage.getItem('emg.country') || metaCountry || 'US').toUpperCase();

  // 4) Country-name formatter (localized, robust; independent of globals)
  const toName = ((ln) => {
    let dn = null;
    try { dn = new Intl.DisplayNames([ln, 'en'], { type: 'region' }); } catch {}
    return (code) => {
      if (!code) return '';
      try { return dn?.of(code) || code; } catch { return code; }
    };
  })(locale);

  // 5) Build numbers list (Emergency / Police / Fire / Ambulance)
  const numbers = getNumbersFor(data, cc) || {};
  const labelFallback = { emergency: 'Emergency', police: 'Police', fire: 'Fire', ambulance: 'Ambulance' };
  const labelOf = (k) => (L && L[k]) || labelFallback[k] || k;

  const entries = [];
  if (numbers.emergency) entries.push({ key: 'emergency', num: numbers.emergency });
  if (numbers.police)    entries.push({ key: 'police',    num: numbers.police });
  if (numbers.fire)      entries.push({ key: 'fire',      num: numbers.fire });
  if (numbers.ambulance) entries.push({ key: 'ambulance', num: numbers.ambulance });

  // 6) Render region label + numbers
  const regionEl   = document.getElementById('emg-region-label');
  const buttonsEl  = document.getElementById('emg-buttons');
  const countrySel = document.getElementById('emg-country');

  if (regionEl) regionEl.textContent = toName(cc);

  if (buttonsEl) {
    // Vertical list like the former: “112 — Emergency”, etc.
    buttonsEl.innerHTML = entries.length
      ? entries
          .map(e => `<a href="tel:${e.num}" aria-label="Call ${e.num} — ${labelOf(e.key)}">${e.num} — ${labelOf(e.key)}</a>`)
          .join('<br>')
      : '';
  }

  // Build country dropdown (show country names; keep ISO codes as values)
  if (countrySel) {
    if (countrySel.options.length === 0) {
      const codes = Object.keys(data.countries || {})
        .sort((a, b) => toName(a).localeCompare(toName(b)));
      countrySel.innerHTML = codes
        .map(code => `<option value="${code}" ${code === cc ? 'selected' : ''}>${toName(code)}</option>`)
        .join('');
    } else if (countrySel.value !== cc) {
      countrySel.value = cc; // keep selection in sync on re-init
    }

    if (!countrySel.dataset.bound) {
      countrySel.addEventListener('change', () => {
        localStorage.setItem('emg.country', countrySel.value);
        initEmergencyBlock(countrySel.value);
      });
      countrySel.dataset.bound = '1';
    }
  }
}

  // ✅ Start of DOMContent
  // Wait until DOM is fully loaded before attaching handlers
  document.addEventListener('DOMContentLoaded', async () => {
    // 🧹 Clean up any leftover/ghost donation modal before anything runs
    document.getElementById("donation-modal")?.remove();
    
    // Old behavior: initialize Stripe once on DOM ready
    try {
      initStripe(STRIPE_PUBLIC_KEY);
      console.log("✅ Stripe initialized at startup");
    } catch (err) {
      console.error("❌ initStripe failed:", err);
    }        

    // 🌐 Use URL path only; root stays EN. Avoid stale flips from storage.
    const seg0 = (location.pathname.split('/').filter(Boolean)[0] || '');
    const lang = /^[a-z]{2}$/i.test(seg0) ? seg0.toLowerCase() : 'en';

    localStorage.setItem("lang", lang);  // keep: remember last prefix
    await loadTranslations(lang);        // ✅ Load selected language
    injectStaticTranslations();          // ✅ Apply static translations
    
    // listen for language switch requests from the root lock
    document.addEventListener('app:lang-changed', () => {
      injectStaticTranslations(); // translations already loaded by the sender
    });
        

    createMyStuffModal();                // 🎛️ Inject the "My Stuff" modal
    
    createHelpModal();                   // 🆘 Inject the Help / Emergency modal

    setupMyStuffModalLogic();           // 🧩 Setup tab handling inside modal
    flagStyler();                       // 🌐 Apply title/alt to any flag icons

    // measure bottom band; update CSS var
    const setBottomBandH = () => {
      const el = document.getElementById('bottom-band');
      const h = el ? Math.ceil(el.getBoundingClientRect().height) : 50;
      document.documentElement.style.setProperty('--bottom-band-h', `${h}px`);
    };
    setBottomBandH();

    // keep in sync with viewport and band size changes
    addEventListener('resize', () => requestAnimationFrame(setBottomBandH), { passive: true });
    addEventListener('orientationchange', setBottomBandH);
    addEventListener('pageshow', (e) => { if (e.persisted) setBottomBandH(); });

    // observe the band element itself
    (() => {
      const el = document.getElementById('bottom-band');
      if (el && 'ResizeObserver' in window) {
        new ResizeObserver(() => setBottomBandH()).observe(el);
      }
    })();

    // react to dynamic viewport UI (mobile toolbars)
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', setBottomBandH, { passive: true });
    }

    // Load JSONs: profiles.json (API) carries locations.
    // Static: actions/structure; contexts is static on Pages/local, API on navigen.io.

    // Prefer same-origin contexts on Pages/local; API on navigen.io (avoids CORS).
    const CONTEXTS_URL = (location.hostname.endsWith('pages.dev') || location.hostname.includes('localhost'))
      ? '/data/contexts.json'
      : 'https://navigen.io/api/data/contexts';

    // guard all three; 2-line comment: avoid boot break on 404/500
    const safeJson = async (p, fb) => { const r = await p.catch(() => null); return (r && r.ok) ? r.json() : fb; };
    const [actions, structure, contexts] = await Promise.all([
      safeJson(fetch('/data/actions.json',   { cache:'no-store' }), []),
      safeJson(fetch('/data/structure.json', { cache:'no-store' }), []),
      safeJson(fetch(CONTEXTS_URL, (CONTEXTS_URL.startsWith('/') ? { cache:'no-store' } : { cache:'no-store', credentials:'include' })), [])
    ]);

    state.actions = actions;

    // helper: safe number from variants
    const pickNum = (...vals) => {
      for (const v of vals) {
        const n = typeof v === "string" ? Number(v) : v;
        if (Number.isFinite(n)) return n;
      }
      return undefined;
    };

    // structure → map display group name to group key (use existing top-level let)
    structure_data = Array.isArray(structure)
      ? structure.map(g => ({ "Group": g.groupKey, "Drop-down": g.groupName }))
      : [];

    // Normalize profile.locations → legacy geoPoints shape used by UI
    // Build after apiItems is fetched (deferred below)
    let geoPointsData = []; // will assign after we fetch list

    // ✅ Local debug helper (not global)
    function debug() {
      return {
        total: geoPoints.length,
        visibleYes: geoPoints.filter(x => x.Visible === "Yes").length,
        priorityYes: geoPoints.filter(x => x.Priority === "Yes").length,
        groupKeyPresent: geoPoints.filter(x => x.groupKey).length,
        sample: geoPoints.slice(0,3).map(x => ({
          id: x.id,
          Visible: x.Visible,
          Priority: x.Priority,
          groupKey: x.groupKey
        }))
      };
    }

    // 3) keep downstream name the same
    // geoPoints = geoPointsData;

    // tiny id fallback; keeps existing comments
    function cryptoIdFallback() {
      return `loc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // 👇 dev-only: print datasets for inspection (no globals)
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.debug('[dev] datasets ready', { structure, geoPoints });
    }
    
    // ✅ BuildStructureByAdminArea: sections stay as Group; sub-sections are unique contact.adminArea values.
    // ✅ Input: list=geoCtx (filtered items), baseStructure=structure; returns groupedStructure-like array.
    function buildStructureByAdminArea(list, baseStructure) {
      // keep strict top-level Group; swap subgroups to adminArea
      const byGroup = new Map();
      list.forEach(loc => {
        const g = loc.Group;
        if (!g) return;
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g).push(loc);
      });

      return baseStructure
        .filter(g => byGroup.has(g.groupKey || g.Group))
        .map(g => {
          const groupKey = g.groupKey || g.Group;
          const locs = byGroup.get(groupKey) || [];
          // derive area from contactInformation  // 2-line: no fallback to contact
          const subs = [...new Set(locs.map(l => (l.contactInformation?.adminArea || '-')))]
            .sort((a,b) => String(a).localeCompare(String(b)))
            .map(area => ({
              key: `admin.${String(area)
                .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
                .toLowerCase().replace(/[^a-z0-9]+/g,'-')
                .replace(/^-+|-+$/g,'')}`,
              name: area || '-'           // human label used by renderer
            }));

          return { groupKey, groupName: g.groupName || g["Drop-down"] || groupKey, subgroups: subs };
        });
    }
        

    /**
     * 1) Group FLAT rows → groupedStructure
     *    (Not needed now: structure.json is ALREADY grouped.)
     *    Keep a reference named groupedStructure for downstream clarity.
     */
    const groupedStructure = structure;

    /**
     * 2) Flat view for header wiring/styling (wireAccordionGroups)
     *    (structure_data computed above)
     */

    /**
     * 3) Normalize geoPoints.Group from display names → canonical keys
     *    Run AFTER geoPoints is populated; accept either display or key.
     */
    function normalizeGroupKeys(list) {
      if (!Array.isArray(list) || !list.length) return;
      list.forEach(p => {
        const g = String(p.Group || '').trim();
        if (!g) return;
        // match by display name (“Drop-down”) OR already-canonical key (“Group”)
        const entry = structure_data.find(x => x["Drop-down"] === g || x.Group === g);
        if (entry) p.Group = entry.Group; // canonical like "group.services"
      });
    }

    /**
     * 4) Subgroup sanity check (warn if locations use unknown sub keys)
     */
    const subgroupIndex = Object.fromEntries(
      groupedStructure.flatMap(g => g.subgroups.map(s => [s.key, s.name]))
    );
    const badSubs = geoPoints.filter(p => p["Subgroup key"] && !subgroupIndex[p["Subgroup key"]]);
    if (badSubs.length) {
      console.warn("⚠️ Unknown Subgroup key(s) in locations:", badSubs.map(b => ({
        id: String(b?.locationID ?? b?.ID ?? b?.id ?? ''),
        name: String((b?.locationName?.en ?? b?.locationName ?? '')),
        subgroup: b["Subgroup key"]
      })));
    } else {
      console.log("✅ All location Subgroup keys are valid.");
    }
    
    // Disable browser's automatic scroll restoration completely
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Always reset scroll position to top on load
    window.addEventListener('load', () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    
    // ——— Path → pageKey → filter (no params) ———
    const segs = location.pathname.split('/').filter(Boolean);
    if (/^[a-z]{2}$/i.test(segs[0] || '')) segs.shift(); // drop {lang}
    let ACTIVE_PAGE = null;
    if (segs.length >= 2) {
      const namespace = String(segs[0]).toLowerCase();
      const key = segs.slice(1).join('/').toLowerCase(); // keep slashes
      ACTIVE_PAGE = `${namespace}/${key}`;
    }
    
    // demo: force structure-only coverage view (no data fetch)
    const DEMO_ALLSUBS = (segs.length === 1 && segs[0].toLowerCase() === 'allsubs');
    if (DEMO_ALLSUBS) {
      ACTIVE_PAGE = null; // skip list fetch → empty items
      document.documentElement.setAttribute('data-demo','allsubs'); // hint UI
    }    

    // Active context row for this page (used for default group/sub)
    const ctxRow = Array.isArray(contexts) ? contexts.find(c => c.pageKey === ACTIVE_PAGE) : null;

    const API_LIMIT = 99; // ask for up to 99 items per page

    // canonical API; keep single source of truth
    const API_BASE = 'https://navigen-api.4naama.workers.dev';

    // First API call must not block boot; force fresh list to avoid stale cache
    let listRes;
    try {
      // derive context from URL path (strip optional /{lang}/ and trailing slash)
      const parts = location.pathname.split('/').filter(Boolean);
      const noLang = (/^[a-z]{2}$/i.test(parts[0] || '')) ? parts.slice(1) : parts;
      const __ctx = noLang.join('/').replace(/\/$/,'').toLowerCase();

      if (__ctx) {
        const url = new URL(
          `/api/data/list?context=${encodeURIComponent(__ctx)}&limit=${API_LIMIT}`,
          API_BASE
        );

        if (location.hostname.endsWith('pages.dev') || location.hostname.includes('localhost')) {
          url.searchParams.set('cb', String(Date.now()));
        }

        listRes = await fetch(url, {
          credentials: 'omit',              // no cookies → no credentialed CORS needed
          cache: 'no-store',
          headers: {} // rely on fetch's cache: 'no-store'
        });

        // retry once on 404: some deployed Worker bundles only match the slash-suffixed path
        // keep query params; do not loop (one attempt only)
        if (listRes && listRes.status === 404) {
          const alt = new URL(url.toString());
          if (!alt.pathname.endsWith('/')) alt.pathname += '/';
          const r2 = await fetch(alt, { credentials: 'omit', cache: 'no-store' }); // same headers/policy
          if (r2.ok) listRes = r2;
        }
      } else {
        // root (no context path): use empty list
        listRes = { ok: true, json: async () => ({ items: [] }) };
      }
    } catch (err) {
      console.warn('list API failed', err);
      showToast('Data API unavailable. Showing cached items.');
      listRes = { ok: false, json: async () => ({ items: [] }) };
    }

    const listJson = listRes.ok ? await listRes.json() : { items: [] };
    const apiItems = Array.isArray(listJson.items) ? listJson.items : [];
        
    // Map API items → legacy geoPoints for UI (accordion/Popular)
    const pageLang = (document.documentElement.lang || 'en').toLowerCase(); // avoid const "lang" redeclare
    const pickName = (v) => (typeof v === 'string') ? v : (v?.[pageLang] || v?.en || (v ? Object.values(v)[0] : '') || '');

    const fallbackGroup = (Array.isArray(structure) && structure[0]?.groupKey) ||
                          (Array.isArray(structure_data) && structure_data[0]?.Group) || 'group.other';

    // Normalize any coord to "lat,lng"
    // accept object coord (numbers or numeric-strings); keep old fallbacks
    const toCoord = (it) => {
      if (typeof it?.coord === 'string') return it.coord;            // keep
      if (it?.coord && it.coord.lat != null && it.coord.lng != null) {
        const la = Number(it.coord.lat), ln = Number(it.coord.lng);  // 2-line comment: coerce
        if (Number.isFinite(la) && Number.isFinite(ln)) return `${la},${ln}`;
      }
      if (typeof it?.coordinateCompound === 'string') return it.coordinateCompound;
      const lat = it?.lat ?? it?.latitude ?? it?.location?.lat;
      const lng = it?.lng ?? it?.longitude ?? it?.location?.lng;
      return (Number.isFinite(lat) && Number.isFinite(lng)) ? `${lat},${lng}` : '';
    };

    // Build one legacy record
    const toGeoPoint = (it) => {
      // ULID stays canonical in ID; locationID must be the short dataset slug for Dash/QR
      const uid = String(it?.ID || it?.id || '').trim();                     // ULID only (canonical)
      let alias = String(it?.slug || it?.alias || '').trim();                // short slug for UI/Dashboard
      const apiLoc = String(it?.locationID || '').trim();                    // may be slug or ULID from API
      if (apiLoc && !/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(apiLoc) && !alias) alias = apiLoc; // accept non-ULID as slug
      const locationID = alias;                                              // prefer short slug only

      const nm = String((it?.locationName?.en ?? it?.locationName ?? '')).trim();
      
      const grp = String(it?.groupKey ?? it?.group ?? ctxRow?.groupKey ?? fallbackGroup);
      const sub = String(it?.subgroupKey ?? it?.subgroup ?? ctxRow?.subgroupKey ?? '');
      
      // Popular is a data flag (locations_data), not a content tag
      const v = (it?.Priority ?? it?.Popular ?? it?.priority);
      const pri = (v === true || v === 1 || String(v ?? '').toLowerCase() === 'yes' || String(v ?? '').toLowerCase() === 'true')
        ? 'Yes' : 'No';

      const cc  = toCoord(it);
      const ctx = Array.isArray(it?.contexts) && it.contexts.length ? it.contexts.join(';') : String(ACTIVE_PAGE || '');

      return {
        locationID,                  // short slug only (for Dash/QR/QR-code)
        ID: uid || '',               // keep ULID in legacy ID slot; never mirror slug here
        id: uid || locationID,       // primary id for LPM: ULID preferred; else slug

        // always provide an object with .en so all callers resolve a name
        locationName: (it && typeof it.locationName === 'object' && it.locationName)
          ? it.locationName
          : { en: String(nm) },
        Group: grp,
        "Subgroup key": sub,
        Visible: "Yes", // keep: legacy UI expects "Yes"/"No"; Popular ignores this
        Priority: pri,
        "Coordinate Compound": cc,
        coord: cc,              // used by distance mode
        Context: ctx,
        qrUrl: it?.qrUrl || '',
        tags: Array.isArray(it?.tags) ? it.tags : [],
        // keep: pass through cover + images; accept strings or {src}; never drop gallery
        media: (() => {
          const m = (it && typeof it.media === 'object') ? it.media : {};
          const cover = (m.cover || it?.cover || '').trim();
          const raw = Array.isArray(m.images) ? m.images : (Array.isArray(it?.images) ? it.images : []);
          const images = raw.map(v => (typeof v === 'string' ? v : v?.src)).filter(Boolean);
          return { ...m, cover, images };
        })(),
        descriptions: it?.descriptions || {},
        // contactInformation is the single source
        contactInformation: it?.contactInformation || {},

        // rating: minimal fields for sorting (easy to mine from exporters)
        ratings: (() => {
          const gR = Number(it?.ratings?.google?.rating ?? it?.google_rating);
          const gC = Number(it?.ratings?.google?.count  ?? it?.google_count  ?? 0);
          const tR = Number(it?.ratings?.tripadvisor?.rating ?? it?.tripadvisor_rating);
          const tC = Number(it?.ratings?.tripadvisor?.count  ?? it?.tripadvisor_count  ?? 0);
          const n  = (Number.isFinite(gR) ? gC : 0) + (Number.isFinite(tR) ? tC : 0);
          const R  = n ? (((Number.isFinite(gR)? gR*gC : 0) + (Number.isFinite(tR)? tR*tC : 0)) / n) : 0;
          const C = 4.2, m = 25;                      // small prior; tune later
          const score = n ? ((C*m) + (R*n)) / (m + n) : 0;
          return {
            google: { rating: Number.isFinite(gR) ? gR : null, count: gC || 0 },
            tripadvisor: { rating: Number.isFinite(tR) ? tR : null, count: tC || 0 },
            combined: { value: R, count: n, score }   // value=avg 0–5, score=smoothed
          };
        })(),

        // pass-through: socials/official/booking/newsletter
        links: it?.links || {},
        // optional: keep original ratings separately (computed stays in .ratings)
        origRatings: it?.ratings || {},
        pricing: it?.pricing || {},
        lang: it?.lang || ''
      };
    };

    // Assign the mapped list now that we have the API items
    geoPointsData = apiItems.map(toGeoPoint);
    geoPoints = geoPointsData;
    // normalize groups now that geoPoints is ready
    normalizeGroupKeys(geoPoints);

    // Open LPM on ?lp=<id> (post-mapping, single source of truth)
    {
      const q   = new URLSearchParams(location.search);
      const uid = (q.get('lp') || '').trim();

      if (uid && Array.isArray(geoPoints) && geoPoints.length) {
        const rec = geoPoints.find(x =>
          String(x?.ID || x?.id || '') === uid ||              // ULID match
          String(x?.locationID || '') === uid                  // slug / alias match
        ); // find by ULID or slug in local list
        if (rec) {
          const media   = rec.media || {};
          const gallery = Array.isArray(media.images) ? media.images : [];
          const images  = gallery.map(v => (typeof v === 'string' ? v : v?.src)).filter(Boolean);

          const cover = (media.cover && String(media.cover).trim()) || images[0];
          if (!cover) { console.warn('Data error: cover required'); }
          else {
            const cc = String(rec["Coordinate Compound"] || rec.coord || "");
            const [lat, lng] = cc.includes(",") ? cc.split(",").map(s => s.trim()) : ["",""];

            showLocationProfileModal({
              // identifiers (single-field model)
              locationID: String(rec?.locationID || ''),           // human slug if present
              id:         String(rec?.ID || rec?.id || uid),       // ULID

              // display
              displayName: String((rec?.locationName?.en ?? rec?.locationName ?? 'Unnamed')).trim(),
              name:        String((rec?.locationName?.en ?? rec?.locationName ?? 'Unnamed')).trim(),

              // geo
              lat, lng,

              // media
              imageSrc: cover,
              images,
              media,

              // meta
              descriptions: (rec && typeof rec.descriptions === 'object') ? rec.descriptions : {},
              tags: Array.isArray(rec?.tags) ? rec.tags : [],
              contactInformation: (rec && rec.contactInformation) || {},
              links: (rec && rec.links) || {},
              ratings: (rec && rec.ratings) || {},
              pricing: (rec && rec.pricing) || {},

              // origin
              originEl: null
            });
          }
        }
      } else if (uid) {
        // Fallback: fetch by alias or ULID when the list for this context wasn’t loaded
        try {
          const res = await fetch(`${API_BASE}/api/data/item?id=${encodeURIComponent(uid)}`, {
            cache: 'no-store',
            credentials: 'omit'
          });
          if (res.ok) {
            const it    = await res.json();
            const media = (it && typeof it.media === 'object') ? it.media : {};
            const raw   = Array.isArray(media.images) ? media.images : (Array.isArray(it?.images) ? it.images : []);
            const images= raw.map(v => (typeof v === 'string' ? v : v?.src)).filter(Boolean);
            const cover = (media.cover && String(media.cover).trim()) || images[0] || '';

            if (!cover) {
              console.warn('Data error: cover required (QR)');
            } else {
              const cc = (() => {
                if (typeof it?.coord === 'string') return it.coord;
                if (it?.coord && it.coord.lat != null && it.coord.lng != null) return `${it.coord.lat},${it.coord.lng}`;
                if (typeof it?.coordinateCompound === 'string') return it.coordinateCompound;
                return '';
              })();
              const [lat, lng] = cc.includes(',') ? cc.split(',').map(s=>s.trim()) : ['',''];
              const name = String((it?.locationName?.en ?? it?.locationName ?? 'Unnamed')).trim();

              showLocationProfileModal({
                // identifiers
                locationID: String(it?.slug || it?.alias || it?.locationID || ''), // human if available
                id:         String(it?.ID || it?.id || uid),                        // ULID or alias

                // display
                displayName: name, name,

                // geo
                lat, lng,

                // media
                imageSrc: cover,
                images,
                media,

                // meta
                descriptions: it?.descriptions || {},
                tags: Array.isArray(it?.tags) ? it.tags : [],
                contactInformation: it?.contactInformation || {},
                links: it?.links || {},
                ratings: it?.ratings || {},
                pricing: it?.pricing || {},

                // origin
                originEl: null
              });
            }
          }
        } catch (e) {
          console.warn('QR fallback fetch failed', e);
        }
      }

      // drop only ?lp; keep others
      q.delete('lp');
      const next = location.pathname + (q.toString() ? `?${q}` : '') + location.hash;
      history.replaceState({}, document.title, next);
    }
            
    const geoCtx = ACTIVE_PAGE
      ? geoPoints.filter(loc =>
          loc.Visible === 'Yes' && // keep: used by non-Popular groups
          String(loc.Context || '')
            .split(';')
            .map(s => s.trim().toLowerCase())
            .includes(ACTIVE_PAGE)
        )
      : geoPoints;

    // Popular: scope by context only (Priority filter happens inside renderPopularGroup)
    const popularCtx = ACTIVE_PAGE
      ? geoPoints.filter(loc =>
          String(loc.Context || '')
            .split(';')
            .map(s => s.trim().toLowerCase())
            .includes(ACTIVE_PAGE)
        )
      : geoPoints;

    /**
     * 5) Render: grouped → DOM (buildAccordion), flat → header styling (wireAccordionGroups)
     */
    renderPopularGroup(popularCtx);

    // i18n labels for the current lang (keys → labels)
    const modeLabelByKey = {
      structure:  t('view.settings.mode.structure'),
      adminArea:  t('view.settings.mode.adminArea'),
      city:       t('view.settings.mode.city'),
      postalCode: t('view.settings.mode.postalCode'),
      alpha:      t('view.settings.mode.alpha'),
      priority:   t('view.settings.mode.priority'),
      rating:     t('view.settings.mode.rating'),
      distance:   t('view.settings.mode.distance')
    };

    // labels (lowercased) → canonical keys
    const labelToKey = Object.fromEntries(
      Object.entries(modeLabelByKey).map(([k, v]) => [String(v || '').toLowerCase(), k])
    );
    // canonical key list (case as used in i18n lookups)
    const CANON = ['structure', 'adminArea', 'city', 'postalCode', 'alpha', 'priority', 'rating', 'distance'];

    // normalize any token (key or translated label) → canonical key
    const normToken = (tok) => {
      const s = String(tok || '').trim();
      if (!s) return '';
      const lc = s.toLowerCase();
      if (lc === 'az') return 'alpha';                                  // legacy alias
      // exact label → key
      if (labelToKey[lc]) return labelToKey[lc];
      // case-insensitive key match
      const k = CANON.find(k0 => k0.toLowerCase() === lc);
      return k || '';
    };

    // allowed (canonical keys, unique)
    const allowedRaw = String(ctxRow?.viewOptions || '').split('|').filter(Boolean);
    const allowed = Array.from(new Set(allowedRaw.map(normToken).filter(Boolean)));
    const allowedLC = allowed.map(k => k.toLowerCase());

    // default to grouped-by-adminArea when context/storage don’t specify
    const defaultView = normToken(ctxRow?.defaultView || ctxRow?.subgroupMode || 'adminArea') || 'adminArea';
    const defaultViewLC = defaultView.toLowerCase();

    // stored choice (normalized)
    const storeKey = `navigen:view:${ACTIVE_PAGE}`;
    const storedLC = normToken(localStorage.getItem(storeKey) || '').toLowerCase();

    // pick initial mode (stored beats default; compare in lower-case)
    let mode = allowedLC.includes(storedLC) ? storedLC : defaultViewLC;

    // set "Filtered by" UI (two boxes: label + value)
    {
      const lbl = document.getElementById('listing-filter-label');
      const val = document.getElementById('listing-filter-value');
      const fallback = document.getElementById('listing-filter-info'); // legacy single box
      const canonKey = (['structure','adminArea','city','postalCode','alpha','price','rating','distance']
        .find(k => k.toLowerCase() === mode)) || mode;
      const valueText = t(`view.settings.mode.${canonKey}`) || canonKey;

      if (lbl && val) {
        lbl.textContent = t('listing.filterInfo.prefix'); // "Filtered by:"
        val.textContent = valueText;                      // parameter (e.g., city)
      } else if (fallback) {
        fallback.textContent = `${t('listing.filterInfo.prefix')} ${valueText}`; // safe fallback
      }
    }

    // ✅ Filter opens button-less modal; selection persists per page; no centroid fallback
    (function wireViewFilter(){
      const filter = document.getElementById('view-filter');
      if (!filter) return;

      // Build menu from allowed list; if distance is present but geolocation missing, hidden by modal helper
      const opts = (allowed.length ? allowed : ['structure','adminArea','city','postalCode','alpha','price','rating','distance']);

      filter.onclick = () => {
        const segs = String(ACTIVE_PAGE || '').split('/');   // safe: '' → []
        if (!segs[0]) return; // no context; ignore click
        const namespace = segs[0] || '';
        const brand     = segs[1] || '';
        const scope     = segs.slice(2).join('/') || '';

        openViewSettingsModal({
          pageKey:   ACTIVE_PAGE,
          namespace, brand, scope,
          current:   mode,
          options:   opts,
          defaultKey: defaultView,
          onPick: (key) => {
            if (key === '__RESET__') {
              localStorage.removeItem(storeKey);
              location.reload();
              return;
            }
            const chosen = String(key).toLowerCase();
            localStorage.setItem(storeKey, chosen);
            location.reload();
          }
        });
      };
    })();

    // ✅ When in admin-area mode, remap each item's subgroupKey to admin.<slug(AdminArea)> (in memory only)
    // ——— View builders ———
    const slugify = (s) => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    const label = (s) => String(s||'-');

    const buildStructureBy = (list, fieldFn) => {
      const byGroup = new Map();
      list.forEach(rec => {
        const g = rec.Group; if (!g) return;
        if (!byGroup.has(g)) byGroup.set(g, []);
        byGroup.get(g).push(rec);
      });
      return structure
        .filter(g => byGroup.has(g.groupKey || g.Group))
        .map(g => {
          const groupKey = g.groupKey || g.Group;
          const locs = byGroup.get(groupKey) || [];
          const subs = Array.from(new Set(locs.map(r => fieldFn(r))))
            .sort((a,b)=>String(a||'').localeCompare(String(b||'')))
            .map(val => ({ key: `dyn.${slugify(val)}`, name: label(val) }));
          return { groupKey, groupName: g.groupName || g["Drop-down"] || groupKey, subgroups: subs };
        });
    };

    // Per-mode: subgroupKey remap (in memory) and structure builder
    const pageList = geoCtx.map(rec => ({ ...rec })); // shallow clone
    const modeMap = {
      structure: () => ({ list: pageList, grouped: structure }),
      // use contactInformation.* only  // 2-line: legacy contact removed
      adminarea: () => {
        pageList.forEach(r => { const k = r?.contactInformation?.adminArea; const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => r?.contactInformation?.adminArea) };
      },
      city: () => {
        pageList.forEach(r => { const k = r?.contactInformation?.city; const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => r?.contactInformation?.city) };
      },
      postalcode: () => {
        pageList.forEach(r => { const k = r?.contactInformation?.postalCode; const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => r?.contactInformation?.postalCode) };
      },
      alpha: () => {
        pageList.forEach(r => {
          const n = String((r?.locationName?.en ?? r?.locationName ?? '')).trim();
          // use 2nd word’s first letter if “HD …” pattern, else first
          const token = n.startsWith('HD ') ? n.split(/\s+/)[1] || n : n;
          // strip accents before picking first letter
          const k = token ? token.normalize('NFD').replace(/[\u0300-\u036f]/g,'').charAt(0).toUpperCase() : '#';
          const dyn = `dyn.${slugify(k)}`;
          r.subgroupKey = dyn; r["Subgroup key"] = dyn;
        });
        return {
          list: pageList,
          grouped: buildStructureBy(pageList, r => {
            const n = String((r?.locationName?.en ?? r?.locationName ?? '')).trim();
            const token = n.startsWith('HD ') ? n.split(/\s+/)[1] || n : n;
            return token ? token.normalize('NFD').replace(/[\u0300-\u036f]/g,'').charAt(0).toUpperCase() : '#';
          })
        };
      },

      priority: () => {
        pageList.forEach(r => { const k = (String(r?.Priority||'No').toLowerCase()==='yes') ? 'Featured' : 'Other';
          const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => (String(r?.Priority||'No').toLowerCase()==='yes') ? 'Featured' : 'Other') };
      },
      // order by smoothed rating (then by total count, then by name)
        rating: () => {
          const band = (s) => s >= 4.5 ? 'Excellent (4.5–5)'
                      : s >= 4.0 ? 'Great (4.0–4.4)'
                      : s >= 3.0 ? 'Good (3.0–3.9)'
                      : s >  0   ? 'Okay (<3)'
                      : 'Unrated';

          pageList.forEach(r => {
            const gR = Number(r?.ratings?.google?.rating);
            const gC = Number(r?.ratings?.google?.count  || 0);
            const tR = Number(r?.ratings?.tripadvisor?.rating);
            const tC = Number(r?.ratings?.tripadvisor?.count  || 0);
            const n  = (Number.isFinite(gR) ? gC : 0) + (Number.isFinite(tR) ? tC : 0);
            const R  = n ? (((Number.isFinite(gR)? gR*gC : 0) + (Number.isFinite(tR)? tR*tC : 0)) / n) : 0;
            const C = 4.2, m = 25;
            const score = n ? ((C*m) + (R*n)) / (m + n) : 0;
            r.__score = score; r.__rcnt = n;
            const dyn = `dyn.${slugify(band(score))}`;
            r.subgroupKey = dyn; r["Subgroup key"] = dyn;
          });

        pageList.sort((a,b) =>
          (b.__score - a.__score) ||
          (b.__rcnt  - a.__rcnt ) ||
          String((a?.locationName?.en ?? a?.locationName ?? '')).localeCompare(
            String((b?.locationName?.en ?? b?.locationName ?? ''))
          )
        );

          const grouped = buildStructureBy(pageList, r => band(Number(r.__score || 0)));
          return { list: pageList, grouped };
        },
                
      distance: () => {
        // pick origin: user → page center → centroid
        let origin = null;
        if (navigator.geolocation) {/* will be async in future; for now fallback */}
        const cc = (ctxRow?.centerCoord||'').split(',').map(s=>Number(s.trim()));
        if (cc.length===2 && cc.every(Number.isFinite)) origin = {lat:cc[0], lon:cc[1]};
        if (!origin) {
          const pts = pageList.map(r => String(r?.coord||'').split(',').map(s=>Number(s.trim()))).filter(a=>a.length===2&&a.every(Number.isFinite));
          if (pts.length) { const lat = pts.reduce((s,a)=>s+a[0],0)/pts.length; const lon = pts.reduce((s,a)=>s+a[1],0)/pts.length; origin = {lat,lon}; }
        }
        const R = 6371, toRad = d => d*Math.PI/180;
        const distKm = (a,b) => { const dLat = toRad(b.lat-a.lat), dLon = toRad(b.lon-a.lon);
          const la1=toRad(a.lat), la2=toRad(b.lat);
          const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
          return 2*R*Math.asin(Math.sqrt(x)); };
        pageList.forEach(r => { const [lat,lon] = String(r?.coord||'').split(',').map(s=>Number(s.trim())); r.__km = (origin && Number.isFinite(lat)&&Number.isFinite(lon)) ? distKm(origin,{lat,lon}) : Infinity; });
        pageList.sort((a,b)=>(a.__km||0)-(b.__km||0));
        const band = k => (k<2?'Near (≤2 km)':k<5?'Mid (2–5 km)':k<10?'Far (5–10 km)':'10 km+');
        pageList.forEach(r => { const k = band(r.__km||Infinity); const dyn=`dyn.${slugify(k)}`; r.subgroupKey=dyn; r["Subgroup key"]=dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => band(r.__km||Infinity)) };
      }
    };
    const { list: viewList, grouped: groupedForPage } = (modeMap[mode] || modeMap.structure)();

    buildAccordion(groupedForPage, viewList);
    wireAccordionGroups(structure_data, viewList);
    paintAccordionColors();
    
    // coverage: remove placeholders from accordion only (keep others)
    document.querySelectorAll('#accordion .empty-state').forEach(el => el.remove());
        
    // static UI text applier; module-scoped (ESM), callable from pageshow & DOMContentLoaded
    function injectStaticTranslations() {
      // Main UI text
      // safe set: optional chaining cannot be on assignment LHS
      const titleEl = document.getElementById("page-title"); if (titleEl) titleEl.textContent = t("page.title");
      
      // Sub-tagline: prefer context-scoped i18n key from meta("navigen-context") or URL path.
      // Fallback to t("page.tagline") when no override; ctx sanitized to snake_case.
      const sub = document.querySelector(".page-subtext");
      if (sub) {
        // pick context from meta or path; fallback to default key
        const metaCtx = document.querySelector('meta[name="navigen-context"]')?.content?.trim() || "";
        const ctxFromPath = location.pathname
          .replace(/^\/[a-z]{2}\//i, "")  // strip ANY 2-letter lang prefix like /en/, /de/, /it/ …
          .replace(/\/$/, "");
        const ctx = (metaCtx || ctxFromPath).toLowerCase();
        const snake = (s) => s.replace(/[^\w]+/g, "_");

        // build cascade: full ctx → parents → default
        const parts = ctx ? ctx.split("/").filter(Boolean) : [];
        const keys = parts.length
          ? [ `page.tagline.${snake(parts.join("/"))}`,
              ...parts.slice(0, -1).map((_, i) => `page.tagline.${snake(parts.slice(0, parts.length - 1 - i).join("/"))}`),
              "page.tagline" ]
          : ["page.tagline"];

        let val = "";
        for (const k of keys) { const v = t(k); if (v && v !== k) { val = v; break; } }
        sub.textContent = val || t("page.tagline"); // prefer ctx; parent/default if missing
      }

      const s = document.getElementById("search"); if (s) s.placeholder = t("search.placeholder");
      /* emoji-only Here button; keep a11y text via title/aria-label */
      const here = document.getElementById("here-button");
      if (here) {
        here.textContent = "🎯";
        here.title = t("button.here");              // tooltip stays localized
        here.setAttribute("aria-label", t("button.here")); // screen readers
      }

      // <title> + meta
      document.title = t("page.windowTitle");
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", t("page.metaDescription"));

      // Footer tooltips
      const ids = [
        ["my-stuff-toggle","tooltip.myStuff"],
        ["alert-button","tooltip.alerts"],
        ["help-button","tooltip.service"],
        ["accessibility-button","tooltip.accessibility"]
      ];
      ids.forEach(([id,key])=>{ const el=document.getElementById(id); if(el) el.title=t(key); });
    }
         
      // Inside your existing main DOMContentLoaded block
      // use outer lets; avoid shadowing so later blocks see the same refs
      searchInput = document.getElementById('search');
      
      // move "Listing filter info" above the Search row
      {
        const row = document.getElementById('search-container');
        if (row) {
          let info = document.getElementById('listing-filter-info');
          if (!info) {
            info = document.createElement('div');
            info.id = 'listing-filter-info'; // legacy holder; kept for safety
          }
          
          // ⬅️ Create a row with two boxes before the search row (RTL-safe, no wrap)
          let filtersRow = document.getElementById('filters-inline');
          if (!filtersRow) {
            filtersRow = document.createElement('div');
            filtersRow.id = 'filters-inline';
            row.parentNode.insertBefore(filtersRow, row);
          }

          // Box #1: static label
          let infoLabel = document.getElementById('listing-filter-label');
          if (!infoLabel) {
            infoLabel = document.createElement('div');
            infoLabel.id = 'listing-filter-label'; // styled in CSS
            filtersRow.appendChild(infoLabel);
          }

          // Box #2: dynamic value (FVB acts as button)
          let infoValue = document.getElementById('listing-filter-value');
          if (!infoValue) {
            infoValue = document.createElement('div');
            infoValue.id = 'listing-filter-value'; // styled in CSS
            filtersRow.appendChild(infoValue);
          }

          // Compute current mode and set texts
          const getMode = () => {
            const el = document.querySelector('[data-mode]'); // 2-line: try data attr first
            if (el && el.dataset.mode) return el.dataset.mode;
            return (typeof mode !== 'undefined' && mode) ? String(mode) : 'alpha';
          };
          const raw = getMode();
          const canon = ['structure','adminArea','city','postalCode','alpha','price','rating','distance']
            .find(k => k.toLowerCase() === raw.toLowerCase()) || raw;
          // set texts for the two boxes
          infoLabel.textContent = t('listing.filterInfo.prefix');   // "Filtered by:"
          infoValue.textContent = t(`view.settings.mode.${canon}`); // parameter (e.g., city)

          /* FVB dropdown (inline under value box, no modal) */
          {
            // drop any legacy handlers on the value box
            const oldVal = document.getElementById('listing-filter-value');
            const val = oldVal.cloneNode(true);                     // keep text/attrs
            oldVal.parentNode.replaceChild(val, oldVal);

            // accessible combobox shell
            val.setAttribute('role', 'combobox');
            val.setAttribute('aria-expanded', 'false');
            val.tabIndex = 0;

            // remove legacy modal button if present
            const legacyBtn = document.getElementById('view-filter');
            if (legacyBtn && legacyBtn.parentElement) legacyBtn.remove();

            // tiny helper: list of modes as used in modal
            const MODES = ['structure','adminArea','city','postalCode','alpha','price','rating','distance'];

            // map current state to canon key
            const canonFrom = (v) => MODES.find(k => k.toLowerCase() === String(v).toLowerCase()) || String(v);

            // current canon from data-mode or last computed value
            const getCanon = () => {
              const carrier = document.querySelector('[data-mode]');
              const rawVal = carrier?.dataset?.mode || canon;
              return canonFrom(rawVal);
            };

            // build popover once under the same row
            let pop = document.getElementById('fvb-popover');
            if (!pop) {
              pop = document.createElement('div');
              pop.id = 'fvb-popover';
              pop.setAttribute('role', 'listbox'); // a11y
              pop.hidden = true;
              filtersRow.appendChild(pop);         // sits under the row
            }

            // render options
            const render = (current) => {
              pop.innerHTML = '';
              MODES.forEach(k => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'fvb-option';
                btn.setAttribute('role', 'option');
                btn.setAttribute('aria-selected', String(k === current));
                const FALLBACK_LABEL = {
                  structure:'Category',
                  adminArea:'Region',
                  city:'City',
                  postalCode:'Postal code',
                  alpha:'Alphabetical',
                  price:'Price',
                  rating:'Rating',
                  distance:'Distance (closest first)'
                };
                btn.textContent = t(`view.settings.mode.${k}`) || FALLBACK_LABEL[k] || k;
                if (k === current) btn.classList.add('is-selected');
                btn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  // update visible value
                  val.textContent = t(`view.settings.mode.${k}`) || k;
                  // persist + apply (reuse the page-scoped key your code already uses)
                  localStorage.setItem(storeKey, String(k).toLowerCase());
                  location.reload(); // rebuilds with the chosen view

                  // notify app of mode change
                  val.dispatchEvent(new CustomEvent('fvb:change', { detail: { mode: k }, bubbles: true }));
                  close();
                });
                pop.appendChild(btn);
              });
            };

            // open/close aligned under the value box
            const open = () => {
              render(getCanon());
              const v = val.getBoundingClientRect();
              const r = filtersRow.getBoundingClientRect();
              /* match FVB width exactly using subpixel precision (no rounding) */
              pop.style.width = val.getBoundingClientRect().width + 'px';


              pop.style.left = (v.left - r.left) + 'px';
              pop.style.top  = (v.bottom - r.top) + 'px';
              pop.hidden = false;
              val.setAttribute('aria-expanded', 'true');
              // one-shot outside close
              const onDoc = (evt) => {
                if (evt.target === val || pop.contains(evt.target)) return;
                close();
              };
              val._fvbDoc = onDoc; // no global
              /* close on outside click AFTER option handlers run (bubble, not capture) */
              document.addEventListener('click', onDoc, { capture: false });
            };

            const close = () => {
              pop.hidden = true;
              val.setAttribute('aria-expanded', 'false');
              if (val._fvbDoc) {
                /* match listener phase so removal always succeeds */
                document.removeEventListener('click', val._fvbDoc, { capture: false });
                val._fvbDoc = null;
              }
            };

            // toggle handlers; suppress any stray modal openers
            val.addEventListener('click', (e) => {
              e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
              pop.hidden ? open() : close();
            }, { capture: true });

            val.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pop.hidden ? open() : close(); }
              if (e.key === 'Escape') { e.preventDefault(); close(); val.focus(); }
              // simple arrow nav
              if (!pop.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                e.preventDefault();
                const opts = Array.from(pop.querySelectorAll('.fvb-option'));
                const idx = opts.findIndex(o => o.classList.contains('is-active'));
                const next = e.key === 'ArrowDown' ? Math.min(idx + 1, opts.length - 1) : Math.max(idx - 1, 0);
                opts.forEach(o => o.classList.remove('is-active'));
                (opts[next] || opts[0]).classList.add('is-active');
                (opts[next] || opts[0]).focus();
              }             
            });
          }
        }
      }

      clearBtn = document.getElementById('clear-search'); // keep comment; clarify scope

      if (searchInput && clearBtn) {
        // lead: debounce filtering to cut redundant DOM work on rapid input
        function debounce(fn, ms = 150) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
        const debouncedFilter = debounce(filterLocations, 150);

        searchInput.addEventListener('input', () => {
          const q = searchInput.value;
          const hasText = q.trim() !== '';
          clearBtn.style.display = hasText ? 'inline' : 'none';
          debouncedFilter(q); // debounced call
        });

        clearBtn.addEventListener('click', () => {
          clearSearch();
          debouncedFilter(''); // reset via debounced path
          searchInput.focus();
        });

        clearBtn.style.display = 'none'; // Hide by default
      }
      
    // ✅ Keep × and filter in the correct row order
    let filterBtn = document.getElementById('view-filter');
    if (!filterBtn) {
      filterBtn = document.createElement('button');
      filterBtn.id = 'view-filter';
      filterBtn.type = 'button';
      filterBtn.title = t('view.settings.title'); // localized tooltip
      // use filter icon image (consistent look) — sized by CSS
      const _img0 = filterBtn.querySelector('img');
      if (_img0) { _img0.src = '/assets/icons-sliders.png'; _img0.alt = ''; }
      else { filterBtn.innerHTML = '<img src="/assets/icons-sliders.png" alt="">' ;}

      // ⬇️ Ensure the clear (×) lives inside the search container and right after the input
      // short: make CSS selector #search + #clear-search and absolute position work
      const clearEl = document.getElementById('clear-search'); // keep comment; clarify scope
      const wrap = searchInput.closest('#search-left') || searchInput.parentElement; // short: anchor for absolute

      if (clearEl && wrap) {
        if (clearEl.parentElement !== wrap) wrap.appendChild(clearEl); // move inside container
        if (clearEl.previousElementSibling !== searchInput) {
          searchInput.insertAdjacentElement('afterend', clearEl); // × immediately after input
        }
      }

      // make the Filter Value Box (FVB) the trigger; do not insert the old Filter button
      {
        // ensure the two-box UI exists already
        const infoLabel = document.getElementById('listing-filter-label');
        const infoValue = document.getElementById('listing-filter-value'); // FVB

        // remove legacy single box if still present
        document.getElementById('listing-filter-info')?.remove();

        // a11y + handlers: FVB behaves like the old button
        if (infoValue) {
          infoValue.setAttribute('role', 'button'); // act like a button
          infoValue.tabIndex = 0;

          const openFilter = () => {
            if (typeof filterBtn?.onclick === 'function') filterBtn.onclick(); // reuse handler
          };

          infoValue.addEventListener('click', openFilter);
          infoValue.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilter(); }
          });
        }

        // make sure the old visual button is not in the DOM
        if (filterBtn && filterBtn.parentElement) filterBtn.remove();
      }

      // enforce icon even if button came from HTML; idempotent
      {
        const _img = filterBtn.querySelector('img');
        if (_img) { _img.src = '/assets/icons-sliders.png'; _img.alt = ''; }
        else { filterBtn.innerHTML = '<img src="/assets/icons-sliders.png" alt="">' ;}
      }                      
    }

      // ✅ Build labels & open the button-less modal (no buttons; closes on select/ESC/backdrop)
      filterBtn.onclick = () => {
        const segs = String(ACTIVE_PAGE || '').split('/');   // safe: '' → []
        if (!segs[0]) return; // no context; ignore click

        const namespace = segs[0] || '';
        const brand     = (segs[1] || '').replace(/-/g,' ');
        const scope     = (segs.slice(2).join('/') || '').replace(/-/g,' ');

        const modeLabels = {
          structure:  t('view.settings.mode.structure'),
          adminArea:  t('view.settings.mode.adminArea'),
          city:       t('view.settings.mode.city'),
          postalCode: t('view.settings.mode.postalCode'),
          alpha:      t('view.settings.mode.alpha'),
          priority:   t('view.settings.mode.priority'),
          rating:     t('view.settings.mode.rating'),
          distance:   t('view.settings.mode.distance')
        };

        const base = (allowed.length ? allowed : ['structure','adminArea','city','postalCode','alpha','price','rating','distance']);
        const opts = base.map(normToken).filter(Boolean).map(k => ({ key: k, label: modeLabelByKey[k] || k }));

        // ✅ Compose final labels here to avoid literal {brand}/{scope}/{modeLabel}
        const modeLabelFinal = modeLabelByKey[defaultView] || defaultView; // keep: display text
        const cap = s => s.replace(/\b\w/g, c => c.toUpperCase());
        const ns = cap((namespace || '').replace(/-/g, ' '));
        const br = cap(brand);
        const sc = cap(scope);
        const contextLineFinal = [ns, br, sc].filter(Boolean).join(' › ');

        openViewSettingsModal({
          title:       t('view.settings.title'),
          contextLine: contextLineFinal,                           // no braces
          options:     opts,
          currentKey:  mode,
          resetLabel:  `Reset view to default (${modeLabelFinal})`, // no braces
          onPick: (key) => {
            if (key === '__RESET__') {
              localStorage.removeItem(storeKey);
              location.reload();
              return;
            }
            // Distance requires user location only; if no API, do nothing.
            if (String(key).toLowerCase() === 'distance') {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition(
                () => { localStorage.setItem(storeKey, 'distance'); location.reload(); },
                ()  => { /* denied/unavailable: do nothing */ },
                { maximumAge: 0, timeout: 10000, enableHighAccuracy: false }
              );
              return;
            }
            localStorage.setItem(storeKey, String(key).toLowerCase());
            location.reload();
          }
        });
      };
          
  // 📍 Inject Share Modal at startup
  createShareModal();            // Injects #share-location-modal into DOM
  setupTapOutClose("share-location-modal");  

  // 🔹 Set up tap-out-close behavior for all modals
  [
    "language-modal",
    "help-modal",
    "social-modal",
    "pinned-modal",
    "alert-modal"
  ].forEach(setupTapOutClose);

  // Get reference to the logo icon
  const logo = document.getElementById('logo-icon');

  // If the logo exists, add a click listener to reload the page when clicked
  if (logo) {
    logo.addEventListener('click', () => {
      location.reload();
    });
  }

  // PWA Install Behavior
  const headerPin  = document.querySelector('.header-pin');
  
  // PWA: set initial pin state early; BIP listener may refine later
  if (headerPin) {
    if (isStandalone()) {
      // standalone: support 👋 opens donation modal (no prompt override)
      headerPin.style.display = 'block';
      headerPin.textContent = '👋'; // show support in PWA
      headerPin.onclick = () => {
        try {
          const hasDonated = localStorage.getItem("hasDonated") === "true";
          createDonationModal(hasDonated); // existing modal factory
        } catch {
          showModal('donation-modal'); // fallback open
        }
      };
    } else {
      // browser tab: default to 📌; BIP listener will hook prompt on click
      headerPin.style.display = 'block';
      headerPin.textContent = '📌'; // install (replaced by BIP if available)
      headerPin.onclick = () => showModal('pinned-modal');
    }
  }
    
  const pinnedModal = document.getElementById('pinned-modal');

  // 2-line: module-scoped prompt holder; not on window
  let promptEvent = null;

  // 2-line: listen on globalThis (no globals created)
  globalThis.addEventListener('beforeinstallprompt', (e) => {
    if (isStandalone()) return;           // keep
    e.preventDefault();                   // keep
    promptEvent = e;                      // stays in module scope
    if (headerPin) headerPin.dataset.bip = '1'; // mark that BIP fired

    if (headerPin) {
      headerPin.style.display = 'block';
      headerPin.textContent = '📌';
      headerPin.onclick = () => {
        // 2-line: use stored event; no global vars
        promptEvent?.prompt();
        promptEvent?.userChoice.then(choice => {
          if (choice.outcome === 'accepted') setTimeout(() => location.reload(), 800);
        });
      };
    }
  });

  // 2-line: fallback if BIP never fires; reuse existing modal flow
  setTimeout(() => {
    if (!isStandalone() && headerPin && headerPin.dataset.bip !== '1') {
      headerPin.style.display = 'block';
      headerPin.textContent = '📌';
      headerPin.onclick = () => showModal('pinned-modal');
    }
  }, 3000);

    // ---------- Bottom band: ♿ 🤖 🏠 ⋮ ----------
    function initBottomBand() {
      const band = document.getElementById('bottom-band');
      if (!band) return;

      band.innerHTML = '';

      const makeBtn = (id, emoji, title) => {
        const btn = document.createElement('button');
        btn.id = id;
        btn.type = 'button';
        btn.textContent = emoji;
        if (title) btn.title = title;
        band.appendChild(btn);
        return btn;
      };

      // 1) ♿ Accessibility — keep existing toggle behavior via #accessibility-button wiring
      const accTitle = (typeof t === 'function' ? (t('tooltip.accessibility') || '') : '') || 'Accessibility';
      makeBtn('accessibility-button', '♿', accTitle);

      // 2) 🤖 AI Assistant — toast only
      const aiTitle = 'AI Assistant';
      const aiBtn = makeBtn('ai-assistant-button', '🤖', aiTitle);
      aiBtn.addEventListener('click', () => {
        showToast('AI assistant is coming soon');
      });

      // 3) 🏠 Home → open My Stuff
      const homeTitle = (typeof t === 'function' ? (t('tooltip.myStuff') || '') : '') || 'Home';
      makeBtn('home-button', '🏠', homeTitle);

      // 4) ⋮ Overflow
      const moreBtn = makeBtn('bottom-more-button', '⋮', 'More');
      // ensure ⋮ uses the tested grey squared style, independent of external CSS
      moreBtn.style.backgroundColor = '#e2e8f0';
      moreBtn.style.border = '1px solid #d6dbe1';
      moreBtn.style.borderRadius = '6px';
      moreBtn.style.height = '34px';
      moreBtn.style.width = '34px';
      moreBtn.style.padding = '0';

      // Build overflow bubble
      let bubble = document.getElementById('bottom-more-menu');
      if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = 'bottom-more-menu';
        document.body.appendChild(bubble);
      }
      bubble.innerHTML = '';

      const overflowDefs = [
        {
          id: 'nav-calendar',
          icon: '📅',
          title: 'Full program is coming soon',
          handler: () => showToast('Full program is coming soon')
        },
        {
          id: 'nav-alerts',
          icon: '📣',
          title: 'List of alerts are coming soon',
          handler: () => showToast('List of alerts is coming soon')
        },
        {
          id: 'nav-info',
          icon: 'ℹ️',
          title: 'My contact card is coming soon',
          handler: () => showToast('My contact card is coming soon')
        },
        {
          id: 'help-button',                  // reuse existing Help/Emergency wiring
          icon: '☎️',
          title: 'Call / Help',
          handler: () => {
            const help = document.getElementById('help-button');
            if (help) {
              help.click();
            } else {
              showToast('Help is coming soon');
            }
          }
        },
        {
          id: 'nav-stats',
          icon: '📈',
          title: 'My stats is coming soon',
          handler: () => showToast('My stats is coming soon')
        },
        {
          id: 'nav-here',
          icon: '🎯',
          title: 'Share my location',
          handler: () => {
            const here = document.getElementById('here-button');
            if (here) here.click();
            else showToast('Location share is coming soon');
          }
        }
      ];

      overflowDefs.forEach(def => {
        const b = document.createElement('button');
        b.id = def.id;
        b.type = 'button';
        b.textContent = def.icon;
        if (def.title) b.title = def.title;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          bubble.classList.remove('visible');
          def.handler();
        });
        bubble.appendChild(b);
      });

      const toggleBubble = () => {
        bubble.classList.toggle('visible');
      };

      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBubble();
      });

      document.addEventListener('click', () => bubble.classList.remove('visible'));
    }

    // Build bottom band once DOM is ready
    initBottomBand();

// Footer: Call/Help + Home
const helpButton = document.getElementById("help-button") || document.getElementById("call-button");
const helpModal   = document.getElementById("help-modal");
const homeButton  = document.getElementById("home-button");

// Button refs (no early modal refs: we create alert modal when needed)
const alertButton = document.getElementById("alert-button");

/* 🏠 Home: open My Stuff modal */
if (homeButton) {
  homeButton.addEventListener("click", () => {
    showMyStuffModal("menu");
  });
}

/* ☎️ Call/Help: open Help modal (emergency) */
if (helpButton) {
  helpButton.addEventListener("click", async () => {
    showModal("help-modal");
    try { await initEmergencyBlock(); } catch (e) { console.error("Emergency init failed:", e); }
  });
}

/* insert ⭐ and 🎁️ in the search row; resolve anchor locally (no cross-scope refs) */
(() => {
  const row = document.getElementById("search-container");
  if (!row || document.getElementById("fav-button")) return;

  const fav = document.createElement("button");
  fav.id = "fav-button";
  fav.type = "button";
  fav.textContent = "⭐"; // emoji-only, like 📌/🎯
  fav.title = t("favorites");
  fav.setAttribute("aria-label", t("favorites"));

  const here = document.getElementById("here-button");

  if (here) {
    row.insertBefore(fav, here); // place left of original 🎯
  } else if (row.firstElementChild) {
    row.insertBefore(fav, row.firstElementChild);
  } else {
    row.appendChild(fav);
  }

  const promo = document.createElement("button");
  promo.id = "promo-button";
  promo.type = "button";
  promo.textContent = "🎁";
  promo.title = t("promotions");
  promo.setAttribute("aria-label", t("promotions"));

  if (here && fav.nextSibling === here) {
    row.insertBefore(promo, here); // visible order: ⭐ 🎁️ (🎯 stays hidden)
  } else if (here) {
    row.insertBefore(promo, here);
  } else {
    row.appendChild(promo);
  }

  // Hide 🎯 from the main shell row but keep it usable for bottom-band "Share my location".
  if (here) {
    here.style.display = "none";
  }

  fav.addEventListener("click", () => {
    if (!document.getElementById("favorites-modal")) createFavoritesModal();
    showFavoritesModal();
  });

  promo.addEventListener("click", () => {
    if (!document.getElementById("promotions-modal")) createPromotionsModal();
    showPromotionsModal();
  });
})();

// Location modal refs (kept as-is for other features)
const locationModal = document.getElementById("share-location-modal");
const coordsDisplay = document.getElementById("share-location-coords");
const shareButton = document.getElementById("share-location-button");

// -- Alert modal wiring: build + open on click, then fetch + render alerts
if (alertButton) {
  alertButton.addEventListener("click", async () => {
    // 1) Ensure modal structure exists and is visible (createAlertModal should call showModal internally)
    createAlertModal();

    // 2) Query live elements AFTER injection
    const alertModal = document.getElementById("alert-modal");
    const alertModalContent = document.getElementById("alert-modal-content");
    if (!alertModal || !alertModalContent) return;

    // 3) Initial loading state
    alertModalContent.innerHTML = "<p>Loading...</p>";

    try {
      // 4) Fetch alerts fresh
      const res = await fetch("/data/alert.json", { cache:'no-store' }).catch(() => null);
      const alerts = res && res.ok ? await res.json() : [];

      if (!Array.isArray(alerts) || alerts.length === 0) {
        alertModalContent.innerHTML = "<p>No current alerts.</p>";
        setupTapOutClose("alert-modal"); // idempotent
        return;
      }

      // 5) Create scrollable list container
      const listWrapper = document.createElement("div");
      listWrapper.style.maxHeight = "300px";
      listWrapper.style.overflowY = "auto";

      // 6) Build cards for each alert
      alerts.forEach(alert => {
        const wrapper = document.createElement("div");
        wrapper.style.borderBottom = "1px solid #ccc";
        wrapper.style.padding = "1em 0";

        const message = alert?.message || "⚠️ No message";
        const msgEl = document.createElement("p");
        msgEl.textContent = message;
        msgEl.style.marginBottom = "0.5em";
        msgEl.style.textAlign = "center";
        wrapper.appendChild(msgEl);

        const actions = document.createElement("div");
        actions.className = "modal-actions";

        if (acknowledgedAlerts.has(message)) {
          const confirm = document.createElement("p");
          confirm.style.textAlign = "center";
          confirm.textContent = "✅ Alert seen";
          actions.appendChild(confirm);
        } else {
          const btn = document.createElement("button");
          btn.className = "modal-close";
          btn.textContent = "✅ Noted";
          btn.style.border = "1px solid #EACCB8";

          // Acknowledge → smooth UI swap to confirmation
          btn.onclick = () => {
            acknowledgedAlerts.add(message);

            if (summary) {
              summary.textContent = `Alerts: ${total} Seen: ${acknowledgedAlerts.size}`;
            }

            btn.style.transition = "opacity 0.5s";
            btn.style.opacity = "0";
            setTimeout(() => {
              actions.innerHTML = "";
              const confirm = document.createElement("p");
              confirm.style.textAlign = "center";
              confirm.textContent = "✅ Alert seen";
              actions.appendChild(confirm);
            }, 600);
          };

          actions.appendChild(btn);
        }

        wrapper.appendChild(actions);
        listWrapper.appendChild(wrapper);
      });

      // 7) Mount list + summary
      alertModalContent.innerHTML = "";
      alertModalContent.appendChild(listWrapper);

      const summary = document.createElement("div");
      summary.className = "alert-summary";

      const total = alerts.length;
      const seen = alerts.filter(a => acknowledgedAlerts.has(a.message)).length;
      summary.textContent = `Alerts: ${total} Seen: ${seen}`;
      alertModalContent.appendChild(summary);

    } catch {
      // 8) Error fallback
      alertModalContent.innerHTML = "<p>Error loading alerts.</p>";
    }

    // 9) Safety: enable tap-out/ESC close (idempotent)
    setupTapOutClose("alert-modal");
  });
}

  // ✅ Defer setup to ensure modal elements exist
  setTimeout(() => {
    const hereButton = document.getElementById("here-button");
    const coordsDisplay = document.getElementById("share-location-coords");
    const shareModal = document.getElementById("share-location-modal");

    if (hereButton && coordsDisplay && shareModal) {
      hereButton.addEventListener("click", () => {
        coordsDisplay.textContent = "Detecting your location...";
        const shareBtn = document.getElementById("share-location-button");
        if (shareBtn) shareBtn.classList.add("hidden");

        if (!navigator.geolocation) {
          coordsDisplay.textContent = "Geolocation not supported.";
          shareModal.classList.remove("hidden");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
            showShareModal(coords); // 💡 This updates modal + shows
          },
          () => {
            coordsDisplay.textContent = "Unable to access location.";
            showShareModal("Unable to detect location");
          }
        );
      });
    }
  }, 0);

  const helpContinueButton = helpModal?.querySelector(".modal-continue");
  const helpCloseButtons = document.querySelectorAll(".modal-close");

  if (helpContinueButton) {
    helpContinueButton.addEventListener("click", () => {
      const message = encodeURIComponent("🎧 Thank you for contacting SzigetSupport. Tap send to start conversation.");
      const waUrl = `https://wa.me/443030031300?text=${message}`;
      window.open(waUrl, "_blank");
    });
  }

  helpCloseButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal-content").forEach(modal => modal.parentElement.classList.add("hidden"));
    });
  });

  if (helpButton) {
    helpButton.addEventListener("click", async () => {
      // 🆘 Open the Help modal
      // (ensures #emg-buttons + other placeholders are in the DOM)
      showModal("help-modal");

      // 🌍 Populate localized emergency numbers dynamically
      // - fetches /data/emergency.json
      // - picks browser locale (fallback: en)
      // - detects/overrides country (CF-IPCountry or localStorage)
      // - renders tap-to-dial buttons inside the modal
      try {
        await initEmergencyBlock();
      } catch (e) {
        // 🚨 Fail gracefully (modal still opens even if numbers not injected)
        console.error("Emergency block init failed:", e);
      }
    });
  } // ← ensure this closing brace exists

  if (searchInput) {
    const languageButton = document.getElementById("language-button");
    const languageModal = document.getElementById("language-modal");

    if (languageButton && languageModal) {
      languageButton.addEventListener("click", () => {
        languageModal.classList.remove("hidden");
      });

      languageModal.addEventListener("click", (e) => {
        if (e.target.id === "language-modal") {
          languageModal.classList.add("hidden");
        }
      });
    }   
  }
  
  const accessibilityButton = document.getElementById("accessibility-button");
  if (accessibilityButton) {
    accessibilityButton.addEventListener("click", () => {
      document.body.classList.toggle("high-contrast");
      document.body.classList.toggle("large-text");
    });
  }
  
  // 🗂️ My Stuff Modal toggle button logic
  const myStuffToggle = document.getElementById("my-stuff-toggle");
  if (myStuffToggle) {
    myStuffToggle.addEventListener("click", () => {
      showMyStuffModal("menu"); // direct call, from import
    });
  }

  // ✅ Alert Tab Trigger (bottom band)
  const indicator = document.getElementById("alert-indicator");

  if (!indicator) {
    console.warn("🚫 #alert-indicator not found in DOM.");
  } else {
    indicator.addEventListener("click", async () => {
      console.log("✅ Alert indicator clicked");
      createAlertModal();

      requestAnimationFrame(async () => {
        const container = document.getElementById("alert-modal-content");
        if (!container) return;

        try {
          const res = await fetch("/data/alert.json", { cache:'no-store' });
          const alerts = await res.json();

          if (!Array.isArray(alerts) || alerts.length === 0) {
            container.innerHTML = "<p>No current alerts.</p>";
          } else {
            container.innerHTML = alerts.map(obj => `<p>${obj.message}</p>`).join("");
          }
        } catch (err) {
          container.innerHTML = "<p>⚠️ Failed to load alerts.</p>";
          console.error("Alert fetch error:", err);
        }
      });
    });
  }

  setupTapOutClose("share-location-modal");
  setupTapOutClose("my-stuff-modal");
  setupTapOutClose("alert-modal");
  setupTapOutClose("help-modal");

  /* Normalize any modals injected later: add 'modal' + tap-out once; don't re-hide if visible */
  new MutationObserver((mutList) => {
    mutList.forEach(m => m.addedNodes.forEach(node => {
      if (!(node instanceof HTMLElement)) return;
      if (!node.id || !node.id.endsWith("-modal")) return;
      node.classList.add("modal");
      // Only force hidden if not already being shown
      if (!node.classList.contains("hidden") && !node.classList.contains("visible")) {
        node.classList.add("hidden");
      }
      setupTapOutClose(node.id);
    }));
  }).observe(document.body, { childList: true });

});  // ✅ End of DOMContentLoaded  

document.addEventListener("DOMContentLoaded", () => {
  console.log("📡 DOM loaded — checking for ?at parameter");

  // ——— ?at flow ———
  const at = new URLSearchParams(location.search).get("at");
  if (at) {
    saveToLocationHistory(at); // store silently in local history

    const atSafe = encodeURIComponent(at.trim());
    const gmaps = `https://maps.google.com?q=${atSafe}`;
    console.log("🔗 Google Maps link:", gmaps);

    showToast(
      `open in <a class="toast-link" href="${gmaps}" target="_blank" rel="noopener">Google Maps</a><br><br>
       📌 to save NaviGen<br>
       🏠 → 📍 for this message<br>
       👋 to support NaviGen`,
      { title: '📍 Friend’s location received', manualCloseOnly: true, duration: 0 }
    );
  }

  // Drop only ?at after storing; preserve other params.
  {
    const q = new URLSearchParams(location.search);
    if (q.has("at")) {
      q.delete("at");
      const newUrl = location.pathname + (q.toString() ? `?${q}` : "") + location.hash;
      history.replaceState({}, document.title, newUrl);
    }
  }
});

  // ——— ?at flow — store and suggest map link ———
  const atRaw = new URLSearchParams(location.search).get("at");
  const at = (atRaw || "").trim();
  if (at) {
    saveToLocationHistory(at); // store silently in local history

    // sanitize for link; toast stays until closed
    const atSafe = encodeURIComponent(at);
    const gmaps = `https://maps.google.com/?q=${atSafe}`;
    console.log("🔗 Google Maps link:", gmaps);

    showToast(
      `open in <a class="toast-link" href="${gmaps}" target="_blank" rel="noopener">Google Maps</a><br><br>
       📌 to save NaviGen<br>
       🏠 → 📍 for this message<br>
       👋 to support NaviGen`,
      { title: '📍 Friend’s location received', manualCloseOnly: true, duration: 0 }
    );
  }

  // Drop ?at after storing; keep other params
  {
    const q = new URLSearchParams(location.search);
    if (q.has("at")) {
      q.delete("at");
      const next = location.pathname + (q.toString() ? `?${q}` : "") + location.hash;
      history.replaceState({}, document.title, next);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      [
        "language-modal",
        "help-modal",
        "social-modal",
        "pinned-modal",
        "share-location-modal",
        "donation-modal"
      ].forEach(id => {
        const modal = document.getElementById(id);
        if (modal && !modal.classList.contains("hidden")) {
          modal.classList.add("hidden");
        }
      });
    }
  });

  // Refresh lightweight UI after tab returns (frame → idle)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    requestAnimationFrame(() => {
      // Use rIC with a proper options object; fallback to setTimeout.
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          if (document.querySelector('.group-header-button[data-group]')) {
            paintAccordionColors(); // cheap: set CSS vars only
          }
        }, { timeout: 0 });
      } else {
        window.setTimeout(() => {
          if (document.querySelector('.group-header-button[data-group]')) {
            paintAccordionColors(); // cheap: set CSS vars only
          }
        }, 0);
      }
    });
  }, { passive: true });

  // Setup close for Alert Modal
  const alertCloseButtons = document.querySelectorAll('#alert-modal .modal-close');
  alertCloseButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('alert-modal')?.classList.add('hidden');
    });
  });

function trapFocus(modal) {
  const focusableSelectors = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
  const focusableEls = modal.querySelectorAll(focusableSelectors);
  if (!focusableEls.length) return;

  const first = focusableEls[0];
  const last = focusableEls[focusableEls.length - 1];

  modal.addEventListener("keydown", function(e) {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
}

// 📌 Show Pinned Modal (👋 Tap)
function showPinnedModal() {
  const hasDonated = localStorage.getItem("hasDonated") === "true";
  createDonationModal(hasDonated); // Modal wires buttons; Stripe is ready at DOM load
}

if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  const resetBtn = document.getElementById("dev-reset");
  if (resetBtn) {
    resetBtn.hidden = false;
    resetBtn.addEventListener("click", () => {
      localStorage.clear();
      location.reload();
    });
  }
}

// ✅ Phase 1: Stripe session handler + localStorage storer

// This should run on page load (in app.js or similar init script)
(async function handleStripeReturn() {
  const url = new URL(window.location.href);
  const sessionId = url.searchParams.get("sid");
  if (!sessionId) return;

  try {
    // 1. Call your backend to get Stripe session details
    const res = await fetch(`https://navigen-go.onrender.com/stripe/session?sid=${sessionId}`);
    if (!res.ok) throw new Error("Failed to fetch session");
    const data = await res.json();

    // 2. Match donation tier
    const tier = matchDonationTier(data.amount_total); // in cents
    if (!tier) return; // skip if amount is invalid

    // 3. Build purchase object
    const purchase = {
      session_id: sessionId,
      icon: "💖",
      label: tier.label,
      subtext: tier.subtext,
      amount: data.amount_total,
      currency: data.currency,
      timestamp: Date.now()
    };

    // 4. Store in localStorage (if not already there)
    const purchases = JSON.parse(localStorage.getItem("myPurchases") || "[]");
    if (!purchases.find(p => p.session_id === sessionId)) {
      purchases.push(purchase);
      localStorage.setItem("myPurchases", JSON.stringify(purchases));
      showThankYouToast();
    }

  } catch (err) {
    console.error("Stripe return handling failed:", err);
  }
})();

// Maps Stripe donation amounts (in cents) to a known tier.
// Returns i18n label + subtext keys and an emoji for display.
// Used to build purchase history entries from session data.
function matchDonationTier(amount) {
  switch (amount) {
    case 300:
      return {
        label: "donation.btn.coffee",
        subtext: "donation.btn.coffee.sub",
        emoji: "☕"
      };
    case 500:
      return {
        label: "donation.btn.keep",
        subtext: "donation.btn.keep.sub",
        emoji: "🎈"
      };
    case 1000:
      return {
        label: "donation.btn.fuel",
        subtext: "donation.btn.fuel.sub",
        emoji: "🚀"
      };
    default:
      return null;
  }
}

// Helper: Show the thank-you toast (delegates to UI module)
function showThankYouToast() { return showThankYouToastUI(); }
