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

  // If descriptions are missing, use injected sources in order.
  // Keep legacy ID comparison; do not mutate incoming objects.
  if (!Object.keys(descs).length && payload.id) {
    const wantId = String(payload.id);

    // 1) geoPoints (may be legacy or unified) — injected
    if (Array.isArray(geoPoints)) {
      const found = geoPoints.find(x => String(x?.ID || x?.id) === wantId);
      if (found) descs = normalizeDescMap(found.descriptions);
    }

    // 2) profiles.locations (final merged dataset) — injected
    if (!Object.keys(descs).length && profiles && Array.isArray(profiles.locations)) {
      const found = profiles.locations.find(x => String(x?.id) === wantId);
      if (found) descs = normalizeDescMap(found.descriptions);
    }

    // 3) structureData (if accordion feeds from here) — injected
    if (!Object.keys(descs).length && Array.isArray(structureData)) {
      const found = structureData.find(x => String(x?.id) === wantId);
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
    if (/\/placeholder-images\//i.test(raw)) return '';
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

  // ▸ Footer (pinned): primary (🎯 📅 ⋮) + secondary (ℹ️ 📤 ⭐ 🍎 🧭 📍)
  // keep: accessible labels; emoji-first layout (compact via CSS)
  const footer = document.createElement('div');
  footer.className = 'modal-footer cta-compact';
  footer.innerHTML = `
    <button class="modal-footer-button" id="lpm-route"
            data-lat="${data?.lat ?? ''}" data-lng="${data?.lng ?? ''}" aria-label="Navigate">
      🎯 <span class="cta-label">Navigate</span>
    </button>

    <button class="modal-footer-button" id="lpm-book"
            aria-label="Book"><span class="cta-label">Book</span>📅</button>

    <button class="modal-footer-button" id="lpm-qr"
            aria-label="QR Code" title="QR Code">🔳 <span class="cta-label">QR Code</span></button>

    <button class="modal-footer-button" id="lpm-overflow"
            aria-label="More" aria-expanded="false">⋮ <span class="cta-label">More</span></button>

    <div id="lpm-secondary-actions" aria-hidden="true">
      <button class="modal-footer-button" id="som-info"  aria-label="Info">ℹ️ <span class="cta-label">Info</span></button>
      <button class="modal-footer-button" id="som-share" aria-label="Share">📤 <span class="cta-label">Share</span></button>
      <button class="modal-footer-button" id="som-save"  aria-label="Save">⭐ <span class="cta-label">Save</span></button>
      <button class="modal-footer-button" id="som-apple" aria-label="Apple Maps">🍎 <span class="cta-label">Apple Maps</span></button>
      <button class="modal-footer-button" id="som-waze"  aria-label="Waze">
        <img class="cta-icon" src="/assets/social/icons-waze.png" alt=""><span class="cta-label">Waze</span>
      </button>
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

  // Prefetch cover fast; avoid placeholder first paint (2 lines of comments).
  ;(async () => {
    try {
      const id = String(data?.id || '').trim();
      const need =
        !data?.media?.cover ||
        /placeholder-images/.test(String(data?.media?.cover || '')) ||
        /placeholder-images/.test(String(data?.imageSrc || ''));

      if (id && need) {
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
            if (hero && /placeholder-images/.test(hero.src)) hero.src = coverUrl;
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
    const heroIsPlaceholder = !!(hero && /\/placeholder-images\//i.test(hero.getAttribute('src') || ''));
    
    const id = String(data?.id || '').trim();
    const tryImg = (u) => new Promise(r => { if(!u) return r(false); const p=new Image(); p.onload=()=>r(u); p.onerror=()=>r(false); p.src=u; });
    if (hero && !heroIsPlaceholder) {
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

// ————————————————————————————
// LPM image slider (progressive enhancement over the placeholder <img>)
// ————————————————————————————
async function initLpmImageSlider(modal, data) {
  const mediaFigure = modal.querySelector('.location-media');
  if (!mediaFigure) return;

  // cover first; fall back to initial imageSrc; never invent names
  // Use only real cover or imageSrc; never placeholders
  const cover = (() => {
    const c = String(data?.media?.cover || data?.imageSrc || '').trim();
    return /\/placeholder-images\//i.test(c) ? '' : c;
  })();

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
  // treat folder + icon variant as placeholders (prevents dev green)
  const isPlaceholder = (u) =>
    /\/placeholder-images\//i.test(String(u || '')) || /icon-512.*green/i.test(String(u || ''));

  // candidates = cover + explicit (same-dir resolution for relatives)
  const candidates = uniq([cover, ...explicitRaw.map(toAbs)]).filter(u => !isPlaceholder(u));

  // Build initial playlist from candidates (cover + explicit)
  let playlist = candidates.slice();

  // Fallback: if <2, pull images from the profile API once (prod-safe).
  if (playlist.length < 2 && data?.id) {
    try {
      const r = await fetch(`/api/data/profile?id=${encodeURIComponent(data.id)}`, { cache: 'no-store', credentials: 'include' });
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
        playlist = uniq([cover, ...addl]).filter(u => !isPlaceholder(u)); // keep: no placeholders
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
  
  // guard these two imgs from placeholder URLs (dev flip case)
  const __imgSrcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const __guardSrc = (el) => {
    if (!__imgSrcDesc || !el) return;
    const { get, set } = __imgSrcDesc;
    Object.defineProperty(el, 'src', {
      configurable: true,
      enumerable: true,
      get(){ return get.call(this); },
      set(v){
        const s = String(v || '');
        if (/\/assets\/placeholder-images\//i.test(s) || /icon-512.*green/i.test(s)) return; // block green
        return set.call(this, v);
      }
    });
  };
  __guardSrc(canvasA);
  __guardSrc(canvasB);
    

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
    if (!s) return false; if (/\/assets\/placeholder-images\//i.test(s) || /icon-512.*green/i.test(s)) return false;

    // guard: never load known placeholders (incl. icon variant)
    if (/\/assets\/placeholder-images\//i.test(s) || /icon-512.*green/i.test(s)) return false;

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

    // 🎯 Route → open Google Maps with provided coords
    const btnRoute = modal.querySelector('#lpm-route');
    if (btnRoute) {
      btnRoute.addEventListener('click', (e) => {
        e.preventDefault();
        const latRaw = data?.lat ?? btnRoute.getAttribute('data-lat');
        const lngRaw = data?.lng ?? btnRoute.getAttribute('data-lng');
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { showToast('Missing coordinates', 1600); return; }
        _track('route');
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank', 'noopener');
      }, { passive: false });
    }

    // ⭐ Save → stub (hook your real flow later)
    const btnSave = modal.querySelector('#lpm-save');
    if (btnSave) {
      btnSave.addEventListener('click', (e) => {
        e.preventDefault();
        const id = String(data?.id || ''); if (!id) { showToast('Missing id', 1600); return; }
        const key = `saved:${id}`;
        const was = localStorage.getItem(key) === '1';
        localStorage.setItem(key, was ? '0' : '1');
        showToast(was ? 'Removed from Saved' : 'Saved', 1600); // auto hide
      });
    }

    // 📅 Book → open bookingUrl if present; else toast
    const btnBook = modal.querySelector('#lpm-book');
    if (btnBook) {
      btnBook.addEventListener('click', (e) => {
        e.preventDefault();                  // keep click inside the modal
        const link =
          data?.contact?.bookingUrl ||       // exporter target
          data?.links?.booking ||            // optional mirror
          '';

        if (link) {
          _track && _track('booking');       // analytics (only if defined)
          window.open(String(link), '_blank', 'noopener');
        } else {
          showToast('Booking link coming soon', 1600);
        }
      }, { passive: false });
    }

    // 🔳 QR → modal with QR; track click
    {
      const btn = modal.querySelector('#lpm-qr');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const uid = String(data?.id || '').trim();
          if (!uid) { showToast('Missing id', 1600); return; }

          // build simple modal
          const id = 'qr-modal'; document.getElementById(id)?.remove();
          const wrap = document.createElement('div'); wrap.className = 'modal visible'; wrap.id = id;
          const card = document.createElement('div'); card.className = 'modal-content modal-layout';
          const top = document.createElement('div'); top.className = 'modal-top-bar';
          top.innerHTML = `<h2 class="modal-title">QR Code</h2><button class="modal-close" aria-label="Close">&times;</button>`;
          top.querySelector('.modal-close')?.addEventListener('click', () => wrap.remove());

          const body = document.createElement('div'); body.className = 'modal-body';
          const inner = document.createElement('div'); inner.className = 'modal-body-inner';

          const img = document.createElement('img');
          img.alt = 'QR Code'; img.style.maxWidth = '100%'; img.style.height = 'auto';
          img.src = `https://navigen-api.4naama-39c.workers.dev/api/qr?school_uid=${encodeURIComponent(uid)}&size=512`;

          // use existing compact emoji buttons
          const actions = document.createElement('div');
          actions.className = 'modal-footer cta-compact';

          const shareBtn = document.createElement('button');
          shareBtn.className = 'modal-footer-button';
          shareBtn.type = 'button';
          shareBtn.setAttribute('aria-label', 'Share');
          shareBtn.title = 'Share';
          shareBtn.innerHTML = '📤 <span class="cta-label">Share</span>';
          shareBtn.onclick = async () => {
            _track && _track('share');
            try { if (navigator.share) await navigator.share({ title:'NaviGen QR', url: img.src }); } catch {}
          };

          const printBtn = document.createElement('button');
          printBtn.className = 'modal-footer-button';
          printBtn.type = 'button';
          printBtn.setAttribute('aria-label', 'Print');
          printBtn.title = 'Print';
          printBtn.innerHTML = '🖨️ <span class="cta-label">Print</span>';
          // print: open minimal doc, wait for load, then print + close
          // print: show full-screen overlay, print just the QR, then remove
          printBtn.onclick = () => {
            _track && _track('print');

            const src = img.src;

            // overlay
            const layer = document.createElement('div');
            layer.id = 'qr-print-layer';
            Object.assign(layer.style, {
              position:'fixed', inset:'0', background:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              zIndex:'999999'
            });

            // print-only CSS
            const style = document.createElement('style');
            style.id = 'qr-print-style';
            style.textContent = `
              @media print{
                body > *:not(#qr-print-layer){ display:none !important; }
                #qr-print-layer{ position:static !important; inset:auto !important; }
              }`;

            // image
            const pimg = document.createElement('img');
            pimg.alt = 'QR Code';
            pimg.src = src;
            pimg.style.maxWidth = '90vw';
            pimg.style.maxHeight = '90vh';
            layer.appendChild(pimg);

            const cleanup = () => {
              document.getElementById('qr-print-style')?.remove();
              document.getElementById('qr-print-layer')?.remove();
            };

            const go = () => {
              try { window.print(); } finally { setTimeout(cleanup, 300); }
            };

            document.head.appendChild(style);
            document.body.appendChild(layer);

            if (pimg.complete) go();
            else {
              pimg.addEventListener('load', go,   { once:true });
              pimg.addEventListener('error', cleanup, { once:true });
            }
          };

          actions.appendChild(shareBtn);
          actions.appendChild(printBtn);

          // mount
          inner.appendChild(img);
          body.appendChild(inner);
          body.appendChild(actions);

          card.appendChild(top); card.appendChild(body); wrap.appendChild(card); document.body.appendChild(wrap);

          // track
          _track('qr');
        });
      }
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

    // 🍎 Apple Maps (https) – safe on any platform
    const appleBtn = modal.querySelector('#som-apple');
    if (appleBtn) {
      appleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const lat = Number(data?.lat ?? moreBtn?.getAttribute('data-lat') ?? NaN);
        const lng = Number(data?.lng ?? moreBtn?.getAttribute('data-lng') ?? NaN);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { showToast('Missing coordinates', 1600); return; }
        _track('apple');
        const name = encodeURIComponent(String(data?.name || 'Location'));
        window.open(`https://maps.apple.com/?ll=${lat},${lng}&q=${name}`, '_blank', 'noopener');
      });
    }

    // 🧭 Waze (UL deep link via https)
    const wazeBtn = modal.querySelector('#som-waze');
    if (wazeBtn) {
      wazeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const lat = Number(data?.lat ?? moreBtn?.getAttribute('data-lat') ?? NaN);
        const lng = Number(data?.lng ?? moreBtn?.getAttribute('data-lng') ?? NaN);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { showToast('Missing coordinates', 1600); return; }
        _track('waze');
        window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank', 'noopener');
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
      a.id = id; a.href = href; a.target = '_blank'; a.rel = 'noopener';
      a.setAttribute('aria-label', label); a.title = label;
      a.innerHTML = `${emoji} <span class="cta-label">${label}</span>`;
      a.addEventListener('click', () => {
        // prefer explicit action; fallback to id-derived
        const act = action || (id.startsWith('som-') ? id.slice(4) : id);
        _track(String(act));
      });
      secondary.appendChild(a);
    };

    // Website + socials (render only if present)
    addLink('som-www',  '🔗', 'Website',   normUrl(data.official_url || data.links?.website),                  'website');
    addLink('som-fb',   '📘', 'Facebook',  normUrl(data.links?.Facebook || data.links?.facebook),              'facebook');
    addLink('som-ig',   '📸', 'Instagram', normUrl(data.links?.Instagram || data.links?.instagram),            'instagram');
    addLink('som-yt',   '▶️', 'YouTube',   normUrl(data.links?.YouTube  || data.links?.Youtube || data.links?.youtube), 'youtube');
    addLink('som-tt',   '🎵', 'TikTok',    normUrl(data.links?.TikTok   || data.links?.tiktok),                'tiktok');
    addLink('som-pin',  '📌', 'Pinterest', normUrl(data.links?.Pinterest || data.links?.pinterest),            'pinterest');
    addLink('som-spot', '🎧', 'Spotify',   normUrl(data.links?.Spotify  || data.links?.spotify),               'spotify');

    // Contact
    addLink('som-call', '📞', 'Call',      data.contact?.phone  ? `tel:${String(data.contact.phone).trim()}` : '', 'phone');
    addLink('som-mail', '📧', 'Email',     data.contact?.email  ? `mailto:${String(data.contact.email).trim()}` : '', 'email');
    // Fetch contact on click when not present
    ;(function wireContactFetch(){
      const id = String(data?.id||'').trim(); if (!id) return;
      const call = modal.querySelector('#som-call');
      const mail = modal.querySelector('#som-mail');
      const bookBtn = modal.querySelector('#lpm-book');

      if (call && !call.href) call.addEventListener('click', async (e) => {
        e.preventDefault();
        const toURL = (p) => new URL(
          p,
          document.querySelector('meta[name="api-origin"]')?.content?.trim()
            || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'https://navigen.io' : location.origin)
        ).toString();
        try { const r = await fetch(toURL(`/api/data/contact?id=${encodeURIComponent(id)}&kind=phone`));
          if (r.ok){ const j=await r.json(); if (j.href) location.href=j.href; } } catch {}
      });

      if (mail && !mail.href) mail.addEventListener('click', async (e) => {
        e.preventDefault();
        const toURL = (p) => new URL(
          p,
          document.querySelector('meta[name="api-origin"]')?.content?.trim()
            || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'https://navigen.io' : location.origin)
        ).toString();
        try { const r = await fetch(toURL(`/api/data/contact?id=${encodeURIComponent(id)}&kind=email`), { credentials: 'include' });
          if (r.ok){ const j=await r.json(); if (j.href) location.href=j.href; } } catch {}
      });

      // booking: fetch JSON; open once; toast when missing
      if (bookBtn) {
        const orig = bookBtn.onclick;
        bookBtn.onclick = async (ev) => {
          ev.preventDefault();
          const id = String(data?.id || '');
          const direct = data?.contact?.bookingUrl || data?.links?.booking || '';
          if (direct) { if (orig) return orig(ev); window.open(String(direct), '_blank', 'noopener'); return; }

          const base = document.querySelector('meta[name="api-origin"]')?.content?.trim()
            || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'https://navigen.io' : location.origin);
          const url  = new URL(`/api/data/contact?id=${encodeURIComponent(id)}&kind=booking`, base).toString();

          try {
            const r = await fetch(url, { credentials: 'include' });
            if (r.ok) {
              const j = await r.json().catch(() => ({}));
              if (j && j.href) { window.open(String(j.href), '_blank', 'noopener'); return; }
            }
            showToast('Booking link coming soon', 1600); // short, calm message
          } catch {
            showToast('Booking link coming soon', 1600);
          }
        };
      }

    })();
    
    addLink('som-wa',   '🟢', 'WhatsApp',  waUrl(data.contact?.whatsapp),   'whatsapp');
    addLink('som-tg',   '📣', 'Telegram',  tgUrl(data.contact?.telegram),   'telegram');
    addLink('som-msgr', '💬', 'Messenger', msgrUrl(data.contact?.messenger),'messenger');

    // ⭐ Save (secondary) → local toggle
    const save2 = modal.querySelector('#som-save');
    if (save2) {
      save2.addEventListener('click', (e) => {
        e.preventDefault();
        const id = String(data?.id || '');
        if (!id) { showToast('Missing id', 1600); return; }
        const key = `saved:${id}`;
        const was = localStorage.getItem(key) === '1';
        localStorage.setItem(key, was ? '0' : '1');
        showToast(was ? 'Removed from Saved' : 'Saved', 1600); // auto-close
      });
    }

    // 📤 Share (placeholder; OS share → clipboard fallback)
    const shareBtn = modal.querySelector('#som-share');
    if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        _track('share');
        const name = String(data?.name || 'Location');
        const coords = [data?.lat, data?.lng].filter(Boolean).join(', ');
        const text = coords ? `${name} — ${coords}` : name;
        try {
          if (navigator.share) { await navigator.share({ title: name, text }); }
          else { await navigator.clipboard.writeText(text); showToast('Copied to clipboard', 1600); }
        } catch {}
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
        _track && _track(`rate-${n}`);   // analytics bucket: rate-1..rate-5
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
    const _track = (action) => {
      const uid = String(data?.id || '').trim(); if (!uid) return;
      try {
        navigator.sendBeacon(
          'https://navigen-api.4naama-39c.workers.dev/api/track',
          new Blob([JSON.stringify({ event:'cta_click', school_uid:uid, action })], { type:'application/json' })
        );
      } catch {}
    };
    
  }

  // call wiring + reveal
  wireLocationProfileModal(modal, data, data?.originEl);
  showModal('location-profile-modal');

  // 🔎 Enrich LPM from Data API (non-blocking; keeps UX instant)
  ;(async () => {
    try {
      const id = String(data?.id || '').trim(); if (!id) return;
      const res = await fetch(API(`/api/data/profile?id=${encodeURIComponent(id)}`), { cache: 'no-store', credentials: 'include' });
      if (!res.ok) return;
      const payload = await res.json();

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
        if (img && /placeholder/.test(img.src)) img.src = payload.media.cover;
      }
    } catch {}
  })();


  // 5. Reveal modal (remove .hidden, add .visible, focus trap etc.)
  // (done above via showModal)

}

