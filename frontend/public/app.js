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
  openViewSettingsModal
} from './modal-injector.js';

// Force phones to forget old cache on new deploy; one-time per BUILD_ID. (Disabled: no redirect, no purge)
const BUILD_ID = '2025-08-30-03'; // disabled cache-buster
try { localStorage.setItem('BUILD_ID', BUILD_ID); } catch {}
// (No redirect; leave URL untouched)

// Helper: Match name/shortName OR tag keys (strip "tag."), case-insensitive; supports multi-word queries.
function matchesQueryByNameOrTag(loc, q) {
  const qStr = String(q || '').toLowerCase().trim();
  if (!qStr) return true;
  const tokens = qStr.split(/\s+/).filter(Boolean);
  const name = [
    (loc?.name && (loc.name.en || Object.values(loc.name)[0])) || '',
    (loc?.shortName && (loc.shortName.en || Object.values(loc.shortName)[0])) || ''
  ].join(' ').toLowerCase();
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
} from '/scripts/emergency-ui.js';

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
    const target = lang === DEFAULT ? (rest === "/" ? "/" : rest) : `/${lang}${rest === "/" ? "" : rest}`;
    qs.delete("lang");
    const query = qs.toString() ? `?${qs}` : "";
    const next = `${target}${query}${location.hash || ""}`;
    if (next !== location.pathname + location.search + location.hash) location.replace(next);
    return; // stop; navigation continues at new URL
  }

  // Decide from path (root → EN), persist immediately so i18n sees the right value
  const chosen = pathLang || DEFAULT;
  document.documentElement.lang = chosen;
  // Early RTL hint; i18n confirms later
  const RTL_EARLY = ['ar','he','fa','ur'];
  document.documentElement.dir = RTL_EARLY.includes(chosen) ? 'rtl' : 'ltr';
  
  try { localStorage.setItem("lang", chosen); } catch {}
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
  if (!hasPrefix) {
    const locked = "en";
    if (document.documentElement.lang !== locked) {
      document.documentElement.lang = locked;
      document.documentElement.dir = "ltr";
      try { localStorage.setItem("lang", locked); } catch {}
      await loadTranslations(locked);
      injectStaticTranslations();
      // notify DOMContentLoaded scope to refresh labels (no globals)
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

// ✅ Render ⭐ Popular group
function renderPopularGroup(list = geoPoints) {
  const container = document.querySelector("#locations");
  if (!container) {
    console.warn('⚠️ #locations not found; skipping Popular group');
    return;
  }

  const popular = list.filter(loc => loc.Priority === "Yes");
  if (popular.length === 0) return;

  const section = document.createElement("div");
  section.classList.add("accordion-section");

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("group-buttons", "hidden");

  const groupKey = "group.popular";
  const groupLabel = t(groupKey); // 🌐 Translated label

  const header = document.createElement("button");
  header.classList.add("group-header-button");
  header.innerHTML = `
    <span class="header-title">${groupLabel}</span>
    <span class="header-meta">( ${popular.length} )</span>
    <span class="header-arrow"></span>
  `;
  header.setAttribute("data-group", groupKey);
  header.style.backgroundColor = 'var(--group-color)';

  header.addEventListener("click", () => {
    const scroller = document.getElementById('locations-scroll');
    const wasOpen = header.classList.contains("open");
    const popularHeader = document.querySelector('.group-header-button[data-group="group.popular"]');

    // Target offset is Popular's position from top of scroller
    let targetOffset = 0;
    if (popularHeader && scroller) {
      const popTop = popularHeader.getBoundingClientRect().top;
      const scrollOffsetNow = scroller.scrollTop;
      targetOffset = popTop - header.getBoundingClientRect().top + scrollOffsetNow;
    }

    const { top: beforeTop } = header.getBoundingClientRect();

    // Close all groups
    document.querySelectorAll(".accordion-body").forEach(b => b.style.display = "none");
    document.querySelectorAll(".accordion-button, .group-header-button").forEach(b => b.classList.remove("open"));
    document.querySelectorAll(".group-buttons").forEach(b => b.classList.add("hidden"));

    // Open tapped one if closed
    if (!wasOpen) {
      buttonContainer.classList.remove("hidden");
      buttonContainer.style.display = "block";
      header.classList.add("open");
    }

    // Correct scroll jump inside #locations-scroll only
    if (scroller) {
      const { top: afterTop } = header.getBoundingClientRect();
      const delta = afterTop - beforeTop;
      if (Math.abs(delta) > 0) scroller.scrollTop += delta;
    }

    // Move clicked header to same spot Popular sits
    if (!wasOpen && scroller && targetOffset !== 0) {
      scroller.scrollTo({
        top: targetOffset,
        behavior: 'smooth'
      });
    }
  });

  section.appendChild(header);

  popular.forEach((loc) => {
    const btn = document.createElement("button");
    btn.classList.add("quick-button", "popular-button");
    btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
    btn.setAttribute("data-group", groupKey);
    btn.setAttribute("data-id", loc.ID);
    
    // Stamp searchable metadata on Popular buttons (2 lines max)
    const _tags = Array.isArray(loc?.tags) ? loc.tags : [];
    btn.setAttribute('data-name', btn.textContent);
    btn.setAttribute('data-short-name', String(loc["Short Name"] || ''));
    btn.setAttribute('data-tags', _tags.map(k => String(k).replace(/^tag\./,'')).join(' '));
    
    // Searchable address tokens (city/admin/postal/address → normalized)
    const c = (loc && loc.contact) || {};
    const addrBits = [c.city, c.adminArea, c.postalCode, c.countryCode, c.address].filter(Boolean).join(' ');

    const addrNorm = addrBits.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    btn.setAttribute('data-addr', addrNorm);        
        
    // ✅ Inject GPS data if available from "Coordinate Compound" (kept; clarified title)
    let lat = "", lng = "";
    if (typeof loc["Coordinate Compound"] === "string" && loc["Coordinate Compound"].includes(",")) {
      [lat, lng] = loc["Coordinate Compound"].split(',').map(x => x.trim());
      btn.setAttribute("data-lat", lat);
      btn.setAttribute("data-lng", lng);
      btn.title = `Open profile / Route (${lat}, ${lng})`;
    }

    // ✅ Always attach click so modal opens even without coords
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // build gallery from loc.media.images; pick cover
      const media   = (loc && loc.media) ? loc.media : {};
      const gallery = Array.isArray(media.images) ? media.images : [];
      const images  = gallery.map(m => (m && typeof m === 'object') ? m.src : m).filter(Boolean);
      const cover   = (media.cover && String(media.cover).trim()) ? media.cover : (images[0] || '/assets/logo-icon.svg');

      // Pass descriptions + tags so LPM can show the tag chip and text
      showLocationProfileModal({
        id: btn.getAttribute('data-id'),
        name: btn.textContent,
        lat, lng, // may be ""
        imageSrc: cover,
        images,
        media,
        descriptions: (loc && typeof loc.descriptions === 'object') ? loc.descriptions : {},
        tags: Array.isArray(loc?.tags) ? loc.tags : [],
        originEl: btn
      });
    });

    // ⬅ close the if-block before append
    buttonContainer.appendChild(btn);
  });

  section.appendChild(buttonContainer);
  container.prepend(section);
}

