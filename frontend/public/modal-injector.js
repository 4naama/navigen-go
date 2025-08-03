
// modal-injector.js

// Track modal items globally within this module
let myStuffItems = [];

/**
 * ESC key handler utility for any modal
 */
export function enableEscToClose(modal) {
  const handler = (e) => {
    if (e.key === "Escape") {
      modal.remove();
      window.removeEventListener("keydown", handler);
    }
  };
  window.addEventListener("keydown", handler);
}

// 🌐 Import translation function for localized modal titles and text
import { t } from './scripts/i18n.js';

// 💳 Stripe: Handles secure checkout setup and donation flow (modularized for reuse)
import { initStripe, handleDonation } from "./scripts/stripe.js";


function getLangFromCountry(code) {
  const langMap = {
    // English-speaking
    IE: "en", GB: "en", US: "en", CA: "en", AU: "en",

    // German-speaking
    DE: "de", AT: "de", CH: "de",

    // French-speaking
    FR: "fr", BE: "fr", LU: "fr",

    // Others
    HU: "hu", BG: "bg", HR: "hr", CY: "el", CZ: "cs", DK: "da", EE: "et",
    FI: "fi", GR: "el", IT: "it", LV: "lv", LT: "lt", MT: "mt",
    NL: "nl", PL: "pl", PT: "pt", RO: "ro", SK: "sk", SI: "sl",
    ES: "es", SE: "sv", IS: "is", NO: "no", TR: "tr",
    IL: "he", RU: "ru", UA: "uk", CN: "zh", SA: "ar", IN: "hi",
    KR: "ko", JP: "ja"
  };

  return langMap[code] || null;
}

window.fetchTranslatedLangs = async () => {
  const langMap = {
    IE: "en", GB: "en", US: "en", CA: "en", AU: "en",
    DE: "de", AT: "de", CH: "de",
    FR: "fr", BE: "fr", LU: "fr",
    HU: "hu", BG: "bg", HR: "hr", CY: "el", CZ: "cs", DK: "da", EE: "et",
    FI: "fi", GR: "el", IT: "it", LV: "lv", LT: "lt", MT: "mt",
    NL: "nl", PL: "pl", PT: "pt", RO: "ro", SK: "sk", SI: "sl",
    ES: "es", SE: "sv", IS: "is", NO: "no", TR: "tr",
    IL: "he", RU: "ru", UA: "uk", CN: "zh", SA: "ar", IN: "hi",
    KR: "ko", JP: "ja"
  };

  const allLangs = Array.from(new Set(Object.values(langMap)));
  const available = [];

  try {
    const res = await fetch('/data/languages/index.json');
    if (res.ok) {
      const listedLangs = await res.json();
      available.push(...listedLangs);
    } else {
      console.warn("⚠️ Could not load language index.json");
    }
  } catch (err) {
    console.warn("⚠️ Failed to fetch index.json:", err);
  }

  return new Set(available);
};

/**
 * Injects a modal into the DOM if not already present.
 * Supports custom title, body, and footer buttons.
 */
export function injectModal({ id, title = '', bodyHTML = '', footerButtons = [], layout = '' }) {
  // Check if modal exists
  let existing = document.getElementById(id);
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.id = id;

  modal.innerHTML = `
    <div class="modal-content${layout ? ` modal-${layout}` : ''}">
      ${title ? `<h2 class="modal-title">${title}</h2>` : ''}
      <div class="modal-body"><div class="modal-body-inner">${bodyHTML}</div></div>
      ${footerButtons.length ? `
        <div class="modal-footer">
          ${footerButtons.map(btn => `
            <button class="${btn.className || 'modal-body-button'}" id="${btn.id}">${btn.label}</button>
          `).join('')}
        </div>` : ''}
    </div>
  `;

  document.body.appendChild(modal);

  // Bind any click handlers
  footerButtons.forEach(btn => {
    if (btn.onClick) {
      modal.querySelector(`#${btn.id}`)?.addEventListener('click', btn.onClick);
    }
  });

  return modal;
}

/**
 * Removes a modal by ID.
 */
export function removeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
} 

/**
 * Utility: show a modal (flexible for overlaying, animations, etc.)
 */
