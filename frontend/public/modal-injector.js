// analytics: unified endpoint; always use live worker for all environments
const TRACK_BASE = 'https://navigen-api.4naama.workers.dev';

// QR helper: cache remote ESM import for QRCode usage
let qrLibPromise;
function getQRCodeLib() {
  if (!qrLibPromise) {
    // load UMD build once, then reuse in-memory QRCode reference for all profiles
    qrLibPromise = new Promise((resolve, reject) => {
      if (globalThis.QRCode) {            // already loaded in this tab
        resolve(globalThis.QRCode);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.2.2/build/qrcode.min.js';
      script.async = true;
      script.onload = () => {
        if (globalThis.QRCode) resolve(globalThis.QRCode);
        else reject(new Error('QRCode global missing after load'));
      };
      script.onerror = () => reject(new Error('Failed to load QRCode library'));
      document.head.appendChild(script);
    });
  }
  return qrLibPromise;
}

// Show Promotion QR Code in its own modal (QR only, like Business QR size)
// locationIdOrSlug is used for optional customer-side confirmation logging.
function showPromotionQrModal(qrUrl, locationIdOrSlug) {
  const id = 'promo-qr-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';

  const hasT = (typeof t === 'function');
  const titleText =
    (hasT ? (t('qr.role.campaign-redeem-label') || '') : '') ||
    'Campaign Redemption QR';

  top.innerHTML = `
    <h2 class="modal-title">${titleText}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body'; // scroll owner (My Stuff parity)

  const inner = document.createElement('div');
  inner.className = 'modal-body-inner'; // padding + floor owner

  const qrContainer = document.createElement('div');
  qrContainer.className = 'qr-wrapper';

  const img = document.createElement('img');
  img.alt = 'Promotion QR code';
  img.className = 'qr-image';
  img.style.maxWidth = '80%';
  img.style.height = 'auto';
  img.style.display = 'block';
  img.style.margin = '0 auto';

  qrContainer.appendChild(img);

  // Show QR instructions and terms above the QR image
  const descText =
    (hasT ? (t('qr.role.campaign-redeem-desc') || '') : '') ||
    'Show this QR code to the cashier when paying to redeem your campaign offer.';

  const warningText =
    (hasT ? (t('qr.role.campaign-redeem-warning') || '') : '') ||
    'After scanning, wait for confirmation (10–20 seconds).';

  const termsText =
    (hasT ? (t('campaign.redeem-terms') || '') : '') ||
    'By redeeming, I agree to the offer terms.';

  // 1) main instruction
  const pInstr = document.createElement('p');
  pInstr.textContent = descText;
  pInstr.style.textAlign = 'left';
  pInstr.style.fontSize = '0.85em';
  pInstr.style.marginTop = '1rem';
  pInstr.style.marginBottom = '1rem'; // blank line before the next paragraph
  inner.appendChild(pInstr);

  // 2) terms + scan wait notice (kept together, single spacing)
  const pTerms = document.createElement('p');
  pTerms.style.textAlign = 'left';
  pTerms.style.fontSize = '0.85em';
  pTerms.style.opacity = '0.8';
  pTerms.style.marginTop = '0'; // keep top flush; spacing is owned by pInstr marginBottom

  // Order is explicit:
  // 1) Agreement line
  // 2) Scan → confirmation wait line
  const warningHtml = String(warningText).replace(
    /10–20 seconds|10-20 seconds/i,
    `<span class="qr-wait-highlight">$&</span>`
  );
  pTerms.innerHTML = `${warningHtml}<br><br>${termsText}`;

  inner.appendChild(pTerms);

  // 3) actual QR code
  inner.appendChild(qrContainer);

  // 4) post-QR thanks line (t(key); shown under QR)
  const thanksText =
    (hasT ? (t('qr.role.campaign-redeem-thanks') || '') : '') ||
    'Thank you!';

  // post-QR thanks line (t(key); shown under QR)
  const pThanks = document.createElement('p');
  pThanks.style.marginBottom = '0'; // eliminate space after "Thank you!"
  pThanks.textContent = thanksText;
  pThanks.style.textAlign = 'center';
  inner.appendChild(pThanks);

  body.appendChild(inner);

  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  // Customer-side redeem status polling (token-aware, short-lived).
  // When the token is redeemed on the cashier device, we can ask the customer for quick feedback.
  try {
    const urlObj = new URL(qrUrl);
    const redeemToken = (urlObj.searchParams.get('rt') || '').trim();
    let stopped = false;

    const stop = () => { stopped = true; };

    // Stop polling if modal is closed by the user
    top.querySelector('.modal-close')?.addEventListener('click', stop);

    const base = TRACK_BASE || 'https://navigen-api.4naama.workers.dev';

    const showCustomerConfirm = () => {
      if (!locationIdOrSlug) return;
      const id = 'customer-redeem-feedback';
      document.getElementById(id)?.remove();

      const wrap2 = document.createElement('div');
      wrap2.className = 'modal hidden';
      wrap2.id = id;

      const card2 = document.createElement('div');
      card2.className = 'modal-content modal-layout';

      const top2 = document.createElement('div');
      top2.className = 'modal-top-bar';
      const hasT = (typeof t === 'function');
      const titleTxt =
        (hasT ? (t('redeem.customer.title') || '') : '') ||
        'Thank you!';
      top2.innerHTML = `
        <h2 class="modal-title">${titleTxt}</h2>
        <button class="modal-close" aria-label="Close">&times;</button>
      `;
      top2.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

      const body2 = document.createElement('div');
      body2.className = 'modal-body';
      const inner2 = document.createElement('div');
      inner2.className = 'modal-body-inner';

      const qTxt =
        (hasT ? (t('redeem.customer.question') || '') : '') ||
        'How was your redeem experience?';

      const pQ2 = document.createElement('p');
      pQ2.textContent = qTxt;
      pQ2.style.textAlign = 'center';
      pQ2.style.marginBottom = '0.75rem';
      inner2.appendChild(pQ2);

      const row2 = document.createElement('div');
      row2.style.display = 'flex';
      row2.style.justifyContent = 'center';
      row2.style.gap = '0.5rem';

      const faces2 = [
        { emoji: '😕', score: 1 },
        { emoji: '😐', score: 2 },
        { emoji: '🙂', score: 3 },
        { emoji: '😄', score: 4 },
        { emoji: '🤩', score: 5 }
      ];

      const sendCustomerConfirm = (score) => {
        try {
          const hit = new URL(`/hit/redeem-confirmation-customer/${encodeURIComponent(locationIdOrSlug)}`, base);
          hit.searchParams.set('score', String(score));
          fetch(hit.toString(), { method: 'POST', keepalive: true }).catch(() => {});
        } catch {
          // don't break UI on logging errors
        }
      };

      faces2.forEach((f) => {
        const btn2 = document.createElement('button');
        btn2.type = 'button';
        btn2.textContent = f.emoji;
        btn2.style.fontSize = '1.5rem';
        btn2.style.border = 'none';
        btn2.style.background = 'transparent';
        btn2.style.cursor = 'pointer';
        btn2.addEventListener('click', () => {
          sendCustomerConfirm(f.score);
          hideModal(id);
        });
        row2.appendChild(btn2);
      });

      inner2.appendChild(row2);
      body2.appendChild(inner2);
      card2.appendChild(top2);
      card2.appendChild(body2);
      wrap2.appendChild(card2);
      document.body.appendChild(wrap2);
      showModal(id);
    };

    const pollStatus = async () => {
      if (stopped || !redeemToken) return;
      try {
        const statusUrl = new URL('/api/redeem-status', base);
        statusUrl.searchParams.set('token', redeemToken);
        const res = await fetch(statusUrl.toString(), { cache: 'no-store' });
        if (res.ok) {
          const payload = await res.json().catch(() => null);
          const status = String(payload?.status || '').toLowerCase();
          if (status === 'redeemed') {
            stopped = true;
            showCustomerConfirm();
            return;
          }
          if (status === 'invalid') {
            stopped = true;
            return;
          }
        }
      } catch {
        // ignore transient errors; keep trying a few times
      }
      if (!stopped) {
        setTimeout(pollStatus, 3000); // short poll cadence
      }
    };

    // Start polling after a brief delay to allow the cashier to scan the code
    if (redeemToken) {
      setTimeout(pollStatus, 5000);
    }
  } catch {
    // ignore QR URL parse errors; promotion modal still works without status polling
  }

  getQRCodeLib()
    .then((QRCode) => QRCode.toDataURL(qrUrl, { width: 512, margin: 1 }))
    .then((dataUrl) => { img.src = dataUrl; })
    .catch((err) => {
      console.warn('Promotion QR generation failed', err);
      img.alt = 'QR unavailable';
    });

  showModal(id);
}

// Promotion helper: show campaign details + button to open the Redemption QR modal
async function openPromotionQrModal(modal, data) {
  try {
    const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    const hasT = (typeof t === 'function');

    const tmpl = (key, fallback) => {
      const raw = hasT ? (t(key) || '') : '';
      return raw && typeof raw === 'string' ? raw : fallback;
    };

    const applyTemplate = (str, vars) =>
      String(str || '').replace(/{{(\w+)}}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m));

    // Collect possible identifiers
    const domId     = String(modal?.getAttribute('data-locationid') || '').trim();
    const payloadId = String(data?.locationID || '').trim();
    const alias     = String(data?.alias || '').trim();
    const rawId     = String(data?.id || '').trim();

    const candidates = [domId, payloadId, alias, rawId]
      .map(v => String(v || '').trim())
      .filter(Boolean);

    let locationIdOrSlug = '';
    for (const c of candidates) {
      if (!ULID.test(c)) { locationIdOrSlug = c; break; }
    }
    if (!locationIdOrSlug && candidates.length) locationIdOrSlug = candidates[0];

    if (!locationIdOrSlug) {
      showToast('Promotions unavailable for this location', 1600);
      return;
    }

    // Call promo-qr on navigen-api; no cookies needed
    const apiUrl = new URL('/api/promo-qr', TRACK_BASE);
    apiUrl.searchParams.set('locationID', locationIdOrSlug);

    const res = await fetch(apiUrl.toString(), { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 403) {
        // Campaign required for promos (owner-gated). Use existing owner copy.
        const msg =
          (typeof t === 'function' && t('promo.gated.campaignRequired')) ||
          'Promotions are available only while this business is running an active NaviGen campaign.';

        showToast(msg, 3500);
      } else if (res.status === 404) {
        showToast('Promotions will appear here soon.', 2000);
      } else {
        console.warn('openPromotionQrModal: /api/promo-qr error', res.status);
        showToast('Promotions unavailable for this location', 2000);
      }
      return;
    }

    const payload = await res.json().catch(() => null);
    const qrUrl = String(payload?.qrUrl || '').trim();
    const campaignName   = String(payload?.campaignName || '').trim();
    const startDate      = String(payload?.startDate || '').trim();
    const endDate        = String(payload?.endDate || '').trim();
    const eligibilityType= String(payload?.eligibilityType || '').trim();
    const discountKind   = String(payload?.discountKind || '').trim();
    const discountValue  = typeof payload?.discountValue === 'number' ? payload.discountValue : null;

    if (!qrUrl) {
      console.warn('openPromotionQrModal: missing qrUrl in API response');
      showToast('Promotion QR unavailable', 1600);
      return;
    }

    const locName = String(data?.name || data?.displayName || 'this location').trim() || 'this location';

    // Build discount line, e.g. "10% off your purchase at Stage X"
    const discountText = (discountKind === 'percent' && typeof discountValue === 'number')
      ? `${discountValue.toFixed(0)}% off your purchase`
      : (campaignName || 'Promotion');

    const offerTemplate = tmpl('promotion.offer-line', '{{discount}} at {{locationName}}');
    const promoLine = applyTemplate(offerTemplate, {
      discount: discountText,
      locationName: locName
    });

    // Compute "Expires in {{days}}"
    let daysLeftText = '';
    if (endDate) {
      const now = new Date();
      const end = new Date(endDate + 'T23:59:59Z');
      const diffMs = end.getTime() - now.getTime();
      const diffDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 0);
      const expiresTemplate = tmpl('promotion.period-expires', 'Expires in {{days}} days');
      daysLeftText = applyTemplate(expiresTemplate, { days: diffDays });
    }

    // Remove any previous Promotion modal
    const modalId = 'promotion-modal';
    document.getElementById(modalId)?.remove();

    const wrap = document.createElement('div');
    wrap.className = 'modal hidden';
    wrap.id = modalId;

    const card = document.createElement('div');
    card.className = 'modal-content modal-layout';

    const top = document.createElement('div');
    const promoTitle = tmpl('promotion.title', 'Promotion Details');
    top.className = 'modal-top-bar';
    top.innerHTML = `
      <h2 class="modal-title">${promoTitle}</h2>
      <button class="modal-close" aria-label="Close">&times;</button>
    `;
    top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(modalId));

    const body = document.createElement('div');
    body.className = 'modal-body';
    const inner = document.createElement('div');
    inner.className = 'modal-body-inner';

    // 1–2) Promotion summary card (non-clickable; no chevron/arrow)
    {
      const safeDate = (v) => {
        const s = String(v || '').trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
      };

      const startStr = safeDate(startDate);
      const endStr = safeDate(endDate);
      const range = (startStr && endStr) ? `${startStr} \u2192 ${endStr}` : '';

      const summary = document.createElement('div');
      summary.className = 'modal-menu-item promo-summary-card';
      summary.innerHTML = `
        <div class="label" style="flex:1 1 auto; min-width:0;">
          <strong>${discountText}</strong><br>
          <small>${locName}</small><br>
          ${range ? `<small>${range}</small>` : ``}
        </div>
      `;
      inner.appendChild(summary);
    }

    // Expires line (under the grey card)
    if (daysLeftText) {
      const pExpires = document.createElement('p');
      // Highlight the "N days" tail (soft-alert color)
      const m = String(daysLeftText).match(/^(.*?)(\b\d+\s+days\b.*)$/i);
      pExpires.innerHTML = m
        ? `${m[1]}<span class="promo-expires-days">${m[2]}</span>`
        : String(daysLeftText);
      pExpires.style.textAlign = 'left';
      pExpires.style.fontSize = '0.85em';
      pExpires.style.opacity = '0.8';
      inner.appendChild(pExpires);
    }

    // Single in-store + scan rule line
    {
      const warnText = tmpl(
        'promo.qr.wait',
        'The offer is valid for in-store redemption and only when scanned by the cashier.'
      );
      const pWarn = document.createElement('p');
      pWarn.textContent = warnText;
      pWarn.style.textAlign = 'left';
      pWarn.style.fontSize = '0.85em';
      pWarn.style.opacity = '0.8';
      inner.appendChild(pWarn);
    }

    // 9) Button: “I’m at the cashier — 🔳 show my code”
    const btnWrap = document.createElement('div');
    btnWrap.className = 'modal-actions';

    const qrBtn = document.createElement('button');
    qrBtn.type = 'button';
    qrBtn.className = 'modal-body-button';
    qrBtn.textContent = tmpl('campaign.redeem-button', "I'm at the cashier — 🔳 show my code");
    qrBtn.addEventListener('click', () => {
      hideModal(modalId);
      // Open the Promotion QR modal and pass location ID/slug for customer confirmation tracking
      showPromotionQrModal(qrUrl, locationIdOrSlug);
    });

    // 10) Only tap this when you're ready to pay. (small)
    const hintText = tmpl('promotion.redeem-hint', "Only tap this when you're ready to pay.");
    const hint = document.createElement('p');
    hint.textContent = hintText;
    hint.style.textAlign = 'left';
    hint.style.fontSize = '0.85em'; // small
    hint.style.opacity = '0.8';
    inner.appendChild(hint);

    btnWrap.appendChild(qrBtn);
    inner.appendChild(btnWrap);

    body.appendChild(inner);
    card.appendChild(top);
    card.appendChild(body);
    wrap.appendChild(card);
    document.body.appendChild(wrap);

    showModal(modalId);
  } catch (err) {
    console.warn('openPromotionQrModal failed', err);
    showToast('Promotions unavailable for this location', 2000);
  }
}

// QR scan: fire qr-scan hit only for external arrivals to ?lp=...
// Internal app navigations set a one-time sessionStorage marker to suppress phantom scan counts.
(() => { try {
  const url = new URL(window.location.href);
  const lp = (url.searchParams.get('lp') || '').trim();
  if (!lp) return;

  // If the app itself navigated to ?lp=..., do NOT count as a QR scan.
  const k = 'navigen.internalLpNav';
  if (sessionStorage.getItem(k) === '1') {
    sessionStorage.removeItem(k); // one-time suppression
    return;
  }

  fetch(`${TRACK_BASE}/hit/qr-scan/${encodeURIComponent(lp)}`, { method:'POST', keepalive:true }).catch(() => {});
} catch (_) { /* tracking must never break page load */ } })();

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
    const url = `${location.origin}/api/status?locationID=${encodeURIComponent(s)}`;
    const r = await fetch(url, { cache: 'no-store', credentials: 'omit' });
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

  // Rootize hero src; prefer media.cover → imageSrc → first media/images entry. (Green icon is a valid cover.)
  const body = document.createElement('div');
  body.className = 'modal-body';

  const heroSrc = (() => {
    const pickFirstSrc = (arr) => {
      const a = Array.isArray(arr) ? arr : [];
      const v = a[0];
      return String((v && typeof v === 'object') ? (v.src || '') : (v || '')).trim();
    };

    const raw =
      String((payload?.media?.cover || payload?.imageSrc || '')).trim() ||
      pickFirstSrc(payload?.media?.images) ||
      pickFirstSrc(payload?.images);

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
      <div class="lpm-owned-badge" style="display:none;margin-top:0.5rem;font-size:0.9em;opacity:0.9;"></div>

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

  // ▸ Footer (pinned): primary (🎁️ 📅 ⭐ 🔳 ⋮) + secondary (🎯 ℹ️ 📡 🌍 📣 📤)  // define footer first
  const footerEl = document.createElement('div');
  footerEl.className = 'modal-footer cta-compact'; // sticky bottom behavior remains in CSS so this row stays glued to the LPM edge
  footerEl.innerHTML = `
    <!-- Row 1: 🎁️ 📅 ⭐ 🔳 ⋮ -->
    <button class="modal-footer-button" id="lpm-tag" aria-label="Tag">
      🎁️ <span class="cta-label">Tag</span>
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

      <!-- 🤖 Assistant (penultimate, before dash/Stats) -->
      <button class="modal-footer-button" id="som-bot" aria-label="Assistant">
        🤖 <span class="cta-label">Bot</span>
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
  // Ensure hero is available before first paint.
  // Some callers pass only {locationID, name...} and omit media; the green icon is a valid hero when present.
  const locKey = String(data?.locationID || '').trim();
  const hasCover = Boolean(String(data?.media?.cover || data?.imageSrc || '').trim());

  if (!hasCover && locKey) {
    const hero = `/assets/location-profile-images/${locKey}/icon-512-green.png`;
    data.media = (data.media && typeof data.media === 'object') ? data.media : {};
    data.media.cover = hero;
    // Keep images aligned with cover so the slider can initialize consistently
    if (!Array.isArray(data.media.images) || !data.media.images.length) {
      data.media.images = [{ src: hero, alt: data?.name || '', default: true }];
    }
    if (!data.imageSrc) data.imageSrc = hero;
  }

  const modal = createLocationProfileModal(data);

  // 4. Append to body and expose identifier to handlers (prefer alias for URL; fallback to short; never cache ULID)
  document.body.appendChild(modal);
  ;(async () => {
    try {
      const slug = String(data?.locationID || '').trim();
      if (!slug) return;

      const u = new URL('/api/status', location.origin);
      u.searchParams.set('locationID', slug);

      const r = await fetch(u.toString(), { cache: 'no-store', credentials: 'omit' });
      if (!r.ok) return;

      const j = await r.json().catch(() => null);
      if (j?.ownedNow !== true) return;

      const el = modal.querySelector('.lpm-owned-badge');
      if (!el) return;

      // 🎁 is campaign-only. If no active campaign, show ONLY the taken line.
      let campaignEndISO = '';

      try {
        const slug = String(data?.locationID || '').trim();
        if (slug) {
          const rCamp = await fetch('/data/campaigns.json', { cache: 'no-store' });
          if (rCamp.ok) {
            const rows = await rCamp.json().catch(() => null);
            const arr = Array.isArray(rows) ? rows : [];

            const now = new Date();
            const active = arr.filter((c) => {
              if (String(c?.locationID || '').trim() !== slug) return false;
              if (String(c?.status || '').trim().toLowerCase() !== 'active') return false;

              const start = new Date(String(c?.startDate || '').trim());
              const end   = new Date(String(c?.endDate || '').trim());

              // If dates are malformed but status=Active, still allow the 🎁 hint.
              if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
              return now >= start && now <= end;
            });

            // pick the soonest endDate if multiple are active
            const ends = active
              .map(c => String(c?.endDate || '').trim())
              .filter(Boolean)
              .sort(); // YYYY-MM-DD sorts lexicographically correctly

            campaignEndISO = ends[0] || '';
          }
        }
      } catch {
        // never break LPM; fallback is just 🔴 Taken
      }

      // No active campaign → omit 🎁 and omit date entirely
      if (!campaignEndISO) {
        el.innerHTML = (typeof t === 'function' && t('lpm.owned.badge.taken')) || '🔴 Taken';
        el.style.display = 'block';
        return;
      }

      // Active campaign → render 🎁 lines using campaign endDate (NOT exclusiveUntil)
      const end = new Date(`${campaignEndISO}T00:00:00Z`);
      const endSafe = Number.isNaN(end.getTime()) ? new Date(campaignEndISO) : end;
      const lang = document.documentElement.lang || 'en';
      const safeLang = /^en/i.test(lang) ? 'en-US' : lang;

      const dateTxt = Number.isNaN(endSafe.getTime())
        ? ''
        : `${new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(endSafe)} - ${new Intl.DateTimeFormat(
            'en-US',
            { month: 'short', day: '2-digit', year: 'numeric' }
          ).format(endSafe)}`;

      const takenLine =
        (typeof t === 'function' && t('lpm.owned.badge.taken')) ||
        '🔴 Taken';

      const campaignTpl =
        (typeof t === 'function' && t('lpm.owned.badge.campaignActive')) ||
        '🎁️ Campaign active until<br>{{date}}';

      el.innerHTML = `${takenLine}<br>${String(campaignTpl).replace('{{date}}', dateTxt)}`;

      // keep composed output (takenLine + campaignTpl); do not overwrite
      el.style.display = 'block';

    } catch {
      // never break LPM
    }
  })();
  
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
  // Use cover if present; otherwise fall back to the first declared image (green icon is valid).
  const pickFirstSrc = (arr) => {
    const a = Array.isArray(arr) ? arr : [];
    const v = a[0];
    return String((v && typeof v === 'object') ? (v.src || '') : (v || '')).trim();
  };

  const cover = (
    String(data?.media?.cover || data?.imageSrc || '').trim() ||
    pickFirstSrc(data?.images) ||
    pickFirstSrc(data?.media?.images)
  );

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
  if (playlist.length < 2 && String(data?.locationID || data?.id || '').trim()) {
    try {
      const key = String(data?.locationID || data?.id || '').trim(); // slug first
      const r = await fetch(API(`/api/data/item?id=${encodeURIComponent(key)}`), { cache: 'no-store', credentials: 'include' }); // use Worker
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

    // 🎁 Tag → Promotion QR (if promotions are available for this location)
    {
      const tagBtn = modal.querySelector('#lpm-tag');
      if (tagBtn) {
        tagBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          openPromotionQrModal(modal, data);
        }, { passive: false });
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

            // use profiles.json qrUrl when present; otherwise fall back to ?lp=<id>
            const slugOrId = String(data?.locationID || data?.id || uid || '').trim();
            const qrUrl = (typeof data?.qrUrl === 'string') ? data.qrUrl.trim() : '';
            const qrPayload = qrUrl || `${location.origin}/?lp=${encodeURIComponent(slugOrId)}`;

            getQRCodeLib()
              .then((QRCode) => QRCode.toDataURL(qrPayload, { width: 512, margin: 1 }))
              .then((dataUrl) => {
                img.src = dataUrl;
              })
              .catch((err) => {
                console.warn('QR generation failed', err); // generator-only error; no external fallback
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
              const raw = String(data?.id || data?.locationID || '').trim();
              const target = qrPayload || (raw ? `${location.origin}/?lp=${encodeURIComponent(raw)}` : '');

              // count Share for this location (slug or ULID; Worker resolves via canonicalId)
              if (raw) {
                try {
                  await fetch(
                    `${TRACK_BASE}/hit/share/${encodeURIComponent(raw)}`,
                    { method: 'POST', keepalive: true }
                  ).catch(() => {});
                } catch {
                  // tracking must not block sharing
                }
              }

              try {
                if (navigator.share && target) {
                  await navigator.share({ title: 'NaviGen QR', url: target });
                } else if (target && navigator.clipboard) {
                  await navigator.clipboard.writeText(target);
                  showToast('Link copied to clipboard', 1600);
                }
              } catch (err) {
                console.warn('QR share failed', err);
              }
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

      // Suppress one auto-open after Stripe checkout return (owner self-traffic).
      if (sessionStorage.getItem('navigen.suppressLpmOpenOnce') === '1') {
        sessionStorage.removeItem('navigen.suppressLpmOpenOnce');
        return;
      }

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
    const signalBtn = modal.querySelector('#som-signal'); // 📡 Communication (Call / Email / apps)
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
    if (signalBtn) {
      signalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const contact = (data && data.contactInformation) || {};
        const name = String(data?.displayName ?? data?.name ?? 'Location').trim() || 'Location';
        const rawId = String(data?.id || data?.locationID || '').trim();

        createCommunicationModal({
          name,
          contact,
          id: rawId
        });
      }, { capture: true, passive: false });
    }

    // ⋮ toggle secondary actions
    const moreBtn = modal.querySelector('#lpm-overflow');
    const secondary = modal.querySelector('#lpm-secondary-actions');
    if (moreBtn && secondary) {
      // treat secondary row as a floating popover above the primary CTA row
      moreBtn.setAttribute('aria-haspopup', 'menu');
      moreBtn.setAttribute('aria-expanded', 'false');
      secondary.setAttribute('role', 'menu');
      secondary.setAttribute('aria-hidden', 'true');

      // anchor popover to the footer; grow upwards over the content
      const footer = moreBtn.closest('.modal-footer');
      if (footer && getComputedStyle(footer).position === 'static') {
        footer.style.position = 'relative'; // ensure we always have a positioning context
      }
      Object.assign(secondary.style, {
        position: 'absolute',
        left: '0',
        right: '0',
        bottom: '100%',   // always open above the primary row
        zIndex: '10'      // float over body content
      });

      let isOpen = false;

      const focusFirstItem = () => {
        const first = secondary.querySelector('button, [href], [tabindex]:not([tabindex="-1"])');
        if (first && typeof first.focus === 'function') {
          first.focus();
        }
      };

      const closePopover = () => {
        if (!isOpen) return;
        isOpen = false;

        // If focus is inside the popover, return it to the trigger before hiding from AT.
        if (secondary.contains(document.activeElement)) {
          moreBtn.focus();
        }

        secondary.classList.remove('is-open');
        secondary.setAttribute('aria-hidden', 'true');
        moreBtn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', onDocClick, true);
        modal.removeEventListener('keydown', onKeyDown, true);
      };

      const onDocClick = (ev) => {
        if (!isOpen) return;
        if (secondary.contains(ev.target) || moreBtn.contains(ev.target)) return;
        closePopover(); // tap-out closes only the popover, not the whole LPM
      };

      const onKeyDown = (ev) => {
        if (!isOpen) return;
        if (ev.key === 'Escape') {
          ev.preventDefault();
          ev.stopPropagation(); // keep ESC from closing the entire modal when only the popover is open
          closePopover();
          moreBtn.focus();
        }
      };

      const openPopover = () => {
        if (isOpen) return;
        isOpen = true;
        secondary.classList.add('is-open');          // hook for CSS: fade + tiny slide-up
        secondary.setAttribute('aria-hidden', 'false');
        moreBtn.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', onDocClick, { capture: true });
        modal.addEventListener('keydown', onKeyDown, { capture: true });
        focusFirstItem();
      };

      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (isOpen) closePopover();
        else openPopover();
      });

      // clicking any secondary action should execute its handler and then close the popover
      secondary.addEventListener('click', (e) => {
        const btn = e.target.closest('button, a');
        if (!btn) return;
        // let the action run first; hide popover right after
        setTimeout(closePopover, 0);
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

    // 📤 Share (LPM; OS share → clipboard fallback, use same URL as QR share)
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

        // 2) build the same target URL as QR share uses
        const slugOrId = String(data?.locationID || data?.id || raw || '').trim();
        const qrUrl = (typeof data?.qrUrl === 'string') ? data.qrUrl.trim() : '';
        const baseQr = qrUrl || (slugOrId ? `${location.origin}/?lp=${encodeURIComponent(slugOrId)}` : '');

        // optional fallback: if for some legacy entry we still have only coords
        const coords = [data?.lat, data?.lng]
          .map(v => String(v ?? '').trim())
          .filter(Boolean)
          .join(', ');
        const coordFallback = coords ? `${location.origin}/?at=${encodeURIComponent(coords)}` : '';

        const target = baseQr || coordFallback;
        const name = String(data?.name || 'Location');

        try {
          if (navigator.share && target) {
            await navigator.share({ title: name, url: target });
          } else if (target && navigator.clipboard) {
            await navigator.clipboard.writeText(target);
            showToast('Link copied to clipboard', 1600);
          }
        } catch {}
      }, { passive: false });
    }
  
    // 📈 Stats (dashboard)
    // Phase 4: intercept before navigation; open Owner settings modal when Dash is blocked.
    const statsBtn = modal.querySelector('#som-stats');
    if (statsBtn) {
      statsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Guard: avoid double-open when user taps rapidly (async probes race).
        if (statsBtn.dataset.busy === '1') return;
        statsBtn.dataset.busy = '1';
        try {

        const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i; // keep ULID shape check

        const cachedLocationId  = String(modal.getAttribute('data-locationid') || '').trim(); // cached in DOM
        const payloadLocationId = String(data?.locationID || '').trim();                      // passed in payload
        const rawULID           = String(data?.id || '').trim();                              // ULID (if known)

        const target = (payloadLocationId || cachedLocationId || rawULID).trim(); // prefer payload; fallback to cached or ULID
        if (!target) { showToast('Dashboard unavailable for this profile', 1600); return; }

        // Sync DOM cache for next time; leave data.* untouched
        modal.setAttribute('data-locationid', target);

        // Read-only ownership hint (no analytics): status/tier from API Worker.
        // We never infer authority from the client; this is only to choose the correct Owner settings variant.
        const isOwnedByStatus = async () => {
          try {
            const u = new URL('/api/status', location.origin);
            u.searchParams.set('locationID', (ULID.test(rawULID) ? rawULID : target));
            const r = await fetch(u.toString(), { cache: 'no-store', credentials: 'omit' });
            if (!r.ok) return false;
            const j = await r.json().catch(() => null);

            // ✅ Authoritative ownership signal
            return j?.ownedNow === true;
          } catch {
            return false;
          }
        };

        // Determine if we have a valid owner session by probing /api/stats with a minimal 1-day window.
        // This call is still owner-gated and returns no analytics when blocked.
        const owned = await isOwnedByStatus();

        // When owned, always open Dash.
        // Dash itself handles 401 / 403 deterministically.
        if (owned) {
          const seg = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(rawULID) ? rawULID : target;
          const href = `https://navigen.io/dash/${encodeURIComponent(seg)}`;
          window.open(href, '_blank', 'noopener,noreferrer');
          return;
        }

        // Unowned → Owner settings (claim)
        showOwnerSettingsModal({
          variant: 'claim',
          locationIdOrSlug: target,
          locationName: String(data?.displayName ?? data?.name ?? '').trim()
        });

        } finally {
          statsBtn.dataset.busy = '0';
        }        
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
     
    // 1–5 rating (localStorage + /hit/rating); emoji radios; 1h cooldown window for sending
    (function initRating(){
      const group = modal.querySelector('#lpm-rate-group');
      if (!group) return;

      // accept either ULID or slug for this profile (keeps behavior aligned with other CTAs)
      const rawId = String(data?.id || data?.locationID || '').trim();
      if (!rawId) return;

      const key      = `rating:${rawId}`;          // stored value 0..5 (last selected)
      const tsKey    = `rating_ts:${rawId}`;       // last UI interaction timestamp
      const sentKey  = `rating_sent_ts:${rawId}`;  // last time a hit was sent to dash
      const COOLDOWN_MS = 60*60*1000;              // 1h per device for sending hits

      const btns = Array.from(group.querySelectorAll('.rate-btn'));
      const hint = modal.querySelector('.rate-hint');

      const setUI = (n) => {
        btns.forEach((b,i)=> b.setAttribute('aria-checked', String(i+1===n)));
        if (hint) hint.textContent = n ? `Rated ${n}/5` : '';
      };

      let val      = Number(localStorage.getItem(key))     || 0; // 0 = no rating yet
      let last     = Number(localStorage.getItem(tsKey))   || 0;
      let lastSent = Number(localStorage.getItem(sentKey)) || 0;

      const canSend = () => !lastSent || (Date.now() - lastSent >= COOLDOWN_MS);

      // initial visual state (no lock; user can always change the face)
      setUI(val);

      const commit = (n) => {
        const nowTs = Date.now();
        val = n;
        last = nowTs;

        localStorage.setItem(key,   String(n));
        localStorage.setItem(tsKey, String(last));
        setUI(n);
        /* send lightweight thanks toast; rating also sent to Worker when send window allows */
        showToast(`Thanks! Rated ${n}/5`, 1600);

        // fire /hit/rating only when outside the cooldown window; UI always updates
        if (!canSend()) return;

        lastSent = nowTs;
        localStorage.setItem(sentKey, String(lastSent));

        (async () => {
          try {
            const idOrSlug = String(data?.id || data?.locationID || '').trim();
            if (!idOrSlug) return;

            // resolve slug → ULID when possible; fall back to slug so Worker can still canonicalize
            const uid = await resolveULIDFor(idOrSlug);
            const target = uid || idOrSlug;
            const url = `${TRACK_BASE}/hit/rating/${encodeURIComponent(target)}?score=${encodeURIComponent(n)}`;

            await fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
          } catch {
            // tracking must not block rating UI
          }
        })();
      };

      // click handlers — always allow face selection; sending is throttled by canSend()
      btns.forEach((b,i) => {
        b.addEventListener('click', () => {
          commit(i+1);  // 1..5
        });
      });

      // keyboard support (no hard lock; still uses commit() which respects send cooldown)
      group.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          commit(Math.min(5, (val || 0) + 1));
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          commit(Math.max(1, (val || 1) - 1));
        }
      });
    })();

    // analytics beacon
    // removed trackCta; all beacons use _track(uid,event) // single path → Worker

    // 🔎 Enrich LPM from Data API (non-blocking; keeps UX instant)
    ;(async () => {
      try {
        // accept locationID too; skip when missing
        const id = String(data?.locationID || data?.id || '').trim(); // prefer slug; ULID may not exist in profile index
        if (!id) return;
        const needEnrich =
          !data?.descriptions ||
          !data?.media?.cover ||
          (Array.isArray(data?.media?.images) && data.media.images.length < 2);
        if (!needEnrich) return; // skip network when local data is complete

        const res = await fetch(API(`/api/data/item?id=${encodeURIComponent(id)}`), { cache: 'no-store', credentials: 'include' });
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
// QR generator uses getQRCodeLib() helper above; no direct import here

// Stripe: only the donation action here (init comes from caller)
import { handleDonation, handleCampaignCheckout } from "./scripts/stripe.js";

// Phase 5 — Select Location modal (uses existing rendered location buttons + root search styling)
// This avoids introducing new list APIs/contracts before self-serve LPM creation exists.
export function createSelectLocationModal() {
  const id = 'select-location-modal';
  document.getElementById(id)?.remove();

  // Build using the same modal universe + layout variant as My Stuff/Promotions
  const modal = injectModal({
    id,
    title: '',                 // header rendered via .modal-top-bar (avoid double title)
    layout: 'menu',            // menu modal layout parity
    bodyHTML: ``
  });

  // Ensure it's hidden after injection (same pattern used elsewhere)
  modal.classList.add('hidden');
  modal.classList.add('syb-modal'); // SYB scope: Select your business modal only

  const topBar = document.createElement('div');
  topBar.className = 'modal-top-bar';
  topBar.innerHTML = `
    <h2 class="modal-title">${(t('root.bo.selectLocation.title') || 'Select your business')}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector('.modal-content')?.prepend(topBar);
  // Keep CSS sticky offsets in sync with the real rendered header height (no hardcoded px guessing)
  const ac = new AbortController();
  const setTopbarHeightVar = () => {
    modal.style.setProperty('--select-location-topbar-h', `${topBar.offsetHeight}px`);
  };
  requestAnimationFrame(setTopbarHeightVar);
  window.addEventListener('resize', setTopbarHeightVar, { signal: ac.signal });

  topBar.querySelector('.modal-close')?.addEventListener('click', () => {
    ac.abort(); // cleanup listeners when the modal closes
    hideModal(id);
  });

  const inner = modal.querySelector('.modal-body-inner');
  if (!inner) return;

  // Clone the existing root search input for identical styling (fallback to a plain input).
  const rootSearch =
    document.getElementById('search') ||
    document.querySelector('input#search') ||
    document.querySelector('input[type="search"]');

  const input = rootSearch
    ? rootSearch.cloneNode(true)
    : document.createElement('input');

  input.type = 'search';
  input.id = 'select-location-search';
  input.spellcheck = false;
  input.autocapitalize = 'off';
  input.autocomplete = 'off';
  input.value = '';
  // ensure 🔍 prefix (even when i18n provides a string)
  const _ph = (t('root.bo.selectLocation.placeholder') || 'Search here…').trim();
  input.placeholder = _ph.startsWith('🔍') ? _ph : `🔍 ${_ph}`;

  // Ensure it's an input element
  if (!(input instanceof HTMLInputElement)) {
    // fallback
    const tmp = document.createElement('input');
    tmp.id = 'select-location-search';
    tmp.placeholder = t('root.bo.selectLocation.placeholder') || 'Search here…';
    tmp.autocomplete = 'off';
    inner.appendChild(tmp);
  } else {
    // Search row wrapper so we can:
    // 1) keep it sticky (search stays put while results scroll)
    // 2) add the same bordered red clear X affordance as the main shell
    const searchRow = document.createElement('div');
    searchRow.className = 'select-location-search-row';

    // Mirror the main shell structure: a relative wrapper around input + clear button
    const searchLeft = document.createElement('div');
    searchLeft.className = 'select-location-search-left';

    // clear button (visual + behavior like main shell)
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-x';
    clearBtn.id = 'select-location-clear-search';
    clearBtn.textContent = 'x';
    clearBtn.style.display = 'none'; // only show when there is content
    clearBtn.setAttribute('aria-label', 'Clear search');

    // Build row: [ input + clear ]
    searchLeft.appendChild(input);
    searchLeft.appendChild(clearBtn);
    searchRow.appendChild(searchLeft);

    // ℹ️ legend (dot meanings + 🎁)
    const infoBtn = document.createElement('button');
    infoBtn.type = 'button';
    infoBtn.className = 'select-location-info-btn';
    infoBtn.textContent = 'ℹ️';
    infoBtn.setAttribute('aria-label', 'Info');

    infoBtn.addEventListener('click', () => {
      const msg = [
        '🔴 Taken',
        'Already operated.',
        '',
        '🟢 Free',
        'Available.',
        '',
        '🔵 Still visible',
        'Courtesy/hold.',
        '',
        '🟠 Parked',
        'Inactive.',
        '',
        '🎁 Promoted',
        'Active campaign.'
      ].join('\n');

      showToast(String(msg).replace(/\\n/g, '\n'), 5000);
    });

    searchRow.appendChild(infoBtn);

    // Behavior: show/hide X and clear value

    const syncClear = () => {
      const hasValue = !!String(input.value || '').trim();
      clearBtn.style.display = hasValue ? 'inline-flex' : 'none';
    };
    input.addEventListener('input', syncClear);

    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      syncClear();
    });

    // initial state
    syncClear();
    
    // Insert the search row into the sticky top bar so it never scrolls with the list
    const closeInBar = topBar.querySelector('.modal-close');
    if (closeInBar) topBar.insertBefore(searchRow, closeInBar);
    else topBar.appendChild(searchRow);    
  }

  const list = document.createElement('div');
  list.className = 'modal-menu-list';
  inner.appendChild(list);

  // SYB: add a sticky bottom cover band (same concept as My Stuff footer)
  // Keep it non-interactive so it never blocks taps/scroll.
  if (!modal.querySelector('.modal-footer')) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.setAttribute('aria-hidden', 'true');
    modal.querySelector('.modal-content')?.appendChild(footer);
  }

  setupTapOutClose(id);
}

// Phase 5 BO: Select Location must not depend on pre-rendered DOM lists.
// Root shell can have zero/partial `.location-button` nodes, so we load the full candidate set from `/data/profiles.json`
// and perform token-AND, accent-insensitive search over name/slug/address/adminArea/postalCode/countryCode/tags/contact.
// UI rows display only "street, city" (no adminArea/countryCode/postalCode shown), but those fields remain searchable.
export async function showSelectLocationModal() {
  const id = 'select-location-modal';
  if (!document.getElementById(id)) createSelectLocationModal();
  showModal(id);

  const modal = document.getElementById(id);
  const input = modal?.querySelector('#select-location-search');
  const list = modal?.querySelector('.modal-menu-list');
  if (!modal || !list) return null;

  const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_.\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const tokensOf = (q) => norm(q).split(/\s+/).filter(Boolean);

  const loadProfiles = async () => {
    try {
      const res = await fetch('/data/profiles.json', { cache: 'no-store' });
      if (!res.ok) return [];
      const j = await res.json().catch(() => null);
      if (!j) return [];

      // Accept multiple shapes:
      // - Array
      // - { locations: [...] } or { locations: {..} }
      // - Object map
      let arr = [];
      if (Array.isArray(j)) arr = j;
      else if (Array.isArray(j.locations)) arr = j.locations;
      else if (j.locations && typeof j.locations === 'object') arr = Object.values(j.locations);
      else if (typeof j === 'object') arr = Object.values(j);

      return (Array.isArray(arr) ? arr : [])
        .map((rec) => {
          const locName =
            rec?.locationName && typeof rec.locationName === 'object'
              ? String(rec.locationName.en || Object.values(rec.locationName)[0] || '').trim()
              : String(rec?.locationName || '').trim();

          const slug = String(rec?.locationID || rec?.slug || '').trim();
          const rawId = String(rec?.ID || rec?.id || '').trim();
          const uid = ULID.test(rawId) ? rawId : '';

          const c = (rec && rec.contactInformation) || {};

          // Display: street, postalCode, city (postalCode must be visible on the card)
          const addrDisplay = [c.address, c.city, c.postalCode]
            .filter(Boolean)
            .map((v) => String(v).trim())
            .join(', ');

          // Search: keep full surface (adminArea/countryCode remain searchable)
          const addrSearch = [c.address, c.city, c.adminArea, c.postalCode, c.countryCode]
            .filter(Boolean)
            .map((v) => String(v).trim())
            .join(' ');

          const tags = Array.isArray(rec?.tags)
            ? rec.tags.map((k) => String(k).replace(/^tag\./, '')).join(' ')
            : '';

          const person = String(c.contactPerson || '').trim();
          const contact = [c.phone, c.email, c.whatsapp, c.telegram, c.messenger]
            .filter(Boolean)
            .map((v) => String(v).trim())
            .join(' ');

          const hay = norm([locName, slug, addrSearch, tags, person, contact].filter(Boolean).join(' '));

          // Preserve media so LPM can render images when opened from SYB
          const media = (rec && typeof rec.media === 'object') ? rec.media : {};
          const cover = String((media?.cover || rec?.imageSrc || '')).trim();

          // Keep explicit images list if present (either top-level or under media)
          const images = Array.isArray(rec?.images) ? rec.images
            : (Array.isArray(media?.images) ? media.images : []);

          return { name: locName, slug, uid, addrDisplay, hay, media, images, cover, raw: rec };
        })
        .filter((x) => x.name && x.slug);
    } catch {
      return [];
    }
  };

  const items = await loadProfiles();

  // De-dupe by authoritative slug (locationID) only
  const bySlug = new Map();
  items.forEach((x) => bySlug.set(x.slug, x));
  const uniqItems = Array.from(bySlug.values());
  // Cache ownership probes per tab to avoid repeated /api/status calls during SYB browsing.
  const ownedCache = new Map(); // slug -> { owned:boolean, vis:string, courtesyUntil:string }

  // 🎁 Campaign presence cache for SYB:
  // Source of truth: /data/campaigns.json rows where status=Active AND today is within [startDate,endDate].
  let activeCampaignSlugs = new Set();

  const loadActiveCampaignSlugs = async () => {
    try {
      const r = await fetch('/data/campaigns.json', { cache: 'no-store' });
      if (!r.ok) return new Set();

      const rows = await r.json().catch(() => null);
      const arr = Array.isArray(rows) ? rows : [];

      const now = new Date();

      const isActiveRow = (c) => {
        const st = String(c?.status || '').trim().toLowerCase();
        if (st !== 'active') return false;

        const start = new Date(String(c?.startDate || '').trim());
        const end   = new Date(String(c?.endDate || '').trim());
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true; // fail-open on bad dates for UI hint
        return now >= start && now <= end;
      };

      return new Set(
        arr
          .filter(isActiveRow)
          .map(c => String(c?.locationID || '').trim())
          .filter(Boolean)
      );
    } catch {
      return new Set();
    }
  };

  // Load once per SYB open (before first render)
  activeCampaignSlugs = await loadActiveCampaignSlugs();

  const render = (q) => {
    const toks = tokensOf(q);
    list.innerHTML = '';

    const filtered = uniqItems
      .filter((x) => (toks.length ? toks.every((tok) => x.hay.includes(tok)) : true))
      .slice(0, 40);

    if (!filtered.length) {
      const p = document.createElement('p');
      p.className = 'muted';
      p.textContent = t('root.bo.selectLocation.none') || 'No matches.';
      list.appendChild(p);
      return;
    }

    filtered.forEach((x) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-menu-item';
      btn.dataset.slug = String(x.slug || '').trim(); // used by post-render owned-dot pass

      const line2 = x.addrDisplay ? x.addrDisplay : x.slug;

      btn.classList.add('syb-card');

      btn.innerHTML = `
        <span class="icon-img">📍</span>
        <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
          <strong>${x.name}</strong><br><small>${line2}</small>
        </span>

        <span class="syb-status-dot syb-free" aria-hidden="true"></span>
        <span class="syb-gift" aria-hidden="true">🎁</span>
      `;

      // 🎁 Campaign hint: show only if this location has an active campaign in campaigns.json
      if (activeCampaignSlugs.has(String(x.slug || '').trim())) {
        btn.querySelector('.syb-gift')?.classList.add('syb-gift-on');
      }

      // Owned dot is applied in a single post-render pass (prevents async races on rerender).

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        hideModal(id);

        const payload = {
          locationID: x.slug,
          id: x.uid || x.slug,
          displayName: x.name,
          name: x.name,

          // Provide image inputs the LPM already understands
          imageSrc: x.cover || '',
          media: {
            ...(x.media || {}),
            cover: x.cover || (x.media && x.media.cover) || ''
          },
          images: Array.isArray(x.images) ? x.images : (x.media && Array.isArray(x.media.images) ? x.media.images : []),

          // Pass-through fields the LPM wiring expects (keeps BO-opened LPM identical to ctx-opened LPM)
          tags: Array.isArray((x.raw && x.raw.tags)) ? x.raw.tags : [],
          descriptions: (x.raw && typeof x.raw.descriptions === 'object') ? x.raw.descriptions : {},
          contactInformation: (x.raw && typeof x.raw.contactInformation === 'object') ? x.raw.contactInformation : {},
          links: (x.raw && typeof x.raw.links === 'object') ? x.raw.links : {}
        };

        modal.dataset.pick = JSON.stringify(payload);
      });

      list.appendChild(btn);
    });
    
    // Apply owned dots in a single post-render pass (works even when list rerenders quickly).
    ;(async () => {
      const rows = Array.from(list.querySelectorAll('button.modal-menu-item'));
      await Promise.all(rows.map(async (el) => {
        try {
          const slug = String(el.dataset.slug || '').trim();
          if (!slug) return;

          const dot = el.querySelector('.syb-status-dot');
          const gift = el.querySelector('.syb-gift');
          if (!dot) return;

          if (ownedCache.has(slug)) {
            const s = ownedCache.get(slug) || {};
            const owned = s.owned === true;
            const vis = String(s.vis || '').trim();
            const courtesyUntil = String(s.courtesyUntil || '').trim();

            // 🔴 taken (owned)
            dot.classList.toggle('syb-taken', owned);

            // 🟠 parked (unowned + hidden)
            dot.classList.toggle('syb-parked', !owned && vis === 'hidden');

            // 🔵 held/courtesy (unowned + courtesy window)
            dot.classList.toggle('syb-held', !owned && !!courtesyUntil);

            // 🟢 free (unowned + discoverable baseline)
            dot.classList.toggle('syb-free', !owned && vis !== 'hidden' && !courtesyUntil);

            return;
          }

          const u = new URL('/api/status', location.origin);
          u.searchParams.set('locationID', slug);

          const r = await fetch(u.toString(), { cache: 'no-store', credentials: 'omit' });
          if (!r.ok) {
            ownedCache.set(slug, false);
            dot.classList.add('syb-free');
            dot.classList.remove('syb-taken');
            return;
          }

          const j = await r.json().catch(() => null);
          const owned = (j?.ownedNow === true);
          const vis = String(j?.visibilityState || '').trim();
          const courtesyUntil = String(j?.courtesyUntil || '').trim();

          ownedCache.set(slug, { owned, vis, courtesyUntil });

          // 🔴 taken (owned)
          dot.classList.toggle('syb-taken', owned);

          // 🟠 parked (unowned + hidden)
          dot.classList.toggle('syb-parked', !owned && vis === 'hidden');

          // 🔵 held/courtesy (unowned + courtesy window)
          dot.classList.toggle('syb-held', !owned && !!courtesyUntil);

          // 🟢 free (unowned + discoverable baseline)
          dot.classList.toggle('syb-free', !owned && vis !== 'hidden' && !courtesyUntil);
        } catch {}
      }));
    })();
        
  };

  render('');
  if (input) input.addEventListener('input', () => render(input.value));

  return await new Promise((resolve) => {
    const tick = setInterval(() => {
      const picked = modal.dataset.pick;
      if (picked) {
        clearInterval(tick);
        modal.dataset.pick = '';
        try {
          resolve(JSON.parse(picked));
        } catch {
          resolve(null);
        }
      }
      if (modal.classList.contains('hidden')) {
        clearInterval(tick);
        resolve(null);
      }
    }, 150);
  });
}

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
        qrUrl: loc?.qrUrl || '',                                      // plain pass-through; no reconstruction
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

// ————————————————————————————
// Phase 4 — Owner Settings modals (LPM 📈 gating UX)
// - No analytics are fetched or displayed inside these modals.
// - All copy is t(key)-driven with safe English fallbacks.
// ————————————————————————————

function _ownerText(key, fallback) {
  const hasT = (typeof t === 'function');
  const raw = hasT ? (t(key) || '') : '';
  return (raw && typeof raw === 'string') ? raw : String(fallback || key);
}

export function createRestoreAccessModal() {
  const id = 'owner-restore-access-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">${_ownerText('owner.restore.title', 'Restore access')}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  const p1 = document.createElement('p');
  p1.textContent = _ownerText(
    'owner.restore.body',
    'To open the Owner Dash, use your most recent Owner access email or Stripe receipt. The Owner Dash link is included in that message.'
  );
  p1.style.textAlign = 'left';
  p1.style.fontSize = '0.95em';
  inner.appendChild(p1);

  const hint = document.createElement('p');
  hint.textContent = _ownerText(
    'owner.restore.hint',
    'Tip: search your inbox for “Stripe” or “NaviGen”.'
  );
  hint.style.textAlign = 'left';
  hint.style.fontSize = '0.85em';
  hint.style.opacity = '0.8';
  inner.appendChild(hint);

  // PaymentIntent restore (pi_...) — cross-device recovery without emails/links
  const label = document.createElement('p');
  label.textContent =
    (typeof t === 'function' && t('owner.restore.pi.label')) ||
    'Paste your Payment ID (pi_...) to restore access on this device:';
  label.style.textAlign = 'left';
  label.style.fontSize = '0.9em';
  label.style.marginTop = '1rem';
  inner.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'owner-restore-pi';
  input.placeholder = 'pi_...';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.style.width = '100%';
  input.style.padding = '0.6rem';
  input.style.borderRadius = '8px';
  input.style.border = '1px solid rgba(0,0,0,0.15)';
  inner.appendChild(input);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'modal-body-button';
  btn.id = 'owner-restore-pi-submit';
  btn.textContent =
    (typeof t === 'function' && t('owner.restore.pi.submit')) ||
    'Restore';
  btn.style.marginTop = '0.75rem';

  btn.addEventListener('click', () => {
    const pi = String(input.value || '').trim();
    if (!pi) { showToast('Missing Payment ID', 1800); return; }
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/owner/restore?pi=${encodeURIComponent(pi)}&next=${next}`;
  });

  inner.appendChild(btn);

  body.appendChild(inner);

  card.appendChild(top);
  card.appendChild(body);

  wrap.appendChild(card);
  document.body.appendChild(wrap);
}

export function showRestoreAccessModal() {
  const id = 'owner-restore-access-modal';
  if (!document.getElementById(id)) createRestoreAccessModal();
  showModal(id);
}

function _exampleFlag(rec) {
  // Accept multiple schema variants; fail closed.
  const v = rec?.exampleLocation ?? rec?.isExample ?? rec?.example ?? rec?.exampleDash ?? rec?.flags?.example;
  return v === true || v === 1 || String(v || '').toLowerCase() === 'true' || String(v || '').toLowerCase() === 'yes';
}

function _nameOf(rec) {
  const ln = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
  const n = rec?.locationName;
  if (n && typeof n === 'object') return String(n[ln] || n.en || Object.values(n)[0] || '').trim();
  return String(n || rec?.name || '').trim();
}

export async function createExampleDashboardsModal() {
  const id = 'example-dashboards-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">${_ownerText('owner.examples.title', 'Example dashboards')}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  const note = document.createElement('p');
  note.textContent = _ownerText(
    'owner.examples.note',
    'Example analytics shown here belong to other locations and are not related to this business.'
  );
  note.style.textAlign = 'left';
  note.style.fontSize = '0.85em';
  note.style.opacity = '0.8';
  inner.appendChild(note);

  const list = document.createElement('div');
  list.className = 'modal-menu-list';
  inner.appendChild(list);

  // Load example locations from the shipped dataset.
  // This is informational only; it does not grant access to a blocked location.
  let examples = [];
  try {
    const r = await fetch('/data/profiles.json', { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json().catch(() => null);
      const locs = Array.isArray(j?.locations)
        ? j.locations
        : (j?.locations && typeof j.locations === 'object')
          ? Object.values(j.locations)
          : [];

      examples = (Array.isArray(locs) ? locs : [])
        .filter(_exampleFlag)
        .map(rec => ({
          id: String(rec?.ID || rec?.id || '').trim(),
          slug: String(rec?.locationID || rec?.slug || rec?.alias || '').trim(),
          name: _nameOf(rec),
          sector: String(rec?.sectorKey || rec?.groupKey || rec?.Group || '').trim()
        }))
        .filter(x => x.name && (x.id || x.slug))
        .slice(0, 6);
    }
  } catch {
    examples = [];
  }

  if (!examples.length) {
    const empty = document.createElement('p');
    empty.textContent = _ownerText('owner.examples.empty', 'No example dashboards are available right now.');
    empty.style.textAlign = 'left';
    empty.style.opacity = '0.8';
    inner.appendChild(empty);
  } else {
    examples.forEach((ex) => {
      const label = ex.name;
      const sector = ex.sector ? ex.sector : _ownerText('owner.examples.sector.unknown', '');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-menu-item';
      btn.innerHTML = `
        <span class="icon-img">📊</span>
        <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
          <strong>${label}</strong> <span class="example-badge" style="font-size:.75em; opacity:.8;">${_ownerText('owner.examples.badge', 'Example')}</span>
          ${sector ? `<br><small>${sector}</small>` : ''}
        </span>
      `;
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const seg = ex.id || ex.slug;
        const href = `https://navigen.io/dash/${encodeURIComponent(seg)}`;
        window.open(href, '_blank', 'noopener,noreferrer');
      });
      list.appendChild(btn);
    });
  }

  body.appendChild(inner);

  // No footer actions for Example Dashboards: close via the top-right × only.

  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);
}

