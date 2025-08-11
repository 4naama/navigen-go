
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

// Helper: Appends a "Resolved" button to a modal's footer
function appendResolvedButton(actions, modalId = "my-stuff-modal") {
  if (!actions.querySelector("#my-stuff-resolved-button")) {
    const resolvedBtn = document.createElement("button");
    resolvedBtn.className = "modal-footer-button";
    resolvedBtn.id = "my-stuff-resolved-button";
    resolvedBtn.textContent = t("modal.done.resolved");

    resolvedBtn.addEventListener("click", () => {
      hideModal(modalId);
    });

    actions.appendChild(resolvedBtn);
  }
}

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
    ${layout === 'action' ? '<div class="modal-overlay"></div>' : ''}
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

  document.body.appendChild(modal); // ✅ Keep this one

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

  modal.classList.remove("hidden");   // For any manual .hidden
  modal.classList.add("visible");     // ✅ Triggers CSS flex centering
  modal.style.display = "";           // ✅ Clears any inline hiding (especially from hideModal)
}

/**
 * Utility: hide a modal
 */
export function hideModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.remove("visible");
  modal.classList.add("hidden");
  modal.style.display = ""; // ✅ Clear inline display to let CSS re-apply
}

// Toast: single instance; persistent until tapped (link doesn’t dismiss).
// Optional auto-close via duration>0 for backward compatibility.
export function showToast(message, duration = 0) {
  // one at a time
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.innerHTML = message;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  // tap anywhere on toast EXCEPT the link to close
  toast.addEventListener("click", (e) => {
    if (e.target.closest("a")) return; // don’t close when the link is tapped
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 400);
  }, { passive: true });

  // optional auto-close if duration > 0 (keeps back-compat)
  if (duration > 0) {
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
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
    hideModal("my-stuff-modal");
  });

  // ✅ Store all ".my-stuff-item" elements for later use
  myStuffItems = Array.from(modal.querySelectorAll('.my-stuff-item'));

  // ✅ Inject static Purchase History list (Phase 1)
  const historyContainer = document.createElement("div");
  historyContainer.id = "purchase-history"; // ✅ restore canonical ID
  historyContainer.style = "margin-top: 1rem; padding: 0 1rem; font-size: 15px;";
  modal.querySelector("#my-stuff-body")?.appendChild(historyContainer);

  const purchases = JSON.parse(localStorage.getItem("myPurchases") || "[]");

  if (purchases.length === 0) {
    historyContainer.innerHTML = "<p style='opacity:0.6;'>No purchases yet.</p>";
  } else {
    purchases.sort((a, b) => b.timestamp - a.timestamp); // newest first
    purchases.forEach(p => {
      const div = document.createElement("div");
      div.style = "background:#fff;padding:1rem;margin-bottom:12px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.06);";
      div.innerHTML = `
        <div style="font-size:20px;">${p.icon}</div>
        <div style="font-weight:600;margin-top:4px;">${p.label}</div>
        <div style="font-size:14px;opacity:0.8;">${p.subtext}</div>
      `;
      historyContainer.appendChild(div);
    });
  }

}