export function showModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.remove("hidden");   // in case it's hidden
  modal.classList.add("visible");     // ✅ show it visibly
  modal.style.display = "";           // reset any inline hiding
}

/**
 * Utility: hide a modal
 */
export function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

/**
 * Modal Injector: My Stuff
 *
 * Dynamically creates and injects the "My Stuff" modal into the DOM.
 * Includes header, overlay, close button, content body, and a single footer button.
 * Uses the generic `injectModal()` utility.
 *
 * Usage:
 *   createMyStuffModal();
 */
export function createMyStuffModal() {
  injectModal({
    id: 'my-stuff-modal',
    className: 'modal modal-menu',
    bodyHTML: `<div id="my-stuff-body" class="modal-body"></div>`,
    footerButtons: [
      {
        label: t('modal.mystuff.resolved'),
        className: 'modal-footer-button',
        onClick: () => {
          document.getElementById('my-stuff-modal')?.remove();
        }
      }
    ]
  });

  const modal = document.getElementById('my-stuff-modal');

  // ✅ Ensure it's hidden after injection
  modal.classList.add('hidden');

  const topBar = document.createElement('div');
  topBar.className = 'modal-top-bar';
  topBar.innerHTML = `
    <h2 id="my-stuff-title" class="modal-header">${t("My Stuff")}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector('.modal-content')?.prepend(topBar);

  topBar.querySelector('.modal-close')?.addEventListener('click', () => {
    document.getElementById('my-stuff-modal')?.remove();
  });

  // ❌ Disabled: ESC key closes the modal
  // enableEscToClose(modal);

  // ❌ Disabled: Tap-out (click background) closes the modal
  // modal.addEventListener('click', (e) => {
  //   if (e.target === modal) {
  //     modal.remove();
  //   }
  // });

  // ✅ Store all ".my-stuff-item" elements for later use
  myStuffItems = Array.from(modal.querySelectorAll('.my-stuff-item'));
}

  export async function showMyStuffModal(state) {
      if (!state) return;

      if (!document.getElementById("my-stuff-modal")) {
        createMyStuffModal();
      }

      const modal = document.getElementById("my-stuff-modal");

      
      const title = modal.querySelector("#my-stuff-title");
      const body = modal.querySelector("#my-stuff-body");
      let actions = modal.querySelector(".modal-footer");
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'modal-footer';
        modal.querySelector('.modal-content')?.appendChild(actions);
      }


      if (!modal || !title || !body || !actions) {
        console.warn("❌ Missing myStuffModal structure.");
        return;
      }

      if (state === "menu") {
        title.textContent = "My Stuff";
        body.innerHTML = ""; // clear body before injecting

        myStuffItems.forEach(item => {
          const btn = document.createElement("button");
          btn.className = "my-stuff-item modal-menu-item";

          btn.innerHTML = `
            <span class="icon">${item.icon}</span>
            <div class="label">${item.title}<br><small>${item.desc}</small></div>
          `;

          btn.addEventListener("click", () => {
            showMyStuffModal(item.view);
          });

          body.appendChild(btn);
        });

        actions.innerHTML = `
          <button class="modal-footer-button" id="my-stuff-resolved-button">${t("modal.done.resolved")}</button>
        `;
        
      } else {
        const item = myStuffItems.find(i => i.view === state);
        if (!item) return;

        title.innerHTML = `${item.title}`;
        
        modal.classList.remove("modal-menu", "modal-social", "modal-action", "modal-alert");
        modal.classList.add("modal-language");
        
        if (item.view === "interests") {
          modal.classList.remove("modal-menu", "modal-language", "modal-action", "modal-alert");
          modal.classList.add("modal-social"); // reuse same layout class

        body.innerHTML = `
          <div class="modal-social-body">
            <p class="muted">Select topics you care about:</p>
            <div class="community-grid">
              <button class="community-button">🏆 Vote</button>
              <button class="community-button">💫 Wish</button>
              <button class="community-button">🧳 Lost</button>
              <button class="community-button">📍 Track</button>
              <button class="community-button">❓ Quizzy</button>
            </div>
          </div>
        `;

        }      
              
        if (item.view === "language") {
          body.innerHTML = `<div class="modal-language-body flag-list"></div>`;
          const flagList = body.querySelector(".flag-list");

          const allFlags = [
            "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
            "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS",
            "NO", "CH", "GB", "TR", "IL", "RU", "UA", "CN", "SA", "IN", "KR", "JP"
          ];

          // You can expand this list as translations become available
          const currentLang = localStorage.getItem("lang") || "en";
          
          let availableLangs = new Set(["en", "de", "fr", "hu"]); // fallback
          if (window.fetchTranslatedLangs) {
            availableLangs = await window.fetchTranslatedLangs();
          }        

          allFlags.forEach(code => {
            const img = document.createElement("img");
            img.src = `/assets/flags/${code}.svg`;
            img.alt = code;
            img.title = code;
            img.className = "flag";
            img.style.width = "40px";
            img.style.height = "40px";
            img.style.margin = "4px";
            img.style.borderRadius = "4px";
            img.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";

            // Lookup language from country code
            const langCode = getLangFromCountry(code);
            const isAvailable = availableLangs.has(langCode);

            if (langCode === currentLang) {
              img.classList.add("selected-flag");
            }

            if (isAvailable) {
              img.style.cursor = "pointer";

              img.addEventListener("click", (e) => {
                e.stopPropagation();
                localStorage.setItem("lang", langCode);

                // ✅ Update selected-flag visually before reload
                document.querySelectorAll(".flag-list img.selected-flag").forEach(el => {
                  el.classList.remove("selected-flag");
                });
                img.classList.add("selected-flag");

                // ✅ Reload to apply selected language
                location.reload();
              });

                flagList.querySelectorAll("img.flag").forEach(f => f.classList.remove("selected-flag"));
                img.classList.add("selected-flag");

            } else {
              img.style.opacity = "0.4";
              img.style.pointerEvents = "none";
              img.style.cursor = "default";
            }

            flagList.appendChild(img);
          });
          
          window.flagStyler = function () {
            const flags = document.querySelectorAll(".flag-list img.flag");
            if (!flags.length) {
              console.warn("❌ No flags found — is the modal open?");
              return;
            }

            const activeLangs = ["en", "de", "fr", "hu"];
            const currentLang = (localStorage.getItem("lang") || "en").toUpperCase(); // flags use upper-case codes like "DE"

            flags.forEach(img => {
              const langCode = img.getAttribute("alt"); // or use title if needed
              const isActive = activeLangs.includes(langCode.toLowerCase());
              const isCurrent = langCode === currentLang;

              img.classList.toggle("disabled", !isActive);
              img.classList.toggle("selected-flag", isCurrent);

              console.log(`${langCode}: ${isActive ? 'active' : 'inactive'}, ${isCurrent ? 'selected' : ''}`);
            });

            console.log("✅ Flags styled using alt attribute.");
          };
          window.flagStyler = function () {
            const flags = document.querySelectorAll(".flag-list img.flag");
            if (!flags.length) {
              console.warn("❌ No flags found — is the modal open?");
              return;
            }

            const activeLangs = ["en", "de", "fr", "hu"];
            const currentLang = (localStorage.getItem("lang") || "en").toUpperCase();

            flags.forEach(img => {
              const langCode = img.getAttribute("alt");
              const isActive = activeLangs.includes(langCode.toLowerCase());
              const isCurrent = langCode === currentLang;

              img.classList.toggle("disabled", !isActive);
              img.classList.toggle("selected-flag", isCurrent);

              console.log(`${langCode}: ${isActive ? 'active' : 'inactive'}, ${isCurrent ? 'selected' : ''}`);
            });

            console.log("✅ Flags styled using alt attribute.");
          };
          
                  
        }
            
      else if (item.view === "social") {
        
      modal.classList.remove("modal-menu", "modal-language", "modal-action", "modal-alert");
      modal.classList.add("modal-social");     
        
        body.innerHTML = `
          <!-- 🌐 Social Links -->
          <div class="modal-social-body">
            <div class="social-link-grid">
              <a href="https://www.facebook.com/SzigetFestival" class="social-icon" target="_blank" rel="noopener">
                <img src="/assets/social/icons-facebook.svg" alt="Facebook">
              </a>
              <a href="https://www.instagram.com/szigetofficial/" class="social-icon" target="_blank" rel="noopener">
                <img src="/assets/social/icons-instagram.svg" alt="Instagram">
              </a>
              <a href="https://www.youtube.com/user/szigetofficial" class="social-icon" target="_blank" rel="noopener">
                <img src="/assets/social/icons-youtube.svg" alt="YouTube">
              </a>
              <a href="https://www.tiktok.com/@szigetofficial/" class="social-icon" target="_blank" rel="noopener">
                <img src="/assets/social/icons-tiktok.svg" alt="TikTok">
              </a>
              <a href="https://open.spotify.com/user/szigetfestivalofficial" class="social-icon" target="_blank" rel="noopener">
                <img src="/assets/social/icons-spotify.svg" alt="Spotify">
              </a>
              <a href="https://www.linkedin.com/company/sziget-cultural-management-ltd/" class="social-icon" target="_blank" rel="noopener">
                <img src="/assets/social/icons-linkedin.svg" alt="LinkedIn">
              </a>
            </div>
          </div>
        `;

      }

        const viewsWithResolved = ["interests", "purchases", "language", "social"];
        actions.innerHTML = viewsWithResolved.includes(state)
          ? `<button class="modal-footer-button" id="my-stuff-resolved-button">${t("modal.done.resolved")}</button>`
          : '';
      }

      // Add close behavior
      const resolvedBtn = document.getElementById("my-stuff-resolved-button");
      actions.querySelector('#my-stuff-resolved-button')?.addEventListener('click', () => {
        document.getElementById("my-stuff-modal")?.remove();
      });

      showModal("my-stuff-modal");
    };

/**
 * Runtime entry point to render My Stuff modal content
 * and make it visible. Exposed globally as `window.showMyStuffModal`
 */
export function setupMyStuffModalLogic() {
  myStuffItems = [
    { icon: "🧩", title: "Community Zone", view: "interests", desc: "Select topics you care about" },
    { icon: "💳", title: "My Purchase History", view: "purchases", desc: "Check payment and documentation status" },
    {
      icon: `<img src="/assets/language.svg" alt="Language" class="icon-img">`,
      title: "Language Settings",
      view: "language",
      desc: "Set preferred language"
    },
    { icon: "📍", title: "My Location History", view: "locations", desc: "View/save recent locations (if stored)" },
    {
      icon: "🌐",
      title: "Social",
      view: "social",
      desc: "Connect your social accounts"
    },
    { icon: "🔄", title: "Reset App", view: "reset", desc: "Clear settings, restart" },
    { icon: "👁️", title: "Data We Store", view: "data", desc: "Transparent view of local data (e.g. donations, preferences)" },
    { icon: "📜", title: "Terms & Privacy", view: "terms", desc: "View app terms of use and data privacy policy" }
  ];

  
}

// 🆘 Creates and shows the Help Modal.
// Displays a friendly message for users in need of assistance or emergencies.
// Includes translated text and a Continue button to dismiss or trigger next steps.
// Injected dynamically to keep HTML clean and fully localizable.
export function createHelpModal() {
  injectModal({
    id: "help-modal",
    bodyHTML: `
      <p>
        👋 ${t("help.intro")}<br><br>
        ${t("help.body")}<br><br>
        ${t("help.tap")}
      </p>
      <div class="modal-actions">
        <button class="modal-continue">${t("help.continue")}</button>
      </div>
    `,
    layout: "action"
  });

  const modal = document.getElementById("help-modal");

  modal.querySelector(".modal-continue")?.addEventListener("click", () => {
    hideModal("help-modal");
    // or: show the next step in your help flow
  });

  setupTapOutClose("help-modal");
}

// 🚨 Creates and shows the Alert Modal.
// Used to display important real-time alerts or notifications.
// Content is injected dynamically into #alert-modal-content.
export function createAlertModal() {
  injectModal({
    id: "alert-modal",
    title: t("alert.title"), // "🚨 Current Alerts"
    bodyHTML: `<div id="alert-modal-content"></div>`,
    layout: "action"
  });

  setupTapOutClose("alert-modal");
}

// 🛑 Prevents overlapping share attempts by locking during active share operation.
// Ensures navigator.share is not called multiple times simultaneously (InvalidStateError workaround)
let isSharing = false;


async function handleShare() {
  if (isSharing) {
    console.log("[Share] Ignored — already in progress");
    return;
  }

  isSharing = true;

  const coordsRaw = document.getElementById("share-location-coords")?.textContent.trim();
  const coords = coordsRaw?.replace(/^📍\s*/, '');
  const includeNavigen = document.getElementById("include-navigen-link")?.checked;

  if (!coords) {
    isSharing = false;
    return;
  }

  const text = includeNavigen
    ? `📍 ${coords}\nhttps://navigen.pages.dev/?at=${coords}`
    : `📍 ${coords}`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "My Location", text });
      hideModal("share-location-modal");
    } else {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    }
  } catch (err) {
    console.warn("❌ Share failed:", err);
    showToast("Share canceled or failed");
  } finally {
    isSharing = false;
  }
}


