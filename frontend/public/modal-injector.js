/**
 * Factory: build the Location Profile Modal (LPM) element.
 * No event wiring here; just structure. Caller injects & wires.
 *
 * @param {Object} data
 * @param {string} data.id                 // location id
 * @param {string} data.name               // display name
 * @param {number|string} data.lat         // latitude
 * @param {number|string} data.lng         // longitude
 * @param {string} [data.imageSrc]         // optional image URL
 * @param {string} [data.description]      // optional description/teaser
 * @returns {HTMLElement} modalEl
 */
export function createLocationProfileModal(data) {
  // ▸ Modal shell
  const modal = document.createElement('div');
  modal.id = 'location-profile-modal';
  modal.className = 'modal hidden';

  // ▸ Content wrapper
  const content = document.createElement('div');
  content.className = 'modal-content';

  // Top bar: title first, then Close → places the X on the right (matches other modals)
  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-header" aria-live="polite">📍 ${data?.name ?? 'Location'}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  
  /** format description: handle multi-line + empty lines safely */
  function formatDescHTML(s) {
    const esc = (x) => x
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const norm = String(s || '').replace(/\r\n?/g, '\n').trim();
    if (!norm) return '';
    const paras = norm
      .split(/\n{2,}/)                 // empty line(s) → paragraph break
      .map(p => esc(p).replace(/\n/g, '<br>')); // single \n → <br>
    return '<p>' + paras.join('</p><p>') + '</p>';
  }

  /** normalize a descriptions map to { langLower: nonEmptyText } */
  function normalizeDescMap(d) {
    const out = {};
    if (d && typeof d === 'object') {
      Object.keys(d).forEach(k => {
        const kk = String(k || '').toLowerCase().trim();
        const vv = String(d[k] ?? '').trim();
        if (kk && vv) out[kk] = vv;
      });
    }
    return out;
  }

  /** alias payload locally; fill descriptions from payload OR global geoPoints by id */
  const payload = (typeof data === 'object' && data) ? data : {};
  let descs = normalizeDescMap(payload.descriptions);

  // lead: if caller omitted descriptions, try known globals in order.
  // lead: keep legacy ID compatibility; do not mutate incoming objects.
  if (!Object.keys(descs).length && payload.id) {
    const wantId = String(payload.id);

    // 1) geoPoints (may be legacy or unified)
    if (Array.isArray(window.geoPoints)) {
      const found = window.geoPoints.find(x => String(x?.ID || x?.id) === wantId);
      if (found) descs = normalizeDescMap(found.descriptions);
    }

    // 2) profiles.locations (final merged dataset)
    if (!Object.keys(descs).length && window.profiles && Array.isArray(window.profiles.locations)) {
      const found = window.profiles.locations.find(x => String(x?.id) === wantId);
      if (found) descs = normalizeDescMap(found.descriptions);
    }

    // 3) structure_data (if accordion feeds from here)
    if (!Object.keys(descs).length && Array.isArray(window.structure_data)) {
      const found = window.structure_data.find(x => String(x?.id) === wantId);
      if (found) descs = normalizeDescMap(found.descriptions);
    }
  }

  /** map iso code → English name; fallback to code upper */
  function langName(code) {
    const m = {
      en:'English', fr:'French', de:'German', hu:'Hungarian', it:'Italian', he:'Hebrew',
      uk:'Ukrainian', nl:'Dutch', ro:'Romanian', pl:'Polish', cs:'Czech', es:'Spanish',
      sk:'Slovak', da:'Danish', sv:'Swedish', no:'Norwegian', sl:'Slovene', ru:'Russian',
      pt:'Portuguese', is:'Icelandic', tr:'Turkish', zh:'Chinese', el:'Greek',
      bg:'Bulgarian', hr:'Croatian', et:'Estonian', fi:'Finnish', lv:'Latvian',
      lt:'Lithuanian', mt:'Maltese', hi:'Hindi', ko:'Korean', ja:'Japanese', ar:'Arabic'
    };
    return m[String(code || '').toLowerCase()] || String(code || '').toUpperCase();
  }

  /** pick description for current app language; fallback to first available if missing */
  // lead: normalize lang ("en-US" → "en"); if missing, show first available language with a notice.
  const appLangRaw = (document.documentElement?.lang || navigator.language || 'en');
  const appLang = String(appLangRaw).toLowerCase().split('-')[0];

  const allLangs = Object.keys(descs || {}).filter(Boolean);
  const primary = String((descs && descs[appLang]) || '').trim();

  let chosenText = primary;
  let chosenLang = appLang;

  if (!chosenText && allLangs.length) {
    chosenLang = allLangs[0];
    chosenText = String(descs[chosenLang] || '').trim();
  }

  const descKey = 'lpm.description.placeholder';
  const fallbackPlaceholder = '⏳ Description coming soon.';

  // If we still have nothing, keep the placeholder; otherwise use chosen text.
  const usePlaceholder = !chosenText;
  let descHTML;

  if (usePlaceholder) {
    const base = (typeof t === 'function' ? (t(descKey) || fallbackPlaceholder) : fallbackPlaceholder);
    if (allLangs.length) {
      const names = allLangs.map(langName);
      descHTML = formatDescHTML(`${base}\n\nℹ️ Available languages: ${names.join(', ')}`);
    } else {
      descHTML = formatDescHTML(base);
    }
  } else {
    // lead: show description text only; remove the "Showing …" note
    descHTML = formatDescHTML(chosenText);
  }

  // ▸ Body: media + description (5-line clamp + fade handled in CSS)
  const body = document.createElement('div');
  body.className = 'modal-body';
  body.innerHTML = `
    <div class="modal-body-inner">
      <figure class="location-media" aria-label="Location image">
        <img src="${payload.imageSrc || '/assets/placeholder-images/icon-512-green.png'}" 
             alt="${payload.name || 'Location'} image"
             style="width:100%;height:auto;display:block;border-radius:8px;">
      </figure>

      <section class="location-description">
        <div class="description" data-lines="5" data-i18n-key="${usePlaceholder ? descKey : ''}">
          ${descHTML}
        </div>
      </section>

    </div>
  `;

  // ▸ Footer (pinned): primary row (🎯 ⭐ ⋮) + secondary row (ℹ️ 📤 📅 📍)
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  footer.innerHTML = `
    <button class="modal-footer-button" id="lpm-route"
            data-lat="${data?.lat ?? ''}" data-lng="${data?.lng ?? ''}" aria-label="Route">
      🎯 <span>Route</span>
    </button>
    <button class="modal-footer-button" id="lpm-save" aria-label="Save">
      ⭐ <span>Save</span>
    </button>
    <button class="modal-footer-button" id="lpm-overflow" aria-label="More" aria-expanded="false">
      ⋮
    </button>

    <!-- LPM footer secondary row – toggled by ⋮ -->
    <div id="lpm-secondary-actions" aria-hidden="true">
      <button class="modal-footer-button" id="som-info" aria-label="Info">ℹ️ <span>Info</span></button>
      <button class="modal-footer-button" id="som-share" aria-label="Share">📤 <span>Share</span></button>
      <button class="modal-footer-button" id="som-plan" aria-label="Add to Plan">📅 <span>Add to Plan</span></button>
      <button class="modal-footer-button" id="som-nearby" aria-label="Nearby Spots">📍 <span>Nearby Spots</span></button>
    </div>
  `;

  // ▸ Assemble modal
  content.appendChild(top);
  content.appendChild(body);
  content.appendChild(footer);
  modal.appendChild(content);

  return modal;
}