/**
 * Shows the "My Stuff" modal.
 * Supports multiple states like "menu", "purchases", "language", etc.
 * Injects the right content per state.
*/
  export async function showMyStuffModal(state) {
      if (!state) return;

      if (!document.getElementById("my-stuff-modal")) {
        createMyStuffModal();
      }

      const modal = document.getElementById("my-stuff-modal");

      
      const title = modal.querySelector("#my-stuff-title");
      const body = modal.querySelector("#my-stuff-body");

      if (state === "purchases") {
        title.textContent = "My Purchase History"; // or t("purchaseHistory.title")

        // ✅ Clear previous content
        body.innerHTML = "";

        // ✅ Create and insert the container expected by renderPurchaseHistory
        const purchaseContainer = document.createElement("div");
        purchaseContainer.id = "purchase-history";
        body.appendChild(purchaseContainer);

        renderPurchaseHistory(); // ✅ Fill with receipts from localStorage
        return;
      }


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
          modal.classList.add("modal-social");

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
              <p>*All features coming soon</p>
            </div>
          `;

          // ✅ Just call footer button appender like others
          appendResolvedButton(actions, "my-stuff-modal");
        }
                  
        if (item.view === "language") {
          body.innerHTML = `<div class="modal-language-body flag-list"></div>`;
          const flagList = body.querySelector(".flag-list");

          const allFlags = [
            "GB", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
            "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS",
            "NO", "CH", "TR", "IL", "RU", "UA", "CN", "SA", "IN", "KR", "JP"
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

            if (isAvailable) {
              img.style.cursor = "pointer";

              img.addEventListener("click", (e) => {
                e.stopPropagation();
                localStorage.setItem("lang", langCode);

                // ✅ Reload to apply selected language
                location.reload();
              });

            } else {
              img.style.opacity = "0.4";
              img.style.pointerEvents = "none";
              img.style.cursor = "default";
            }            

            flagList.appendChild(img);
          });    

          flagStyler();
          
        }

      else if (item.view === "purchases") {
        modal.classList.remove("modal-menu", "modal-language", "modal-alert", "modal-social");
        modal.classList.add("modal-action");

        body.innerHTML = `
          <div id="purchase-history"></div>
        `;

        actions.innerHTML = `
          <button class="modal-footer-button" id="my-stuff-resolved-button">${t("modal.done.resolved")}</button>
        `;

        document.getElementById("my-stuff-resolved-button")?.addEventListener("click", () => {
          hideModal("my-stuff-modal");
        });

        renderPurchaseHistory(); // ✅ Called AFTER container is ready
      }

      else if (item.view === "location-history") {
        modal.classList.remove("modal-menu", "modal-language", "modal-alert", "modal-social");
        modal.classList.add("modal-action");

        // 🧱 Modal body container
        body.innerHTML = `
          <div id="location-history"></div>
        `;

        // ✅ Footer with correct style (no body buttons!)
        actions.innerHTML = `
          <div class="modal-footer">
            <button class="modal-footer-button" id="my-stuff-location-close">
              ${t("modal.mystuff.resolved")}
            </button>
          </div>
        `;

        // Add resolved button into #my-stuff-modal only if not already added
        appendResolvedButton(actions, "my-stuff-modal");


        // 🧹 Close modal on button click
        const closeBtn = document.getElementById("my-stuff-location-close");
        if (closeBtn) {
          closeBtn.addEventListener("click", () => {
            hideModal("my-stuff-modal");
          });
        }

        renderLocationHistory(); // 📍 Inject saved locations or empty state
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

      else if (item.view === "reset") {
        modal.classList.remove("modal-menu", "modal-language", "modal-action", "modal-alert");
        modal.classList.add("modal-action");

        body.innerHTML = `
          <p>This will clear your settings and restart the app.</p>
          <p>This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="modal-body-button" id="reset-confirm">✅ Reset</button>
            <button class="modal-body-button" id="reset-cancel">❌ Cancel</button>
          </div>
        `;

        document.getElementById("reset-confirm")?.addEventListener("click", () => {
          localStorage.clear();
          location.reload();
        });

        document.getElementById("reset-cancel")?.addEventListener("click", () => {
          hideModal("my-stuff-modal");
        });
      }

      else if (item.view === "data") {
        modal.classList.remove("modal-menu", "modal-language", "modal-alert", "modal-social");
        modal.classList.add("modal-action");

        body.innerHTML = `
          <p>${t("myStuff.data.bodyIntro")}</p>
          <p>${t("myStuff.data.includes")}</p>
          <ul>
            <li>${t("myStuff.data.item.purchase")}</li>
            <li>${t("myStuff.data.item.language")}</li>
            <li>${t("myStuff.data.item.location")}</li>
          </ul>
          <p class="modal-warning">⚠️ ${t("myStuff.data.warning")}</p>
          <p>${t("myStuff.data.resetPrompt")}</p>
          <div class="modal-actions">
            <a href="/assets/docs/navigen-privacy-policy.pdf" target="_blank" class="modal-body-button">
              📄 ${t("myStuff.data.viewPolicy")}
            </a>
          </div>
        `;

        appendResolvedButton(actions, "my-stuff-modal");
      }


      else if (item.view === "terms") {
        modal.classList.remove("modal-menu", "modal-language", "modal-alert", "modal-social");
        modal.classList.add("modal-action");

        body.innerHTML = `
          <p>${t("myStuff.terms.body")}</p>
          <div class="modal-actions">
            <a href="/assets/docs/navigen-terms.pdf" target="_blank" class="modal-body-button">
              📄 ${t("myStuff.terms.viewFull")}
            </a>
          </div>
        `;

        // Add resolved button into #my-stuff-modal only if not already added
        appendResolvedButton(actions, "my-stuff-modal");
      }

      else if (item.view === "no-miss") {
        modal.classList.remove("modal-menu", "modal-language", "modal-alert", "modal-social");
        modal.classList.add("modal-action");

        body.innerHTML = `
          <div class="no-miss-section">
            <div class="no-miss-block">
              <div class="no-miss-title">📌 ${t("noMiss.install.title")}</div>
              <div class="no-miss-body">${t("noMiss.install.body")}</div>
            </div>

            <div class="no-miss-block">
              <div class="no-miss-title">💡 ${t("noMiss.refresh.title")}</div>
              <div class="no-miss-body">
                ${t("noMiss.refresh.bodyStart")}
                <span class="inline-icon logo-icon"></span>
                ${t("noMiss.refresh.bodyEnd")}
                <br>🌀 ${t("noMiss.refresh.relax")}
              </div>
            </div>

            <div class="no-miss-block">
              <div class="no-miss-title">👋 ${t("noMiss.support.title")}</div>
              <div class="no-miss-body">${t("noMiss.support.body")}</div>
            </div>

            <div class="no-miss-thanks">
              🎉 ${t("noMiss.thanks")}
            </div>
          </div>
        `;

        // Try all possible scrollable targets
        modal.scrollTop = 0;
        body.scrollTop = 0;
        modal.querySelector(".modal-body")?.scrollTo(0, 0);
        modal.querySelector(".modal-content")?.scrollTo(0, 0);


        appendResolvedButton(actions, "my-stuff-modal");
      }

        const viewsWithResolved = ["interests", "purchases", "location-history", "language", "social", "reset", "data", "terms", "no-miss"];
        actions.innerHTML = viewsWithResolved.includes(state)
          ? `<button class="modal-footer-button" id="my-stuff-resolved-button">${t("modal.done.resolved")}</button>`
          : '';
      }

      // Add close behavior
      const resolvedBtn = document.getElementById("my-stuff-resolved-button");
      actions.querySelector('#my-stuff-resolved-button')?.addEventListener('click', () => {
        hideModal("my-stuff-modal");
      });

      showModal("my-stuff-modal");
    };

/**
 * Runtime entry point to render My Stuff modal content
 * and make it visible. Exposed globally as `window.showMyStuffModal`
 */
export function setupMyStuffModalLogic() {
  myStuffItems = [
    {
      icon: "🧩",
      title: t("myStuff.community.title"),
      view: "interests",
      desc: t("myStuff.community.desc")
    },
    {
      icon: "💳",
      title: t("myStuff.purchases.title"),
      view: "purchases",
      desc: t("myStuff.purchases.desc")
    },
    {
      icon: "📍",
      title: t("myStuff.locationHistory.title"),
      view: "location-history",
      desc: t("myStuff.locationHistory.desc")
    },
    {
      icon: `<img src="/assets/language.svg" alt="Language" class="icon-img">`,
      title: t("myStuff.language.title"),
      view: "language",
      desc: t("myStuff.language.desc")
    },
    {
      icon: "🌐",
      title: t("myStuff.social.title"),
      view: "social",
      desc: t("myStuff.social.desc")
    },
    {
      icon: "🔄",
      title: t("myStuff.reset.title"),
      view: "reset",
      desc: t("myStuff.reset.desc")
    },
    {
      icon: "👁️",
      title: t("myStuff.data.title"),
      view: "data",
      desc: t("myStuff.data.desc")
    },
    {
      icon: "📜",
      title: t("myStuff.terms.title"),
      view: "terms",
      desc: t("myStuff.terms.desc")
    },
    {
      icon: "👀",
      title: t("myStuff.noMiss.title"),
      view: "no-miss",
      desc: t("myStuff.noMiss.desc")
    }
  ];

}

// 🚨 Creates and shows the Alert Modal.
// Used to display important real-time alerts or notifications.
// Content is injected dynamically into #alert-modal-content.
export function createAlertModal() {
  console.log("🔥 createAlertModal called"); // 👈 add this line
  injectModal({
    id: "alert-modal",
    title: t("alert.title"), // "🚨 Current Alerts"
    bodyHTML: `<div id="alert-modal-content"></div>`,
    layout: "action"
  });

  setupTapOutClose("alert-modal");

  // ✅ Add this line to ensure visibility
  showModal("alert-modal");
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

  // Toggles (safe defaults even if the checkboxes don't exist)
  const includeGoogle  = document.getElementById("include-google-link")?.checked ?? true;
  const includeNavigen = document.getElementById("include-navigen-link")?.checked ?? true;
  const consoleTestOnly = document.getElementById("share-console-test")?.checked ?? false;

  if (!coords) {
    isSharing = false;
    return;
  }

  const gmaps   = `https://maps.google.com?q=${coords}`;
  const navigen = `https://navigen.io/?at=${coords}`;

  // 📌 WhatsApp share layout
  let text = `My Location :\n\n📍 ${coords}\n\n`;

  // ✅ NaviGen first
  if (includeNavigen) {
    text += `🕴 NaviGen: ${navigen}\n\n`;
  }

  if (includeGoogle) {
    text += `🌍 Google Maps: ${gmaps}\n`;
  }

  // Optional: console preview without sharing/clipboard
  if (consoleTestOnly) {
    console.log("🔎 Share preview:\n" + text);
    showToast("Printed share text to console");
    isSharing = false;
    return;
  }

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

let shareModalCreated = false;

export function createShareModal() {
  if (shareModalCreated) return;
  shareModalCreated = true;

  injectModal({
    id: 'share-location-modal',
    layout: 'action',
    title: t('share.button'),
    bodyHTML: `
      <p class="muted">${t("share.intro") || "You can share your current location with a friend:"}</p>
      <p class="share-note">${t("share.note") || "📱 Works best via <strong>WhatsApp</strong>"}</p>
      <p id="share-location-coords" class="location-coords">📍 Loading…</p>

      <div class="modal-actions">
        <button class="modal-body-button" id="share-location-button">${t("share.button")}</button>
        <button class="modal-body-button" id="share-location-cancel">${t("share.cancel")}</button>
      </div>
    `
  });

  const shareBtn = document.getElementById("share-location-button");
  if (shareBtn) {
    shareBtn.addEventListener("click", handleShare);
  }

  const cancelBtn = document.getElementById("share-location-cancel");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      hideModal("share-location-modal");
    });
  }

  setupTapOutClose("share-location-modal");
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
  const modal = document.getElementById("share-location-modal");
  const coordsEl = document.getElementById("share-location-coords");
  const shareBtn = document.getElementById("share-location-button");

  if (!modal || !coordsEl) return console.warn("❌ Modal or coords element missing");

  coordsEl.textContent = `📍 ${coords}`;
  if (shareBtn) shareBtn.classList.remove("hidden");

  modal.classList.remove("hidden");
  modal.classList.add("visible");
  modal.style.display = ""; // ✅ Clear inline junk
}

