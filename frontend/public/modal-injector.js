// analytics: unified endpoint; always use live worker for all environments
const TRACK_BASE = 'https://navigen-api.4naama.workers.dev';

// Resolve slug → canonical ULID via stats; returns '' if cannot resolve.
// keeps ULID canonical across app while allowing slug inputs from UI.
async function resolveULIDFor(idOrSlug) {
  const s = String(idOrSlug || '').trim();
  const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  if (!s) return '';
  if (ULID.test(s)) return s;

  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  try {
    const url = `${TRACK_BASE}/api/stats?locationID=${encodeURIComponent(s)}&from=${iso(today)}&to=${iso(today)}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) return '';
    const j = await r.json().catch(() => null);
    const uid = String(j?.locationID || '').trim();
    return ULID.test(uid) ? uid : '';
  } catch { return ''; }
}

// cache + resolve alias → ULID via Worker; keeps all beacons canonical
// ULID-only: client resolver removed; all callers must pass a ULID.
// ULID-only: resolver removed by design; no slug resolution on client.

function _track(locId, event, action) { // resolve → ULID; map legacy 'route' → 'map'
  (async () => {
    const uid = String(locId || '').trim(); if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(uid)) return;
    const ev0 = String(event || '').toLowerCase().replaceAll('_','-');
    const ev  = (ev0 === 'route') ? 'map' : ev0; // Worker allows 'map', not 'route'
    const payload = {
      locationID: uid,
      event: ev,
      action: String(action || '').toLowerCase().replaceAll('_','-'),
      lang: document.documentElement.lang || 'en',
      pageKey: location.pathname.replace(/^\/(?:[a-z]{2}\/)?/, ''),
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    };
    try {
      navigator.sendBeacon(`${TRACK_BASE}/api/track`, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    } catch {}
  })();
}

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
export function createLocationProfileModal(data, injected = {}) {
  // injected datasets only; no window access
  const { geoPoints = [], profiles = null, structureData = injected.structure_data ?? [] } = injected;
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
  const displayName = String(data?.displayName ?? data?.name ?? 'Location'); // location title only
  top.innerHTML = `
      <h2 class="modal-header" aria-live="polite">📍 ${displayName}</h2>
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

  // If descriptions are missing, use injected sources in order.
  // Keep legacy ID comparison; do not mutate incoming objects.
  if (!Object.keys(descs).length && payload.id) {
    const wantId = String(payload.id);

    // 1) geoPoints (may be legacy or unified) — injected
    if (Array.isArray(geoPoints)) {
      const found = geoPoints.find(x => String(x?.ID || x?.locationID || x?.id) === wantId); // new id too
      if (found) descs = normalizeDescMap(found.descriptions);
    }

    // 2) profiles.locations (final merged dataset) — injected
    if (!Object.keys(descs).length && profiles && Array.isArray(profiles.locations)) {
      const found = profiles.locations.find(x => String(x?.locationID || x?.id) === wantId); // accept new key
      if (found) descs = normalizeDescMap(found.descriptions);
    }

    // 3) structureData (if accordion feeds from here) — injected
    if (!Object.keys(descs).length && Array.isArray(structureData)) {
      const found = structureData.find(x => String(x?.locationID || x?.id) === wantId); // accept new key
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

  // Rootize hero src; prefer media.cover → imageSrc. No placeholders.
  const body = document.createElement('div');
  body.className = 'modal-body';

  const heroSrc = (() => {
    const raw = String((payload?.media?.cover || payload.imageSrc || '')).trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) return raw;
    if (/^assets\//i.test(raw)) return '/' + raw.replace(/^\/?/, '');
    return raw;
  })();

  body.innerHTML = `
    <div class="modal-body-inner">
      <figure class="location-media" aria-label="Location image" style="position:relative;">
        <img src="${heroSrc || ''}"
             alt="${payload.name || 'Location'} image"
             style="width:100%;height:auto;border-radius:8px;${heroSrc ? 'display:block;' : 'display:none;'}">
      </figure>

      ${
        (Array.isArray(payload?.tags) && payload.tags.length)
          ? (() => {
              const chips = payload.tags
                .map(tag => `<span class="tag-chip" data-tag="${String(tag).trim()}">${String(tag).trim()}</span>`)
                .join('');
              return `<section class="location-tags"><div class="tag-chips">${chips}</div></section>`;
            })()
          : ''
      }

      <section class="location-description">
        <div class="description" data-lines="5" data-i18n-key="${usePlaceholder ? descKey : ''}">
          ${descHTML}
        </div>
      </section>
    </div>
  `;

  // add compact 1–5 rating row (emoji radios)
  // rating row under description
  const inner = body.querySelector('.modal-body-inner');
  if (inner) {
    const rate = document.createElement('section');
    rate.className = 'lpm-rating';
    rate.id = 'lpm-rate-section';

    rate.innerHTML = `
      <div id="lpm-rate-group" class="rate-row" role="radiogroup" aria-label="Rate">
        <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="1 of 5">😕</button>
        <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="2 of 5">😐</button>
        <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="3 of 5">🙂</button>
        <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="4 of 5">😄</button>
        <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="5 of 5">🤩</button>
      </div>
      <div class="rate-hint" aria-live="polite"></div>
    `;
    inner.appendChild(rate);
  }

  // ▸ Footer (pinned): primary (🏷️ 📅 ⭐ 🔳 ⋮) + secondary (🎯 ℹ️ 📡 🌍 📣 📤)  // define footer first
  const footerEl = document.createElement('div');
  footerEl.className = 'modal-footer cta-compact';
  footerEl.innerHTML = `
    <!-- Row 1: 🏷️ 📅 ⭐ 🔳 ⋮ -->
    <button class="modal-footer-button" id="lpm-tag" aria-label="Tag">
      🏷️ <span class="cta-label">Tag</span>
    </button>

    <button class="modal-footer-button" id="lpm-book" aria-label="Book">
      <span class="cta-label">Book</span>📅
    </button>

    <button class="modal-footer-button" id="lpm-save" aria-label="Save">
      ⭐ <span class="cta-label">Save</span>
    </button>

    <button class="modal-footer-button" id="lpm-overflow" aria-label="More" aria-expanded="false">
      ⋮ <span class="cta-label">More</span>
    </button>

    <!-- Row 2 (secondary tray): 🎯 ℹ️ 📡 🌍 📣 📤 -->
    <div id="lpm-secondary-actions" aria-hidden="true">
      <button class="modal-footer-button" id="lpm-route"
              data-lat="${data?.lat ?? ''}" data-lng="${data?.lng ?? ''}" aria-label="Navigate">
        🎯 <span class="cta-label">Navigate</span>
      </button>

      <button class="modal-footer-button" id="som-info" aria-label="Info">
        ℹ️ <span class="cta-label">Info</span>
      </button>

      <!-- new empty placeholder -->
      <button class="modal-footer-button" id="som-signal" aria-label="Signal">
        📡 <span class="cta-label">Signal</span>
      </button>

      <button class="modal-footer-button" id="som-social" aria-label="Social Channels">
        🌍 <span class="cta-label">Social</span>
      </button>

      <!-- new empty placeholder -->
      <button class="modal-footer-button" id="som-announce" aria-label="Announcements">
        📣 <span class="cta-label">Announcements</span>
      </button>

      <button class="modal-footer-button" id="som-share" aria-label="Share">
        📤 <span class="cta-label">Share</span>
      </button>

      <!-- 📈 Dashboard (2nd row, last position) -->
      <button class="modal-footer-button" id="som-stats" aria-label="Statistics">
        📈 <span class="cta-label">Stats</span>
      </button>

    </div>
  `;

  // ▸ Assemble modal
  content.appendChild(top);
  content.appendChild(body);
  content.appendChild(footerEl);
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
export async function showLocationProfileModal(data) {
  // keep ULID canonical; do not overwrite with slug
  const locULID = String(data?.locationID || '').trim();
  const lpmId   = String(data?.id || locULID).trim(); // used only for LPM beacons/fallback

  // 1. Remove any existing modal
  const old = document.getElementById('location-profile-modal');
  if (old) old.remove();

  // 2. Do not rewrite slug before creating the modal (allow brand alias or short slug as provided)
  {
    // Keep incoming dataset values as-is:
    // - data.id stays the canonical ULID (if present) for counting beacons
    // - data.locationID may be a brand alias or a shortened slug
    // No normalization here; handlers will prefer a non-ULID alias for dashboard.
  }

  // 3. Build fresh modal from factory (now seeded with short slug)
  const modal = createLocationProfileModal(data);

  // 4. Append to body and expose identifier to handlers (prefer alias for URL; fallback to short; never cache ULID)
  document.body.appendChild(modal);
  // Keep data.* intact; only cache the dataset slug for click handlers (no alias/short selection).
  {
    const pref   = String(data?.locationID || '').trim();
    const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(pref);
    const chosen = (!isUlid && pref) ? pref : ''; // cache only a human slug; never a ULID
    if (chosen) modal.setAttribute('data-locationid', chosen);
  }

  // Prefetch cover fast; avoid placeholder first paint
  ;(async () => {
    try {
      // use locationID fallback; avoids bad loc_* lookups
      const id = String(data?.id || data?.locationID || '').trim();
      const need = false; // no prefetch: cover is authoritative

      if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(id) && need) {
        const r = await fetch(
          API(`/api/data/profile?id=${encodeURIComponent(id)}`),
          { cache: 'no-store', credentials: 'include' }
        );

        if (r.ok) {
          const p = await r.json();
          const raw = String(p?.media?.cover || '').trim();
          if (raw) {
            const coverUrl =
              (/^https?:\/\//i.test(raw) || raw.startsWith('/')) ? raw
              : (/^assets\//i.test(raw) ? '/' + raw.replace(/^\/?/, '') : raw);

            data.media = p.media || data.media || {};
            data.media.cover = coverUrl;
            data.imageSrc = coverUrl;

            const hero = modal.querySelector('.location-media img');
            
            // no-op: green cover is authoritative now
          }
        }
      }
    } catch {}
  })();

  // 🔁 Upgrade placeholder image → slider (deferred)
  ;(async () => {
    // heal hero if decode fails; keep locale unless broken
    const hero = modal.querySelector('.location-media img');
    // guard: if hero is a placeholder, skip healing (still init slider)
    const heroIsPlaceholder = false; // treat any cover as valid
    
    const id = String(data?.id || '').trim();
    const tryImg = (u) => new Promise(r => { if(!u) return r(false); const p=new Image(); p.onload=()=>r(u); p.onerror=()=>r(false); p.src=u; });
    if (hero) {
      if (!hero.complete || !hero.naturalWidth) await new Promise(r=>setTimeout(r,200));
      if (!hero.naturalWidth) {
        const src = hero.getAttribute('src') || '';
        const fname = src.split('/').pop() || '';
        const variants = [
          src,
          src.replace(/^\/([a-z]{2})(?:-[A-Za-z]{2})?\/assets\//i, '/assets/'),
          /^assets\//i.test(src) ? '/' + src.replace(/^\/?/, '') : '',
          (id && fname) ? `/assets/location-profile-images/${id}/${fname}` : ''
        ].filter(Boolean);
        for (const v of variants) { const ok = await tryImg(v); if (ok) { hero.src = ok; break; } }
      }
      if (!hero.complete || !hero.naturalWidth) {
        await new Promise(r => {
          const done = () => r();
          hero.addEventListener('load', done, { once:true });
          hero.addEventListener('error', done, { once:true });
          setTimeout(done, 250);
        });
      }
    }
    if (!modal.dataset.lpmInit) { // start once
      modal.dataset.lpmInit = '1';
      initLpmImageSlider(modal, data);
    }
  })();

    // call wiring + reveal
    wireLocationProfileModal(modal, data, data?.originEl);
    showModal('location-profile-modal');  
}    

// ————————————————————————————
// LPM image slider (progressive enhancement over the placeholder <img>)
// ————————————————————————————
async function initLpmImageSlider(modal, data) {
  const mediaFigure = modal.querySelector('.location-media');
  if (!mediaFigure) return;

  // Use the provided cover/imageSrc as-is (green PNG is a valid cover)
  const cover = String(data?.media?.cover || data?.imageSrc || '').trim();


  // helpers (no guessing)
  const uniq = (a) => Array.from(new Set(a.filter(Boolean)));
  const getDir = (url) => {
    try { const p = new URL(url, location.href).pathname; return p.slice(0, p.lastIndexOf('/')); }
    catch { return String(url||'').replace(/\/[^\/]*$/, ''); }
  };
  // Reason: rootize assets/ → /assets/ so it doesn't inherit /en/... prefix.
  const absFrom = (dir) => (v) => {
    const s = String(v || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith('/')) return s;
    if (/^assets\//i.test(s)) return '/' + s.replace(/^\/?/, '');
    return dir ? `${dir}/${s}` : s;
  };

  const loadOK = (u) => new Promise(res => {     // strict loader (no alt candidates)
    if (!u) return res(false);
    const im = new Image();
    im.onload  = () => res(true);
    im.onerror = () => res(false);
    im.src = u;
  });

  // explicit list from profiles.json; prefer data.images, else media.images (no guessing)
  const explicitRaw = Array.isArray(data?.images)
    ? data.images.map(m => (m && typeof m === 'object' ? m.src : m)).filter(Boolean)
    : (Array.isArray(data?.media?.images) ? data.media.images.map(m => (m && typeof m === 'object' ? m.src : m)).filter(Boolean) : []);

  const dir = getDir(cover);
  const toAbs = absFrom(dir);
  
  // candidates = cover + explicit (same-dir resolution for relatives)
  const candidates = uniq([cover, ...explicitRaw.map(toAbs)]);

  // candidates = cover + explicit (same-dir resolution for relatives)
  /* (placeholder filtering removed; green covers are valid) */

  // Build initial playlist from candidates (cover + explicit)
  let playlist = candidates.slice();

  // Fallback: if <2, pull images from the profile API once (prod-safe).
  if (playlist.length < 2 && data?.id && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(String(data.id))) {
    try {
      const r = await fetch(API(`/api/data/profile?id=${encodeURIComponent(data.id)}`), { cache: 'no-store', credentials: 'include' }); // use Worker
      if (r.ok) {
        const p = await r.json();
        const dir2 = getDir(String(p?.media?.cover || cover));           // keep: resolve relatives near cover
        const toAbs2 = (v) => {
          const s = String(v || '').trim();
          if (!s) return '';
          if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
          if (/^assets\//i.test(s)) return '/' + s.replace(/^\/?/, '');
          return dir2 ? `${dir2}/${s}` : s;
        };
        const extras = Array.isArray(p?.media?.images) ? p.media.images : [];
        const addl   = extras.map(m => (m && typeof m === 'object' ? m.src : m)).filter(Boolean).map(toAbs2);
        playlist = uniq([cover, ...addl]);
      }
    } catch { /* ignore; arrows may no-op */ }
  }

  // Respect data strictly; no placeholders. Single-image mode is allowed.
  if (playlist.length < 2) { /* leave as-is; arrows may no-op */ }

  // Always build the slider shell so arrows+fullscreen exist even with 1 image
  const slider = document.createElement('div');
  slider.style.position = 'relative';

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

  // minimal inline styles so arrows are visible without extra CSS
  const styleArrow = (btn, side) => {
    btn.style.position = 'absolute';
    btn.style.top = '50%';
    btn.style.transform = 'translateY(-50%)';
    btn.style[side] = '8px';
    btn.style.zIndex = '2';
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.style.borderRadius = '9999px';
    btn.style.border = '0';
    btn.style.background = 'rgba(0,0,0,0.45)';
    btn.style.color = '#fff';
    btn.style.fontSize = '20px';
    btn.style.lineHeight = '36px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.cursor = 'pointer';
    btn.style.userSelect = 'none';
  };
  styleArrow(prev, 'left');
  styleArrow(next, 'right');

  slider.appendChild(prev);
  slider.appendChild(next);
  
  // disable nav when fewer than 2 real images (strict data contract)
  if (playlist.length < 2) {
    prev.disabled = true; next.disabled = true;
    prev.style.opacity = '0.35'; next.style.opacity = '0.35';
    prev.style.pointerEvents = 'none'; next.style.pointerEvents = 'none';
  }    

  // Tap-to-fullscreen on image; no !important; remove on exit
  (function enableFullscreen(sliderEl){
    if (!sliderEl || !sliderEl.requestFullscreen) return;
    const applyFs = () => {
      sliderEl.style.background = '#000';
      sliderEl.style.position = 'fixed';
      sliderEl.style.inset = '0';
      sliderEl.style.zIndex = '9999';
      sliderEl.style.width = '100vw';
      sliderEl.style.height = '100vh';
      sliderEl.querySelectorAll('.lpm-img').forEach(img => {
        img.style.objectFit = 'contain';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.background = '#000';
      });
    };
    const clearFs = () => {
      sliderEl.removeAttribute('style');
      sliderEl.querySelectorAll('.lpm-img').forEach(img => {
        img.style.objectFit = '';
        img.style.width = '';
        img.style.height = '';
        img.style.background = '';
      });
    };
    sliderEl.addEventListener('click', (ev) => {
      const onImg = ev.target?.classList?.contains('lpm-img');
      const onNav = ev.target?.classList?.contains('lpm-prev') || ev.target?.classList?.contains('lpm-next');
      if (!onImg || onNav) return;
      if (document.fullscreenElement === sliderEl) document.exitFullscreen?.();
      else sliderEl.requestFullscreen().then(applyFs).catch(()=>{});
    }, { passive: true });
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement === sliderEl) applyFs(); else clearFs();
    });
  })(slider);

  // replace single <img> with slider
  mediaFigure.innerHTML = '';
  mediaFigure.appendChild(slider);

  // double-buffer; no placeholder injections
  const canvasA = document.createElement('img');
  const canvasB = document.createElement('img');
  canvasA.className = 'lpm-img active';
  canvasB.className = 'lpm-img';
  track.appendChild(canvasA);
  track.appendChild(canvasB);
  
  // removed placeholder src guard — green cover is a valid image now

  // baseline layout so swap is visible without external CSS
  track.style.display = 'grid';
  [canvasA, canvasB].forEach(img => {
    img.style.gridArea = '1 / 1';   // stack
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'cover';
    img.style.opacity = '0';
    img.style.transition = 'opacity .24s ease';
  });
  canvasA.style.opacity = '1';

  let front = canvasA;
  let back  = canvasB;

  const lockAspectFrom = (imgEl) => {
    if (!slider.style.aspectRatio && imgEl.naturalWidth && imgEl.naturalHeight) {
      slider.style.aspectRatio = `${imgEl.naturalWidth}/${imgEl.naturalHeight}`;
    }
  };
  
  // Reason: try encoded/decoded + ID-folder variants so prod URLs resolve reliably.
  async function loadInto(imgEl, url, loc) {
    const s = String(url || '').trim();
    // never attempt placeholder/icon candidates at all
    if (!s) return false;

    // allow PNG/JPG/WebP, including green cover

    const fname = s.split('/').pop();
    if (!fname) return false;

    const cand = [];
    const add = (u) => { if (u && !cand.includes(u)) cand.push(u); };

    // 1) as-is
    add(s);

    // 1b) rootize assets/ → /assets/ (avoid /en/.../assets/ 404)
    // Reason: ensure same-origin absolute path for gallery items.
    if (/^assets\//i.test(s)) {
      const rootized = '/' + s.replace(/^\/?/, '');
      add(rootized);
    }

    // 1c) strip "/xx/assets/" → "/assets/" (handles en/hu prefixes)
    {
      const m = s.match(/^\/([a-z]{2})(?:-[A-Za-z]{2})?\/assets\/(.+)$/i);
      if (m) add('/assets/' + m[2]);
    }

    // 2) decoded whole path
    try { const dec = decodeURI(s); if (dec !== s) add(dec); } catch {}

    // 3) encoded whole path
    const enc = encodeURI(s);
    if (enc !== s) add(enc);

    // 4) /assets/location-profile-images/<id>/<filename>
    const locId = loc?.id || loc?.ID;
    if (locId) {
      add(`/assets/location-profile-images/${locId}/${fname}`);
      const encF = encodeURI(fname);
      if (encF !== fname) add(`/assets/location-profile-images/${locId}/${encF}`);
    }

    // Reason: only resolve when the actual <img> has painted pixels
    const tryUrl = (u) => new Promise((resolve, reject) => {
      const onLoad = () => {
        imgEl.removeEventListener('load', onLoad);
        imgEl.removeEventListener('error', onError);
        return (imgEl.naturalWidth > 0) ? resolve(true) : reject(new Error('no pixels'));
      };
      const onError = () => {
        imgEl.removeEventListener('load', onLoad);
        imgEl.removeEventListener('error', onError);
        reject(new Error('img error'));
      };
      imgEl.addEventListener('load', onLoad, { once: true });
      imgEl.addEventListener('error', onError, { once: true });
      imgEl.src = u;
      if (imgEl.complete) onLoad(); // cached path
    });

    for (let i = 0; i < cand.length; i++) {
      try { return await tryUrl(cand[i]); } catch {}
    }

    // Do not swap in placeholders; keep current frame
    return false;
  }

  let idx = Math.max(0, playlist.indexOf(cover));
  /* seed front with the known cover so the slider never starts blank */
  front.src = playlist[idx] || playlist[0] || cover || '';
  loadInto(front, playlist[idx] || playlist[0] || '', data);

  lockAspectFrom(front);

  async function show(to) {
    const count = playlist.length || 1;
    let attempts = 0;
    let nextIdx = (to + count) % count;
    let ok = false;
    while (attempts < count && !ok) {
      const nextUrl = playlist[nextIdx] || '';

      // Reason: skip no-op swaps to the same image
      if ((front.currentSrc || front.src) === nextUrl) {
        nextIdx = (nextIdx + Math.sign(to || 1) + count) % count;
        attempts++;
        continue;
      }
            
      // eslint-disable-next-line no-await-in-loop
      ok = await loadInto(back, nextUrl, data); // pass location payload so ID-based candidates can resolve

      if (!ok) { nextIdx = (nextIdx + Math.sign(to || 1) + count) % count; attempts++; }
    }
    if (!ok) return;
    lockAspectFrom(back);

    // fade swap (works without external CSS)
    back.style.opacity = '1';
    front.style.opacity = '0';

    back.classList.add('active');
    front.classList.remove('active');
    [front, back] = [back, front];
    idx = nextIdx;
  }

  // controls (keep image after tap; stop bubbling + debounce)
  let lpmNavBusy = false; // local to slider
  const onNav = (delta) => async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (lpmNavBusy) return;
    lpmNavBusy = true;
    try { await show(idx + delta); } finally { lpmNavBusy = false; }
  };
  // capture ensures our stopPropagation runs before any outer listener
  prev.addEventListener('click', onNav(-1), { capture: true });
  next.addEventListener('click', onNav(1),  { capture: true });
  // avoid pointerdown→click bubbling that re-inits the modal
  prev.addEventListener('pointerdown', (e) => e.stopPropagation(), { capture: true, passive: true });
  next.addEventListener('pointerdown', (e) => e.stopPropagation(), { capture: true, passive: true });

  slider.tabIndex = 0;
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
  });
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
    // 🎯 Route → open Navigation modal (same header/close style as QR)
    const btnRoute = modal.querySelector('#lpm-route');
    if (btnRoute) {
      btnRoute.addEventListener('click', (e) => {
        e.preventDefault();
        const latRaw = data?.lat ?? btnRoute.getAttribute('data-lat');
        const lngRaw = data?.lng ?? btnRoute.getAttribute('data-lng');
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { showToast('Missing coordinates', 1600); return; }
        // server counts via /out/map on click; no client beacons
        createNavigationModal({
          name: String(data?.name || 'Location'),
          lat, lng,
          id: String(data?.id || data?.locationID || '').trim() // pass LPM id for tracking
        });
      }, { passive: false });
    }

    // 📅 Book → ONLY open links.bookingUrl; else toast (no legacy, no contact API)
    // Guard: mark once so later code (e.g., onclick fallback) can skip re-binding.
    const btnBook = modal.find ? modal.find('#lpm-book') : modal.querySelector('#lpm-book');
    if (btnBook) {
      if (btnBook.dataset.lpmWired === '1') return; // already wired elsewhere
      if (typeof btnBook.onclick === 'function') return; // keep existing guard

      const bookingUrl = String(data?.links?.bookingUrl || '').trim();

      if (bookingUrl) {
        btnBook.removeAttribute('href');
        btnBook.addEventListener('click', async (e) => {
          e.preventDefault();
          const raw = String(data?.id || data?.locationID || '').trim();
          const uid = await resolveULIDFor(raw);
          const url = uid
            ? `${TRACK_BASE}/out/booking/${encodeURIComponent(uid)}?to=${encodeURIComponent(bookingUrl)}`
            : bookingUrl; // fallback: open directly if ULID not resolvable
          window.open(url, '_blank', 'noopener,noreferrer');
        }, { capture: true });
        btnBook.dataset.lpmWired = '1'; // ← mark bound

      } else {
        btnBook.addEventListener('click', (e) => {
          e.preventDefault();
          showToast('Booking link coming soon', 1600);
        }, { passive: false });
        btnBook.dataset.lpmWired = '1'; // ← mark bound
      }
    }

    // ℹ️ → Business Card modal (same layout as QR; data-only body)
    {
      const btn = modal.querySelector('#som-info');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const id = 'bizcard-modal'; document.getElementById(id)?.remove();

          const wrap = document.createElement('div'); wrap.className = 'modal visible'; wrap.id = id;
          const card = document.createElement('div'); card.className = 'modal-content modal-layout';
          const top  = document.createElement('div'); top.className = 'modal-top-bar';
          top.innerHTML = `<h2 class="modal-title">Business Card</h2><button class="modal-close" aria-label="Close">&times;</button>`;
          top.querySelector('.modal-close')?.addEventListener('click', () => wrap.remove());

          const body  = document.createElement('div'); body.className = 'modal-body';
          const inner = document.createElement('div'); inner.className = 'modal-body-inner';

          // prefer contactInformation only
          const contactPerson = String(data?.contactInformation?.contactPerson || '').trim(); // contact person only
          const phone = String(data?.contactInformation?.phone || '').trim();
          const email = String(data?.contactInformation?.email || '').trim();

          if (contactPerson)  { const p = document.createElement('p'); p.textContent = contactPerson;  inner.appendChild(p); }
          if (phone) { const p = document.createElement('p'); p.textContent = phone; inner.appendChild(p); }
          if (email) { const p = document.createElement('p'); p.textContent = email; inner.appendChild(p); }
          if (!inner.children.length) { const p = document.createElement('p'); p.textContent = ''; inner.appendChild(p); } // no labels

          // 🔳 append QR row under Info, then existing inner
          const qrRow = document.createElement('div');
          qrRow.className = 'modal-menu-list';
          qrRow.innerHTML = `
            <button type="button" class="modal-menu-item" id="som-info-qr">
              <span class="icon-img">🔳</span><span>QR code</span>
            </button>
          `;
          inner.appendChild(qrRow);
          body.appendChild(inner);

          // open the same QR modal as before (moved here)
          qrRow.querySelector('#som-info-qr')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            const uidRaw = String(data?.locationID || data?.id || '').trim();
            const uid = uidRaw || String(document.getElementById('location-profile-modal')?.getAttribute('data-locationid') || '').trim();
            if (!uid) { showToast('Missing id', 1600); return; }

            const id = 'qr-modal'; document.getElementById(id)?.remove();
            const wrap = document.createElement('div'); wrap.className = 'modal visible'; wrap.id = id;
            const card = document.createElement('div'); card.className = 'modal-content modal-layout';
            const top = document.createElement('div'); top.className = 'modal-top-bar';
            top.innerHTML = `<h2 class="modal-title">QR Code</h2><button class="modal-close" aria-label="Close">&times;</button>`;
            top.querySelector('.modal-close')?.addEventListener('click', () => wrap.remove());

            const body = document.createElement('div'); body.className = 'modal-body';
            const inner = document.createElement('div'); inner.className = 'modal-body-inner';

            const img = document.createElement('img');
            img.alt = 'QR Code';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';

            const slugOrId = String(data?.locationID || data?.id || uid || '').trim();

            // Prefer qrUrl from the dataset; fall back to ?lp=<id> on the current origin
            const qrPayload = (data && typeof data.qrUrl === 'string' && data.qrUrl.trim())
              ? data.qrUrl.trim()
              : `${location.origin}/?lp=${encodeURIComponent(slugOrId)}`;

            QRCode.toDataURL(qrPayload, { width: 512, margin: 1 })
              .then((dataUrl) => {
                img.src = dataUrl;
              })
              .catch((err) => {
                console.warn('QR generation failed', err);
                img.alt = 'QR unavailable';
              });

            const actions = document.createElement('div');
            actions.className = 'modal-footer cta-compact';

            const shareBtn = document.createElement('button');
            shareBtn.className = 'modal-footer-button';
            shareBtn.type = 'button';
            shareBtn.setAttribute('aria-label', 'Share');
            shareBtn.title = 'Share';
            shareBtn.innerHTML = '📤 <span class="cta-label">Share</span>';
            shareBtn.onclick = async () => {
              const idStr = String(data?.id||'').trim();
              if (idStr) { try { const __uid = await resolveULIDFor(idStr); if (__uid) await fetch(`${TRACK_BASE}/hit/share/${encodeURIComponent(__uid)}`, { method:'POST', keepalive:true }); } catch {} }
              try { if (navigator.share) await navigator.share({ title: 'NaviGen QR', url: img.src }); } catch {}
            };

            const printBtn = document.createElement('button');
            printBtn.className = 'modal-footer-button';
            printBtn.type = 'button';
            printBtn.setAttribute('aria-label', 'Print');
            printBtn.title = 'Print';
            printBtn.innerHTML = '🖨️ <span class="cta-label">Print</span>';
            printBtn.onclick = () => {
              // count QR → Print; mirror qr-view/share (resolve slug → ULID before sending)
              (async () => {
                try {
                  const raw = String(data?.id || data?.locationID || '').trim(); // prefer slug; dash expects/uses ULID after resolve
                  if (raw) {
                    const __uid = await resolveULIDFor(raw);
                    if (__uid) {
                      await fetch(`${TRACK_BASE}/hit/qr-print/${encodeURIComponent(__uid)}`, { method: 'POST', keepalive: true });
                    }
                  }
                } catch {} // never block printing
              })();
              const src = img.src;
              const layer = document.createElement('div');
              layer.id = 'qr-print-layer';
              Object.assign(layer.style, { position:'fixed', inset:'0', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', zIndex:'999999' });
              const style = document.createElement('style');
              style.id = 'qr-print-style';
              style.textContent = `
                @media print{
                  body > *:not(#qr-print-layer){ display:none !important; }
                  #qr-print-layer{ position:static !important; inset:auto !important; }
                }`;
              const pimg = document.createElement('img');
              pimg.alt = 'QR Business Card'; pimg.src = src;
              pimg.style.maxWidth = '90vw'; pimg.style.maxHeight = '90vh';
              layer.appendChild(pimg);
              const cleanup = () => { document.getElementById('qr-print-style')?.remove(); document.getElementById('qr-print-layer')?.remove(); };
              const go = () => { try { window.print(); } finally { setTimeout(cleanup, 300); } };
              document.head.appendChild(style); document.body.appendChild(layer);
              if (pimg.complete) go();
              else { pimg.addEventListener('load', go, { once:true }); pimg.addEventListener('error', cleanup, { once:true }); }
            };

            actions.appendChild(shareBtn);
            actions.appendChild(printBtn);

            inner.appendChild(img);
            body.appendChild(inner);
            body.appendChild(actions);
            card.appendChild(top); card.appendChild(body); wrap.appendChild(card);
            document.body.appendChild(wrap);
            showModal('qr-modal');
            (async()=>{ 
              try { 
                const __uid = await resolveULIDFor(uid);
                if (__uid) await fetch(`${TRACK_BASE}/hit/qr-view/${encodeURIComponent(__uid)}`, { method:'POST', keepalive:true });
              } catch {} 
            })();
          });

          const actions = document.createElement('div');
          actions.className = 'modal-footer cta-compact';

          const shareBtn = document.createElement('button');
          shareBtn.className = 'modal-footer-button';
          shareBtn.type = 'button';
          shareBtn.setAttribute('aria-label', 'Share');
          shareBtn.title = 'Share';
          shareBtn.innerHTML = '📤 <span class="cta-label">Share</span>';
          shareBtn.onclick = async () => {
            // send with canonical ULID to avoid 400 on slug (keep comment, clarify)
            const raw = String(data?.id || data?.locationID || '').trim();
            if (raw) {
              try {
                const __uid = await resolveULIDFor(raw);
                if (__uid) {
                  await fetch(`${TRACK_BASE}/hit/share/${encodeURIComponent(__uid)}`, { method: 'POST', keepalive: true });
                }
              } catch {}
            }

            try {
              const text = [name, phone, email].filter(Boolean).join('\n');
              if (navigator.share && text) { await navigator.share({ title: 'Business Card', text }); }
              else if (text) { await navigator.clipboard.writeText(text); showToast('Copied to clipboard', 1600); }
            } catch {}
          };

          actions.appendChild(shareBtn);
          card.appendChild(top);
          card.appendChild(body);
          card.appendChild(actions);
          wrap.appendChild(card);
          document.body.appendChild(wrap);
        }, { passive: false });
      }
    }    
    
    // count LPM open — allow slug or ULID; resolve slug → ULID before sending (avoids 400)
    ;(async () => {
      const idOrSlug = String(data?.id || data?.locationID || '').trim();
      if (!idOrSlug) return;

      const src =
        originEl && originEl.classList && originEl.classList.contains('popular-button')
          ? 'popular' : 'accordion';

      const uid = await resolveULIDFor(idOrSlug);
      console.debug('lpm-open', { id: idOrSlug, src, beacon: uid ? 'sent' : 'skipped' });

      if (!uid) return; // unresolved → skip safely
      try {
        await fetch(`${TRACK_BASE}/hit/lpm-open/${encodeURIComponent(uid)}`, { method:'POST', keepalive:true });
      } catch (err) { console.warn('lpm-open tracking failed', err); }
    })();

    // Delegated client beacons removed — server counts via /out/* and /hit/*

    // ⭐ Save → toggle + update icon (⭐ → ✩ when saved)
    // helper placed before first use: avoids ReferenceError in some engines
    function initSaveButtons(primaryBtn, secondaryBtn){
      const id = String(data?.id || data?.locationID || '');
      const name = String(data?.displayName ?? data?.name ?? data?.locationName?.en ?? data?.locationName ?? '').trim() || t('Unnamed');
      const lat = Number(data?.lat), lng = Number(data?.lng);
      const entry = { id, locationName: { en: name }, name, lat: Number.isFinite(lat)?lat:undefined, lng: Number.isFinite(lng)?lng:undefined };

      const flip = (btn, saved) => {
        if (!btn) return;
        btn.textContent = saved ? '✩' : '⭐';
        btn.setAttribute('aria-pressed', String(saved));
        btn.classList.add('icon-btn');
      };

      const readSaved = () => (id && localStorage.getItem(`saved:${id}`) === '1');
      const writeState = (saved) => {
        try {
          localStorage.setItem(`saved:${id}`, saved ? '1' : '0');
          const arr = JSON.parse(localStorage.getItem('savedLocations') || '[]');
          const next = Array.isArray(arr) ? arr.filter(x => String(x.id) !== id) : [];
          if (saved) next.unshift(entry);
          localStorage.setItem('savedLocations', JSON.stringify(next));
        } catch {}
      };

      // init both buttons
      const init = readSaved();
      flip(primaryBtn, init);
      flip(secondaryBtn, init);

      let busy = false;
      const toggle = async () => {
        if (!id || busy) { if (!id) showToast('Missing id', 1600); return; }
        busy = true;
        try {
          const was = readSaved();
          const now = !was;
          writeState(now);
          flip(primaryBtn, now);
          flip(secondaryBtn, now);
          showToast(now ? 'Saved' : 'Removed from Saved', 1600);

          // Resolve slug → ULID before sending; count even when LPM opened from a slug
          const rawId = String(data?.id || data?.locationID || '').trim();
          const uid = await resolveULIDFor(rawId);
          if (uid) {
            try {
              await fetch(`${TRACK_BASE}/hit/${now ? 'save' : 'unsave'}/${encodeURIComponent(uid)}`, { method: 'POST', keepalive: true });
            } catch {}
          }

        } finally { busy = false; }
      };

      primaryBtn?.addEventListener('click', (e)=>{ e.preventDefault(); toggle(); });
      secondaryBtn?.addEventListener('click', (e)=>{ e.preventDefault(); toggle(); });
    }

    initSaveButtons(
      modal.querySelector('#lpm-save'),
      modal.querySelector('#som-save')
    );

    // 🌍 Social Channels — open social modal (capture to beat other handlers)
    const socialBtn = modal.querySelector('#som-social');
    if (socialBtn) {
      socialBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        // baseline from current LPM data
        let links   = (data && data.links) || {};
        // use contactInformation only
        let contact = (data && data.contactInformation) || {};

        // fill from API export (same source as postal/media); fetch when Website is missing too
        const missingLinks = !links || !Object.values(links).some(v => String(v || '').trim());
        const missingContact = !contact || !['whatsapp','telegram','messenger','booking','bookingUrl','email','phone']
          .some(k => String((contact || {})[k] || '').trim());

        // detect missing Website across common fields
        const websiteMissing = !(() => {
          const site =
            (links && (links.official || links.website || links.site)) ||
            (contact && (contact.officialUrl || contact.officialURL || contact.website || contact.site)) || '';
          return String(site).trim();
        })();

        const rawId = String(data?.id || data?.locationID || '').trim();
        const canId = await resolveULIDFor(rawId); // only fetch when we have a real ULID
        if (canId) {
          const resp = await fetch(
            API(`/api/data/profile?id=${encodeURIComponent(canId)}`),
            { cache: 'no-store', credentials: 'include' }
          );

          if (resp.ok) {
            const payload = await resp.json().catch(() => ({}));
            if (payload && typeof payload === 'object') {
              // prefer already-present local fields, but FILL MISSING from payload (keeps official from API)
              if (payload.links && typeof payload.links === 'object') {
                links = Object.assign({}, links, payload.links);
              }
              if (payload.contact && typeof payload.contact === 'object') {
                contact = Object.assign({}, contact, payload.contact);
              }
            }
          }
        }

        createSocialModal({
          name: String(data?.displayName ?? data?.name ?? 'Location'),
          links,
          contact,
          id: canId // pass LPM id for tracking
        });
      }, { capture: true, passive: false });
    }

    // ⋮ toggle secondary actions
    const moreBtn = modal.querySelector('#lpm-overflow');
    const secondary = modal.querySelector('#lpm-secondary-actions');
    if (moreBtn && secondary) {
      moreBtn.addEventListener('click', () => {
        const open = secondary.classList.toggle('is-open'); // CSS shows when .is-open
        secondary.setAttribute('aria-hidden', String(!open));
        moreBtn.setAttribute('aria-expanded', String(open));
      });
    }

    // helpers: normalize urls/numbers
    const normUrl = (u) => {
      const s = String(u || '').trim(); if (!s) return '';
      return /^(?:https?:)?\/\//i.test(s) ? s : (s.startsWith('www.') ? 'https://' + s : (s.includes('.') ? 'https://' + s : s));
    };
    const waUrl = (v) => {
      const s = String(v || '').trim(); if (!s) return '';
      const num = s.replace(/[^\d+]/g, '').replace(/^\+?/, ''); return num ? `https://wa.me/${num}` : '';
    };
    const tgUrl = (v) => {
      const s = String(v || '').trim(); if (!s) return '';
      return /^https?:\/\//i.test(s) ? s : `https://t.me/${s.replace(/^@/, '')}`;
    };
    const msgrUrl = (v) => {
      const s = String(v || '').trim(); if (!s) return '';
      return /^https?:\/\//i.test(s) ? s : `https://m.me/${s}`;
    };

    // link CTA with tracking (explicit action name supported)
    const addLink = (id, emoji, label, href, action) => {
      if (!href) return;
      const a = document.createElement('a');
      a.className = 'modal-footer-button';
      a.id = id;
      const act = (action || (id.startsWith('som-') ? id.slice(4) : id)).toLowerCase().replaceAll('_','-');
      a.href = href;
      a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', label); a.title = label;
      a.innerHTML = `${emoji} <span class="cta-label">${label}</span>`;
      a.addEventListener('click', async (e) => {
        try {
          const raw = String(data?.id || data?.locationID || '').trim();
          const uid = await resolveULIDFor(raw);
          if (!uid) return;
          e.preventDefault();
          const url = `${TRACK_BASE}/out/${act}/${encodeURIComponent(uid)}?to=${encodeURIComponent(href)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch {}
      }, { capture: true });
      secondary.appendChild(a);
    };

    // Fetch contact on click when not present
    ;(function wireContactFetch(){
      const id = String(data?.id || data?.locationID || '').trim(); if (!id) return;
      const call = modal.querySelector('#som-call');
      const mail = modal.querySelector('#som-mail');
      const bookBtn = modal.querySelector('#lpm-book');

      if (call && !call.href) call.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const url = API(`/api/data/contact?id=${encodeURIComponent(id)}&kind=phone`);
          const r = await fetch(url);
          if (r.ok){ const j=await r.json(); if (j.href) location.href=j.href; }
        } catch {}
      });

      if (mail && !mail.href) mail.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const url = API(`/api/data/contact?id=${encodeURIComponent(id)}&kind=email`);
          const r = await fetch(url, { credentials: 'include' });
          if (r.ok){ const j=await r.json(); if (j.href) location.href=j.href; }
        } catch {}
      });

      // booking: ONLY links.bookingUrl; else toast (cleaned)
      // If already wired above, skip to avoid double-firing on the same button.
      if (bookBtn) {
        if (bookBtn.dataset && bookBtn.dataset.lpmWired === '1') {
          // already has a capture-phase handler from the primary wiring; do nothing
        } else {
          const bookingUrl = String(data?.links?.bookingUrl || '').trim();
          if (bookingUrl) {
            bookBtn.removeAttribute('href');
            bookBtn.addEventListener('click', async (ev) => {
              ev.preventDefault();
              const raw = String(data?.id || data?.locationID || '').trim();
              const uid = await resolveULIDFor(raw);
              const url = uid
                ? `${TRACK_BASE}/out/booking/${encodeURIComponent(uid)}?to=${encodeURIComponent(bookingUrl)}`
                : bookingUrl; // fallback: open directly if ULID not resolvable
              window.open(url, '_blank', 'noopener,noreferrer');
            }, { capture: true });
            bookBtn.dataset.lpmWired = '1'; // mark bound
          } else {
            bookBtn.addEventListener('click', (ev) => {
              ev.preventDefault();
              showToast('Booking link coming soon', 1600);
            }, { passive: false });
            bookBtn.dataset.lpmWired = '1'; // mark bound
          }
        }
      }

    })();

    // normalize id shape for all actions (Popular or Accordion)
    // keep ULID in data.id if we already have it; prefer alias/short only for display/locationID
    (() => {
      const el = originEl || null;
      const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

      const alias = String(
        data?.alias || data?.slug ||
        el?.getAttribute?.('data-alias') || el?.getAttribute?.('data-slug') || ''
      ).trim();

      const domId = String(
        el?.getAttribute?.('data-id') || el?.getAttribute?.('data-locationid') || ''
      ).trim();

      // prefer dataset slug; never overwrite a non-empty locationID (clarified)
      // Always ensure a slug lands in locationID if we have one in alias/DOM — even when id is a ULID.
      const raw = String(
        data?.locationID || data?.id || domId || alias || ''
      ).trim();

      const alreadyUlid = ULID.test(String(data?.id || ''));

      // 1) Ensure locationID (slug) when missing: take alias first, else a non-ULID domId.
      if (!data.locationID) {
        const fromAlias = String(alias || '').trim();
        const fromDom   = String(domId  || '').trim();
        const slug = fromAlias || (fromDom && !ULID.test(fromDom) ? fromDom : '');
        if (slug) data.locationID = slug;
      }

      // 2) Ensure id (ULID) when missing: keep existing; only set if we find a ULID.
      if (!data.id) {
        const candidate = [raw, domId].map(v => String(v || '').trim()).find(Boolean);
        if (candidate && ULID.test(candidate)) data.id = candidate;
      }

      // 3) De-slug: do not mirror alias; locationID is the only identifier (alias or ULID)

    })();

    // ⭐ Save (secondary) handled by helper

    // 📤 Share (placeholder; OS share → clipboard fallback)
    const shareBtn = modal.querySelector('#som-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        // 1) count Share with canonical ULID (slug → ULID)
        const raw = String(data?.id || data?.locationID || '').trim();
        if (raw) {
          try {
            const uid = await resolveULIDFor(raw);
            if (uid) {
              await fetch(`${TRACK_BASE}/hit/share/${encodeURIComponent(uid)}`, {
                method: 'POST',
                keepalive: true
              });
            }
          } catch {}
        }

        // 2) then perform the OS share (or clipboard fallback)
        const name = String(data?.name || 'Location');
        const coords = [data?.lat, data?.lng].filter(Boolean).join(', ');
        const text = coords ? `${name} — ${coords}` : name;
        try {
          if (navigator.share) {
            await navigator.share({ title: name, text });
          } else {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard', 1600);
          }
        } catch {}
      }, { passive: false });
    }
        
    // 📈 Stats (dashboard) — single-field locationID (alias or ULID): prefer payload, then cached DOM; fall back to ULID if needed
    const statsBtn = modal.querySelector('#som-stats');
    if (statsBtn) {
      statsBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i; // keep ULID shape check

        const cachedLocationId  = String(modal.getAttribute('data-locationid') || '').trim(); // cached in DOM
        const payloadLocationId = String(data?.locationID || '').trim();                      // passed in payload
        const rawULID           = String(data?.id || '').trim();                              // ULID (if known)

        let target = (payloadLocationId || cachedLocationId || rawULID).trim(); // prefer payload; fallback to cached or ULID
        if (!target) { showToast('Dashboard unavailable for this profile', 1600); return; }

        // Sync DOM cache for next time; leave data.* untouched
        modal.setAttribute('data-locationid', target);

        // Clean URL: /dash/<ULID>. Save human slug for the dashboard to read (no hash in URL).
        const seg = ULID.test(rawULID) ? rawULID : target; // ULID if available, else slug (server will 302 → ULID)

        // persist human slug for UI (if we have one); also leave a short-lived pending hint for redirects
        try {
          const isHuman = (target && !ULID.test(target));
          if (isHuman) {
            // if we already know the ULID now, bind it directly
            if (ULID.test(rawULID)) localStorage.setItem(`navigen.slug:${rawULID}`, target);
            // always drop a pending slug to be picked up after redirect
            localStorage.setItem('navigen.pendingSlug', JSON.stringify({ value: target, ts: Date.now() }));
          }
        } catch { /* ignore storage errors */ }

        const href = `https://navigen.io/dash/${encodeURIComponent(seg)}`;
        window.open(href, '_blank', 'noopener,noreferrer');

      }, { capture: true });
    }

    // × Close → remove modal, return focus to originating trigger if provided
    const btnClose = modal.querySelector('.modal-close');
    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        const originEl = data?.originEl; // ensure defined
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
     
    // 1–5 rating (localStorage); emoji radios; 24h cooldown
    (function initRating(){
      const group = modal.querySelector('#lpm-rate-group');
      if (!group) return;
      const id = String(data?.id || '');
      if (!id) return;

      const key   = `rating:${id}`;       // stored value 0..5
      const tsKey = `rating_ts:${id}`;    // last rating timestamp
      const COOLDOWN_MS = 24*60*60*1000;  // 24h per device

      const btns = Array.from(group.querySelectorAll('.rate-btn'));
      const hint = modal.querySelector('.rate-hint');

      const setUI = (n) => {
        btns.forEach((b,i)=> b.setAttribute('aria-checked', String(i+1===n)));
        if (hint) hint.textContent = n ? `Rated ${n}/5` : '';
      };

      let val  = Number(localStorage.getItem(key))  || 0;  // 0 = no rating
      let last = Number(localStorage.getItem(tsKey)) || 0;

      const canRate = () => !last || (Date.now() - last >= COOLDOWN_MS);

      // initial visual state
      setUI(val);
      if (!canRate() && val) {
        // soft-lock UI in the current session
        btns.forEach(b => b.disabled = true);
      }

      const commit = (n) => {
        val = n; last = Date.now();
        localStorage.setItem(key,  String(n));
        localStorage.setItem(tsKey, String(last));
        setUI(n);
        /* no server metric for rating yet; stored locally only */
        showToast(`Thanks! Rated ${n}/5`, 1600);

        // lock the row for this session
        btns.forEach(b => b.disabled = true);
      };

      // click handlers
      btns.forEach((b,i) => {
        b.addEventListener('click', () => {
          if (!canRate()) {
            showToast('You already rated today', 1600);
            return;
          }
          commit(i+1);  // 1..5
        });
      });

      // keyboard support (only if allowed)
      group.addEventListener('keydown', (e) => {
        if (!canRate()) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault(); commit(Math.min(5, (val || 0) + 1));
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault(); commit(Math.max(1, (val || 1) - 1));
        }
      });
    })();

    // analytics beacon
    // removed trackCta; all beacons use _track(uid,event) // single path → Worker

    // 🔎 Enrich LPM from Data API (non-blocking; keeps UX instant)
    ;(async () => {
      try {
        // accept locationID too; skip when missing
        const id = String(data?.id || data?.locationID || '').trim();
        if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(id)) return;
        const needEnrich =
          !data?.descriptions ||
          !data?.media?.cover ||
          (Array.isArray(data?.media?.images) && data.media.images.length < 2);
        if (!needEnrich) return; // skip network when local data is complete

        const res = await fetch(API(`/api/data/profile?id=${encodeURIComponent(id)}`), { cache: 'no-store', credentials: 'include' });
        if (!res.ok) return;
        const payload = await res.json();
        
        // keep API-provided locationID as-is (alias or short); do not force short or overwrite brand alias
        if (payload && payload.locationID) {
          const apiId = String(payload.locationID).trim();
          // Only update the DOM cache if we don't already have a non-ULID alias there.
          const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
          const currentDom = String(modal.getAttribute('data-locationid') || '').trim();
          const hasAlias = currentDom && !ULID.test(currentDom);
          // upgrade cache only with a human slug (never a ULID)
          if (!hasAlias && apiId && !ULID.test(apiId)) {
            modal.setAttribute('data-locationid', apiId);
          }

          // Keep data.locationID as originally provided by the dataset; no mutation here.
        }

        // Fill description if placeholder
        if (payload.descriptions && !data.descriptions) {
          const box = modal.querySelector('.location-description .description');
          const txt = payload.descriptions.en || Object.values(payload.descriptions)[0] || '';
          if (box && /Description coming soon/i.test(box.textContent || box.innerHTML)) {
            box.innerHTML = String(txt).replace(/\n/g,'<br>');
          }
        }
        // Upgrade cover if better
        if (payload.media && payload.media.cover) {
          const img = modal.querySelector('.location-media img');
          
          // no-op: do not override images that include 'placeholder'
        }
      } catch {}
    })();
  }  

  // 5. Reveal modal (remove .hidden, add .visible, focus trap etc.)