/**
 * Modal Injector: Share Location Modal
 *
 * Dynamically creates and injects the #share-location-modal into the DOM.
 * Applies structured layout (.modal-action) and default visibility (hidden).
 * Provides location display and browser share integration.
 */
export function createShareModal() {
  injectModal({
    id: 'share-location-modal',
    title: 'Share Your Location',
    bodyHTML: `
      <p class="muted">You can share your current location with a friend:</p>
      <p id="share-location-coords" class="location-coords">📍 Loading…</p>

      <label class="form-control">
        <input type="checkbox" id="include-navigen-link" checked>
        Include a “What’s around me” map link
      </label>

      <div class="modal-actions">
        <button class="modal-body-button" id="share-location-button">📤 Share</button>
      </div>
    `
  });

  const modal = document.getElementById("share-location-modal");
  modal?.classList.add("modal", "modal-layout", "hidden");

  const shareBtn = document.getElementById("share-location-button");

  if (shareBtn && !shareBtn.hasAttribute("data-bound")) {
    shareBtn.addEventListener("click", handleShare);
    shareBtn.setAttribute("data-bound", "true");
  }
}

/**
 * Show the Share Location Modal with the given coordinates.
 * 
 * This bypasses the global showModal() utility to ensure the modal becomes
 * visible even if showModal is unavailable or mis-scoped at runtime.
 * It directly removes the 'hidden' class and resets inline style.
 *
 * @param {string} coords - Latitude and longitude string
 */
