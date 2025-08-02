
import {
  buildAccordion,
  createMyStuffModal,
  createDonationModal,
  setupMyStuffModalLogic,
  createShareModal,
  showModal,
  showShareModal,
  createIncomingLocationModal,
  createPinnedModal,
  showMyStuffModal,
  injectModals
} from './modal-injector.js';

import { loadTranslations, t } from "./scripts/i18n.js";

function getUserLang() {
  // Use browser setting or override with ?lang=fr
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  return urlLang || navigator.language.split("-")[0] || "en"; // e.g. "fr"
}

const BACKEND_URL = "https://navigen-payment.onrender.com";
  
async function handleDonation(amount) {
  try {
    const res = await fetch(`${BACKEND_URL}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      showToast("Unable to open checkout.");
    }
  } catch (err) {
    console.error("Donation error:", err);
    showToast("Could not process donation.");
  }
}

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

// ✅ Render ⭐ Popular group
function renderPopularGroup() {
  const container = document.querySelector("#locations");
  if (!container) {
    console.warn('⚠️ #locations not found; skipping Popular group');
    return;
  }

  const popular = geoPoints.filter(loc => loc.Priority === "Yes");
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
  header.style.backgroundColor = "#fff8e1";

// ✅ Unified toggle logic: only one group (popular or accordion) open at a time
header.addEventListener("click", () => {
  const isOpen = header.classList.contains("open");

  // Close all groups first
  document.querySelectorAll('.accordion-body').forEach(b => b.style.display = 'none');
  document.querySelectorAll('.group-buttons').forEach(b => b.classList.add('hidden'));
  document.querySelectorAll('.accordion-button, .group-header-button').forEach(btn => btn.classList.remove('open'));

  // Re-open only if it was NOT already open
  if (!isOpen) {
    buttonContainer.classList.remove('hidden');
    header.classList.add('open');
  }
});

  section.appendChild(header);

  popular.forEach((loc) => {
    const btn = document.createElement("button");
    btn.classList.add("quick-button", "popular-button");
    btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
    btn.setAttribute("data-group", groupKey);
    btn.setAttribute("data-id", loc.ID);

    // ✅ Inject GPS data if available
    if (loc.Latitude && loc.Longitude) {
      btn.setAttribute("data-lat", loc.Latitude);
      btn.setAttribute("data-lng", loc.Longitude);
      btn.title = `Open in Google Maps (${loc.Latitude}, ${loc.Longitude})`;

      // ✅ Click to open Google Maps
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const lat = loc.Latitude;
        const lng = loc.Longitude;
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        window.open(url, "_blank");
      });
    }

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
function colorFromGroup(groupKey) {
  const groupColors = {
    "group.stages": "#ffe3e3",
    "group.activities": "#fff2cc",
    "group.food": "#d9f9d9",
    "group.gates": "#e0f7fa",
    "group.areas": "#ede7f6",
    "group.shops": "#fce4ec",
    "group.spas": "#e3f2fd",
    "group.services": "#f8d7da",
    "group.guests": "#ede7f6",
    "group.transport": "#e1f5fe",
    "group.popular": "#fff8e1" // add this!
  };
  return groupColors[groupKey] || "#f2f2f2";
}

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

    matchingBtn.style.backgroundColor = colorFromGroup(groupKey);

    const sibling = matchingBtn.nextElementSibling;
    if (!sibling || !sibling.classList.contains('accordion-body')) {
      console.warn('⚠️ No matching .accordion-body after button for:', title);
      return;
    }

    // Apply flat 1px tinted border to group children, no background styling
    sibling.querySelectorAll('button').forEach(locBtn => {
      locBtn.classList.add('quick-button', 'location-button');
      locBtn.style.border = `1px solid ${colorFromGroup(groupKey)}`;
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

  // ✅ Start of DOMContent
  // Wait until DOM is fully loaded before attaching handlers
  document.addEventListener('DOMContentLoaded', async () => {
    // 🧹 Clean up any leftover/ghost donation modal before anything runs
    document.getElementById("donation-modal")?.remove();
    
    // 🌐 Detect and apply user's preferred language (from localStorage or browser),
    // then set <html lang="...">, text direction (LTR/RTL), load translations,
    // and inject static UI text content
    const lang = localStorage.getItem("lang") || navigator.language.slice(0, 2).toLowerCase() || "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = ["ar", "he", "fa", "ur", "ps", "ckb", "dv", "syc", "yi"].includes(lang) ? "rtl" : "ltr";
    await loadTranslations(lang);      // ✅ Load selected language

    injectStaticTranslations();        // ✅ Apply static translations

    const [actions, structure, geoPointsData] = await Promise.all([
      fetch('data/actions.json').then(res => res.json()),
      fetch('data/structure.json').then(res => res.json()),
      fetch('data/locations.json').then(res => res.json())
    ]);

    state.actions = actions;
    structure_data = structure;
    geoPoints = geoPointsData;
    
    geoPoints.forEach(p => {
      const groupEntry = structure_data.find(g => g["Drop-down"] === p.Group);
      if (groupEntry) p.Group = groupEntry.Group;
    });    
    
    // Normalize geoPoints group values to match structure_data keys
    geoPoints.forEach(p => {
      const groupEntry = structure_data.find(g => g["Drop-down"] === p.Group);
      if (groupEntry) p.Group = groupEntry.Group;
    });

    renderPopularGroup();
    buildAccordion(structure_data, geoPoints);
    wireAccordionGroups(structure_data); // ✅ Call it right after building accordion

    // ✅ Auto-translate any element with data-i18n="..."
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (key) el.innerHTML = t(key);
    });
    
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
  // 👋 Inject Pin Modal at startup
  injectModals();

  // 📍 Inject Share Modal at startup
  createShareModal();            // Injects #share-location-modal into DOM
  setupTapOutClose("share-location-modal");
  
  createMyStuffModal();
  setupMyStuffModalLogic();
  
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

  function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    localStorage.removeItem('pwaInstalled'); // 👈 reset install flag
    deferredPrompt = e;

    if (headerPin) {
      headerPin.style.display = 'block';
      headerPin.textContent = '📌';
      headerPin.onclick = () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
          if (choiceResult.outcome === 'accepted') {
            localStorage.setItem('pwaInstalled', 'true');
            headerPin.textContent = '👋';
            headerPin.style.display = 'block'; // make sure it's visible again
            headerPin.onclick = () => {
              if (pinnedModal) {
                showPinnedModal();
              }
            };
          } else {
          }
        });
      };
    }
  });

  window.addEventListener('load', () => {
    // 📌 PWA pin logic
    if (headerPin && (isInStandaloneMode() || localStorage.getItem('pwaInstalled') === 'true')) {
      headerPin.style.display = 'block';
      headerPin.textContent = '👋';
      headerPin.onclick = () => {
        showPinnedModal();
      };
    }
    
    if (window.location.search.includes("donation=success")) {
      localStorage.setItem("hasDonated", "true");
      showToast("💖 Thank you for supporting the vibe!");
    }
  });

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
  const shareButton = document.getElementById("location-share-button");
  
  // ✅ Auto-open "Received Location" modal if page was opened from a shared GPS link
  const params = new URLSearchParams(window.location.search);
  const at = params.get("at");

  if (at) {
    createIncomingLocationModal(at);
  }  
  
  if (shareButton && coordsDisplay && locationModal) {
    shareButton.onclick = () => {
      console.log("[Share] Share button clicked");

      const latLon = coordsDisplay.textContent;
      const mapUrl = `https://maps.google.com/?q=${latLon}`;

      // Hide modal
      locationModal.classList.add("hidden");

      if (navigator.share && mapUrl) {
        console.log("[Share] Using navigator.share");
        navigator.share({
          title: "My Location",
          text: "Here's where I am:",
          url: mapUrl,
        })
        .then(() => console.log("[Share] Done"))
        .catch(err => {
          console.log("[Share] Canceled or failed:", err);
          showToast("Share canceled");
        });
      } else {
        console.log("[Share] Fallback to clipboard");
        navigator.clipboard.writeText(mapUrl)
          .then(() => {
            console.log("[Share] Copied");
            showToast("Copied to clipboard");
          })
          .catch(err => {
            console.log("[Share] Clipboard failed:", err);
            showToast("Copy failed");
          });
      }
    };
  }
    
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
              btn.style.border = `1px solid ${colorFromGroup("group.popular")}`;
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

  if (
    hereButton &&
    locationModal &&
    coordsDisplay &&
    shareButton
  ) {
    hereButton.addEventListener("click", () => {
      coordsDisplay.textContent = "Detecting your location...";
      shareButton.classList.add("hidden");

      if (!navigator.geolocation) {
        coordsDisplay.textContent = "Geolocation not supported.";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
          showShareModal(coords);
        },
        () => {
          coordsDisplay.textContent = "Unable to access location.";
          showShareModal("Unable to detect location");  // ✅ fallback
        }
      );
    });
  }

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

  if (helpButton && helpModal) {
    helpButton.addEventListener("click", () => {
      helpModal.classList.remove("hidden");
      setupTapOutClose("help-modal");
    });
  }

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
  
  // ✅ Tap-out + ESC closing support for all front-screen modals
  setupTapOutClose("share-location-modal");
  setupTapOutClose("my-stuff-modal");
  setupTapOutClose("alert-modal");
  setupTapOutClose("help-modal"); 
  
});  // ✅ End of DOMContentLoaded    
  
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