// modal-injector.js

// Track modal items globally within this module
let myStuffItems = [];

// 🌐 Import translation function for localized modal titles and text
import { t } from './scripts/i18n.js';

// Stripe: only the donation action here (init comes from caller)
import { handleDonation } from "./scripts/stripe.js";

// keep: minimal helper; picks API base per env (prod=same-origin)
const API = (path) => {
  const meta = document.querySelector('meta[name="api-origin"]')?.content?.trim();
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  // keep: meta override; prefer same-origin on localhost to avoid 401
  const base = meta || location.origin;
  return new URL(path, base).toString();
};

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
  btn.textContent = loc["Short Name"] || loc.Name || "Unnamed";
  btn.setAttribute('data-id', loc.ID);
  btn.classList.add('location-button');
  btn.dataset.lower = (loc["Short Name"] || loc.Name || "Unnamed").toLowerCase();
  
  // Expose searchable metadata: name/shortName for text, data-tags with keys minus "tag."
  const _tags = Array.isArray(loc?.tags) ? loc.tags : [];
  btn.setAttribute('data-name', btn.textContent);
  btn.setAttribute('data-short-name', String(loc["Short Name"] || ''));
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
    if (!cover || images.length < 2) { console.warn('Data error: cover+2 images required', loc?.ID || loc?.id); return; }

    // Open the Location Profile Modal; include contact + links for CTAs
    showLocationProfileModal({
      id: btn.getAttribute('data-id'),
      name: btn.textContent,
      lat, lng,
      imageSrc: cover,
      images,
      media,
      descriptions: (loc && typeof loc.descriptions === 'object') ? loc.descriptions : {},
      tags: Array.isArray(loc?.tags) ? loc.tags : [],

      // keep if you already added them; otherwise these help other CTAs too
      contact: (loc && typeof loc.contact === 'object') ? loc.contact : {},
      links:   (loc && typeof loc.links   === 'object') ? loc.links   : {},

      originEl: btn
    });

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
export function openViewSettingsModal({ title, contextLine, note, options, currentKey, resetLabel, onPick }) {
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
  const line2 = doc.createElement('p'); line2.textContent = note;                  // “Applies to this page only”
  const line3 = doc.createElement('p'); line3.textContent = contextLine;          // 🏫 Language Schools › brand › scope
  inner.append(line2, line3);

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