export async function showExampleDashboardsModal() {
  const id = 'example-dashboards-modal';
  if (!document.getElementById(id)) await createExampleDashboardsModal();
  showModal(id);
}

// Phase 5 — Request Listing modal (manual onboarding pipeline)
// Owners can request listing creation; no instant LPM creation is performed here.
export function createRequestListingModal() {
  const id = 'request-listing-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">${t('modal.requestListing.title') || 'Request a listing'}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  inner.innerHTML = `
    <label style="display:block;margin:0.5rem 0 0.25rem;">Business name *</label>
    <input id="rl-name" type="text" maxlength="80"
      style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(0,0,0,0.15);" />

    <label style="display:block;margin:0.75rem 0 0.25rem;">Street address *</label>
    <input id="rl-address" type="text" maxlength="120"
      style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(0,0,0,0.15);" />

    <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
      <div style="flex:1 1 12rem;min-width:12rem;">
        <label style="display:block;margin:0.75rem 0 0.25rem;">City *</label>
        <input id="rl-city" type="text" maxlength="60"
          style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(0,0,0,0.15);" />
      </div>
      <div style="flex:1 1 10rem;min-width:10rem;">
        <label style="display:block;margin:0.75rem 0 0.25rem;">Country code *</label>
        <input id="rl-country" type="text" maxlength="2" placeholder="HU"
          style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(0,0,0,0.15);text-transform:uppercase;" />
      </div>
    </div>

    <label style="display:block;margin:0.75rem 0 0.25rem;">Optional: Website or Google Maps link</label>
    <input id="rl-link" type="text" maxlength="200"
      style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(0,0,0,0.15);" />

    <div style="margin-top:0.75rem;">
      <label style="display:flex;align-items:center;gap:0.5rem;">
        <input id="rl-has-coord" type="checkbox" />
        <span>Optional: I have coordinates</span>
      </label>
      <div id="rl-coord-wrap" style="display:none;margin-top:0.5rem;">
        <label style="display:block;margin:0 0 0.25rem;">Coordinates (lat,lng) — 6 decimals</label>
        <input id="rl-coord" type="text" placeholder="47.497900,19.040200"
          style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(0,0,0,0.15);" />
        <small style="opacity:0.75;display:block;margin-top:0.25rem;">Tip: you can copy this from Google Maps.</small>
      </div>
    </div>
  `;

  inner.querySelector('#rl-has-coord')?.addEventListener('change', (e) => {
    const on = !!e.target?.checked;
    const w = inner.querySelector('#rl-coord-wrap');
    if (w) w.style.display = on ? 'block' : 'none';
  });

  body.appendChild(inner);

  const actions = document.createElement('div');
  actions.className = 'modal-footer';

  const send = document.createElement('button');
  send.className = 'modal-footer-button';
  send.type = 'button';
  send.textContent = t('modal.requestListing.submit') || 'Send request';

  send.addEventListener('click', async () => {
    const name = String(document.getElementById('rl-name')?.value || '').trim();
    const address = String(document.getElementById('rl-address')?.value || '').trim();
    const city = String(document.getElementById('rl-city')?.value || '').trim();
    const country = String(document.getElementById('rl-country')?.value || '').trim().toUpperCase();
    const link = String(document.getElementById('rl-link')?.value || '').trim();
    const coord = String(document.getElementById('rl-coord')?.value || '').trim();

    if (!name || !address || !city || !country || country.length !== 2) {
      showToast('Please provide name, street address, city, and 2-letter country code.', 2200);
      return;
    }

    // Normalize name for admin handling (no slug creation here)
    const nameNorm = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9\s\-\&\.\']/gi, '')      // keep common business punctuation (ASCII-safe after NFD)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    // Optional coords validation (if provided)
    let coordNorm = '';
    if (coord) {
      const m = coord.match(/^\s*(-?\d+(?:\.\d{1,6})?)\s*,\s*(-?\d+(?:\.\d{1,6})?)\s*$/);
      if (!m) {
        showToast('Coordinates must be "lat,lng" with up to 6 decimals.', 2200);
        return;
      }
      const lat = Number(m[1]), lng = Number(m[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        showToast('Coordinates are out of range.', 2200);
        return;
      }
      coordNorm = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    }

    // Manual pipeline: store locally for now; admin can copy out later.
    try {
      const key = 'navigen.requestListing';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const next = Array.isArray(arr) ? arr : [];
      next.unshift({
        name,
        nameNorm,
        address,
        city,
        country,
        link,
        coord: coordNorm,
        ts: Date.now()
      });
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}

    showToast(t('modal.requestListing.success') || 'Thanks! We’ll add your listing soon.', 2500);
    hideModal(id);
  });

  const cancel = document.createElement('button');
  cancel.className = 'modal-footer-button';
  cancel.type = 'button';
  cancel.textContent = t('common.cancel') || 'Cancel';
  cancel.addEventListener('click', () => hideModal(id));

  actions.appendChild(cancel);
  actions.appendChild(send);

  card.appendChild(top);
  card.appendChild(body);
  card.appendChild(actions);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  setupTapOutClose(id);
}

export function showRequestListingModal() {
  const id = 'request-listing-modal';
  if (!document.getElementById(id)) createRequestListingModal();
  showModal(id);
}

// Campaign selection: resolve a professional campaignKey by lookup in /data/campaigns.json.
// Reason: Owner Settings needs a deterministic campaignKey without introducing a new selector yet.
export async function resolveCampaignKeyForLocation(locationID) {
  const slug = String(locationID || '').trim();
  if (!slug) return '';

  try {
    const r = await fetch('/data/campaigns.json', { cache: 'no-store' });
    if (!r.ok) return '';
    const rows = await r.json().catch(() => null);
    const arr = Array.isArray(rows) ? rows : [];

    // First matching row is deterministic and stable if your dataset ordering is stable.
    const hit = arr.find(c => String(c?.locationID || '').trim() === slug);
    return String(hit?.campaignKey || '').trim();
  } catch {
    return '';
  }
}

// Campaign funding modal (chips + input); sends fixed amountCents to Stripe via handleCampaignCheckout().
export function showCampaignFundingModal({ locationID, campaignKey }) {
  const id = 'campaign-funding-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">${(typeof t === 'function' && t('campaign.funding.title')) || 'Campaign funding'}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  inner.innerHTML = `
    <div class="campaign-funding-warning">${(typeof t === 'function' && t('campaign.funding.minNotice')) || 'Minimum campaign funding is €50.'}</div>
    <div class="campaign-funding-warning">${(typeof t === 'function' && t('campaign.funding.stripeNote')) || 'Checkout is processed by Stripe. A payment confirmation email will be sent to you.'}</div>
    <div class="campaign-funding-spacer"></div>
    <div class="campaign-funding-chips">
      <button type="button" class="campaign-funding-chip is-selected" data-eur="50">€50</button>
      <button type="button" class="campaign-funding-chip" data-eur="75">€75</button>
      <button type="button" class="campaign-funding-chip" data-eur="100">€100</button>
      <button type="button" class="campaign-funding-chip" data-eur="150">€150</button>
      <button type="button" class="campaign-funding-chip" data-eur="200">€200</button>
      <button type="button" class="campaign-funding-chip" data-eur="300">€300</button>
    </div>

    <div class="campaign-funding-input-row">
      <label class="campaign-funding-label" for="campaign-funding-eur">
        ${(typeof t === 'function' && t('campaign.funding.amountLabel')) || 'Amount (EUR)'}
      </label>
      <input id="campaign-funding-eur" class="campaign-funding-input" inputmode="numeric" pattern="[0-9]*" value="50" />
    </div>

    <div class="modal-actions">
      <button type="button" class="modal-body-button" id="campaign-funding-continue">
        ${(typeof t === 'function' && t('campaign.funding.continue')) || 'Continue to payment'}
      </button>
    </div>
  `;

  const eurInput = inner.querySelector('#campaign-funding-eur');
  const continueBtn = inner.querySelector('#campaign-funding-continue');
  const MIN_EUR = 50;

  function applyFundingValidity() {
    const eur = Math.floor(Number(String(eurInput.value || '').trim()));
    const ok = Number.isFinite(eur) && eur >= MIN_EUR;

    eurInput.classList.toggle('is-invalid', !ok);
    eurInput.setAttribute('aria-invalid', ok ? 'false' : 'true');

    if (continueBtn) continueBtn.disabled = !ok;
    return ok;
  }

  // initial state (input is prefilled to 50)
  applyFundingValidity();

  eurInput.addEventListener('input', () => {
    applyFundingValidity();
  });

  inner.querySelectorAll('.campaign-funding-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.querySelectorAll('.campaign-funding-chip').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      const eur = Number(btn.getAttribute('data-eur') || '50');
      eurInput.value = String(Number.isFinite(eur) ? eur : 50); applyFundingValidity();
    });
  });

  inner.querySelector('#campaign-funding-continue')?.addEventListener('click', async () => {
    if (!applyFundingValidity()) { showToast('Minimum is €50.', 1800); return; } const eur = Math.floor(Number(String(eurInput.value || '').trim()));
    if (!Number.isFinite(eur) || eur <= 0) { showToast('Enter a valid EUR amount.', 1800); return; }

    const amountCents = eur * 100;

    await handleCampaignCheckout({
      locationID: String(locationID || '').trim(),
      campaignKey: String(campaignKey || '').trim(),
      amountCents,
      navigenVersion: "v1.1"
    });
  });

  body.appendChild(inner);
  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  setupTapOutClose(id);
  showModal(id);
}

export function createOwnerSettingsModal({ variant, locationIdOrSlug, locationName }) {
  const id = 'owner-settings-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">${_ownerText('owner.settings.title', 'Owner settings')}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  if (locationName) {
    const pLoc = document.createElement('p');
    pLoc.textContent = locationName;
    pLoc.style.textAlign = 'left';
    pLoc.style.opacity = '0.9';
    pLoc.style.marginBottom = '0.75rem';
    inner.appendChild(pLoc);
  }

  const expl = document.createElement('p');
  expl.textContent = (variant === 'restore')
    ? _ownerText('owner.settings.restore.explain', 'You already own this location, but your access session has expired.')
    : _ownerText('owner.settings.claim.explain', 'Analytics and owner controls are available to the active operator.');
  expl.style.textAlign = 'left';
  expl.style.fontSize = '0.95em';
  inner.appendChild(expl);

  const menu = document.createElement('div');
  menu.className = 'modal-menu-list';

  const addItem = ({ id, icon, title, desc, onClick }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modal-menu-item';
    btn.id = id;
    btn.innerHTML = `
      <span class="icon-img">${icon}</span>
      <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
        <strong>${title}</strong>${desc ? `<br><small>${desc}</small>` : ''}
      </span>
    `;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClick?.();
    });
    menu.appendChild(btn);
  };

  if (variant === 'restore') {
    addItem({
      id: 'owner-restore-access',
      icon: '🔑',
      title: _ownerText('owner.settings.restore.action.title', 'Restore access'),
      desc: _ownerText('owner.settings.restore.action.desc', 'Use your most recent Owner access email / Stripe receipt.'),
      onClick: () => {
        hideModal(id);
        showRestoreAccessModal();
      }
    });

    addItem({
      id: 'owner-example-dash',
      icon: '📈',
      title: _ownerText('owner.settings.examples.action.title', 'See example dashboards'),
      desc: _ownerText('owner.settings.examples.action.desc', 'View analytics for designated example locations.'),
      onClick: () => {
        hideModal(id);
        showExampleDashboardsModal();
      }
    });

  } else {
    addItem({
      id: 'owner-run-campaign',
      icon: '🎯',
      title: _ownerText('owner.settings.claim.runCampaign.title', 'Run campaign'),
      desc: _ownerText('owner.settings.claim.runCampaign.desc', 'Activate analytics by running a campaign for this location.'),
      onClick: () => {
        (async () => {
          hideModal(id);

          // Prefer the current LPM context when available; otherwise ask the user to pick.
          const baseSlug = String(locationIdOrSlug || '').trim();
          const picked = baseSlug ? { locationID: baseSlug } : await showSelectLocationModal();
          const slug = String(picked?.locationID || '').trim();
          if (!slug) return;

          let campaignKey = await resolveCampaignKeyForLocation(slug);
          if (!campaignKey) campaignKey = "campaign-30d";

          showCampaignFundingModal({ locationID: slug, campaignKey });
        })();
      }
    });

    addItem({
      id: 'owner-example-dash',
      icon: '📈',
      title: _ownerText('owner.settings.examples.action.title', 'See example dashboards'),
      desc: _ownerText('owner.settings.examples.action.desc', 'View analytics for designated example locations.'),
      onClick: () => {
        hideModal(id);
        showExampleDashboardsModal();
      }
    });
  }

  inner.appendChild(menu);
  body.appendChild(inner);

  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  // Store context on the modal for follow-up actions.
  wrap.setAttribute('data-locationid', String(locationIdOrSlug || '').trim());
  wrap.setAttribute('data-variant', String(variant || '').trim());
}

export function showOwnerSettingsModal({ variant, locationIdOrSlug, locationName }) {
  const id = 'owner-settings-modal';
  if (!document.getElementById(id)) createOwnerSettingsModal({ variant, locationIdOrSlug, locationName });
  showModal(id);
}

export async function createOwnerCenterModal() {
  const id = 'owner-center-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">${(typeof t === 'function' && t('owner.center.title')) || 'Owner Center'}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  const note = document.createElement('p');
  note.textContent =
    (typeof t === 'function' && t('owner.center.note')) ||
    'Owner access is stored on this device for security. To add a location on a new device, use Restore access once.';
  note.style.textAlign = 'left';
  note.style.fontSize = '0.85em';
  note.style.opacity = '0.8';
  inner.appendChild(note);

  const list = document.createElement('div');
  list.className = 'modal-menu-list';
  inner.appendChild(list);

  // Load device-bound ULIDs
  let ulids = [];
  try {
    const r = await fetch('/api/owner/sessions', { cache: 'no-store', credentials: 'include' });
    const j = r.ok ? await r.json().catch(() => null) : null;
    ulids = Array.isArray(j?.items) ? j.items : [];
  } catch { ulids = []; }

  if (!ulids.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = (typeof t === 'function' && t('owner.center.empty')) || 'No saved owner sessions on this device yet.';
    list.appendChild(p);
  } else {
    // Resolve each ULID to slug/name via Worker item endpoint
    for (const ulid of ulids) {
      const u = String(ulid || '').trim();
      if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(u)) continue;

      let slug = '';
      let name = '';

      try {
        const rr = await fetch(`https://navigen-api.4naama.workers.dev/api/data/item?id=${encodeURIComponent(u)}`, { cache: 'no-store' });
        const jj = rr.ok ? await rr.json().catch(() => null) : null;
        slug = String(jj?.locationID || '').trim();
        const ln = jj?.locationName;
        name =
          (ln && typeof ln === 'object' && (ln.en || ln.default)) ? String(ln.en || ln.default).trim()
          : (typeof ln === 'string') ? ln.trim()
          : '';
      } catch {}

      const label = name || slug || u;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-menu-item';
      btn.classList.add('syb-card');

      btn.innerHTML = `
        <span class="icon-img">📍</span>
        <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
          <strong>${x.name}</strong><br><small>${line2}</small>
        </span>

        <!-- Status dot (top-right): 🟢 free by default, becomes 🔴 if owned -->
        <span class="syb-status-dot syb-free" aria-hidden="true"></span>

        <!-- Gift (bottom-right) -->
        <span class="syb-gift" aria-hidden="true">🎁</span>
      `;

      btn.addEventListener('click', () => {
        // Switch server-side and open Dash for that ULID
        const next = `/dash/${encodeURIComponent(u)}`;
        window.location.href = `/owner/switch?ulid=${encodeURIComponent(u)}&next=${encodeURIComponent(next)}`;
      });

      list.appendChild(btn);
    }
  }

  body.appendChild(inner);
  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  setupTapOutClose(id);
}