// Consolidated DOMContentLoaded + existing logic
function setupTapOutClose(modalId) {
  const modal = document.getElementById(modalId);
  const overlay = modal?.querySelector(".modal-overlay");
  if (!modal || !overlay) return;

  overlay.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
    }
  });
}

function showToast(message) {
  // Remove any existing toast first
  const oldToast = document.querySelector(".toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  document.body.appendChild(toast);

  // Slight delay for transition (if CSS exists)
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300); // wait for fade-out
  }, 2500);
}

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
  let modal = document.getElementById("pinned-modal");
  if (!modal) {
    createPinnedModal();
    modal = document.getElementById("pinned-modal");
  }

  const content = document.getElementById("pinned-modal-content");
  if (!content) return;

  const hasDonated = localStorage.getItem("hasDonated") === "true";
  const seenPinned = localStorage.getItem("seenPinned") === "true";

  // 👋 First-time tap — show "You're all set" modal
  if (!seenPinned) {
    const html = `
      <h2>${t("pinned.title")}</h2>
      <p>${t("pinned.body")}</p>
      <div class="modal-footer">
        <button class="modal-footer-button">${t("modal.done.resolved")}</button>
      </div>
    `;

    localStorage.setItem("seenPinned", "true");
    content.innerHTML = html;
    modal.classList.remove("hidden");
    modal.style.display = "";

    modal.querySelector(".modal-footer-button")?.addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.style.display = "none";
    });

  } else {
    // 👋 2nd+ tap — show donation modal
    createDonationModal(hasDonated);
    return; // skip rest of this function, donation modal handles its own UI
  }

  // fallback close behaviors
  modal.querySelector(".modal-close")?.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.style.display = "none";
  });

  modal.querySelector("#support-decline")?.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.style.display = "none";
  });

  setupTapOutClose("pinned-modal");
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".donate-btn");
  if (!btn) return;

  const amount = parseInt(btn.dataset.amount);  // ✅ Must be defined
  try {
    await handleDonation(amount);               // ✅ Await the async call
  } catch (err) {
    console.error("Donation error:", err);
    showToast("Could not process donation.");
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