export function showShareModal(coords) {
  const p = document.getElementById("share-location-coords");
  if (p) p.textContent = `📍 ${coords}`;

  const modal = document.getElementById("share-location-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = '';
  }

  // ✅ Ensure the Share button is visible even if testing code hid it
  document.getElementById("share-location-button")?.classList.remove("hidden");
}

export function createIncomingLocationModal(coords) {
  const id = 'incoming-location-modal';
  document.getElementById(id)?.remove();

  const modal = document.createElement("div");
  modal.className = "modal modal-action";
  modal.id = id;

  modal.innerHTML = `
    <div class="modal-content modal-action">
      <h2 class="modal-title">📍 Location Received</h2>
      <div class="modal-body">
        <p class="muted">Your friend shared their current location with you:</p>
        <p class="location-coords">📍 ${coords}</p>
        <div class="modal-actions">
          <a href="https://maps.google.com?q=${coords}" 
             target="_blank" 
             class="modal-body-button">
             🌍 Open in Google Maps
          </a>
          <button class="modal-body-button" id="incoming-modal-resolved">${t("modal.done.resolved")}</button>
        </div>
      </div>
    </div>
  `;

  // Set up modal positioning (CSS-fallback-safe)
  Object.assign(modal.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "fixed",
    inset: "0",
    zIndex: "1000",
    background: "rgba(0, 0, 0, 0.25)",
    padding: "1rem"
  });

  document.body.appendChild(modal);

  // Close logic
  modal.querySelector('#incoming-modal-resolved')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
  
  enableEscToClose(modal);
}