// Track modal items globally within this module
let myStuffItems = [];

// 🌐 Import translation function for localized modal titles and text
import { t } from './scripts/i18n.js';

// Stripe: only the donation action here (init comes from caller)
import { handleDonation } from "./scripts/stripe.js";

// canonical API; ULID-only responses (no same-origin)
const API = (path) => new URL(path, 'https://navigen-api.4naama.workers.dev').toString();

// ✅ Store Popular’s original position on page load
let popularBaseOffset = 0;
document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById('locations-scroll');
  const popularHeader = document.querySelector('.group-header-button[data-group="group.popular"]');
  if (scroller && popularHeader) {
    popularBaseOffset = popularHeader.offsetTop;
  }
});

// Utility: create a location button and wire it to the Location Profile Modal (LPM)
function makeLocationButton(loc) {
  const btn = document.createElement('button');
  const locLabel = String((loc?.locationName?.en ?? loc?.locationName ?? "Unnamed")).trim(); // location display label
  btn.textContent = locLabel;

  // dataset-only identifiers: use profiles.json slug as the single source of truth (no derivation)
  // keep only a true ULID in data-id
  {
    const rawUlid = String(loc?.ID || loc?.id || '').trim();
    const uid = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(rawUlid) ? rawUlid : '';
    const slug = String(loc?.locationID || '').trim(); // authoritative slug from profiles.json

    if (uid) btn.setAttribute('data-id', uid);
    if (slug) {
      btn.setAttribute('data-alias', slug);       // keep existing comment: used by search/UI
      btn.setAttribute('data-locationid', slug);  // used by handlers and Dashboard
    }
  }

  btn.classList.add('location-button');
  btn.dataset.lower = btn.textContent.toLowerCase();
  
  // Expose searchable metadata: use locationName only
  const _tags = Array.isArray(loc?.tags) ? loc.tags : [];
  const _locName = locLabel; // consistent with visual label
  btn.setAttribute('data-name', _locName);
  btn.setAttribute('data-tags', _tags.map(k => String(k).replace(/^tag\./,'')).join(' '));

  const cc = loc["Coordinate Compound"];
  let lat = "", lng = "";
  if (typeof cc === "string" && cc.includes(",")) {
    // Parse "lat,lng" from sheet coords; add as data attrs and a helpful title
    [lat, lng] = cc.split(',').map(s => s.trim());
    btn.setAttribute('data-lat', lat);
    btn.setAttribute('data-lng', lng);
    btn.title = `Open profile / Route (${lat}, ${lng})`;
  }

  // Always open LPM on click (coords optional)
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation(); // prevent duplicate opens/reopens on rebuilds

    // Build gallery from loc.media; always pass profiles.json cover+images for slider
    const media   = (loc && typeof loc.media === 'object') ? loc.media : {};
    // Keep original media.images array (objects), fallback to [] 
    const gallery = Array.isArray(media.images) ? media.images : [];
    const images  = gallery.map(v => (typeof v === 'string' ? v : v?.src)).filter(Boolean); // normalize to URLs

    // normalize cover to a string URL even if images[] holds objects
    const cover =
      (media.cover && String(media.cover).trim())
      || (images[0] && (typeof images[0] === 'string' ? images[0] : images[0]?.src));

    // guard: strict data model; hero + ≥2 images required
    if (!cover) { console.warn('Data error: cover required', loc?.locationID || loc?.ID || loc?.id); return; } // allow 1+ images

    // Open the Location Profile Modal; include contact + links for CTAs
    // pass ULID if present, else slug only to LPM; ULID remains canonical
    {
      const uid = String(btn.getAttribute('data-id') || '').trim();
      const alias = String(btn.getAttribute('data-alias') || '').trim();
      // always include slug in payload (strict contract) and mirror to alias; keep ULID for beacons
      showLocationProfileModal({
        locationID: String(loc?.locationID || ''),                    // required slug
        alias:      String(loc?.locationID || ''),                    // mirror slug for handlers
        id:         String(uid || loc?.locationID || ''),             // ULID preferred; else slug
        name: btn.textContent,
        lat,
        lng,
        imageSrc: cover,
        images,
        media,
        descriptions: (loc && typeof loc.descriptions === 'object') ? loc.descriptions : {},
        tags: Array.isArray(loc?.tags) ? loc.tags : [],
        contactInformation: (loc && typeof loc.contactInformation === 'object') ? loc.contactInformation
                              : ((loc && typeof loc.contact === 'object') ? loc.contact : {}),
        links: (loc && typeof loc.links === 'object') ? loc.links : {},
        originEl: btn
      });
    }
  }); // ✅ close addEventListener('click', ...)

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

  // If Popular group → collect all Priority=Yes locations (ignore Visible).
  // Otherwise → standard group match with Visible=Yes.
  const filtered = (groupKey === "group.popular")
    ? geoPoints.filter(loc => String(loc.Priority) === "Yes")
    : geoPoints.filter(loc => loc.Group === groupKey && loc.Visible === "Yes");

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
    
    // show small empty state when group has no items
    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'subgroup-items';
      empty.innerHTML = `<div class="empty-state" style="opacity:.7;padding:.5rem 0;">No items yet</div>`;
      content.appendChild(empty);
    }        

    // --- subgroups or flat list ---
    if (Array.isArray(group.subgroups) && group.subgroups.length) {
      // each subgroup
      group.subgroups.forEach((sub, sIdx) => {
        const subHeader = document.createElement('div');
        subHeader.className = 'subheader';
        // Prefer provided human label; fall back to i18n only for static keys
        const label = sub.name || (sub.key && !/^admin\./.test(sub.key) ? t(sub.key) : '') || sub.key;
        subHeader.textContent = label;

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
        const flatWrap = document.createElement('div'); // groups without subheaders
        flatWrap.className = 'subgroup-items';
        content.appendChild(flatWrap);

        filtered.forEach(loc => {
          flatWrap.appendChild(makeLocationButton(loc));
        });
      }

    // Popular enrichment: fill Popular with Priority=Yes (from profiles.json) for this route.
    if (groupKey === "group.popular") {
      // Popular enrichment disabled by contract: Popular is driven solely by API Priority:"Yes".
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

// ✅ Helper: View-by settings modal (button-less; uses standard .modal shell)
export function openViewSettingsModal({ title, contextLine, options, currentKey, resetLabel, onPick }) {
  const doc=document, body=doc.body;

  const overlay = doc.createElement('div');
  overlay.className = 'modal visible';

  const card = doc.createElement('div');
  card.className = 'modal-content modal-menu';
  card.style.maxWidth = '720px';   // align with My Stuff modal
  card.style.width = '95vw';       // responsive

  // sticky header: title + red × (same line)
  const top = doc.createElement('div');
  top.className = 'modal-top-bar';
  const h2 = doc.createElement('h2');
  h2.className = 'modal-title';
  h2.textContent = title;
  const close = doc.createElement('button');
  close.className = 'modal-close';
  close.type = 'button';
  close.textContent = '×';
  close.onclick = () => overlay.remove();
  top.append(h2, close);

  // body lines
  const bodyWrap = doc.createElement('div');
  bodyWrap.className = 'modal-body';
  const inner = doc.createElement('div');
  inner.className = 'modal-body-inner';
  
  const line3 = doc.createElement('p'); line3.textContent = contextLine;          // 🏫 Language Schools › brand › scope

  // ── Render "contextLine" as two-row breadcrumbs (icon + colored ›; wraps on row2).
  (() => {
    const raw = String(contextLine || '').trim();
    const parts = raw.split('›').map(s => s.trim()).filter(Boolean);
    if (!parts.length) { inner.append(line3); return; }

    // Read Close (×) red from SVG stroke/fill, else its text color, else brand red.
    const closeBtn = top.querySelector('.modal-close');
    const sepColor = (() => {
      if (!closeBtn) return '#d11';
      const ok = (v) => v && v !== 'none' && !/^rgba?\(\s*0\s*,\s*0\s*,\s*0(?:\s*,\s*0\s*)?\)$/.test(v);
      const svg = closeBtn.querySelector('svg');
      if (svg) {
        const node = svg.querySelector('[stroke]') || svg.querySelector('path,line,polyline,polygon,circle,rect');
        if (node) {
          const cs = getComputedStyle(node);
          if (ok(cs.stroke)) return cs.stroke;
          if (ok(cs.fill))   return cs.fill;
        }
      }
      const c = getComputedStyle(closeBtn).color;
      return ok(c) ? c : '#d11';
    })();

    const wrap = doc.createElement('span'); wrap.className = 'vb-crumbs';
    const row1 = doc.createElement('span'); row1.className = 'vb-row1';
    const row2 = doc.createElement('span'); row2.className = 'vb-row2';

    // Category icon (emoji if missing). Extend mapping as needed.
    const first = parts[0];
    const hasEmoji = /^\p{Extended_Pictographic}/u.test(first);
    const icon = hasEmoji ? '' : ( /language\s*schools/i.test(first) ? '🏫 ' : '' );

    const cat = doc.createElement('span'); cat.className = 'vb-crumb vb-cat';
    cat.textContent = (icon ? icon : '') + first;
    row1.appendChild(cat);

    const sep1 = doc.createElement('span'); sep1.className = 'vb-sep'; sep1.textContent = '›';
    sep1.style.color = sepColor;
    row1.appendChild(doc.createTextNode(' '));
    row1.appendChild(sep1);

    for (let i = 1; i < parts.length; i++) {
      if (i > 1) {
        const sep = doc.createElement('span'); sep.className = 'vb-sep'; sep.textContent = '›';
        sep.style.color = sepColor;
        row2.appendChild(doc.createTextNode(' '));
        row2.appendChild(sep);
        row2.appendChild(doc.createTextNode(' '));
      }
      const c = doc.createElement('span'); c.className = 'vb-crumb'; c.textContent = parts[i];
      row2.appendChild(c);
    }

    const line = doc.createElement('p');
    line.appendChild(wrap);
    wrap.appendChild(row1);
    wrap.appendChild(row2);
    inner.append(line); // replaces plain line3 rendering
  })();

  bodyWrap.append(inner);
  card.append(top, bodyWrap);

  // options (radio behavior; button-less list)
  const menu = doc.createElement('div');
  menu.className = 'modal-menu-list';
  (options||[]).forEach(opt => {
    const item = doc.createElement('button');
    item.type = 'button';
    item.className = 'modal-menu-item';
    item.textContent = opt.label;
    if ((opt.key||'').toLowerCase() === (currentKey||'').toLowerCase()) {
      item.classList.add('is-active');  // mark selected
    }

    item.onclick = () => { onPick(opt.key); overlay.remove(); };
    menu.appendChild(item);
  });

  // reset as last “choice”
  if (resetLabel) {
    const reset = doc.createElement('button');
    reset.type = 'button';
    reset.className = 'modal-menu-item';
    reset.textContent = resetLabel;
    reset.onclick = () => { onPick('__RESET__'); overlay.remove(); };
    menu.appendChild(reset);
  }

  // ESC / backdrop close without changes
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) overlay.remove(); });
  doc.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ overlay.remove(); doc.removeEventListener('keydown', esc); } });

  inner.append(menu); bodyWrap.append(inner);
  card.append(top, bodyWrap); overlay.append(card); body.append(overlay);
}