export async function showOwnerCenterModal() {
  const id = 'owner-center-modal';
  if (!document.getElementById(id)) await createOwnerCenterModal();
  showModal(id);
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

// Toast: single instance; header+close supported.
// Accepts number (duration) or opts { duration, title, manualCloseOnly }.
// Default: 4s, closable by tap anywhere or ESC (unless manualCloseOnly).
export function showToast(message, opts = 4000) {
  // ensure one active toast; remove existing
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const { duration = 4000, title = '', manualCloseOnly = false } =
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

    btn.addEventListener('click', () => hideToast());
    header.appendChild(h);
    header.appendChild(btn);
    toast.appendChild(header);
  }

  const body = document.createElement('div');
  body.className = 'toast-body';
  // Normalize literal "\n" sequences from translations into real line breaks in HTML
  body.innerHTML = String(message).replace(/\\n/g, '\n').replace(/\n/g, '<br>');
  toast.appendChild(body);

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  let timerId = null;

  const removeGlobalListeners = () => {
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
  };

  const hideToast = () => {
    toast.classList.remove('visible');
    removeGlobalListeners();
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    setTimeout(() => toast.remove(), 400);
  };

  const onDocClick = () => {
    // tap anywhere closes (except when manualCloseOnly)
    if (!manualCloseOnly) hideToast();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      hideToast();
    }
  };

  if (!manualCloseOnly) {
    // tap-anywhere + ESC close
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKeyDown, true);

    if (duration > 0) {
      timerId = setTimeout(hideToast, duration);
    }
  }
}