/**
 * Enables "tap-out-to-close" behavior for a modal.
 * Expects the modal to include a `.modal-overlay` element,
 * which will close the modal when tapped.
 */
function setupTapOutClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const overlay = modal.querySelector(".modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }
}

// 🎁 Creates and shows the donation modal.
// Accepts `isRepeat = true` if the user has already donated,
// which adjusts the text to a thank-you prompt with the option to give again.
// Reuses translation keys and handles modal injection, button actions, and close behavior.
export function createDonationModal(isRepeat = false) {

  if (document.getElementById("donation-modal")) {
    showModal("donation-modal");
    return;
  }

  const title = isRepeat
    ? t("donation.thanks.title")
    : t("donation.title");

  const intro = isRepeat
    ? t("donation.thanks.body")
    : t("donation.intro");

  const declineLabel = isRepeat
    ? t("donation.thanks.decline")
    : t("donation.btn.decline.first");

  injectModal({
    id: "donation-modal",
    title,
    bodyHTML: `
      <div class="modal-shop-item">
        <p>${intro}</p>
        <div class="donation-options">
          <button class="donation-option donate-btn" data-amount="3">
            ${t("donation.btn.coffee")}
            <span class="donation-sub">${t("donation.btn.coffee.sub")}</span>
          </button>
          <button class="donation-option donate-btn" data-amount="5">
            ${t("donation.btn.keep")}
            <span class="donation-sub">${t("donation.btn.keep.sub")}</span>
          </button>
          <button class="donation-option donate-btn" data-amount="10">
            ${t("donation.btn.fuel")}
            <span class="donation-sub">${t("donation.btn.fuel.sub")}</span>
          </button>
        </div>
        <div class="modal-actions">
          <button class="modal-body-button" id="donation-decline">${declineLabel}</button>
        </div>
      </div>
    `,
    layout: "action"
  });

  const modal = document.getElementById("donation-modal");

  modal.querySelector("#donation-decline")?.addEventListener("click", () => {
    hideModal("donation-modal");
  });

  modal.querySelectorAll(".donate-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const amount = parseInt(btn.dataset.amount);
      await handleDonation(amount);
    });
  });

  setupTapOutClose("donation-modal");

  // ✅ Show the modal after injection
  showModal("donation-modal");
}