// Return canonical language code for a given country (full catalog; no ad-hoc fixes)
export function getLangFromCountry(code) {  
  const CATALOG = new Set([
    'en','fr','de','hu','it','he','uk','nl','ro','pl','cs','es','sk','da','sv','nb','sl','ru','pt','is','tr','zh','el','bg','hr','et','fi','lv','lt','mt','hi','ko','ja','ar'
  ]);
  const langMap = {
    // English-speaking
    IE:'en', GB:'en', US:'en', CA:'en', AU:'en',
    // German-speaking
    DE:'de', AT:'de', CH:'de',
    // French-speaking
    FR:'fr', BE:'fr', LU:'fr',
    // Others
    HU:'hu', BG:'bg', HR:'hr', CY:'el', CZ:'cs', DK:'da', EE:'et',
    FI:'fi', GR:'el', IT:'it', LV:'lv', LT:'lt', MT:'mt',
    NL:'nl', PL:'pl', PT:'pt', RO:'ro', SK:'sk', SI:'sl',
    ES:'es', SE:'sv', IS:'is', NO:'nb', TR:'tr',
    IL:'he', RU:'ru', UA:'uk', CN:'zh', SA:'ar', IN:'hi',
    KR:'ko', JP:'ja'
  };
  const cc = String(code || '').toUpperCase();
  const lang = langMap[cc] || null;
  return (lang && CATALOG.has(lang)) ? lang : null;
}