// Uses generic toast with 4s auto-close; keeps one implementation
export function showThankYouToast() {
  return showToast("💖 Thank you for your support!", 4000);
}

// Cashier-side Redeem Confirmation modal.
// Shown only on the device that followed the /out/qr-redeem redirect,
// separate from the LPM rating widget. Logs redeem-confirmation-cashier via /hit.
export function showRedeemConfirmationModal({ locationIdOrSlug, campaignKey = '' }) {
  const modalId = 'cashier-redeem-confirmation-modal';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  if (!locationIdOrSlug) return;

  const wrap = document.createElement('div');
  wrap.id = modalId;
  wrap.className = 'modal hidden';

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';

  const hasT = (typeof t === 'function');
  const titleTxt =
    (hasT ? (t('redeem.confirm.title') || '') : '') ||
    'Redeem Confirmation';

  top.innerHTML = `
    <h2 class="modal-title">${titleTxt}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  const closeBtn = top.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => hideModal(modalId));
  }

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  const questionTxt =
    (hasT ? (t('redeem.confirm.question') || '') : '') ||
    'How smooth did the redeem event go?';

  const pQ = document.createElement('p');
  pQ.textContent = questionTxt;
  pQ.style.textAlign = 'center';
  pQ.style.marginBottom = '0.75rem';
  inner.appendChild(pQ);

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.justifyContent = 'center';
  row.style.gap = '0.5rem';

  const faces = [
    { emoji: '😕', score: 1 },
    { emoji: '😐', score: 2 },
    { emoji: '🙂', score: 3 },
    { emoji: '😄', score: 4 },
    { emoji: '🤩', score: 5 }
  ];

  const sendConfirmation = (score) => {
    try {
      const base = TRACK_BASE || 'https://navigen-api.4naama.workers.dev';
      const url = new URL(`/hit/redeem-confirmation-cashier/${encodeURIComponent(locationIdOrSlug)}`, base);
      url.searchParams.set('score', String(score));
      if (campaignKey) url.searchParams.set('campaignKey', campaignKey);

      fetch(url.toString(), {
        method: 'POST',
        keepalive: true
      }).catch(() => {});
    } catch (_e) {
      // logging must never break UI
    }
  };

  faces.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = f.emoji;
    btn.style.fontSize = '1.6rem';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => {
      sendConfirmation(f.score);
      hideModal(modalId);
    });
    row.appendChild(btn);
  });

  inner.appendChild(row);
  body.appendChild(inner);
  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  showModal(modalId);
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

export function createPromotionsModal() {
  if (document.getElementById("promotions-modal")) return;

  const modal = injectModal({
    id: "promotions-modal",
    layout: "menu", // ensures .modal-content.modal-menu → header sits flush (matches My Stuff pattern)
    bodyHTML: `<div id="promotions-body" class="modal-body"></div>`
  });

  modal.classList.add("hidden");

  const topBar = document.createElement("div");
  topBar.className = "modal-top-bar";
  topBar.innerHTML = `
    <h2 class="modal-header">${t("promotions")}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  modal.querySelector(".modal-content")?.prepend(topBar);
  topBar
    .querySelector(".modal-close")
    ?.addEventListener("click", () => hideModal("promotions-modal"));
}