/**
 * Show the Location Profile Modal (LPM).
 * - Removes any existing instance
 * - Creates a new one with createLocationProfileModal(data)
 * - Injects into DOM and wires button handlers
 *
 * @param {Object} data  – same shape as factory
 */
export function showLocationProfileModal(data) {
  // 1. Remove any existing modal
  const old = document.getElementById('location-profile-modal');
  if (old) old.remove();

  // 2. Build fresh modal from factory
  const modal = createLocationProfileModal(data);

  // 3. Append to body (hidden by default)
  document.body.appendChild(modal);
  
  // 🔁 Upgrade placeholder image → slider
  initLpmImageSlider(modal, data);

  // ————————————————————————————
  // LPM image slider (progressive enhancement over the placeholder <img>)
  // ————————————————————————————
  async function initLpmImageSlider(modal, data) {
    const mediaFigure = modal.querySelector('.location-media');
    if (!mediaFigure) return;

    // 0) Find base path from the provided image or default
    const baseSrc = String(data?.imageSrc || '/assets/placeholder-images/icon-512-green.png');
    const dir = baseSrc.replace(/\/[^\/]*$/, '');          // folder only
    const filename = baseSrc.split('/').pop();

    // 1) Build candidate list strictly from explicit sources
    //    a) per-location list: data.images = ["foo.png", "bar.jpg", ...]
    //    b) fallback: all known placeholder icons from assets/placeholder-images/
    const explicit = Array.isArray(data?.images) ? data.images : [];

    // Folder for default placeholders
    const phDir = '/assets/placeholder-images';
    const defaults = [
          'icon-512-grey.png'
        ];

    // Resolve sources
    const baseNames = explicit.length ? explicit : defaults;
    const seen = new Set();
    const candidates = baseNames
      .map(n => (n.includes('/') ? n : `${phDir}/${n}`))
      .filter(src => (seen.has(src) ? false : (seen.add(src), true)));

    // 2) Create slider shell
    const slider = document.createElement('div');
    slider.className = 'lpm-slider';
    slider.setAttribute('role', 'region');
    slider.setAttribute('aria-label', 'location images');

    const track = document.createElement('div');
    track.className = 'lpm-track';
    slider.appendChild(track);

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'lpm-prev';
    prev.setAttribute('aria-label', 'Previous image');
    prev.textContent = '‹';

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'lpm-next';
    next.setAttribute('aria-label', 'Next image');
    next.textContent = '›';

    slider.appendChild(prev);
    slider.appendChild(next);

    // 3) Replace existing <img> with slider
    mediaFigure.innerHTML = '';
    mediaFigure.appendChild(slider);

    // 4) Load images (reuse the list built above)
    const images = candidates;

    if (!images.length) return;

    // ——— double buffer canvas ———
    const canvasA = document.createElement('img');
    const canvasB = document.createElement('img');
    canvasA.className = 'lpm-img active';
    canvasB.className = 'lpm-img';
    track.appendChild(canvasA);
    track.appendChild(canvasB);

    let front = canvasA;           // currently visible <img>
    let back  = canvasB;           // offscreen buffer <img>
    let idx   = 0;                 // current index in images[]
    
    function resolveStartIndex(images, data) {
      if (Number.isInteger(data?.startIndex)) {
        const n = images.length;
        return ((data.startIndex % n) + n) % n; // safe wrap
      }
      if (data?.startImage) {
        const i = images.findIndex(u => u === data.startImage || u.endsWith('/' + data.startImage));
        if (i >= 0) return i;
      }
      if (Array.isArray(data?.media?.images)) {
        const j = data.media.images.findIndex(m => m && typeof m === 'object' && (m.default || m.isDefault));
        if (j >= 0) return j;
      }
      return 0;
    }        

    // tiny LRU cache: remember which URLs we’ve decoded (no blobs kept)
    const decoded = new Map();     // url -> true
    const MAX_CACHE = 8;

    // load into a target <img>; strict candidates only (no extension/name mutations)
    async function loadInto(imgEl, url, loc) {
      const s = String(url || '').trim();
      if (!s) return false;

      // freeze the original filename so we never change extension/casing
      const fname = s.split('/').pop();
      if (!fname) return false;

      const cand = [];
      const add = (u) => { if (u && !cand.includes(u)) cand.push(u); };

      // — Order of attempts (exactly as specified) —
      add(s); // (1) original string
      try {
        const dec = decodeURI(s);
        if (dec !== s) add(dec);       // (2) decoded whole path
      } catch { /* silent */ }
      const enc = encodeURI(s);
      if (enc !== s) add(enc);         // (3) encoded whole path

      // (4) ID-folder fallback with the SAME filename only
      const locId = loc?.id || loc?.ID;
      if (locId) {
        add(`/assets/location-profile-images/${locId}/${fname}`);
        const encF = encodeURI(fname);
        if (encF !== fname) {
          // (5) encoded filename under the ID folder
          add(`/assets/location-profile-images/${locId}/${encF}`);
        }
      }

      // First success wins → probe with <img>, then set src + await decode
      const tryUrl = async (u) => {
        await new Promise((resolve, reject) => {
          const probe = new Image();
          probe.onload = resolve;
          probe.onerror = reject;
          probe.src = u;
        });
        imgEl.src = u;                 // set only after confirmed load
        if ('decode' in imgEl) {
          try { await imgEl.decode(); } catch { /* swallow */ }
        } else if (!imgEl.complete) {
          await new Promise(r => { imgEl.onload = r; imgEl.onerror = r; });
        }
        return true;
      };

      for (let i = 0; i < cand.length; i++) {
        try { return await tryUrl(cand[i]); } catch { /* next */ }
      }

      // Failure fallback: green placeholder once
      imgEl.src = '/assets/placeholder-images/icon-512-green.png';
      return false;
    }

    // keep slider box stable based on first loaded image ratio
    function lockAspectFrom(imgEl) {
      if (!slider.style.aspectRatio && imgEl.naturalWidth && imgEl.naturalHeight) {
        slider.style.aspectRatio = `${imgEl.naturalWidth}/${imgEl.naturalHeight}`;
      }
    }

    // show specific index (wraps), swapping buffers only after next is decoded
    async function show(to) {
      if (!images.length) return;
      const nextIdx = (to + images.length) % images.length;
      const nextUrl = images[nextIdx];

      // decode offscreen
      await loadInto(back, nextUrl, data);

      // first run: lock aspect so text never jumps
      lockAspectFrom(back);

      // crossfade by swapping roles
      back.classList.add('active');
      front.classList.remove('active');
      [front, back] = [back, front];
      idx = nextIdx;

      // opportunistic neighbor prefetch (no heavy preload)
      prefetch(idx + 1);
      prefetch(idx - 1);
    }

    function prefetch(i) {
      const url = images[(i + images.length) % images.length];
      if (decoded.has(url)) return;
      const probe = new Image();
      probe.src = url;
      if (probe.decode) probe.decode().catch(() => {});
      decoded.set(url, true);
      if (decoded.size > MAX_CACHE) decoded.delete(decoded.keys().next().value);
    }

    // init: prime first frame, then neighbor
    idx = resolveStartIndex(images, data);
    await loadInto(front, images[idx], data);
    lockAspectFrom(front);
    prefetch(idx + 1);

    // controls
    prev.addEventListener('click', () => show(idx - 1));
    next.addEventListener('click', () => show(idx + 1));

    // 6) Keyboard and swipe
    slider.tabIndex = 0;
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
    });

    // basic touch swipe
    let startX = null;
    slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 35) (dx > 0 ? prev : next).click();
      startX = null;
    }, { passive: true });
  }
  
    // 4. Wire up buttons (Route, Save, ⋮ toggle, Close, etc.)
  
  // ————————————————————————————
  // LPM button wiring (Route / Save / ⋮ / Close)
  // Call from showLocationProfileModal(modal, data)
  // ————————————————————————————  
  function wireLocationProfileModal(modal, data, originEl) {    

    // 🎯 Route → open Google Maps with provided coords
    const btnRoute = modal.querySelector('#lpm-route');
    if (btnRoute) {
      const lat = String(data?.lat ?? btnRoute.getAttribute('data-lat') ?? '').trim();
      const lng = String(data?.lng ?? btnRoute.getAttribute('data-lng') ?? '').trim();
      btnRoute.setAttribute('data-lat', lat);
      btnRoute.setAttribute('data-lng', lng);
      btnRoute.addEventListener('click', (e) => {
        e.preventDefault();
        if (!lat || !lng) return console.warn('LPM: missing coords');
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
      });
    }

    // ⭐ Save → stub (hook your real flow later)
    const btnSave = modal.querySelector('#lpm-save');
    if (btnSave) {
      btnSave.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('⭐ Save tapped (stub)');
      });
    }

    // × Close → remove modal, return focus to originating trigger if provided
    const btnClose = modal.querySelector('.modal-close');
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        if (originEl && typeof originEl.focus === 'function') originEl.focus();
      });
    }

    // Tap-out + ESC (use your existing helper if available)
    if (typeof setupTapOutClose === 'function') {
      setupTapOutClose('location-profile-modal');
    } else {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') btnClose?.click();
      });
    }

    // Optional: focus management (focus first actionable)
    (modal.querySelector('#lpm-route') ||
     modal.querySelector('#lpm-save')  ||
     btnClose)?.focus?.();
  }

  // call wiring + reveal
  wireLocationProfileModal(modal, data, data?.originEl);
  showModal('location-profile-modal');

  // 5. Reveal modal (remove .hidden, add .visible, focus trap etc.)
  // (done above via showModal)

}

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