export async function fetchTranslatedLangs() {
  // Canonical catalog used across app (must match Worker SUPPORTED)
  const CATALOG = new Set([
    'en','fr','de','hu','it','he','uk','nl','ro','pl','cs','es','sk','da','sv','nb','sl','ru','pt','is','tr','zh','el','bg','hr','et','fi','lv','lt','mt','hi','ko','ja','ar'
  ]);

  const available = [];
  try {
    const res = await fetch('/data/languages/index.json');
    if (res.ok) {
      const listedLangs = await res.json(); // expects array of codes
      for (const code of Array.isArray(listedLangs) ? listedLangs : []) {
        const c = String(code).toLowerCase();
        if (CATALOG.has(c)) available.push(c);
      }
    } else {
      console.warn("⚠️ Could not load language index.json");
    }
  } catch (err) {
    console.warn("⚠️ Failed to fetch index.json:", err);
  }
  return new Set(available.length ? available : ['en']); // safe fallback
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

  modal.classList.remove("hidden");              // For any manual .hidden (avoid first-tap miss)
  modal.style.display = "flex";                  // ✅ Force visible immediately
  void modal.offsetWidth;                        // ✅ Reflow to flush styles before showing
  modal.classList.add("visible");                // ✅ Flex centering applied immediately (no rAF)
}

