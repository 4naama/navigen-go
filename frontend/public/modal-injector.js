// analytics: unified endpoint; always use live worker for all environments
const TRACK_BASE = 'https://navigen-api.4naama.workers.dev';

function translatedOrFallback(key, fallback = '') {
  if (typeof t !== 'function') return fallback;

  const raw = String(t(key) || '').trim();
  if (!raw) return fallback;

  const escapedKey = String(key || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const unresolvedBracketed = new RegExp(`^\\[\\s*${escapedKey}\\s*\\]$`).test(raw);

  return raw !== key && !unresolvedBracketed ? raw : fallback;
}

function wireExclusiveDetails(root, selector) {
  const scope = root instanceof HTMLElement ? root : null;
  if (!scope) return;

  const flagAttr = `data-exclusive-details-${String(selector || '').replace(/[^a-z0-9]+/gi, '-')}`;
  if (scope.getAttribute(flagAttr) === '1') return;
  scope.setAttribute(flagAttr, '1');

  scope.addEventListener('click', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const summary = target?.closest?.('summary');
    if (!summary) return;

    const current = summary.closest(selector);
    if (!(current instanceof HTMLDetailsElement)) return;

    // Clicking an already-open chip should just let it close itself.
    if (current.open) return;

    scope.querySelectorAll(selector).forEach((node) => {
      if (node instanceof HTMLDetailsElement && node !== current) {
        node.open = false;
      }
    });
  });
}

const PINNED_PROMOTIONS_KEY = 'navigen.pinnedPromotions';

function getPromotionPinKey({
  campaignKey = '',
  locationID = '',
  campaignName = '',
  startDate = '',
  endDate = '',
  qrUrl = ''
} = {}) {
  const explicit = String(campaignKey || '').trim();
  if (explicit) return explicit;

  try {
    const fromQr = String(new URL(String(qrUrl || ''), location.origin).searchParams.get('camp') || '').trim();
    if (fromQr) return fromQr;
  } catch {
    // ignore malformed URLs; fall through to the deterministic composite key
  }

  return [
    String(locationID || '').trim(),
    String(campaignName || '').trim(),
    String(startDate || '').trim(),
    String(endDate || '').trim()
  ].filter(Boolean).join('::');
}

function readPinnedPromotions() {
  try {
    const raw = JSON.parse(localStorage.getItem(PINNED_PROMOTIONS_KEY) || '[]');
    return Array.isArray(raw)
      ? Array.from(new Set(raw.map(v => String(v || '').trim()).filter(Boolean)))
      : [];
  } catch {
    return [];
  }
}

function writePinnedPromotions(keys) {
  try {
    const next = Array.from(new Set((Array.isArray(keys) ? keys : []).map(v => String(v || '').trim()).filter(Boolean)));
    localStorage.setItem(PINNED_PROMOTIONS_KEY, JSON.stringify(next));
  } catch {
    // storage failures must never break UI
  }
}

function isPinnedPromotion(entry) {
  const key = getPromotionPinKey(entry);
  return !!key && readPinnedPromotions().includes(key);
}

function setPinnedPromotion(entry, pinned) {
  const key = getPromotionPinKey(entry);
  if (!key) return false;

  const current = readPinnedPromotions();
  const next = pinned
    ? [key, ...current.filter(v => v !== key)]
    : current.filter(v => v !== key);

  writePinnedPromotions(next);
  return pinned;
}

function togglePinnedPromotion(entry) {
  const nextPinned = !isPinnedPromotion(entry);
  setPinnedPromotion(entry, nextPinned);
  return nextPinned;
}

// ---------------------------------------------------------------------------
// Campaign entitlement pre-resolver (deterministic; no post-render repaint)
// ---------------------------------------------------------------------------
const __statusCache = new Map(); // locationSlug -> Promise<status|null>

