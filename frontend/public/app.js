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
  showLocationProfileModal
} from './modal-injector.js';

// 🌍 Emergency data + localization helpers
// Served as a static ES module from /public/scripts
import {
  loadEmergencyData,
  pickLocale,
  getLabelsFor,
  getNumbersFor
} from '/scripts/emergency-ui.js';

import { loadTranslations, t } from "./scripts/i18n.js";

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

    // ✅ Inject GPS data if available from "Coordinate Compound"
    if (typeof loc["Coordinate Compound"] === "string" && loc["Coordinate Compound"].includes(",")) {
      const [lat, lng] = loc["Coordinate Compound"].split(',').map(x => x.trim());
      btn.setAttribute("data-lat", lat);
      btn.setAttribute("data-lng", lng);
      btn.title = `Open profile / Route (${lat}, ${lng})`;

      // ✅ Click to open LPM (was: bare e.preventDefault(); + Maps)
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // build gallery from loc.media.images; pick cover
        const media   = (loc && loc.media) ? loc.media : {};
        const gallery = Array.isArray(media.images) ? media.images : [];
        const images  = gallery.map(m => (m && typeof m === 'object') ? m.src : m).filter(Boolean);
        const cover   = (media.cover && String(media.cover).trim()) ? media.cover : (images[0] || '/assets/logo-icon.svg');

        showLocationProfileModal({
          id: btn.getAttribute('data-id'),
          name: btn.textContent,
          lat, lng,
          imageSrc: cover,   // first paint
          images,            // slider sources
          media,             // lets slider honor the default image flag
          // lead: pass descriptions map as-is; never pass a scalar; log when empty for visibility
          // lead: always pass a descriptions map; log when it is empty for debugging
          descriptions: (loc && typeof loc.descriptions === 'object') ? loc.descriptions : {},

          originEl: btn
        });

      });
    }

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
  'group.popular':        0,   // brownish sand
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
  'group.spots':          11,  // pink-violet
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

function wireAccordionGroups(structure_data) {
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
      locBtn.classList.add('quick-button', 'location-button');
      locBtn.style.border = '1px solid var(--group-color-ink)';
      locBtn.style.backgroundColor = 'transparent';

      if (!locBtn.querySelector('.location-name')) {
        const label = locBtn.textContent.trim();
        locBtn.innerHTML = `<span class="location-name">${label}</span>`;
      }
    });

  });
}