// ✅ Store Popular’s original position on page load
let popularBaseOffset = 0;
document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById('locations-scroll');
  const popularHeader = document.querySelector('.group-header-button[data-group="group.popular"]');
  if (scroller && popularHeader) {
    popularBaseOffset = popularHeader.offsetTop;
  }
});

  // Utility: create a location button wired to LPM
  function makeLocationButton(loc) {
    const btn = document.createElement('button');
    btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
    btn.setAttribute('data-id', loc.ID);
    btn.classList.add('location-button');

    const cc = loc["Coordinate Compound"];
    if (typeof cc === "string" && cc.includes(",")) {
      // parse "lat,lng" from sheet-style coord
      const [lat, lng] = cc.split(',').map(s => s.trim());
      btn.setAttribute('data-lat', lat);
      btn.setAttribute('data-lng', lng);
      btn.title = `Open profile / Route (${lat}, ${lng})`;

      btn.addEventListener('click', (e) => {
        e.preventDefault();

        // build gallery: prefer loc.media (cover + images), else placeholder
        const media   = (loc && loc.media) ? loc.media : {};
        const gallery = Array.isArray(media.images) ? media.images : [];
        const images  = gallery
          .map(m => (m && typeof m === 'object') ? m.src : m)
          .filter(Boolean);
        const cover   = (media.cover && String(media.cover).trim())
          ? media.cover
          : (images[0] || '/assets/placeholder-images/icon-512-green.png');

      /** open the Location Profile Modal (modal uses descriptions{lang}; no scalar) */
      showLocationProfileModal({
        // lead: prefer new id → fallback to legacy ID attribute
        id: String(loc?.id ?? btn.getAttribute('data-id') ?? ''),
        name: btn.textContent,
        lat, 
        lng,
        imageSrc: cover,   // first paint
        images,            // slider sources
        media,             // preserves default flag & rightsText per image

        // lead: pass the descriptions map when present; empty object otherwise
        descriptions: (loc && typeof loc.descriptions === 'object') ? loc.descriptions : {},

        originEl: btn
      });


      });
    }
    return btn;
  }