async function getStatusOnce(locationSlug) {
  const slug = String(locationSlug || '').trim();
  if (!slug) return null;

  if (!__statusCache.has(slug)) {
    const p = fetch(`/api/status?locationID=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      credentials: 'include'
    })
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null);

    __statusCache.set(slug, p);
  }
  return __statusCache.get(slug);
}

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

function markBusyLocal(el, on = true, opts = {}) {
  const node = el instanceof HTMLElement ? el : null;
  if (!node) return;
  const { showDelayMs = 150, minVisibleMs = 450 } = opts || {};

  let dot = node.querySelector('.syb-status-dot');
  if (!dot) {
    dot = document.createElement('span');
    dot.className = 'syb-status-dot'; // WIP-only dot (no status class)
    dot.dataset.wipTemp = '1';        // mark: safe to remove on release
    dot.setAttribute('aria-hidden', 'true');
    node.appendChild(dot);
  }

  if (on) {
    node.dataset.busy = '1';
    node.style.pointerEvents = 'none';

    // Delay showing the busy dot to avoid "flash" on fast operations
    const tShow = setTimeout(() => {
      if (node.dataset.busy !== '1') return;
      dot.classList.add('syb-busy');
      dot.dataset.wipShownAt = String(Date.now());
    }, Number(showDelayMs) || 0);

    node.dataset.wipShowTimer = String(tShow);

  } else {
    node.dataset.busy = '0';
    node.style.pointerEvents = '';

    // Cancel pending show (if we finished before the delay)
    const tShowRaw = Number(node.dataset.wipShowTimer || '');
    if (Number.isFinite(tShowRaw) && tShowRaw) clearTimeout(tShowRaw);
    node.dataset.wipShowTimer = '';

    // If the dot was shown, keep it visible for a minimum time to be perceptible
    const shownAt = Number(dot.dataset.wipShownAt || '0');
    const elapsed = shownAt ? (Date.now() - shownAt) : 0;
    const needHold = shownAt && elapsed < (Number(minVisibleMs) || 0);

    const finish = () => {
      dot.classList.remove('syb-busy');
      dot.dataset.wipShownAt = '';

      // Remove temporary WIP-only dot so it never stains the UI
      if (dot.dataset.wipTemp === '1') dot.remove();
    };

    if (needHold) setTimeout(finish, (Number(minVisibleMs) || 0) - elapsed);
    else finish();
  }
}

// Show Promotion QR Code in its own modal (QR only, like Business QR size)
// locationIdOrSlug is used for optional customer-side confirmation logging.
function showPromotionQrModal(qrUrl, locationIdOrSlug) {
  const id = 'promo-qr-modal';
  document.getElementById(id)?.remove();

  const titleText = translatedOrFallback('qr.role.campaign-redeem-label', 'Campaign redemption QR');

  const modal = injectModal({
    id,
    title: titleText,
    layout: 'menu',
    bodyHTML: ''
  });

  const top = modal.querySelector('.modal-top-bar');
  const inner = modal.querySelector('.modal-body-inner');
  if (!(top instanceof HTMLElement) || !(inner instanceof HTMLElement)) return;

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
  const descText = translatedOrFallback(
    'qr.role.campaign-redeem-desc',
    'Show this QR code to the staff member or designated verifier handling the redemption.'
  );

  const warningText = translatedOrFallback(
    'qr.role.campaign-redeem-warning',
    'After scanning, wait for confirmation. This usually takes 10–20 seconds, depending on network speed.'
  );

  const termsText = translatedOrFallback(
    'campaign.redeem-terms',
    'By redeeming, I agree to the offer terms.'
  );

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
  const thanksText = translatedOrFallback('qr.role.campaign-redeem-thanks', 'Thank you!');

  // post-QR thanks line (t(key); shown under QR)
  const pThanks = document.createElement('p');
  pThanks.style.marginBottom = '0'; // eliminate space after "Thank you!"
  pThanks.textContent = thanksText;
  pThanks.style.textAlign = 'center';
  inner.appendChild(pThanks);

  disableTapOutClose(id);

  // Customer-side redeem status polling (token-aware, short-lived).
  // When the token is redeemed on the cashier device, we can ask the customer for quick feedback.
  try {
    const urlObj = new URL(qrUrl);
    const redeemToken = (urlObj.searchParams.get('rt') || '').trim();
    let stopped = false;

    const stop = () => { stopped = true; };

    // Stop polling if modal is closed by the user
    top.querySelector('.modal-close')?.addEventListener('click', stop);

    // Redeem token status is owned by the site worker (navigen.io).
    const statusBase = TRACK_BASE || 'https://navigen-api.4naama.workers.dev';

    // Customer confirmation logging is analytics and belongs to TRACK_BASE.
    const hitBase = TRACK_BASE || 'https://navigen-api.4naama.workers.dev';

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
          const hit = new URL(`/hit/redeem-confirmation-customer/${encodeURIComponent(locationIdOrSlug)}`, hitBase);
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

      // Ensure customer confirmation is not visually or interaction-wise overpainted by the LPM.
      // Hide the LPM if it's currently visible; it can be reopened after feedback.
      try {
        const lpm = document.getElementById('location-profile-modal');
        if (lpm && !lpm.classList.contains('hidden')) {
          hideModal('location-profile-modal');
        }
      } catch {
        // never break feedback UX
      }

      showModal(id);
    };

    const pollStatus = async () => {
      if (stopped || !redeemToken) return;
      try {
        const statusUrl = new URL('/api/redeem-status', statusBase);
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

function showActiveCampaignsModal({ locationIdOrSlug, locationName, items }) {
  const id = 'active-campaigns-modal';
  document.getElementById(id)?.remove();

  const modal = injectModal({
    id,
    title: (typeof t === 'function' && t('campaign.activePicker.title')) || 'Active campaigns',
    layout: 'menu',
    bodyHTML: ''
  });

  const inner = modal.querySelector('.modal-body-inner');
  if (!(inner instanceof HTMLElement)) return;

  const note = document.createElement('p');
  note.className = 'muted muted-note';
  note.style.textAlign = 'left';
  note.textContent =
    (typeof t === 'function' && t('campaign.activePicker.note')) ||
    'Select a campaign to view promotion details and show the redeem QR.';
  inner.appendChild(note);

  const list = document.createElement('div');
  list.className = 'modal-menu-list';
  inner.appendChild(list);

  const fmt = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s || '').trim()) ? String(s).trim() : '');
  const sharedLocationName = String(locationName || '').trim();

  (Array.isArray(items) ? items : []).forEach((c) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modal-menu-item';

    const campaignName =
      String(c?.campaignName || '').trim() ||
      ((typeof t === 'function' && t('promotion.unnamed')) || 'Promotion');

    const itemLocationName = String(c?.locationName || sharedLocationName || '').trim();
    const productName = String(c?.productName || '').trim();
    const eligibilityText = String(c?.eligibilityNotes || c?.eligibilityType || '').trim();

    const discountKind = String(c?.discountKind || '').trim().toLowerCase();
    const discountValue = typeof c?.discountValue === 'number' ? c.discountValue : null;

    const discountText =
      (discountKind === 'percent' && typeof discountValue === 'number')
        ? `${discountValue.toFixed(0)}% off your purchase`
        : campaignName;

    const summary = buildPromotionSummaryCard({
      discountText,
      campaignName,
      locationName: itemLocationName,
      productName,
      eligibilityText,
      startDate: fmt(c?.startDate),
      endDate: fmt(c?.endDate)
    });

    btn.innerHTML = summary.innerHTML;

    const locIdent = String(
      locationIdOrSlug ||
      c?.locationID ||
      c?.locationId ||
      c?.locationSlug ||
      c?.locationAlias ||
      c?.alias ||
      c?.slug ||
      c?.locationULID ||
      c?.locationKey ||
      c?.id ||
      ''
    ).trim();

    if (locIdent) btn.setAttribute('data-locationid', locIdent);

    btn.addEventListener('click', () => {
      openPromotionQrModal(btn, {
        locationID: locIdent,
        locationSlug: String(c?.locationSlug || c?.slug || '').trim(),
        locationULID: String(c?.locationULID || c?.locationID || '').trim(),
        alias: String(c?.locationAlias || c?.alias || '').trim(),
        id: String(c?.id || '').trim(),
        name: itemLocationName,
        displayName: itemLocationName,
        campaignKey: String(c?.campaignKey || '').trim()
      });
    });

    list.appendChild(btn);
  });

  setupTapOutClose(id);
  showModal(id);
}

// Promotion helper: show campaign details + button to open the Redemption QR modal
async function openPromotionQrModal(modal, data) {
  try {
    const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

    const tmpl = (key, fallback) => translatedOrFallback(key, fallback);

    const applyTemplate = (str, vars) =>
      String(str || '').replace(/{{(\w+)}}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m));

    const sourceModal = modal?.classList?.contains('modal')
      ? modal
      : modal?.closest?.('.modal');

    const sourceModalId = String(sourceModal?.id || '').trim();

    const hideSourcePicker = () => {
      if (sourceModalId === 'promotions-modal' || sourceModalId === 'active-campaigns-modal') {
        hideModal(sourceModalId);
      }
    };

    // Collect possible identifiers.
    const domId = String(
      modal?.getAttribute?.('data-locationid') ||
      sourceModal?.getAttribute?.('data-locationid') ||
      ''
    ).trim();

    const payloadCampaignKey = String(data?.campaignKey || '').trim();

    const candidates = [
      domId,
      data?.locationID,
      data?.locationId,
      data?.locationSlug,
      data?.locationAlias,
      data?.alias,
      data?.slug,
      data?.locationULID,
      data?.locationKey,
      data?.id,
      data?.rawId
    ]
      .map(v => String(v || '').trim())
      .filter(Boolean);

    let locationIdOrSlug = '';
    for (const c of candidates) {
      if (!ULID.test(c)) {
        locationIdOrSlug = c;
        break;
      }
    }
    if (!locationIdOrSlug) {
      locationIdOrSlug = candidates.find((c) => ULID.test(c)) || '';
    }

    if (!locationIdOrSlug && !payloadCampaignKey) {
      showToast('Promotions unavailable for this location', 1600);
      return;
    }

    // Call promo-qr on the authoritative API Worker so QR minting, ARMED logging, and redeem routing all use the same backend path.
    const apiUrl = new URL('/api/promo-qr', TRACK_BASE || 'https://navigen-api.4naama.workers.dev');

    if (locationIdOrSlug) apiUrl.searchParams.set('locationID', locationIdOrSlug);
    if (payloadCampaignKey) apiUrl.searchParams.set('campaignKey', payloadCampaignKey);

    const res = await fetch(apiUrl.toString(), { cache: 'no-store' });

    if (!res.ok) {
      if (res.status === 409) {
        const payload = await res.json().catch(() => null);
        const items = Array.isArray(payload?.items) ? payload.items : [];
        if (!items.length) {
          showToast('Promotions unavailable for this location', 2000);
          return;
        }

        hideSourcePicker();
        showActiveCampaignsModal({
          locationIdOrSlug,
          locationName: String(data?.name || data?.displayName || payload?.locationName || '').trim(),
          items
        });
        return;
      }

      if (res.status === 403) {
        const payload = await res.json().catch(() => null);
        const code = String(payload?.error?.code || '').trim();
        const msg = code === 'campaign_preset_visibility'
          ? (String(payload?.error?.message || '').trim() || ((typeof t === 'function' && t('campaign.plan.preset.visibility.note')) || 'Promotion is turned off for this campaign.'))
          : ((typeof t === 'function' && t('promo.gated.campaignRequired')) ||
            'Promotions are available only while this business is running an active NaviGen campaign.');

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
    const resolvedLocationIdOrSlug = String(
      locationIdOrSlug ||
      payload?.locationID ||
      payload?.locationId ||
      payload?.locationSlug ||
      payload?.locationAlias ||
      payload?.alias ||
      payload?.slug ||
      ''
    ).trim();

    const qrUrl = String(payload?.qrUrl || '').trim();
    const campaignName = String(payload?.campaignName || '').trim();
    const productName = String(payload?.productName || '').trim();
    const startDate = String(payload?.startDate || '').trim();
    const endDate = String(payload?.endDate || '').trim();
    const eligibilityType = String(payload?.eligibilityType || '').trim();
    const eligibilityNotes = String(payload?.eligibilityNotes || '').trim();
    const discountKind = String(payload?.discountKind || '').trim();
    const discountValue = typeof payload?.discountValue === 'number' ? payload.discountValue : null;

    if (!qrUrl) {
      console.warn('openPromotionQrModal: missing qrUrl in API response');
      showToast('Promotion QR unavailable', 1600);
      return;
    }

    const locName = String(
      data?.name ||
      data?.displayName ||
      payload?.locationName ||
      'this location'
    ).trim() || 'this location';

    const eligibilityText = eligibilityNotes || eligibilityType || '';

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

    // Remove any previous Promotion modal.
    const modalId = 'promotion-modal';
    document.getElementById(modalId)?.remove();

    const promoTitle = tmpl('promotion.title', 'Promotion details');
    const detailsModal = injectModal({
      id: modalId,
      title: promoTitle,
      layout: 'menu',
      bodyHTML: ''
    });

    const inner = detailsModal.querySelector('.modal-body-inner');
    if (!(inner instanceof HTMLElement)) {
      showToast('Promotions unavailable for this location', 2000);
      return;
    }

    // 1–2) Promotion summary card (non-clickable; no chevron/arrow)
    {
      const summary = buildPromotionSummaryCard({
        discountText,
        campaignName,
        locationName: locName,
        productName,
        eligibilityText,
        startDate,
        endDate
      });
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
        'This offer is valid only when it is checked at the point of redemption by staff or the designated verifier.'
      );
      const pWarn = document.createElement('p');
      pWarn.textContent = warnText;
      pWarn.style.textAlign = 'left';
      pWarn.style.fontSize = '0.85em';
      pWarn.style.opacity = '0.8';
      inner.appendChild(pWarn);
    }

    const resolvedCampaignKey = (() => {
      const explicit = String(data?.campaignKey || payload?.campaignKey || '').trim();
      if (explicit) return explicit;
      try {
        return String(new URL(qrUrl, location.origin).searchParams.get('camp') || '').trim();
      } catch {
        return '';
      }
    })();

    const pinnedEntry = {
      campaignKey: resolvedCampaignKey,
      locationID: resolvedLocationIdOrSlug,
      campaignName,
      startDate,
      endDate,
      qrUrl
    };

    const secondaryCtas = document.createElement('div');
    secondaryCtas.className = 'promotion-detail-secondary-ctas';

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = 'modal-footer-button';
    pinBtn.textContent = '⭐';

    const syncPinBtn = () => {
      const pinned = isPinnedPromotion(pinnedEntry);
      pinBtn.classList.toggle('is-active', pinned);
      pinBtn.setAttribute('aria-pressed', pinned ? 'true' : 'false');

      const label = pinned
        ? tmpl('promotion.unpin', 'Unpin campaign')
        : tmpl('promotion.pin', 'Pin campaign');

      pinBtn.setAttribute('aria-label', label);
      pinBtn.title = label;
    };

    pinBtn.addEventListener('click', () => {
      const pinnedNow = togglePinnedPromotion(pinnedEntry);
      syncPinBtn();
      showToast(
        pinnedNow
          ? tmpl('promotion.pin.toast', 'Campaign pinned')
          : tmpl('promotion.unpin.toast', 'Campaign unpinned'),
        1600
      );
    });

    syncPinBtn();

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'modal-footer-button';
    shareBtn.textContent = '📤';
    shareBtn.setAttribute('aria-label', tmpl('promotion.share', 'Share campaign'));
    shareBtn.title = tmpl('promotion.share', 'Share campaign');
    shareBtn.addEventListener('click', async () => {
      const shareUrl = resolvedLocationIdOrSlug
        ? `${location.origin}/?lp=${encodeURIComponent(resolvedLocationIdOrSlug)}`
        : location.origin;
      const shareTitle = campaignName || discountText || 'Promotion';
      const shareText = [shareTitle, locName].filter(Boolean).join(' — ');

      try {
        if (navigator.share) {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText([shareText, shareUrl].filter(Boolean).join('\n'));
          showToast(tmpl('promotion.share.copied', 'Promotion link copied'), 1600);
        }
      } catch (_e) {
        // sharing must never break Promotion details
      }
    });

    const openLocationBtn = document.createElement('button');
    openLocationBtn.type = 'button';
    openLocationBtn.className = 'modal-footer-button';
    openLocationBtn.textContent = '➡️';
    openLocationBtn.setAttribute('aria-label', tmpl('promotion.openLocation', 'Open location'));
    openLocationBtn.title = tmpl('promotion.openLocation', 'Open location');

    if (!resolvedLocationIdOrSlug) {
      openLocationBtn.disabled = true;
      openLocationBtn.setAttribute('aria-disabled', 'true');
      openLocationBtn.style.opacity = '0.5';
      openLocationBtn.style.cursor = 'default';
    } else {
      openLocationBtn.addEventListener('click', () => {
        hideModal(modalId);
        sessionStorage.setItem('navigen.internalLpNav', '1');
        window.location.href = `${location.origin}/?lp=${encodeURIComponent(resolvedLocationIdOrSlug)}`;
      });
    }

    secondaryCtas.appendChild(pinBtn);
    secondaryCtas.appendChild(shareBtn);
    secondaryCtas.appendChild(openLocationBtn);
    inner.appendChild(secondaryCtas);

    // 9) Button: “I’m at the cashier — 🔳 show my code”
    const btnWrap = document.createElement('div');
    btnWrap.className = 'modal-actions';

    const qrBtn = document.createElement('button');
    qrBtn.type = 'button';
    qrBtn.className = 'modal-body-button';
    qrBtn.textContent = tmpl('campaign.redeem-button', "I'm at the redeem point — 🔳 show my code");
    qrBtn.addEventListener('click', () => {
      hideModal(modalId);
      // Open the Promotion QR modal and pass location ID/slug for customer confirmation tracking
      showPromotionQrModal(qrUrl, resolvedLocationIdOrSlug);
    });

    // 10) Only tap this when you're ready to pay. (small)
    const hintText = tmpl('promotion.redeem-hint', "Only tap this when you're ready for the redemption check.");
    const hint = document.createElement('p');
    hint.textContent = hintText;
    hint.style.textAlign = 'left';
    hint.style.fontSize = '0.85em'; // small
    hint.style.opacity = '0.8';
    inner.appendChild(hint);

    btnWrap.appendChild(qrBtn);
    inner.appendChild(btnWrap);

    disableTapOutClose(modalId);

    hideSourcePicker();
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

  // Promo redeem and promo QR flows may also navigate via ?lp=...; never count those as static QR scans.
  if (url.searchParams.get('rt') || url.searchParams.get('camp') || url.searchParams.get('redeemed')) return;

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
    const r = await fetch(url, { cache: 'no-store', credentials: 'include' });
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

function formatDescriptionHtml(s) {
  const esc = (x) => String(x || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const norm = String(s || '').replace(/\r\n?/g, '\n').trim();
  if (!norm) return '';

  const paras = norm
    .split(/\n{2,}/)
    .map((p) => esc(p).replace(/\n/g, '<br>'));

  return '<p>' + paras.join('</p><p>') + '</p>';
}

function normalizeDescriptionMap(d) {
  const out = {};
  if (d && typeof d === 'object') {
    Object.keys(d).forEach((k) => {
      const kk = String(k || '').toLowerCase().trim();
      const vv = String(d[k] ?? '').trim();
      if (kk && vv) out[kk] = vv;
    });
  }
  return out;
}

function normalizeLocationLookupKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function addLocationLookupKey(set, value) {
  const key = normalizeLocationLookupKey(value);
  if (key) set.add(key);
}

function addLocalizedNameKeys(set, value) {
  if (!value) return;

  if (typeof value === 'string') {
    addLocationLookupKey(set, value);
    return;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach((entry) => addLocationLookupKey(set, entry));
  }
}

function getLocationLookupKeys(record = {}) {
  const keys = new Set();

  addLocationLookupKey(keys, record?.ID);
  addLocationLookupKey(keys, record?.id);
  addLocationLookupKey(keys, record?.locationID);
  addLocationLookupKey(keys, record?.locationId);
  addLocationLookupKey(keys, record?.slug);
  addLocationLookupKey(keys, record?.alias);
  addLocationLookupKey(keys, record?.locationAlias);
  addLocationLookupKey(keys, record?.displayName);
  addLocationLookupKey(keys, record?.name);
  addLocationLookupKey(keys, record?.title);
  addLocalizedNameKeys(keys, record?.locationName);

  return Array.from(keys);
}

function resolveDescriptionMapForLocation(payload = {}, collections = []) {
  const direct = normalizeDescriptionMap(payload?.descriptions || payload?.raw?.descriptions);
  if (Object.keys(direct).length) return direct;

  const wanted = new Set([
    ...getLocationLookupKeys(payload),
    ...getLocationLookupKeys(payload?.raw || {})
  ]);

  if (!wanted.size) return {};

  const pools = collections
    .flatMap((source) => {
      if (Array.isArray(source)) return source;
      if (source && Array.isArray(source.locations)) return source.locations;
      return [];
    })
    .filter(Boolean);

  for (const record of pools) {
    const descs = normalizeDescriptionMap(record?.descriptions);
    if (!Object.keys(descs).length) continue;

    const recordKeys = getLocationLookupKeys(record);
    if (recordKeys.some((key) => wanted.has(key))) return descs;
  }

  return {};
}

function getSharedBusinessStatusMeta(kind) {
  const lookup = {
    taken: {
      icon: '🔴',
      title: translatedOrFallback('root.bo.selectLocation.help.taken.title', '🔴 Taken — already operated.'),
      desc: translatedOrFallback('root.bo.selectLocation.help.taken.desc', 'This business is already operated and cannot be claimed here.')
    },
    free: {
      icon: '🟢',
      title: translatedOrFallback('root.bo.selectLocation.help.free.title', '🟢 Free — available.'),
      desc: translatedOrFallback('root.bo.selectLocation.help.free.desc', 'This business is available to set up in owner center.')
    },
    stillVisible: {
      icon: '🔵',
      title: translatedOrFallback('root.bo.selectLocation.help.stillVisible.title', '🔵 Still visible — courtesy or hold.'),
      desc: translatedOrFallback('root.bo.selectLocation.help.stillVisible.desc', 'This business remains visible for a short courtesy period.')
    },
    parked: {
      icon: '🟠',
      title: translatedOrFallback('root.bo.selectLocation.help.parked.title', '🟠 Parked — inactive.'),
      desc: translatedOrFallback('root.bo.selectLocation.help.parked.desc', 'This business is inactive and currently not discoverable.')
    },
    promoted: {
      icon: '🎁',
      title: translatedOrFallback('root.bo.selectLocation.help.promoted.title', '🎁 Promoted — active campaign.'),
      desc: translatedOrFallback('root.bo.selectLocation.help.promoted.desc', 'This business is running an active campaign right now.')
    }
  };

  return lookup[kind] || null;
}

function buildLpmStatusItems(status = {}) {
  const owned = status?.ownedNow === true;
  const visibilityState = String(status?.visibilityState || '').trim();
  const courtesyUntil = String(status?.courtesyUntil || '').trim();
  const campaignEntitled = status?.campaignEntitled === true;

  const items = [];

  if (owned) items.push(getSharedBusinessStatusMeta('taken'));
  else if (visibilityState === 'hidden') items.push(getSharedBusinessStatusMeta('parked'));
  else if (courtesyUntil) items.push(getSharedBusinessStatusMeta('stillVisible'));
  else items.push(getSharedBusinessStatusMeta('free'));

  if (campaignEntitled) items.push(getSharedBusinessStatusMeta('promoted'));

  return items.filter(Boolean);
}

function renderLpmStatusChip(modal, status = null) {
  const iconsEl = modal?.querySelector('#lpm-status-face-icons');
  const bodyEl = modal?.querySelector('#lpm-status-body');
  if (!(iconsEl instanceof HTMLElement) || !(bodyEl instanceof HTMLElement)) return;

  const items = status ? buildLpmStatusItems(status) : [];
  iconsEl.textContent = items.length ? items.map((item) => item.icon).join(' ') : '⏳';

  bodyEl.innerHTML = '';

  if (!items.length) {
    const loading = document.createElement('div');
    loading.className = 'lpm-status-item';

    const title = document.createElement('div');
    title.className = 'lpm-status-item-title';
    title.textContent = translatedOrFallback('lpm.status.loading', '⏳ Loading status…');

    loading.appendChild(title);
    bodyEl.appendChild(loading);
    return;
  }

  items.forEach((item) => {
    const wrap = document.createElement('div');
    wrap.className = 'lpm-status-item';

    const title = document.createElement('div');
    title.className = 'lpm-status-item-title';
    title.textContent = item.title;

    const desc = document.createElement('div');
    desc.className = 'lpm-status-item-desc';
    desc.textContent = item.desc;

    wrap.appendChild(title);
    wrap.appendChild(desc);
    bodyEl.appendChild(wrap);
  });
}

function getLpmRatingFaceEmoji(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score <= 0) return '—';
  if (score >= 4.5) return '🤩';
  if (score >= 3.5) return '😄';
  if (score >= 2.5) return '🙂';
  if (score >= 1.5) return '😐';
  return '😕';
}

function formatLpmRatingCount(count) {
  const n = Number(count || 0);
  if (!Number.isFinite(n) || n <= 0) return '';
  return n.toLocaleString(document.documentElement?.lang || undefined);
}

let lpmProfilesLocationsPromise;

function getProfilesLocationRecords() {
  if (!lpmProfilesLocationsPromise) {
    lpmProfilesLocationsPromise = Promise.resolve([]);
  }

  return lpmProfilesLocationsPromise;
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
  content.className = 'modal-content modal-menu';

  // Top bar: title first, then Close → places the X on the right (matches other modals)
  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  const displayName = String(data?.displayName ?? data?.name ?? 'Location'); // location title only
  top.innerHTML = `
      <h2 class="modal-title" aria-live="polite">📍 ${displayName}</h2>      
      <button class="modal-close" aria-label="Close">&times;</button>
    `;
  
/** alias payload locally; resolve descriptions from payload, raw record, and injected sources */
const payload = (typeof data === 'object' && data) ? data : {};
const descs = resolveDescriptionMapForLocation(payload, [
  payload?.raw ? [payload.raw] : [],
  geoPoints,
  profiles,
  structureData
]);

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
      descHTML = formatDescriptionHtml(`${base}\n\nℹ️ Available languages: ${names.join(', ')}`);      
    } else {
      descHTML = formatDescriptionHtml(base);
    }
  } else {
    // lead: show description text only; remove the "Showing …" note
    descHTML = formatDescriptionHtml(chosenText);
  }

  // Rootize hero src; prefer media.cover → imageSrc → first media/images entry. (Green icon is a valid cover.)
  const body = document.createElement('div');
  body.className = 'modal-body';

  const ratingSeedValue = 3.0;
  const ratingSeedCount = 1;
  const ratingSeedSummary = `${getLpmRatingFaceEmoji(ratingSeedValue)} ${ratingSeedValue.toFixed(1)} (${formatLpmRatingCount(ratingSeedCount)})`;

  const heroSrc = (() => {    const pickFirstSrc = (arr) => {
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

      <details class="lpm-chip lpm-status-chip">
        <summary class="modal-menu-item lpm-chip-face">
          <span class="lpm-chip-face-label">${translatedOrFallback('lpm.status.label', 'Business status')}</span>
          <span class="lpm-chip-face-icons" id="lpm-status-face-icons" aria-hidden="true">⏳</span>
          <span class="lpm-chip-face-chevron" aria-hidden="true"></span>
        </summary>
        <div class="lpm-chip-body" id="lpm-status-body">
          <div class="lpm-status-item">
            <div class="lpm-status-item-title">${translatedOrFallback('lpm.status.loading', '⏳ Loading status…')}</div>
          </div>
        </div>
      </details>

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

      <details class="lpm-chip lpm-introduction-chip">
        <summary class="modal-menu-item lpm-chip-face">
          <span class="lpm-chip-face-label">${translatedOrFallback('lpm.introduction.label', 'Introduction')}</span>
          <span class="lpm-chip-face-icons" aria-hidden="true"></span>
          <span class="lpm-chip-face-chevron" aria-hidden="true"></span>
        </summary>
        <div class="lpm-chip-body">
          <div class="description" id="lpm-introduction-text" data-lines="5" data-i18n-key="${usePlaceholder ? descKey : ''}">
            ${descHTML}
          </div>
        </div>
      </details>
    </div>
  `;

  const inner = body.querySelector('.modal-body-inner');
  if (inner) {
    const rate = document.createElement('details');
    rate.className = 'lpm-chip lpm-rating-chip';
    rate.id = 'lpm-rate-section';

    rate.innerHTML = `
      <summary class="modal-menu-item lpm-chip-face">
        <span class="lpm-chip-face-label">${translatedOrFallback('lpm.rating.rateThisProfile', 'Rate this profile')}</span>
        <span class="lpm-chip-face-icons" id="lpm-rating-face-icons" aria-hidden="true">${ratingSeedSummary}</span>
        <span class="lpm-chip-face-chevron" aria-hidden="true"></span>
      </summary>
      <div class="lpm-chip-body">
        <div id="lpm-rate-group" class="rate-row" role="radiogroup" aria-label="${translatedOrFallback('lpm.rating.ariaGroup', 'Rate')}">
          <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="1 of 5">😕</button>
          <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="2 of 5">😐</button>
          <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="3 of 5">🙂</button>
          <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="4 of 5">😄</button>
          <button class="rate-btn" type="button" role="radio" aria-checked="false" aria-label="5 of 5">🤩</button>
        </div>
      </div>
    `;

    const statusChip = inner.querySelector('.lpm-status-chip');
    const introChip = inner.querySelector('.lpm-introduction-chip');
    const tagsSection = inner.querySelector('.location-tags');

    if (statusChip) inner.insertBefore(rate, statusChip);
    else inner.appendChild(rate);

    if (tagsSection && introChip) inner.insertBefore(tagsSection, introChip.nextSibling);    
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
  wireExclusiveDetails(modal, '.lpm-chip');

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
      // Prefer slug for readability, but fall back to ULID when slug is missing (e.g. SYB opens).
      const idOrSlug =
        String(data?.locationID || '').trim() ||
        String(data?.id || '').trim();

      if (!idOrSlug) return;

      const u = new URL('/api/status', location.origin);
      u.searchParams.set('locationID', idOrSlug);

      // Status chip now renders the shared status vocabulary used in Select your business.
      renderLpmStatusChip(modal, null);

      // First: apply deterministic redirect hint if present (prevents sticky wrong paint after checkout return).
      // This is NOT authoritative; it only avoids a one-shot stale /api/status result.
      // Note: LPM does NOT reveal campaign end here; discovery is via the 🎁 CTA.
      try {
        const q = new URLSearchParams(location.search);
        const hinted = (String(q.get('ce') || '') === '1');

        if (hinted) {
          renderLpmStatusChip(modal, { ownedNow: true });
        }
      } catch {}

      // Second: authoritative fetch from /api/status (may overwrite the hint).
      const r = await fetch(u.toString(), { cache: 'no-store', credentials: 'include' });
      if (!r.ok) return;

      const j = await r.json().catch(() => null);
      renderLpmStatusChip(modal, j || null);
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

  // Stripe return hardening: ensure footer wiring exists (⋮ popover) on redirect-opened LPM.
  // Normal opens are already stable; this is only to correct the redirect boot path.
  try {
    if (new URLSearchParams(location.search).get('flow') === 'campaign') {
      const m = document.getElementById('location-profile-modal');
      if (m && m.dataset && m.dataset.lpmRewiredAfterCheckout !== '1') {
        m.dataset.lpmRewiredAfterCheckout = '1';
        // Rewire handlers idempotently for this instance.
        wireLocationProfileModal(m, data, data?.originEl);
      }
    }
  } catch {}    
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

    // ℹ️ → Business card modal (shared modal shell; data-only body)
    {
      const btn = modal.querySelector('#som-info');
      if (btn) {
        const openQrCardModal = (qrPayload, rawId) => {
          const qrId = 'qr-modal';
          document.getElementById(qrId)?.remove();

          const qrModal = injectModal({
            id: qrId,
            title: 'QR code',
            layout: 'menu',
            bodyHTML: '',
            footerButtons: [
              {
                id: 'qr-share',
                label: '📤 <span class="cta-label">Share</span>',
                className: 'modal-footer-button'
              },
              {
                id: 'qr-print',
                label: '🖨️ <span class="cta-label">Print</span>',
                className: 'modal-footer-button'
              }
            ]
          });

          const qrInner = qrModal.querySelector('.modal-body-inner');
          const qrFooter = qrModal.querySelector('.modal-footer');
          if (!(qrInner instanceof HTMLElement)) return;
          qrFooter?.classList.add('cta-compact');

          const img = document.createElement('img');
          img.alt = 'QR code';
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          qrInner.appendChild(img);

          getQRCodeLib()
            .then((QRCode) => QRCode.toDataURL(qrPayload, { width: 512, margin: 1 }))
            .then((dataUrl) => {
              img.src = dataUrl;
            })
            .catch((err) => {
              console.warn('QR generation failed', err); // generator-only error; no external fallback
              img.alt = 'QR unavailable';
            });

          qrModal.querySelector('#qr-share')?.addEventListener('click', async () => {
            const target = qrPayload || (rawId ? `${location.origin}/?lp=${encodeURIComponent(rawId)}` : '');

            // count Share for this location (slug or ULID; Worker resolves via canonicalId)
            if (rawId) {
              try {
                await fetch(
                  `${TRACK_BASE}/hit/share/${encodeURIComponent(rawId)}`,
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
          });

          qrModal.querySelector('#qr-print')?.addEventListener('click', () => {
            // count QR → Print; mirror qr-view/share (resolve slug → ULID before sending)
            (async () => {
              try {
                if (rawId) {
                  const __uid = await resolveULIDFor(rawId);
                  if (__uid) {
                    await fetch(`${TRACK_BASE}/hit/qr-print/${encodeURIComponent(__uid)}`, { method: 'POST', keepalive: true });
                  }
                }
              } catch {}
            })();

            const src = img.src;
            const layer = document.createElement('div');
            layer.id = 'qr-print-layer';
            Object.assign(layer.style, {
              position: 'fixed',
              inset: '0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '999999'
            });

            const style = document.createElement('style');
            style.id = 'qr-print-style';
            style.textContent = `
              @media print{
                body > *:not(#qr-print-layer){ display:none !important; }
                #qr-print-layer{ position:static !important; inset:auto !important; }
              }`;

            const pimg = document.createElement('img');
            pimg.alt = 'QR business card';
            pimg.src = src;
            pimg.style.maxWidth = '90vw';
            pimg.style.maxHeight = '90vh';

            layer.appendChild(pimg);

            const cleanup = () => {
              document.getElementById('qr-print-style')?.remove();
              document.getElementById('qr-print-layer')?.remove();
            };
            const go = () => {
              try {
                window.print();
              } finally {
                setTimeout(cleanup, 300);
              }
            };

            document.head.appendChild(style);
            document.body.appendChild(layer);

            if (pimg.complete) go();
            else {
              pimg.addEventListener('load', go, { once: true });
              pimg.addEventListener('error', cleanup, { once: true });
            }
          });

          setupTapOutClose(qrId);
          showModal(qrId);

          (async () => {
            try {
              const __uid = await resolveULIDFor(rawId);
              if (__uid) {
                await fetch(`${TRACK_BASE}/hit/qr-view/${encodeURIComponent(__uid)}`, { method: 'POST', keepalive: true });
              }
            } catch {}
          })();
        };

        btn.addEventListener('click', (e) => {
          e.preventDefault();

          const infoId = 'bizcard-modal';
          document.getElementById(infoId)?.remove();

          const infoModal = injectModal({
            id: infoId,
            title: 'Business card',
            layout: 'menu',
            bodyHTML: '',
            footerButtons: [
              {
                id: 'bizcard-share',
                label: '📤 <span class="cta-label">Share</span>',
                className: 'modal-footer-button'
              }
            ]
          });

          const infoInner = infoModal.querySelector('.modal-body-inner');
          const infoFooter = infoModal.querySelector('.modal-footer');
          if (!(infoInner instanceof HTMLElement)) return;
          infoFooter?.classList.add('cta-compact');

          const displayName = String(data?.displayName ?? data?.name ?? '').trim();
          const contactPerson = String(data?.contactInformation?.contactPerson || '').trim(); // contact person only
          const phone = String(data?.contactInformation?.phone || '').trim();
          const email = String(data?.contactInformation?.email || '').trim();

          const values = [contactPerson, phone, email].filter(Boolean);
          values.forEach((value) => {
            const p = document.createElement('p');
            p.textContent = value;
            infoInner.appendChild(p);
          });
          if (!values.length) {
            const p = document.createElement('p');
            p.textContent = '';
            infoInner.appendChild(p); // no labels
          }

          const qrRow = document.createElement('div');
          qrRow.className = 'modal-menu-list';
          qrRow.innerHTML = `
            <button type="button" class="modal-menu-item" id="som-info-qr">
              <span class="icon-img">🔳</span><span class="label">QR code</span>
            </button>
          `;
          infoInner.appendChild(qrRow);

          qrRow.querySelector('#som-info-qr')?.addEventListener('click', (ev) => {
            ev.preventDefault();

            const rawId = String(
              data?.locationID ||
              data?.id ||
              document.getElementById('location-profile-modal')?.getAttribute('data-locationid') ||
              ''
            ).trim();

            if (!rawId) { showToast('Missing id', 1600); return; }

            // use profiles.json qrUrl when present; otherwise fall back to ?lp=<id>
            const qrUrl = (typeof data?.qrUrl === 'string') ? data.qrUrl.trim() : '';
            const qrPayload = qrUrl || `${location.origin}/?lp=${encodeURIComponent(rawId)}`;

            hideModal(infoId);
            openQrCardModal(qrPayload, rawId);
          });

          infoModal.querySelector('#bizcard-share')?.addEventListener('click', async () => {
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
              const text = [displayName, contactPerson, phone, email].filter(Boolean).join('\n');
              if (navigator.share && text) {
                await navigator.share({ title: 'Business card', text });
              } else if (text && navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                showToast('Copied to clipboard', 1600);
              }
            } catch {}
          });

          setupTapOutClose(infoId);
          showModal(infoId);
        }, { passive: false });
      }
    }

    // count LPM open — allow slug or ULID; resolve slug → ULID before sending (avoids 400) 
    
    // count LPM open — allow slug or ULID; resolve slug → ULID before sending (avoids 400)
    ;(async () => {
      const idOrSlug = String(data?.id || data?.locationID || '').trim();
      if (!idOrSlug) return;

      const src = String(
        data?.openSource ||
        (originEl && originEl.classList && originEl.classList.contains('popular-button')
          ? 'popular'
          : (originEl ? 'accordion' : 'redirect'))
      ).trim() || 'unknown';

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
        // Tracking suppressed only; do not abort LPM wiring.
      }

    // Delegated client beacons removed — server counts via /out/* and /hit/*

    // ⭐ Save → toggle + update icon (⭐ → ✩ when saved)
    // helper placed before first use: avoids ReferenceError in some engines
    function initSaveButtons(primaryBtn, secondaryBtn){
      const id = String(data?.id || data?.locationID || '');
      const name = String(data?.displayName ?? data?.name ?? data?.locationName?.en ?? data?.locationName ?? '').trim() || t('common.unnamed');      
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
    // Phase 4: intercept before navigation; choose restore/claim/open-dash by /api/stats status.
    const statsBtn = modal.querySelector('#som-stats');
    if (statsBtn) {
      statsBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (statsBtn.dataset.busy === '1') return;
        statsBtn.dataset.busy = '1';

        try {
          const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

          const cachedLocationId  = String(modal.getAttribute('data-locationid') || '').trim();
          const payloadLocationId = String(data?.locationID || '').trim();
          const rawULID           = String(data?.id || '').trim();

          const target = (payloadLocationId || cachedLocationId || rawULID).trim();
          if (!target) { showToast('Dashboard unavailable for this profile', 1600); return; }

          modal.setAttribute('data-locationid', target);

          // Minimal 1-day window (never exposes analytics when blocked)
          const ymd = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
          const statsUrl = new URL('/api/stats', location.origin);
          statsUrl.searchParams.set('locationID', target);
          statsUrl.searchParams.set('from', ymd);
          statsUrl.searchParams.set('to', ymd);

          // Use the single authoritative resolver (same as BO→SYB path)
          await openOwnerSettingsForLocation(
            target,
            String(data?.displayName ?? data?.name ?? '').trim()
          );
          return;
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
     
    // NaviGen rating is server-authoritative so the average/count stay consistent across browsers and devices.
    (function initRating(){
      const group = modal.querySelector('#lpm-rate-group');
      if (!group) return;

      const btns = Array.from(group.querySelectorAll('.rate-btn'));
      const face = modal.querySelector('#lpm-rating-face-icons');
      const target = String(data?.locationID || data?.id || '').trim();

      const state = {
        avg: 3,
        count: 0,
        userScore: 0,
        lockedUntil: ''
      };

      const applyPayload = (payload = {}) => {
        const avgRaw = Number(payload?.ratingAvg ?? payload?.rating_avg ?? 0);
        const countRaw = Number(payload?.ratedSum ?? payload?.rated_sum ?? 0);
        const userScoreRaw = Number(payload?.userScore ?? payload?.user_score ?? 0);

        state.avg = (Number.isFinite(avgRaw) && avgRaw > 0) ? avgRaw : 3;
        state.count = (Number.isFinite(countRaw) && countRaw > 0) ? countRaw : 0;
        state.userScore = (Number.isFinite(userScoreRaw) && userScoreRaw >= 1 && userScoreRaw <= 5) ? userScoreRaw : 0;
        state.lockedUntil = String(payload?.ratingLockedUntil ?? payload?.rating_locked_until ?? '').trim();
      };

      const render = () => {
        const displayCount = state.count > 0 ? state.count : 1;
        const displayAvg = state.count > 0 ? state.avg : 3;

        btns.forEach((b, i) => {
          b.setAttribute('aria-checked', String(i + 1 === state.userScore));
        });

        if (face) {
          face.textContent = `${getLpmRatingFaceEmoji(displayAvg)} ${displayAvg.toFixed(1)} (${formatLpmRatingCount(displayCount)})`;
        }
      };

      const hydrate = async () => {
        if (!target) {
          render();
          return;
        }

        try {
          const url = new URL('/api/status', location.origin);
          url.searchParams.set('locationID', target);

          const res = await fetch(url.toString(), {
            cache: 'no-store',
            credentials: 'include'
          });

          if (!res.ok) {
            render();
            return;
          }

          const payload = await res.json().catch(() => null);
          if (payload && typeof payload === 'object') {
            applyPayload(payload);
          }
        } catch {
          // rating hydration must not block the LPM
        }

        render();
      };

      const commit = async (n) => {
        if (!target || !Number.isFinite(n) || n < 1 || n > 5) return;

        try {
          const url = new URL(`/hit/rating/${encodeURIComponent(target)}`, location.origin);
          url.searchParams.set('score', String(n));

          const res = await fetch(url.toString(), {
            method: 'POST',
            keepalive: true,
            cache: 'no-store',
            credentials: 'include'
          });

          const payload = await res.json().catch(() => null);

          if (!res.ok) {
            showToast('Rating unavailable right now', 1600);
            return;
          }

          if (payload && typeof payload === 'object') {
            applyPayload(payload);
            render();

            const applied = String(payload?.applied || '').trim();
            if (applied === 'updated') {
              showToast(`Rating updated to ${n}/5`, 1600);
            } else if (applied === 'noop') {
              showToast(`Rating kept at ${n}/5`, 1600);
            } else {
              showToast(`Thanks! Rated ${n}/5`, 1600);
            }
            return;
          }

          showToast(`Thanks! Rated ${n}/5`, 1600);
          await hydrate();
        } catch {
          showToast('Rating unavailable right now', 1600);
        }
      };

      btns.forEach((b, i) => {
        b.addEventListener('click', () => {
          commit(i + 1);
        });
      });

      group.addEventListener('keydown', (e) => {
        const base = state.userScore || 3;

        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          commit(Math.min(5, base + 1));
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          commit(Math.max(1, base - 1));
        }
      });

      render();
      hydrate();
    })();

    // analytics beacon
    // removed trackCta; all beacons use _track(uid,event) // single path → Worker

    // 🔎 Enrich LPM from Data API (non-blocking; keeps UX instant)
    ;(async () => {
      try {
        // accept locationID too; skip when missing
        const id = String(data?.locationID || data?.id || '').trim(); // prefer slug; ULID may not exist in profile index
        if (!id) return;

        const hasLocalDescriptions = Object.keys(resolveDescriptionMapForLocation(data, [data?.raw ? [data.raw] : []])).length > 0;
        const needEnrich =
          !hasLocalDescriptions ||
          !data?.media?.cover ||
          !Array.isArray(data?.media?.images) ||
          data.media.images.length < 2;
        if (!needEnrich) return; // skip network when local data is complete

        const lookupIds = Array.from(new Set([
          String(data?.locationID || '').trim(),
          String(data?.alias || '').trim(),
          String(data?.slug || '').trim(),
          String(modal.getAttribute('data-locationid') || '').trim(),
          String(data?.id || '').trim()
        ].filter(Boolean)));

        let payload = null;
        for (const lookupId of lookupIds) {
          const res = await fetch(API(`/api/data/item?id=${encodeURIComponent(lookupId)}`), { cache: 'no-store', credentials: 'include' });
          if (!res.ok) continue;
          payload = await res.json().catch(() => null);
          if (payload) break;
        }

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
        if (!hasLocalDescriptions) {
          const profilesLocations = await getProfilesLocationRecords();
          const resolvedDescriptions = resolveDescriptionMapForLocation(
            {
              ...data,
              ...(payload && typeof payload === 'object' ? payload : {}),
              raw: payload || data?.raw || null
            },
            [
              data?.raw ? [data.raw] : [],
              payload ? [payload] : [],
              profilesLocations
            ]
          );

          const appLang = String(document.documentElement?.lang || navigator.language || 'en').toLowerCase().split('-')[0];
          const text = String(resolvedDescriptions[appLang] || Object.values(resolvedDescriptions)[0] || '').trim();
          const box = modal.querySelector('#lpm-introduction-text');
          if (box && text && /Description coming soon/i.test(box.textContent || box.innerHTML)) {
            box.innerHTML = formatDescriptionHtml(text);
            box.dataset.i18nKey = '';
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

  const modal = injectModal({
    id,
    title: (typeof t === 'function' && t('root.bo.selectLocation.title')) || 'Select your business',
    layout: 'menu',
    bodyHTML: ''
  });

  const topBar = modal.querySelector('.modal-top-bar');
  const inner = modal.querySelector('.modal-body-inner');
  if (!topBar || !inner) return;

  const rootSearch =
    document.getElementById('search') ||
    document.querySelector('input#search') ||
    document.querySelector('input[type="search"]');

  const input = rootSearch ? rootSearch.cloneNode(true) : document.createElement('input');
  const searchInput = input instanceof HTMLInputElement ? input : document.createElement('input');
  searchInput.type = 'search';
  searchInput.id = 'select-location-search';
  searchInput.spellcheck = false;
  searchInput.autocapitalize = 'off';
  searchInput.autocomplete = 'off';
  searchInput.value = '';

  const placeholder = ((typeof t === 'function' && t('root.bo.selectLocation.placeholder')) || 'Search here…').trim();
  searchInput.placeholder = placeholder.startsWith('🔍') ? placeholder : `🔍 ${placeholder}`;

  const searchRow = document.createElement('div');
  searchRow.className = 'select-location-search-row';

  const searchLeft = document.createElement('div');
  searchLeft.className = 'select-location-search-left';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-x';
  clearBtn.id = 'select-location-clear-search';
  clearBtn.textContent = 'x';
  clearBtn.style.display = 'none';
  clearBtn.setAttribute('aria-label', (typeof t === 'function' && t('common.search.clear')) || 'Clear search');

  const syncClear = () => {
    const hasValue = !!String(searchInput.value || '').trim();
    clearBtn.style.display = hasValue ? 'inline-flex' : 'none';
  };

  searchInput.addEventListener('input', syncClear);
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.focus();
    syncClear();
  });

  searchLeft.appendChild(searchInput);
  searchLeft.appendChild(clearBtn);
  searchRow.appendChild(searchLeft);
  topBar.appendChild(searchRow);

  const hintRow = document.createElement('div');
  hintRow.id = 'select-location-search-hint';
  hintRow.className = 'syb-inline-copy';
  inner.appendChild(hintRow);

  const entryStack = document.createElement('div');
  entryStack.className = 'syb-entry-stack';

  const createBtn = document.createElement('button');
  createBtn.type = 'button';
  createBtn.className = 'modal-menu-item modal-callout-card syb-entry-card';
  createBtn.innerHTML = `
    <span class="icon-img">➕</span>
    <span class="label">
      <strong>${(typeof t === 'function' && t('root.bo.notListed.title')) || 'Create a location'}</strong><br>
      <small>${(typeof t === 'function' && t('root.bo.notListed.desc')) || 'Add your business.'}</small>
    </span>
  `;
  createBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(id);
    showRequestListingModal({ returnTo: 'syb' });
  });

  const googleBtn = document.createElement('button');
  googleBtn.type = 'button';
  googleBtn.className = 'modal-menu-item modal-callout-card syb-entry-card';
  googleBtn.innerHTML = `
    <span class="icon-img">🌐</span>
    <span class="label">
      <strong>${(typeof t === 'function' && t('root.bo.googleImport.title')) || 'Import from Google'}</strong><br>
      <small>${(typeof t === 'function' && t('root.bo.googleImport.desc')) || 'Bring in your business details.'}</small>
    </span>
  `;
  googleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(id);
    showImportGoogleLocationModal({ returnTo: 'syb' });
  });

  const recentBtn = document.createElement('button');
  recentBtn.type = 'button';
  recentBtn.id = 'select-location-recent-trigger';
  recentBtn.className = 'modal-menu-item modal-callout-card syb-entry-card';
  recentBtn.innerHTML = `
    <span class="icon-img">📍</span>
    <span class="label">
      <strong>${(typeof t === 'function' && t('root.bo.recent.title')) || 'Recently used'}</strong><br>
      <small>${(typeof t === 'function' && t('root.bo.recent.desc')) || 'View and manage your places.'}</small>
    </span>
  `;

  entryStack.appendChild(createBtn);
  entryStack.appendChild(googleBtn);
  entryStack.appendChild(recentBtn);
  inner.appendChild(entryStack);

  const recentWrap = document.createElement('div');
  recentWrap.id = 'select-location-recent-wrap';
  recentWrap.className = 'hidden';

  const recentTitle = document.createElement('div');
  recentTitle.className = 'syb-section-title';
  recentTitle.textContent = (typeof t === 'function' && t('root.bo.recent.listTitle')) || 'Recently used';

  const recentList = document.createElement('div');
  recentList.id = 'select-location-recent-list';
  recentList.className = 'modal-menu-list';

  recentWrap.appendChild(recentTitle);
  recentWrap.appendChild(recentList);
  inner.appendChild(recentWrap);

  const loadingRow = document.createElement('div');
  loadingRow.id = 'select-location-loading';
  loadingRow.className = 'modal-menu-item owner-center-loading hidden';
  loadingRow.setAttribute('aria-disabled', 'true');
  loadingRow.style.pointerEvents = 'none';
  loadingRow.innerHTML = `
    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
      <strong>${(typeof t === 'function' && t('root.bo.selectLocation.search.loading.title')) || 'Searching businesses...'}</strong><br>
      <small>${(typeof t === 'function' && t('root.bo.selectLocation.search.loading.desc')) || 'Looking for matching businesses.'}</small>
    </span>
  `;
  inner.appendChild(loadingRow);

  const resultsWrap = document.createElement('div');
  resultsWrap.id = 'select-location-results-wrap';
  resultsWrap.className = 'hidden';

  const resultsTitle = document.createElement('div');
  resultsTitle.className = 'syb-section-title';
  resultsTitle.textContent = (typeof t === 'function' && t('root.bo.selectLocation.results.title')) || 'Matching businesses';

  const list = document.createElement('div');
  list.id = 'select-location-results';
  list.className = 'modal-menu-list';

  resultsWrap.appendChild(resultsTitle);
  resultsWrap.appendChild(list);
  inner.appendChild(resultsWrap);

  if (!modal.querySelector('.modal-footer')) {
    const footer = document.createElement('div');
    footer.className = 'modal-footer modal-footer-cover';
    footer.setAttribute('aria-hidden', 'true');
    modal.querySelector('.modal-content')?.appendChild(footer);
  }

  setupTapOutClose(id);
}

function createLocationDraftPublishSetupModal(draftMeta = {}, opts = {}) {
  const id = 'location-draft-publish-setup-modal';
  document.getElementById(id)?.remove();

  const shouldReturnToSelectLocation = String(opts?.returnTo || '').trim() === 'syb';
  const draftULID = String(draftMeta?.draftULID || '').trim();

  const closePublishSetup = (ev = null) => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    hideModal(id);
    if (shouldReturnToSelectLocation) showSelectLocationModal();
  };

  const modal = injectModal({
    id,
    title: (typeof t === 'function' && t('locationDraft.publishSetup.title')) || 'Profile draft saved',
    layout: 'menu',
    onClose: (ev) => { closePublishSetup(ev); },
    bodyHTML: `
      <div class="modal-form-stack">
        <div class="modal-menu-item modal-static-card syb-empty-row" aria-disabled="true">
          <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
            <strong>${(typeof t === 'function' && t('locationDraft.publishSetup.savedTitle')) || 'Your profile draft is private and saved.'}</strong><br>
            <small>${(typeof t === 'function' && t('locationDraft.publishSetup.savedDesc')) || 'The next step is publish and requires payment.'}</small>
          </span>
        </div>

        <div style="text-align:left; line-height:1.35; margin-top:2px;">
          <strong>${(typeof t === 'function' && t('locationDraft.publishSetup.publishTitle')) || 'Continue when you are ready to publish'}</strong><br>
          <small>${(typeof t === 'function' && t('locationDraft.publishSetup.publishDesc')) || 'The paid step sets up publish entitlement. Promotion remains optional after that.'}</small>
        </div>

        <div class="modal-actions">
          <button id="location-draft-publish-continue" type="button" class="modal-body-button">
            ${(typeof t === 'function' && t('locationDraft.publishSetup.continue')) || 'Continue to publish'}
          </button>

          <button id="location-draft-publish-later" type="button" class="modal-body-button">
            ${(typeof t === 'function' && t('locationDraft.publishSetup.later')) || 'Resume later'}
          </button>
        </div>
      </div>
    `
  });

  modal.querySelector('#location-draft-publish-later')?.addEventListener('click', (ev) => {
    closePublishSetup(ev);
  });

  modal.querySelector('#location-draft-publish-continue')?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    hideModal(id);

    if (!draftULID) {
      showToast((typeof t === 'function' && t('root.bo.googleImport.error')) || 'Could not save profile draft.', 2400);
      if (shouldReturnToSelectLocation) showSelectLocationModal();
      return;
    }

    await showCampaignManagementModal(draftULID, {
      guest: true,
      p8Draft: draftMeta,
      preferEmptyDraft: true
    });
  });

  setupTapOutClose(id, closePublishSetup);
}

function showLocationDraftPublishSetupModal(draftMeta = {}, opts = {}) {
  const id = 'location-draft-publish-setup-modal';
  document.getElementById(id)?.remove();
  createLocationDraftPublishSetupModal(draftMeta, opts);
  showModal(id);
}

function createImportGoogleLocationModal(opts = {}) {
  const id = 'import-google-location-modal';
  document.getElementById(id)?.remove();

  const shouldReturnToSelectLocation = String(opts?.returnTo || '').trim() === 'syb';
  const closeImportGoogle = (ev = null) => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    hideModal(id);
    if (shouldReturnToSelectLocation) showSelectLocationModal();
  };

  const modal = injectModal({
    id,
    title: (typeof t === 'function' && t('root.bo.googleImport.title')) || 'Import from Google',
    layout: 'menu',
    onClose: (ev) => { closeImportGoogle(ev); },
    bodyHTML: `
      <div class="modal-form-stack">
        <div class="modal-menu-item modal-static-card syb-empty-row" aria-disabled="true">
          <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
            <strong>${(typeof t === 'function' && t('root.bo.googleImport.title')) || 'Import from Google'}</strong><br>
            <small>${(typeof t === 'function' && t('root.bo.googleImport.desc')) || 'Bring in your business details.'}</small>
          </span>
        </div>

        <div class="modal-field">
          <label for="google-import-place-id">${(typeof t === 'function' && t('root.bo.googleImport.field.label')) || 'Paste Google place_id'}</label>
          <input id="google-import-place-id" class="input" type="text" maxlength="256" placeholder="${(typeof t === 'function' && t('root.bo.googleImport.field.placeholder')) || 'Paste Google place_id'}" />
        </div>

        <div class="modal-actions">
          <button id="google-import-submit" type="button" class="modal-body-button">
            ${(typeof t === 'function' && t('root.bo.googleImport.submitDraft')) || 'Save profile draft'}
          </button>

          <button id="google-import-cancel" type="button" class="modal-body-button">
            ${(typeof t === 'function' && t('common.cancel')) || 'Cancel'}
          </button>
        </div>
      </div>
    `
  });

  const placeIdInput = modal.querySelector('#google-import-place-id');
  const submitBtn = modal.querySelector('#google-import-submit');

  modal.querySelector('#google-import-cancel')?.addEventListener('click', (ev) => {
    closeImportGoogle(ev);
  });

  submitBtn?.addEventListener('click', async () => {
    const googlePlaceId = String(placeIdInput?.value || '').trim();
    setInputErrorState(placeIdInput, !googlePlaceId);

    if (!googlePlaceId) {
      showToast((typeof t === 'function' && t('root.bo.googleImport.error')) || 'Could not save profile draft.', 2200);
      return;
    }

    if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = true;

    let res = null;
    let payload = null;
    try {
      res = await fetch('/api/location/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          googlePlaceId,
          draft: {}
        }),
        cache: 'no-store',
        credentials: 'include'
      });
      payload = await res.json().catch(() => null);
    } catch {
      res = null;
      payload = null;
    }

    if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = false;

    if (!res?.ok) {
      const msg = String(payload?.error?.message || '').trim();
      showToast(msg || ((typeof t === 'function' && t('root.bo.googleImport.error')) || 'Could not save profile draft.'), 2400);
      return;
    }

    const draftULID = String(payload?.draftULID || '').trim();
    const draftSessionId = String(payload?.draftSessionId || '').trim();
    if (!draftULID || !draftSessionId) {
      showToast((typeof t === 'function' && t('root.bo.googleImport.error')) || 'Could not save profile draft.', 2400);
      return;
    }

    const savedDraft = {
      draftULID,
      draftSessionId,
      mode: 'google',
      googlePlaceId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    savePendingLocationDraft(savedDraft);
    hideModal(id);
    showLocationDraftPublishSetupModal(savedDraft, { returnTo: opts?.returnTo });
  });

  setupTapOutClose(id, closeImportGoogle);
}

export function showImportGoogleLocationModal(opts = {}) {
  const id = 'import-google-location-modal';
  document.getElementById(id)?.remove();
  createImportGoogleLocationModal(opts);
  showModal(id);
}

export async function showSelectLocationModal() {
  const id = 'select-location-modal';
  document.getElementById(id)?.remove();
  createSelectLocationModal();
  showModal(id);

  const modal = document.getElementById(id);
  const input = modal?.querySelector('#select-location-search');
  const list = modal?.querySelector('#select-location-results');
  const listWrap = modal?.querySelector('#select-location-results-wrap');
  const loadingRow = modal?.querySelector('#select-location-loading');
  const hintRow = modal?.querySelector('#select-location-search-hint');
  const recentBtn = modal?.querySelector('#select-location-recent-trigger');
  const recentWrap = modal?.querySelector('#select-location-recent-wrap');
  const recentList = modal?.querySelector('#select-location-recent-list');

  if (!modal || !(input instanceof HTMLInputElement) || !list || !listWrap || !loadingRow || !hintRow || !recentBtn || !recentWrap || !recentList) return null;

  modal.dataset.pick = '';

  const MIN_QUERY_LEN = 3;
  const SEARCH_LIMIT = 5;
  let searchSeq = 0;
  let searchTimer = 0;
  let recentLoaded = false;
  let recentLoading = false;

  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_.\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const compactQueryLen = (q) => norm(q).replace(/\s+/g, '').length;

  const getName = (item) => {
    const raw = item?.locationName;
    if (typeof raw === 'string') return String(raw || '').trim();
    if (raw && typeof raw === 'object') {
      return String(raw.en || Object.values(raw)[0] || '').trim();
    }
    return String(item?.displayName || item?.name || item?.locationID || '').trim();
  };

  const setHint = (title, desc = '') => {
    hintRow.classList.remove('hidden');
    hintRow.innerHTML = `
      <strong>${title}</strong>
      ${desc ? `<small>${desc}</small>` : ''}
    `;
  };

  const applyStatusDecor = (row, status) => {
    const dot = row.querySelector('.syb-status-dot');
    const gift = row.querySelector('.syb-gift');
    if (!dot || !gift) return;

    const owned = status?.ownedNow === true;
    const vis = String(status?.visibilityState || '').trim();
    const courtesyUntil = String(status?.courtesyUntil || '').trim();
    const entitled = status?.campaignEntitled === true;

    dot.classList.toggle('syb-taken', owned);
    dot.classList.toggle('syb-parked', !owned && vis === 'hidden');
    dot.classList.toggle('syb-held', !owned && !!courtesyUntil);
    dot.classList.toggle('syb-free', !owned && vis !== 'hidden' && !courtesyUntil);

    gift.classList.toggle('syb-gift-on', entitled);
    gift.style.display = entitled ? '' : 'none';
  };

  const buildPickPayload = (item) => {
    const media = (item && typeof item.media === 'object') ? item.media : {};
    const images = Array.isArray(item?.images)
      ? item.images
      : (Array.isArray(media?.images) ? media.images : []);
    const cover = String(media?.cover || item?.imageSrc || '').trim();

    return {
      locationID: String(item?.locationID || '').trim(),
      slug: String(item?.locationID || '').trim(),
      id: String(item?.ID || item?.id || item?.locationUID || '').trim() || String(item?.locationID || '').trim(),
      displayName: getName(item),
      name: getName(item),
      imageSrc: cover,
      media: {
        ...(media || {}),
        cover: cover || String(media?.cover || '').trim()
      },
      images,
      tags: Array.isArray(item?.tags) ? item.tags : [],
      descriptions: (item && typeof item.descriptions === 'object') ? item.descriptions : {},
      contactInformation: (item && typeof item.contactInformation === 'object') ? item.contactInformation : {},
      links: (item && typeof item.links === 'object') ? item.links : {},
      raw: item || null
    };
  };

  const makeRow = (item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modal-menu-item syb-card';

    const displayName = getName(item);
    const line2 = String(item?.sybAddressLine || '').trim() || String(item?.locationID || '').trim();

    btn.innerHTML = `
      <span class="icon-img">📍</span>
      <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
        <strong>${displayName}</strong><br><small>${line2}</small>
      </span>
      <span class="syb-status-dot" aria-hidden="true"></span>
      <span class="syb-gift" aria-hidden="true">🎁</span>
    `;

    applyStatusDecor(btn, item?.sybStatus || {});

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.dataset.pick = '';
      modal.dataset.pick = JSON.stringify(buildPickPayload(item));
      hideModal(id);
    });

    return btn;
  };

  const renderRows = (targetList, items, emptyTitle, emptyDesc) => {
    targetList.innerHTML = '';

    if (!Array.isArray(items) || !items.length) {
      const empty = document.createElement('div');
      empty.className = 'modal-menu-item modal-static-card syb-empty-row';
      empty.innerHTML = `
        <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
          <strong>${emptyTitle}</strong>${emptyDesc ? `<br><small>${emptyDesc}</small>` : ''}
        </span>
      `;
      targetList.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      targetList.appendChild(makeRow(item));
    });
  };

  const resetSearchUi = () => {
    searchSeq += 1;
    loadingRow.classList.add('hidden');
    listWrap.classList.add('hidden');
    list.innerHTML = '';

    if (String(input.value || '').trim()) {
      setHint(
        (typeof t === 'function' && t('root.bo.selectLocation.search.waiting.title')) || 'Keep typing',
        (typeof t === 'function' && t('root.bo.selectLocation.search.waiting.desc')) || 'Search starts after 3 characters.'
      );
    } else {
      setHint(
        (typeof t === 'function' && t('root.bo.selectLocation.search.idle.title')) || 'Start with search or choose a route',
        (typeof t === 'function' && t('root.bo.selectLocation.search.idle.desc')) || 'Type at least 3 characters to search existing businesses.'
      );
    }
  };

  const runSearch = async (rawQuery) => {
    const query = String(rawQuery || '').trim();
    const queryLen = compactQueryLen(query);

    if (queryLen < MIN_QUERY_LEN) {
      resetSearchUi();
      return;
    }

    const seq = ++searchSeq;
    recentWrap.classList.add('hidden');
    hintRow.classList.add('hidden');
    loadingRow.classList.remove('hidden');
    listWrap.classList.add('hidden');
    list.innerHTML = '';

    let items = [];
    try {
      const res = await fetch(`/api/owner/location-options?q=${encodeURIComponent(query)}&limit=${SEARCH_LIMIT}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const j = res.ok ? await res.json().catch(() => null) : null;
      items = Array.isArray(j?.items) ? j.items : [];
    } catch {
      items = [];
    }

    if (seq !== searchSeq || !document.getElementById(id)) return;

    loadingRow.classList.add('hidden');

    if (items.length) {
      renderRows(
        list,
        items,
        (typeof t === 'function' && t('root.bo.selectLocation.search.none.title')) || 'No matching businesses',
        (typeof t === 'function' && t('root.bo.selectLocation.search.none.desc')) || 'Continue typing, or use Create a location / Import from Google.'
      );
      listWrap.classList.remove('hidden');
      return;
    }

    listWrap.classList.add('hidden');
    setHint(
      (typeof t === 'function' && t('root.bo.selectLocation.search.none.title')) || 'No matching businesses',
      (typeof t === 'function' && t('root.bo.selectLocation.search.none.desc')) || 'Continue typing, or use Create a location / Import from Google.'
    );
  };

  const loadRecentlyUsed = async () => {
    if (recentLoading) return;
    recentLoading = true;
    recentWrap.classList.remove('hidden');
    recentList.innerHTML = '';

    const loading = document.createElement('div');
    loading.className = 'modal-menu-item modal-static-card owner-center-loading syb-empty-row';
    loading.innerHTML = `
      <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
        <strong>${(typeof t === 'function' && t('root.bo.recent.loading.title')) || 'Loading recently used...'}</strong><br>
        <small>${(typeof t === 'function' && t('root.bo.recent.loading.desc')) || 'Getting places saved on this device.'}</small>
      </span>
    `;
    recentList.appendChild(loading);

    let rows = [];
    try {
      const res = await fetch('/api/owner/sessions', {
        cache: 'no-store',
        credentials: 'include'
      });
      const j = res.ok ? await res.json().catch(() => null) : null;
      rows = Array.isArray(j?.rows) ? j.rows : [];
    } catch {
      rows = [];
    }

    recentList.innerHTML = '';
    renderRows(
      recentList,
      rows.slice(0, 5),
      (typeof t === 'function' && t('root.bo.recent.empty.title')) || 'No saved places yet',
      (typeof t === 'function' && t('root.bo.recent.empty.desc')) || 'Places you manage on this device will appear here.'
    );
    recentLoaded = true;
    recentLoading = false;
  };

  recentBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const opening = recentWrap.classList.contains('hidden');
    recentWrap.classList.toggle('hidden', !opening);
    listWrap.classList.add('hidden');
    loadingRow.classList.add('hidden');

    if (opening) {
      hintRow.classList.add('hidden');
      if (!recentLoaded) await loadRecentlyUsed();
    } else {
      resetSearchUi();
    }
  });

  input.addEventListener('input', () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      runSearch(input.value);
    }, 280);
  });

  resetSearchUi();
  requestAnimationFrame(() => input.focus());

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
  const locLabel = String((loc?.locationName?.en ?? loc?.locationName ?? ((typeof t === 'function' && t('common.unnamed')) || 'Unnamed'))).trim(); // location display label  
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
    if (btn.dataset.busy === '1') return;

    markBusyLocal(btn, true);
    const __t = setTimeout(() => markBusyLocal(btn, false), 8000);

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
        ratings: (loc && typeof loc.ratings === 'object') ? loc.ratings : {},        
        raw: loc,
        openSource: 'popular',
        openSource: 'accordion',
        originEl: btn        
      });
    }
    clearTimeout(__t);
    markBusyLocal(btn, false);    
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

// ————————————————————————————
// Phase 4 — Owner Settings modals (LPM 📈 gating UX)
// - No analytics are fetched or displayed inside these modals.
// - All copy is t(key)-driven with safe English fallbacks.
// ————————————————————————————

function _ownerText(key, fallback) {
  const hasT = (typeof t === 'function');
  const raw = hasT ? (t(key) || '') : '';
  return (raw && typeof raw === 'string' && !/^\[[^\]]+\]$/.test(raw)) ? raw : String(fallback || key);
}

async function openOwnerSettingsForTarget({ target, locationName, noSelection }) {
  const tgt = String(target || '').trim();
  if (!tgt) { showToast('Missing location', 1600); return; }

  let activeUlid = '';
  let hasSess = false;
  try {
    const rr = await fetch('/api/_diag/opsess', { cache: 'no-store', credentials: 'include' });
    const jj = rr.ok ? await rr.json().catch(() => null) : null;
    hasSess = (jj?.hasOpSessCookie === true) && (jj?.kvHit === true);
    activeUlid = String(jj?.ulid || '').trim();
  } catch {
    hasSess = false;
    activeUlid = '';
  }

  let targetUlid = '';
  try {
    targetUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(tgt) ? tgt : await resolveULIDFor(tgt);
  } catch {
    targetUlid = '';
  }

  let ownedNow = false;
  try {
    const u = new URL('/api/status', location.origin);
    u.searchParams.set('locationID', tgt);
    const rs = await fetch(u.toString(), { cache: 'no-store', credentials: 'include' });
    const js = rs.ok ? await rs.json().catch(() => null) : null;
    ownedNow = js?.ownedNow === true;
  } catch {
    ownedNow = false;
  }

  if (hasSess && activeUlid && targetUlid && activeUlid === targetUlid) {
    showOwnerSettingsModal({
      variant: 'signedin',
      locationIdOrSlug: tgt,
      locationName: String(locationName || '').trim(),
      noSelection: noSelection === true
    });
    return;
  }

  const isMismatch = !!hasSess && !!activeUlid && !!targetUlid && activeUlid !== targetUlid;

  showOwnerSettingsModal({
    variant: isMismatch ? 'mismatch' : (ownedNow ? 'restore' : 'claim'),
    locationIdOrSlug: tgt,
    locationName: String(locationName || '').trim(),
    noSelection: noSelection === true
  });
}

export async function openOwnerSettingsForUlid(ulid) {
  return openOwnerSettingsForTarget({ target: ulid, locationName: '' });
}

export async function openOwnerSettingsForLocation(idOrSlug, locationName = '', noSelection = false) {
  return openOwnerSettingsForTarget({
    target: String(idOrSlug || '').trim(),
    locationName: String(locationName || '').trim(),
    noSelection: noSelection === true
  });
}

export function createRestoreAccessModal() {
  const id = 'owner-restore-access-modal';
  document.getElementById(id)?.remove();

  const modal = injectModal({
    id,
    title: _ownerText('owner.restore.title', 'Restore access'),
    layout: 'menu',
    bodyHTML: `
      <p style="text-align:left;margin:0 0 12px;">
        ${_ownerText(
          'owner.restore.body',
          'To add owner access on this device, use the Stripe payment ID (pi_...) for that listing.'
        )}
      </p>
      <p class="muted muted-note" style="text-align:left;margin:0 0 12px;">
        ${_ownerText(
          'owner.restore.hint',
          'You can restore more than one listing on this device, one Stripe payment ID (pi_...) at a time.'
        )}
      </p>
      <p style="text-align:left;margin:0 0 12px;">
        <strong>${
          (typeof t === 'function' && t('owner.restore.pi.label')) ||
          'Paste your Payment ID (pi_...) to restore access on this device:'
        }</strong>
      </p>
      <input
        type="text"
        id="owner-restore-pi"
        class="input"
        placeholder="pi_..."
        autocomplete="off"
        spellcheck="false"
      />
      <div class="modal-actions">
        <button type="button" class="modal-body-button" id="owner-restore-pi-submit">
          ${
            (typeof t === 'function' && t('owner.restore.pi.submit')) ||
            'Restore'
          }
        </button>
      </div>
    `
  });

  const card = modal.querySelector('.modal-content');
  const top = modal.querySelector('.modal-top-bar');
  const input = modal.querySelector('#owner-restore-pi');
  const btn = modal.querySelector('#owner-restore-pi-submit');

  if (
    !(card instanceof HTMLElement) ||
    !(top instanceof HTMLElement) ||
    !(input instanceof HTMLInputElement) ||
    !(btn instanceof HTMLButtonElement)
  ) {
    return;
  }

  // PaymentIntent restore (pi_...) — cross-device recovery without emails/links
  btn.addEventListener('click', async (e) => {
    // Swallow the interaction so it cannot fall through to underlying UI.
    try {
      e.preventDefault();
      e.stopPropagation();
      // eslint-disable-next-line no-unused-expressions
      e.stopImmediatePropagation && e.stopImmediatePropagation();
    } catch {}

    const pi = String(input.value || '').trim();
    if (!pi) { showToast('Missing Payment ID', 1800); return; }

    if (btn.dataset.busy === '1' || document.body?.dataset?.ownerRestoreBusy === '1') return;
    btn.dataset.busy = '1';
    document.body.dataset.ownerRestoreBusy = '1';

    btn.disabled = true;
    input.disabled = true;
    card.setAttribute('aria-busy', 'true');

    const closeBtn = top.querySelector('.modal-close');
    if (closeBtn instanceof HTMLButtonElement) closeBtn.disabled = true;

    const unlockRestoreUi = () => {
      btn.dataset.busy = '0';
      btn.disabled = false;
      input.disabled = false;
      card.removeAttribute('aria-busy');
      if (closeBtn instanceof HTMLButtonElement) closeBtn.disabled = false;
      try { delete document.body.dataset.ownerRestoreBusy; } catch {}
    };

    let keepLocked = false;

    try {
      // Do NOT redirect to /dash. Perform owner restore, mint cookie, then show Owner Settings matrix.
      const url = new URL('/owner/restore', location.origin);
      url.searchParams.set('pi', pi);
      url.searchParams.set('next', '/'); // keep user in shell
      url.searchParams.set('json', '1'); // return authoritative restore target for deterministic client navigation

      const r = await fetch(url.toString(), {
        cache: 'no-store',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      const restoreJ = r.ok ? await r.json().catch(() => null) : null;
      if (!r.ok || restoreJ?.ok !== true) {
        showToast((typeof t === 'function' && t('owner.restore.pi.fail')) || 'Restore failed.', 2400);
        return;
      }

      // Ensure Owner center is rebuilt after restore (it may have been opened pre-restore as empty).
      document.getElementById('owner-center-modal')?.remove();

      setTimeout(() => {
        try { hideModal(id); } catch {}
      }, 0);

      const restoredUlid = String(restoreJ?.ulid || '').trim();
      const restoredSlug = String(restoreJ?.locationID || '').trim();

      // Use the authoritative restore payload only; do not reuse any stale location context from the URL.
      const target = String(restoredUlid || restoredSlug).trim();

      // Post-restore hints: keep authoritative ULID/slug locally so Owner center and Owner settings can render immediately.
      try {
        if (restoredUlid) {
          sessionStorage.setItem('ng_owner_restore_ulid', restoredUlid);
          sessionStorage.setItem('ng_owner_restore_until', String(Date.now() + 15000)); // 15s window
        }
        if (restoredUlid && restoredSlug) {
          localStorage.setItem(`navigen.slug:${restoredUlid}`, restoredSlug);
        }

        let addedRows = 0;
        let blockedRows = 0;

        const rr2 = await fetch('/api/owner/campaigns', {
          cache: 'no-store',
          credentials: 'include'
        });
        const jj2 = rr2.ok ? await rr2.json().catch(() => null) : null;

        addedRows = Math.max(
          0,
          Number(jj2?.inheritedNotice?.addedRows || 0) || 0
        );
        blockedRows = Math.max(
          0,
          Number(jj2?.inheritedNotice?.blockedRows || 0) || 0
        );

        sessionStorage.removeItem('ng_inherited_notice_added_rows');
        sessionStorage.removeItem('ng_inherited_notice_until');

        if (restoredUlid && addedRows > 0) {
          sessionStorage.setItem(`ng_inherited_notice_inline:${restoredUlid}`, String(addedRows));
          sessionStorage.setItem(`ng_inherited_notice_immediate:${restoredUlid}`, String(addedRows));
        } else if (restoredUlid && blockedRows > 0) {
          sessionStorage.removeItem(`ng_inherited_notice_inline:${restoredUlid}`);
          sessionStorage.removeItem(`ng_inherited_notice_immediate:${restoredUlid}`);
        }
      } catch {}

      if (!target) {
        unlockRestoreUi();
        showToast((typeof t === 'function' && t('owner.restore.pi.ok')) || 'Restored.', 1600);
        return;
      }

      // Deterministic barrier: reload shell once; on boot we route to Owner Settings for this business.
      try {
        // Reload into a clean shell URL to avoid any LPM/context auto-open repaint.
        const u = new URL('/', location.origin);
        u.searchParams.set('open', 'restore');
        u.searchParams.set('bo', target);
        window.location.replace(u.toString());
        keepLocked = true;
      } catch {
        window.location.replace(`/?open=restore&bo=${encodeURIComponent(target)}`);
        keepLocked = true;
      }

      return;

      // (post-restore OS open handled via shell reload intent)

    } finally {
      if (!keepLocked) unlockRestoreUi();
    }
  });

  setupTapOutClose(id);
}

export function showRestoreAccessModal() {
  const id = 'owner-restore-access-modal';
  if (document.body?.dataset?.ownerRestoreBusy === '1') return;

  // Always rebuild so PI input never "sticks" and handlers are fresh.
  document.getElementById(id)?.remove();
  createRestoreAccessModal();
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

  const modal = injectModal({
    id,
    title: _ownerText('owner.examples.title', 'Example dashboards'),
    layout: 'menu',
    bodyHTML: ''
  });

  const inner = modal.querySelector('.modal-body-inner');
  if (!inner) return;

  inner.innerHTML = '';

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
    list.appendChild(empty);
  } else {
    examples.forEach((ex) => {
      const sector = ex.sector ? ex.sector : _ownerText('owner.examples.sector.unknown', '');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-menu-item';
      btn.innerHTML = `
        <span class="icon-img">📊</span>
        <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
          <strong>${ex.name}</strong>
          <span class="example-badge" style="font-size:.75em; opacity:.8;">${_ownerText('owner.examples.badge', 'Example')}</span>
          ${sector ? `<br><small>${sector}</small>` : ''}
        </span>
      `;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const seg = ex.slug || ex.id;
        if (!seg) return;
        window.open(`https://navigen.io/dash/${encodeURIComponent(seg)}`, '_blank', 'noopener,noreferrer');
      });

      list.appendChild(btn);
    });
  }

  // Desktop ESC support (scoped + self-cleaning)
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      hideModal(id);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  setupTapOutClose(id);
}