function navigate(name, lat, lon) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  window.open(url, '_blank');
}

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

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "modal-actions";

  action.buttons.forEach(b => {
    const bEl = document.createElement("button");
    bEl.className = "modal-action-button";
    bEl.textContent = b.status ? `${b.label} (${b.status})` : b.label;
    // You can add logic here for what each does
    bEl.onclick = () => alert(`TODO: handle "${b.label}"`);
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

    // Apply flat 1px tinted border to group children, no background styling
    sibling.querySelectorAll('button').forEach(locBtn => {
      // keep styling
      locBtn.classList.add('quick-button', 'location-button');
      locBtn.style.border = '1px solid var(--group-color-ink)';
      locBtn.style.backgroundColor = 'transparent';

      // keep label wrap
      if (!locBtn.querySelector('.location-name')) {
        const label = locBtn.textContent.trim();
        locBtn.innerHTML = `<span class="location-name">${label}</span>`;
      }

      // ensure searchable metadata for regular + tag search
      if (!locBtn.hasAttribute('data-name')) {
        locBtn.setAttribute('data-name', locBtn.textContent.trim());
      }
      if (!locBtn.hasAttribute('data-short-name')) {
        locBtn.setAttribute('data-short-name', locBtn.textContent.trim());
      }
      if (!locBtn.hasAttribute('data-tags')) {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.ID || x?.id) === String(id))
          : null;
        const tags = Array.isArray(rec?.tags)
          ? rec.tags.map(k => String(k).replace(/^tag\./,'')).join(' ')
          : '';
        locBtn.setAttribute('data-tags', tags);
      }

      // ✅ Always set/refresh address tokens (now includes CountryCode)
      {
        const id = locBtn.getAttribute('data-id');
        const rec = Array.isArray(injectedGeoPoints)
          ? injectedGeoPoints.find(x => String(x?.ID || x?.id) === String(id))
          : null;
        const c = (rec && rec.contact) || {};
        const addrBits = [c.city, c.adminArea, c.postalCode, c.countryCode, c.address].filter(Boolean).join(' ');
        const addrNorm = addrBits.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        locBtn.setAttribute('data-addr', addrNorm);
      }

    });
  });
}