export function buildAccordion(groupedStructure, geoPoints) {
  const container = document.getElementById("accordion");
  if (!container) return;
  container.innerHTML = '';

  const scroller = document.getElementById('locations-scroll');
  let popularTargetTop = null;

  // Capture Popular's position in scroller content coordinates once
  requestAnimationFrame(() => {
    const popularHeader = document.querySelector('.group-header-button[data-group="group.popular"]');
    if (scroller && popularHeader) {
      popularTargetTop = popularHeader.offsetTop;
    }
  });

  groupedStructure.forEach(group => {
    const groupKey = group.groupKey || group.Group;
    const label = group.groupName || group["Drop-down"] || groupKey;

    // visible locations for this group
    const filtered = geoPoints.filter(
      loc => loc.Group === groupKey && loc.Visible === "Yes"
    );

    if (!filtered.length) return;

    // section
    const section = document.createElement("div");
    section.classList.add("accordion-section");

    // header (group button)
    const header = document.createElement("button");
    header.className = "accordion-button group-header-button";
    header.dataset.group = groupKey;

    header.innerHTML = `
      <span class="header-title">${label}</span>
      <span class="header-meta">( ${filtered.length} )</span>
      <span class="header-arrow"></span>
    `;

    // content
    const content = document.createElement("div");
    content.className = "accordion-body";
    content.style.display = "none";

    // --- subgroups or flat list ---
    if (Array.isArray(group.subgroups) && group.subgroups.length) {
      // each subgroup
      group.subgroups.forEach((sub, sIdx) => {
        const subHeader = document.createElement('div');
        subHeader.className = 'subheader';
        subHeader.textContent = sub.key ? (t(sub.key) || sub.name || sub.key) : (sub.name || sub.key);

        const subWrap = document.createElement('div');
        subWrap.className = 'subgroup-items';

        const subLocs = filtered.filter(loc => loc["Subgroup key"] === sub.key);

        // buttons inside subgroup
        subLocs.forEach(loc => {
          subWrap.appendChild(makeLocationButton(loc));
        });

        // initial state + persistence
        const storageKey = `sub:${groupKey}:${sub.key}`;
        const saved = localStorage.getItem(storageKey); // "open" | "closed" | null
        const isOpen = saved ? (saved === "open") : false;

        subHeader.classList.toggle('is-open', isOpen);
        subWrap.classList.toggle('is-collapsed', !isOpen);
        subHeader.setAttribute('aria-expanded', String(isOpen));
        subHeader.dataset.count = subLocs.length;

        const toggleSub = () => {
          const open = subHeader.classList.toggle('is-open');
          subWrap.classList.toggle('is-collapsed', !open);
          subHeader.setAttribute('aria-expanded', String(open));
          localStorage.setItem(storageKey, open ? "open" : "closed");
        };
        subHeader.setAttribute('role', 'button');
        subHeader.tabIndex = 0;
        subHeader.addEventListener('click', toggleSub);
        subHeader.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSub(); }
        });

        content.appendChild(subHeader);
        content.appendChild(subWrap);
      });

      // leftover items (no subgroup)
      const others = filtered.filter(loc => !loc["Subgroup key"]);
      if (others.length) {
        const h = document.createElement('div');
        h.className = 'subheader';
        h.textContent = '-';
        content.appendChild(h);

        const othersWrap = document.createElement('div');
        othersWrap.className = 'subgroup-items';

        // Use LPM instead of direct Google Maps for “others” buttons
        others.forEach(loc => {
          othersWrap.appendChild(makeLocationButton(loc));
        });

        content.appendChild(othersWrap);
      }

    } else {
      // flat list (no subgroups defined)
      // ⬇️ Added: create the container that was being used below
      const flatWrap = document.createElement('div'); // groups without subheaders
      flatWrap.className = 'subgroup-items';
      content.appendChild(flatWrap);

      filtered.forEach(loc => {
        flatWrap.appendChild(makeLocationButton(loc));
      });
    }

    // group toggle (only one open at a time, with scroll correction)
    header.addEventListener("click", () => {
      const wasOpen = header.classList.contains("open");

      // Close all groups
      document.querySelectorAll(".accordion-body").forEach(b => b.style.display = "none");
      document.querySelectorAll(".accordion-button, .group-header-button").forEach(b => b.classList.remove("open"));
      document.querySelectorAll(".group-buttons").forEach(b => b.classList.add("hidden"));

      if (!wasOpen) {
        content.style.display = "block";
        header.classList.add("open");
      }
    });

    section.appendChild(header);
    section.appendChild(content);
    container.appendChild(section);
  });
}

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
// Lead comments: hidden by default; CSS provides backdrop.
export function injectModal({ id, title = '', bodyHTML = '', footerButtons = [], layout = '' }) {
  let existing = document.getElementById(id);
  if (existing) return existing;

  // hidden by default; CSS shows :not(.hidden)
  const modal = document.createElement('div');
  modal.classList.add('modal', 'hidden');
  modal.id = id;

  const isAction = layout === 'action';

  const primary = Array.isArray(footerButtons) ? footerButtons : (footerButtons.primary || []);
  const secondary = Array.isArray(footerButtons) ? [] : (footerButtons.secondary || []);
  const allBtns = [...primary, ...secondary];

  const footerHTML = allBtns.length
    ? `
      <div class="modal-footer">
        ${allBtns.map(btn => `
          <button class="${btn.className || 'modal-footer-button'}" id="${btn.id}">${btn.label}</button>
        `).join('')}
      </div>`
    : '';

  // # No overlay div — CSS-only backdrop on the container
  modal.innerHTML = `
    <div class="modal-content${layout ? ` modal-${layout}` : ''}">
      ${title ? `<h2 class="modal-title">${title}</h2>` : ''}
      <div class="modal-body"><div class="modal-body-inner">${bodyHTML}</div></div>
      ${footerHTML}
    </div>
  `;

  document.body.appendChild(modal);

  const bind = (btn) => { if (btn.onClick) modal.querySelector(`#${btn.id}`)?.addEventListener('click', btn.onClick); };
  if (Array.isArray(footerButtons)) {
    footerButtons.forEach(bind);
  } else {
    primary.forEach(bind);
    secondary.forEach(bind);
  }

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

// Alert modal — same header structure & close button as other modals (top bar outside body)
export function createAlertModal() {
  const existing = document.getElementById("alert-modal");
  if (existing) { showModal("alert-modal"); return; }

  // Build with identical layout to Help/Share so spacing matches
  const modal = injectModal({
    id: "alert-modal",
    title: "",               // header added via .modal-top-bar (avoid double title)
    layout: "action",        // match paddings/flow used by other modals
    // Initial placeholder content; replaced on fetch if alerts load
    bodyHTML: `
      <div id="alert-modal-content" style="text-align:center; padding:1em;">
        <p style="font-size:1.2em;">😌 ${t("alert.none") || "No current alerts."}</p>
        <p style="margin-top:0.5em;">
          ${t("alert.stayTuned") || "Stay tuned — new alerts will appear here when available."}
        </p>
      </div>
    `

  });

  // Top bar (prepend to .modal-content, not inside .modal-body)
  const topBar = document.createElement("div");
  topBar.className = "modal-top-bar";
  topBar.innerHTML = `
    <h2 id="alert-title" class="modal-header">${t("alert.title") || "🚨 Current Alerts"}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector(".modal-content")?.prepend(topBar);

  // Close behavior (same as others)
  topBar.querySelector(".modal-close")?.addEventListener("click", () => hideModal("alert-modal"));

  // Tap-out/ESC (idempotent) + show
  setupTapOutClose("alert-modal");
  showModal("alert-modal");
}

// 🆘 Creates and shows the Help Modal.
// Displays a friendly message for users in need of assistance or emergencies.
// Includes translated text and a Continue button to dismiss or trigger next steps.
// Injected dynamically to keep HTML clean and fully localizable.
// Help modal: same top bar as My Stuff; no legacy overlay; no nested .modal-body-inner
export function createHelpModal() {
  if (document.getElementById("help-modal")) return;

  const modal = injectModal({
    id: "help-modal",
    title: "",             // header rendered via modal-top-bar
    layout: "action",
    bodyHTML: `
      <p class="muted" data-i18n="help.intro">
        Hello! We’re here to assist you. Tap an emergency number to call from your phone.
      </p>

      <p style="text-align:center;margin:0.75em 0;">
        <span class="detected-label" data-i18n="help.detectedRegion">Detected region</span>:
        <strong id="emg-region-label">—</strong>
      </p>

      <div id="emg-buttons" class="community-actions"></div>

      <div style="text-align:center;margin-top:0.75em;">
        <label for="emg-country" class="muted" style="display:block;margin-bottom:0.25em;" data-i18n="help.chooseCountry">
          Choose country
        </label>
        <select id="emg-country" class="emg-scale" style="min-width:220px;"></select>
      </div>

      <p class="muted" style="margin-top:1rem;" data-i18n="help.body">
        We are committed to help you with questions regarding the application.
      </p>

      <p class="muted" style="margin:0.25rem 0 0.75rem;" data-i18n="help.tap">
        Tap for other assistance.
      </p>

      <div style="text-align:center;">
        <button type="button" class="modal-body-button modal-continue" data-i18n="help.continue">
          ➡️ Continue
        </button>
      </div>
    `
  });

  // Top bar (match My Stuff)
  const topBar = document.createElement("div");
  topBar.className = "modal-top-bar";
  topBar.innerHTML = `
    <h2 id="help-title" style="margin:0;">${t("help.title") || "🆘 Emergency Numbers"}</h2>
    <button type="button" class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector(".modal-content")?.prepend(topBar);

  // Close via red X
  topBar.querySelector(".modal-close")?.addEventListener("click", () => hideModal("help-modal"));

  // i18n pass
  (function localizeHelpModal() {
    if (typeof t !== "function") return;
    modal.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      let v; try { v = t(key); } catch { v = null; }
      if (v && v !== key && !/^\[[^\]]+\]$/.test(v)) el.textContent = v;
    });
  })();

  // tap-out + ESC
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