export async function showExampleDashboardsModal() {
  const id = 'example-dashboards-modal';
  if (!document.getElementById(id)) await createExampleDashboardsModal();
  showModal(id);
}

const P8_PENDING_LOCATION_DRAFT_KEY = 'navigen.p8.pendingLocationDraft';

function savePendingLocationDraft(meta) {
  try {
    localStorage.setItem(P8_PENDING_LOCATION_DRAFT_KEY, JSON.stringify(meta || {}));
  } catch {
    // storage failures must never block the owner flow
  }
}

function readPendingLocationDraft() {
  try {
    const raw = JSON.parse(localStorage.getItem(P8_PENDING_LOCATION_DRAFT_KEY) || 'null');
    return raw && typeof raw === 'object' ? raw : null;
  } catch {
    return null;
  }
}

function clearPendingLocationDraft() {
  try {
    localStorage.removeItem(P8_PENDING_LOCATION_DRAFT_KEY);
  } catch {
    // storage failures must never block the owner flow
  }
}

let p8StructureCatalogPromise;
let p8ContextCatalogPromise;

function resetP8CatalogPromises() {
  p8StructureCatalogPromise = null;
  p8ContextCatalogPromise = null;
}

function loadP8StructureCatalog(force = false) {
  if (force) p8StructureCatalogPromise = null;
  if (!p8StructureCatalogPromise) {
    p8StructureCatalogPromise = fetch('/data/structure.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json().catch(() => []) : []))
      .then((j) => {
        const rows = Array.isArray(j) ? j : [];
        if (!rows.length) p8StructureCatalogPromise = null;
        return rows;
      })
      .catch(() => {
        p8StructureCatalogPromise = null;
        return [];
      });
  }
  return p8StructureCatalogPromise;
}

function loadP8ContextCatalog(force = false) {
  if (force) p8ContextCatalogPromise = null;
  if (!p8ContextCatalogPromise) {
    p8ContextCatalogPromise = fetch('/data/contexts.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json().catch(() => []) : []))
      .then((j) => {
        const rows = Array.isArray(j) ? j : [];
        if (!rows.length) p8ContextCatalogPromise = null;
        return rows;
      })
      .catch(() => {
        p8ContextCatalogPromise = null;
        return [];
      });
  }
  return p8ContextCatalogPromise;
}

function p8ContextLabel(entry) {
  const titles = (entry && typeof entry.titles === 'object') ? entry.titles : {};
  return String(titles.en || Object.values(titles)[0] || entry?.key || '').trim();
}

function p8SubgroupsForGroup(structureRows, groupKey) {
  const row = (Array.isArray(structureRows) ? structureRows : []).find((g) => String(g?.groupKey || '').trim() === String(groupKey || '').trim());
  return Array.isArray(row?.subgroups) ? row.subgroups : [];
}

function parseTagValues(raw) {
  return Array.from(new Set(
    String(raw || '')
      .split(/[;,]/)
      .map((v) => String(v || '').trim())
      .filter(Boolean)
  ));
}

function formatTagValues(tags) {
  return (Array.isArray(tags) ? tags : []).map((v) => String(v || '').trim()).filter(Boolean).join(', ');
}

function parseMediaUrlValues(raw) {
  return Array.from(new Set(
    String(raw || '')
      .split(/[\n,]+/)
      .map((v) => String(v || '').trim())
      .filter(Boolean)
  ));
}

function formatMediaUrlValues(values) {
  return (Array.isArray(values) ? values : [])
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join('\n');
}

function deriveRequestListingCountryCode() {
  const metaCountry =
    document.querySelector('meta[name="cf-country"]')?.content ||
    document.querySelector('meta[name="app-country"]')?.content ||
    document.documentElement.getAttribute('data-country') ||
    (() => {
      try {
        return new Intl.Locale(document.documentElement.lang || navigator.language).region || '';
      } catch {
        return '';
      }
    })();

  const cc = String(metaCountry || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(cc) ? cc : '';
}

function setInputErrorState(el, bad) {
  if (!el) return;
  el.classList.toggle('input-error', !!bad);
}

function p8DraftImageCount(draft) {
  const cover = String(draft?.cover || draft?.media?.cover || '').trim();
  const images = Array.isArray(draft?.images)
    ? draft.images
    : (Array.isArray(draft?.media?.images) ? draft.media.images : []);
  return (cover ? 1 : 0) + images.map((v) => String(v || '').trim()).filter(Boolean).length;
}

function p8DraftDescriptionLength(draft) {
  return String(
    draft?.description ||
    draft?.descriptions?.en ||
    Object.values(draft?.descriptions || {})[0] ||
    ''
  ).trim().length;
}

function p8DraftHasAnyLink(draft) {
  return !!String(draft?.link || draft?.links?.official || '').trim() ||
         !!String(draft?.facebook || draft?.links?.facebook || '').trim() ||
         !!String(draft?.instagram || draft?.links?.instagram || '').trim();
}

function p8LocalPublishReadiness(draft) {
  if (!draft || typeof draft !== 'object') return 'draft_missing';
  if (p8DraftDescriptionLength(draft) < 200) return 'description_min_200';
  if (p8DraftImageCount(draft) < 3) return 'images_min_3';
  if (!p8DraftHasAnyLink(draft)) return 'website_or_social_required';
  return '';
}

function p8PublishMessage(code) {
  const key = String(code || '').trim();
  if (!key) return 'Could not publish listing.';

  if (key === 'description_min_200') {
    return 'Please add a business description with at least 200 characters.';
  }
  if (key === 'images_min_3') {
    return 'Please provide at least 3 images in total (cover + gallery).';
  }
  if (key === 'website_or_social_required') {
    return 'Please provide at least one website or social link.';
  }
  if (key === 'classification_required') {
    return 'Please select one group, one subgroup, and at least one context.';
  }
  if (key === 'missing_coordinates') {
    return 'Please provide valid coordinates before publishing.';
  }
  if (key === 'missing_name') {
    return 'Please provide a business name before publishing.';
  }

  return key;
}

// Phase 8 — Create Location modal (manual private-shell intake)
// Owners create a private shell draft here; paid publish happens later in the commercial flow.
export function createRequestListingModal(opts = {}) {
  const id = 'request-listing-modal';
  const contextModalId = 'request-listing-contexts-modal';
  document.getElementById(id)?.remove();
  document.getElementById(contextModalId)?.remove();

  const shouldReturnToSelectLocation = String(opts?.returnTo || '').trim() === 'syb';
  const closeRequestListing = (ev = null) => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    hideModal(contextModalId);
    removeModal(contextModalId);
    hideModal(id);
    if (shouldReturnToSelectLocation) showSelectLocationModal();
  };

  // Shared modal shell; CTAs live inside the scrollable body (no legacy footer).
  const modal = injectModal({
    id,
        title: t('root.bo.notListed.title') || 'Create a location',
    layout: 'menu',
    onClose: (ev) => { closeRequestListing(ev); },
    bodyHTML: `
      <div class="modal-form-stack">
        <div id="request-listing-loading" class="modal-menu-item owner-center-loading request-listing-status-card" aria-live="polite">
          <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
            <strong id="request-listing-loading-title">${t('modal.requestListing.loading.title') || 'Loading request form...'}</strong><br>
            <small id="request-listing-loading-desc">${t('modal.requestListing.loading.desc') || 'Getting categories and context options.'}</small>
          </span>
          <button id="request-listing-retry" type="button" class="modal-body-button hidden">
            ${t('common.retry') || 'Retry'}
          </button>
        </div>

        <details id="rl-business-section" class="cm-chip request-section-chip">
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${t('modal.requestListing.sections.business.title') || 'Business information'}</strong>
            </span>
            <span class="request-section-badge is-required">${t('modal.requestListing.section.required') || 'Required'}</span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="modal-form-stack">
              <div class="modal-field">
                <label for="rl-name">${t('modal.requestListing.name.label') || 'Business name'} <span class="required-star">*</span></label>
                <input id="rl-name" class="input" type="text" maxlength="120" />
              </div>

              <div class="modal-field">
                <label for="rl-address">${t('modal.requestListing.address.label') || 'Street address'} <span class="required-star">*</span></label>
                <input id="rl-address" class="input" type="text" maxlength="180" />
              </div>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label for="rl-city">${t('modal.requestListing.city.label') || 'City'} <span class="required-star">*</span></label>
                  <input id="rl-city" class="input" type="text" maxlength="80" />
                </div>
                <div class="modal-field">
                  <label for="rl-country">${t('modal.requestListing.country.label') || 'Country code'} <span class="required-star">*</span></label>
                  <input id="rl-country" class="input" type="text" maxlength="2" />
                </div>
              </div>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label for="rl-group">${t('modal.requestListing.group.label') || 'Group'} <span class="required-star">*</span></label>
                  <select id="rl-group" class="input"></select>
                </div>
                <div class="modal-field">
                  <label for="rl-subgroup">${t('modal.requestListing.subgroup.label') || 'Subgroup'} <span class="required-star">*</span></label>
                  <select id="rl-subgroup" class="input"></select>
                </div>
              </div>

              <div class="modal-field">
                <label>${t('modal.requestListing.tags.label') || 'Search tags'}</label>
                <input id="rl-tags" type="hidden" />
                <div id="rl-tag-suggestions" class="request-chip-row" aria-label="${t('modal.requestListing.tags.label') || 'Search tags'}"></div>
                <small class="modal-help-text">${t('modal.requestListing.tags.help') || 'Optional search terms that match how customers look for this business.'}</small>
              </div>
            </div>
          </div>
        </details>

        <details id="rl-context-section" class="cm-chip request-section-chip">
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${t('modal.requestListing.sections.context.title') || 'Context information'}</strong>
            </span>
            <span class="request-section-badge is-required">${t('modal.requestListing.section.required') || 'Required'}</span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="modal-form-stack">
              <div class="modal-field">
                <label for="rl-open-contexts">${t('modal.requestListing.contexts.label') || 'Contexts'} <span class="required-star">*</span></label>
                <select id="rl-contexts" class="input hidden" multiple size="6" aria-hidden="true" tabindex="-1"></select>
                <button id="rl-open-contexts" type="button" class="modal-menu-item request-context-launch">
                  <span class="label">
                    <strong>${t('modal.requestListing.contexts.cta') || 'Choose contexts'}</strong>
                    <small id="rl-context-summary-text">${t('modal.requestListing.contexts.summary.empty') || 'Required. Search and choose up to 3 contexts.'}</small>
                  </span>
                  <span id="rl-context-count" class="request-context-count">0/3</span>
                </button>
                <div id="rl-context-selected" class="request-chip-row request-context-selected" aria-live="polite"></div>
              </div>
            </div>
          </div>
        </details>

        <details id="rl-description-section" class="cm-chip request-section-chip request-description-chip">
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${t('modal.requestListing.description.label') || 'Business description'}</strong>
              <small id="rl-description-chip-state" class="request-section-chip-summary">${translatedOrFallback('modal.requestListing.description.summary.empty', 'Optional. Open to add details.')}</small>
            </span>
            <span class="request-section-badge is-suggested">${t('modal.requestListing.section.suggested') || 'Suggested'}</span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="request-description-editor">
              <div class="request-description-editor-head">
                <span class="request-description-editor-prompt">${t('modal.requestListing.description.placeholder') || '🔍 Describe the business'}</span>
              </div>
              <div class="modal-field" style="margin:0;">
                <textarea id="rl-description" class="input request-description-textarea" rows="5" maxlength="3000" placeholder=""></textarea>
                <div class="modal-help-split">
                  <small class="modal-help-text">${t('modal.requestListing.description.help') || 'Publish-ready target: at least 200 characters.'}</small>
                  <small id="rl-description-count" class="modal-help-counter">0/200</small>
                </div>
              </div>
            </div>
          </div>
        </details>

        <details id="rl-links-section" class="cm-chip request-section-chip">
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${t('modal.requestListing.sections.links.title') || 'Links to the business'}</strong>
            </span>
            <span class="request-section-badge is-optional">${t('modal.requestListing.section.optional') || 'Optional'}</span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="modal-form-stack">
              <div class="modal-field">
                <label for="rl-link">${t('modal.requestListing.link.label') || 'Official website or primary business link'}</label>
                <input id="rl-link" class="input" type="text" maxlength="240" placeholder="${t('modal.requestListing.cover.placeholder') || 'https://...'}" />
              </div>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label for="rl-facebook">${t('modal.requestListing.facebook.label') || 'Facebook link'}</label>
                  <input id="rl-facebook" class="input" type="text" maxlength="240" placeholder="${t('modal.requestListing.cover.placeholder') || 'https://...'}" />
                </div>
                <div class="modal-field">
                  <label for="rl-instagram">${t('modal.requestListing.instagram.label') || 'Instagram link'}</label>
                  <input id="rl-instagram" class="input" type="text" maxlength="240" placeholder="${t('modal.requestListing.cover.placeholder') || 'https://...'}" />
                </div>
              </div>

              <div class="modal-field">
                <label for="rl-booking">${t('modal.requestListing.booking.label') || 'Booking'}</label>
                <input id="rl-booking" class="input" type="text" maxlength="240" placeholder="${t('modal.requestListing.cover.placeholder') || 'https://...'}" />
              </div>
            </div>
          </div>
        </details>

        <details id="rl-media-section" class="cm-chip request-section-chip">
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${t('modal.requestListing.sections.media.title') || 'Media'}</strong>
            </span>
            <span class="request-section-badge is-optional">${t('modal.requestListing.section.optional') || 'Optional'}</span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="modal-form-stack">
              <div class="modal-field">
                <label for="rl-cover">${t('modal.requestListing.cover.label') || 'Cover image URL'}</label>
                <input id="rl-cover" class="input" type="text" maxlength="500" placeholder="${t('modal.requestListing.cover.placeholder') || 'https://...'}" />
              </div>

              <div class="modal-field">
                <label for="rl-image-1">${t('modal.requestListing.images.label') || 'Gallery image URL 1'}</label>
                <input id="rl-image-1" class="input" type="text" maxlength="500" placeholder="${t('modal.requestListing.cover.placeholder') || 'https://...'}" />
              </div>

              <div class="modal-field">
                <label for="rl-image-2">${t('modal.requestListing.images.label2') || 'Gallery image URL 2'}</label>
                <input id="rl-image-2" class="input" type="text" maxlength="500" placeholder="${t('modal.requestListing.cover.placeholder') || 'https://...'}" />
                <small class="modal-help-text">${t('modal.requestListing.images.help') || 'Publish-ready target: at least 3 total images counting cover + gallery.'}</small>
              </div>
            </div>
          </div>
        </details>

        <div class="modal-menu-item modal-static-card request-surface-card">
          <label class="modal-checkbox-row" for="rl-has-coord">
            <input id="rl-has-coord" type="checkbox" />
            <span>${t('modal.requestListing.hasCoord.label') || 'Suggested: I have coordinates'}</span>
          </label>

          <div id="rl-coord-wrap" class="modal-field hidden request-surface-card-body">
            <label for="rl-coord">${t('modal.requestListing.coord.label') || 'Coordinates (lat,lng) — 6 decimals'}</label>
            <input id="rl-coord" class="input" type="text" placeholder="${t('modal.requestListing.coord.placeholder') || '52.527900,13.440200'}" />
            <small class="modal-help-text">${t('modal.requestListing.coord.help') || 'Tip: you can copy this from Google Maps.'}</small>
          </div>
        </div>

        <div class="modal-actions">
          <button id="request-listing-submit" type="button" class="modal-body-button">
            ${t('modal.requestListing.submitDraft') || 'Save draft'}
          </button>

          <button id="request-listing-cancel" type="button" class="modal-body-button">
            ${t('common.cancel') || 'Cancel'}
          </button>
        </div>
      </div>
    `
  });

  const prefill = (opts && opts.prefill && typeof opts.prefill === 'object')
    ? opts.prefill
    : (readPendingLocationDraft() || null);

  const rlName = modal.querySelector('#rl-name');
  const rlAddress = modal.querySelector('#rl-address');
  const rlCity = modal.querySelector('#rl-city');
  const rlCountry = modal.querySelector('#rl-country');
  
  const rlLink = modal.querySelector('#rl-link');
  const rlFacebook = modal.querySelector('#rl-facebook');
  const rlInstagram = modal.querySelector('#rl-instagram');
  const rlBooking = modal.querySelector('#rl-booking');
  const rlDescription = modal.querySelector('#rl-description');
  const rlDescriptionChipState = modal.querySelector('#rl-description-chip-state');
  const rlDescriptionCount = modal.querySelector('#rl-description-count');
  
  const rlBusinessSection = modal.querySelector('#rl-business-section');
  const rlContextSection = modal.querySelector('#rl-context-section');
  const rlDescriptionSection = modal.querySelector('#rl-description-section');
  
  const requestListingSectionChips = Array.from(modal.querySelectorAll('.request-section-chip'));
  requestListingSectionChips.forEach((section) => {
    section.addEventListener('toggle', () => {
      if (!section.open) return;
      requestListingSectionChips.forEach((other) => {
        if (other !== section) other.removeAttribute('open');
      });
    });
  });
  
  const rlGroup = modal.querySelector('#rl-group');
  const rlSubgroup = modal.querySelector('#rl-subgroup');
  const rlContexts = modal.querySelector('#rl-contexts');
  const rlOpenContexts = modal.querySelector('#rl-open-contexts');
  const rlContextSummaryText = modal.querySelector('#rl-context-summary-text');
  const rlContextCount = modal.querySelector('#rl-context-count');
  const rlContextSelected = modal.querySelector('#rl-context-selected');
  const rlTags = modal.querySelector('#rl-tags');
  const rlTagSuggestions = modal.querySelector('#rl-tag-suggestions');
  const rlCover = modal.querySelector('#rl-cover');
  const rlImage1 = modal.querySelector('#rl-image-1');
  const rlImage2 = modal.querySelector('#rl-image-2');
  const rlCoord = modal.querySelector('#rl-coord');
  const rlHasCoord = modal.querySelector('#rl-has-coord');
  const rlCoordWrap = modal.querySelector('#rl-coord-wrap');
  const requestListingLoading = modal.querySelector('#request-listing-loading');
  const requestListingLoadingTitle = modal.querySelector('#request-listing-loading-title');
  const requestListingLoadingDesc = modal.querySelector('#request-listing-loading-desc');
  const requestListingRetry = modal.querySelector('#request-listing-retry');
  const requestListingSubmit = modal.querySelector('#request-listing-submit');

  function setRequestListingRetryVisible(visible) {
    if (!(requestListingRetry instanceof HTMLButtonElement)) return;
    requestListingRetry.classList.toggle('hidden', !visible);
    requestListingRetry.disabled = !visible;
  }

  function setRequestListingLoading(visible, title = '', desc = '') {
    requestListingLoading?.classList.toggle('hidden', !visible);
    if (requestListingLoadingTitle && title) requestListingLoadingTitle.textContent = title;
    if (requestListingLoadingDesc && desc) requestListingLoadingDesc.textContent = desc;
    setRequestListingRetryVisible(false);
    if (requestListingSubmit instanceof HTMLButtonElement) {
      requestListingSubmit.disabled = !!visible;
    }
  }

  requestListingRetry?.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    resetP8CatalogPromises();
    showRequestListingModal(opts);
  });
  
  const prefillContexts = Array.isArray(prefill?.contexts)
    ? prefill.contexts.map((v) => String(v || '').trim()).filter(Boolean)
    : String(prefill?.context || '').split(';').map((v) => String(v || '').trim()).filter(Boolean);

  const prefillTags = Array.isArray(prefill?.tags)
    ? prefill.tags.map((v) => String(v || '').trim()).filter(Boolean)
    : parseTagValues(prefill?.tags);

  const prefillDescription = String(
    prefill?.description ||
    prefill?.descriptions?.en ||
    Object.values(prefill?.descriptions || {})[0] ||
    ''
  ).trim();

  const prefillOfficialLink = String(prefill?.link || prefill?.links?.official || '').trim();
  const prefillFacebook = String(prefill?.facebook || prefill?.links?.facebook || '').trim();
  const prefillInstagram = String(prefill?.instagram || prefill?.links?.instagram || '').trim();
  const prefillBooking = String(prefill?.booking || prefill?.links?.bookingUrl || '').trim();
  const prefillCover = String(prefill?.cover || prefill?.media?.cover?.src || prefill?.media?.cover || '').trim();
  const prefillImages = (Array.isArray(prefill?.images)
    ? prefill.images
    : (Array.isArray(prefill?.media?.images) ? prefill.media.images : []))
    .map((value) => String(value?.src || value || '').trim())
    .filter(Boolean);
  const prefillImage1 = String(prefillImages[0] || '').trim();
  const prefillImage2 = String(prefillImages[1] || '').trim();

  const REQUEST_LISTING_CONTEXT_LIMIT = 3;
  const selectedTagSet = new Set(prefillTags);
  const selectedContextSet = new Set();
  let requestListingContextRows = [];
  let requestListingContextIndex = new Map();

  function syncRequestListingTags() {
    if (rlTags) rlTags.value = formatTagValues(Array.from(selectedTagSet));
  }

  function setRequestListingTags(values) {
    selectedTagSet.clear();
    (Array.isArray(values) ? values : []).forEach((value) => {
      const tag = String(value || '').trim();
      if (tag) selectedTagSet.add(tag);
    });
    syncRequestListingTags();
  }

  function getRequestListingContextLabel(key) {
    const cleanKey = String(key || '').trim();
    if (!cleanKey) return '';
    return p8ContextLabel(requestListingContextIndex.get(cleanKey) || { key: cleanKey, titles: { en: cleanKey } });
  }

  function setRequestListingContexts(values) {
    selectedContextSet.clear();
    (Array.isArray(values) ? values : []).forEach((value) => {
      const key = String(value || '').trim();
      if (key && selectedContextSet.size < REQUEST_LISTING_CONTEXT_LIMIT) selectedContextSet.add(key);
    });
  }

  function requestListingContextSeedTokens() {
    const toTokens = (value) => String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);

    return Array.from(new Set([
      String(rlSubgroup?.selectedOptions?.[0]?.textContent || '').trim(),
      String(rlGroup?.selectedOptions?.[0]?.textContent || '').trim(),
      String(rlCity?.value || '').trim(),
      ...Array.from(selectedTagSet).map((tag) => String(tag || '').trim())
    ].flatMap(toTokens)));
  }

  function requestListingContextSeedScore(row, tokens) {
    if (!tokens.length) return 0;

    const haystack = String([
      row?.key,
      row?.pageKey,
      row?.namespace,
      row?.theme,
      p8ContextLabel(row),
      ...Object.values((row && typeof row.titles === 'object') ? row.titles : {})
    ].join(' ') || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ');

    return tokens.reduce((score, token) => {
      if (haystack.includes(` ${token} `) || haystack.startsWith(`${token} `) || haystack.endsWith(` ${token}`)) return score + 4;
      if (haystack.includes(token)) return score + 2;
      return score;
    }, 0);
  }

  function renderRequestListingContextSuggestions() {
    const suggestedRow = modal.querySelector('#rl-context-suggested');
    if (!suggestedRow) return;
    suggestedRow.innerHTML = '';
    suggestedRow.classList.add('hidden');
  }

  function syncRequestListingContexts() {    
    if (rlContexts) {
      Array.from(rlContexts.options || []).forEach((opt) => {
        opt.selected = selectedContextSet.has(String(opt.value || '').trim());
      });
    }

    if (rlContextCount) rlContextCount.textContent = `${selectedContextSet.size}/${REQUEST_LISTING_CONTEXT_LIMIT}`;
    if (rlContextSummaryText) {
      rlContextSummaryText.textContent = selectedContextSet.size
        ? (t('modal.requestListing.contexts.summary.selected') || 'Tap to review or change your selected contexts.')
        : (t('modal.requestListing.contexts.summary.empty') || 'Required. Search and choose up to 3 contexts.');
    }

    rlOpenContexts?.classList.toggle('is-active', selectedContextSet.size > 0);

    if (rlContextSelected) {
      rlContextSelected.innerHTML = '';
      Array.from(selectedContextSet).forEach((key) => {
        const chip = document.createElement('span');
        chip.className = 'request-chip is-selected request-chip-static';
        chip.textContent = getRequestListingContextLabel(key);
        rlContextSelected.appendChild(chip);
      });
    }

    renderRequestListingContextSuggestions();
  }

  function setRequestListingContextError(bad) {
    rlOpenContexts?.classList.toggle('input-error', !!bad);
    setInputErrorState(rlContexts, !!bad);
  }

  function resizeRequestListingDescriptionInput() {
    if (!(rlDescription instanceof HTMLTextAreaElement)) return;
    rlDescription.style.height = 'auto';
    rlDescription.style.height = `${Math.max(140, rlDescription.scrollHeight)}px`;
  }

  function updateRequestListingDescriptionChip() {
    const rawValue = String(rlDescription?.value || '');
    const value = rawValue.replace(/\s+/g, ' ').trim();
    const summary = value || translatedOrFallback('modal.requestListing.description.summary.empty', 'Optional. Open to add details.');
    const count = rawValue.trim().length;

    if (rlDescriptionChipState) rlDescriptionChipState.textContent = summary;
    if (rlDescriptionCount) {
      rlDescriptionCount.textContent = `${count}/200`;
      rlDescriptionCount.classList.toggle('is-good', count >= 200);
    }
    rlDescriptionSection?.classList.toggle('has-value', !!value);
  }

  syncRequestListingTags();
  setRequestListingContexts(prefillContexts);
  syncRequestListingContexts();

  if (prefill) {
    if (rlName) rlName.value = String(prefill.name || '').trim();
    if (rlAddress) rlAddress.value = String(prefill.address || '').trim();
    if (rlCity) rlCity.value = String(prefill.city || '').trim();
    if (rlCountry) rlCountry.value = String(prefill.country || '').trim().toUpperCase();
    if (!String(prefill?.country || '').trim() && rlCountry) rlCountry.value = deriveRequestListingCountryCode();
    if (rlLink) rlLink.value = prefillOfficialLink;
    if (rlFacebook) rlFacebook.value = prefillFacebook;
    if (rlInstagram) rlInstagram.value = prefillInstagram;
    if (rlBooking) rlBooking.value = prefillBooking;
    if (rlDescription) rlDescription.value = prefillDescription;
    setRequestListingTags(prefillTags);
    if (rlCover) rlCover.value = prefillCover;
    if (rlImage1) rlImage1.value = prefillImage1;
    if (rlImage2) rlImage2.value = prefillImage2;

    const coordPrefill = String(prefill.coord || '').trim();
    if (coordPrefill) {
      if (rlCoord) rlCoord.value = coordPrefill;
      if (rlHasCoord) rlHasCoord.checked = true;
      rlCoordWrap?.classList.remove('hidden');
    }
  }

  updateRequestListingDescriptionChip();
  resizeRequestListingDescriptionInput();
  rlDescription?.addEventListener('input', () => {
    resizeRequestListingDescriptionInput();
    updateRequestListingDescriptionChip();
  });

  function openRequestListingContextsModal() {
    if (!requestListingContextRows.length) {
      showToast(t('modal.requestListing.contexts.unavailable') || 'Context options are still loading.', 2200);
      return;
    }

    document.getElementById(contextModalId)?.remove();

    const closeContextPicker = (ev = null) => {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      hideModal(contextModalId);
      removeModal(contextModalId);
      showModal(id);
      syncRequestListingContexts();
      setRequestListingContextError(!selectedContextSet.size);
      rlOpenContexts?.focus?.();
    };

    const ctxModal = injectModal({
      id: contextModalId,
      title: t('modal.requestListing.contexts.modal.title') || 'Available contexts',
      layout: 'menu',
      onClose: (ev) => { closeContextPicker(ev); },
      bodyHTML: `
        <div class="modal-form-stack">
          <div id="request-context-selected-card" class="modal-menu-item modal-static-card request-context-selected-card">
            <div class="request-context-selected-head">
              <span class="label">
                <strong>${t('modal.requestListing.contexts.selected.title') || 'Selected contexts'}</strong>
                <small id="request-context-selected-help">${t('modal.requestListing.contexts.selected.empty') || 'Choose up to 3.'}</small>
              </span>
              <button
                id="request-context-done"
                type="button"
                class="request-context-done"
                aria-label="${t('modal.requestListing.contexts.done') || 'Done'}"
                title="${t('modal.requestListing.contexts.done') || 'Done'}"
              >
                <span aria-hidden="true">✅</span>
              </button>
            </div>
            <div id="request-context-selected-chips" class="request-chip-row"></div>
          </div>

          <div id="request-context-results" class="modal-menu-list request-context-list"></div>
        </div>
      `
    });

    const ctxTopBar = ctxModal.querySelector('.modal-top-bar');
    const ctxSelectedCard = ctxModal.querySelector('#request-context-selected-card');
    const ctxSelectedHelp = ctxModal.querySelector('#request-context-selected-help');
    const ctxSelectedChips = ctxModal.querySelector('#request-context-selected-chips');
    const ctxDoneBtn = ctxModal.querySelector('#request-context-done');
    const ctxResults = ctxModal.querySelector('#request-context-results');

    if (!ctxTopBar || !ctxResults) {
      closeContextPicker();
      return;
    }

    const searchRow = document.createElement('div');
    searchRow.className = 'select-location-search-row';

    const searchLeft = document.createElement('div');
    searchLeft.className = 'select-location-search-left';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.id = 'request-context-search';
    searchInput.spellcheck = false;
    searchInput.autocapitalize = 'off';
    searchInput.autocomplete = 'off';
    searchInput.value = '';
    const contextPlaceholder = (t('modal.requestListing.contexts.search.placeholder') || 'Search contexts…').trim();
    searchInput.placeholder = contextPlaceholder.startsWith('🔍') ? contextPlaceholder : `🔍 ${contextPlaceholder}`;

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-x';
    clearBtn.id = 'request-context-clear-search';
    clearBtn.textContent = 'x';
    clearBtn.style.display = 'none';
    clearBtn.setAttribute('aria-label', t('common.search.clear') || 'Clear search');

    searchLeft.appendChild(searchInput);
    searchLeft.appendChild(clearBtn);
    searchRow.appendChild(searchLeft);
    ctxTopBar.appendChild(searchRow);

    const norm = (s) =>
      String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_.\/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const tokensOf = (q) => norm(q).split(/\s+/).filter(Boolean);

    const syncClear = () => {
      const hasValue = !!String(searchInput.value || '').trim();
      clearBtn.style.display = hasValue ? 'inline-flex' : 'none';
    };

    const searchableContextText = (row) => norm([
      row?.key,
      row?.pageKey,
      row?.namespace,
      row?.theme,
      p8ContextLabel(row),
      ...Object.values((row && typeof row.titles === 'object') ? row.titles : {})
    ].join(' '));

    const requestListingContextSeedTokens = () => tokensOf([
      String(rlSubgroup?.selectedOptions?.[0]?.textContent || '').trim(),
      String(rlGroup?.selectedOptions?.[0]?.textContent || '').trim(),
      ...Array.from(selectedTagSet).map((tag) => String(tag || '').trim()),
      String(rlCity?.value || '').trim()
    ].join(' '));

    const requestListingContextSeedScore = (row, tokens) => {
      if (!tokens.length) return 0;
      const hay = searchableContextText(row);
      return tokens.reduce((score, token) => score + (hay.includes(token) ? Math.max(10 - Math.min(token.length, 9), 1) : 0), 0);
    };

    const sortContextRows = (rows, boostTokens = []) => rows.slice().sort((a, b) => {
      const aKey = String(a?.key || '').trim();
      const bKey = String(b?.key || '').trim();
      const aSelected = selectedContextSet.has(aKey) ? 1 : 0;
      const bSelected = selectedContextSet.has(bKey) ? 1 : 0;
      if (aSelected !== bSelected) return bSelected - aSelected;

      const aBoost = requestListingContextSeedScore(a, boostTokens);
      const bBoost = requestListingContextSeedScore(b, boostTokens);
      if (aBoost !== bBoost) return bBoost - aBoost;

      return getRequestListingContextLabel(aKey).localeCompare(getRequestListingContextLabel(bKey), undefined, { sensitivity: 'base' });
    });

    const renderContextPicker = () => {
      const selectedKeys = Array.from(selectedContextSet);

      if (ctxSelectedCard && ctxSelectedChips) {
        ctxSelectedChips.innerHTML = '';
        ctxSelectedCard.classList.toggle('is-empty', !selectedKeys.length);

        if (ctxSelectedHelp) {
          ctxSelectedHelp.textContent = selectedKeys.length
            ? (t('modal.requestListing.contexts.selected.help') || 'Tap a selected chip to remove it.')
            : (t('modal.requestListing.contexts.selected.empty') || 'Choose up to 3.');
        }

        selectedKeys.forEach((key) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'request-chip is-selected';
          chip.textContent = getRequestListingContextLabel(key);
          chip.addEventListener('click', () => {
            selectedContextSet.delete(key);
            syncRequestListingContexts();
            renderContextPicker();
          });
          ctxSelectedChips.appendChild(chip);
        });
      }

      const tokens = tokensOf(searchInput.value);
      const boostTokens = tokens.length ? [] : requestListingContextSeedTokens();
      const rows = sortContextRows(requestListingContextRows.filter((row) => {
        if (!tokens.length) return true;
        const hay = searchableContextText(row);
        return tokens.every((token) => hay.includes(token));
      }), boostTokens);

      ctxResults.innerHTML = '';
      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'modal-menu-item modal-static-card request-context-empty';
        empty.innerHTML = `
          <span class="label">
            <strong>${t('modal.requestListing.contexts.empty.title') || 'No matching contexts'}</strong>
            <small>${t('modal.requestListing.contexts.empty.desc') || 'Try another search term.'}</small>
          </span>
        `;
        ctxResults.appendChild(empty);
        return;
      }

      rows.forEach((row) => {
        const key = String(row?.key || '').trim();
        if (!key) return;

        const isSelected = selectedContextSet.has(key);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `modal-menu-item request-context-option${isSelected ? ' is-selected' : ''}`;

        const labelWrap = document.createElement('span');
        labelWrap.className = 'label';

        const title = document.createElement('strong');
        title.textContent = getRequestListingContextLabel(key);

        const meta = document.createElement('small');
        meta.textContent = key;

        labelWrap.appendChild(title);
        labelWrap.appendChild(meta);

        const check = document.createElement('span');
        check.className = 'request-context-check';
        check.setAttribute('aria-hidden', 'true');
        check.textContent = isSelected ? '✓' : '';

        button.appendChild(labelWrap);
        button.appendChild(check);

        button.addEventListener('click', () => {
          if (selectedContextSet.has(key)) {
            selectedContextSet.delete(key);
          } else {
            if (selectedContextSet.size >= REQUEST_LISTING_CONTEXT_LIMIT) {
              showToast(t('modal.requestListing.contexts.limit') || 'You can select up to 3 contexts.', 2200);
              return;
            }
            selectedContextSet.add(key);
          }

          syncRequestListingContexts();
          renderContextPicker();
        });

        ctxResults.appendChild(button);
      });
    };

    searchInput.addEventListener('input', () => {
      syncClear();
      renderContextPicker();
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      syncClear();
      renderContextPicker();
      searchInput.focus();
    });

    ctxDoneBtn?.addEventListener('click', (ev) => {
      closeContextPicker(ev);
    });

    hideModal(id);
    showModal(contextModalId);
    searchInput.focus();
    setupTapOutClose(contextModalId, closeContextPicker);
  }

  rlOpenContexts?.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openRequestListingContextsModal();
  });

  (async () => {
    const [structureRows, contextRows] = await Promise.all([
      loadP8StructureCatalog(),
      loadP8ContextCatalog()
    ]);

    const groupsOk = Array.isArray(structureRows) && structureRows.length > 0;
    const contextsOk = Array.isArray(contextRows) && contextRows.length > 0;

    if (!groupsOk || !contextsOk) {
      setRequestListingLoading(true, t('modal.requestListing.unavailable.title') || 'Request form unavailable', t('modal.requestListing.unavailable.desc') || 'Could not load categories and context options.');
      setRequestListingRetryVisible(true);
      return;
    }

    if (rlGroup) {
      const options = [`<option value="">${t('modal.requestListing.group.placeholder') || 'Select group'}</option>`]
        .concat(
          structureRows.map((row) => {
            const groupKey = String(row?.groupKey || '').trim();
            const groupName = String(row?.groupName || groupKey).trim();
            return groupKey ? `<option value="${groupKey}">${groupName}</option>` : '';
          }).filter(Boolean)
        )
        .join('');
      rlGroup.innerHTML = options;
      if (prefill?.groupKey) rlGroup.value = String(prefill.groupKey || '').trim();
    }

    const renderTagSuggestions = () => {
      if (!rlTagSuggestions) return;
      rlTagSuggestions.innerHTML = '';

      const groupKey = String(rlGroup?.value || '').trim();
      const subgroupKey = String(rlSubgroup?.value || '').trim();
      const subs = p8SubgroupsForGroup(structureRows, groupKey);
      const activeSub = subs.find((sg) => String(sg?.key || '').trim() === subgroupKey);
      const keywords = Array.isArray(activeSub?.keywords) ? activeSub.keywords : [];
      const activeTags = Array.from(new Set(
        keywords
          .map((kw) => String(kw || '').trim())
          .filter(Boolean)
      ));
      const activeTagSet = new Set(activeTags);

      Array.from(selectedTagSet).forEach((tag) => {
        if (!activeTagSet.has(tag)) selectedTagSet.delete(tag);
      });
      syncRequestListingTags();

      rlTagSuggestions.classList.toggle('hidden', !activeTags.length);
      if (!activeTags.length) return;

      activeTags.forEach((tag) => {
        const selected = selectedTagSet.has(tag);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `request-chip${selected ? ' is-selected' : ''}`;
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
        btn.textContent = tag;
        btn.addEventListener('click', () => {
          if (selectedTagSet.has(tag)) selectedTagSet.delete(tag);
          else selectedTagSet.add(tag);
          syncRequestListingTags();
          renderTagSuggestions();
        });
        rlTagSuggestions.appendChild(btn);
      });
    };

    const renderSubgroups = () => {
      if (!rlSubgroup) return;
      const groupKey = String(rlGroup?.value || prefill?.groupKey || '').trim();
      const subs = p8SubgroupsForGroup(structureRows, groupKey);
      rlSubgroup.innerHTML = [`<option value="">${t('modal.requestListing.subgroup.placeholder') || 'Select subgroup'}</option>`]
        .concat(
          subs.map((sg) => {
            const key = String(sg?.key || '').trim();
            const name = String(sg?.name || key).trim();
            return key ? `<option value="${key}">${name}</option>` : '';
          }).filter(Boolean)
        )
        .join('');
      if (prefill?.subgroupKey) rlSubgroup.value = String(prefill.subgroupKey || '').trim();
      renderTagSuggestions();
      renderRequestListingContextSuggestions();
    };

    renderSubgroups();

    rlGroup?.addEventListener('change', () => {
      if (rlSubgroup) rlSubgroup.value = '';
      renderSubgroups();
    });

    rlSubgroup?.addEventListener('change', () => {
      renderTagSuggestions();
      renderRequestListingContextSuggestions();
    });

    requestListingContextRows = contextRows.slice();
    requestListingContextIndex = new Map(
      requestListingContextRows.map((row) => [String(row?.key || '').trim(), row])
    );

    if (rlContexts) {
      rlContexts.innerHTML = requestListingContextRows.map((row) => {
        const key = String(row?.key || '').trim();
        const label = p8ContextLabel(row);
        return key ? `<option value="${key}">${label}</option>` : '';
      }).join('');
    }

    syncRequestListingContexts();
    setRequestListingLoading(false);
  })();

  modal.querySelector('#request-listing-submit')?.addEventListener('click', async () => {
    const name = String(modal.querySelector('#rl-name')?.value || '').trim();
    const address = String(modal.querySelector('#rl-address')?.value || '').trim();
    const city = String(modal.querySelector('#rl-city')?.value || '').trim();
    const country = String(modal.querySelector('#rl-country')?.value || '').trim().toUpperCase();
    const link = String(modal.querySelector('#rl-link')?.value || '').trim();
    const facebook = String(modal.querySelector('#rl-facebook')?.value || '').trim();
    const instagram = String(modal.querySelector('#rl-instagram')?.value || '').trim();
    const booking = String(modal.querySelector('#rl-booking')?.value || '').trim();
    const description = String(modal.querySelector('#rl-description')?.value || '').trim();
    const groupKey = String(modal.querySelector('#rl-group')?.value || '').trim();
    const subgroupKey = String(modal.querySelector('#rl-subgroup')?.value || '').trim();
    const contextVals = Array.from(selectedContextSet)
      .map((value) => String(value || '').trim())
      .filter(Boolean);
    const tagVals = parseTagValues(modal.querySelector('#rl-tags')?.value || '');
    const cover = String(modal.querySelector('#rl-cover')?.value || '').trim();
    const imageVals = Array.from(new Set([
      String(modal.querySelector('#rl-image-1')?.value || '').trim(),
      String(modal.querySelector('#rl-image-2')?.value || '').trim()
    ].filter(Boolean)));
    const coord = String(modal.querySelector('#rl-coord')?.value || '').trim();

    const wantsCoord = !!rlHasCoord?.checked;

    setInputErrorState(rlName, !name);
    setInputErrorState(rlAddress, !address);
    setInputErrorState(rlCity, !city);
    setInputErrorState(rlCountry, !country || country.length !== 2);
    setInputErrorState(rlGroup, !groupKey);
    setInputErrorState(rlSubgroup, !subgroupKey);
    setRequestListingContextError(!contextVals.length);
    setInputErrorState(rlCoord, wantsCoord && !coord);

    const hasBusinessError = !name || !address || !city || !country || country.length !== 2 || !groupKey || !subgroupKey;
    const hasContextError = !contextVals.length;
    const hasCoordError = wantsCoord && !coord;

    if (hasBusinessError || hasContextError || hasCoordError) {
      if (hasBusinessError) {
        rlBusinessSection?.setAttribute('open', '');
      } else if (hasContextError) {
        rlContextSection?.setAttribute('open', '');
      } else if (hasCoordError) {
        rlCoord?.focus?.();
      }
      showToast(t('modal.requestListing.validation.required') || 'Please fill in all required fields marked with *.', 2200);
      return;
    }

    // Normalize name for admin handling (no slug creation here)
    const nameNorm = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s\-\&\.']/gi, '')      // keep common business punctuation (ASCII-safe after NFD)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    // Optional coords validation (if provided)
    let coordNorm = '';
    if (coord) {
      const m = coord.match(/^\s*(-?\d+(?:\.\d{1,6})?)\s*,\s*(-?\d+(?:\.\d{1,6})?)\s*$/);
      if (!m) {
        rlCoord?.focus?.();
        showToast('Coordinates must be "lat,lng" with up to 6 decimals.', 2200);
        return;
      }
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        rlCoord?.focus?.();
        showToast('Coordinates are out of range.', 2200);
        return;
      }
      coordNorm = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    }

    const existingDraftULID = String(prefill?.draftULID || '').trim();
    const existingDraftSessionId = String(prefill?.draftSessionId || '').trim();

    const links = {};
    if (link) links.official = link;
    if (facebook) links.facebook = facebook;
    if (instagram) links.instagram = instagram;
    if (booking) links.bookingUrl = booking;

    const media = {};
    if (cover) media.cover = cover;
    if (imageVals.length) media.images = imageVals;

    const draftBody = {
      ...(existingDraftULID && existingDraftSessionId
        ? {
            draftULID: existingDraftULID,
            draftSessionId: existingDraftSessionId
          }
        : {}),
      draft: {
        locationName: { en: name },
        groupKey,
        subgroupKey,
        context: contextVals,
        tags: tagVals,
        contactInformation: {
          address,
          city,
          countryCode: country
        },
        ...(description ? { descriptions: { en: description } } : {}),
        ...(Object.keys(links).length ? { links } : {}),
        ...(Object.keys(media).length ? { media } : {}),
        ...(coordNorm ? { coord: coordNorm } : {})
      }
    };

    setRequestListingLoading(true, t('modal.requestListing.saving.title') || 'Saving listing draft...', t('modal.requestListing.saving.desc') || 'Preparing your private location shell.');
    let res = null;
    let payload = null;
    try {
      res = await fetch('/api/location/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(draftBody),
        cache: 'no-store',
        credentials: 'include'
      });
      payload = await res.json().catch(() => null);
    } catch {
      res = null;
      payload = null;
    }

    if (!res?.ok) {
      setRequestListingLoading(false);
      const msg = String(payload?.error?.message || '').trim();
      showToast(msg || (t('modal.requestListing.error') || 'Could not create draft.'), 2400);
      return;
    }

    const draftULID = String(payload?.draftULID || existingDraftULID).trim();
    const draftSessionId = String(payload?.draftSessionId || existingDraftSessionId).trim();
    if (!draftULID || !draftSessionId) {
      setRequestListingLoading(false);
      showToast(t('modal.requestListing.error') || 'Could not create draft.', 2400);
      return;
    }

    const savedDraft = {
      draftULID,
      draftSessionId,
      mode: 'manual',
      name,
      nameNorm,
      address,
      city,
      country,
      link,
      facebook,
      instagram,
      description,
      cover,
      images: imageVals,
      coord: coordNorm,
      groupKey,
      subgroupKey,
      contexts: contextVals,
      context: contextVals.join(';'),
      tags: tagVals,
      createdAt: Number(prefill?.createdAt || Date.now()),
      updatedAt: Date.now()
    };

    savePendingLocationDraft(savedDraft);
    hideModal(id);
    showLocationDraftNextStepsModal(savedDraft, { returnTo: opts?.returnTo });
  });

  modal.querySelector('#request-listing-cancel')?.addEventListener('click', (ev) => { closeRequestListing(ev); });
  const countryInput = modal.querySelector('#rl-country');
  countryInput?.addEventListener('input', (e) => {
    e.target.value = String(e.target.value || '').toUpperCase();
  });

  const coordToggle = modal.querySelector('#rl-has-coord');
  coordToggle?.addEventListener('change', (e) => {
    rlCoordWrap?.classList.toggle('hidden', !e.target?.checked);
  });

  setupTapOutClose(id, closeRequestListing);
}