/**
 * Utility: hide a modal
 */
export function hideModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.remove("visible");
  modal.classList.add("hidden");
  modal.style.display = "none"; // ✅ Explicitly hide for clean next show
}

// Toast: single instance; header+close supported; links don’t dismiss.
// Accepts number (duration) or opts { duration, title, manualCloseOnly }.
export function showToast(message, opts = 0) {
  // ensure one active toast; remove existing
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const { duration = 0, title = '', manualCloseOnly = false } =
    typeof opts === 'number' ? { duration: opts } : (opts || {});

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  // header + red × close
  if (title) {
    const header = document.createElement('div');
    header.className = 'toast-header';

    const h = document.createElement('div');
    h.className = 'toast-title';
    h.textContent = title;

    const btn = document.createElement('button');
    btn.className = 'toast-close';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Close');
    btn.textContent = '✖';
    btn.addEventListener('click', () => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    });

    header.appendChild(h);
    header.appendChild(btn);
    toast.appendChild(header);
  }

  const body = document.createElement('div');
  body.className = 'toast-body';
  body.innerHTML = message;
  toast.appendChild(body);

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  // only allow tap-to-close when NOT manualCloseOnly
  if (!manualCloseOnly) {
    toast.addEventListener('click', (e) => {
      if (e.target.closest('a, .toast-close')) return;
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, { passive: true });
  }

  // auto-close only when NOT manualCloseOnly
  if (duration > 0 && !manualCloseOnly) {
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }
}