// Lead comments: CSS-only backdrop; inject hidden; no overlay.
// Share modal: same top bar style as My Stuff
export function createShareModal() {
  if (shareModalCreated) return;
  shareModalCreated = true;

  injectModal({
    id: 'share-location-modal',
    layout: 'action',
    title: "", // header rendered via modal-top-bar (avoid double title)
    bodyHTML: `
      <p class="muted">${t("share.intro") || "You can share your current location with a friend:"}</p>
      <p class="share-note">${t("share.note") || "📱 Works best via <strong>WhatsApp</strong>"}</p>
      <p id="share-location-coords" class="location-coords">📍 Loading…</p>
      <div class="modal-actions">
        <button class="modal-body-button" id="share-location-button">${t("share.button")}</button>
      </div>
    `
  });

  const modal = document.getElementById("share-location-modal");
  modal.classList.add("hidden"); // keep hidden until showShareModal()

  // 🔹 Top bar (match My Stuff)
  const topBar = document.createElement("div");
  topBar.className = "modal-top-bar";
  topBar.innerHTML = `
    <h2 id="share-title" class="modal-header">${t("share.button")}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector(".modal-content")?.prepend(topBar);

  // Close via red X
  topBar.querySelector(".modal-close")?.addEventListener("click", () => hideModal("share-location-modal"));

  // Share action
  modal.querySelector("#share-location-button")?.addEventListener("click", handleShare);

  // Tap-out + ESC (uses overlay from layout:"action")
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
// Lead comments: close on container click or ESC; no overlay needed.
// tap-out closes only when clicking the container (not inner content)
export function setupTapOutClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const onBackdropClick = (e) => {
    if (e.target === modal) modal.classList.add('hidden'); // click exactly on backdrop
  };

  // avoid duplicate handlers on repeated calls
  modal.removeEventListener('click', onBackdropClick);
  modal.addEventListener('click', onBackdropClick, { passive: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }
  });
}

// 🎁 Creates and shows the donation modal.
// Accepts `isRepeat = true` if the user has already donated,
// which adjusts the text to a thank-you prompt with the option to give again.
// Reuses translation keys and handles modal injection, button actions, and close behavior.
// Donation modal: My Stuff–style top bar + red X; unified backdrop
export function createDonationModal(isRepeat = false) {
  if (document.getElementById("donation-modal")) { showModal("donation-modal"); return; }

  const title = isRepeat ? t("donation.thanks.title") : t("donation.title");
  const intro = isRepeat ? t("donation.thanks.body")  : t("donation.intro");
  const declineLabel = isRepeat ? t("donation.thanks.decline") : t("donation.btn.decline.first");

  const modal = injectModal({
    id: "donation-modal",
    title: "",                        // header rendered via modal-top-bar
    layout: "action",
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
    `
  });

  // Top bar matching My Stuff
  const topBar = document.createElement("div");
  topBar.className = "modal-top-bar";
  topBar.innerHTML = `
    <h2 class="modal-header">${title}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector(".modal-content")?.prepend(topBar);

  // Close via red X and Decline
  topBar.querySelector(".modal-close")?.addEventListener("click", () => hideModal("donation-modal"));
  modal.querySelector("#donation-decline")?.addEventListener("click", () => hideModal("donation-modal"));

  // Donate buttons
  modal.querySelectorAll(".donate-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const amount = parseInt(btn.dataset.amount);
      await handleDonation(amount);
    });
  });

  setupTapOutClose("donation-modal");
  showModal("donation-modal");
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