export function showRequestListingModal(opts = {}) {
  const id = 'request-listing-modal';
  document.getElementById('location-draft-next-modal')?.remove();
  document.getElementById(id)?.remove();
  createRequestListingModal(opts);
  showModal(id);
}

export function showLocationDraftNextStepsModal(draftMeta = {}, opts = {}) {
  const id = 'location-draft-next-modal';
  document.getElementById(id)?.remove();

  const shouldReturnToSelectLocation = String(opts?.returnTo || '').trim() === 'syb';
  const draftULID = String(draftMeta?.draftULID || '').trim();
  const draftSessionId = String(draftMeta?.draftSessionId || '').trim();

  const closeNextSteps = (ev = null) => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    hideModal(id);
    if (shouldReturnToSelectLocation) showSelectLocationModal();
  };

  const modal = injectModal({
    id,
    title: t('modal.requestListing.success') || 'Draft saved.',
    layout: 'menu',
    onClose: (ev) => { closeNextSteps(ev); },
    bodyHTML: `
      <div class="modal-form-stack">
        <div class="modal-menu-item modal-static-card request-draft-next-card" aria-disabled="true">
          <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
            <strong>${t('modal.requestListing.next.savedTitle') || 'Your location draft is private and saved.'}</strong><br>
            <small>${t('modal.requestListing.next.savedDesc') || 'Continue to paid publish now, or stop here and resume later from this device.'}</small>
          </span>
        </div>

        <div class="modal-menu-item modal-static-card request-draft-next-card" aria-disabled="true">
          <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
            <strong>${t('modal.requestListing.next.publishTitle') || 'Choose how you want to go live next'}</strong><br>
            <small>${t('modal.requestListing.next.publishDesc') || 'In the paid step you can choose Visibility only or Promotion.'}</small>
          </span>
        </div>

        <div class="modal-actions">
          <button id="request-draft-next-publish" type="button" class="modal-body-button">
            ${t('modal.requestListing.next.publishCta') || 'Continue to publish'}
          </button>

          <button id="request-draft-next-later" type="button" class="modal-body-button">
            ${t('modal.requestListing.next.resumeCta') || 'Resume later'}
          </button>
        </div>
      </div>
    `
  });

  modal.querySelector('#request-draft-next-later')?.addEventListener('click', (ev) => {
    closeNextSteps(ev);
  });

  modal.querySelector('#request-draft-next-publish')?.addEventListener('click', async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    hideModal(id);

    if (!draftULID || !draftSessionId) {
      showToast(t('modal.requestListing.error') || 'Could not create draft.', 2400);
      if (shouldReturnToSelectLocation) showSelectLocationModal();
      return;
    }

    await showCampaignManagementModal(draftULID, {
      guest: true,
      p8Draft: draftMeta,
      preferEmptyDraft: true
    });
  });

  setupTapOutClose(id, closeNextSteps);
  showModal(id);
}

export function showHowItWorksModal() {
  const id = 'bo-howitworks-modal';
  document.getElementById(id)?.remove();
  createHowItWorksModal();
  showModal(id);
}

function getModalHeaderText(target) {
  const modal = typeof target === 'string'
    ? document.getElementById(target)
    : (target?.classList?.contains('modal') ? target : target?.closest?.('.modal'));
  if (!modal) return '';

  const titleNode = modal.querySelector('.modal-top-bar .modal-title, .modal-top-bar h1, .modal-top-bar h2');
  return String(titleNode?.textContent || '').trim();
}

function getModalHeaderHelpSpec(target) {
  const modalId = String(
    typeof target === 'string'
      ? target
      : target?.id || target?.closest?.('.modal')?.id || ''
  ).trim();

  if (
    !modalId ||
    modalId === 'bo-howitworks-modal' ||
    modalId === 'modal-header-help-modal' ||
    modalId === 'action-confirm-modal' ||
    modalId === 'location-profile-modal' ||
    modalId === 'bizcard-modal' ||
    modalId === 'qr-modal'
  ) {
    return null;
  }

  if (modalId === 'select-location-modal') {
    return {
      bodyLines: [
        `${_ownerText('root.bo.notListed.title', 'Create a location')} — ${_ownerText('root.bo.notListed.desc', 'Add your business.')}`,
        `${_ownerText('root.bo.googleImport.title', 'Import from Google')} — ${_ownerText('root.bo.googleImport.desc', 'Bring in your business details.')}`,
        `${_ownerText('root.bo.recent.title', 'Recently used')} — ${_ownerText('root.bo.recent.desc', 'View and manage your places.')}`,
        _ownerText('root.bo.selectLocation.search.idle.desc', 'Type at least 3 characters to search existing businesses.')
      ].map((line) => String(line || '').trim()).filter(Boolean),
      items: [
        {
          title: _ownerText('root.bo.selectLocation.help.taken.title', '🔴 Taken — already operated.'),
          desc: _ownerText('root.bo.selectLocation.help.taken.desc', 'This business is already operated and cannot be claimed here.')
        },
        {
          title: _ownerText('root.bo.selectLocation.help.free.title', '🟢 Free — available.'),
          desc: _ownerText('root.bo.selectLocation.help.free.desc', 'This business is available to set up in owner center.')
        },
        {
          title: _ownerText('root.bo.selectLocation.help.stillVisible.title', '🔵 Still visible — courtesy or hold.'),
          desc: _ownerText('root.bo.selectLocation.help.stillVisible.desc', 'This business remains visible for a short courtesy period.')
        },
        {
          title: _ownerText('root.bo.selectLocation.help.parked.title', '🟠 Parked — inactive.'),
          desc: _ownerText('root.bo.selectLocation.help.parked.desc', 'This business is inactive and currently not discoverable.')
        },
        {
          title: _ownerText('root.bo.selectLocation.help.promoted.title', '🎁 Promoted — active campaign.'),
          desc: _ownerText('root.bo.selectLocation.help.promoted.desc', 'This business is running an active campaign right now.')
        }
      ]
    };
  }
  
    if (modalId === 'request-listing-contexts-modal') {
    return {
      title: translatedOrFallback('modal.requestListing.contexts.help.title', 'How it works'),
      bodyLines: [
        translatedOrFallback('modal.requestListing.contexts.help.line1', 'Search the existing context catalog and choose the best matching paths for this business.'),
        translatedOrFallback('modal.requestListing.contexts.help.line2', 'You can select up to 3 contexts.'),
        translatedOrFallback('modal.requestListing.contexts.help.line3', 'Use Done to return to Request Listing.')
      ]
    };
  }
  
  if (modalId === 'request-listing-modal') {
    return {
      title: _ownerText('modal.help.title', 'How it works'),
      bodyLines: [
        _ownerText('modal.requestListing.note', 'Use this when your business does not appear in Select your business.'),
        _ownerText('modal.requestListing.help.line2', 'Complete the required business information first.'),
        _ownerText('modal.requestListing.contexts.help', 'Select up to 3 existing context paths.'),
        _ownerText('modal.requestListing.help.line4', 'Description, links, and media improve quality and publish readiness.')
      ].map((line) => String(line || '').trim()).filter(Boolean)
    };
  }

  if (modalId === 'request-listing-contexts-modal') {
    return {
      title: _ownerText('modal.requestListing.contexts.help.title', 'How it works'),
      bodyLines: [
        _ownerText('modal.requestListing.contexts.help.line1', 'Search the existing context catalog and choose the best matching paths for this business.'),
        _ownerText('modal.requestListing.contexts.help', 'Select up to 3 existing context paths.'),
        _ownerText('modal.requestListing.contexts.help.line3', 'Close returns you to Request Listing so you can keep editing the form.')
      ].map((line) => String(line || '').trim()).filter(Boolean)
    };
  }
  
  if (modalId === 'request-listing-modal') {
    return {
      title: _ownerText('modal.help.title', 'How it works'),
      bodyLines: [
        _ownerText('modal.requestListing.note', 'Use this when your business does not appear in Select your business.'),
        _ownerText('modal.requestListing.help.private', 'Saving creates a private draft only. It does not publish the location.'),
        _ownerText('modal.requestListing.help.paid', 'Publishing requires a paid plan. In the next step you can choose Visibility only or Promotion.'),
        _ownerText('modal.requestListing.help.resume', 'You can stop after saving and resume later from this device.')
      ].map((line) => String(line || '').trim()).filter(Boolean)
    };
  }

  if (modalId === 'location-draft-next-modal') {
    return {
      title: _ownerText('modal.help.title', 'How it works'),
      bodyLines: [
        _ownerText('modal.requestListing.help.private', 'Saving creates a private draft only. It does not publish the location.'),
        _ownerText('modal.requestListing.help.paid', 'Publishing requires a paid plan. In the next step you can choose Visibility only or Promotion.'),
        _ownerText('modal.requestListing.help.resume', 'You can stop after saving and resume later from this device.')
      ].map((line) => String(line || '').trim()).filter(Boolean)
    };
  }

  if (modalId === 'import-google-location-modal') {
    return {
      title: _ownerText('modal.help.title', 'How it works'),
      bodyLines: [
        `${_ownerText('root.bo.googleImport.title', 'Import from Google')} — ${_ownerText('root.bo.googleImport.desc', 'Bring in your business details.')}`,
        'Find your business with Google’s free Place ID Finder.',
        'Select the whole ID, keep every hyphen exactly as shown, and on mobile press and hold to copy.',
        'This puts you onto the same draft path as Create a location.'
      ],
      buttons: [
        {
          label: 'Open Place ID Finder',
          href: 'https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder'
        }
      ]
    };
  }

  if (modalId === 'owner-center-modal') {
    const ownerCenterBody = _ownerText(
      'owner.center.help.body',
      'Owner access for the listings you can manage is stored on this device.\nThe currently active listing is marked ⚡.\nTo manage one of them, tap the listing you want below.\nTo add another listing to this device, use 🔑 Restore owner access.\nLook for the Stripe payment confirmation email or receipt for that listing.\nOpen it, copy the Payment ID (pi_...), then paste it into Restore access.'
    );

    return {
      title: _ownerText('owner.center.help.title', 'How it works'),
      bodyLines: ownerCenterBody.split(/\n+/).map(s => String(s || '').trim()).filter(Boolean)
    };
  }

  if (modalId === 'campaign-management-modal') {
    const currentTitle = getModalHeaderText(target);
    if (/publish setup/i.test(String(currentTitle || ''))) {
      return {
        title: _ownerText('modal.help.title', 'How it works'),
        bodyLines: [
          _ownerText('locationDraft.publishSetup.savedDesc', 'The next step is publish and requires payment.'),
          _ownerText('locationDraft.publishSetup.publishDesc', 'The paid step sets up publish entitlement. Promotion remains optional after that.'),
          'Changes are saved automatically while you work.'
        ].map(s => String(s || '').trim()).filter(Boolean)
      };
    }

    const campaignMgmtBody = _ownerText(
      'campaign.ui.help.body',
      'Create or edit a campaign for this location.\nChanges are saved automatically while you work.\nYour campaign becomes active only after checkout.'
    );

    return {
      title: _ownerText('campaign.ui.help.title', 'How it works'),
      bodyLines: campaignMgmtBody.split(/\n+/).map(s => String(s || '').trim()).filter(Boolean)
    };
  }

  return {
    title: _ownerText('modal.help.title', 'How it works'),
    bodyLines: []
  };
}

function showModalHeaderHelpModal(target) {
  const modal = typeof target === 'string'
    ? document.getElementById(target)
    : (target?.classList?.contains('modal') ? target : target?.closest?.('.modal'));
  if (!modal) return;

  const spec = getModalHeaderHelpSpec(modal);
  if (!spec) return;

  const id = 'modal-header-help-modal';
  document.getElementById(id)?.remove();

  const sourceTitle = getModalHeaderText(modal);
  const helpTitle = String(spec.title || _ownerText('modal.help.title', 'How it works')).trim() || 'How it works';
  const title = sourceTitle || helpTitle;

  const helpModal = injectModal({
    id,
    title,
    layout: 'menu',
    bodyHTML: ''
  });

  setupTapOutClose(id);

  const inner = helpModal.querySelector('.modal-body-inner');
  if (!inner) {
    showModal(id);
    return;
  }

  inner.innerHTML = '';

  const intro = String(spec.intro || '').trim();
  const items = Array.isArray(spec.items) ? spec.items.filter(Boolean) : [];
  const bodyLines = Array.isArray(spec.bodyLines) ? spec.bodyLines.filter(Boolean) : [];
  const buttons = Array.isArray(spec.buttons) ? spec.buttons.filter(Boolean) : [];

  if (intro) {
    const p = document.createElement('p');
    p.textContent = intro;
    p.style.textAlign = 'left';
    p.style.margin = '0';
    p.style.opacity = '0.92';
    inner.appendChild(p);
  }

  const lines = bodyLines.length
    ? bodyLines
    : (!items.length ? [_ownerText('modal.help.empty', 'Guidance for this step is coming soon.')] : []);

  lines.forEach((line, idx) => {
    const p = document.createElement('p');
    p.textContent = line;
    p.style.textAlign = 'left';
    p.style.margin = idx === 0 && !intro ? '0' : '10px 0 0';
    p.style.opacity = '0.92';
    inner.appendChild(p);
  });

  if (items.length) {
    const list = document.createElement('div');
    list.className = 'modal-menu-list';
    list.style.marginTop = (intro || lines.length) ? '12px' : '0';

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'modal-menu-item modal-static-card';
      row.innerHTML = `
        <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
          <span style="font-weight:600;">${String(item?.title || '').trim()}</span><br>
          <small>${String(item?.desc || '').trim()}</small>
        </span>
      `;
      list.appendChild(row);
    });

    inner.appendChild(list);
  }

  if (buttons.length) {
    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    buttons.forEach((item) => {
      const href = String(item?.href || '').trim();
      const label = String(item?.label || '').trim();
      if (!href || !label) return;

      const linkBtn = document.createElement('a');
      linkBtn.className = 'modal-body-button';
      linkBtn.href = href;
      linkBtn.target = '_blank';
      linkBtn.rel = 'noopener noreferrer';
      linkBtn.textContent = label;
      actions.appendChild(linkBtn);
    });

    if (actions.childElementCount) inner.appendChild(actions);
  }

  showModal(id);
}

function ensureModalTopActions(target) {
  const topBar = target?.classList?.contains('modal-top-bar')
    ? target
    : target?.querySelector?.('.modal-top-bar');
  if (!topBar) return null;

  let actions = topBar.querySelector('.modal-top-actions');
  if (actions) return actions;

  const closeBtn = topBar.querySelector('.modal-close');
  if (!closeBtn) return null;

  actions = document.createElement('div');
  actions.className = 'modal-top-actions';
  topBar.insertBefore(actions, closeBtn);
  actions.appendChild(closeBtn);
  return actions;
}

function syncModalHeaderHelp(target) {
  const modal = typeof target === 'string'
    ? document.getElementById(target)
    : (target?.classList?.contains('modal') ? target : target?.closest?.('.modal'));
  if (!modal) return null;

  const topBar = modal.querySelector('.modal-top-bar');
  if (!topBar) return null;

  const spec = getModalHeaderHelpSpec(modal);
  let actions = topBar.querySelector('.modal-top-actions');
  const closeBtn = actions?.querySelector('.modal-close') || topBar.querySelector('.modal-close');

  if (!spec) {
    actions?.querySelector('.modal-header-help')?.remove();

    if (actions && closeBtn) {
      topBar.appendChild(closeBtn);
      actions.remove();
    }

    return closeBtn || null;
  }

  actions = ensureModalTopActions(topBar);
  if (!actions) return null;

  let btn = actions.querySelector('.modal-header-help');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modal-header-help';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      showModalHeaderHelpModal(modal);
    });
    actions.insertBefore(btn, actions.firstChild || null);
  }

  const helpLabel = String(spec.title || _ownerText('modal.help.title', 'How it works')).trim() || 'How it works';
  btn.setAttribute('aria-label', helpLabel);
  btn.title = helpLabel;
  btn.textContent = 'ℹ️';

  return btn;
}