// Uses generic toast with 4s auto-close; keeps one implementation
export function showThankYouToast() {
  return showToast("💖 Thank you for your support!", 4000);
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
    bodyHTML: `<div id="my-stuff-body" class="modal-body"></div>`
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
  
  // Ensure My Stuff always has a footer container (even with no buttons)
  let actions = modal.querySelector('.modal-footer');  // keep same class for CSS
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'modal-footer';
    modal.querySelector('.modal-content')?.appendChild(actions);
  }    

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

/* Favorites Modal (FM): list saved locations with open/unsave */
export function createFavoritesModal() {
  if (document.getElementById("favorites-modal")) return;

  const modal = injectModal({
    id: "favorites-modal",
    className: "modal modal-menu",
    bodyHTML: `<div id="favorites-body" class="modal-body"></div>`
  });

  modal.classList.add("hidden");

  const topBar = document.createElement("div");
  topBar.className = "modal-top-bar";
  topBar.innerHTML = `
    <h2 class="modal-header">${t("Favorites")}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector(".modal-content")?.prepend(topBar);
  topBar.querySelector(".modal-close")?.addEventListener("click", () => hideModal("favorites-modal"));
}

export function showFavoritesModal() {
  if (!document.getElementById("favorites-modal")) createFavoritesModal();

  const modal = document.getElementById("favorites-modal");
  const body = modal.querySelector("#favorites-body");
  const title = modal.querySelector(".modal-header");
  if (!modal || !body || !title) return;

  title.textContent = t("favorites");
  body.innerHTML = ""; // re-render each open

  // read favorites; expected to be an array of { id, name, lat, lng }
  const saved = JSON.parse(localStorage.getItem("savedLocations") || "[]");

  const wrap = document.createElement("div");
  wrap.className = "modal-menu-list";
  body.appendChild(wrap);

  if (!Array.isArray(saved) || saved.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = t("no.favorites.yet");
    wrap.appendChild(empty);
    showModal("favorites-modal");
    setupTapOutClose("favorites-modal"); // idempotent
    return;
  }

  // small helper: persist without globals
  const save = (arr) => localStorage.setItem("savedLocations", JSON.stringify(arr));

  saved.forEach(item => {
    const row = document.createElement("div");
    row.className = "modal-menu-item";           // consistent look

    // label button opens/scrolls to item; star button unsaves (no conflict)
    row.innerHTML = `
      <div class="label" style="flex:1 1 auto; min-width:0;">
        <button class="open-fav" type="button" style="all:unset; cursor:pointer;">
          ${String((item?.locationName?.en ?? item?.locationName ?? item?.name ?? '')).trim() || t("Unnamed")}
        </button>
      </div>
      <button class="unsave-fav clear-x" type="button" aria-label="${t("Remove")}">✖</button>
    `;

    // open behavior: dispatch event + attempt local scroll
    row.querySelector(".open-fav")?.addEventListener("click", () => {
      const evt = new CustomEvent("navigate-to-location", { detail: { id: item.id, lat: item.lat, lng: item.lng } });
      document.dispatchEvent(evt);
      const el = document.querySelector(`[data-location-id="${CSS.escape(String(item.id))}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      hideModal("favorites-modal");
    });

    // unsave behavior: stop row clicks, update store, re-render
    row.querySelector(".unsave-fav")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = saved.filter(s => String(s.id) !== String(item.id));
      save(next);

      // ULID-gated unsave beacon (Favorites ✖)
      {
        // try item.id; if not ULID, attempt to reuse saved LPM id when present
        let uid = String(item?.id || item?.locationID || item?.ID || '').trim();
        if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(uid)) {
          const el = document.querySelector(`[data-id="${CSS.escape(String(item?.id||''))}"]`);
          if (el) uid = String(el.getAttribute('data-id') || '').trim();
        }
        if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(uid)) {
          (async()=>{ try {
            await fetch(`${TRACK_BASE}/hit/unsave/${encodeURIComponent(uid)}`, { method:'POST', keepalive:true });
          } catch {} })();
        }
      }

      // clear LPM toggle marker(s) so LPM shows ⭐ after delete
      const ids = [
        String(item?.id || ''),
        String(item?.locationID || ''),
        String(item?.ID || '')
      ].filter(Boolean);
      ids.forEach(k => localStorage.setItem(`saved:${k}`, '0'));

      row.style.opacity = "0.5";                 // quick visual feedback
      setTimeout(() => showFavoritesModal(), 120);
    });

    wrap.appendChild(row);
  });

  showModal("favorites-modal");
  setupTapOutClose("favorites-modal"); // backdrop-close
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
      
      // Footer exists from injection; just grab it
      const actions = modal.querySelector('.modal-footer');

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

        actions.innerHTML = '';
        
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
          availableLangs = await fetchTranslatedLangs();

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

              // Persist choice and navigate to the path-locale; drop ?lang, keep other params/hash.
              img.addEventListener("click", (e) => {
                e.stopPropagation();
                localStorage.setItem("lang", langCode); // save for future visits

                const parts = location.pathname.split("/").filter(Boolean);
                const hasPrefix = /^[a-z]{2}$/.test(parts[0]);
                const rest = "/" + (hasPrefix ? parts.slice(1).join("/") : parts.join("/")); // "/" or "/path"

                const target =
                  langCode === "en"
                    ? (rest === "/" ? "/" : rest)                 // EN lives at root
                    : `/${langCode}${rest === "/" ? "" : rest}`;  // others are prefixed

                const qs = new URLSearchParams(location.search);
                qs.delete("lang");                                 // avoid duplicates
                const query = qs.toString() ? `?${qs}` : "";

                location.href = `${target}${query}${location.hash || ""}`;
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
          // Route using current <html lang>; drop ?lang, keep others.
          const currentLang = (document.documentElement.lang || "en").toLowerCase();
          const parts = location.pathname.split("/").filter(Boolean);
          const hasPrefix = /^[a-z]{2}$/.test(parts[0]);
          const rest = "/" + (hasPrefix ? parts.slice(1).join("/") : parts.join("/"));

          const target = currentLang === "en"
            ? (rest === "/" ? "/" : rest)
            : `/${currentLang}${rest === "/" ? "" : rest}`;

          const qs = new URLSearchParams(location.search);
          qs.delete("lang");
          const query = qs.toString() ? `?${qs}` : "";
          location.href = `${target}${query}${location.hash || ""}`;
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
    id: "help-modal", // canonical id used by hideModal/setupTapOutClose
    title: '',
    layout: 'action',
    bodyHTML: `
      <div class="modal-menu-list" id="social-modal-list"></div>
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
        <select id="emg-country"></select>
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

// ============================
// 🌍 Social Channels modal (MODULE-SCOPED)
// Reason: make callable from 🌍 handler; same shell as Navigation; no footer.
// ============================
export function createSocialModal({ name, links = {}, contact = {}, id }) { // id for analytics
  const modalId = 'social-modal'; // avoid param shadow
  document.getElementById(modalId)?.remove(); // remove canonical social modal

  // local helpers
  const normUrl = (u) => {
    const s = String(u || '').trim(); if (!s) return '';
    return /^(?:https?:)?\/\//i.test(s) ? s : (s.startsWith('www.') || s.includes('.') ? 'https://' + s : s);
  };
  const waUrl = (v) => { const s=String(v||'').trim(); if(!s) return ''; const n=s.replace(/[^\d+]/g,'').replace(/^\+?/, ''); return n?`https://wa.me/${n}`:''; };
  const tgUrl = (v) => { const s=String(v||'').trim(); if(!s) return ''; return /^https?:\/\//i.test(s) ? s : `https://t.me/${s.replace(/^@/,'')}`; };
  const msUrl = (v) => { const s=String(v||'').trim(); if(!s) return ''; return /^https?:\/\//i.test(s) ? s : `https://m.me/${s}`; };

  // same shell as Navigation: inject + header top bar; no footer
  const modal = injectModal({
    id: modalId, // use canonical Social modal ID
    title: '',
    layout: 'action',
    bodyHTML: `<div class="modal-menu-list" id="social-modal-list"></div>`
  });

  // top bar header (close only here)
  {
    const top = document.createElement('div');
    top.className = 'modal-top-bar';
    top.innerHTML = `
      <h2 class="modal-title">${String(name || 'Social Channels')}</h2>
      <button class="modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.modal-content')?.prepend(top);
    top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(modalId));
  }

  // Build Website first (explicit), then socials; this avoids it being filtered out
  // while preserving the existing "🌐 Website" label.
  const websiteHref = normUrl(
    (links && (links.official || links.website || links.site)) ||
    (contact && (contact.officialUrl || contact.officialURL || contact.website || contact.site))
  );

  // Social providers (without 'official' — we inject it separately above)
  const providers = [
    { key:'facebook',  label:'Facebook',  icon:'/assets/social/icons-facebook.svg',  track:'facebook',  href: normUrl(links.facebook) },
    { key:'instagram', label:'Instagram', icon:'/assets/social/icons-instagram.svg', track:'instagram', href: normUrl(links.instagram) },
    { key:'youtube',   label:'YouTube',   icon:'/assets/social/icons-youtube.svg',   track:'youtube',   href: normUrl(links.youtube) },
    { key:'tiktok',    label:'TikTok',    icon:'/assets/social/icons-tiktok.svg',    track:'tiktok',    href: normUrl(links.tiktok) },
    // IMPORTANT: Pinterest now has a text label (no icon-only), so sizing matches others
    { key:'pinterest', label:'Pinterest', icon:'/assets/social/icons-pinterest.svg', track:'pinterest', href: normUrl(links.pinterest) },
    { key:'linkedin',  label:'LinkedIn',  icon:'/assets/social/icons-linkedin.svg',  track:'linkedin',  href: normUrl(links.linkedin) }, // not charted, harmless
    { key:'spotify',   label:'Spotify',   icon:'/assets/social/icons-spotify.svg',   track:'spotify',   href: normUrl(links.spotify) },
    { key:'whatsapp',  label:'WhatsApp',  icon:'/assets/social/icon-whatsapp.svg',   track:'whatsapp',  href: waUrl(contact.whatsapp) },
    { key:'telegram',  label:'Telegram',  icon:'/assets/social/icons-telegram.svg',  track:'telegram',  href: tgUrl(contact.telegram) },
    { key:'messenger', label:'Messenger', icon:'/assets/social/icons-messenger.svg', track:'messenger', href: msUrl(contact.messenger) }
  ];

  // Prepend 🌐 Website when available, ensuring it appears at the very top.
  // (Build the final rows explicitly so filtering can’t drop the Website row.)
  const officialRow = websiteHref ? {
    key: 'official',
    label: '🌐 Website',   // keep existing label
    icon: '',              // text-only row; no missing asset
    track: 'official',
    href: websiteHref
  } : null;

  const list = modal.querySelector('#social-modal-list');
  if (list) list.innerHTML = ''; // clear stale rows before rendering

  // Keep existing providers, but always put Website first when present.
  const socialRows = providers.filter(p => typeof p.href === 'string' && p.href.trim());
  const rows = officialRow ? [officialRow, ...socialRows] : socialRows;

  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'modal-menu-item';
    empty.setAttribute('aria-disabled','true');
    empty.style.pointerEvents = 'none';
    // emoji instead of missing website svg
    empty.innerHTML = `<span class="icon-img" aria-hidden="true">🌐</span><span>Links coming soon</span>`;
    list.appendChild(empty);
  } else {
    rows.forEach(r => {
      const a = document.createElement('a');
      a.className = 'modal-menu-item';
      const _id = String(id || '').trim();
      const _isULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(_id);

      // If we already have a ULID, send through /out for counting; otherwise fall back to plain link.
      a.href = _isULID ? `${TRACK_BASE}/out/${r.track}/${encodeURIComponent(_id)}?to=${encodeURIComponent(r.href)}`
                       : r.href;
      a.target = '_blank';
      a.rel = 'noopener';

      // If it's not a ULID, try to resolve on click; if resolved, count via /out, else just open plain.
      if (!_isULID) {
        a.add_hook_added__ = true; // keep: avoid double-binding if called twice
        a.addEventListener('click', async (ev) => {
          const resolved = await resolveULIDFor(_id);
          if (resolved) {
            ev.preventDefault();
            const url = `${TRACK_BASE}/out/${r.track}/${encodeURIComponent(resolved)}?to=${encodeURIComponent(r.href)}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        }, { capture: true });
      }

      // uniform row: 20×20 icon + text; no icon-only centering
      a.innerHTML =
        `<span class="icon-img">` +
          (r.icon ? `<img src="${r.icon}" alt="" width="20" height="20" style="display:block;object-fit:contain;">` : '') +
        `</span><span>${r.label || (r.key === 'pinterest' ? 'Pinterest' : '')}</span>`;

      // local guard identical to Navigation modal
      // removed beacon; server counts on redirect
      list.appendChild(a);
    });
  }

  setupTapOutClose(modalId);
  showModal(modalId);
}