export function showPromotionsModal() {
  if (!document.getElementById("promotions-modal")) {
    createPromotionsModal();
  }

  const modal = document.getElementById("promotions-modal");
  const body = modal?.querySelector("#promotions-body");
  const title = modal?.querySelector(".modal-header");
  if (!modal || !body || !title) return;

  title.textContent = t("promotions");
  body.innerHTML = "";

  const list = document.createElement("div");
  list.className = "modal-menu-list";
  body.appendChild(list);

  const renderEmpty = (msg) => {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = msg;
    list.appendChild(empty);
  };

  const now = new Date();

  fetch("/data/campaigns.json", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : []))
    .then((campaigns) => {
      if (!Array.isArray(campaigns) || campaigns.length === 0) {
        renderEmpty(t("no.promotions.yet") || "No promotions are running right now.");
        showModal("promotions-modal");
        setupTapOutClose("promotions-modal");
        return;
      }

      // derive pageKey from URL, same pattern as ACTIVE_PAGE in app.js
      const segs = location.pathname.split("/").filter(Boolean);
      if (/^[a-z]{2}$/i.test(segs[0] || "")) segs.shift();
      const pageKey =
        segs.length >= 2
          ? `${segs[0].toLowerCase()}/${segs.slice(1).join("/").toLowerCase()}`
          : "";

      const running = campaigns.filter((c) => {
        const statusOk = String(c.status || "").toLowerCase() === "active";
        if (!statusOk) return false;

        const start = c.startDate ? new Date(c.startDate) : null;
        const end = c.endDate ? new Date(c.endDate) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;

        if (!pageKey) return true;

        const ctx = String(c.context || "").toLowerCase();
        if (!ctx) return true;
        return ctx
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .includes(pageKey);
      });

      if (!running.length) {
        renderEmpty(t("no.promotions.yet") || "No promotions are running right now.");
        showModal("promotions-modal");
        setupTapOutClose("promotions-modal");
        return;
      }

      const formatDate = (value) => {
        if (!value) return "";
        // Sheet dates are already YYYY-MM-DD; render as-is to avoid timezone shifts.
        const s = String(value).trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
      };

      running.forEach((camp) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "modal-menu-item promotion-item";

        const campaignName = String(camp.campaignName || "").trim();
        const locationName = String(camp.locationName || "").trim();
        const startStr = formatDate(camp.startDate);
        const endStr = formatDate(camp.endDate);
        const range = startStr && endStr ? `${startStr} \u2192 ${endStr}` : "";

        // Promotions modal row: right column has chevron (top) + ➡️ (bottom).
        // - Clicking the row opens the Promotion Details modal (existing behavior).
        // - Clicking ➡️ opens the LPM for the campaign location (requested behavior).
        row.innerHTML = `
          <div class="label" style="flex:1 1 auto; min-width:0;">
            <strong>${campaignName || (t("promotion.unnamed") || "Promotion")}</strong><br>
            ${locationName ? `<small>${locationName}</small><br>` : ""}
            ${range ? `<small>${range}</small>` : ""}
          </div>

          <div class="promotion-actions-col" aria-hidden="false">
            <span class="promotion-chevron" aria-hidden="true">▾</span>
            <button type="button" class="promotion-lpm-link" aria-label="Open location">➡️</button>
          </div>
        `;

        row.addEventListener("click", () => {
          hideModal("promotions-modal");
          openPromotionQrModal(row, {
            locationID: camp.locationID,
            locationName: camp.locationName,
            name: camp.locationName,
            displayName: camp.locationName
          });
        });

        // ➡️ opens the LPM hosting the campaign (same-tab navigation; app boot opens ?lp=...).
        row.querySelector('.promotion-lpm-link')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          hideModal("promotions-modal");

          const lp = String(camp.locationID || '').trim();
          if (!lp) return;

          sessionStorage.setItem('navigen.internalLpNav', '1');
          window.location.href = `${location.origin}/?lp=${encodeURIComponent(lp)}`;
        });

        list.appendChild(row);
      });

      showModal("promotions-modal");
      setupTapOutClose("promotions-modal");
    })
    .catch(() => {
      renderEmpty(t("promotions.error") || "Promotions are unavailable right now.");
      showModal("promotions-modal");
      setupTapOutClose("promotions-modal");
    });
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
    label: 'Website',      // text label only
    emoji: '🌐',           // globe icon rendered in the icon slot
    icon: '',              // no SVG; emoji covers the icon role
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

