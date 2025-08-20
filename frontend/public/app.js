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
        showLocationProfileModal({
          id: btn.getAttribute('data-id'),
          name: btn.textContent,
          lat, lng,
          imageSrc: '/assets/logo-icon.svg',
          description: '',
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
  modal.className = "custom-modal";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.onclick = () => modal.remove();

  const box = document.createElement("div");
  box.className = "modal-box";

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
  modal.appendChild(overlay);
  modal.appendChild(box);
  document.body.appendChild(modal);
}

// 🎨 Group-specific background color (based on translation keys only)
// app.js
// ---------------------------------------------------------------------
// Palette: 15 pale hues (base + ink). No duplicates.
// ---------------------------------------------------------------------
const PALETTE = [
  { base: '#F4D7D7', ink: '#EAB8B8' }, // 0
  { base: '#F4E3D7', ink: '#EACCB8' }, // 1
  { base: '#F4EED7', ink: '#EAE0B8' }, // 2
  { base: '#EEF4D7', ink: '#E0EAB8' }, // 3
  { base: '#E3F4D7', ink: '#CCEAB8' }, // 4
  { base: '#D7F4D7', ink: '#B8EAB8' }, // 5  ← Transport (pale)
  { base: '#D7F4E3', ink: '#B8EACC' }, // 6
  { base: '#D7F4EE', ink: '#B8EAE0' }, // 7
  { base: '#D7EEF4', ink: '#B8E0EA' }, // 8
  { base: '#D7E3F4', ink: '#B8CCEA' }, // 9
  { base: '#D7D7F4', ink: '#B8B8EA' }, // 10
  { base: '#E3D7F4', ink: '#CCB8EA' }, // 11
  { base: '#EED7F4', ink: '#E0B8EA' }, // 12
  { base: '#F4D7EE', ink: '#EAB8E0' }, // 13
  { base: '#F4D7E3', ink: '#EAB8CC' }, // 14
];

// ---------------------------------------------------------------------
// Map each group key to a unique palette index (no repeats).
// Adjust the keys to your actual set; keep uniqueness.
// ---------------------------------------------------------------------
const GROUP_COLOR_INDEX = {
  'group.popular':        0,   // pale red
  'group.transport':      5,   // pale green (downgraded)
  'group.food':           2,   // pale yellow
  'group.services':       10,  // pale indigo
  'group.stages':         1,   // pale amber
  'group.activities':     3,   // pale lime
  'group.gates':          8,   // pale cyan-blue
  'group.areas':          11,  // pale purple
  'group.shops':          13,  // pale pink
  'group.spas':           9,   // pale periwinkle
  'group.guests':         4,   // pale coral / red for Emergency Services
  'group.facilities':     7,   // pale teal
  'group.social-points':  6,   // pale aqua-mint
  'group.landmarks':      2,   // pale stone / beige for Landmarks
  'group.emergency':      12  // pale violet

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

  // 3) Country selection (CF header → global var; or user override)
  const cc = (countryOverride || window.__CF_COUNTRY__ || localStorage.getItem('emg.country') || 'US').toUpperCase();

  // 4) Build entries
  const numbers = getNumbersFor(data, cc);
  const entries = [];
  if (numbers.emergency) entries.push({ key: 'emergency', num: numbers.emergency });
  if (numbers.police)    entries.push({ key: 'police',    num: numbers.police });
  if (numbers.fire)      entries.push({ key: 'fire',      num: numbers.fire });
  if (numbers.ambulance) entries.push({ key: 'ambulance', num: numbers.ambulance });
  (numbers.alt || []).forEach(n => entries.push({ key: 'alt', num: n }));

  // 5) Render into the help modal placeholders
  const regionEl  = document.getElementById('emg-region-label');
  const buttonsEl = document.getElementById('emg-buttons');

  if (regionEl)  regionEl.textContent = cc;
  if (buttonsEl) {
    buttonsEl.innerHTML = entries.map(e => `
      <a class="btn btn-emergency" href="tel:${e.num}" aria-label="Call ${e.num} — ${L[e.key] || e.key}">
        ${e.num} — ${L[e.key] || e.key}
      </a>
    `).join('');
  }

  // 6) Optional: country override <select> support (if you add one)
  const select = document.getElementById('emg-country');
  if (select && select.options.length === 0) {
    const codes = Object.keys(data.countries).sort();
    select.innerHTML = codes.map(code => `<option value="${code}" ${code===cc?'selected':''}>${code}</option>`).join('');
    select.addEventListener('change', () => {
      localStorage.setItem('emg.country', select.value);
      initEmergencyBlock(select.value);
    });
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

    // Load JSONs
    const [actions, structure, geoPointsData] = await Promise.all([
      fetch('data/actions.json').then(r => r.json()),
      fetch('data/structure.json').then(r => r.json()),   // <-- grouped shape (has .groupKey, .groupName, .subgroups[])
      fetch('data/locations.json').then(r => r.json())
    ]);

    state.actions = actions;
    geoPoints = geoPointsData;

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

  // Remaining modals & buttons...
  const helpButton = document.getElementById("help-button");
  const helpModal = document.getElementById("help-modal");
  
  const alertButton = document.getElementById("alert-button");
  const alertModal = document.getElementById("alert-modal");
  const alertModalContent = document.getElementById("alert-modal-content");

  const socialButton = document.getElementById("social-button");
  const hereButton = document.getElementById("here-button");

  const locationModal = document.getElementById("share-location-modal");
  const coordsDisplay = document.getElementById("location-coords");
  const shareButton = document.getElementById("share-location-button");  

  if (alertButton && alertModal && alertModalContent) {
    alertButton.addEventListener("click", () => {
      alertModalContent.innerHTML = "<p>Loading...</p>";
      fetch("/data/alert.json", { cache: "no-store" })
        .then(res => res.json())
        .then(alerts => {
          if (!Array.isArray(alerts) || alerts.length === 0) {
            alertModalContent.innerHTML = "<p>No current alerts.</p>";
            return;
          }

          alertModalContent.innerHTML = "";

          const listWrapper = document.createElement("div");
          listWrapper.style.maxHeight = "300px";
          listWrapper.style.overflowY = "auto";

          alerts.forEach(alert => {
            const wrapper = document.createElement("div");
            wrapper.style.borderBottom = "1px solid #ccc";
            wrapper.style.padding = "1em 0";

            const message = alert.message || "⚠️ No message";
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
              btn.style.border = '1px solid #EACCB8';
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

          alertModalContent.appendChild(listWrapper);

          const summary = document.createElement("div");
          summary.className = "alert-summary";

          const total = alerts.length;
          const seen = alerts.filter(a => acknowledgedAlerts.has(a.message)).length;
          summary.textContent = `Alerts: ${total} Seen: ${seen}`;

          alertModalContent.appendChild(summary);
        })
        .catch(() => {
          alertModalContent.innerHTML = "<p>Error loading alerts.</p>";
        });

      alertModal.classList.remove("hidden");
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

  // ✅ Tap-out + ESC closing support for all front-screen modals
  setupTapOutClose("share-location-modal");
  setupTapOutClose("my-stuff-modal");
  setupTapOutClose("alert-modal");
  setupTapOutClose("help-modal"); 
  
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