// 🎯 Navigation modal (compact list with icons; header + red × like QR/Help)
function createNavigationModal({ name, lat, lng, id }) { // id for analytics
  const modalId = 'nav-modal'; // avoid param shadow
  document.getElementById(modalId)?.remove(); // remove canonical nav modal

  // Build modal shell via injectModal (body replaced right after)
  const m = injectModal({
    id: modalId,
    title: '',            // header built as top bar (uniform with QR/Help)
    layout: 'action',
    bodyHTML: `
        <div class="modal-menu-list" id="nav-modal-list"></div>
      `
  });

  // Top bar (sticky) — reuses your QR/Help style
  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">🎯 Navigation</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  m.querySelector('.modal-content')?.prepend(top);
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(modalId));

  // Build items (icons in /assets/social/) + per-provider tracking labels
  const list = m.querySelector('#nav-modal-list');
  const rows = [
    {
      label: 'Google Maps',
      icon: '/assets/social/icons-google-maps.svg',
      href: `${TRACK_BASE}/out/map/${encodeURIComponent(id)}?to=${encodeURIComponent(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)}`, // Google
      track: 'map' // server counts on redirect
    },
    {
      label: 'Waze',
      icon: '/assets/social/icons-waze.png',
      href: `${TRACK_BASE}/out/map/${encodeURIComponent(id)}?to=${encodeURIComponent(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`)}`, // Waze
      track: 'map' // server counts on redirect
    },
    {
      label: 'Apple Maps',
      emoji: '🍎',
      href: `${TRACK_BASE}/out/map/${encodeURIComponent(id)}?to=${encodeURIComponent(`https://maps.apple.com/?daddr=${lat},${lng}`)}`, // Apple
      track: 'map' // server counts on redirect
    }
  ];

  rows.forEach(r => {
    const btn = document.createElement('a');
    btn.className = 'modal-menu-item';
    btn.href = r.href;                   // initial (will be replaced at click)
    btn.target = '_blank';
    btn.rel = 'noopener';

    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const rawId = String(id || '').trim();
      const uid = await resolveULIDFor(rawId); // resolve slug → ULID before tracking
      const to = r.href.split('?to=').pop() || '';
      const url = uid ? `${TRACK_BASE}/out/map/${encodeURIComponent(uid)}?to=${to}` : decodeURIComponent(to); // Worker handles redirect + stats
      window.open(url, '_blank', 'noopener,noreferrer'); // open outside the app
    }, { capture: true });

    const iconHTML = r.emoji
      ? `<span class="icon-img" aria-hidden="true">${r.emoji}</span>`
      : `<span class="icon-img"><img src="${r.icon}" alt="" class="icon-img"></span>`;

    btn.innerHTML = `${iconHTML}<span>${r.label}</span>`;
    list.appendChild(btn);
  });
  
  // (removed ULID rewrite; links already use TRACK_BASE + data.id which is ULID-only)

  // Tap-out close & show
  setupTapOutClose(modalId);
  showModal(modalId);
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
  modal.style.display = ""; // ✅ Clear inline junk
  requestAnimationFrame(() => {
    modal.classList.add("visible");
  });

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
  }, { passive: true });

  // ESC: close (module-scoped; no globals)
  modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.remove(); });
  modal.tabIndex = -1; modal.focus();
  
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
  
  // ESC handled centrally in app.js; backdrop click only here
}

// 🎁 Donation modal
// Shows thank-you if isRepeat=true; otherwise full donate prompt.
// Handles modal injection, translations, buttons, and close behavior.
export function createDonationModal(isRepeat = false) {

  // rebuild fresh if any stale instance exists
  const existing = document.getElementById("donation-modal");
  if (existing) existing.remove();

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
      const amount = parseInt(btn.dataset.amount); // Stripe already initialized
      await handleDonation(amount);
    });
  });

  setupTapOutClose("donation-modal");
  showModal("donation-modal");        // open immediately

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