// ============================
// 📡 Communication modal (Call / Email / apps)
// ============================
export function createCommunicationModal({ name, contact = {}, id }) {
  const modalId = 'comm-modal';
  document.getElementById(modalId)?.remove();

  const modal = injectModal({
    id: modalId,
    title: '',
    layout: 'action',
    bodyHTML: `<div class="modal-menu-list" id="comm-modal-list"></div>`
  });

  // header bar (same style as Social / Navigation)
  {
    const top = document.createElement('div');
    top.className = 'modal-top-bar';
    top.innerHTML = `
      <h2 class="modal-title">${String(name || 'Contact')}</h2>
      <button class="modal-close" aria-label="Close">&times;</button>
    `;
    modal.querySelector('.modal-content')?.prepend(top);
    top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(modalId));
  }

  const list = modal.querySelector('#comm-modal-list');
  if (!list) return;

  const phone    = String(contact.phone || '').trim();
  const email    = String(contact.email || '').trim();
  const whatsapp = String(contact.whatsapp || '').trim();
  const telegram = String(contact.telegram || '').trim();
  const messenger= String(contact.messenger || '').trim();

  const rows = [];

  if (phone) {
    rows.push({
      label: 'Call',
      icon: '📞',
      href: `tel:${phone}`,
      metric: 'call'
    });
  }

  if (email) {
    rows.push({
      label: 'Email',
      icon: '✉️',
      href: `mailto:${email}`,
      metric: 'email'
    });
  }

  // helper: normalise number for wa.me
  const waNumber = (whatsapp || phone || '')
    .replace(/[^\d+]/g, '')
    .replace(/^\+?/, '');
  if (waNumber) {
    rows.push({
      label: 'WhatsApp',
      iconSrc: '/assets/social/icon-whatsapp.svg',
      href: `https://wa.me/${waNumber}`,
      metric: 'whatsapp'
    });
  }

  if (telegram) {
    const handle = telegram.replace(/^@/, '').trim();
    if (handle) {
      rows.push({
        label: 'Telegram',
        iconSrc: '/assets/social/icons-telegram.svg',
        href: `https://t.me/${handle}`,
        metric: 'telegram'
      });
    }
  }

  if (messenger) {
    const handle = messenger.trim();
    if (handle) {
      rows.push({
        label: 'Messenger',
        iconSrc: '/assets/social/icons-messenger.svg',
        href: `https://m.me/${handle}`,
        metric: 'messenger'
      });
    }
  }

  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'modal-menu-item';
    empty.setAttribute('aria-disabled', 'true');
    empty.style.pointerEvents = 'none';
    empty.textContent = 'No direct contact channels configured.';
    list.appendChild(empty);
  } else {
    rows.forEach(row => {
      const a = document.createElement('a');
      a.className = 'modal-menu-item';
      a.href = row.href;
      a.target = '_blank';
      a.rel = 'noopener';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'icon-img';
      iconSpan.setAttribute('aria-hidden', 'true');

      if (row.iconSrc) {
        const img = document.createElement('img');
        img.src = row.iconSrc;
        img.alt = '';
        img.className = 'icon-img';
        iconSpan.appendChild(img);
      } else if (row.icon) {
        iconSpan.textContent = row.icon;
      }

      const labelSpan = document.createElement('span');
      labelSpan.textContent = row.label;

      a.appendChild(iconSpan);
      a.appendChild(labelSpan);

      // tracking + open: send /hit/<metric>/<idOrSlug> then hand off to OS/app
      if (row.metric && id) {
        a.addEventListener('click', async (ev) => {
          ev.preventDefault();
          const raw = String(id || '').trim();
          const openTarget = () => {
            if (row.href.startsWith('tel:') || row.href.startsWith('mailto:')) {
              location.href = row.href; // let OS dialer / mail client take over
            } else {
              window.open(row.href, '_blank', 'noopener,noreferrer');
            }
          };

          try {
            // let the Worker resolve slug → ULID via canonicalId(); no stats dependency
            await fetch(
              `${TRACK_BASE}/hit/${encodeURIComponent(row.metric)}/${encodeURIComponent(raw)}`,
              { method: 'POST', keepalive: true }
            ).catch(() => {});
          } catch {
            // tracking must not block the action
          }

          openTarget();
        }, { capture: true });
      }

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
  modal.querySelector(".modal-content")?.classList.add("modal-action"); // Match Promotions modal-content sizing/padding

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
    layout: "action", // Keep action layout so Donation uses the same modal-content variant as Promotions
    bodyHTML: `
      <div>
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

// Cashier-side Redeem Confirmation modal (legacy alias).
// Older code paths may still import this name; delegate to the primary
// showRedeemConfirmationModal implementation defined earlier.
export function showRedeemConfirmationModalLegacy(args) {
  // The main cashier modal lives above in this module and handles:
  // - rendering the question / smileys
  // - sending /hit/redeem-confirmation-cashier
  return showRedeemConfirmationModal(args);
}

/**
 * Saves a received coordinate into Location History.
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