function createHowItWorksModal() {
  const id = 'bo-howitworks-modal';
  document.getElementById(id)?.remove();

  const modal = injectModal({
    id,
    title: t('bo.howItWorks.title') || 'How it works',
    layout: 'menu',
    bodyHTML: '' // fill inner below
  });

  const inner = modal.querySelector('.modal-body-inner');
  if (!inner) return;

  inner.innerHTML = `
    <div class="howitworks">
      <details class="howitworks-sec">
        <summary class="modal-menu-item howitworks-card">
          <span class="icon-img">💶</span>
          <span class="label"><strong>${t('bo.hiw.run.title') || 'Run a campaign · from €50'}</strong></span>
          <span class="chevron" aria-hidden="true"></span>
        </summary>
        <div class="howitworks-body">
          <div class="howitworks-sub">${t('bo.hiw.run.sub') || 'Promotion, analytics, and operational control.'}</div>
          <div>${t('bo.hiw.run.b1') || '🎁 Active promotion — your offer is actively distributed across NaviGen'}</div>
          <div>${t('bo.hiw.run.b2') || '📈 Analytics — see how people interact with your business across discovery and engagement'}</div>
          <div>${t('bo.hiw.run.b3') || '🔴 Operational control — your business is the active operator for this location during the campaign'}</div>
        </div>
      </details>

      <details class="howitworks-sec">
        <summary class="modal-menu-item howitworks-card">
          <span class="icon-img">💸</span>
          <span class="label"><strong>${t('bo.hiw.spend.title') || 'How spending works'}</strong></span>
          <span class="chevron" aria-hidden="true"></span>
        </summary>
        <div class="howitworks-body">
          <div class="howitworks-sub">${t('bo.hiw.spend.sub') || 'When budget is used and when it isn’t.'}</div>
          <div>${t('bo.hiw.spend.b1') || '• Your campaign budget is fully committed to the campaign period'}</div>
          <div>${t('bo.hiw.spend.b2') || '• Your campaign runs for the selected period without additional usage fees'}</div>
          <div>${t('bo.hiw.spend.b3') || '• There are no rolling balances, cash-outs, or follow-up charges'}</div>
        </div>
      </details>

      <details class="howitworks-sec">
        <summary class="modal-menu-item howitworks-card">
          <span class="icon-img">🎯</span>
          <span class="label"><strong>${t('bo.hiw.own.title') || 'Campaign and ownership'}</strong></span>
          <span class="chevron" aria-hidden="true"></span>
        </summary>
        <div class="howitworks-body">
          <div class="howitworks-sub">${t('bo.hiw.own.sub') || 'How promotion and control relate.'}</div>
          <div>${t('bo.hiw.own.b1') || '🎁 Campaign — promotion and analytics for 30 days'}</div>
          <div>${t('bo.hiw.own.b2') || '🔴 Ownership — exclusive operation for a limited time'}</div>
          <div class="howitworks-note">${t('bo.hiw.own.note') || 'A campaign starts both. Both end automatically.'}</div>
        </div>
      </details>

      <details class="howitworks-sec">
        <summary class="modal-menu-item howitworks-card">
          <span class="icon-img">🔵</span>
          <span class="label"><strong>${t('bo.hiw.after.title') || 'After your campaign ends'}</strong></span>
          <span class="chevron" aria-hidden="true"></span>
        </summary>
        <div class="howitworks-body">
          <div class="howitworks-sub">${t('bo.hiw.after.sub') || 'What remains visible and for how long.'}</div>
          <div>${t('bo.hiw.after.b1') || '• Your location stays visible for a 60-day courtesy period'}</div>
          <div>${t('bo.hiw.after.b2') || '• Promotion pauses and analytics access stops'}</div>
        </div>
      </details>

      <details class="howitworks-sec">
        <summary class="modal-menu-item howitworks-card">
          <span class="icon-img">🔐</span>
          <span class="label"><strong>${t('bo.hiw.deviceControl.title') || 'Managing access on this device'}</strong></span>
          <span class="chevron" aria-hidden="true"></span>
        </summary>
        <div class="howitworks-body">
          <div class="howitworks-sub">${t('bo.hiw.deviceControl.sub') || 'Understand what each access action does.'}</div>

          <div><strong>${t('bo.hiw.deviceControl.restore.title') || '🔑 Restore access'}</strong></div>
          <div>${t('bo.hiw.deviceControl.restore.b1') || 'Adds a business to this device'}</div>
          <div>${t('bo.hiw.deviceControl.restore.b2') || 'Restores the owner session'}</div>
          <div>${t('bo.hiw.deviceControl.restore.b3') || 'Does not create ownership'}</div>
          <div>${t('bo.hiw.deviceControl.restore.b4') || 'Does not extend ownership'}</div>

          <div style="height:12px;"></div>

          <div><strong>${t('bo.hiw.deviceControl.remove.title') || '🗑️ Remove from Owner center'}</strong></div>
          <div>${t('bo.hiw.deviceControl.remove.b1') || 'Removes this business from this device’s saved list'}</div>
          <div>${t('bo.hiw.deviceControl.remove.b2') || 'Does not affect ownership globally'}</div>
          <div>${t('bo.hiw.deviceControl.remove.b3') || 'If active, also clears the active session'}</div>

          <div style="height:12px;"></div>

          <div><strong>${t('bo.hiw.deviceControl.signout.title') || '🧹 Sign out on this device'}</strong></div>
          <div>${t('bo.hiw.deviceControl.signout.b1') || 'Clears the active session only'}</div>
          <div>${t('bo.hiw.deviceControl.signout.b2') || 'Keeps the business saved in Owner center'}</div>
          <div>${t('bo.hiw.deviceControl.signout.b3') || 'Equivalent to logging out'}</div>
        </div>
      </details>

      <details class="howitworks-sec">
        <summary class="modal-menu-item howitworks-card">
          <span class="icon-img">❌</span>
          <span class="label"><strong>${t('bo.hiw.notsell.title') || 'What NaviGen does not sell'}</strong></span>
          <span class="chevron" aria-hidden="true"></span>
        </summary>
        <div class="howitworks-body">
          <div class="howitworks-sub">${t('bo.hiw.notsell.sub') || 'No hidden products or lock-ins.'}</div>
          <div>${t('bo.hiw.notsell.b1') || '• Permanent ownership'}</div>
          <div>${t('bo.hiw.notsell.b2') || '• Subscriptions or access fees'}</div>
          <div>${t('bo.hiw.notsell.b3') || '• Pay-to-exist listings'}</div>
        </div>
      </details>
    </div>
  `;

  const pricingBtn = document.createElement('button');
  pricingBtn.type = 'button';
  pricingBtn.className = 'modal-menu-item';
  pricingBtn.style.marginTop = '14px';
  pricingBtn.innerHTML = `
    <span class="icon-img">💳</span>
    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
      <strong>${t('bo.pricing.title') || 'Pricing & policies'}</strong><br>
      <small>${t('bo.pricing.desc') || 'Full details, timelines, and edge cases.'}</small>
    </span>
  `;
  pricingBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPricingPoliciesModal();
  });
  inner.appendChild(pricingBtn);

  // Accordion behavior: keep only one section open at a time
  const secs = inner.querySelectorAll('details.howitworks-sec');
  secs.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      secs.forEach((other) => { if (other !== d) other.open = false; });
    });
  });

  // Desktop ESC support (scoped + self-cleaning)
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      hideModal(id);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  setupTapOutClose(id);
}

export function showPricingPoliciesModal() {
  const id = 'bo-pricing-modal';
  document.getElementById(id)?.remove();
  createPricingPoliciesModal();
  showModal(id);
}