export function createIncomingLocationModal(coords) {
  const id = 'incoming-location-modal';
  document.getElementById(id)?.remove();

  const modal = document.createElement("div");
  modal.className = "modal modal-action";
  modal.id = id;

  modal.innerHTML = `
    <div class="modal-overlay"></div>
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

  // Close logic
  modal.querySelector('#incoming-modal-resolved')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
  
  enableEscToClose(modal);
  
  document.body.appendChild(modal);

}

// modal-injector.js
/**
 * Enables "tap-out-to-close" and Escape-to-close behavior for a modal.
 * If the overlay doesn't exist yet, it waits for it.
 */
export function setupTapOutClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const tryBindOverlay = () => {
    const overlay = modal.querySelector(".modal-overlay");
    if (overlay) {
      overlay.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    } else {
      requestAnimationFrame(tryBindOverlay);
    }
  };

  tryBindOverlay();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
    }
  });
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

        <div class="donation-note-wrapper">
          <div class="donation-note">
            🕐 Heads up! The first payment might take a few seconds to load securely.<br />
            <span class="smiley">Thanks for your patience.</span>
          </div>
        </div>

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
export function buildAccordion(groupedStructure, geoPoints) {
  const container = document.getElementById("accordion");
  container.innerHTML = '';

  groupedStructure.forEach(group => {
    const groupKey = group.groupKey || group.Group;
    const label = group.groupName || group["Drop-down"];

    // All visible locations in this group
    const filtered = geoPoints.filter(loc => loc.Group === groupKey && loc.Visible === "Yes");
    if (!filtered.length) return;

    // Accordion section wrapper
    const section = document.createElement("div");
    section.classList.add("accordion-section");

    // Accordion button (group header)
    const header = document.createElement("button");
    header.classList.add("accordion-button");
    header.innerHTML = `
      <span class="header-title">${label}</span>
      <span class="header-meta">( ${filtered.length} )</span>
      <span class="header-arrow"></span>
    `;

    // Accordion content
    const content = document.createElement("div");
    content.className = "accordion-body";
    content.style.display = "none";

    // === SUBGROUP RENDERING START ===
    if (Array.isArray(group.subgroups) && group.subgroups.length) {
      // Render each subgroup
      group.subgroups.forEach(sub => {
        const subHeader = document.createElement('div');
        subHeader.className = 'subheader';
        subHeader.textContent = sub.name || sub.key;
        content.appendChild(subHeader);

        const subLocs = filtered.filter(loc => loc["Subgroup key"] === sub.key);
        subLocs.forEach(loc => {
          const btn = document.createElement('button');
          btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
          btn.setAttribute('data-id', loc.ID);
          btn.classList.add('location-button');

          if (typeof loc["Coordinate Compound"] === "string" && loc["Coordinate Compound"].includes(",")) {
            const parts = loc["Coordinate Compound"].split(',');
            const lat = parts[0].trim();
            const lng = parts[1].trim();
            btn.setAttribute('data-lat', lat);
            btn.setAttribute('data-lng', lng);
            btn.title = `Open in Google Maps (${lat}, ${lng})`;
            btn.addEventListener('click', function(e){
              e.preventDefault();
              window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
            });
          }

          content.appendChild(btn);
        });
      });

      // Leftover (no subgroup)
      const others = filtered.filter(loc => !loc["Subgroup key"]);
      if (others.length) {
        const h = document.createElement('div');
        h.className = 'subheader';
        h.textContent = '-';
        content.appendChild(h);

        others.forEach(loc => {
          const btn = document.createElement('button');
          btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
          btn.setAttribute('data-id', loc.ID);
          btn.classList.add('location-button');

          if (typeof loc["Coordinate Compound"] === "string" && loc["Coordinate Compound"].includes(",")) {
            const parts = loc["Coordinate Compound"].split(',');
            const lat = parts[0].trim();
            const lng = parts[1].trim();
            btn.setAttribute('data-lat', lat);
            btn.setAttribute('data-lng', lng);
            btn.title = `Open in Google Maps (${lat}, ${lng})`;
            btn.addEventListener('click', function(e){
              e.preventDefault();
              window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
            });
          }

          content.appendChild(btn);
        });
      }
    } else {
      // Fallback: flat list
      filtered.forEach(loc => {
        const btn = document.createElement('button');
        btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
        btn.setAttribute('data-id', loc.ID);
        btn.classList.add('location-button');

        if (typeof loc["Coordinate Compound"] === "string" && loc["Coordinate Compound"].includes(",")) {
          const parts = loc["Coordinate Compound"].split(',');
          const lat = parts[0].trim();
          const lng = parts[1].trim();
          btn.setAttribute('data-lat', lat);
          btn.setAttribute('data-lng', lng);
          btn.title = `Open in Google Maps (${lat}, ${lng})`;
          btn.addEventListener('click', function(e){
            e.preventDefault();
            window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
          });
        }

        content.appendChild(btn);
      });
    }
    // === SUBGROUP RENDERING END ===

    // Toggle open/close logic
    header.addEventListener("click", () => {
      const isOpen = header.classList.contains("open");

      // Close all groups
      document.querySelectorAll('.accordion-body').forEach(b => b.style.display = 'none');
      document.querySelectorAll('.accordion-button, .group-header-button').forEach(btn => btn.classList.remove('open'));

      if (!isOpen) {
        content.style.display = 'block';
        header.classList.add('open');
      }
    });

    section.appendChild(header);
    section.appendChild(content);
    container.appendChild(section);
  });

  function makeLocationButton(loc, groupKey, subKey) {
    const btn = document.createElement("button");
    btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
    btn.setAttribute("data-id", loc.ID);
    btn.dataset.group = groupKey;
    if (subKey) btn.dataset.subgroup = subKey;
    btn.classList.add("location-button");

    if (typeof loc["Coordinate Compound"] === "string" && loc["Coordinate Compound"].includes(",")) {
      const [lat, lng] = loc["Coordinate Compound"].split(',').map(x => x.trim());
      btn.setAttribute("data-lat", lat);
      btn.setAttribute("data-lng", lng);
      btn.title = `Open in Google Maps (${lat}, ${lng})`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(url, "_blank");
      });
    }
    return btn;
  }
}

/**
 * Saves a received coordinate into Location History.
 * Called when a user opens a link like ?at=47.4979,19.0402
 * Prevents immediate duplicates and stores newest first.
 */
export function saveToLocationHistory(coords) {
  const key = "location-history";

  const entry = {
    coords,
    timestamp: Date.now()
  };

  let history = JSON.parse(localStorage.getItem(key) || "[]");

  // 🔁 Avoid saving same coordinate twice in a row
  if (history.length && history[0].coords === coords) return;

  history.unshift(entry); // newest at top
  localStorage.setItem(key, JSON.stringify(history));
}


// Renders entries stored in localStorage.myPurchases (full strings, not keys)
function renderPurchaseHistory() {
  const purchases = JSON.parse(localStorage.getItem("myPurchases") || "[]");
  const container = document.getElementById("purchase-history");
  container.innerHTML = "";

  if (purchases.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "empty-state";
    emptyMsg.innerHTML = `
      <p>${t("purchaseHistory.emptyMessage")}</p>
      <p style="opacity: 0.75;">${t("purchaseHistory.empty.body")}</p>
    `;
    container.appendChild(emptyMsg);
    return;
  }

  purchases.forEach(purchase => {
    const card = document.createElement("div");
    card.className = "purchase-card";

    const label = document.createElement("div");
    label.className = "label";

    // 📝 Use translated label if available, fallback to raw key
    label.innerHTML = `<strong>${t(purchase.label) || purchase.label}</strong>`;

    const timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.textContent = `📅 ${new Date(purchase.timestamp).toLocaleString()}`;

    const subtext = document.createElement("div");
    subtext.className = "subtext";

    // 🔁 Resolve translated subtext (fallback to raw key if not found)
    let rawSubtext = t(purchase.subtext) || purchase.subtext;

    // 💖 If it mentions "free", inject heart emoji for flair
    const cleaned = rawSubtext.replace("💖", "").trim();
    subtext.textContent = cleaned.includes("free")
      ? cleaned.replace(/free\b/i, "free 💖")
      : cleaned;

    card.appendChild(label);
    card.appendChild(timestamp);
    card.appendChild(subtext);
    container.appendChild(card);

    // ↕️ Add vertical spacing between cards
    const spacer = document.createElement("div");
    spacer.style.height = "1em";
    container.appendChild(spacer);
  });

}

// Renders entries stored in localStorage.location-history (coords + timestamp)
export function renderLocationHistory() {
  const container = document.getElementById("location-history");
  container.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("location-history") || "[]");

  if (history.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "empty-state";
    emptyMsg.innerHTML = `
      <p>${t("locationHistory.emptyMessage")}</p>
      <p style="opacity: 0.75;">${t("locationHistory.empty.body")}</p>
    `;
    container.appendChild(emptyMsg);
    return;
  }

  history.forEach(entry => {
    const card = document.createElement("div");
    card.className = "purchase-card"; // 📦 Reuse existing card style

    const label = document.createElement("div");
    label.className = "label";
    label.innerHTML = `<strong>📍 ${entry.coords}</strong>`;

    const timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.textContent = `📅 ${new Date(entry.timestamp).toLocaleString()}`;

    const link = document.createElement("div");
    link.className = "subtext";
    link.innerHTML = `<a href="https://maps.google.com?q=${entry.coords}" target="_blank">${t("locationHistory.openInMaps")}</a>`;

    card.appendChild(label);
    card.appendChild(timestamp);
    card.appendChild(link);
    container.appendChild(card);

    // ↕️ Add vertical spacing between cards
    const spacer = document.createElement("div");
    spacer.style.height = "1em";
    container.appendChild(spacer);
  });
}

// Styles flag icons by setting their title from 2-letter alt text.
// Used in language/country modals for accessibility and hover info.
export function flagStyler() {
  // target the actual flag <img> elements in the language grid
  const flags = document.querySelectorAll(".flag-list img");
  if (!flags.length) return;

  flags.forEach((img) => {
    const alt = img.getAttribute("alt") || "";
    if (alt.length === 2) {
      img.title = alt.toUpperCase();
    }
  });

  console.log("✅ Flags styled using alt attribute.");
}

// Run when user opens Purchase History
const purchaseBtn = document.querySelector("#purchaseHistoryBtn");
if (purchaseBtn) {
  purchaseBtn.addEventListener("click", () => {
    renderPurchaseHistory();
  });
}