function filterLocations() {
  const query = document.getElementById("search").value.toLowerCase();

  document.querySelectorAll('.accordion-section').forEach(section => {
    const buttons = section.querySelectorAll('.quick-button');
    let anyMatch = false;

    buttons.forEach(btn => {
      const match = btn.textContent.toLowerCase().includes(query);
      btn.style.display = match ? '' : 'none';
      if (match) anyMatch = true;
    });

    section.style.display = anyMatch ? '' : 'none';
  });

  document.querySelectorAll('.quick-button.popular-button').forEach(btn => {
    btn.style.display = btn.textContent.toLowerCase().includes(query) ? '' : 'none';
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

  // 3) Country code (override → saved → CF → default)
  const cc = (countryOverride || localStorage.getItem('emg.country') || window.__CF_COUNTRY__ || 'US').toUpperCase();

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

  // 7) Country dropdown (show names, keep values as ISO codes)
  if (countrySel) {
    if (countrySel.options.length === 0) {
      const codes = Object.keys(data.countries || {})
        .sort((a, b) => toName(a).localeCompare(toName(b)));
      countrySel.innerHTML = codes
        .map(code => `<option value="${code}" ${code === cc ? 'selected' : ''}>${toName(code)}</option>`)
        .join('');
    } else {
      // Ensure selected reflects current cc
      if (countrySel.value !== cc) countrySel.value = cc;
      // If current cc not in options, add it (edge-case)
      if (![...countrySel.options].some(o => o.value === cc)) {
        const opt = document.createElement('option');
        opt.value = cc; opt.textContent = toName(cc);
        countrySel.appendChild(opt);
        countrySel.value = cc;
      }
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

    // 🚀 Initialize Stripe on load
    showStripeLoader();

    try {
      initStripe(STRIPE_PUBLIC_KEY);
    } catch (err) {
      console.error("❌ initStripe failed:", err);
    } finally {
      hideStripeLoader();
    }

    // 🌐 Detect and apply user's preferred language (from localStorage or browser),
    // then set <html lang="...">, text direction (LTR/RTL), load translations,
    // and inject static UI text content
    const lang = localStorage.getItem("lang") || navigator.language.slice(0, 2).toLowerCase() || "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = ["ar", "he", "fa", "ur", "ps", "ckb", "dv", "syc", "yi"].includes(lang) ? "rtl" : "ltr";

    await loadTranslations(lang);        // ✅ Load selected language
    injectStaticTranslations();          // ✅ Apply static translations

    createMyStuffModal();                // 🎛️ Inject the "My Stuff" modal
    
    createHelpModal();                   // 🆘 Inject the Help / Emergency modal

    setupMyStuffModalLogic();           // 🧩 Setup tab handling inside modal
    flagStyler();                       // 🌐 Apply title/alt to any flag icons

    // Load JSONs (profiles.json now carries locations)
    // lead: normalize profile.locations to legacy geoPoints shape used by UI
    const [actions, structure, profile] = await Promise.all([
      fetch('data/actions.json').then(r => r.json()),
      fetch('data/structure.json').then(r => r.json()),   // grouped shape (has .groupKey, .groupName, .subgroups[])
      fetch('data/profiles.json').then(r => r.json())
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

    // 👇 expose to console (DEV ONLY). Safe to remove later.
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      window._rawStructure = structure;
      window._geo = geoPoints;
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
    
    // ——— Context filter ———
    const ACTIVE_CONTEXT = new URLSearchParams(location.search).get('ctx') || null;
    const geoCtx = ACTIVE_CONTEXT
      ? geoPoints.filter(loc =>
          loc.Visible === 'Yes' &&
          String(loc.Context || '')
            .split(';')
            .map(s => s.trim())
            .includes(ACTIVE_CONTEXT)
        )
      : geoPoints;        

    /**
     * 5) Render: grouped → DOM (buildAccordion), flat → header styling (wireAccordionGroups)
     */
    renderPopularGroup(geoCtx);
    buildAccordion(groupedStructure, geoCtx);    // <-- pass the grouped array directly
    wireAccordionGroups(structure_data);
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
      const searchInput = document.getElementById('search');
      const clearBtn = document.getElementById('clear-search'); // ✅ Added this line

      if (searchInput && clearBtn) {
        searchInput.addEventListener('input', () => {
          const hasText = searchInput.value.trim() !== '';
          clearBtn.style.display = hasText ? 'inline' : 'none';
          filterLocations();
        });

        clearBtn.addEventListener('click', () => {
          clearSearch();
          searchInput.focus();
        });

        clearBtn.style.display = 'none'; // Hide by default
      }

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
        createDonationModal(true);
      } else {
        console.log("💸 Showing donation modal for potential supporter");
        createDonationModal(false);
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

    searchInput.addEventListener('input', () => {
      filterLocations();
      clearBtn.style.display = searchInput.value.trim() ? 'inline' : 'none';
    });
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

// 💬 Toast shown after successful Stripe donation
window.showThankYouToast = function () {
  const div = document.createElement('div');
  div.textContent = "💖 Thank you for your support!";
  Object.assign(div.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#222',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    zIndex: 9999,
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
  });
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
};

document.addEventListener("DOMContentLoaded", () => {
  console.log("📡 DOM loaded — checking for ?at parameter");

  const at = new URLSearchParams(location.search).get("at");

  if (at) {

    saveToLocationHistory(at); // 🧠 Store silently in local history

    const gmaps = `https://maps.google.com?q=${at}`;
    console.log("🔗 Google Maps link:", gmaps);

    showToast(
      `📍 Friend’s location received — <a href="${gmaps}" target="_blank">open in Google Maps</a><br><br>
       📌 to save NaviGen<br>
       🏠 → 📍 for this message<br>
       👋 to support NaviGen<br><br>
       <span class="subtext">Tap this message to close.</span>`
      // no duration → persistent
    );

  } 

  // Optional: also log when history is cleared from URL
  window.history.replaceState({}, document.title, window.location.pathname);
});

  const socialModal = document.getElementById("social-modal");
  const socialButton = document.getElementById("social-button");
  const socialCloseButtons = socialModal?.querySelectorAll(".modal-close") || [];

  if (socialButton && socialModal) {
    socialButton.addEventListener("click", () => {
      socialModal.classList.remove("hidden");
    });

    socialCloseButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        socialModal.classList.add("hidden");
      });
    });
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
  createDonationModal(hasDonated); // Always show donation modal
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".donate-btn");
  if (!btn) return;

  const amount = parseInt(btn.dataset.amount);  // ✅ Must be defined
  try {
    await handleDonation(amount);               // ✅ Await the async call
  } catch (err) {
    console.error("Donation error:", err);
  }
});

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

// Helper: Show the thank-you toast
function showThankYouToast() {
  const toast = document.createElement("div");
  toast.textContent = "💖 Thank you for your support!";
  toast.style = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#fff;border-radius:8px;padding:10px 20px;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:9999;";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}