function createPricingPoliciesModal() {
  const id = 'bo-pricing-modal';

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-layout';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';
  top.innerHTML = `
    <h2 class="modal-title">${t('bo.pricing.title') || 'Pricing & policies'}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;
  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(id));

  const body = document.createElement('div');
  body.className = 'modal-body';
  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';
  inner.innerHTML = `
    <p style="opacity:.85; margin:0;">
      ${t('bo.pricing.stub') || 'Coming next: the full Pricing & policies page (timelines, ownership rules, courtesy, restore, and examples).'}
    </p>
  `;

  body.appendChild(inner);
  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  setupTapOutClose(id);
}

// Campaign selection: resolve active campaignKey via /api/status (KV-authoritative).
// Reason: Owner Settings needs a deterministic campaignKey without reading /data/campaigns.json.
export async function resolveCampaignKeyForLocation(locationID) {
  const slug = String(locationID || '').trim();
  if (!slug) return '';

  try {
    const u = new URL('/api/status', location.origin);
    u.searchParams.set('locationID', slug);

    const r = await fetch(u.toString(), { cache: 'no-store', credentials: 'include' });
    if (!r.ok) return '';

    const j = await r.json().catch(() => null);
    return String((j?.activeCampaignKey || (Array.isArray(j?.activeCampaignKeys) ? j.activeCampaignKeys.find(Boolean) : '')) || '').trim();
  } catch {
    return '';
  }
}

// Campaign funding modal (legacy path); maps preset EUR values to planCode for handleCampaignCheckout().
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
    <div class="campaign-funding-warning">${(typeof t === 'function' && t('campaign.funding.minNotice')) || 'Minimum campaign funding is €69.'}</div>
    <div class="campaign-funding-warning">${(typeof t === 'function' && t('campaign.funding.stripeNote')) || 'Checkout is processed by Stripe. A payment confirmation email will be sent to you.'}</div>
    <div class="campaign-funding-spacer"></div>
    <div class="campaign-funding-chips">
      <button type="button" class="campaign-funding-chip is-selected" data-eur="69">€69</button>
      <button type="button" class="campaign-funding-chip" data-eur="79">€79</button>
      <button type="button" class="campaign-funding-chip" data-eur="179">€179</button>
      <button type="button" class="campaign-funding-chip" data-eur="349">€349</button>
      <button type="button" class="campaign-funding-chip" data-eur="749">€749</button>
    </div>

    <div class="campaign-funding-input-row">
      <label class="campaign-funding-label" for="campaign-funding-eur">
        ${(typeof t === 'function' && t('campaign.funding.amountLabel')) || 'Amount (EUR)'}
      </label>
      <input id="campaign-funding-eur" class="campaign-funding-input" inputmode="numeric" pattern="[0-9]*" value="69" />
    </div>

    <div class="modal-actions">
      <button type="button" class="modal-body-button" id="campaign-funding-continue">
        ${(typeof t === 'function' && t('campaign.funding.continue')) || 'Continue to payment'}
      </button>
    </div>
  `;

  const eurInput = inner.querySelector('#campaign-funding-eur');
  const continueBtn = inner.querySelector('#campaign-funding-continue');
  const MIN_EUR = 69; // PRODUCTION: €69 minimum

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
    if (!applyFundingValidity()) { showToast('Minimum is €1.', 1800); return; } const eur = Math.floor(Number(String(eurInput.value || '').trim()));
    if (!Number.isFinite(eur) || eur <= 0) { showToast('Enter a valid EUR amount.', 1800); return; }

    const planCode = eur >= 749 ? 'network' : eur >= 349 ? 'large' : eur === 2 ? 'multi' : 'standard';

    await handleCampaignCheckout({
      locationID: String(locationID || '').trim(),
      campaignKey: String(campaignKey || '').trim(),
      planCode,
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

export function createOwnerSettingsModal({ variant, locationIdOrSlug, locationName, noSelection }) {
  const id = 'owner-settings-modal';
  document.getElementById(id)?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'modal hidden';
  wrap.id = id;

  const card = document.createElement('div');
  card.className = 'modal-content modal-menu';

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

  // Use a mutable location id so ULID → slug resolution can update downstream actions safely.
  let locId = String(locationIdOrSlug || '').trim();

  // Selected + Active context cards (informational, non-clickable)
  const hasSelection = (noSelection !== true) && !!String(locationIdOrSlug || '').trim();
  const selectedKey = hasSelection ? String(locId || '').trim() : '';

  const selectedName = hasSelection ? (String(locationName || '').trim() || '—') : '—';
  const selectedId = selectedKey || '—';

  const selectedCard = document.createElement('div');
  selectedCard.className = 'modal-menu-item os-context-card os-selected';
  selectedCard.innerHTML = `
    <span class="icon-img" aria-hidden="true">📍</span>
    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
      <strong>${_ownerText('owner.settings.header.selected', 'Selected business')}</strong><br>      
      <small>${selectedName}</small><br>
      <small>${selectedId}</small>
    </span>
  `;
  inner.appendChild(selectedCard);
  
  const activeCard = document.createElement('div');
  activeCard.className = 'modal-menu-item os-context-card os-active';
  activeCard.innerHTML = `
    <span class="icon-img" aria-hidden="true">✅</span>
    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
      <strong>${_ownerText('owner.settings.header.active', 'Active on this device')}</strong><br>      
      <small>—</small><br>
      <small>—</small>
    </span>
  `;
  inner.appendChild(activeCard);

  const ownerImmediateNote = document.createElement('div');
  ownerImmediateNote.className = 'campaign-inline-note owner-immediate-note';
  ownerImmediateNote.style.marginBottom = '10px';
  ownerImmediateNote.style.display = 'none';
  inner.appendChild(ownerImmediateNote);
  
  // Resolve current device session (if any) and fill Active card
  (async () => {
    try {
      const restoreHintUlid = String(sessionStorage.getItem('ng_owner_restore_ulid') || '').trim();
      const restoreHintUntil = Number(sessionStorage.getItem('ng_owner_restore_until') || '0');

      const rr = await fetch('/api/_diag/opsess', { cache: 'no-store', credentials: 'include' });
      const jj = rr.ok ? await rr.json().catch(() => null) : null;
      const activeUlid = String(jj?.ulid || '').trim();

      try {
        const fallbackUlid =
          restoreHintUntil > Date.now() && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(restoreHintUlid)
            ? restoreHintUlid
            : '';
        const noticeUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(activeUlid) ? activeUlid : fallbackUlid;

        if (noticeUlid) {
          const inheritedImmediateKey = `ng_inherited_notice_immediate:${noticeUlid}`;
          const inheritedInlineKey = `ng_inherited_notice_inline:${noticeUlid}`;
          const legacyInheritedUntil = Number(sessionStorage.getItem('ng_inherited_notice_until') || '0');
          const legacyInheritedRows = legacyInheritedUntil > Date.now()
            ? Math.max(0, Number(sessionStorage.getItem('ng_inherited_notice_added_rows') || '0') || 0)
            : 0;

          let inheritedImmediateRows = Math.max(
            0,
            Number(sessionStorage.getItem(inheritedImmediateKey) || '0') || 0,
            Number(sessionStorage.getItem(inheritedInlineKey) || '0') || 0,
            legacyInheritedRows
          );

          if (!inheritedImmediateRows && fallbackUlid === noticeUlid) {
            let blockedRows = 0;

            for (let attempt = 0; attempt < 2; attempt += 1) {
              const rr2 = await fetch('/api/owner/campaigns', {
                cache: 'no-store',
                credentials: 'include'
              });
              const jj2 = rr2.ok ? await rr2.json().catch(() => null) : null;

              inheritedImmediateRows = Math.max(
                0,
                Number(jj2?.inheritedNotice?.addedRows || 0) || 0
              );
              blockedRows = Math.max(
                0,
                Number(jj2?.inheritedNotice?.blockedRows || 0) || 0
              );

              if (inheritedImmediateRows > 0 || blockedRows > 0 || attempt === 1) break;
              await new Promise((resolve) => setTimeout(resolve, 250));
            }

            if (inheritedImmediateRows > 0) {
              sessionStorage.setItem(inheritedImmediateKey, String(inheritedImmediateRows));
              sessionStorage.setItem(inheritedInlineKey, String(inheritedImmediateRows));
              sessionStorage.removeItem('ng_owner_restore_ulid');
              sessionStorage.removeItem('ng_owner_restore_until');
            } else if (blockedRows > 0) {
              sessionStorage.removeItem('ng_owner_restore_ulid');
              sessionStorage.removeItem('ng_owner_restore_until');
            }
          }

          if (inheritedImmediateRows > 0) {
            sessionStorage.removeItem(inheritedImmediateKey);
            sessionStorage.removeItem('ng_inherited_notice_added_rows');
            sessionStorage.removeItem('ng_inherited_notice_until');

            const immediateMsg =
              inheritedImmediateRows === 1
                ? ((typeof t === 'function' && t('campaign.ui.inherited.one')) || '1 location was added to this campaign automatically.')
                : ((typeof t === 'function' && t('campaign.ui.inherited.many')) || `${inheritedImmediateRows} locations were added to this campaign automatically.`);

            ownerImmediateNote.textContent = immediateMsg;
            ownerImmediateNote.style.display = '';
          } else if (restoreHintUntil <= Date.now()) {
            sessionStorage.removeItem('ng_owner_restore_ulid');
            sessionStorage.removeItem('ng_owner_restore_until');
          }
        }
      } catch {}

      if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(activeUlid)) return;

      // Default to ULID until we resolve slug/name
      const aNameBox = activeCard.querySelectorAll('small')[0];
      const aIdBox   = activeCard.querySelectorAll('small')[1];
      if (aNameBox) aNameBox.textContent = activeUlid;
      if (aIdBox)   aIdBox.textContent   = activeUlid;

      const ir = await fetch(`https://navigen-api.4naama.workers.dev/api/data/item?id=${encodeURIComponent(activeUlid)}`, { cache: 'no-store' });
      const ij = ir.ok ? await ir.json().catch(() => null) : null;

      const slug = String(ij?.locationID || '').trim();
      const ln = ij?.locationName;
      const nm =
        (ln && typeof ln === 'object')
          ? String(ln.en || Object.values(ln)[0] || '').trim()
          : String(ln || '').trim();

      if (aNameBox && nm) aNameBox.textContent = nm;
      if (aIdBox && slug) aIdBox.textContent = slug;

      // If there is no explicit Selected business yet, mirror Active into Selected for clearer UX.
      if (!selectedKey) {
        const selSmalls = selectedCard.querySelectorAll('small');
        const selNameBox = selSmalls[0] || null;
        const selIdBox = selSmalls[1] || null;

        if (selNameBox && nm) selNameBox.textContent = nm;
        if (selIdBox && (slug || activeUlid)) selIdBox.textContent = slug || activeUlid;
        if (!locId) locId = slug || activeUlid;
      }

      // Mismatch detection: Selected ≠ Active
      try {
        const selRaw = String(selectedKey || locId || '').trim();                
        const hasSelected = !!selRaw;

        // Compare using ULID (canonical), not slug, to avoid false mismatch during slug/ULID resolution.
        let selUlid = '';
        if (selRaw && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(selRaw)) {
          selUlid = selRaw;
        } else if (selRaw) {
          // Resolve slug → ULID (uses /api/status; already in this module)
          selUlid = await resolveULIDFor(selRaw);
        }

        const actUlid = String(activeUlid || '').trim();
        const hasActive = !!actUlid;

        let isMismatch = false;
        let isNeedsAccess = false;

        let activeSlug = String(slug || '').trim();
        if (!activeSlug && actUlid) {
          try { activeSlug = String(localStorage.getItem(`navigen.slug:${actUlid}`) || '').trim(); } catch {}
        }

        const sameByUlid = !!selUlid && !!actUlid && selUlid === actUlid;
        const sameBySlug = !!selRaw && !!activeSlug && selRaw === activeSlug;
        const isMatch = hasSelected && hasActive && (sameByUlid || sameBySlug);

        // Only evaluate mismatch when a location is explicitly selected
        if (hasSelected) {
          if (!hasActive) {
            isNeedsAccess = true;
          } else if (!isMatch && selUlid && actUlid && selUlid !== actUlid) {
            isMismatch = true;
          }
        }

        if (isMismatch || isNeedsAccess) {
          selectedCard.classList.add('os-mismatch');
          activeCard.classList.add('os-mismatch');
          selectedCard.classList.remove('os-match');
          activeCard.classList.remove('os-match');
        } else {
          selectedCard.classList.remove('os-mismatch');
          activeCard.classList.remove('os-mismatch');

          if (isMatch) {
            selectedCard.classList.add('os-match');
            activeCard.classList.add('os-match');
          } else {
            selectedCard.classList.remove('os-match');
            activeCard.classList.remove('os-match');
          }
        }

        // If the modal was opened as "mismatch" but Selected == Active, suppress the mismatch explanation
        const mismatchExpl = wrap.querySelector('[data-mismatch-expl="1"]');
        if (mismatchExpl) {
          mismatchExpl.style.display = isMismatch ? '' : 'none';
        }
      } catch {}
    } catch {}
  })();

  // If Selected is a ULID (Owner center entry), resolve to slug/name and update the Selected card display.
  (async () => {
    const u = String(selectedKey || '').trim();
    if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(u)) return;

    try {
      const rr = await fetch(
        `https://navigen-api.4naama.workers.dev/api/data/item?id=${encodeURIComponent(u)}`,
        { cache: 'no-store' }
      );
      const jj = rr.ok ? await rr.json().catch(() => null) : null;

      const resolvedSlug = String(
        jj?.locationID || jj?.locationSlug || jj?.slug || jj?.alias || ''
      ).trim();
      const ln = jj?.locationName;
      const resolvedName =
        (ln && typeof ln === 'object')
          ? String(ln.en || Object.values(ln)[0] || '').trim()
          : String(ln || '').trim();

      const selSmalls = selectedCard.querySelectorAll('small');
      const selNameBox = selSmalls[0] || null;
      const selIdBox = selSmalls[1] || null;

      // Display: name + slug (do not change selectedKey; it stays ULID for canonical comparisons)
      if (selNameBox && resolvedName) selNameBox.textContent = resolvedName;
      if (selIdBox && resolvedSlug) selIdBox.textContent = resolvedSlug;
    } catch {}
  })();

  const expl = document.createElement('p');

  // Variant-specific explanation (avoid false mismatch messaging)
  let rawExpl = '';
  if (variant === 'restore') {
    rawExpl = _ownerText(
      'owner.settings.restore.explain',
      'Owner access for this listing is not active on this device yet.\nUse 🔑 Restore owner access to add it here, or run a campaign 🎯 if access has not been set up yet.'      
    );
  } else if (variant === 'mismatch') {
    rawExpl = _ownerText(
      'owner.settings.mismatch.explain',
      'This device is currently active for a different listing.\n\nTo manage the selected listing here, open Owner center and switch this device to that listing.'      
    );
  } else if (variant === 'renew') {
    rawExpl = _ownerText(
      'owner.settings.renew.explain',
      'Owner access is active on this device, but this location is not running an active campaign right now. Run a campaign to activate analytics and campaign controls.'
    );
  } else if (variant === 'claim') {
    rawExpl = _ownerText(
      'owner.settings.claim.explain',
      'Owner access to the selected location isn’t set up on this device yet.\nRun a campaign 🎯 for this location. Owner access 🔑 will be stored on this device after checkout.'
    );
  } else {
    // signedin (and any future variants): no warning headline
    rawExpl = _ownerText(
      'owner.settings.signedin.explain',
      'Manage analytics or campaigns for this location below.'
    );
  }

  expl.textContent = String(rawExpl).replace(/\\n/g, '\n');

  expl.style.textAlign = 'left';
  expl.style.whiteSpace = 'pre-line';
  if (variant === 'mismatch') expl.setAttribute('data-mismatch-expl', '1');
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
      title: _ownerText('owner.settings.restore.access.title', 'Restore owner access'),
      desc: _ownerText('owner.settings.restore.access.desc', 'Restore access to manage dashboards and campaigns on this device.'),
      onClick: () => {
        hideModal(id);
        showRestoreAccessModal();
      }
    });

    addItem({
      id: 'owner-run-campaign',
      icon: '🎯',
      title: _ownerText('owner.settings.restore.runCampaign.title', 'Run a campaign'),
      desc: _ownerText('owner.settings.restore.runCampaign.desc', 'Start a campaign for this location.'),
      onClick: () => {
        hideModal(id);
        const target = String(locId || selectedKey || '').trim();
        if (target) showCampaignManagementModal(target, { guest: true });
      }
    });

    addItem({
      id: 'owner-center',
      icon: '🧩️',
      title: _ownerText('owner.center.title', 'Owner center'),
      desc: _ownerText('root.bo.ownerCenter.desc', 'Choose which listing is active on this device.'),      
      onClick: () => {
        hideModal(id);
        showOwnerCenterModal();
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
    
  } else if (variant === 'signedin') {
    addItem({
      id: 'owner-open-dash',
      icon: '📈',
      title: _ownerText('owner.settings.signedin.openDash.title', 'Open dashboard'),
      desc: _ownerText('owner.settings.signedin.openDash.desc', 'View analytics and owner controls for this location.'),
      onClick: () => {
        hideModal(id);
        const seg = String(locId || '').trim();
        window.open(`https://navigen.io/dash/${encodeURIComponent(seg)}`, '_blank', 'noopener,noreferrer');
      }
    });

    addItem({
      id: 'owner-manage-campaign',
      icon: '🎯',
      title: _ownerText('owner.settings.signedin.runCampaign.title', 'Manage campaign'),
      desc: _ownerText('owner.settings.signedin.runCampaign.desc', 'Edit draft ✍️, checkout 💳, or manage this campaign.'),
      onClick: () => {
        hideModal(id);
        showCampaignManagementModal(String(locId || '').trim());
      }
    });

    addItem({
      id: 'owner-center',
      icon: '🧩',
      title: _ownerText('owner.settings.restore.ownerCenter.title', 'Owner center'),
      desc: _ownerText('owner.settings.restore.ownerCenter.desc', 'Choose which listing is active on this device.'),      
      onClick: () => {
        hideModal(id);
        showOwnerCenterModal();
      }
    });

    addItem({
      id: 'owner-example-dash',
      icon: '📈',
      title: _ownerText('owner.settings.restore.exampleDash.title', 'See example dashboards'),
      desc: _ownerText('owner.settings.restore.exampleDash.desc', 'View analytics for designated example locations.'),
      onClick: () => {
        hideModal(id);
        showExampleDashboardsModal();
      }
    });

    addItem({
      id: 'owner-clear-session',
      icon: '🧹',
      title: _ownerText('dash.blocked.clearSession.title', 'Sign out on this device'),
      desc: _ownerText('dash.blocked.clearSession.desc', 'Clear the active owner session from this device.'),
      onClick: () => {
        showActionConfirmModal({
          title: (typeof t === 'function' && t('owner.signout.confirmTitle')) || 'Sign out on this device?',
          bodyLines: [
            (typeof t === 'function' && t('owner.signout.confirmBody1')) || 'This clears the active owner session on this device.',
            (typeof t === 'function' && t('owner.signout.confirmBody2')) || 'Ownership is not affected.',
            (typeof t === 'function' && t('owner.signout.confirmBody3')) || 'You can restore access again anytime using your Stripe receipt (pi_…).'
          ],
          confirmLabel: (typeof t === 'function' && t('owner.signout.confirmCta')) || 'Sign out',
          danger: true,
          onConfirm: async () => {
            window.location.href = `/owner/clear-session?next=${encodeURIComponent('/')}`;
          }
        });
      }
    });

  } else if (variant === 'renew') {
    addItem({
      id: 'owner-run-campaign',
      icon: '🎯',
      title: _ownerText('owner.settings.renew.runCampaign.title', 'Run a campaign'),
      desc: _ownerText('owner.settings.renew.runCampaign.desc', 'Start or renew a campaign for this location.'),
      onClick: () => {
        hideModal(id);
        const target = String(locId || selectedKey || '').trim();
        if (target) showCampaignManagementModal(target);
      }
    });

    addItem({
      id: 'owner-center',
      icon: '🧩',
      title: _ownerText('owner.center.title', 'Owner center'),
      desc: _ownerText('root.bo.ownerCenter.desc', 'Choose which listing is active on this device.'),
      onClick: () => {
        hideModal(id);
        showOwnerCenterModal();
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

    addItem({
      id: 'owner-clear-session',
      icon: '🧹',
      title: _ownerText('dash.blocked.clearSession.title', 'Sign out on this device'),
      desc: _ownerText('dash.blocked.clearSession.desc', 'Clear the active owner session from this device.'),
      onClick: () => {
        showActionConfirmModal({
          title: (typeof t === 'function' && t('owner.signout.confirmTitle')) || 'Sign out on this device?',
          bodyLines: [
            (typeof t === 'function' && t('owner.signout.confirmBody1')) || 'This clears the active owner session on this device.',
            (typeof t === 'function' && t('owner.signout.confirmBody2')) || 'Ownership is not affected.',
            (typeof t === 'function' && t('owner.signout.confirmBody3')) || 'You can restore access again anytime using your Stripe receipt (pi_…).'
          ],
          confirmLabel: (typeof t === 'function' && t('owner.signout.confirmCta')) || 'Sign out',
          danger: true,
          onConfirm: async () => {
            window.location.href = `/owner/clear-session?next=${encodeURIComponent('/')}`;
          }
        });
      }
    });
  } else if (variant === 'mismatch') {
    addItem({
      id: 'owner-center',
      icon: '🧩',
      title: _ownerText('owner.center.title', 'Owner center'),
      desc: _ownerText('root.bo.ownerCenter.desc', 'Choose which listing is active on this device.'),      
      onClick: () => {
        hideModal(id);
        showOwnerCenterModal();
      }
    });

    addItem({
      id: 'owner-clear-session',
      icon: '🧹',
      title: _ownerText('dash.blocked.clearSession.title', 'Sign out on this device'),
      desc: _ownerText('dash.blocked.clearSession.desc', 'Clear the active owner session from this device.'),
      onClick: () => {
        showActionConfirmModal({
          title: (typeof t === 'function' && t('owner.signout.confirmTitle')) || 'Sign out on this device?',
          bodyLines: [
            (typeof t === 'function' && t('owner.signout.confirmBody1')) || 'This clears the active owner session on this device.',
            (typeof t === 'function' && t('owner.signout.confirmBody2')) || 'Ownership is not affected.',
            (typeof t === 'function' && t('owner.signout.confirmBody3')) || 'You can restore access again anytime using your Stripe receipt (pi_…).'
          ],
          confirmLabel: (typeof t === 'function' && t('owner.signout.confirmCta')) || 'Sign out',
          danger: true,
          onConfirm: async () => {
            window.location.href = `/owner/clear-session?next=${encodeURIComponent('/')}`;
          }
        });
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
      desc: _ownerText('owner.settings.claim.runCampaign.desc', 'Run a campaign for this location.'),
      onClick: () => {
        (async () => {
          hideModal(id);

          const slug = String(locId || '').trim();
          if (!slug) return;

          // Claim flow (no owner session): use existing funding modal / public checkout path.
          // This keeps UX correct for unowned locations.
          let campaignKey = await resolveCampaignKeyForLocation(slug);
          if (!campaignKey) campaignKey = "campaign-30d";

          showCampaignManagementModal(slug, { guest: true });
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
  wrap.setAttribute('data-locationid', String(locId || '').trim());
  wrap.setAttribute('data-variant', String(variant || '').trim());
}

export function showOwnerSettingsModal({ variant, locationIdOrSlug, locationName, noSelection }) {
  const id = 'owner-settings-modal';
  // Always rebuild so Selected/Active headers and actions never stick to a prior location.
  document.getElementById(id)?.remove();
  createOwnerSettingsModal({
    variant,
    locationIdOrSlug,
    locationName,
    noSelection: noSelection === true
  });
  showModal(id);
}

function showActionConfirmModal({ title, bodyLines, confirmLabel, danger, onConfirm }) {
  const id = 'action-confirm-modal';
  document.getElementById(id)?.remove();

  const lines = Array.isArray(bodyLines) ? bodyLines : [];
  const bodyHTML = lines.map((line, idx) => `
    <p style="text-align:left; margin:${idx === 0 ? '0' : '10px 0 0'};">
      ${String(line || '')}
    </p>
  `).join('');

  const modal = injectModal({
    id,
    title,
    bodyHTML,
    layout: 'menu',
    footerButtons: [
      {
        id: 'action-confirm-cancel',
        label: (typeof t === 'function' && t('common.cancel')) || 'Cancel',
        className: 'modal-footer-button',
        onClick: () => hideModal(id)
      },
      {
        id: 'action-confirm-ok',
        label: String(confirmLabel || 'OK'),
        className: 'modal-footer-button',
        onClick: async () => {
          try { await onConfirm?.(); } finally { hideModal(id); }
        }
      }
    ]
  });

  if (danger) {
    const okBtn = modal.querySelector('#action-confirm-ok');
    if (okBtn instanceof HTMLButtonElement) {
      okBtn.style.background = '#fee2e2';
      okBtn.style.border = '1px solid #fecaca';
      okBtn.style.color = '#991b1b';
    }
  }

  setupTapOutClose(id);
  showModal(id);
}

export async function createOwnerCenterModal() {
  const id = 'owner-center-modal';
  document.getElementById(id)?.remove();

  // Build with the same contract as Owner Settings (sticky header inside a single modal card scroller)
  const modal = injectModal({
    id,
    title: (typeof t === 'function' && t('owner.center.title')) || 'Owner center',
    layout: 'menu',
    bodyHTML: '' // we will fill .modal-body-inner below
  });

  syncModalHeaderHelp(modal);

  const inner = modal.querySelector('.modal-body-inner');
  if (!inner) return;

  inner.innerHTML = '';

  // 🔑 Restore owner access (Owner center secondary action)
  const restoreBtn = document.createElement('button');
  restoreBtn.type = 'button';
  restoreBtn.className = 'modal-menu-item modal-callout-card';
  restoreBtn.innerHTML = `
    <span class="icon-img">🔑</span>
    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
      <strong>${_ownerText('root.bo.restore.title', 'Restore or add owner access')}</strong><br>
      <small>${_ownerText('root.bo.restore.desc', 'Use your most recent payment receipt email.')}</small>
    </span>
  `;
  restoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showRestoreAccessModal();
  });
  inner.appendChild(restoreBtn);

  const list = document.createElement('div');
  list.className = 'modal-menu-list';
  inner.appendChild(list);

  const loadingRow = document.createElement('div');
  loadingRow.className = 'modal-menu-item owner-center-loading';
  loadingRow.style.pointerEvents = 'none';
  loadingRow.innerHTML = `
    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
      ${(typeof t === 'function' && t('owner.center.loading.title')) || 'Loading owner center...'}</strong><br>
      <small>${(typeof t === 'function' && t('owner.center.loading.desc')) || 'Getting listings saved on this device.'}</small>
    </span>
  `;
  list.appendChild(loadingRow);

  // Load device-bound ULIDs
  let ulids = [];

  let lastRestored = '';
  try {
    lastRestored = String(sessionStorage.getItem('ng_owner_restore_ulid') || '').trim();
  } catch { lastRestored = ''; }

  const fetchSessionsOnce = async () => {
    try {
      const r = await fetch('/api/owner/sessions', { cache: 'no-store', credentials: 'include' });
      const j = r.ok ? await r.json().catch(() => null) : null;
      return Array.isArray(j?.items) ? j.items : [];
    } catch {
      return [];
    }
  };

  ulids = await fetchSessionsOnce();

  let activeUlid = '';
  try {
    const rr = await fetch('/api/_diag/opsess', { cache: 'no-store', credentials: 'include' });
    const jj = rr.ok ? await rr.json().catch(() => null) : null;
    activeUlid = String(jj?.ulid || '').trim();
  } catch { activeUlid = ''; }

  const switchFromOwnerCenter = async ({ targetUlid, locationLabel, afterSwitch }) => {
    const performSwitch = async () => {
      if (activeUlid && activeUlid === targetUlid) {
        hideModal(id);
        await afterSwitch?.();
        return;
      }

      const sw = new URL('/owner/switch', location.origin);
      sw.searchParams.set('ulid', targetUlid);
      sw.searchParams.set('next', '/');

      const r = await fetch(sw.toString(), {
        cache: 'no-store',
        credentials: 'include',
        redirect: 'follow'
      });

      if (!r.ok) {
        showToast((typeof t === 'function' && t('owner.center.switch.fail')) || 'Could not switch.', 2000);
        return;
      }

      hideModal(id);
      await afterSwitch?.();
    };

    if (activeUlid && activeUlid !== targetUlid) {
      showActionConfirmModal({
        title:
          (typeof t === 'function' && t('owner.center.switch.confirmTitle')) ||
          'Switch the active listing on this device?',
        bodyLines: [
          (typeof t === 'function' && t('owner.center.switch.confirmBody1')) ||
            `The selected listing${locationLabel ? ` (“${locationLabel}”)` : ''} will become active on this device.`,
          (typeof t === 'function' && t('owner.center.switch.confirmBody2')) ||
            'Owner access is not changed globally.',
          (typeof t === 'function' && t('owner.center.switch.confirmBody3')) ||
            'You can switch again anytime in Owner center.'
        ],
        confirmLabel:
          (typeof t === 'function' && t('owner.center.switch.confirmCta')) ||
          'Switch now',
        danger: false,
        onConfirm: performSwitch
      });
      return;
    }

    await performSwitch();
  };
  
  // fallback injection (UI only): show the restored ULID if registry is still empty
  if ((!ulids || !ulids.length) && lastRestored) ulids = [lastRestored];

  // Keep the currently active business first in Owner center.
  if (Array.isArray(ulids) && ulids.length && activeUlid) {
    const deduped = Array.from(new Set(ulids.map(v => String(v || '').trim()).filter(Boolean)));
    ulids = [
      ...deduped.filter(v => v === activeUlid),
      ...deduped.filter(v => v !== activeUlid)
    ];
  }

  // Clear post-restore hint once sessions are visible again.
  if (Array.isArray(ulids) && ulids.length) {
    try {
      sessionStorage.removeItem('ng_owner_restore_ulid');
      sessionStorage.removeItem('ng_owner_restore_until');
    } catch {}
  }

  if (!ulids.length) {
    loadingRow.remove();

    const p = document.createElement('p');
    p.className = 'muted muted-note';
    p.style.textAlign = 'left';
    p.textContent =
      _ownerText('owner.center.empty', 'No owner access is saved on this device yet. Use 🔑 Restore owner access to add a listing to this device.');
    list.appendChild(p);
  } else {
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
      const isLive = !!activeUlid && activeUlid === u;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-menu-item oc-card';
      if (isLive) btn.classList.add('oc-card-live');

      btn.innerHTML = `
        <div class="oc-row1">
          <span class="oc-leading-slot icon-img" aria-hidden="true">📍</span>
          <span class="oc-name" style="flex:1 1 auto; min-width:0; text-align:left;">
            <strong>${label}</strong>
          </span>
          <span class="syb-status-dot" aria-hidden="true"></span>
        </div>

        <div class="oc-actions">
          <span class="oc-leading-slot oc-actions-left" aria-hidden="true">
            <span class="oc-live-flag" title="Active on this device">⚡</span>
          </span>

          <span class="oc-actions-right">
            <button type="button" class="clear-x owner-center-remove"
                    aria-label="${(typeof t === 'function' && t('owner.center.remove.title')) || 'Remove from this device'}">🗑️</button>

            <button type="button" class="clear-x owner-center-launch"
                    aria-label="${(typeof t === 'function' && t('owner.center.launch.title')) || 'Run a campaign'}">🚀</button>
          </span>
        </div>
      `;

      btn.querySelector('.owner-center-remove')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        showActionConfirmModal({
          title: (typeof t === 'function' && t('owner.center.remove.confirmTitle')) || 'Remove from this device?',
          bodyLines: [
            (typeof t === 'function' && t('owner.center.remove.confirmBody1')) || 'This removes the business from Owner center on this device.',
            (typeof t === 'function' && t('owner.center.remove.confirmBody2')) || 'Ownership remains active globally. You can restore access again anytime.',
            (typeof t === 'function' && t('owner.center.remove.confirmBody3')) || 'If this business is currently active, you will also be signed out on this device.'
          ],
          confirmLabel: (typeof t === 'function' && t('owner.center.remove.confirmCta')) || 'Remove',
          danger: true,
          onConfirm: async () => {
            try {
              const r = await fetch('/api/owner/sessions/remove', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                credentials: 'include',
                cache: 'no-store',
                body: JSON.stringify({ ulid: u })
              });

              if (!r.ok) {
                showToast(
                  (typeof t === 'function' && t('owner.center.remove.toast.fail')) ||
                  'Could not remove this location from this device.',
                  2200
                );
                return;
              }

              // If this ULID is currently active, clear the active session as well
              try {
                const diag = await fetch('/api/_diag/opsess', { cache: 'no-store', credentials: 'include' });
                const dj = diag.ok ? await diag.json().catch(() => null) : null;
                const activeUlid = String(dj?.ulid || '').trim();
                if (activeUlid && activeUlid === u) {
                  window.location.href = `/owner/clear-session?next=${encodeURIComponent('/')}`;
                  return;
                }
              } catch {}

              btn.remove();
              showToast(
                (typeof t === 'function' && t('owner.center.remove.toast.ok')) ||
                'Removed from this device.',
                1600
              );
            } catch {
              showToast(
                (typeof t === 'function' && t('owner.center.remove.toast.fail')) ||
                'Could not remove this location from this device.',
                2200
              );
            }
          }
        });
      });

      btn.querySelector('.owner-center-launch')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (btn.dataset.busy === '1') return;
        markBusyLocal(btn, true);

        try {
          const locIdent = String(slug || u || '').trim();
          await switchFromOwnerCenter({
            targetUlid: u,
            locationLabel: label,
            afterSwitch: async () => {
              if (locIdent) {
                await showCampaignManagementModal(locIdent, { openTab: 'new', preferEmptyDraft: true });
              }
            }
          });
        } finally {
          markBusyLocal(btn, false);
        }
      });

      // Status dot decoration
      (async () => {
        try {
          const dotEl = btn.querySelector('.syb-status-dot');
          const giftEl = btn.querySelector('.syb-gift');
          
          if (!dotEl) return;

          const q = String(slug || u || '').trim();
          if (!q) return;

          const st = new URL('/api/status', location.origin);
          st.searchParams.set('locationID', q);

          const r = await fetch(st.toString(), { cache: 'no-store', credentials: 'include' });
          if (!r.ok) return;

          const j = await r.json().catch(() => null);
          const entitled = (j?.campaignEntitled === true);
          if (giftEl) giftEl.classList.toggle('syb-gift-on', entitled);
          
          const owned = (j?.ownedNow === true);
          const vis = String(j?.visibilityState || '').trim();
          const courtesyUntil = String(j?.courtesyUntil || '').trim();

          dotEl.classList.toggle('syb-taken', owned);
          dotEl.classList.toggle('syb-parked', !owned && vis === 'hidden');
          dotEl.classList.toggle('syb-held', !owned && !!courtesyUntil);
          dotEl.classList.toggle('syb-free', !owned && vis !== 'hidden' && !courtesyUntil);
        } catch {}
      })();

      btn.addEventListener('click', async () => {
        if (btn.dataset.busy === '1') return;

        markBusyLocal(btn, true);
        try {
          await switchFromOwnerCenter({
            targetUlid: u,
            locationLabel: label,
            afterSwitch: async () => {
              await openOwnerSettingsForTarget({ target: u, locationName: name || slug || u });
            }
          });
        } finally {
          markBusyLocal(btn, false);
        }
      });

      list.appendChild(btn);
    }

    loadingRow.remove();
  }

  // Desktop ESC support (scoped + self-cleaning)
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      hideModal(id);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  setupTapOutClose(id);
}

// --- Campaign Management (Owner) ------------------------------------------------
// Draft → Checkout → Promote (KV-authoritative; no campaigns.json reads)

const CAMPAIGN_VOCAB = {
  campaignType: ['Reservations','Dash access','Discount','Early bird','Happy hour'],
  targetChannels: ['Default-info','QR','Social','Email'],
  offerType: ['Info','Discount','Access','Event'],
  discountKind: ['Percent','Amount','None'],
  eligibilityType: ['Everyone','First-time-visitor','Repeat-visitor','Staff-only'],
  utmSource: ['google','facebook','newsletter','partner_site'],
  utmMedium: ['poster','table-tent','flyer'],
  utmCampaign: ['winter_sale','product_launch','retargeting_jan','new_year_sale','summer_sale','back_to_school_sale','spring_sale','autumn_sale','black_friday']
};

function ymdToday() {
  const d = new Date();
  // local → yyyy-mm-dd
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0,10);
}

function elOption(v, selected) {
  const o = document.createElement('option');
  o.value = v;
  o.textContent = v;
  if (selected) o.selected = true;
  return o;
}

function buildSelect(values, current) {
  const sel = document.createElement('select');
  sel.className = 'input';
  sel.appendChild(elOption('', !current));
  values.forEach(v => sel.appendChild(elOption(v, String(current||'') === v)));
  return sel;
}

function buildInput(type, value) {
  const inp = document.createElement('input');
  inp.className = 'input';
  inp.type = type;
  inp.value = String(value || '');
  return inp;
}

async function apiJson(url, init) {
  const r = await fetch(url, { cache:'no-store', credentials:'include', ...(init||{}) });
  const txt = await r.text();
  let j = null;
  try { j = txt ? JSON.parse(txt) : null; } catch {}
  return { r, j, txt };
}

export async function showCampaignManagementModal(locationSlug, opts = {}) {
  const slug = String(locationSlug || '').trim();
  if (!slug) {
    showToast((typeof t==='function' && t('campaign.ui.missingLocation')) || 'Missing location.', 2000);
    return;
  }

  // Create modal once
  const id = 'campaign-management-modal';
  let modal = document.getElementById(id);

  // If an older build created this modal without a close button, recreate it cleanly.
  if (modal && !modal.querySelector('.modal-close')) {
    modal.remove();
    modal = null;
  }

  if (!modal) {
    modal = injectModal({
      id,
      title: (typeof t==='function' && t('campaign.ui.title')) || 'Campaign management',
      bodyHTML: `<div class="campaign-mgmt"></div>`,
      layout: 'menu'
    });
    setupTapOutClose(id);
  }

  syncModalHeaderHelp(modal);

  let root = modal.querySelector('.campaign-mgmt');
  if (!root) {
    // modal existed from an older build; repair body container
    const body = modal.querySelector('.modal-body') || modal;
    body.innerHTML = `<div class="campaign-mgmt"></div>`;
    root = modal.querySelector('.campaign-mgmt');
  }
  
  wireExclusiveDetails(root, '.cm-chip');

  root.innerHTML = `  
    <div class="modal-menu-list">
      <button type="button" class="modal-menu-item owner-center-loading" aria-disabled="true">
        <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
          ${(typeof t === 'function' && t('campaign.ui.loading.title')) || 'Campaign management loading...'}</strong><br>
          <small>${(typeof t === 'function' && t('campaign.ui.loading.desc')) || 'Preparing campaign data for this location.'}</small>
        </span>
      </button>
    </div>
  `;

  showModal(id);

  // Load owner campaigns (draft + active/history)
  const guestMode = (opts && opts.guest === true);

  let listJ = null;
  if (!guestMode) {
    const rr = await apiJson('/api/owner/campaigns');
    if (!rr.r.ok) {
      // Fall back to guest mode when owner session is missing.
      // Guest mode supports one-shot checkout (server stores draft during checkout creation).
      // No multi-payment gating.
      listJ = null;
    } else {
      listJ = rr.j;
    }
  }

  const prefillFrom = (opts && opts.prefillFrom && typeof opts.prefillFrom === 'object') ? opts.prefillFrom : null;
  const p8Draft = (opts && opts.p8Draft && typeof opts.p8Draft === 'object') ? opts.p8Draft : null;  
  const modalTitleNode = modal.querySelector('.modal-top-bar .modal-title, .modal-top-bar h1, .modal-top-bar h2');
  if (modalTitleNode) {
    modalTitleNode.textContent = p8Draft
      ? ((typeof t === 'function' && t('locationDraft.commercial.title')) || 'Publish setup')
      : ((typeof t === 'function' && t('campaign.ui.title')) || 'Campaign management');
  }
  syncModalHeaderHelp(modal);
  const draft = (opts && opts.preferEmptyDraft === true) ? (prefillFrom || null) : (listJ?.draft || prefillFrom || null);  
  const historyArr = Array.isArray(listJ?.history) ? listJ.history : [];
  const ulid = String(listJ?.ulid || '').trim(); // empty in guest mode; that's OK
  const eligibleLocations = Array.isArray(listJ?.eligibleLocations) ? listJ.eligibleLocations : [];
  const inheritedNotice = listJ?.inheritedNotice || null;

  // Canonicalize location identifier for CM header/status:
  // - input "slug" might actually be a ULID depending on caller
  // - resolve ULID → slug/name via the same item endpoint used elsewhere
  let displaySlug = String(slug || '').trim();
  let displayName = '';

  const isUlid = (s) => /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(String(s || '').trim());

  if (isUlid(displaySlug) && !p8Draft) {
    try {
      const rr = await fetch(
        `https://navigen-api.4naama.workers.dev/api/data/item?id=${encodeURIComponent(displaySlug)}`,
        { cache: 'no-store' }
      );
      const jj = rr.ok ? await rr.json().catch(() => null) : null;

      const resolvedSlug = String(jj?.locationID || '').trim();
      const resolvedNameRaw = jj?.locationName;

      const resolvedName = (resolvedNameRaw && typeof resolvedNameRaw === 'object')
        ? String(resolvedNameRaw.en || Object.values(resolvedNameRaw)[0] || '').trim()
        : String(resolvedNameRaw || '').trim();

      if (resolvedSlug) displaySlug = resolvedSlug;
      if (resolvedName) displayName = resolvedName;
    } catch {}
  }

  if (!displayName && p8Draft) displayName = String(p8Draft.name || p8Draft.displayName || '').trim();

  // ───────────────────────────────────────────────────────────────────────────
  // CM v2: three-section layout
  // A) modal-top-bar is owned by injectModal (title + red ×)
  // B) fixed control tabs
  // C) content panel swaps without rebuilding the modal shell
  // ───────────────────────────────────────────────────────────────────────────

  // A0) Location header line (inside body, under top bar)
  const status = await fetch(`/api/status?locationID=${encodeURIComponent(displaySlug)}`, { cache:'no-store', credentials:'include' })  
    .then(r => r.ok ? r.json() : null)
    .catch(() => null);

  // Prefer the data item endpoint for the real business name (authoritative profile payload).
  let locName = String(displayName || '').trim();
  try {
    const rr = await fetch(
      `https://navigen-api.4naama.workers.dev/api/data/item?id=${encodeURIComponent(displaySlug)}`,
      { cache: 'no-store' }
    );
    const jj = rr.ok ? await rr.json().catch(() => null) : null;
    const ln = jj?.locationName;
    const nm = (ln && typeof ln === 'object')
      ? String(ln.en || Object.values(ln)[0] || '').trim()
      : String(ln || '').trim();
    if (nm) locName = nm;
  } catch {}
  
  if (!locName && p8Draft) locName = String(p8Draft.name || p8Draft.displayName || '').trim();

  if (!locName) locName = String(displaySlug || '').trim(); // last-resort fallback

  let requestedUlid = '';
  try {
    const st = new URL('/api/status', location.origin);
    st.searchParams.set('locationID', displaySlug);
    const r = await fetch(st.toString(), { cache: 'no-store', credentials: 'include' });
    const j = r.ok ? await r.json().catch(() => null) : null;
    requestedUlid = String(j?.locationID || '').trim(); // /api/status returns canonical ULID in locationID
  } catch {}

  if (listJ && requestedUlid && String(listJ?.ulid || '').trim() && requestedUlid !== String(listJ.ulid).trim()) {
    // Session is valid, but bound to a different location. Fail closed and offer the only correct fix: switch.
    const shell = document.createElement('div');
    shell.className = 'cm-shell';

    const locHdr = document.createElement('div');
    locHdr.className = 'cm-location';
    locHdr.innerHTML = `
      <div class="cm-location-row">
        <span class="cm-location-label">Location name</span>
        <span class="cm-location-box">${String(displayName || displaySlug || '').trim()}</span>
      </div>
      <div class="cm-location-row">
        <span class="cm-location-label">Location ID</span>
        <span class="cm-location-box">${String(displaySlug || '').trim()}</span>
      </div>
    `;

    const panel = document.createElement('div');
    panel.className = 'cm-panel';

    const p = document.createElement('p');
    p.className = 'muted';
    p.style.textAlign = 'left';
    p.textContent =
      (typeof t === 'function' && t('campaign.ui.mismatch')) ||
      'Owner session is currently bound to a different location. Switch in Owner center to manage campaigns for this location.';
    panel.appendChild(p);

    const actions = document.createElement('div');
    actions.className = 'cm-actions';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cm-action-primary';
    btn.textContent = (typeof t === 'function' && t('owner.center.open')) || 'Open Owner center';
    btn.addEventListener('click', async () => {
      hideModal('campaign-management-modal');
      await showOwnerCenterModal();
    });

    actions.appendChild(btn);
    panel.appendChild(actions);

    shell.appendChild(locHdr);
    shell.appendChild(panel);
    root.replaceChildren(shell);    

    showModal('campaign-management-modal');
    return;
  }

  // Split campaign rows for tabs (ensure multiple active campaigns are represented)
  const rowsAll = Array.isArray(historyArr) ? historyArr : [];
  const ymd = (d) => {
    const s = String(d || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  };
  const today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

  const isEnded = (row) => {
    const e = ymd(row?.endDate);
    if (!e) return false;
    const dt = new Date(`${e}T00:00:00Z`);
    return Number.isFinite(dt.getTime()) && dt.getTime() < today.getTime();
  };

  const statusOf = (row) => String(row?.statusOverride || row?.status || '').toLowerCase().trim();

  const rowsActive = rowsAll.filter(x => {
    const st = statusOf(x);
    return (st === 'active' || st === 'suspended') && !isEnded(x);
  });

  const rowsFinished = rowsAll.filter(x => statusOf(x) === 'finished' || isEnded(x));

  // Root shell
  const shell = document.createElement('div');
  shell.className = 'cm-shell';

  const lead = document.createElement('div');
  lead.className = 'cm-lead';
  lead.style.display = 'none';

  let restoredAddedRows = 0;
  try {
    sessionStorage.removeItem('ng_inherited_notice_added_rows');
    sessionStorage.removeItem('ng_inherited_notice_until');

    const inheritedInlineKey = requestedUlid ? `ng_inherited_notice_inline:${requestedUlid}` : '';
    if (inheritedInlineKey) {
      restoredAddedRows = Math.max(
        0,
        Number(sessionStorage.getItem(inheritedInlineKey) || '0') || 0
      );
      if (restoredAddedRows > 0) sessionStorage.removeItem(inheritedInlineKey);
    }
  } catch {}

  const effectiveAddedRows = Math.max(
    Number(inheritedNotice?.addedRows || 0) || 0,
    restoredAddedRows
  );

  let inheritedNote = null;
  if (effectiveAddedRows > 0) {
    const addedRows = effectiveAddedRows;
    inheritedNote = document.createElement('div');
    inheritedNote.className = 'campaign-inline-note';
    inheritedNote.textContent =
      addedRows === 1
        ? ((typeof t === 'function' && t('campaign.ui.inherited.one')) || '1 location was added to this campaign automatically.')
        : ((typeof t === 'function' && t('campaign.ui.inherited.many')) || `${addedRows} locations were added to this campaign automatically.`);
  }

  const locHdr = document.createElement('div');
  locHdr.className = 'cm-location';

  locHdr.innerHTML = `
    <details class="cm-chip cm-location-chip">
      <summary class="modal-menu-item cm-chip-face">
        <span class="cm-chip-face-label">${String(locName || '').trim() || displaySlug}</span>
        <span class="cm-chip-face-chevron" aria-hidden="true"></span>
      </summary>
      <div class="cm-chip-body">
        <div class="cm-chip-stack">
          <div class="cm-chip-row">
            <span class="cm-chip-k">${translatedOrFallback('campaign.ui.locationName', 'Location name')}</span>            
            <span class="cm-chip-v" title="${String(locName || '').trim()}">
              ${String(locName || '').trim()}
            </span>
          </div>
          <div class="cm-chip-row">
            <span class="cm-chip-k">${translatedOrFallback('campaign.ui.locationId', 'Location ID')}</span>            
            <span class="cm-chip-v" title="${displaySlug}">
              ${displaySlug}
            </span>
          </div>
        </div>
      </div>
    </details>
  `;

  // Controls (B): single dropdown selector (Dash-like chevron + spacing)
  const controls = document.createElement('div');
  controls.className = 'cm-controls';

  const viewSel = document.createElement('select');
  viewSel.className = 'cm-select';

  const opt = (value, label) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    return o;
  };

  // Longer expressions (per your requirement)
  const vNew =
    (typeof t === 'function' && t('campaign.ui.view.new')) ||
    'New campaign';
  const vCur =
    (typeof t === 'function' && t('campaign.ui.view.current')) ||
    'Current campaigns';
  const vHis =
    (typeof t === 'function' && t('campaign.ui.view.history')) ||
    'Campaign history';

  viewSel.appendChild(opt('new', vNew));
  viewSel.appendChild(opt('current', vCur));
  viewSel.appendChild(opt('history', vHis));

  controls.appendChild(viewSel);

  // Content (C)
  const panel = document.createElement('div');
  panel.className = 'cm-panel';

  shell.appendChild(lead);
  if (inheritedNote) shell.appendChild(inheritedNote);
  shell.appendChild(locHdr);
  shell.appendChild(controls);
  shell.appendChild(panel);
  root.replaceChildren(shell);

  // ───────────────────────────────────────────────────────────────────────────
  // Campaign information modal (drilldown) — opens from Current/History cards
  // ───────────────────────────────────────────────────────────────────────────
  const showCampaignInfoModal = (row) => {
    const rowSafe = (row && typeof row === 'object') ? row : {};
    const mid = 'campaign-info-modal';
    document.getElementById(mid)?.remove();

    const tSafe = (key, fallback) => {
      const raw = (typeof t === 'function') ? String(t(key) || '').trim() : '';
      return raw && raw !== key ? raw : fallback;
      
    };

    const m = injectModal({
      id: mid,
      title: tSafe('campaign.ui.info.title', 'Campaign information'),
      bodyHTML: `<div class="modal-body-inner"><div class="cm-info"></div></div>`,
      layout: 'action'
    });
    setupTapOutClose(mid);

    const box = m.querySelector('.cm-info');
    if (!box) { showModal(mid); return; }

    const pairs = [
      ['campaignKey', rowSafe.campaignKey],
      ['campaignGroupKey', rowSafe.campaignGroupKey],
      ['campaignScope', rowSafe.campaignScope],
      ['campaignName', rowSafe.campaignName],
      ['status', rowSafe.statusOverride || rowSafe.status],
      ['startDate', rowSafe.startDate],
      ['endDate', rowSafe.endDate],
      ['campaignType', rowSafe.campaignType],
      ['offerType', rowSafe.offerType],
      ['discountKind', rowSafe.discountKind],
      ['campaignDiscountValue', rowSafe.campaignDiscountValue],
      ['eligibilityType', rowSafe.eligibilityType],
      ['eligibilityNotes', rowSafe.eligibilityNotes],
      ['targetChannels', Array.isArray(rowSafe.targetChannels) ? rowSafe.targetChannels.join(', ') : rowSafe.targetChannels],
      ['utmSource', rowSafe.utmSource],
      ['utmMedium', rowSafe.utmMedium],
      ['utmCampaign', rowSafe.utmCampaign],
      ['createdAt', rowSafe.createdAt],
      ['createdBy', rowSafe.createdBy]
    ];

    box.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'cm-info-list';

    pairs.forEach(([k, v]) => {
      const val = (v === null || v === undefined) ? '' : String(v);
      const rowEl = document.createElement('div');
      rowEl.className = 'cm-info-row';
      rowEl.innerHTML = `<div class="cm-info-k">${k}</div><div class="cm-info-v">${val}</div>`;
      wrap.appendChild(rowEl);
    });

    box.appendChild(wrap);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const btnRenew = document.createElement('button');
    btnRenew.type = 'button';
    btnRenew.className = 'modal-body-button';
    btnRenew.textContent = tSafe('campaign.ui.renew', 'Renew campaign');
    btnRenew.addEventListener('click', async () => {
      hideModal(mid);
      await showCampaignManagementModal(displaySlug, { openTab: 'new', prefillFrom: rowSafe });
    });

    actions.appendChild(btnRenew);

    const groupKey = String(rowSafe?.campaignGroupKey || '').trim();
    if (groupKey) {
      const btnSuspendAll = document.createElement('button');
      btnSuspendAll.type = 'button';
      btnSuspendAll.className = 'cm-action-btn';
      btnSuspendAll.textContent = tSafe('campaign.ui.suspend.all', 'Suspend all');
      btnSuspendAll.addEventListener('click', async () => {
        const out = await apiJson('/api/owner/campaigns/suspend', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ campaignGroupKey: groupKey, action: 'suspend' })
        });
        if (!out.r.ok) { showToast(tSafe('common.actionFailed', 'Action failed.'), 2400); return; }
        showToast(tSafe('campaign.ui.networkRoster.allSuspended', 'All included locations suspended.'), 1800);
        hideModal(mid);
        showCampaignManagementModal(displaySlug, { openTab: 'current' });
      });

      const btnResumeAll = document.createElement('button');
      btnResumeAll.type = 'button';
      btnResumeAll.className = 'cm-action-btn';
      btnResumeAll.textContent = tSafe('campaign.ui.resume.all', 'Resume all');
      btnResumeAll.addEventListener('click', async () => {
        const out = await apiJson('/api/owner/campaigns/suspend', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ campaignGroupKey: groupKey, action: 'resume' })
        });
        if (!out.r.ok) { showToast(tSafe('common.actionFailed', 'Action failed.'), 2400); return; }
        showToast(tSafe('campaign.ui.networkRoster.allResumed', 'All included locations resumed.'), 1800);
        hideModal(mid);
        showCampaignManagementModal(displaySlug, { openTab: 'current' });
      });

      actions.appendChild(btnSuspendAll);
      actions.appendChild(btnResumeAll);
    }

    box.appendChild(actions);

    if (groupKey) {
      const rosterWrap = document.createElement('div');
      rosterWrap.style.marginTop = '1rem';

      const rosterTitle = document.createElement('p');
      rosterTitle.textContent = tSafe('campaign.ui.networkRoster.title', 'Active network roster');
      rosterTitle.style.margin = '0 0 0.75rem';
      rosterTitle.style.fontWeight = '600';
      rosterWrap.appendChild(rosterTitle);

      const tools = document.createElement('div');
      tools.style.display = 'flex';
      tools.style.flexWrap = 'wrap';
      tools.style.gap = '8px';
      tools.style.marginBottom = '0.75rem';

      const search = buildInput('search', '');
      search.classList.add('input');
      search.placeholder = tSafe('campaign.ui.networkRoster.search', 'Search locations…');
      search.style.flex = '1 1 220px';

      const filterSel = document.createElement('select');
      filterSel.className = 'input';
      [
        ['all', tSafe('campaign.ui.networkRoster.filter.all', 'All')],
        ['active', tSafe('campaign.ui.networkRoster.filter.active', 'Active')],
        ['suspended', tSafe('campaign.ui.networkRoster.filter.suspended', 'Suspended')],
        ['excluded', tSafe('campaign.ui.networkRoster.filter.excluded', 'Excluded')]
      ].forEach(([value, label]) => {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = label;
        filterSel.appendChild(o);
      });

      const btnSuspendSelected = document.createElement('button');
      btnSuspendSelected.type = 'button';
      btnSuspendSelected.className = 'cm-action-btn';
      btnSuspendSelected.textContent = tSafe('campaign.ui.networkRoster.suspendSelected', 'Suspend selected');
      btnSuspendSelected.disabled = true;

      const btnResumeSelected = document.createElement('button');
      btnResumeSelected.type = 'button';
      btnResumeSelected.className = 'cm-action-btn';
      btnResumeSelected.textContent = tSafe('campaign.ui.networkRoster.resumeSelected', 'Resume selected');
      btnResumeSelected.disabled = true;

      tools.appendChild(search);
      tools.appendChild(filterSel);
      tools.appendChild(btnSuspendSelected);
      tools.appendChild(btnResumeSelected);
      rosterWrap.appendChild(tools);

      const rosterList = document.createElement('div');
      rosterList.style.display = 'flex';
      rosterList.style.flexDirection = 'column';
      rosterList.style.gap = '8px';
      rosterWrap.appendChild(rosterList);

      const rosterState = {
        items: [],
        selected: new Set()
      };

      const syncSubsetButtons = () => {
        const selectedIncluded = Array.from(rosterState.selected).filter((id) =>
          rosterState.items.some((it) => String(it?.ulid || '').trim() === id && it?.included === true)
        );
        btnSuspendSelected.disabled = selectedIncluded.length === 0;
        btnResumeSelected.disabled = selectedIncluded.length === 0;
      };

      const renderRoster = () => {
        rosterList.innerHTML = '';

        const q = String(search.value || '').trim().toLowerCase();
        const filter = String(filterSel.value || 'all').trim();

        let items = Array.isArray(rosterState.items) ? rosterState.items.slice() : [];
        if (q) {
          items = items.filter((it) => {
            const hay = [
              String(it?.locationName || ''),
              String(it?.slug || ''),
              String(it?.ulid || '')
            ].join(' ').toLowerCase();
            return hay.includes(q);
          });
        }

        if (filter !== 'all') {
          items = items.filter((it) => String(it?.status || '').trim().toLowerCase() === filter);
        }

        if (!items.length) {
          const empty = document.createElement('div');
          empty.className = 'cm-inline-note';
          empty.textContent = tSafe('campaign.ui.networkRoster.empty', 'No locations match this filter.');
          rosterList.appendChild(empty);
          syncSubsetButtons();
          return;
        }

        items.forEach((it) => {
          const locUlid = String(it?.ulid || '').trim();
          const included = !!it?.included;
          const status = String(it?.status || '').trim().toLowerCase() || 'excluded';

          const rowEl = document.createElement('label');
          rowEl.style.display = 'flex';
          rowEl.style.alignItems = 'center';
          rowEl.style.gap = '10px';
          rowEl.style.padding = '10px 12px';
          rowEl.style.border = '1px solid #e5e7eb';
          rowEl.style.borderRadius = '10px';
          rowEl.style.background = '#f8fafc';

          const check = document.createElement('input');
          check.type = 'checkbox';
          check.checked = rosterState.selected.has(locUlid);
          check.disabled = !included;
          check.addEventListener('change', () => {
            if (check.checked) rosterState.selected.add(locUlid);
            else rosterState.selected.delete(locUlid);
            syncSubsetButtons();
          });

          const main = document.createElement('div');
          main.style.flex = '1 1 auto';
          main.style.minWidth = '0';
          main.innerHTML = `
            <strong>${String(it?.locationName || it?.slug || locUlid).trim()}</strong><br>
            <small>${String(it?.slug || locUlid).trim()}</small>
          `;

          const chip = document.createElement('span');
          chip.className = 'cm-roster-chip';
          chip.textContent =
            status === 'active'
              ? tSafe('campaign.ui.networkRoster.status.active', 'Active')
              : status === 'suspended'
                ? tSafe('campaign.ui.networkRoster.status.suspended', 'Suspended')
                : tSafe('campaign.ui.networkRoster.status.excluded', 'Excluded');

          rowEl.appendChild(check);
          rowEl.appendChild(main);
          rowEl.appendChild(chip);
          rosterList.appendChild(rowEl);
        });

        syncSubsetButtons();
      };

      const loadRoster = async () => {
        rosterList.innerHTML = '';
        const loading = document.createElement('div');
        loading.className = 'cm-inline-note';
        loading.textContent = tSafe('campaign.ui.networkRoster.loading', 'Loading network roster…');
        rosterList.appendChild(loading);

        const out = await apiJson(`/api/owner/campaigns/group?campaignGroupKey=${encodeURIComponent(groupKey)}`, {
          method: 'GET'
        });

        if (!out.r.ok) {
          rosterList.innerHTML = '';
          const fail = document.createElement('div');
          fail.className = 'cm-inline-note';
          fail.textContent = tSafe('campaign.ui.networkRoster.loadFail', 'Could not load the network roster.');
          rosterList.appendChild(fail);
          return;
        }

        rosterState.items = Array.isArray(out.j?.items) ? out.j.items : [];
        rosterState.selected = new Set(
          Array.from(rosterState.selected).filter((id) =>
            rosterState.items.some((it) => String(it?.ulid || '').trim() === id && it?.included === true)
          )
        );
        renderRoster();
      };

      search.addEventListener('input', renderRoster);
      filterSel.addEventListener('change', renderRoster);

      btnSuspendSelected.addEventListener('click', async () => {
        const ulids = Array.from(rosterState.selected).filter((id) =>
          rosterState.items.some((it) => String(it?.ulid || '').trim() === id && it?.included === true)
        );
        if (!ulids.length) return;

        const out = await apiJson('/api/owner/campaigns/suspend-selected', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ campaignGroupKey: groupKey, action: 'suspend', ulids })
        });
        if (!out.r.ok) { showToast(tSafe('common.actionFailed', 'Action failed.'), 2400); return; }

        showToast(tSafe('campaign.ui.networkRoster.subsetSuspended', 'Selected locations suspended.'), 1800);
        await loadRoster();
      });

      btnResumeSelected.addEventListener('click', async () => {
        const ulids = Array.from(rosterState.selected).filter((id) =>
          rosterState.items.some((it) => String(it?.ulid || '').trim() === id && it?.included === true)
        );
        if (!ulids.length) return;

        const out = await apiJson('/api/owner/campaigns/suspend-selected', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ campaignGroupKey: groupKey, action: 'resume', ulids })
        });
        if (!out.r.ok) { showToast(tSafe('common.actionFailed', 'Action failed.'), 2400); return; }

        showToast(tSafe('campaign.ui.networkRoster.subsetResumed', 'Selected locations resumed.'), 1800);
        await loadRoster();
      });

      box.appendChild(rosterWrap);
      loadRoster();
    }

    showModal(mid);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Panel renderers
  // ───────────────────────────────────────────────────────────────────────────
  const clearPanel = () => { panel.innerHTML = ''; };

  const renderEmpty = (text) => {
    const p = document.createElement('p');
    p.className = 'muted';
    p.style.textAlign = 'left';
    p.textContent = text;
    panel.appendChild(p);
  };

  const renderCampaignCards = (rows, kind) => {
    const list = document.createElement('div');
    list.className = 'cm-card-list';

    rows.forEach((r) => {
      const loc = String(locName || displayName || displaySlug || '').trim();
      const key = String(r?.campaignKey || '').trim();
      const groupKey = String(r?.campaignGroupKey || '').trim();
      const start = ymd(r?.startDate);
      const end = ymd(r?.endDate);
      const range = (start && end) ? `${start} → ${end}` : '';
      const st = String(r?.statusOverride || r?.status || '').toLowerCase().trim();

      const b = document.createElement('button');
      b.type = 'button';
      b.className = `cm-camp-card ${st === 'suspended' ? 'cm-camp-suspended' : ''}`;
      b.innerHTML = `
        <div class="cm-camp-row1">
          <div class="cm-camp-left">🎁</div>
          <div class="cm-camp-mid">
            <div class="cm-camp-loc">${loc}</div>
            <div class="cm-camp-key">${key}</div>
            ${range ? `<div class="cm-camp-range">${range}</div>` : ``}
          </div>
          <div class="cm-camp-right">
            <span class="cm-status-dot" aria-hidden="true"></span>
          </div>
        </div>

        ${groupKey && kind === 'current' ? `
          <div class="campaign-group-actions">
            <button type="button" class="cm-action-btn cm-group-suspend">${(typeof t === 'function' && t('campaign.ui.suspend.all')) || 'Suspend all'}</button>
            <button type="button" class="cm-action-btn cm-group-resume">${(typeof t === 'function' && t('campaign.ui.resume.all')) || 'Resume all'}</button>
          </div>
        ` : ``}

        <div class="cm-camp-row2">
          <div class="cm-camp-actions">
            ${kind === 'current' && st !== 'suspended' ? `<button type="button" class="clear-x cm-camp-suspend" aria-label="Suspend">➖</button>` : ``}
            ${kind === 'current' && st === 'suspended' ? `<button type="button" class="clear-x cm-camp-resume" aria-label="Resume">▶</button>` : ``}
            <button type="button" class="clear-x cm-camp-add" aria-label="Add">➕</button>
          </div>
        </div>
      `;

      b.addEventListener('click', () => showCampaignInfoModal(r));

      b.querySelector('.cm-group-suspend')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const out = await apiJson('/api/owner/campaigns/suspend', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ campaignGroupKey: groupKey, action: 'suspend' })
        });
        if (!out.r.ok) { showToast('Action failed.', 2400); return; }
        showToast('Campaign suspended.', 1800);
        showCampaignManagementModal(displaySlug, { openTab: 'current' });
      });

      b.querySelector('.cm-group-resume')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const out = await apiJson('/api/owner/campaigns/suspend', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ campaignGroupKey: groupKey, action: 'resume' })
        });
        if (!out.r.ok) { showToast('Action failed.', 2400); return; }
        showToast('Campaign resumed.', 1800);
        showCampaignManagementModal(displaySlug, { openTab: 'current' });
      });

      b.querySelector('.cm-camp-suspend')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        showActionConfirmModal({
          title: (typeof t === 'function' && t('campaign.ui.suspend.confirm.title')) || 'Suspend this campaign?',
          bodyLines: [
            (typeof t === 'function' && t('campaign.ui.suspend.confirm.body1')) || 'Promotion will stop immediately.',
            (typeof t === 'function' && t('campaign.ui.suspend.confirm.body2')) || 'QR redemption will be disabled.',
            (typeof t === 'function' && t('campaign.ui.suspend.confirm.body3')) || 'No refund is issued.'
          ],
          confirmLabel: (typeof t === 'function' && t('campaign.ui.suspend')) || 'Suspend campaign',
          danger: true,
          onConfirm: async () => {
            const out = await apiJson('/api/owner/campaigns/suspend', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ campaignKey: String(r?.campaignKey || '').trim(), action: 'suspend' })
            });
            if (!out.r.ok) { showToast('Action failed.', 2400); return; }
            showToast('Campaign suspended.', 1800);
            showCampaignManagementModal(displaySlug, { openTab: 'current' });
          }
        });
      });

      b.querySelector('.cm-camp-resume')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        showActionConfirmModal({
          title: (typeof t === 'function' && t('campaign.ui.resume.confirm.title')) || 'Resume this campaign?',
          bodyLines: [
            (typeof t === 'function' && t('campaign.ui.resume.confirm.body1')) || 'Promotion will become active again.',
            (typeof t === 'function' && t('campaign.ui.resume.confirm.body2')) || 'No refund changes apply.'
          ],
          confirmLabel: (typeof t === 'function' && t('campaign.ui.resume')) || 'Resume campaign',
          danger: false,
          onConfirm: async () => {
            const out = await apiJson('/api/owner/campaigns/suspend', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ campaignKey: String(r?.campaignKey || '').trim(), action: 'resume' })
            });
            if (!out.r.ok) { showToast('Action failed.', 2400); return; }
            showToast('Campaign resumed.', 1800);
            showCampaignManagementModal(displaySlug, { openTab: 'current' });
          }
        });
      });

      b.querySelector('.cm-camp-add')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showCampaignManagementModal(displaySlug, { openTab: 'new', prefillFrom: r });
      });

      try {
        const dot = b.querySelector('.cm-status-dot');
        if (dot) {
          const st = String(r?.statusOverride || r?.status || '').toLowerCase().trim();
          dot.classList.toggle('cm-dot-active', (kind === 'current') && (st === 'active'));
          dot.classList.toggle('cm-dot-suspended', (kind === 'current') && (st === 'suspended'));
          dot.classList.toggle('cm-dot-finished', (kind === 'history') || (st === 'finished'));
        }
      } catch {}

      list.appendChild(b);
    });

    panel.appendChild(list);
  };