// Name + tag search; supports multi-word queries (no cross-scope fetch)
function filterLocations(q) {
  // include Popular's buttons too
  var itemSel = '.location-button, .popular-button, .location-item, [data-role="location-item"]';

  var query = (q || '').toString().trim().toLowerCase();

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

  // --- 1) Item-level filtering (names + tags + inline text) ---
  const items = document.querySelectorAll(itemSel);
  items.forEach((el) => {
    const lower = el.dataset.lower || '';
    const shortName = (el.getAttribute('data-short-name') || '').toLowerCase();
    const tags = (el.getAttribute('data-tags') || '').toLowerCase();
    const addr = (el.getAttribute('data-addr') || '').toLowerCase(); // address tokens
    const hay = `${lower} ${shortName} ${tags} ${addr}`;

    const show = hay.includes(query);
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

    // Load JSONs (profiles.json now carries locations)
    const [actions, structure, profile, contexts] = await Promise.all([
      fetch('/data/actions.json').then(r => r.json()),
      fetch('/data/structure.json').then(r => r.json()),
      fetch('/data/profiles.json').then(r => r.json()),
      fetch('/data/contexts.json').then(r => r.json()) // NEW
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
    let geoPointsData = (Array.isArray(profile?.locations) ? profile.locations : []).map(p => {
      // i18n text → string
      const pickText = (v) => (typeof v === 'string' ? v : (v && typeof v === 'object' ? (v[lang] || v.en || Object.values(v).find(x => typeof x === 'string') || '') : ''));

      // numeric coords (supports p.coord.lat/lng)
      const lat = pickNum(p.lat, p.latitude, p.coord?.lat, p.coords?.lat, p.coordinates?.lat);
      const lon = pickNum(p.lon, p.longitude, p.coord?.lng, p.coord?.lon, p.coords?.lng, p.coords?.lon, p.coordinates?.lng, p.coordinates?.lon);

      // coord compound
      const coordCompound = (typeof p["Coordinate Compound"] === "string" && p["Coordinate Compound"].includes(","))
        ? p["Coordinate Compound"].trim()
        : (Number.isFinite(lat) && Number.isFinite(lon) ? `${lat},${lon}` : "");

      // group → always resolve to a key using structure_data
      const groupLabelOrKey = String(p.groupKey ?? p.Group ?? "").trim();
      const hit = structure_data.find(s => s["Drop-down"] === groupLabelOrKey || s.Group === groupLabelOrKey);
      const groupKey = hit ? hit.Group : (groupLabelOrKey.startsWith("group.") ? groupLabelOrKey : "group.uncategorized");

      // subgroup: take as-is (key); mirror into both fields
      const subkey = String(p.subgroupKey ?? p["Subgroup key"] ?? "").trim();

      const nameText  = pickText(p.Name ?? p.name) || 'Unnamed';
      const shortText = pickText(p["Short Name"] ?? p.shortName ?? p.alias) || nameText;

      return {
        ...p,                                         // keep originals
        ID: p.ID ?? p.id ?? p._id ?? cryptoIdFallback(),
        Name: nameText,
        "Short Name": shortText,
        Group: groupKey,
        groupKey: groupKey,

        "Subgroup key": subkey,
        subgroupKey: subkey,
        "Coordinate Compound": coordCompound,
        Context: Array.isArray(p.Context) ? p.Context.join(";")
                : Array.isArray(p.context) ? p.context.join(";")
                : (typeof p.Context === "string" ? p.Context : (typeof p.context === "string" ? p.context : "")),
        Visible: (p.Visible ?? p.visible ?? "Yes"),
        Priority: (p.Priority ?? p.priority ?? "No")
      };
    });

    geoPoints = geoPointsData;

    console.log("✅ geoPoints count:", geoPoints.length);
    console.log("Sample record:", geoPoints[0]);

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
    geoPoints = geoPointsData;

    // tiny id fallback; keeps existing comments
    function cryptoIdFallback() {
      return `loc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // ✅ Adapt grouped -> flat shape expected by your UI headers (for title/styling)
    structure_data = structure.map(g => ({
      "Group": g.groupKey,
      "Drop-down": g.groupName
    }));

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
          const subs = [...new Set(locs.map(l => (l.contact?.adminArea || '-')))]
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
     * 3) Normalize geoPoints.Group from display names → group keys
     *    so filtering uses keys like "group.gates" instead of "🚪 Exit / Entry Gates".
     */
    geoPoints.forEach(p => {
      const entry = structure_data.find(g => g["Drop-down"] === p.Group);
      if (entry) p.Group = entry.Group;
    });

    /**
     * 4) Subgroup sanity check (warn if locations use unknown sub keys)
     */
    const subgroupIndex = Object.fromEntries(
      groupedStructure.flatMap(g => g.subgroups.map(s => [s.key, s.name]))
    );
    const badSubs = geoPoints.filter(p => p["Subgroup key"] && !subgroupIndex[p["Subgroup key"]]);
    if (badSubs.length) {
      console.warn("⚠️ Unknown Subgroup key(s) in locations:", badSubs.map(b => ({
        id: b.ID, name: b.Name, subgroup: b["Subgroup key"]
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

    const geoCtx = ACTIVE_PAGE
      ? geoPoints.filter(loc =>
          loc.Visible === 'Yes' &&
          String(loc.Context || '')
            .split(';')
            .map(s => s.trim().toLowerCase())
            .includes(ACTIVE_PAGE)
        )
      : geoPoints;
      
    // QA: print active page + filtered count + sample names (remove after test)
    console.debug(
      '[QA]', 'ACTIVE_PAGE=', ACTIVE_PAGE,
      'count=', geoCtx.length,
      'sample=', geoCtx.slice(0,5).map(l => String(l.shortName ?? l.name ?? ''))
    );    
          
    /**
     * 5) Render: grouped → DOM (buildAccordion), flat → header styling (wireAccordionGroups)
     */
    renderPopularGroup(geoCtx);    

    // ✅ Allowed modes & default from contexts.json; override with last choice (i18n-aware, legacy-safe)
    const ctxRow = Array.isArray(contexts) ? contexts.find(c => c.pageKey === ACTIVE_PAGE) : null;

    // i18n labels for the current lang (keys → labels)
    const modeLabelByKey = {
      structure:  t('view.settings.mode.structure'),
      adminArea:  t('view.settings.mode.adminArea'),
      city:       t('view.settings.mode.city'),
      postalCode: t('view.settings.mode.postalCode'),
      alpha:      t('view.settings.mode.alpha'),
      priority:   t('view.settings.mode.priority'),
      distance:   t('view.settings.mode.distance')
    };
    // labels (lowercased) → canonical keys
    const labelToKey = Object.fromEntries(
      Object.entries(modeLabelByKey).map(([k, v]) => [String(v || '').toLowerCase(), k])
    );
    // canonical key list (case as used in i18n lookups)
    const CANON = ['structure', 'adminArea', 'city', 'postalCode', 'alpha', 'priority', 'distance'];

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

    // default view (canonical key + lower-case variant)
    const defaultView = normToken(ctxRow?.defaultView || ctxRow?.subgroupMode || 'structure') || 'structure';
    const defaultViewLC = defaultView.toLowerCase();

    // stored choice (normalized)
    const storeKey = `navigen:view:${ACTIVE_PAGE}`;
    const storedLC = normToken(localStorage.getItem(storeKey) || '').toLowerCase();

    // pick initial mode (stored beats default; compare in lower-case)
    let mode = allowedLC.includes(storedLC) ? storedLC : defaultViewLC;

    // expose for wiring (builders read this attribute)
    document.documentElement.setAttribute('data-subgroup-mode', mode);

    // ✅ Gear opens button-less modal; selection persists per page; no centroid fallback
    (function wireViewGear(){
      const gear = document.getElementById('view-gear');
      if (!gear) return;

      // Build menu from allowed list; if distance is present but geolocation missing, hidden by modal helper
      const opts = (allowed.length ? allowed : ['structure','adminArea','city','postalCode','az','priority','distance']);

      gear.onclick = () => {
        const segs = ACTIVE_PAGE.split('/');
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
          const subs = [...new Set(locs.map(r => fieldFn(r)))]
            .sort((a,b)=>String(a||'').localeCompare(String(b||'')))
            .map(val => ({ key: `dyn.${slugify(val)}`, name: label(val) }));
          return { groupKey, groupName: g.groupName || g["Drop-down"] || groupKey, subgroups: subs };
        });
    };

    // Per-mode: subgroupKey remap (in memory) and structure builder
    const pageList = geoCtx.map(rec => ({ ...rec })); // shallow clone
    const modeMap = {
      structure: () => ({ list: pageList, grouped: structure }),
      adminarea: () => {
        pageList.forEach(r => { const k = r?.contact?.adminArea; const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => r?.contact?.adminArea) };
      },
      city: () => {
        pageList.forEach(r => { const k = r?.contact?.city; const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => r?.contact?.city) };
      },
      postalcode: () => {
        pageList.forEach(r => { const k = r?.contact?.postalCode; const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => r?.contact?.postalCode) };
      },
      az: () => {
        pageList.forEach(r => { const n = String(r?.shortName?.en || r?.name?.en || r?.name || '').trim(); const k = n ? n[0].toUpperCase() : '#';
          const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => {
          const n = String(r?.shortName?.en || r?.name?.en || r?.name || '').trim(); return n ? n[0].toUpperCase() : '#';
        })};
      },
      priority: () => {
        pageList.forEach(r => { const k = (String(r?.Priority||'No').toLowerCase()==='yes') ? 'Featured' : 'Other';
          const dyn = `dyn.${slugify(k)}`; r.subgroupKey = dyn; r["Subgroup key"] = dyn; });
        return { list: pageList, grouped: buildStructureBy(pageList, r => (String(r?.Priority||'No').toLowerCase()==='yes') ? 'Featured' : 'Other') };
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

    /**
     * 🌐 Applies static UI translations to the main page elements.
     * This includes headings, placeholders, button labels, and tooltips
     * that are part of the base HTML and not dynamically injected modals.
     * 
     * Call this after translations are loaded, and again if language changes.
     */
    function injectStaticTranslations() {
      // Main UI text
      document.getElementById("page-title").textContent = t("page.title");
      document.querySelector(".page-subtext").textContent = t("page.tagline");
      document.getElementById("search").placeholder = t("search.placeholder");
      document.getElementById("here-button").textContent = t("button.here");

      // 🌐 Set translated <title>
      document.title = t("page.windowTitle");

      // 🌐 Set translated <meta name="description">
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", t("page.metaDescription"));
      }

      // Footer button tooltips
      document.getElementById("my-stuff-toggle").title = t("tooltip.myStuff");
      document.getElementById("alert-button").title = t("tooltip.alerts");
      document.getElementById("help-button").title = t("tooltip.service");
      document.getElementById("accessibility-button").title = t("tooltip.accessibility");
    }
          
      // Inside your existing main DOMContentLoaded block
      // use outer lets; avoid shadowing so later blocks see the same refs
      searchInput = document.getElementById('search');
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
      
      // ✅ Insert gear between Search and the Here button (same row)
      let gearBtn = document.getElementById('view-gear');
      if (!gearBtn) {
        gearBtn = document.createElement('button');
        gearBtn.id = 'view-gear';
        gearBtn.type = 'button';
        gearBtn.title = t('view.settings.title');          // localized tooltip
        gearBtn.textContent = '⚙️';
        // place it immediately after the input; the existing "Here" button stays after it
        searchInput.insertAdjacentElement('afterend', gearBtn);
      }

      // ✅ Build labels & open the button-less modal (no buttons; closes on select/ESC/backdrop)
      gearBtn.onclick = () => {
        const segs = ACTIVE_PAGE.split('/');                 // ["language-schools","helen-doron","hungary"]
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
          distance:   t('view.settings.mode.distance')
        };

        const base = (allowed.length ? allowed : ['structure','adminArea','city','postalCode','alpha','priority','distance']);
        const opts = base.map(normToken).filter(Boolean).map(k => ({ key: k, label: modeLabelByKey[k] || k }));

        // ✅ Compose final labels here to avoid literal {brand}/{scope}/{modeLabel}
        const modeLabelFinal   = modeLabelByKey[defaultView] || defaultView; // keep: map to display text
        const contextLineFinal = (namespace === 'language-schools')
          ? `🏫 Language Schools › ${brand}${scope ? ' › ' + scope : ''}`    // keep: brand/scope path
          : `${namespace} › ${brand}${scope ? ' › ' + scope : ''}`;

        openViewSettingsModal({
          title:       t('view.settings.title'),
          contextLine: contextLineFinal,                           // no braces
          note:        t('view.settings.note'),
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
  const headerPin = document.querySelector('.header-pin');
  const pinnedModal = document.getElementById('pinned-modal');

  // 🧭 Handle OS install prompt when available (only if not already running as standalone)
  window.addEventListener('beforeinstallprompt', (e) => {
    if (isStandalone()) return; // Skip if already installed as PWA

    e.preventDefault(); // prevent default mini-infobar
    deferredPrompt = e;

    if (headerPin) {
      headerPin.style.display = 'block';
      headerPin.textContent = '📌';

      headerPin.onclick = () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
          if (choiceResult.outcome === 'accepted') {
            // Reload to trigger standalone mode after installation
            setTimeout(() => location.reload(), 800);
          }
        });
      };
    }
  });

  // 👋 Show 👋 button only when running in PWA standalone mode
  if (isStandalone() && headerPin) {
    headerPin.style.display = 'block';
    headerPin.textContent = '👋';

    // 👋 Handle tap: always show donation modal unless already donated
    headerPin.onclick = () => {
      const hasDonated = localStorage.getItem("hasDonated") === "true";

      console.log("👋 TAP donation prompt opened", { hasDonated });

      // 🧭 Log whether we show thank-you or donation modal
      if (hasDonated) {
        console.log("🎉 Already donated → Showing thank-you modal");
        createDonationModal(true);  // ✅ no ensureStripeReady
      } else {
        console.log("💸 Showing donation modal for potential supporter");
        createDonationModal(false); // ✅ no ensureStripeReady
      }

      // 📊 Optional: Send event to analytics
      // trackEvent("donationPromptOpened", { hasDonated });
    };
  }

// Remaining modals & buttons… (smart: alert modal is now injected on demand; we create+open it before loading data)
const helpButton = document.getElementById("help-button");
const helpModal = document.getElementById("help-modal");

// Button refs (no early modal refs: we create alert modal when needed)
const alertButton = document.getElementById("alert-button");

const socialButton = document.getElementById("social-button");
const hereButton = document.getElementById("here-button");

// Location modal refs (kept as-is for other features)
const locationModal = document.getElementById("share-location-modal");
const coordsDisplay = document.getElementById("location-coords");
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
      const res = await fetch("/data/alert.json", { cache: "no-store" });
      const alerts = await res.json();

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

  if (socialButton) {
    socialButton.addEventListener("click", () => {
      openModal("social-modal");
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
          const res = await fetch("/data/alerts.json");
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
  console.log("📡 DOM loaded — checking for ?school / ?at parameters");

  // ——— 1) Open LPM when ?school=<id> is present ———
  {
    const q = new URLSearchParams(location.search);
    const uid = (q.get("school") || "").trim();

    if (uid && Array.isArray(geoPoints) && geoPoints.length) {
      const rec = geoPoints.find(x => String(x?.ID || x?.id) === uid);

      if (rec) {
        // media cover
        const media   = rec.media || {};
        const gallery = Array.isArray(media.images) ? media.images : [];
        const images  = gallery.map(m => (m && typeof m === "object") ? m.src : m).filter(Boolean);
        const cover   = (media.cover && String(media.cover).trim())
          ? media.cover
          : (images[0] || "/assets/placeholder-images/icon-512-green.png");

        // coords
        let lat = "", lng = "";
        if (typeof rec["Coordinate Compound"] === "string" && rec["Coordinate Compound"].includes(",")) {
          [lat, lng] = rec["Coordinate Compound"].split(",").map(s => s.trim());
        }

        // open the profile modal
        showLocationProfileModal({
          id: String(rec.ID || rec.id || uid),
          name: rec["Short Name"] || rec.Name || "Unnamed",
          lat, lng,
          imageSrc: cover,
          images,
          media,
          descriptions: (rec && typeof rec.descriptions === "object") ? rec.descriptions : {},
          tags: Array.isArray(rec?.tags) ? rec.tags : [],
          originEl: null
        });
      }

      // drop ?school, keep other params (e.g., ?lang, ?at)
      q.delete("school");
      const next = location.pathname + (q.toString() ? `?${q}` : "") + location.hash;
      history.replaceState({}, document.title, next);
    }
  }

  // ——— 2) Existing ?at flow (unchanged) ———
  const at = new URLSearchParams(location.search).get("at");
  if (at) {
    saveToLocationHistory(at); // 🧠 Store silently in local history

    // sanitize param for the link; keep content persistent
    // manual close only via × (no auto/tap close)
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

  // Keep ?lang; only drop ?at after storing it.
  {
    const q = new URLSearchParams(location.search);
    if (q.has("at")) {
      q.delete("at");
      const newUrl = location.pathname + (q.toString() ? `?${q}` : "") + location.hash;
      history.replaceState({}, document.title, newUrl);
    }
  }
});

// open a school profile when ?school=<uid> is present
{
  const q = new URLSearchParams(location.search);
  const uid = q.get("school");
  if (uid) {
    // find by ID/alias among already-normalized geoPoints (built above)
    const hit = Array.isArray(geoPoints)
      ? geoPoints.find(x => String(x?.ID || x?.id) === String(uid))
      : null;

    if (hit) {
      // basic cover/media like Popular buttons do
      const media   = hit.media || {};
      const gallery = Array.isArray(media.images) ? media.images : [];
      const images  = gallery.map(m => (m && typeof m === 'object') ? m.src : m).filter(Boolean);
      const cover   = (media.cover && String(media.cover).trim())
        ? media.cover
        : (images[0] || '/assets/placeholder-images/icon-512-green.png');

      showLocationProfileModal({
        id: String(hit.ID || hit.id || uid),
        name: hit["Short Name"] || hit.Name || "Unnamed",
        lat: (hit["Coordinate Compound"]||"").split(',')[0] || "",
        lng: (hit["Coordinate Compound"]||"").split(',')[1] || "",
        imageSrc: cover,
        images,
        media,
        descriptions: (hit && typeof hit.descriptions === 'object') ? hit.descriptions : {},
        tags: Array.isArray(hit?.tags) ? hit.tags : []
      });
    }

    // keep ?lang etc; drop ?school from the URL bar
    q.delete("school");
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