// Exports UI rendering functions for accordion group sections and the popular group (called from app.js)

export function buildAccordion(structure_data, geoPoints) {
  const container = document.getElementById("accordion");
  container.innerHTML = '';

  structure_data.forEach(group => {
    const groupKey = group.Group;
    const label = group["Drop-down"];

    const filtered = geoPoints.filter(loc => loc.Group === groupKey && loc.Visible === "Yes");
    if (!filtered.length) return;

    // Accordion section wrapper
    const section = document.createElement("div");
    section.classList.add("accordion-section");

    // Accordion button (group header)
    const header = document.createElement("button");
    header.classList.add("accordion-button");
    header.innerHTML = `
      <span class="header-title">${group["Drop-down"]}</span>
      <span class="header-meta">( ${filtered.length} )</span>
      <span class="header-arrow"></span>
    `;

    // Accordion content area
    const content = document.createElement("div");
    content.className = "accordion-body";
    content.style.display = "none";

    // Add location buttons
    filtered.forEach(loc => {
      const btn = document.createElement("button");
      btn.textContent = loc.Name;
      btn.setAttribute("data-id", loc.ID);
      btn.classList.add("location-button");
      content.appendChild(btn);
    });

    // ✅ Unified toggle logic: only one group (popular or accordion) open at a time
    header.addEventListener("click", () => {
      const isOpen = header.classList.contains("open");

      // Close all groups
      document.querySelectorAll('.accordion-body').forEach(b => b.style.display = 'none');
      document.querySelectorAll('.group-buttons').forEach(b => b.classList.add('hidden'));
      document.querySelectorAll('.accordion-button, .group-header-button').forEach(btn => btn.classList.remove('open'));

      // Only open this group if it wasn't already open
      if (!isOpen) {
        content.style.display = 'block';
        header.classList.add('open');
      }
    });

    section.appendChild(header);
    section.appendChild(content);
    container.appendChild(section);
  });
}