function nextRollingCampaignKey(baseSlug, yy, rowsAll) {
  const base = String(baseSlug || '').trim();
  const year = String(yy || '').trim();
  const rows = Array.isArray(rowsAll) ? rowsAll : [];

  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${esc(base)}-${esc(year)}-(\\d{2,})$`);

  let maxN = 0;
  for (const r of rows) {
    const k = String(r?.campaignKey || '').trim();
    const m = k.match(re);
    if (!m) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > maxN) maxN = n;
  }

  const next = maxN + 1;
  const suffix = String(next).padStart(2, '0');
  return `${base}-${year}-${suffix}`;
}

  const renderDraftEditor = () => {
    let selectedPlanCode = ['standard', 'multi', 'large', 'network'].includes(String(listJ?.plan?.tier || '').trim().toLowerCase())
      ? String(listJ.plan.tier).trim().toLowerCase()
      : (['standard', 'multi', 'large', 'network'].includes(String(listJ?.inheritedNotice?.blockedPlanTier || '').trim().toLowerCase())
          ? String(listJ.inheritedNotice.blockedPlanTier).trim().toLowerCase()
          : 'standard'); // TESTING: default to the current active tier when known; otherwise Standard
    let selectedCampaignPreset = String(draft?.campaignPreset || 'promotion').trim().toLowerCase() === 'visibility'
      ? 'visibility'
      : 'promotion';

    const planAllowsMultiScope = (planCode) => ['multi', 'large', 'network'].includes(String(planCode || '').trim().toLowerCase());
    const multiScopeEnabled = () => planAllowsMultiScope(selectedPlanCode) || !!listJ?.plan?.multiLocationEnabled;

    const form = document.createElement('div');
    form.className = 'campaign-mgmt-form';

    const field = (labelTxt, control) => {
      const w = document.createElement('div');
      const lab = document.createElement('div');
      lab.className = 'muted';
      lab.style.marginBottom = '4px';
      lab.textContent = labelTxt;
      w.appendChild(lab);
      w.appendChild(control);
      return w;
    };

    const yy = String(new Date().getFullYear()).slice(-2);
    const baseSlug = String(displaySlug || slug || '').trim() || 'location';
    const suggestedKey = nextRollingCampaignKey(baseSlug, yy, rowsAll);

    const campaignKey = buildInput('text', /^ps-/i.test(String(draft?.campaignKey || '').trim()) ? suggestedKey : (draft?.campaignKey || suggestedKey));    
    campaignKey.readOnly = true;
    campaignKey.setAttribute('aria-readonly', 'true');

    const campaignName = buildInput('text', draft?.campaignName || '');
    const productName = buildInput('text', draft?.productName || '');
    const startDate = buildInput('date', draft?.startDate || ymdToday());
    const endDate = buildInput('date', draft?.endDate || '');

    const campaignType = buildSelect(CAMPAIGN_VOCAB.campaignType, draft?.campaignType || '');
    const offerType = buildSelect(CAMPAIGN_VOCAB.offerType, draft?.offerType || 'Discount');
    const discountKind = buildSelect(CAMPAIGN_VOCAB.discountKind, draft?.discountKind || 'Percent');
    const discountValue = buildInput('number', draft?.campaignDiscountValue ?? draft?.discountValue ?? '');

    const eligibilityType = buildSelect(CAMPAIGN_VOCAB.eligibilityType, draft?.eligibilityType || 'Everyone');
    const eligibilityNotes = buildInput('text', draft?.eligibilityNotes || '');

    const utmSource = buildSelect(CAMPAIGN_VOCAB.utmSource, draft?.utmSource || '');
    const utmMedium = buildSelect(CAMPAIGN_VOCAB.utmMedium, draft?.utmMedium || '');
    const utmCampaign = buildSelect(CAMPAIGN_VOCAB.utmCampaign, draft?.utmCampaign || '');
    const targetChannels = buildSelect(CAMPAIGN_VOCAB.targetChannels, (draft?.targetChannels && draft.targetChannels[0]) || 'QR');

    const scopeSelect = document.createElement('select');
    scopeSelect.className = 'input';

    [
      ['single', scopeSingleLabel],
      ['selected', scopeSelectedLabel],
      ['all', scopeAllLabel]
    ].forEach(([value, label]) => {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = label;
      if (String(multiScopeEnabled() ? (draft?.campaignScope || 'single') : 'single').trim() === value) {
        o.selected = true;
      }
      scopeSelect.appendChild(o);
    });

    if (!multiScopeEnabled()) scopeSelect.disabled = true;

    const labels = {
      plan: tSafe('campaign.plan.choose.title', 'Choose plan'),
      campaignPreset: tSafe('campaign.plan.preset.label', 'Campaign mode'),
      campaignKey: 'Campaign key',
      campaignName: 'Campaign name',
      productName: 'Product / service',
      campaignType: 'Campaign type',
      targetChannels: 'Channels',
      offerType: 'Offer type',
      discountKind: 'Discount type',
      campaignDiscountValue: 'Discount value',
      eligibilityType: 'Eligibility',
      eligibilityNotes: 'Eligibility notes',
      utmSource: 'UTM source',
      utmMedium: 'UTM medium',
      utmCampaign: 'UTM campaign',
      startDate: 'Start date',
      endDate: 'End date',
      campaignScope: 'Campaign scope'
    };

    const planField = document.createElement('details');
    planField.className = 'cm-chip cm-plan-chip';

    const planSummary = document.createElement('summary');
    planSummary.className = 'modal-menu-item cm-chip-face';

    const planSummaryLabel = document.createElement('span');
    planSummaryLabel.className = 'cm-chip-face-label';

    const planSummaryChevron = document.createElement('span');
    planSummaryChevron.className = 'cm-chip-face-chevron';
    planSummaryChevron.setAttribute('aria-hidden', 'true');

    planSummary.appendChild(planSummaryLabel);
    planSummary.appendChild(planSummaryChevron);

    const planBody = document.createElement('div');
    planBody.className = 'cm-chip-body';

    const planLabel = document.createElement('div');
    planLabel.className = 'muted';
    planLabel.style.marginBottom = '4px';
    planLabel.textContent = labels.plan;

    const planStateNote = document.createElement('div');
    planStateNote.className = 'campaign-inline-note';
    planStateNote.style.marginBottom = '10px';

    const upgradeNote = document.createElement('div');
    upgradeNote.className = 'campaign-inline-note';
    upgradeNote.style.marginBottom = '10px';
    upgradeNote.style.display = 'none';

    const blockedPlanTier = String(listJ?.inheritedNotice?.blockedPlanTier || '').trim().toLowerCase();
    const blockedPlanCap = Math.max(0, Number(listJ?.inheritedNotice?.blockedMaxPublishedLocations || 0) || 0);

    const currentPlanTierRaw = String(listJ?.plan?.tier || '').trim().toLowerCase();
    const currentPlanCapRaw = Math.max(0, Number(listJ?.plan?.maxPublishedLocations || 0) || 0);

    const currentPlanTier = (currentPlanTierRaw && currentPlanTierRaw !== 'unknown')
      ? currentPlanTierRaw
      : blockedPlanTier;

    const currentPlanCap = currentPlanCapRaw > 0
      ? currentPlanCapRaw
      : blockedPlanCap;

    const currentPlanTitle = currentPlanTier
      ? `${currentPlanTier.charAt(0).toUpperCase()}${currentPlanTier.slice(1)}`
      : '';

    const currentPlanCapacityText = currentPlanTier === 'standard'
      ? tSafe('campaign.plan.standard.capacity', '1 location')
      : currentPlanTier === 'multi'
        ? tSafe('campaign.plan.multi.capacity', 'up to 3 locations')
        : currentPlanTier === 'large'
          ? tSafe('campaign.plan.large.capacity', 'up to 10 locations')
          : currentPlanTier === 'network'
            ? tSafe('campaign.plan.network.capacity', '10+ locations')
            : (currentPlanCap > 1 ? `up to ${currentPlanCap} locations` : (currentPlanCap === 1 ? '1 location' : ''));

    const hasBlockedInheritance = Number(listJ?.inheritedNotice?.blockedRows || 0) > 0;

    planStateNote.textContent = currentPlanTitle
      ? `${tSafe('campaign.plan.current.label', 'Current plan')}: ${currentPlanTitle} · ${currentPlanCapacityText}`
      : hasBlockedInheritance
        ? tSafe('campaign.plan.blocked.note', 'This location is eligible on this device, but the running all-locations campaign is already at capacity. Upgrade the plan or remove another location from scope.')
        : tSafe('campaign.plan.choose.note', 'Choose a plan before campaign scope and locations.');

    planSummaryLabel.textContent = currentPlanTitle
      ? `${tSafe('campaign.plan.current.label', 'Current plan')}: ${currentPlanTitle} · ${currentPlanCapacityText}`
      : tSafe('campaign.plan.choose.title', 'Choose plan');

    const suggestedUpgradeTitle = currentPlanTier === 'standard'
      ? tSafe('campaign.plan.multi.title', 'Multi')
      : currentPlanTier === 'multi'
        ? tSafe('campaign.plan.large.title', 'Large')
        : currentPlanTier === 'large'
          ? tSafe('campaign.plan.network.title', 'Network')
          : '';

    if (hasBlockedInheritance) {
      upgradeNote.textContent = suggestedUpgradeTitle
        ? `${tSafe('campaign.plan.current.label', 'Current plan')}: ${currentPlanTitle} · ${currentPlanCapacityText}. Choose ${suggestedUpgradeTitle} to include more locations.`
        : tSafe('campaign.plan.upgrade.body', 'Your current Plan is full. Upgrade to include more locations.');
      upgradeNote.style.display = '';
    }

    const planChips = document.createElement('div');
    planChips.className = 'campaign-funding-chips';

    PLAN_OPTIONS.forEach((plan) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `campaign-funding-chip${plan.code === selectedPlanCode ? ' is-selected' : ''}`;
      btn.textContent = `${plan.title} · €${plan.priceEur} · ${plan.capacityText}`;
      btn.addEventListener('click', () => {
        selectedPlanCode = plan.code;
        upgradeNote.style.display = 'none';
        planChips.querySelectorAll('.campaign-funding-chip').forEach((node) => node.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        refreshScopeUi();
        if (multiScopeEnabled()) {
          try { scopeSelect.focus(); } catch {}
          try { scopeField.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch {}
        }
        syncPresetUi();
        syncLocationRoster();
        updateActivateState();
      });
      planChips.appendChild(btn);
    });

    planBody.appendChild(planStateNote);
    planBody.appendChild(planLabel);
    planBody.appendChild(upgradeNote);
    planBody.appendChild(planChips);
    planField.appendChild(planSummary);
    planField.appendChild(planBody);
    panel.appendChild(planField);

    const presetSelect = document.createElement('select');
    presetSelect.className = 'input';
    PRESET_OPTIONS.forEach((preset) => {
      const o = document.createElement('option');
      o.value = preset.code;
      o.textContent = preset.title;
      if (preset.code === selectedCampaignPreset) o.selected = true;
      presetSelect.appendChild(o);
    });
    presetSelect.addEventListener('change', () => {
      selectedCampaignPreset = String(presetSelect.value || 'promotion').trim().toLowerCase() === 'visibility'
        ? 'visibility'
        : 'promotion';
      syncPresetUi();
    });

    const promoFieldsWrap = document.createElement('div');
    promoFieldsWrap.style.gridColumn = '1 / -1';

    const promoGrid = document.createElement('div');
    promoGrid.className = 'campaign-mgmt-form';

    const scopeField = field(labels.campaignScope, scopeSelect);

    function refreshScopeUi() {
      const enabled = multiScopeEnabled();
      if (!enabled) scopeSelect.value = 'single';
      scopeField.style.display = enabled ? '' : 'none';
      scopeSelect.disabled = !enabled;
    }

    refreshScopeUi();

    form.appendChild(field(labels.campaignPreset, presetSelect));
    form.appendChild(scopeField);
    form.appendChild(field(labels.campaignKey, campaignKey));
    form.appendChild(field(labels.campaignName, campaignName));
    form.appendChild(field(labels.productName, productName));
    form.appendChild(field(labels.campaignType, campaignType));
    form.appendChild(field(labels.targetChannels, targetChannels));
    form.appendChild(field(labels.eligibilityType, eligibilityType));
    form.appendChild(field(labels.eligibilityNotes, eligibilityNotes));
    form.appendChild(field(labels.utmSource, utmSource));
    form.appendChild(field(labels.utmMedium, utmMedium));
    form.appendChild(field(labels.utmCampaign, utmCampaign));
    form.appendChild(field(labels.startDate, startDate));
    form.appendChild(field(labels.endDate, endDate));

    promoGrid.appendChild(field(labels.offerType, offerType));
    promoGrid.appendChild(field(labels.discountKind, discountKind));
    promoGrid.appendChild(field(labels.campaignDiscountValue, discountValue));
    promoFieldsWrap.appendChild(promoGrid);
    form.appendChild(promoFieldsWrap);

    const syncPresetUi = () => {
      const isVisibility = selectedCampaignPreset === 'visibility';
      promoFieldsWrap.style.display = '';
      promoFieldsWrap.style.opacity = isVisibility ? '0.72' : '1';
      offerType.disabled = isVisibility;
      discountKind.disabled = isVisibility;
      discountValue.disabled = isVisibility;
    };

    syncPresetUi();

    const setupChip = document.createElement('details');
    setupChip.className = 'cm-chip cm-setup-chip';

    const setupSummary = document.createElement('summary');
    setupSummary.className = 'modal-menu-item cm-chip-face';

    const setupSummaryLabel = document.createElement('span');
    setupSummaryLabel.className = 'cm-chip-face-label';
    setupSummaryLabel.textContent = tSafe('campaign.ui.setupChip.title', 'Campaign set up');

    const setupSummaryChevron = document.createElement('span');
    setupSummaryChevron.className = 'cm-chip-face-chevron';
    setupSummaryChevron.setAttribute('aria-hidden', 'true');

    setupSummary.appendChild(setupSummaryLabel);
    setupSummary.appendChild(setupSummaryChevron);

    const setupBody = document.createElement('div');
    setupBody.className = 'cm-chip-body';

    setupChip.appendChild(setupSummary);
    setupChip.appendChild(setupBody);
    setupBody.appendChild(form);
    panel.appendChild(setupChip);
    
    const locationPanel = document.createElement('div');
    locationPanel.className = 'campaign-locations-panel';
    locationPanel.style.display = 'none';

    const locationInfo = document.createElement('div');
    locationInfo.className = 'campaign-inline-note';
    locationInfo.textContent = 'Use locations already proven on this device. Add more locations anytime with 🔑 Restore owner access.';
    locationPanel.appendChild(locationInfo);

    const search = buildInput('search', '');
    search.placeholder = locationSearchPlaceholder;
    search.classList.add('campaign-location-search');
    locationPanel.appendChild(search);

    const roster = document.createElement('div');
    roster.className = 'campaign-location-roster';
    locationPanel.appendChild(roster);

    const addAnother = document.createElement('button');
    addAnother.type = 'button';
    addAnother.className = 'cm-action-btn';
    addAnother.textContent = addAnotherLocationLabel;
    addAnother.addEventListener('click', async () => {
      hideModal('campaign-management-modal');
      await showOwnerCenterModal();
    });
    locationPanel.appendChild(addAnother);

    setupBody.appendChild(locationPanel);
    
    const eligibleByUlid = new Map(eligibleLocations.map((loc) => [String(loc?.ulid || '').trim(), loc]));
    const selectedSet = new Set(
      Array.isArray(draft?.selectedLocationULIDs)
        ? draft.selectedLocationULIDs.map((x) => String(x || '').trim()).filter(Boolean)
        : [String(ulid || '').trim()].filter(Boolean)
    );

    const syncLocationRoster = () => {
      const scope = multiScopeEnabled() ? String(scopeSelect.value || 'single').trim() : 'single';
      const revealRoster = (scope === 'selected' || scope === 'all');
      locationPanel.style.display = revealRoster ? '' : 'none';
      roster.innerHTML = '';

      const q = String(search.value || '').trim().toLowerCase();
      const items = Array.isArray(eligibleLocations) ? eligibleLocations.slice() : [];

      const filtered = q
        ? items.filter((loc) => {
            const hay = [
              String(loc?.locationName || ''),
              String(loc?.slug || ''),
              String(loc?.ulid || '')
            ].join(' ').toLowerCase();
            return hay.includes(q);
          })
        : items;

      if (!filtered.length) {
        const empty = document.createElement('p');
        empty.className = 'muted';
        empty.textContent = noEligibleLocationsLabel;
        roster.appendChild(empty);

        if (revealRoster) {
          try { locationPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch {}
          try { search.focus(); } catch {}
        }
        return;
      }

      filtered.forEach((loc) => {
        const id = String(loc?.ulid || '').trim();
        const row = document.createElement('label');
        row.className = 'campaign-location-row';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = scope === 'all' ? true : selectedSet.has(id);
        cb.disabled = scope === 'all';
        cb.addEventListener('change', () => {
          if (cb.checked) selectedSet.add(id);
          else selectedSet.delete(id);
          updateActivateState();
        });

        const text = document.createElement('span');
        text.className = 'label';
        text.innerHTML = `<strong>${String(loc?.locationName || loc?.slug || id).trim()}</strong><br><small>${String(loc?.slug || id).trim()}</small>`;

        row.appendChild(cb);
        row.appendChild(text);
        roster.appendChild(row);
      });

      if (revealRoster) {
        try { locationPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch {}
        try { search.focus(); } catch {}
      }
    };

    const actions = document.createElement('div');
    actions.className = 'cm-actions';

    let btnPublish = null;
    if (p8Draft && p8Draft.draftULID && p8Draft.draftSessionId) {
      const btnEditLocation = document.createElement('button');
      btnEditLocation.className = 'modal-body-button';
      btnEditLocation.type = 'button';
      btnEditLocation.textContent = (typeof t === 'function' && t('locationDraft.ui.editBasics')) || 'Edit business details';
      btnEditLocation.addEventListener('click', () => {
        showRequestListingModal({ prefill: p8Draft });
      });
      actions.appendChild(btnEditLocation);

      if (!guestMode) {
        btnPublish = document.createElement('button');
        btnPublish.className = 'modal-body-button';
        btnPublish.type = 'button';
        btnPublish.textContent = (typeof t === 'function' && t('locationDraft.ui.publish')) || 'Publish listing';
        actions.appendChild(btnPublish);

        const publishHint = document.createElement('small');
        publishHint.className = 'muted';
        publishHint.style.display = 'block';
        publishHint.style.marginTop = '.5rem';
        publishHint.textContent =
          (typeof t === 'function' && t('locationDraft.ui.publishHint')) ||
          'Publish-ready target: description (200+ chars), at least 3 images, and at least one website or social link.';
        actions.appendChild(publishHint);
      }
    }

    const btnCheckout = document.createElement('button');
    btnCheckout.className = 'modal-body-button';
    btnCheckout.type = 'button';
    btnCheckout.textContent = p8Draft
      ? ((typeof t === 'function' && t('locationDraft.commercial.cta')) || 'Continue to payment')
      : ((typeof t === 'function' && t('campaign.ui.activate')) || 'Activate');
    btnCheckout.disabled = true;

    actions.appendChild(btnCheckout);
    panel.appendChild(actions);

    function updateActivateState() {
      const campaignScope = multiScopeEnabled() ? String(scopeSelect.value || 'single').trim() : 'single';
      const selectedCount = Array.from(selectedSet).filter((id) => eligibleByUlid.has(id)).length;
      const ok =
        !!String(campaignKey.value || '').trim() &&
        !!String(startDate.value || '').trim() &&
        !!String(endDate.value || '').trim() &&
        (campaignScope !== 'selected' || selectedCount > 0);

      btnCheckout.disabled = !ok || btnCheckout.classList.contains('is-busy');
    }

    search.addEventListener('input', syncLocationRoster);
    scopeSelect.addEventListener('change', () => {
      syncLocationRoster();
      updateActivateState();
    });
    startDate.addEventListener('input', updateActivateState);
    endDate.addEventListener('input', updateActivateState);
    syncLocationRoster();
    updateActivateState();

    const buildDraft = () => {      
      const campaignScope = multiScopeEnabled() ? String(scopeSelect.value || 'single').trim() : 'single';
      const selectedLocationULIDs = (campaignScope === 'selected')
        ? Array.from(selectedSet).filter((id) => eligibleByUlid.has(id))
        : [];

      return {
        campaignKey: String(campaignKey.value || '').trim(),
        campaignName: String(campaignName.value || '').trim(),
        productName: String(productName.value || '').trim(),
        campaignType: String(campaignType.value || '').trim(),
        targetChannels: [ String(targetChannels.value || '').trim() ].filter(Boolean),
        offerType: String(offerType.value || '').trim(),
        discountKind: String(discountKind.value || '').trim(),
        campaignDiscountValue: discountValue.value === '' ? null : Number(discountValue.value),
        eligibilityType: String(eligibilityType.value || '').trim(),
        eligibilityNotes: String(eligibilityNotes.value || '').trim(),
        utmSource: String(utmSource.value || '').trim(),
        utmMedium: String(utmMedium.value || '').trim(),
        utmCampaign: String(utmCampaign.value || '').trim(),
        startDate: String(startDate.value || '').trim(),
        endDate: String(endDate.value || '').trim(),
        campaignScope,
        campaignPreset: selectedCampaignPreset,
        planCode: selectedPlanCode,
        selectedLocationULIDs
      };
    };

    if (btnPublish) {
      btnPublish.addEventListener('click', async () => {
        if (btnPublish.disabled || btnPublish.classList.contains('is-busy')) return;

        const latestDraft = readPendingLocationDraft() || p8Draft || null;
        const localIssue = p8LocalPublishReadiness(latestDraft);
        if (localIssue) {
          showToast(p8PublishMessage(localIssue), 2600);
          return;
        }

        const publishLabel = (typeof t === 'function' && t('locationDraft.ui.publish')) || 'Publish listing';
        const publishingLabel = (typeof t === 'function' && t('locationDraft.ui.publishing')) || 'Publishing…';

        btnPublish.classList.add('is-busy');
        btnPublish.disabled = true;
        btnPublish.textContent = publishingLabel;

        try {
          const out = await apiJson('/api/location/publish', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              draftULID: String((latestDraft?.draftULID || p8Draft?.draftULID || '')).trim(),
              draftSessionId: String((latestDraft?.draftSessionId || p8Draft?.draftSessionId || '')).trim()
            })
          });

          if (!out.r.ok) {
            const msg = String(out.j?.error?.message || '').trim();
            showToast(
              p8PublishMessage(msg) ||
              ((typeof t === 'function' && t('locationDraft.ui.publishFailed')) || 'Could not publish listing.'),
              2600
            );
            return;
          }

          const publishedSlug = String(out.j?.locationID || '').trim();
          if (!publishedSlug) {
            showToast((typeof t === 'function' && t('locationDraft.ui.publishFailed')) || 'Could not publish listing.', 2600);
            return;
          }

          clearPendingLocationDraft();
          showToast((typeof t === 'function' && t('locationDraft.ui.published')) || 'Listing published.', 2200);
          hideModal(id);

          try {
            await openOwnerSettingsForLocation(publishedSlug);
          } catch {
            // final fallback: reopen CM on the published location
            showCampaignManagementModal(publishedSlug, { preferEmptyDraft: true });
          }
        } finally {
          btnPublish.classList.remove('is-busy');
          btnPublish.disabled = false;
          btnPublish.textContent = publishLabel;
        }
      });
    }

    btnCheckout.addEventListener('click', async () => {
      if (btnCheckout.disabled || btnCheckout.classList.contains('is-busy')) return;

      const activateLabel = (typeof t === 'function' && t('campaign.ui.activate')) || 'Activate';
      const activatingLabel = (typeof t === 'function' && t('campaign.ui.activating')) || 'Activating…';

      btnCheckout.classList.add('is-busy');
      btnCheckout.disabled = true;
      btnCheckout.textContent = activatingLabel;

      try {
        const d = buildDraft();
        if (!d.campaignKey || !d.startDate || !d.endDate) {
          showToast((typeof t==='function' && t('campaign.ui.missingFields')) || 'campaignKey/startDate/endDate required.', 2400);
          return;
        }
        if (d.campaignScope === 'selected' && !d.selectedLocationULIDs.length) {
          showToast(selectAtLeastOneLocationLabel, 2400);
          return;
        }

        let chkJ = null;
        if (listJ) {
          const { r: rSave, j: rSaveJ } = await apiJson('/api/owner/campaigns/draft', {
            method:'POST',
            headers:{'content-type':'application/json'},
            body: JSON.stringify({ ...d, planCode: selectedPlanCode })
          });
          if (!rSave.ok) {
            const code = String((rSaveJ?.error?.code || '')).trim();
            const msg = String((rSaveJ?.error?.message || '')).trim();
            if (code === 'plan_upgrade_required' && msg) {
              upgradeNote.textContent = msg;
              upgradeNote.style.display = '';
            }
            showToast(msg || ((typeof t==='function' && t('campaign.ui.saveFailed')) || 'Could not save draft.'), 2400);
            return;
          }

          const out = await apiJson('/api/owner/campaigns/checkout', {
            method:'POST',
            headers:{'content-type':'application/json'},
            body: JSON.stringify({ locationID: slug, planCode: selectedPlanCode, campaignPreset: selectedCampaignPreset })
          });
          if (!out.r.ok) {
            const code = String((out.j?.error?.code || '')).trim();
            const msg = String((out.j?.error?.message || '')).trim();
            if (code === 'plan_upgrade_required' && msg) {
              upgradeNote.textContent = msg;
              upgradeNote.style.display = '';
            }
            showToast(msg || ((typeof t==='function' && t('campaign.ui.checkoutFailed')) || 'Checkout could not start.'), 2600);
            return;
          }
          chkJ = out.j;
        } else {
          const checkoutBody = (p8Draft && p8Draft.draftULID && p8Draft.draftSessionId)
            ? {
                draftULID: String(p8Draft.draftULID || '').trim(),
                draftSessionId: String(p8Draft.draftSessionId || '').trim(),
                draft: d,
                planCode: selectedPlanCode,
                campaignPreset: selectedCampaignPreset
              }
            : {
                locationID: slug,
                draft: d,
                planCode: selectedPlanCode,
                campaignPreset: selectedCampaignPreset
              };

          const out = await apiJson('/api/campaigns/checkout', {
            method:'POST',
            headers:{'content-type':'application/json'},
            body: JSON.stringify(checkoutBody)
          });
          if (!out.r.ok) {
            const code = String((out.j?.error?.code || '')).trim();
            const msg = String((out.j?.error?.message || '')).trim();
            if (code === 'plan_upgrade_required' && msg) {
              upgradeNote.textContent = msg;
              upgradeNote.style.display = '';
            }
            showToast(msg || ((typeof t==='function' && t('campaign.ui.checkoutFailed')) || 'Checkout could not start.'), 2600);
            return;
          }
          chkJ = out.j;
        }

        if (!chkJ?.url) {
          showToast((typeof t==='function' && t('campaign.ui.checkoutFailed')) || 'Checkout could not start.', 2600);
          return;
        }

        location.href = String(chkJ.url);
      } finally {
        btnCheckout.classList.remove('is-busy');
        btnCheckout.textContent = activateLabel;
        updateActivateState();
      }
    });
  };

  const tSafe = (key, fallback) => {
    const raw = (typeof t === 'function') ? String(t(key) || '').trim() : '';
    return raw && raw !== key ? raw : fallback;
  };

  const PLAN_OPTIONS = [
    { code: 'standard', title: tSafe('campaign.plan.standard.title', 'Standard'), priceEur: 1, capacityText: tSafe('campaign.plan.standard.capacity', '1 location') }, // TESTING: keep €1 until production restore
    { code: 'multi', title: tSafe('campaign.plan.multi.title', 'Multi'), priceEur: 2, capacityText: tSafe('campaign.plan.multi.capacity', 'up to 3 locations') }, // TESTING: keep €2 until production restore
    { code: 'large', title: tSafe('campaign.plan.large.title', 'Large'), priceEur: 349, capacityText: tSafe('campaign.plan.large.capacity', 'up to 10 locations') },
    { code: 'network', title: tSafe('campaign.plan.network.title', 'Network'), priceEur: 749, capacityText: tSafe('campaign.plan.network.capacity', '10+ locations') }
  ];

  const PRESET_OPTIONS = [
    { code: 'visibility', title: tSafe('campaign.plan.preset.visibility', 'Visibility only') },
    { code: 'promotion', title: tSafe('campaign.plan.preset.promotion', 'Promotion') }
  ];

  let selectedPlanCode = ['standard', 'multi', 'large', 'network'].includes(String(listJ?.plan?.tier || '').trim().toLowerCase()) ? String(listJ.plan.tier).trim().toLowerCase() : 'standard'; // Default to the current active tier when known; otherwise Standard
  
  const scopeSingleLabel = tSafe('campaign.ui.scope.single', 'This location only');
  const scopeSelectedLabel = tSafe('campaign.ui.scope.selected', 'Selected locations');
  const scopeAllLabel = tSafe('campaign.ui.scope.all', 'All my locations');
  const locationSearchPlaceholder = tSafe('campaign.ui.locations.search', 'Search locations…');
  const addAnotherLocationLabel = tSafe('campaign.ui.locations.add', 'Add another location');
  const noEligibleLocationsLabel = tSafe('campaign.ui.locations.empty', 'No eligible locations on this device yet.');
  const selectAtLeastOneLocationLabel = tSafe('campaign.ui.locations.validation.one', 'Select at least one location.');
    
  // ───────────────────────────────────────────────────────────────────────────
  // Tab controller (deterministic, single source of truth)
  // ───────────────────────────────────────────────────────────────────────────
  const setActiveTab = (key) => {
    // Keep selector as the single source of truth
    if (viewSel.value !== key) viewSel.value = key;

    clearPanel();

    if (key === 'new') {
      renderDraftEditor();
      return;
    }

    if (key === 'current') {
      if (!rowsActive.length) {
        renderEmpty((typeof t === 'function' && t('campaign.ui.empty.current')) || 'No active campaigns.');
        return;
      }
      renderCampaignCards(rowsActive, 'current');
      return;
    }

    // history
    if (!rowsFinished.length) {
      renderEmpty((typeof t === 'function' && t('campaign.ui.empty.history')) || 'No finished campaigns.');
      return;
    }
    renderCampaignCards(rowsFinished, 'history');
  };

  viewSel.addEventListener('change', () => {
    const v = String(viewSel.value || 'new');
    setActiveTab(v);
  });

  // Default open: New campaign
  setActiveTab(String(opts.openTab || 'new'));

  showModal(id);
}
// --- End Campaign Management ----------------------------------------------------

export async function showOwnerCenterModal() {
  const id = 'owner-center-modal';
  // Always rebuild so the list is never stale/empty after Restore/Switch.
  document.getElementById(id)?.remove();

  const buildPromise = createOwnerCenterModal();
  showModal(id);
  await buildPromise;
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
export function injectModal({ id, title = '', bodyHTML = '', footerButtons = [], layout = '', modalClassName = '', onClose = null }) {  
  let existing = document.getElementById(id);
  if (existing) return existing;

  // hidden by default; CSS shows :not(.hidden)
  const modal = document.createElement('div');
  modal.classList.add('modal', 'hidden');
  modal.id = id;
  String(modalClassName || '').split(/\s+/).filter(Boolean).forEach((cls) => modal.classList.add(cls));

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
      ${title ? `
        <div class="modal-top-bar">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
      ` : ''}
      <div class="modal-body"><div class="modal-body-inner">${bodyHTML}</div></div>
      ${footerHTML}
    </div>
  `;

  document.body.appendChild(modal);

  // Standard modal close (X) wiring for injectModal-created modals
  modal.querySelector('.modal-close')?.addEventListener('click', (e) => {
    if (typeof onClose === 'function') {
      onClose(e, modal);
      return;
    }

    hideModal(id);
  });

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

  // Ensure the modal is topmost among other .modal siblings (DOM order defines stacking for equal z-index).
  // Reason: previously created modals (e.g., Owner center) can end up behind newly appended LPMs.
  document.body.appendChild(modal);
  syncModalHeaderHelp(modal);

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

function buildPromotionSummaryCard({
  discountText,
  campaignName = '',
  locationName = '',
  productName = '',
  eligibilityText = '',
  startDate,
  endDate
}) {
  const safeDate = (v) => {
    const s = String(v || '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  };

  const startStr = safeDate(startDate);
  const endStr = safeDate(endDate);
  const range = (startStr && endStr) ? `${startStr} \u2192 ${endStr}` : '';

  const summary = document.createElement('div');
  summary.className = 'modal-menu-item promo-summary-card';

  const label = document.createElement('div');
  label.className = 'label';
  label.style.flex = '1 1 auto';
  label.style.minWidth = '0';
  label.style.textAlign = 'left';

  const titleText = String(discountText || '').trim() || 'Promotion';
  const title = document.createElement('strong');
  title.textContent = titleText;
  label.appendChild(title);

  const eligibilityLabelRaw =
    (typeof t === 'function') ? String(t('promotion.eligibility.label') || '').trim() : '';
  const eligibilityLabel =
    (eligibilityLabelRaw && eligibilityLabelRaw !== 'promotion.eligibility.label')
      ? eligibilityLabelRaw
      : 'Eligibility';

  const seen = new Set([titleText.toLowerCase()]);

  const appendSmall = (value) => {
    const text = String(value || '').trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);

    const small = document.createElement('small');
    small.textContent = text;
    small.style.display = 'block';
    small.style.marginTop = '4px';
    label.appendChild(small);
  };

  appendSmall(campaignName);
  appendSmall(locationName);
  appendSmall(productName);
  appendSmall(eligibilityText ? `${eligibilityLabel}: ${eligibilityText}` : '');
  appendSmall(range);

  summary.appendChild(label);
  return summary;
}

async function hydrateCashierRedeemCampaignContext({ inner, locationIdOrSlug, campaignKey }) {
  if (!inner || !locationIdOrSlug || !campaignKey) {
    console.warn('[redeem-campaign] skipped: missing args', { locationIdOrSlug, campaignKey, hasInner: !!inner });
    return;
  }

  let marker = null;

  try {
    inner.dataset.redeemCampaignHydrator = 'started';

    // Visible probe: if this never appears in real, the live page is not running this bundle/path.
    marker = document.createElement('div');
    marker.className = 'modal-menu-item promo-summary-card';
    marker.setAttribute('data-redeem-campaign-probe', '1');
    marker.innerHTML = `
      <div class="label" style="flex:1 1 auto; min-width:0;">
        <strong>Loading campaign…</strong><br>
        <small>${String(campaignKey || '').trim()}</small>
      </div>
    `;
    inner.insertBefore(marker, inner.firstChild);

    const base = TRACK_BASE || 'https://navigen-api.4naama.workers.dev';
    const url = new URL('/api/campaign-summary', base);
    url.searchParams.set('locationID', String(locationIdOrSlug).trim());
    url.searchParams.set('campaignKey', String(campaignKey).trim());

    console.info('[redeem-campaign] fetch', url.toString());

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      console.error('[redeem-campaign] non-ok response', { status: res.status, statusText: res.statusText });
      inner.dataset.redeemCampaignHydrator = `http-${res.status}`;
      return;
    }

    const payload = await res.json().catch((err) => {
      console.error('[redeem-campaign] json parse failed', err);
      return null;
    });
    if (!payload) {
      inner.dataset.redeemCampaignHydrator = 'no-payload';
      return;
    }

    console.info('[redeem-campaign] payload', payload);

    const campaignName = String(payload?.campaignName || '').trim();
    const locationName = String(payload?.locationName || '').trim();
    const productName = String(payload?.productName || '').trim();
    const eligibilityText = String(payload?.eligibilityNotes || payload?.eligibilityType || '').trim();

    const discountKind = String(payload?.discountKind || '').trim().toLowerCase();
    const discountValue = typeof payload?.discountValue === 'number' ? payload.discountValue : null;

    const discountText =
      (discountKind === 'percent' && typeof discountValue === 'number')
        ? `${discountValue.toFixed(0)}% off your purchase`
        : (campaignName || 'Promotion');

    const header = document.createElement('p');
    header.textContent = campaignName || campaignKey;
    header.style.textAlign = 'left';
    header.style.fontSize = '0.85em';
    header.style.opacity = '0.8';
    header.style.marginBottom = '0.5rem';

    const summary = buildPromotionSummaryCard({
      discountText,
      campaignName,
      locationName,
      productName,
      eligibilityText,
      startDate: payload?.startDate,
      endDate: payload?.endDate
    });

    marker?.remove();
    inner.insertBefore(summary, inner.firstChild);
    inner.insertBefore(header, summary);

    inner.dataset.redeemCampaignHydrator = 'done';
  } catch (err) {
    console.error('[redeem-campaign] failed', err);
    inner.dataset.redeemCampaignHydrator = 'failed';
    // campaign context is UI-only; never break redeem confirmation
  }
}

function appendRedeemCampaignSummary(inner, campaignContext) {
  if (!inner || !campaignContext) return;

  const campaignName = String(campaignContext?.campaignName || '').trim();
  const locationName = String(campaignContext?.locationName || '').trim();
  const productName = String(campaignContext?.productName || '').trim();
  const eligibilityText = String(campaignContext?.eligibilityNotes || campaignContext?.eligibilityType || '').trim();
  const discountKind = String(campaignContext?.discountKind || '').trim().toLowerCase();
  const discountValue = typeof campaignContext?.discountValue === 'number' ? campaignContext.discountValue : null;

  const discountText =
    (discountKind === 'percent' && typeof discountValue === 'number')
      ? `${discountValue.toFixed(0)}% off your purchase`
      : (campaignName || 'Promotion');

  const summary = buildPromotionSummaryCard({
    discountText,
    campaignName,
    locationName: locationName || campaignName,
    productName,
    eligibilityText,
    startDate: campaignContext?.startDate,
    endDate: campaignContext?.endDate
  });

  inner.appendChild(summary);
}

// Cashier-side Redeem Confirmation modal.
// Shown only on the device that followed the /out/qr-redeem redirect,
// separate from the LPM rating widget. Logs redeem-confirmation-cashier via /hit.
export function showRedeemConfirmationModal({ locationIdOrSlug, campaignKey = '', campaignContext = null }) {
  const modalId = 'cashier-redeem-confirmation-modal';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const resolvedCampaignKey = String(campaignContext?.campaignKey || campaignKey || '').trim();

  if (!locationIdOrSlug || (!campaignContext && !resolvedCampaignKey)) {
    console.warn('[cashier-redeem-confirmation] skipped: missing campaign card context', {
      locationIdOrSlug: String(locationIdOrSlug || '').trim(),
      campaignKey: resolvedCampaignKey,
      hasCampaignContext: !!campaignContext
    });
    return;
  }

  const wrap = document.createElement('div');
  wrap.id = modalId;
  wrap.className = 'modal hidden';

  const card = document.createElement('div');
  card.className = 'modal-content modal-menu';

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

  const tSafe = (key, fallback) => {
    const raw = hasT ? String(t(key) || '').trim() : '';
    return raw && raw !== key ? raw : fallback;
  };

  const questionTxt = tSafe(
    'redeem.confirm.question',
    'How smooth did the redemption go?'
  );

  // If campaign context was provided by the caller, render the promotion summary immediately.
  // Otherwise, hydrate it on-demand from the worker so the cashier always sees the promo card before rating.
  if (campaignContext) {
    appendRedeemCampaignSummary(inner, campaignContext);
  } else {
    hydrateCashierRedeemCampaignContext({
      inner,
      locationIdOrSlug,
      campaignKey: resolvedCampaignKey
    }).catch(() => {
      // campaign context is UI-only; never break redeem confirmation
    });
  }

  const pQ = document.createElement('p');
  pQ.textContent = questionTxt;
  pQ.style.textAlign = 'center';
  pQ.style.marginBottom = '0.75rem';
  inner.appendChild(pQ);

  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.justifyContent = 'center';
  row.style.gap = '0.5rem';
  row.style.flexWrap = 'wrap';

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
      if (resolvedCampaignKey) url.searchParams.set('campaignKey', resolvedCampaignKey);

      fetch(url.toString(), {
        method: 'POST',
        keepalive: true
      }).catch(() => {});
    } catch (_e) {
      // logging must never break UI
    }
  };

  faces.forEach(({ emoji, score }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emoji;
    btn.setAttribute('aria-label', `Redeem confirmation score ${score}`);
    btn.style.fontSize = '1.5rem';
    btn.style.lineHeight = '1';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.cursor = 'pointer';
    btn.style.padding = '0.25rem';
    btn.addEventListener('click', () => {
      sendConfirmation(score);
      hideModal(modalId);
    });
    row.appendChild(btn);
  });

  inner.appendChild(row);

  const hintTxt = tSafe(
    'redeem.confirm.hint',
    'Tap one face to confirm the redeem event.'
  );

  const hint = document.createElement('p');
  hint.textContent = hintTxt;
  hint.style.textAlign = 'center';
  hint.style.fontSize = '0.85em';
  hint.style.opacity = '0.8';
  hint.style.marginTop = '0.75rem';
  hint.style.marginBottom = '0';
  inner.appendChild(hint);

  body.appendChild(inner);
  card.appendChild(top);
  card.appendChild(body);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  showModal(modalId);
}

export function showRedeemInvalidModal({
  locationIdOrSlug,
  campaignKey = '',
  campaignContext = null,
  outcome = 'invalid'
}) {
  const modalId = 'cashier-redeem-invalid-modal';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  if (!locationIdOrSlug) return;

  const wrap = document.createElement('div');
  wrap.id = modalId;
  wrap.className = 'modal hidden';
  if (outcome === 'used') wrap.classList.add('redeem-used-state');

  const card = document.createElement('div');
  card.className = 'modal-content modal-menu';

  const top = document.createElement('div');
  top.className = 'modal-top-bar';

  const hasT = (typeof t === 'function');

  const titleTxt =
    outcome === 'used'
      ? ((hasT ? (t('redeem.invalid.used.title') || '') : '') || 'Promo code already used')
      : outcome === 'inactive'
        ? ((hasT ? (t('redeem.invalid.inactive.title') || '') : '') || 'Campaign inactive')
        : ((hasT ? (t('redeem.invalid.title') || '') : '') || 'Promo code not valid');

  top.innerHTML = `
    <h2 class="modal-title">${titleTxt}</h2>
    <button class="modal-close" aria-label="Close">&times;</button>
  `;

  top.querySelector('.modal-close')?.addEventListener('click', () => hideModal(modalId));

  const body = document.createElement('div');
  body.className = 'modal-body';

  const inner = document.createElement('div');
  inner.className = 'modal-body-inner';

  if (campaignContext) {
    appendRedeemCampaignSummary(inner, campaignContext);
  } else if (campaignKey) {
    hydrateCashierRedeemCampaignContext({
      inner,
      locationIdOrSlug,
      campaignKey
    }).catch(() => {
      // campaign context is UI-only; never break invalid redeem feedback
    });
  }

  const messageTxt =
    outcome === 'used'
      ? ((hasT ? (t('redeem.invalid.used.body') || '') : '') || 'This promo code was already redeemed. Do not apply the promotion again.')
      : outcome === 'inactive'
        ? ((hasT ? (t('redeem.invalid.inactive.body') || '') : '') || 'This promo code belongs to a campaign that is not active. Do not apply the promotion.')
        : ((hasT ? (t('redeem.invalid.body') || '') : '') || 'This promo code cannot be redeemed. Do not apply the promotion.');

  const p = document.createElement('p');
  p.textContent = messageTxt;
  p.style.textAlign = 'center';
  p.style.marginBottom = '0.75rem';
  inner.appendChild(p);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.className = 'modal-body-button';
  okBtn.textContent = (hasT ? (t('redeem.invalid.close') || '') : '') || 'OK';
  okBtn.addEventListener('click', () => hideModal(modalId));

  actions.appendChild(okBtn);
  inner.appendChild(actions);

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
  document.getElementById('my-stuff-modal')?.remove();

  injectModal({
    id: 'my-stuff-modal',
    title: (typeof t === 'function' && t('myStuff.title')) || 'My stuff',
    layout: 'menu',
    bodyHTML: `<div id="my-stuff-body"></div>`,
    onClose: (e, modal) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();

      const currentState = String(modal?.dataset?.myStuffState || 'menu').trim();

      if (currentState === 'menu') {
        hideModal('my-stuff-modal');
        return;
      }

      showMyStuffModal('menu');
    }
  });
}

/* Favorites Modal (FM): list saved locations with open/unsave */
export function createFavoritesModal() {
  if (document.getElementById("favorites-modal")) return;

  injectModal({
    id: "favorites-modal",
    title: t("favorites") || "Favorites",
    layout: "menu",
    bodyHTML: `<div id="favorites-body"></div>`
  });
}

export function createPromotionsModal() {
  if (document.getElementById("promotions-modal")) return;

  injectModal({
    id: "promotions-modal",
    title: t("promotions") || "Promotions",
    layout: "menu", // keep Promotions on the same shared menu shell as Select your business
    bodyHTML: `<div id="promotions-body"></div>`,
    modalClassName: "modal-wide-menu"
  });
}

export function showPromotionsModal() {
  if (!document.getElementById("promotions-modal")) {
    createPromotionsModal();
  }

  const modal = document.getElementById("promotions-modal");
  const body = modal?.querySelector("#promotions-body");
  const title = modal?.querySelector(".modal-top-bar .modal-title");  
  const topBar = modal?.querySelector(".modal-top-bar");
  if (!modal || !body || !title || !topBar) return;

  const tSafe = (key, fallback) => {
    const raw = (typeof t === 'function') ? String(t(key) || '').trim() : '';
    return raw && raw !== key ? raw : fallback;
  };

  title.textContent = tSafe("promotions", "Promotions");
  body.innerHTML = "";
  topBar.querySelector('.select-location-search-row')?.remove();

  const list = document.createElement("div");
  list.className = "modal-menu-list";
  body.appendChild(list);

  const renderEmpty = (msg) => {
    list.innerHTML = "";
    const empty = document.createElement("p");
    empty.className = "muted muted-note";
    empty.textContent = msg;
    list.appendChild(empty);
  };

  const formatDate = (value) => {
    const s = String(value || "").trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
  };

  const toDiscountValue = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return null;
  };

  const buildSearchText = (camp) => {
    const campaignKey = String(camp?.campaignKey || '').trim();
    const campaignName =
      String(camp?.campaignName || '').trim() ||
      tSafe("promotion.unnamed", "Promotion");
    const locationName = String(camp?.locationName || '').trim();
    const productName = String(camp?.productName || camp?.offerType || '').trim();
    const eligibilityText = String(camp?.eligibilityNotes || camp?.eligibilityType || '').trim();
    const discountKind = String(camp?.discountKind || '').trim().toLowerCase();
    const discountValue = toDiscountValue(camp?.discountValue);
    const startDate = formatDate(camp?.startDate);
    const endDate = formatDate(camp?.endDate);

    const discountText =
      (discountKind === 'percent' && typeof discountValue === 'number')
        ? `${discountValue.toFixed(0)}% off your purchase`
        : campaignName;

    return [
      campaignKey,
      campaignName,
      locationName,
      productName,
      eligibilityText,
      String(camp?.context || '').trim(),
      discountKind,
      (discountValue != null ? String(discountValue) : ''),
      discountText,
      startDate,
      endDate
    ].join(' ').toLowerCase();
  };

  const renderList = (items, hasFilter = false) => {
    list.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
      renderEmpty(
        hasFilter
          ? tSafe("promotions.search.emptyFiltered", "No campaigns match this filter.")
          : tSafe("no.promotions.yet", "No promotions are running right now.")
      );
      return;
    }

    items.forEach((camp) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "modal-menu-item promotion-item";

      const campaignName =
        String(camp?.campaignName || "").trim() ||
        tSafe("promotion.unnamed", "Promotion");
      const locationName = String(camp?.locationName || "").trim();
      const productName = String(camp?.productName || camp?.offerType || "").trim();
      const eligibilityText = String(camp?.eligibilityNotes || camp?.eligibilityType || '').trim();

      const discountKind = String(camp?.discountKind || "").trim().toLowerCase();
      const discountValue = toDiscountValue(camp?.discountValue);
      const discountText =
        (discountKind === "percent" && typeof discountValue === "number")
          ? `${discountValue.toFixed(0)}% off your purchase`
          : campaignName;

      const summary = buildPromotionSummaryCard({
        discountText,
        campaignName,
        locationName,
        productName,
        eligibilityText,
        startDate: formatDate(camp?.startDate),
        endDate: formatDate(camp?.endDate)
      });

      const label = summary.querySelector(".label");
      if (label) {
        row.appendChild(label.cloneNode(true));
      }

      const actionsCol = document.createElement("div");
      actionsCol.className = "promotion-actions-col";
      actionsCol.innerHTML = `
        <span class="promotion-chevron" aria-hidden="true">▾</span>
        <button type="button" class="promotion-lpm-link" aria-label="Open location">➡️</button>
      `;
      row.appendChild(actionsCol);

      const locIdent = String(
        camp?.locationID ||
        camp?.locationId ||
        camp?.locationSlug ||
        camp?.locationAlias ||
        camp?.alias ||
        camp?.slug ||
        camp?.locationULID ||
        camp?.locationKey ||
        camp?.id ||
        ''
      ).trim();

      const promotionTarget = {
        locationID: locIdent,
        locationSlug: String(camp?.locationSlug || camp?.slug || '').trim(),
        locationULID: String(camp?.locationULID || camp?.locationID || '').trim(),
        alias: String(camp?.locationAlias || camp?.alias || '').trim(),
        id: String(camp?.id || '').trim(),
        locationName,
        name: locationName,
        displayName: locationName,
        campaignKey: String(camp?.campaignKey || '').trim()
      };

      if (locIdent) row.setAttribute('data-locationid', locIdent);

      row.addEventListener("click", () => {
        openPromotionQrModal(row, promotionTarget);
      });

      actionsCol.querySelector('.promotion-lpm-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideModal("promotions-modal");

        if (!locIdent) return;

        sessionStorage.setItem('navigen.internalLpNav', '1');
        window.location.href = `${location.origin}/?lp=${encodeURIComponent(locIdent)}`;
      });

      list.appendChild(row);
    });
  };

  const rootSearch =
    document.getElementById('search') ||
    document.querySelector('input#search') ||
    document.querySelector('input[type="search"]');

  const cloned = rootSearch ? rootSearch.cloneNode(true) : document.createElement('input');
  const input = (cloned instanceof HTMLInputElement) ? cloned : document.createElement('input');

  input.type = 'search';
  input.id = 'promotions-search';
  input.spellcheck = false;
  input.autocapitalize = 'off';
  input.autocomplete = 'off';
  input.value = '';

  const placeholder = tSafe('promotions.search.placeholder', 'Search here…').trim();
  input.placeholder = placeholder.startsWith('🔍') ? placeholder : `🔍 ${placeholder}`;

  const searchRow = document.createElement('div');
  searchRow.className = 'select-location-search-row';

  const searchLeft = document.createElement('div');
  searchLeft.className = 'select-location-search-left';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-x';
  clearBtn.id = 'promotions-clear-search';
  clearBtn.textContent = 'x';
  clearBtn.style.display = 'none';
  clearBtn.setAttribute('aria-label', t('common.search.clear') || 'Clear search');

  searchLeft.appendChild(input);
  searchLeft.appendChild(clearBtn);
  searchRow.appendChild(searchLeft);

  const pinFilterBtn = document.createElement('button');
  pinFilterBtn.type = 'button';
  pinFilterBtn.className = 'select-location-info-btn promotions-pin-filter-btn';
  pinFilterBtn.textContent = '⭐';
  pinFilterBtn.setAttribute('aria-pressed', 'false');
  pinFilterBtn.setAttribute(
    'aria-label',
    tSafe('promotions.pinnedFilter.off', 'Show pinned campaigns only')
  );
  pinFilterBtn.title = tSafe('promotions.pinnedFilter.off', 'Show pinned campaigns only');
  searchRow.appendChild(pinFilterBtn);

  topBar.appendChild(searchRow);

  let running = [];
  let pinnedOnly = false;

  const pinEntryFor = (camp) => ({
    campaignKey: String(camp?.campaignKey || '').trim(),
    locationID: String(
      camp?.locationID ||
      camp?.locationId ||
      camp?.locationSlug ||
      camp?.slug ||
      camp?.locationULID ||
      ''
    ).trim(),
    campaignName: String(camp?.campaignName || '').trim(),
    startDate: formatDate(camp?.startDate),
    endDate: formatDate(camp?.endDate)
  });

  const orderPinnedFirst = (items) => (
    Array.isArray(items) ? items : []
  )
    .map((camp, index) => ({
      camp,
      index,
      pinned: isPinnedPromotion(pinEntryFor(camp))
    }))
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (a.index - b.index))
    .map(({ camp }) => camp);

  const syncClear = () => {
    const hasValue = !!String(input.value || '').trim();
    clearBtn.style.display = hasValue ? 'inline-flex' : 'none';
  };

  const syncPinnedFilterBtn = () => {
    pinFilterBtn.classList.toggle('is-active', pinnedOnly);
    pinFilterBtn.setAttribute('aria-pressed', pinnedOnly ? 'true' : 'false');

    const label = pinnedOnly
      ? tSafe('promotions.pinnedFilter.on', 'Showing pinned campaigns only')
      : tSafe('promotions.pinnedFilter.off', 'Show pinned campaigns only');

    pinFilterBtn.setAttribute('aria-label', label);
    pinFilterBtn.title = label;
  };

  const applyFilter = () => {
    const q = String(input.value || '').trim().toLowerCase();
    syncClear();
    syncPinnedFilterBtn();

    let filtered = pinnedOnly
      ? running.filter((camp) => isPinnedPromotion(pinEntryFor(camp)))
      : running.slice();

    if (q) {
      filtered = filtered.filter((camp) => buildSearchText(camp).includes(q));
    }

    renderList(orderPinnedFirst(filtered), !!q || pinnedOnly);
  };

  input.addEventListener('input', applyFilter);

  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    syncClear();
  });

  pinFilterBtn.addEventListener('click', () => {
    pinnedOnly = !pinnedOnly;
    applyFilter();
  });

  syncClear();
  syncPinnedFilterBtn();

  const segs = location.pathname.split("/").filter(Boolean);
  if (/^[a-z]{2}$/i.test(segs[0] || "")) segs.shift();
  const pageKey =
    segs.length >= 2
      ? `${segs[0].toLowerCase()}/${segs.slice(1).join("/").toLowerCase()}`
      : "";

  fetch(`/api/campaigns/active?context=${encodeURIComponent(pageKey)}`, { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : { items: [] }))
    .then((payload) => {
      running = Array.isArray(payload?.items) ? payload.items : [];
      applyFilter();
      showModal("promotions-modal");
      setupTapOutClose("promotions-modal");
    })
    .catch(() => {
      renderEmpty(tSafe("promotions.error", "Promotions are unavailable right now."));
      showModal("promotions-modal");
      setupTapOutClose("promotions-modal");
    });
}

export function showFavoritesModal() {
  if (!document.getElementById("favorites-modal")) createFavoritesModal();

  const modal = document.getElementById("favorites-modal");
  const body = modal.querySelector("#favorites-body");
  const title = modal.querySelector(".modal-top-bar .modal-title");  
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
    empty.className = "muted muted-note";    
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
      <div class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
        <button class="open-fav" type="button" style="all:unset; cursor:pointer; display:block; width:100%;">
          ${String((item?.locationName?.en ?? item?.locationName ?? item?.name ?? '')).trim() || t("common.unnamed")}          
        </button>
      </div>
      <button class="unsave-fav clear-x" type="button" aria-label="${t("common.remove")}">✖</button>      
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

  if (!document.getElementById('my-stuff-modal')) {
    createMyStuffModal();
  }

  const modal = document.getElementById('my-stuff-modal');
  modal.dataset.myStuffState = state;  
  const title = modal?.querySelector('.modal-top-bar .modal-title');
  const body = modal?.querySelector('#my-stuff-body');

  modal?.querySelector('.modal-footer')?.remove();

  if (!modal || !title || !body) {
    console.warn('❌ Missing myStuffModal structure.');
    return;
  }

  const setBodyActions = (buttons = []) => {
    body.querySelector('.modal-actions.my-stuff-actions')?.remove();
    if (!buttons.length) return;

    const host =
      body.querySelector('.modal-form-stack') ||
      body.querySelector('.no-miss-section') ||
      body;

    if (!(host instanceof HTMLElement)) return;

    const actions = document.createElement('div');
    actions.className = 'modal-actions my-stuff-actions';
    actions.innerHTML = buttons.map((btn) => `
      <button type="button" class="${btn.className || 'modal-body-button'}" id="${btn.id}">${btn.label}</button>
    `).join('');

    buttons.forEach((btn) => {
      actions.querySelector(`#${btn.id}`)?.addEventListener('click', btn.onClick);
    });

    host.appendChild(actions);
  };

  if (state === 'menu') {
    title.textContent = (typeof t === 'function' && t('myStuff.title')) || 'My stuff';    
    body.innerHTML = ''; // clear body before injecting

    const list = document.createElement('div');
    list.className = 'modal-menu-list';

    myStuffItems.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-menu-item';

      btn.innerHTML = `
        <span class="icon-img" aria-hidden="true">${item.icon}</span>
        <span class="label">
          <strong>${item.title}</strong><br>
          <small>${item.desc}</small>
        </span>
      `;

      btn.addEventListener('click', () => {
        showMyStuffModal(item.view);
      });

      list.appendChild(btn);
    });

    body.appendChild(list);
    showModal('my-stuff-modal');
    return;
  }

  const item = myStuffItems.find((i) => i.view === state);
  if (!item) return;

  title.textContent = item.title;
  body.innerHTML = '';

  if (state === 'interests') {
    body.innerHTML = `
      <div class="modal-form-stack">
        <p class="muted muted-note">Select topics you care about:</p>
        <div class="community-grid">
          <button class="community-button">🏆 Vote</button>
          <button class="community-button">💫 Wish</button>
          <button class="community-button">🧳 Lost</button>
          <button class="community-button">📍 Track</button>
          <button class="community-button">❓ Quizzy</button>
        </div>
      </div>
    `;

    showModal('my-stuff-modal');
    return;
  }

  if (state === 'language') {
    body.innerHTML = `<div class="flag-list"></div>`;
    const flagList = body.querySelector('.flag-list');

    const allFlags = [
      'GB', 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
      'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS',
      'NO', 'CH', 'TR', 'IL', 'RU', 'UA', 'CN', 'SA', 'IN', 'KR', 'JP'
    ];

    // You can expand this list as translations become available.
    let availableLangs = new Set(['en', 'de', 'fr', 'hu']); // fallback
    availableLangs = await fetchTranslatedLangs();

    allFlags.forEach((code) => {
      const img = document.createElement('img');
      img.src = `/assets/flags/${code}.svg`;
      img.alt = code;
      img.title = code;
      img.className = 'flag';
      img.style.width = '40px';
      img.style.height = '40px';
      img.style.margin = '4px';
      img.style.borderRadius = '4px';
      img.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

      // Lookup language from country code
      const langCode = getLangFromCountry(code);
      const isAvailable = availableLangs.has(langCode);

      if (isAvailable) {
        img.style.cursor = 'pointer';

        // Persist choice and navigate to the path-locale; drop ?lang, keep other params/hash.
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          localStorage.setItem('lang', langCode); // save for future visits

          const parts = location.pathname.split('/').filter(Boolean);
          const hasPrefix = /^[a-z]{2}$/.test(parts[0]);
          const rest = '/' + (hasPrefix ? parts.slice(1).join('/') : parts.join('/'));

          const target =
            langCode === 'en'
              ? (rest === '/' ? '/' : rest)
              : `/${langCode}${rest === '/' ? '' : rest}`;

          const qs = new URLSearchParams(location.search);
          qs.delete('lang');
          const query = qs.toString() ? `?${qs}` : '';

          location.href = `${target}${query}${location.hash || ''}`;
        });
      } else {
        img.style.opacity = '0.4';
        img.style.pointerEvents = 'none';
        img.style.cursor = 'default';
      }

      flagList?.appendChild(img);
    });

    flagStyler();
    showModal('my-stuff-modal');
    return;
  }

  if (state === 'social') {
    body.innerHTML = `
      <div class="modal-form-stack">
        <p>${item.desc}</p>
      </div>
    `;

    showModal('my-stuff-modal');
    return;
  }

  if (state === 'purchases') {
    body.innerHTML = `<div id="purchase-history" class="modal-menu-list"></div>`;
    renderPurchaseHistory(); // Fill with receipts from localStorage
    showModal('my-stuff-modal');
    return;
  }

  if (state === 'location-history') {
    body.innerHTML = `<div id="location-history" class="modal-menu-list"></div>`;
    renderLocationHistory(); // Inject saved locations or empty state
    showModal('my-stuff-modal');
    return;
  }

  if (state === 'reset') {
    body.innerHTML = `
      <div class="modal-form-stack">
        <p>This will clear your settings and restart the app.</p>
        <p>This action cannot be undone.</p>
      </div>
    `;

    setBodyActions([
      {
        id: 'reset-cancel',
        label: (typeof t === 'function' && t('common.cancel')) || 'Cancel',
        onClick: () => showMyStuffModal('menu')        
      },
      {
        id: 'reset-confirm',
        label: 'Reset',
        onClick: () => {
          localStorage.clear();

          const currentLang = (document.documentElement.lang || 'en').toLowerCase();
          const parts = location.pathname.split('/').filter(Boolean);
          const hasPrefix = /^[a-z]{2}$/.test(parts[0]);
          const rest = '/' + (hasPrefix ? parts.slice(1).join('/') : parts.join('/'));

          const target = currentLang === 'en'
            ? (rest === '/' ? '/' : rest)
            : `/${currentLang}${rest === '/' ? '' : rest}`;

          const qs = new URLSearchParams(location.search);
          qs.delete('lang');
          const query = qs.toString() ? `?${qs}` : '';

          location.href = `${target}${query}${location.hash || ''}`;
        }
      }
    ]);

    showModal('my-stuff-modal');
    return;
  }

  if (state === 'data') {
    body.innerHTML = `
      <div class="modal-form-stack">
        <p>${t('myStuff.data.bodyIntro')}</p>
        <p>${t('myStuff.data.includes')}</p>
        <ul>
          <li>${t('myStuff.data.item.purchase')}</li>
          <li>${t('myStuff.data.item.language')}</li>
          <li>${t('myStuff.data.item.location')}</li>
        </ul>
        <p class="modal-warning">⚠️ ${t('myStuff.data.warning')}</p>
        <p>${t('myStuff.data.resetPrompt')}</p>
        <div class="modal-actions">
          <a href="/assets/docs/navigen-privacy-policy.pdf" target="_blank" class="modal-body-button">
            📄 ${t('myStuff.data.viewPolicy')}
          </a>
        </div>
      </div>
    `;

    showModal('my-stuff-modal');
    return;
  }

  if (state === 'terms') {
    body.innerHTML = `
      <div class="modal-form-stack">
        <p>${t('myStuff.terms.body')}</p>
        <div class="modal-actions">
          <a href="/assets/docs/navigen-terms.pdf" target="_blank" class="modal-body-button">
            📄 ${t('myStuff.terms.viewFull')}
          </a>
        </div>
      </div>
    `;

    showModal('my-stuff-modal');
    return;
  }

  if (state === 'no-miss') {
    body.innerHTML = `
      <div class="no-miss-section">
        <div class="no-miss-block">
          <div class="no-miss-title">📌 ${t('noMiss.install.title')}</div>
          <div class="no-miss-body">${t('noMiss.install.body')}</div>
        </div>

        <div class="no-miss-block">
          <div class="no-miss-title">💡 ${t('noMiss.refresh.title')}</div>
          <div class="no-miss-body">
            ${t('noMiss.refresh.bodyStart')}
            <span class="inline-icon logo-icon"></span>
            ${t('noMiss.refresh.bodyEnd')}
            <br>🌀 ${t('noMiss.refresh.relax')}
          </div>
        </div>

        <div class="no-miss-block">
          <div class="no-miss-title">👋 ${t('noMiss.support.title')}</div>
          <div class="no-miss-body">${t('noMiss.support.body')}</div>
        </div>

        <div class="no-miss-thanks">
          🎉 ${t('noMiss.thanks')}
        </div>
      </div>
    `;

    showModal('my-stuff-modal');
    return;
  }

  showModal('my-stuff-modal');
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
    <h2 id="alert-title" class="modal-title">${t("alert.title") || "🚨 Current alerts"}</h2>    
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
    title: t("help.title") || "🆘 Emergency numbers",
    layout: "menu",
    bodyHTML: `
      <p class="muted" data-i18n="help.intro">
        Hello! We’re here to assist you. Tap an emergency number to call from your phone.
      </p>

      <p style="margin:0.75em 0;">
        <span class="detected-label" data-i18n="help.detectedRegion">Detected region</span>:
        <strong id="emg-region-label">—</strong>
      </p>

      <div id="emg-buttons" class="community-actions"></div>

      <div style="margin-top:0.75em;">
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
    <h2 id="share-title" class="modal-title">${t("share.button")}</h2>    
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
export function setupTapOutClose(modalId, onClose = null) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Backdrop (tap-out): close only when clicking the overlay itself
  const onBackdropClick = (e) => {
    if (e.target !== modal) return;
    if (typeof onClose === 'function') {
      onClose(e, modal);
      return;
    }
    hideModal(modalId);
  };

  modal.removeEventListener('click', onBackdropClick);
  modal.addEventListener('click', onBackdropClick, { passive: true });

  // ESC: close (idempotent per modal)
  if (modal.dataset.escBound !== '1') {
    modal.dataset.escBound = '1';
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (typeof onClose === 'function') {
        onClose(e, modal);
        return;
      }
      hideModal(modalId);
    }, { capture: true });
  }

  // Ensure the modal can receive key events once shown
  if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
}

function disableTapOutClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Red X only: swallow overlay taps and ESC for this modal.
  const onBackdropClickBlocked = (e) => {
    if (e.target === modal) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  modal.addEventListener('click', onBackdropClickBlocked, { capture: true });

  // ESC must not close these modals either.
  if (modal.dataset.escBlocked !== '1') {
    modal.dataset.escBlocked = '1';
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, { capture: true });
  }

  // Ensure the modal can still receive key events once shown.
  if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
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
    <h2 class="modal-title">${title}</h2>    
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
  const purchases = JSON.parse(localStorage.getItem('myPurchases') || '[]');
  const container = document.getElementById('purchase-history');
  if (!container) return;

  container.innerHTML = '';
  container.classList.add('modal-menu-list');

  if (purchases.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-state';
    emptyMsg.innerHTML = `
      <p>${t('purchaseHistory.emptyMessage')}</p>
      <p style="opacity: 0.75;">${t('purchaseHistory.empty.body')}</p>
    `;
    container.appendChild(emptyMsg);
    return;
  }

  purchases.forEach((purchase) => {
    const card = document.createElement('div');
    card.className = 'modal-menu-item modal-static-card';

    const icon = document.createElement('span');
    icon.className = 'icon-img';
    icon.textContent = purchase.icon || '💳';

    const label = document.createElement('span');
    label.className = 'label';

    // 📝 Use translated label if available, fallback to raw key
    const title = document.createElement('strong');
    title.textContent = t(purchase.label) || purchase.label;

    const timestamp = document.createElement('small');
    timestamp.textContent = `📅 ${new Date(purchase.timestamp).toLocaleString()}`;

    const subtext = document.createElement('small');

    // 🔁 Resolve translated subtext (fallback to raw key if not found)
    let rawSubtext = t(purchase.subtext) || purchase.subtext;

    // 💖 If it mentions "free", inject heart emoji for flair
    const cleaned = rawSubtext.replace('💖', '').trim();
    subtext.textContent = cleaned.includes('free')
      ? cleaned.replace(/free\b/i, 'free 💖')
      : cleaned;

    label.appendChild(title);
    label.appendChild(document.createElement('br'));
    label.appendChild(timestamp);
    label.appendChild(document.createElement('br'));
    label.appendChild(subtext);

    card.appendChild(icon);
    card.appendChild(label);
    container.appendChild(card);
  });
}

// Renders entries stored in localStorage.location-history (coords + timestamp)
export function renderLocationHistory() {
  const container = document.getElementById('location-history');
  if (!container) return;

  container.innerHTML = '';
  container.classList.add('modal-menu-list');

  const history = JSON.parse(localStorage.getItem('location-history') || '[]');

  if (history.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-state';
    emptyMsg.innerHTML = `
      <p>${t('locationHistory.emptyMessage')}</p>
      <p style="opacity: 0.75;">${t('locationHistory.empty.body')}</p>
    `;
    container.appendChild(emptyMsg);
    return;
  }

  history.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'modal-menu-item modal-static-card';

    const icon = document.createElement('span');
    icon.className = 'icon-img';
    icon.textContent = '📍';

    const label = document.createElement('span');
    label.className = 'label';
    label.innerHTML = `
      <strong>${entry.coords}</strong><br>
      <small>📅 ${new Date(entry.timestamp).toLocaleString()}</small><br>
      <small><a href="https://maps.google.com?q=${entry.coords}" target="_blank">${t('locationHistory.openInMaps')}</a></small>
    `;

    card.appendChild(icon);
    card.appendChild(label);
    container.appendChild(card);
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