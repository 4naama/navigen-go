// Minimal dashboard: fetches /api/stats* and renders daily / QR / campaign data.
// Unified i18n bootstrap: choose language by device locale → app’s recent setting → English,
// then load translations from the absolute script or fall back to the local copy.

// Single-source logo refresh (Dash): shared with App
import { wireLogoRefresh } from "/scripts/logo-refresh.js";

let t = (k) => k; // safe fallback so UI renders even if i18n.js isn’t served as JS
try {
  // helper: device language → app's recent setting → English
  const pickLang = async (mod) => {
    let lang = '';

    // 1) app's explicit language (user-chosen)
    try {
      const stored = (localStorage.getItem('lang') || '').trim();
      if (stored) lang = stored;
    } catch {}

    // 2) device/browser language (fallback only)
    if (!lang) {
      try {
        const navRaw =
          (Array.isArray(navigator.languages) && navigator.languages[0]) ||
          navigator.language ||
          '';
        const primary = (navRaw.split(/[-_]/)[0] || '').trim();
        if (primary) lang = primary;
      } catch {}
    }

    // 3) fallback: English
    if (!lang) lang = 'en';

    // Validate that the lang exists in the translated catalog
    if (mod && typeof mod.fetchTranslatedLangs === 'function') {
      try {
        const supported = await mod.fetchTranslatedLangs();
        if (Array.isArray(supported) && supported.length && !supported.includes(lang)) {
          lang = 'en';
        }
      } catch {}
    }

    return lang || 'en';
  };

  // try absolute prod path first; fall back to local root copy
  try {
    const __i18nA = await import('/scripts/i18n.js');
    ({ t } = __i18nA);
    const lang = await pickLang(__i18nA);
    if (typeof __i18nA.loadTranslations === 'function') {
      await __i18nA.loadTranslations(lang);
    }
  } catch (_e1) {
    const __i18nB = await import(new URL('./i18n.js', import.meta.url).href); // local minimal build
    ({ t } = __i18nB);
    const lang = await pickLang(__i18nB);
    if (typeof __i18nB.loadTranslations === 'function') {
      await __i18nB.loadTranslations(lang);
    }
  }

} catch (_e) {
  console.warn('i18n module failed to load (served as HTML?) — using key fallback');
}

const $ = (s) => document.querySelector(s);
const modeEl = $('#mode'), locEl = $('#locationID'), entEl = $('#entityID');
const periodEl = $('#period'); // single control drives the window
const hintEl = $('#hint'), metaEl = $('#meta'), tblWrap = $('#table-wrap');
const locWrap = $('#loc-wrap'), entWrap = $('#ent-wrap');

let currentView = 'click-info';   // active aspect: click-info | qr-info | campaigns
let lastStats = null;             // latest stats payload reused across views

// Canonicalize client URL: ?locationID=<id> → /dash/<id> (ULID or slug; server will 302 slug→ULID in prod)
(() => {
  const u = new URL(location.href);
  const raw = (u.searchParams.get('locationID') || '').trim();
  if (raw && (u.pathname === '/dash' || u.pathname === '/dash/')) {
    history.replaceState({}, document.title, `/dash/${encodeURIComponent(raw)}${location.hash || ''}`);
  }
})();

// First line is static in HTML now; no JS injection needed.
(() => {})();

const TODAY = new Date();
const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);

// Single-source logo refresh (Dash): nudge + SOFT refresh (refetch + rerender, no shell reload)
wireLogoRefresh({ onRefresh: () => loadAndRender() });

// Open Donation (👋) modal directly on dashboard; skip pin/install.
// Works if #donation-modal exists; otherwise no-ops silently.
const donateBtn = document.querySelector('.header-pin');
if (donateBtn) {
  const openDonation = (ev) => {
    const modal = document.getElementById('donation-modal');
    if (!modal) return;                           // nothing to open
    ev.preventDefault();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');   // accessibility hint
  };
  donateBtn.addEventListener('click', openDonation);
  donateBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openDonation(e);
  });
}

// Legacy subtitle wrapper no longer needed; hint now lives in #meta as .meta-hint (kept for compatibility, but no-op)
/* keeps comments concise; avoids touching DOM text nodes */
(() => { /* no-op */ })();

// normalize date input to YYYY-MM-DD; handles valueAsDate or localized text (1-2 lines of logic, keep simple)
function getISODate(input){
  const d = input.valueAsDate;
  if (d instanceof Date && !isNaN(d)) return iso(d);
  const v = (input.value||'').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  return m ? `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}` : v; // keep last resort
}

// load initial params from URL; tolerate missing controls
{
  const u     = new URL(location.href);
  const m     = u.searchParams.get('mode') || 'location';
  const lidQ  = u.searchParams.get('locationID') || '';               // legacy query (alias or ULID)
  const eid   = u.searchParams.get('entityID') || '';
  const segs  = location.pathname.split('/').filter(Boolean);
  const pathId= (segs[0] === 'dash' && segs[1]) ? segs[1] : '';       // /dash/<id>
  
  // Example badge rendering removed.
  // Dash shell is always reachable; access is enforced by /api/stats (401/403/200).

  const ULID  = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

  if (modeEl) modeEl.value = m;

  if (locEl) {
    // prefer a saved human slug for the path ULID; else use legacy query; else path id
    let human = '';
    try {
      if (ULID.test(pathId)) {
        human = localStorage.getItem(`navigen.slug:${pathId}`) || '';
        // optional: one-shot pending slug for popular→redirect case
        if (!human) {
          const raw = localStorage.getItem('navigen.pendingSlug') || '';
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj && obj.value && (Date.now() - Number(obj.ts || 0) < 60_000)) {
              human = String(obj.value);
              // bind it to the canonical ULID so future loads don’t need pending
              localStorage.setItem(`navigen.slug:${pathId}`, human);
            }
            // clear pending either way
            localStorage.removeItem('navigen.pendingSlug');
          }
        }
      }
    } catch { /* ignore storage/JSON errors */ }

    const chosen = human || lidQ || pathId;
    locEl.value = chosen;

    // stash canonical ULID when present so fetches use it
    if (ULID.test(pathId)) {
      locEl.dataset.canonicalId = pathId;
    }
  }

  // Localize H2 and set window title with human slug (if available)
  {
    const pageTitleEl = document.getElementById('page-title');
    const titleTxt = (typeof t === 'function' && t('dash.title')) || 'Dashboard';
    if (pageTitleEl) pageTitleEl.textContent = titleTxt;

    const human = String(document.getElementById('locationID')?.value || '').trim();
    const prefix = (typeof t === 'function' && t('dash.windowTitlePrefix')) || 'Dashboard —';
    if (human) {
      document.title = `${prefix} ${human}`;
    } else {
      document.title = titleTxt;
    }
  }

  // Localize meta-lead ("Total daily counts for") and Period label
  {
    const metaLead = document.getElementById('meta-lead');
    if (metaLead) {
      const textNode = metaLead.firstChild;
      const leadTxt =
        (typeof t === 'function' ? t('dash.meta.total-daily-counts-for') : '') ||
        'Total daily counts for';
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.textContent = leadTxt + '\u00A0\u00A0';
      }
    }

    // Localize mode options ...
    if (modeEl) {
      const locOpt = modeEl.querySelector('option[value="location"]');
      const entOpt = modeEl.querySelector('option[value="entity"]');
      if (locOpt) {
        locOpt.textContent =
          (typeof t === 'function' ? t('dash.mode.location') : '') ||
          'Location';
      }
      if (entOpt) {
        entOpt.textContent =
          (typeof t === 'function' ? t('dash.mode.entity') : '') ||
          'Entity (Sum)';
      }
    }

    // Localize Period label and values
    const labels = Array.from(document.querySelectorAll('#dash-header label'));
    const periodLabelNode = labels.find(l => l.querySelector('#period'));
    if (periodLabelNode) {
      const txtNode = periodLabelNode.firstChild;
      const periodTxt =
        (typeof t === 'function' ? t('dash.period') : '') ||
        'Period';
      if (txtNode && txtNode.nodeType === Node.TEXT_NODE) {
        txtNode.textContent = periodTxt + ' ';
      }
    }

    const periodEl = document.getElementById('period');
    if (periodEl) {
      const opt1  = periodEl.querySelector('option[value="1"]');
      const opt7  = periodEl.querySelector('option[value="7"]');
      const opt14 = periodEl.querySelector('option[value="14"]');
      const opt28 = periodEl.querySelector('option[value="28"]');
      const opt56= periodEl.querySelector('option[value="56"]');

      if (opt1) {
        opt1.textContent =
          (typeof t === 'function' ? t('dash.period.option.1') : '') ||
          '1 day (24h)';
      }
      if (opt7) {
        opt7.textContent =
          (typeof t === 'function' ? t('dash.period.option.7') : '') ||
          '1 week (7 days)';
      }
      if (opt14) {
        opt14.textContent =
          (typeof t === 'function' ? t('dash.period.option.14') : '') ||
          '2 weeks (14 days)';
      }
      if (opt28) {
        opt28.textContent =
          (typeof t === 'function' ? t('dash.period.option.28') : '') ||
          '4 weeks (28 days)';
      }
      if (opt56) {
        opt56.textContent =
          (typeof t === 'function' ? t('dash.period.option.56') : '') ||
          '8 weeks (56 days)';
      }
    }

    // Localize location / entity labels if desired
    if (locWrap) {
      const txtNode = locWrap.firstChild;
      if (txtNode && txtNode.nodeType === Node.TEXT_NODE) {
        const locTxt =
          (typeof t === 'function' ? t('dash.label.location') : '') ||
          'Location';
        txtNode.textContent = locTxt + ' ';
      }
    }
    if (entWrap) {
      const txtNode = entWrap.firstChild;
      if (txtNode && txtNode.nodeType === Node.TEXT_NODE) {
        const entTxt =
          (typeof t === 'function' ? t('dash.label.entity') : '') ||
          'entityID';
        txtNode.textContent = entTxt + ' ';
      }
    }
  }

  if (entEl) entEl.value = eid;

  if (modeEl && locWrap && entWrap) syncMode();
}

// build aspect selector tabs: Click Info / QR Info / Campaigns
(function initAspectTabs(){
  if (!locWrap || !locWrap.parentElement) return;

  let tabRow = document.getElementById('dash-aspect-tabs');
  if (tabRow) return; // already built

  tabRow = document.createElement('div');
  tabRow.id = 'dash-aspect-tabs';

  const views = [
    ['click-info', 'dash.tab.click-info', 'Click Info'],
    ['qr-info',    'dash.tab.qr-info',   'Promo QR'],
    ['campaigns',  'dash.tab.campaigns', 'Campaigns']
  ];

  const buttons = new Map();

  const updateActive = () => {
    buttons.forEach((btn, view) => {
      btn.classList.toggle('active', currentView === view);
    });
  };

  for (const [view, labelKey, fallback] of views) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dash-aspect-tab';
    const label = (typeof t === 'function' ? t(labelKey) : '') || fallback;
    btn.textContent = label;

    btn.addEventListener('click', () => {
      if (currentView === view) return;
      currentView = view;
      updateActive();
      renderCurrentView(); // swap visible table based on chosen aspect
    });

    if (currentView === view) btn.classList.add('active');
    buttons.set(view, btn);
    tabRow.appendChild(btn);
  }

  // insert new row between Location row and Period row
  locWrap.parentElement.insertBefore(tabRow, locWrap.nextSibling);

  updateActive();
})();

// only wire mode listener if the control exists
if (modeEl) modeEl.addEventListener('change', syncMode);

function syncMode() {
  if (!modeEl || !entWrap || !locWrap) return; // no-op without controls
  const isEntity = modeEl.value === 'entity';
  entWrap.style.display = isEntity ? '' : 'none';
  locWrap.style.display = isEntity ? 'none' : '';
  if (hintEl) hintEl.textContent = ''; // legacy hint suppressed
}

// fixed order as served by the Worker
const ORDER = [
  'lpm-open','save','unsave',  
  'booking','newsletter',
  'share','map','qr-view','qr-scan','qr-print',  
  'official','facebook','instagram','pinterest','spotify','tiktok','youtube',
  'call','email','whatsapp','telegram','messenger', 'rating'
]; // show scans, views, prints, and rating sum; average is shown in meta

// display labels for metrics (ids must match ORDER exactly)
// keep: explicit i18n labels; others fall back to HUMANIZE()
const METRIC_LABEL = Object.freeze({
  'lpm-open':     t('metric.lpm-open'),
  'call':         t('metric.call'),
  'email':        t('metric.email'),
  'whatsapp':     t('metric.whatsapp'),
  'telegram':     t('metric.telegram'),
  'messenger':    t('metric.messenger'),
  'official':     t('metric.official'),
  'booking':      t('metric.booking'),
  'newsletter':   t('metric.newsletter'),
  'facebook':     t('metric.facebook'),
  'instagram':    t('metric.instagram'),
  'pinterest':    t('metric.pinterest'),
  'spotify':      t('metric.spotify'),
  'tiktok':       t('metric.tiktok'),
  'youtube':      t('metric.youtube'),
  'share':        t('metric.share'),
  'save':         t('metric.save'),
  'unsave':       t('metric.unsave'),
  'map':          t('metric.map'),
  'qr-scan':      t('metric.qr-scan'),
  'qr-view':      t('metric.qr-view'),
  'qr-print':     t('metric.qr-print'),
  'rating':       t('metric.rating-sum'),
  'rating-avg':   t('metric.rating-avg'), // used by meta summary line only

  // NEW: QA-related confirmation metrics
  'redeem-confirmation-cashier':   t('metric.redeem-confirmation-cashier'),
  'redeem-confirmation-customer':  t('metric.redeem-confirmation-customer')
});

const HUMANIZE = (k) => {
  const ACR = { qr:'QR', id:'ID', url:'URL', sms:'SMS' };
  const BRANDS = {
    facebook:'Facebook', instagram:'Instagram', pinterest:'Pinterest',
    spotify:'Spotify', tiktok:'TikTok', youtube:'YouTube',
    whatsapp:'WhatsApp', telegram:'Telegram', messenger:'Messenger'
  };
  return k.split('_').map(w => ACR[w] || BRANDS[w] || (w[0]?.toUpperCase() + w.slice(1))).join(' ');
};
const labelFor = (k) => METRIC_LABEL[k] || HUMANIZE(k);

function hashVisitorId(s) {
  if (!s) return '';
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0; // keep 32-bit
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0');
  return 'v-' + hex;
}

async function getSessionBoundLocationHint() {
  try {
    // 1) Ask server which ULID this op_sess is bound to (cookie-authenticated)
    const diag = await fetch('/api/_diag/opsess', { cache: 'no-store', credentials: 'include' });
    if (!diag.ok) return null;
    const dj = await diag.json().catch(() => null);
    const ulid = String(dj?.ulid || '').trim();
    if (!/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(ulid)) return null;

    // 2) Resolve ULID -> slug/name via the authoritative Worker origin (route stability)
    const item = await fetch(`https://navigen-api.4naama.workers.dev/api/data/item?id=${encodeURIComponent(ulid)}`, { cache: 'no-store' });
    if (!item.ok) return { ulid, slug: '', name: '' };

    const ij = await item.json().catch(() => null);
    const slug = String(ij?.locationID || '').trim();
    const ln = ij?.locationName;
    const name =
      (ln && typeof ln === 'object' && (ln.en || ln.default)) ? String(ln.en || ln.default).trim()
      : (typeof ln === 'string') ? ln.trim()
      : '';

    // Also check whether this signed-in location is actually eligible for Dash (campaignEntitled).
    // Reason: avoid offering "Open my signed-in location" when it would just loop back to "Campaign required".
    let campaignEntitled = false;
    try {
      const st = await fetch(`/api/status?locationID=${encodeURIComponent(ulid)}`, { cache: 'no-store', credentials: 'omit' });
      if (st.ok) {
        const sj = await st.json().catch(() => null);
        campaignEntitled = sj?.campaignEntitled === true;
      }
    } catch {}

    return { ulid, slug, name, campaignEntitled };
  } catch {
    return null;
  }
}

async function renderAccessBlocked({ status, detail }) {
  const title =
    (typeof t === 'function' && t('owner.settings.title')) ||
    'Owner settings';

  // Keep messaging aligned with the i18n keys you already have in en.json.
  const msg401 =
    (typeof t === 'function' && t('owner.restore.body')) ||
    'To open the Owner Dash, use your most recent Owner access email or Stripe receipt. The Owner Dash link is included in that message.';

  const hint401 =
    (typeof t === 'function' && t('owner.restore.hint')) ||
    'Tip: search your inbox for “Stripe” or “NaviGen”.';

  const msg403Default =
    (typeof t === 'function' && t('owner.settings.claim.runCampaign.desc')) ||
    'Activate analytics by running a campaign for this location.';

  const examplesTitle =
    (typeof t === 'function' && t('owner.settings.examples.action.title')) ||
    'See example dashboards';

  const examplesDesc =
    (typeof t === 'function' && t('owner.settings.examples.action.desc')) ||
    'View analytics for designated example locations.';

  const restoreTitle =
    (typeof t === 'function' && t('owner.settings.restore.action.title')) ||
    'Restore access';

  const restoreDesc =
    (typeof t === 'function' && t('owner.settings.restore.action.desc')) ||
    'Use your most recent Owner access email or Stripe receipt.';

  // 403 can be either:
  // A) campaign required (entitlement inactive), or
  // B) session is valid but for a different location (ULID mismatch).
  // Detect B and show an explicit hint to reduce operator confusion.
  let mismatchHint = null;
  if (status === 403) {
    mismatchHint = await getSessionBoundLocationHint();
  }

  const msg403 = mismatchHint
    ? `You are signed in for a different location: ${mismatchHint.name || mismatchHint.slug || mismatchHint.ulid}`
    : msg403Default;

  // Clear existing table area and render an interstitial card.
  tblWrap.innerHTML = `
    <div id="dash-table-scroller">
      <div class="analytics-report" style="max-width:720px;margin:0 auto;">
        <section class="analytics-section">
          <h3 style="display:flex;align-items:center;gap:.4rem;">
            <span>${title}</span>
            <button
              type="button"
              id="dash-device-access-info"
              aria-label="About device-based access"
              style="background:none;border:none;padding:0;cursor:pointer;font-size:.9em;"
            >ℹ️</button>
          </h3>
          <p id="dash-device-access-info-body" style="display:none;opacity:.85;font-size:.9em;margin:.25rem 0 0;">
            ${
              (typeof t === 'function' && t('dash.blocked.deviceAccessInfo')) ||
              'Owner access is stored on this device for security.\nTo open a different business, switch in Owner Center or sign out on this device.'
            }
          </p>
          <p>${status === 401 ? msg401 : msg403}</p>
          ${status === 401 ? `<p style="opacity:.8;font-size:.9em;">${hint401}</p>` : ``}

          <div class="modal-menu-list" style="margin-top:1rem;">
            ${
              status === 401
                ? `
                  <button type="button" class="modal-menu-item" id="dash-restore-access">
                    <span class="icon-img">🔑</span>
                    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
                      <strong>${restoreTitle}</strong><br><small>${restoreDesc}</small>
                    </span>
                  </button>
                `
                : `
                  ${
                    (mismatchHint && mismatchHint.ulid && mismatchHint.campaignEntitled === true)
                      ? `
                        <button type="button" class="modal-menu-item" id="dash-open-bound-location">
                          <span class="icon-img">📍</span>
                          <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
                            <strong>Open my signed-in location</strong><br>
                            <small>${mismatchHint.name || mismatchHint.slug || mismatchHint.ulid}</small>
                          </span>
                        </button>
                      `
                      : ``
                  }

                  <button type="button" class="modal-menu-item" id="dash-run-campaign">
                    <span class="icon-img">🎯</span>
                    <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
                      <strong>${
                        (typeof t === 'function' && t('owner.settings.claim.runCampaign.title')) || 'Run campaign'
                      }</strong><br><small>${msg403}</small>
                    </span>
                  </button>
                `
            }

            <button type="button" class="modal-menu-item" id="dash-example-dashboards">
              <span class="icon-img">📈</span>
              <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
                <strong>${examplesTitle}</strong><br><small>${examplesDesc}</small>
              </span>
            </button>
            
            <button type="button" class="modal-menu-item" id="dash-clear-session">
              <span class="icon-img">🧹</span>
              <span class="label" style="flex:1 1 auto; min-width:0; text-align:left;">
                <strong>${(typeof t === 'function' && t('dash.blocked.clearSession.title')) || 'Sign out on this device'}</strong><br>
                <small>${(typeof t === 'function' && t('dash.blocked.clearSession.desc')) || 'Use this if this device is signed in for the wrong business.'}</small>
              </span>
            </button>            
          </div>

          ${
            detail
              ? `<p style="margin-top:1rem;opacity:.6;font-size:.85em;">${String(detail).slice(0,160)}</p>`
              : ``
          }
        </section>
      </div>
    </div>
  `;

  const infoBtn = document.getElementById('dash-device-access-info');
  const infoBody = document.getElementById('dash-device-access-info-body');

  infoBtn?.addEventListener('click', () => {
    if (!infoBody) return;
    const shown = infoBody.style.display !== 'none';
    infoBody.style.display = shown ? 'none' : 'block';
  });

  // Wire actions using existing modal-injector exports if available globally.
  const exBtn = document.getElementById('dash-example-dashboards');
  exBtn?.addEventListener('click', () => {
    try {
      // Open Example Dashboards directly from Dash context (no shell redirect).
      if (typeof showExampleDashboardsModal === 'function') {
        showExampleDashboardsModal();
      }
    } catch {}
  });

  const restoreBtn = document.getElementById('dash-restore-access');
  restoreBtn?.addEventListener('click', () => {
    try {
      // Main shell owns Restore Access modal; pass an explicit intent.
      window.location.href = 'https://navigen.io/?bo=1&open=restore';
    } catch {}
  });

  const runBtn = document.getElementById('dash-run-campaign');
  runBtn?.addEventListener('click', () => {
    try {
      // Main shell owns campaign purchase flow; pass an explicit intent.
      window.location.href = 'https://navigen.io/?bo=1&open=campaign';
    } catch {}
  });

  const boundBtn = document.getElementById('dash-open-bound-location');
  boundBtn?.addEventListener('click', () => {
    try {
      // Prefer the already computed mismatchHint to avoid extra network calls.
      const ulid = (mismatchHint && mismatchHint.ulid) ? String(mismatchHint.ulid).trim() : '';
      if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(ulid)) {
        // Same-tab navigation keeps context and avoids pop-up blockers.
        window.location.href = `https://navigen.io/dash/${encodeURIComponent(ulid)}`;
        return;
      }

      // Fallback: resolve again if mismatchHint wasn't available for some reason.
      getSessionBoundLocationHint().then((h) => {
        const u = h && h.ulid ? String(h.ulid).trim() : '';
        if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(u)) {
          window.location.href = `https://navigen.io/dash/${encodeURIComponent(u)}`;
        }
      }).catch(() => {});
    } catch {}
  });
  
  const clearBtn = document.getElementById('dash-clear-session');
  clearBtn?.addEventListener('click', () => {
    try {
      // Clear op_sess server-side (HttpOnly) and return to the app shell.
      window.location.href = `/owner/clear-session?next=${encodeURIComponent('/')}`;
    } catch {}
  });  
}

async function fetchStats() {
  // single source for all stats calls
  const base = location.origin;
  const periodDays = Number(periodEl?.value) || 14;
  const end = day(TODAY);                               // today (local)
  const start = new Date(end.getTime() - (periodDays - 1) * 86400e3);
  const from = iso(start), to = iso(end);               // API window

  const isEntity = (modeEl?.value || 'location') === 'entity';
  const locId = String((locEl?.value || locEl?.dataset?.canonicalId || '')).trim();

  const q = isEntity
    ? new URL(`/api/stats/entity?entityID=${encodeURIComponent(entEl.value)}&from=${from}&to=${to}`, base)
    : new URL(`/api/stats?locationID=${encodeURIComponent(locId)}&from=${from}&to=${to}`, base);

  const res = await fetch(q, { cache: 'no-store', credentials: 'include' });

  if (res.ok) {
    return { ok: true, status: 200, json: await res.json() };
  }

  // Read small detail (never dump large HTML/text).
  const detail = await res.text().catch(() => '');
  return { ok: false, status: res.status || 0, detail: String(detail || '').trim() };
}

function renderTable(json) {
  const days = json.days || {};
  const dates = Object.keys(days).sort(); // ascending

  // header: metrics as first col, dates across
  const cols = [t('dash.col.metric'), ...dates, t('dash.col.sum')]; // metrics ↓ × dates →
  const thead = `<thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>`;

  // rows: one row per metric, values across dates
  const rowsHtml = ORDER.map(metric => {
    // STRICT counting: choose the exact API key for this metric
    const API_KEYS = { save: 'save', unsave: 'unsave' };

    const vals = dates.map(d => {
      const bucket = days[d] || {};
      const key = API_KEYS[metric] || metric; // fallback for non-save/unsave metrics
      const alt = key.replaceAll('-', '_');
      return Number(bucket[key] ?? bucket[alt] ?? 0);
    });

    const sum = vals.reduce((a,b)=>a+b, 0);
    return `<tr><th scope="row">${labelFor(metric)}</th>${vals.map(n=>`<td>${n}</td>`).join('')}<td>${sum}</td></tr>`;
  }).join('');

  // footer: per-date sums (sum across all metrics for each date)
  const perDateSums = dates.map(d => {
    const bucket = days[d] || {};
    return ORDER.reduce((acc, k) => {
      const alt = k.replaceAll('-', '_');
      return acc + Number(bucket[k] ?? bucket[alt] ?? 0);
    }, 0);
  });

  const total = perDateSums.reduce((a,b)=>a+b, 0);
  const tfoot = `<tfoot><tr><th scope="row">${t('dash.col.sum')}</th>${perDateSums.map(n=>`<td>${n}</td>`).join('')}<td>${total}</td></tr></tfoot>`;

  // inject scoped styles once (sticky header + left col)
  // styles moved to navi-style.css for maintainability (no CSS-in-JS

  // only the table area scrolls; styles live in CSS
  tblWrap.innerHTML = `
    <div id="dash-table-scroller"> <!-- horizontal scroller only -->
      <table class="stats-table">
        ${thead}
        <tbody>${rowsHtml || ''}</tbody>
        ${tfoot}
      </table>
    </div>
  `;

  // meta
  const label = json.locationID ? `locationID=${json.locationID}` :
               json.entityID   ? `entityID=${json.entityID}` : '';
               
  /* update period subtitle under the title — do NOT wipe #meta */
  {
    const days = Number(periodEl?.value) || 14;
    const end = day(TODAY);
    const start = new Date(end.getTime() - (days - 1) * 86400e3);
    const startISO = iso(start), endISO = iso(end);

    // remove meta-hint line entirely; keep only the date range
    const oldHint = metaEl.querySelector('.meta-hint'); if (oldHint) oldHint.remove();
    const oldBrk  = metaEl.querySelector('.meta-linebreak'); if (oldBrk) oldBrk.remove();

    let range = metaEl.querySelector('.meta-range');
    if (!range) {
      range = document.createElement('span');
      range.className = 'meta-range';
      metaEl.prepend(range); // range becomes the first/only meta line
    }
    range.textContent = `${startISO} → ${endISO}`;

    // 2) ensure Copy button exists (id is stable)
    let copyBtn = document.getElementById('copy-tsv');
    if (!copyBtn) {
      copyBtn = document.createElement('button');
      copyBtn.id = 'copy-tsv';
      copyBtn.type = 'button';
      copyBtn.title = t('dash.copy.tsv');
      copyBtn.ariaLabel = t('dash.copy.tsv');
      copyBtn.textContent = '⧉';
      copyBtn.addEventListener('click', async () => {
        let payload = '';

        // 1) Click Info / QR Info / Campaigns: TSV from stats table (existing behavior)
        const table = tblWrap.querySelector('table.stats-table');
        if (table) {
          payload = toTSV(table);
        } else if (typeof currentView === 'string' && currentView === 'analytics') {
          // 2) Analytics view: copy full written report as plain text
          const report = tblWrap.querySelector('.analytics-report') || tblWrap;
          payload = report.innerText.trim();
        } else {
          return; // no suitable source to copy
        }

        if (!payload) return;

        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(payload);
          } else if (document.execCommand) {
            // legacy path: copy by injecting a hidden textarea
            const textarea = document.createElement('textarea');
            textarea.value = payload;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          }
          copyBtn.classList.add('copied');
          const oldTitle = copyBtn.title;
          copyBtn.title = t('dash.copy.copied');
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.title = oldTitle;
          }, 2500);
        } catch (_e) {
          // ignore copy failures
        }
      });
      metaEl.appendChild(copyBtn);
    }

    // 3) ensure Analytics (📊) button and group both buttons on the right
    // create a shared actions wrapper once: [date range] ... [📊 ⧉]
    let actionsWrap = metaEl.querySelector('.meta-actions');
    if (!actionsWrap) {
      actionsWrap = document.createElement('span');
      actionsWrap.className = 'meta-actions';
      actionsWrap.style.display = 'flex';
      actionsWrap.style.alignItems = 'center';
      actionsWrap.style.gap = '4px';
      actionsWrap.style.marginLeft = 'auto'; // pushes both buttons to the far right
      metaEl.appendChild(actionsWrap);
    }

    let infoBtn = document.getElementById('dash-info');
    if (!infoBtn) {
      infoBtn = document.createElement('button');
      infoBtn.id = 'dash-info';
      infoBtn.type = 'button';
      // tooltip / screen-reader label for the Analytics view button
      const infoTitle = (typeof t === 'function' ? t('dash.analytics') : 'Analytics');
      infoBtn.title = infoTitle;
      infoBtn.ariaLabel = infoTitle;
      infoBtn.textContent = '📊';
      infoBtn.addEventListener('click', () => {
        // switch to Analytics view (4th tab-equivalent) and render a textual+chart report
        currentView = 'analytics';
        renderCurrentView();
      });

    }

    // move both buttons into the right-aligned actions wrapper
    if (actionsWrap && infoBtn.parentElement !== actionsWrap) {
      actionsWrap.appendChild(infoBtn);
    }
    if (actionsWrap && copyBtn.parentElement !== actionsWrap) {
      actionsWrap.appendChild(copyBtn);
    }

    // Refresh removed; Copy button remains.

    // inline layout (once)
    metaEl.style.display = 'flex';
    metaEl.style.alignItems = 'center';
    metaEl.style.gap = '8px';
    copyBtn.style.marginLeft = 'auto';

    // latest column delta color (text only) vs previous date; runs on each render
    {
      const table = tblWrap.querySelector('table.stats-table'); // table just rendered
      if (table && table.tHead && table.tBodies[0]) {
        const ths = Array.from(table.tHead.rows[0].cells);
        let sumIdx = ths.findIndex(th => th.textContent.trim().toLowerCase() === 'sum');
        if (sumIdx < 0) sumIdx = ths.length;             // if no “Sum”, use last col
        const lastIdx = Math.max(1, sumIdx - 1);         // last DATE column
        const prevIdx = Math.max(1, lastIdx - 1);        // previous DATE column

        const toNum = (t) => {
          const m = String(t||'').replace(/\u00A0/g,' ').replace(/\s+/g,'').replace(/,/g,'')
                                 .match(/-?\d+(?:\.\d+)?/);
          return m ? Number(m[0]) : NaN;
        };

        for (const tr of table.tBodies[0].rows) {
          const cells = tr.cells;
          if (cells.length <= lastIdx) continue;

          // reset any previous delta classes on data cells
          for (let i = 1; i < cells.length; i++){
            cells[i].classList.remove('delta-up','delta-down');
          }

          const a = toNum(cells[prevIdx]?.textContent);
          const b = toNum(cells[lastIdx]?.textContent);

          if (Number.isFinite(a) && Number.isFinite(b)) {
            if (b > a)      cells[lastIdx].classList.add('delta-up');   // green background
            else if (b < a) cells[lastIdx].classList.add('delta-down'); // red background
            // equal → no class, default look
          }
        }
      }
    }
    // rating summary shown inline on the Period row (after the dropdown)
    {
      const ratedTotal = Number(json.rated_sum ?? 0);
      const ratingAvg  = Number(json.rating_avg ?? 0);

      const hasRating =
        Number.isFinite(ratedTotal) && ratedTotal > 0 &&
        Number.isFinite(ratingAvg)  && ratingAvg  > 0;

      // remove any previous inline rating badge (wherever it was)
      const oldRating = document.querySelector('.meta-rating');
      if (oldRating && oldRating.parentElement) {
        oldRating.parentElement.removeChild(oldRating);
      }

      if (hasRating && periodEl) {
        const avgText = ratingAvg.toFixed(1);

        const span = document.createElement('span');
        span.className = 'meta-rating';
        // two spaces before star: "Period 2 weeks (14 days)␣␣⭐ 3.0 (1)"
        span.textContent = `   ⭐  ${avgText}  (${ratedTotal})`;

        const parent = periodEl.parentElement;
        if (parent) parent.appendChild(span); // attach right after the Period select
      }
    }   
  }

  // update hint to include selected name when available (keeps "Single location daily counts" otherwise)
  const dispName = (json.locationName || json.entityName || '').trim();
  // Line 1: "Total daily counts for" + inline selector; clear legacy #hint
  // no hint line anymore — remove any leftovers and clear legacy #hint
  const metaHintEl = metaEl.querySelector('.meta-hint');
  if (metaHintEl) metaHintEl.remove();
  const metaBrkEl = metaEl.querySelector('.meta-linebreak');
  if (metaBrkEl) metaBrkEl.remove();
  if (hintEl) hintEl.textContent = '';
}

function renderCurrentView(){
  // when stats are not yet loaded, only Click Info has something meaningful to show
  if (!lastStats) {
    if (currentView === 'click-info') {
      tblWrap.textContent = t('dash.state.loading');
    } else {
      tblWrap.textContent = '…'; // keep non-click views empty until data arrives
    }
    return;
  }

  if (currentView === 'click-info') {
    // existing CTA table view (A)
    renderTable(lastStats);
    return;
  }

  // shared helper: builds a stats-style table header
  const buildHeader = (cols) => {
    const labels = cols.map(([key, fallback]) => {
      const txt = (typeof t === 'function' ? t(key) : '') || fallback;
      return txt;
    });
    const thead = `<thead><tr>${labels.map(txt => `<th>${txt}</th>`).join('')}</tr></thead>`;
    return { labels, thead };
  };

  if (currentView === 'qr-info') {
    // B) QR Info table (per-scan meta)
    const cols = [
      ['dash.qrinfo.col.time',     'Time'],
      ['dash.qrinfo.col.source',   'Source'],
      ['dash.qrinfo.col.location', 'Location'],
      ['dash.qrinfo.col.device',   'Device'],
      ['dash.qrinfo.col.browser',  'Browser'],
      ['dash.qrinfo.col.lang',     'Lang'],
      ['dash.qrinfo.col.scan-id',  'Scan ID'],
      ['dash.qrinfo.col.visitor',  'Visitor'],
      ['dash.qrinfo.col.campaign', 'Campaign'],
      ['dash.qrinfo.col.signal',   'Signal']
    ];

    // FILTER: keep only rows with full, meaningful client info:
    // - UA or Lang present
    // - Visitor present (so we can show a hashed ID)
    // - Campaign present (campaignKey set)
    // - Location includes a city (contains ",")
    const rawData = Array.isArray(lastStats.qrInfo) ? lastStats.qrInfo : [];
    const data = rawData.filter(row => {
      const hasUA = typeof row.device === 'string' && row.device.trim().length > 0;
      const hasLang = typeof row.lang === 'string' && row.lang.trim().length > 0;
      const hasVisitor = typeof row.visitor === 'string' && row.visitor.trim().length > 0;
      const hasCampaign = typeof row.campaign === 'string' && row.campaign.trim().length > 0;
      const hasCity = typeof row.location === 'string' && row.location.includes(',');
      return (hasUA || hasLang) && hasVisitor && hasCampaign && hasCity;
    });

    const { labels, thead } = buildHeader(cols);

    let tbody = '';
    if (!data.length) {
      const emptyMsg = (typeof t === 'function' ? t('dash.state.qr-info-empty') : '') ||
        'QR Info view will appear here for the selected period.';
      tbody = `<tbody><tr><td colspan="${labels.length}" style="text-align:center;">${emptyMsg}</td></tr></tbody>`;
    } else {
      const rowsHtml = data.map(row => {
        // 1) Time: format ISO → "MM-DD · HH:MM" for compact mobile display
        let prettyTime = row.time || '';
        try {
          const d = new Date(row.time);
          if (!isNaN(d.getTime())) {
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            prettyTime = `${mm}-${dd} · ${hh}:${min}`;
          }
        } catch {}

        // 2) Device/Browser: derive simple buckets from UA (row.device holds UA)
        const ua = String(row.device || row.browser || '').toLowerCase();
        let deviceLabel = '';
        if (ua.includes('android')) deviceLabel = 'Android';
        else if (ua.includes('iphone') || ua.includes('ios')) deviceLabel = 'iOS';
        else if (ua.includes('ipad')) deviceLabel = 'iPad';
        else if (ua.includes('windows')) deviceLabel = 'Windows';
        else if (ua.includes('macintosh') || ua.includes('mac os')) deviceLabel = 'macOS';
        else if (ua.includes('linux')) deviceLabel = 'Linux';

        let browserLabel = '';
        if (ua.includes('chrome')) browserLabel = 'Chrome';
        else if (ua.includes('safari') && !ua.includes('chrome')) browserLabel = 'Safari';
        else if (ua.includes('firefox')) browserLabel = 'Firefox';
        else if (ua.includes('edge')) browserLabel = 'Edge';
        else if (ua.includes('opera') || ua.includes('opr/')) browserLabel = 'Opera';

        // 3) Lang: keep only primary language
        let lang = row.lang || '';
        if (lang && typeof lang === 'string' && lang.includes(',')) {
          lang = lang.split(',')[0];
        }

        // 4) Visitor: show short hashed visitor ID
        const visitorId = row.visitor ? hashVisitorId(String(row.visitor)) : '';

        const cells = [
          prettyTime,
          row.source || '',
          row.location || '',
          deviceLabel || '',
          browserLabel || '',
          lang,
          row.scanId || '',
          visitorId,
          row.campaign || '',
          row.signal || ''
        ];
        return `<tr>${cells.map(v => `<td>${String(v)}</td>`).join('')}</tr>`;
      }).join('');

      tbody = `<tbody>${rowsHtml}</tbody>`;
    }

    tblWrap.innerHTML = `
      <div id="dash-table-scroller">
        <table class="stats-table">
          ${thead}
          ${tbody}
        </table>
      </div>
    `;
    return;
  }
  
  if (currentView === 'campaigns') {
    // C) QR Campaign table (per-campaign rollup)
    const cols = [
      ['dash.qrcamp.col.campaign-id',       'Campaign ID'],
      ['dash.qrcamp.col.campaign-name',     'Campaign Name'],
      ['dash.qrcamp.col.target',            'Target'],
      ['dash.qrcamp.col.brand',             'Brand'],
      ['dash.qrcamp.col.campaign-period',   'Campaign period'],
      ['dash.qrcamp.col.armed',             'Promo QR shown'],           // ARMED: times promo QR was displayed
      // ['dash.qrcamp.col.scans',          'Scans'], // deprecated: static scans must not appear in campaign view
      ['dash.qrcamp.col.redemptions',       'Redemptions'],
      // ['dash.qrcamp.col.efficiency',     'Efficiency %'], // keep ratios out of Campaigns table; QA handles compliance
      ['dash.qrcamp.col.invalids',          'Invalid attempts'],
      ['dash.qrcamp.col.unique',            'Unique visitors'],
      ['dash.qrcamp.col.repeat',            'Repeat %'],
      ['dash.qrcamp.col.new-redeemers',     'New redeemers'],
      ['dash.qrcamp.col.repeat-redeemers',  'Repeat redeemers'],
      ['dash.qrcamp.col.locations',         'Locations']
    ];

    const data = Array.isArray(lastStats.campaigns) ? lastStats.campaigns : [];
    const { labels, thead } = buildHeader(cols);

    let tbody = '';
    if (!data.length) {
      const emptyMsg = (typeof t === 'function' ? t('dash.state.campaigns-empty') : '') ||
        'QR Campaigns view will appear here for the selected period.';
      tbody = `<tbody><tr><td colspan="${labels.length}" style="text-align:center;">${emptyMsg}</td></tr></tbody>`;
    } else {
      const rowsHtml = data.map(row => {
        const armed = Number(row.armed ?? 0);
        // const scans = Number(row.scans ?? 0); // deprecated: do not render campaign "scans"
        const redemptions = Number(row.redemptions ?? 0);
        const invalids = Number(row.invalids ?? 0);

        const uniq = Number(row.uniqueVisitors ?? 0);
        const repeat = Number(row.repeatVisitors ?? 0);
        const repeatPct = uniq > 0 ? ((repeat / uniq) * 100).toFixed(1) + '%' : '';

        const uniqueRedeemers = Number(row.uniqueRedeemers ?? 0);
        const repeatRedeemers = Number(row.repeatRedeemers ?? 0);
        const newRedeemers = Math.max(uniqueRedeemers - repeatRedeemers, 0);

        // Efficiency % intentionally not rendered here (ratios belong to QA/monitoring tools)

        const cells = [
          row.campaign || '',          // Campaign ID
          row.campaignName ? `"${row.campaignName}"` : '',
          row.target || '',            // Target
          row.brand || '',             // Brand
          row.period || '',
          armed,
          // (no campaign scans cell)
          redemptions,
          // (no Efficiency % cell)
          invalids,
          uniq,
          repeatPct,
          newRedeemers,
          repeatRedeemers,
          row.locations ?? ''
        ];

        return `<tr>${cells.map(v => `<td>${String(v)}</td>`).join('')}</tr>`;
      }).join('');
      tbody = `<tbody>${rowsHtml}</tbody>`;
    }

    tblWrap.innerHTML = `
      <div id="dash-table-scroller">
        <table class="stats-table campaigns-table">
          ${thead}
          ${tbody}
        </table>
      </div>
    `;
    return;
  }

  if (currentView === 'analytics') {
    // D) Analytics report (non-table view)
    const stats = lastStats || {};
    const days = stats.days || {};
    const dateKeys = Object.keys(days).sort();
    const hasData = dateKeys.length > 0;

    // Aggregate confirmation metrics once for this period; reused by Campaigns + QA.
    let cashierConfs = 0;
    let customerConfs = 0;
    for (const dayKey of dateKeys) {
      const bucket = days[dayKey] || {};
      const cashierVal = Number(bucket['redeem-confirmation-cashier'] ?? bucket['redeem_confirmation_cashier'] ?? 0);
      const customerVal = Number(bucket['redeem-confirmation-customer'] ?? bucket['redeem_confirmation_customer'] ?? 0);
      if (cashierVal) cashierConfs += cashierVal;
      if (customerVal) customerConfs += customerVal;
    }

    // Header: location/entity + period + rating summary
    const name = (stats.locationName || stats.entityName || '').trim();
    const from = (stats.from || '').trim();
    const to = (stats.to || '').trim();

    const ratedTotal = Number(stats.rated_sum ?? 0);
    const ratingAvg  = Number(stats.rating_avg ?? 0);
    let ratingSentence = '';
    if (ratedTotal > 0 && ratingAvg > 0) {
      const avgText = ratingAvg.toFixed(1);
      const isSingular = ratedTotal === 1;

      const tplSing =
        (typeof t === 'function' ? t('dash.analytics.rating.summary.singular') : '') ||
        '⭐ {avg} (1) — Average rating {avg} from 1 review in this period.';
      const tplPlural =
        (typeof t === 'function' ? t('dash.analytics.rating.summary.plural') : '') ||
        '⭐ {avg} ({count}) — Average rating {avg} from {count} reviews in this period.';

      const tpl = isSingular ? tplSing : tplPlural;

      ratingSentence = tpl
        .replace(/{avg}/g, avgText)
        .replace(/{count}/g, String(ratedTotal));
    } else {
      const noneTpl =
        (typeof t === 'function' ? t('dash.analytics.rating.none') : '') ||
        'No customer ratings were recorded in this period.';
      ratingSentence = noneTpl;
    }

    const locLabel =
      (typeof t === 'function' ? t('dash.label.location') : '') || 'Location';
    const periodLabel =
      (typeof t === 'function' ? t('dash.period') : '') || 'Period';

    const headerHtml = `
      <section class="analytics-header">
        <h2>${(typeof t === 'function' ? t('dash.analytics') : 'Analytics')}</h2>
        <p>${name ? `${locLabel}: ${name}` : ''}</p>
        <p>${from && to ? `${periodLabel}: ${from} → ${to}` : ''}</p>
        <p>${ratingSentence}</p>
      </section>
    `;

    // Helper: build simple horizontal bar chart rows using divs
    // Helper: build small 2-column summary table (label + value)
    const buildMiniTable = (items) => {
      if (!items.length) return '<p>No data available for this period.</p>';

      const rows = items.map(({ label, value }) => `
        <tr>
          <th scope="row">${label}</th>
          <td>${value}</td>
        </tr>
      `).join('');

      return `
        <table class="analytics-mini-table">
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    };

    // Helper: build simple horizontal bar chart rows using divs
    const buildBarRows = (items) => {
      if (!items.length) return '<p>No data available for this period.</p>';
      const maxVal = Math.max(...items.map(i => i.value));
      if (maxVal <= 0) return '<p>No data available for this period.</p>';

      const rows = items.map(({ label, value }) => {
        const width = Math.max(4, (value / maxVal) * 100); // keep a visible minimum
        return `
          <div class="analytics-bar-row">
            <span class="analytics-bar-label">${label}</span>
            <div class="analytics-bar-track">
              <div class="analytics-bar-fill" style="width:${width}%;"></div>
            </div>
            <span class="analytics-bar-value">${value}</span>
          </div>
        `;
      }).join('');
      return `<div class="analytics-bars">${rows}</div>`;
    };

    // B) Click Info section (totals per metric, top 5 with data)
    let clickSummary = '';
    let clickBarsHtml = '';

    const clickEmptyText =
      (typeof t === 'function' ? t('dash.analytics.click.empty') : '') ||
      'No click events recorded for this period.';
    const clickEmptyTable =
      (typeof t === 'function' ? t('dash.analytics.click.empty-table') : '') ||
      'No click data to display.';

    if (!hasData) {
      clickSummary = clickEmptyText;
      clickBarsHtml = `<p>${clickEmptyTable}</p>`;
    } else {
      const totals = new Map();
      for (const d of dateKeys) {
        const row = days[d] || {};
        for (const metric of ORDER) {
          const alt = metric.replaceAll('-', '_');
          const v = Number(row[metric] ?? row[alt] ?? 0);
          if (!v) continue;
          totals.set(metric, (totals.get(metric) || 0) + v);
        }
      }
      const items = Array.from(totals.entries())
        .filter(([, v]) => v > 0)
        .map(([metric, value]) => ({ metric, value, label: labelFor(metric) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      if (!items.length) {
        clickSummary = clickEmptyText;
        clickBarsHtml = `<p>${clickEmptyTable}</p>`;
      } else {
        const names = items.map(i => i.label).join(', ');
        const mostUsedTpl =
          (typeof t === 'function' ? t('dash.analytics.click.most-used') : '') ||
          'The most-used actions in this period were: {actions}.';
        const firstLine = mostUsedTpl.replace('{actions}', names);

        // Compare last day vs previous day for these top metrics (simple trend sentence)
        let trendLine = '';
        if (dateKeys.length >= 2) {
          const lastDate = dateKeys[dateKeys.length - 1];
          const prevDate = dateKeys[dateKeys.length - 2];
          const lastRow = days[lastDate] || {};
          const prevRow = days[prevDate] || {};

          const incLabel =
            (typeof t === 'function' ? t('dash.analytics.click.trend-increased') : '') ||
            'increased';
          const decLabel =
            (typeof t === 'function' ? t('dash.analytics.click.trend-decreased') : '') ||
            'decreased';
          const sameLabel =
            (typeof t === 'function' ? t('dash.analytics.click.trend-same') : '') ||
            'stayed about the same';
          const trendPrefixTpl =
            (typeof t === 'function' ? t('dash.analytics.click.trend-prefix') : '') ||
            'Compared to the previous day, {trend}.';

          const describeDelta = (metric) => {
            const alt = metric.replaceAll('-', '_');
            const a = Number(prevRow[metric] ?? prevRow[alt] ?? 0);
            const b = Number(lastRow[metric] ?? lastRow[alt] ?? 0);
            if (b > a) return incLabel;
            if (b < a) return decLabel;
            return sameLabel;
          };

          const phrases = items.slice(0, 3).map(i => {
            const trend = describeDelta(i.metric);
            return `${i.label} ${trend}`;
          });
          const trendText = phrases.join(', ');
          trendLine = trendText
            ? trendPrefixTpl.replace('{trend}', trendText)
            : '';
        }

        clickSummary = [firstLine, trendLine].filter(Boolean).join(' ');

        clickBarsHtml = buildBarRows(
          items.map(i => ({
            label: i.label,
            value: i.value
          }))
        );
      }
    }

    const clickHeading =
      (typeof t === 'function' ? t('dash.tab.click-info') : '') ||
      'Click Info';

    const clickDisclaimer =
      (typeof t === 'function' ? t('dash.analytics.click.disclaimer') : '') ||
      'Note: Scan and click counts can vary slightly by device and camera/QR reader behavior outside NaviGen’s control.';

    const clickSectionHtml = `
      <section class="analytics-section analytics-clicks">
        <h3>${clickHeading}</h3>
        <p>${clickSummary}</p>
        ${clickBarsHtml}
        <p><small>${clickDisclaimer}</small></p>
      </section>
    `;

    // C) QR Info section (scan, armed, redeem, invalid)
    const qrRows = Array.isArray(stats.qrInfo) ? stats.qrInfo : [];
    let qrSummary = '';
    let qrTableHtml = '';
    let qrBarsHtml = '';

    const qrEmptyText =
      (typeof t === 'function' ? t('dash.analytics.qr.empty') : '') ||
      'No QR activity recorded for this period.';
    const qrEmptyTable =
      (typeof t === 'function' ? t('dash.analytics.qr.empty-table') : '') ||
      'No QR data to display.';

    if (!qrRows.length) {
      qrSummary = qrEmptyText;
      qrTableHtml = `<p>${qrEmptyTable}</p>`;
      qrBarsHtml = '';
    } else {
      // Aggregate QR event counts from qrRows
      const counts = { scan: 0, armed: 0, redeem: 0, invalid: 0 };
      for (const row of qrRows) {
        const sig = String(row.signal || '').toLowerCase();
        if (sig === 'scan')    counts.scan++;
        else if (sig === 'armed')  counts.armed++;
        else if (sig === 'redeem') counts.redeem++;
        else if (sig === 'invalid')counts.invalid++;
      }

      const totalEvents = counts.scan + counts.armed + counts.redeem + counts.invalid;

      const parts = [];
      const labelStatic   = (typeof t === 'function' ? t('dash.analytics.qr.label-static')   : '') || 'Static scans';
      const labelArmed    = (typeof t === 'function' ? t('dash.analytics.qr.label-armed')    : '') || 'Promo QR shown';
      const labelRedeem   = (typeof t === 'function' ? t('dash.analytics.qr.label-redeem')   : '') || 'Redemptions';
      const labelInvalid  = (typeof t === 'function' ? t('dash.analytics.qr.label-invalid')  : '') || 'Invalid attempts';

      if (totalEvents > 0) {
        const summaryIntroTpl =
          (typeof t === 'function' ? t('dash.analytics.qr.summary-intro') : '') ||
          'There were {total} QR events in this period:';
        parts.push(summaryIntroTpl.replace('{total}', String(totalEvents)));

        const detailBits = [];
        if (counts.scan)   detailBits.push(`${labelStatic} - ${counts.scan}`);
        if (counts.armed)  detailBits.push(`${labelArmed} - ${counts.armed}`);
        if (counts.redeem) detailBits.push(`${labelRedeem} - ${counts.redeem}`);
        if (counts.invalid)detailBits.push(`${labelInvalid} - ${counts.invalid}`);
        if (detailBits.length) parts.push(detailBits.join(', ') + '.');

        if (counts.armed > 0) {
          const redRate = ((counts.redeem / counts.armed) * 100).toFixed(1);
          const fromPromosTpl =
            (typeof t === 'function' ? t('dash.analytics.qr.summary-from-promos') : '') ||
            'Most QR activity came from promotions, with {percent}% of promo QR shown leading to a redemption.';
          parts.push(fromPromosTpl.replace('{percent}', redRate));
        } else if (counts.scan > 0) {
          const redFromScans = ((counts.redeem / counts.scan) * 100).toFixed(1);
          const fromStaticTpl =
            (typeof t === 'function' ? t('dash.analytics.qr.summary-from-static') : '') ||
            'Most QR activity came from static scans, with {percent}% leading to a redemption.';
          parts.push(fromStaticTpl.replace('{percent}', redFromScans));
        }

        if (counts.invalid > 0 && totalEvents > 0) {
          const invalidRate = ((counts.invalid / totalEvents) * 100).toFixed(1);
          const invalidSummaryTpl =
            (typeof t === 'function' ? t('dash.analytics.qr.summary-invalid') : '') ||
            'Invalid attempts were {percent}% of QR events, which indicates customers mostly use valid codes.';
          parts.push(invalidSummaryTpl.replace('{percent}', invalidRate));
        }
      } else {
        parts.push(qrEmptyText);
      }

      qrSummary = parts.join(' ');

      const qrItems = [
        counts.scan    ? { label: labelStatic,  value: counts.scan }    : null,
        counts.armed   ? { label: labelArmed,   value: counts.armed }   : null,
        counts.redeem  ? { label: labelRedeem,  value: counts.redeem }  : null,
        counts.invalid ? { label: labelInvalid, value: counts.invalid } : null
      ].filter(Boolean);

      qrTableHtml = buildMiniTable(qrItems);
      qrBarsHtml = buildBarRows(qrItems);
    }

    const qrHeading =
      (typeof t === 'function' ? t('dash.tab.qr-info') : '') ||
      'QR Info';

    const qrSectionHtml = `
      <section class="analytics-section analytics-qr">
        <h3>${qrHeading}</h3>
        <p>${qrSummary}</p>
        ${qrBarsHtml}
      </section>
    `;

    // D) Campaigns section (armed vs redemptions per campaign)
    const campaigns = Array.isArray(stats.campaigns) ? stats.campaigns : [];
    let campSummary = '';
    let campTableHtml = '';
    let campBarsHtml = '';
    let campFooterNote = ''; // kept for structure; QA-specific notes move to the QA section

    const campEmptyText =
      (typeof t === 'function' ? t('dash.analytics.campaigns.empty') : '') ||
      'No promotion campaigns active or tracked in this period.';
    const campEmptyTable =
      (typeof t === 'function' ? t('dash.analytics.campaigns.empty-table') : '') ||
      'No campaign data to display.';

    // aggregated totals reused by the Quality Assurance block (scan discipline / invalid ratios)
    let totalArmed = 0;
    let totalRedeems = 0;
    let totalInvalid = 0;

    if (!campaigns.length) {
      campSummary = campEmptyText;
      campTableHtml = `<p>${campEmptyTable}</p>`;
      campBarsHtml = '';
    } else {
      const perCampItems = campaigns.map(c => {
        const armed = Number(c.armed ?? 0);
        const red = Number(c.redemptions ?? 0);
        const inv = Number(c.invalids ?? 0);
        totalArmed += armed;
        totalRedeems += red;
        totalInvalid += inv;
        const rawName = c.campaignName || c.campaign || '';
        const name = rawName ? `"${rawName}"` : '';
        return { name, armed, red };
      });
      
      const summaryTpl =
        (typeof t === 'function' ? t('dash.analytics.campaigns.summary') : '') ||
        'Promotions were shown {armed} times, with {redeems} redemptions in this period.';
      const invalidTpl =
        (typeof t === 'function' ? t('dash.analytics.campaigns.invalid-summary') : '') ||
        'There were {invalid} invalid redemption attempts across all campaigns.';

      const bits = [];
      bits.push(
        summaryTpl
          .replace('{armed}', String(totalArmed))
          .replace('{redeems}', String(totalRedeems))
      );
      if (totalInvalid > 0) {
        bits.push(invalidTpl.replace('{invalid}', String(totalInvalid)));
      }
      // NOTE: Scan compliance (redemptions / armed) is computed and interpreted only in the Quality Assurance section.
      campSummary = bits.join(' ');

      // Merchant-facing operational status (OK / Needs attention) — no ratios exposed.
      let opsStatusHtml = '';
      const hasPromoActivity = totalArmed > 0 || totalRedeems > 0 || totalInvalid > 0;
      if (hasPromoActivity) {
        const totalRedeemAttempts = totalRedeems + totalInvalid;
        const complianceRatio = totalArmed > 0 ? (totalRedeems / totalArmed) : null;
        const invalidRatio = totalRedeemAttempts > 0 ? (totalInvalid / totalRedeemAttempts) : 0;
        const cashierCoverage = totalRedeems > 0 ? (cashierConfs / totalRedeems) : null;

        let needsAttention = false;
        if (complianceRatio !== null && complianceRatio < 0.7) {
          needsAttention = true;
        }
        if (invalidRatio > 0.10 && totalInvalid >= 3) {
          needsAttention = true;
        }
        if (cashierCoverage !== null && cashierCoverage < 0.8) {
          needsAttention = true;
        }

        const statusKey = needsAttention
          ? 'dash.analytics.status.needs-attention'
          : 'dash.analytics.status.ok';
        const statusFallback = needsAttention
          ? 'Operational status: Needs attention'
          : 'Operational status: OK';
        const statusLabel =
          (typeof t === 'function' ? t(statusKey) : '') || statusFallback;

        opsStatusHtml = `<p class="analytics-status">${statusLabel}</p>`;
      }

      const defaultCampLabel =
        (typeof t === 'function' ? t('dash.analytics.campaigns.label') : '') ||
        'Campaign';

      const barItems = perCampItems
        .filter(i => i.armed > 0 || i.red > 0)
        .map(i => ({
          label: i.name || defaultCampLabel,
          value: i.armed,
          redeemed: i.red
        }));
        
      if (!barItems.length) {
        campTableHtml = `<p>${campEmptyTable}</p>`;
        campBarsHtml = '';
      } else {
        // Table: "Campaign" + "red / armed"
        const tableItems = barItems.map(i => ({
          label: i.label,
          value: `${i.redeemed} / ${i.value}`
        }));
        campTableHtml = buildMiniTable(tableItems);

        // Bar chart: stacked filled/remaining (armed vs redeemed)
        const maxArmed = Math.max(...barItems.map(i => i.value));
        const rows = barItems.map(i => {
          const totalWidth = Math.max(4, (i.value / maxArmed) * 100);
          const redPart = i.value > 0 ? (i.redeemed / i.value) : 0;
          const redeemedWidth = totalWidth * redPart;
          const remainingWidth = totalWidth - redeemedWidth;
          return `
            <div class="analytics-bar-row">
              <span class="analytics-bar-label">${i.label}</span>
              <div class="analytics-bar-track">
                <div class="analytics-bar-fill" style="width:${Math.max(0, redeemedWidth)}%;"></div>
                <div class="analytics-bar-fill remaining" style="width:${Math.max(0, remainingWidth)}%;"></div>
              </div>
              <span class="analytics-bar-value">${i.redeemed} / ${i.value}</span>
            </div>
          `;
        }).join('');
        campBarsHtml = `<div class="analytics-bars">${rows}</div>`;
      }

      // Append opsStatusHtml into the summary area
      campSummary = `${campSummary}${opsStatusHtml ? ' ' : ''}`;
      campFooterNote = opsStatusHtml + campFooterNote;
    }

    const campaignsHeading =
      (typeof t === 'function' ? t('dash.tab.campaigns') : '') ||
      'Campaigns';

    const campaignsSectionHtml = `
      <section class="analytics-section analytics-campaigns">
        <h3>${campaignsHeading}</h3>
        <p>${campSummary}</p>
        ${campTableHtml}
        ${campBarsHtml}
        ${campFooterNote}
      </section>
    `;

    // E) Quality Assurance Analysis (scan discipline, invalid attempts, and confirmation coverage live only here)
    let qaLines = [];

    const hasPromoActivity = totalArmed > 0 || totalRedeems > 0 || totalInvalid > 0;
    const totalRedeemAttempts = totalRedeems + totalInvalid;
    const complianceRatio = totalArmed > 0 ? (totalRedeems / totalArmed) : null;
    const invalidRatio = totalRedeemAttempts > 0 ? (totalInvalid / totalRedeemAttempts) : 0;

    // coverage (derived from aggregates computed earlier)
    const cashierCoverage  = totalRedeems > 0 ? (cashierConfs  / totalRedeems) : null;
    const customerCoverage = totalArmed   > 0 ? (customerConfs / totalArmed)   : null;

    if (!hasPromoActivity) {
      const msg =
        (typeof t === 'function' ? t('dash.analytics.qa.no-promo-activity') : '') ||
        'No promotional QR activity was recorded in this period, so scan discipline and invalid use cannot be evaluated.';
      qaLines.push(msg);
    } else {
      // Scan discipline
      if (complianceRatio === null) {
        const msg =
          (typeof t === 'function' ? t('dash.analytics.qa.scan-missing') : '') ||
          'Redemptions were recorded without any matching "promo QR shown" events in this reporting window. This usually means that promo QR codes were displayed outside the selected period.';
        qaLines.push(msg);
      } else if (complianceRatio > 1.05) {
        const pct = (complianceRatio * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.scan-over-100') : '') ||
          '⚠ QA: Reported scan discipline is above 100% (≈ {percent}%). This typically indicates that some redemptions in this period originate from promo QR shown outside the selected reporting window.';
        qaLines.push(tpl.replace('{percent}', pct));
      } else if (complianceRatio < 0.7) {
        const pct = (complianceRatio * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.scan-low') : '') ||
          '⚠ QA: Scan discipline appears low in this period (≈ {percent}%). Promotions were shown {armed} times, with {redeems} redemptions. Consider reinforcing the in-store process so that cashiers always scan promotion codes at checkout.';
        qaLines.push(
          tpl
            .replace('{percent}', pct)
            .replace('{armed}', String(totalArmed))
            .replace('{redeems}', String(totalRedeems))
        );
      } else {
        const pct = (complianceRatio * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.scan-normal') : '') ||
          'QA: Promo scanning appears within a normal range for this period. Roughly {percent}% of "promo QR shown" events led to a recorded redemption.';
        qaLines.push(tpl.replace('{percent}', pct));
      }

      // Invalid attempts
      if (totalRedeemAttempts === 0) {
        const msg =
          (typeof t === 'function' ? t('dash.analytics.qa.invalid-no-attempts') : '') ||
          'No redemption attempts were recorded in this period, so invalid use cannot be evaluated.';
        qaLines.push(msg);
      } else if (invalidRatio > 0.10 && totalInvalid >= 3) {
        const pct = (invalidRatio * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.invalid-elevated') : '') ||
          '⚠ QA: Invalid redemption attempts are elevated in this period (≈ {percent}% of {tries} redemption tries). This may indicate repeated use of expired or already-used codes, or attempts outside the valid campaign window.';
        qaLines.push(
          tpl
            .replace('{percent}', pct)
            .replace('{tries}', String(totalRedeemAttempts))
        );
      } else {
        const pct = (invalidRatio * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.invalid-normal') : '') ||
          'QA: Invalid redemption attempts look normal for this period (≈ {percent}% of {tries} redemption tries).';
        qaLines.push(
          tpl
            .replace('{percent}', pct)
            .replace('{tries}', String(totalRedeemAttempts))
        );
      }

      // Cashier coverage
      if (cashierCoverage === null) {
        const msg =
          (typeof t === 'function' ? t('dash.analytics.qa.cashier-coverage-missing') : '') ||
          'Cashier confirmation coverage could not be evaluated because there were no recorded redemptions in this period.';
        qaLines.push(msg);
      } else if (cashierCoverage < 0.8) {
        const pct = (cashierCoverage * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.cashier-coverage-low') : '') ||
          '⚠ QA: Cashier confirmations cover only about {percent}% of recorded redemptions ({confirmations} of {redeems}). This may indicate that some discounts are applied without completing the full promo QR flow at the register.';
        qaLines.push(
          tpl
            .replace('{percent}', pct)
            .replace('{confirmations}', String(cashierConfs))
            .replace('{redeems}', String(totalRedeems))
        );
      } else {
        const pct = (cashierCoverage * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.cashier-coverage-ok') : '') ||
          'QA: Cashier confirmations cover most recorded redemptions (≈ {percent}%, {confirmations} of {redeems}), which is consistent with a healthy scan-and-redeem process.';
        qaLines.push(
          tpl
            .replace('{percent}', pct)
            .replace('{confirmations}', String(cashierConfs))
            .replace('{redeems}', String(totalRedeems))
        );
      }

      // Customer coverage
      if (customerCoverage === null) {
        const msg =
          (typeof t === 'function' ? t('dash.analytics.qa.customer-coverage-missing') : '') ||
          'Customer confirmation coverage could not be evaluated because no promo QR was shown in this period.';
        qaLines.push(msg);
      } else if (customerCoverage < 0.5 && totalArmed >= 10) {
        const pct = (customerCoverage * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.customer-coverage-low') : '') ||
          '⚠ QA: Customer confirmations are low compared to promo QR shown (≈ {percent}%, {confirmations} confirmations from {armed} promo displays). This may indicate that promotions are not consistently converted into a completed redeem experience.';
        qaLines.push(
          tpl
            .replace('{percent}', pct)
            .replace('{confirmations}', String(customerConfs))
            .replace('{armed}', String(totalArmed))
        );
      } else if (totalArmed > 0) {
        const pct = (customerCoverage * 100).toFixed(1);
        const tpl =
          (typeof t === 'function' ? t('dash.analytics.qa.customer-coverage-ok') : '') ||
          'QA: Customer confirmations are within an expected range for this period (≈ {percent}%, {confirmations} confirmations from {armed} promo displays).';
        qaLines.push(
          tpl
            .replace('{percent}', pct)
            .replace('{confirmations}', String(customerConfs))
            .replace('{armed}', String(totalArmed))
        );
      }
    }

    const qaHeading =
      (typeof t === 'function' ? t('dash.analytics.qa.heading') : '') ||
      'Quality Assurance Analysis';

    const qaSectionHtml = `
      <section class="analytics-section analytics-qa">
        <h3>${qaHeading}</h3>
        ${qaLines.map(line => `<p>${line}</p>`).join('')}
      </section>
    `;

    // F) Footer with timestamp
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ts = `${y}-${m}-${d} · ${hh}:${mm}`;

    const brandTpl =
      (typeof t === 'function' ? t('dash.analytics.footer.brand') : '') ||
      '{year} @ NaviGen — Business Report';
    const brand = brandTpl.replace('{year}', String(y));
    const underline = '_'.repeat(brand.length);

    const footerHtml = `
      <footer class="analytics-footer" style="margin-top:3em; text-align:left;">
        <div><small>${ts}</small></div>
        <div style="font-family:monospace;">${underline}</div>
        <div style="font-family:monospace;"><small>${brand}</small></div>
      </footer>
    `;

    // Assemble full report inside the existing scroll container
    tblWrap.innerHTML = `
      <div id="dash-table-scroller">
        <div class="analytics-report">
          ${headerHtml}
          ${clickSectionHtml}
          ${qrSectionHtml}
          ${campaignsSectionHtml}
          ${qaSectionHtml}
          ${footerHtml}
        </div>
      </div>
    `;

    return;
  } 
}

// Build TSV from the current table (thead + tbody + tfoot). Comments stay concise.
/** Returns a TSV string for spreadsheet-friendly pasting. */
function toTSV(table){
  const rows = [];
  const pick = (sel) => Array.from(table.querySelectorAll(sel));
  const clean = (s) => String(s).replace(/\s+/g,' ').replace(/\t/g,' ').trim();

  // header
  const thead = table.tHead;
  if (thead && thead.rows[0]) {
    rows.push(Array.from(thead.rows[0].cells).map(c => clean(c.textContent)).join('\t'));
  }
  // body
  for (const tr of table.tBodies[0]?.rows || []) {
    rows.push(Array.from(tr.cells).map(c => clean(c.textContent)).join('\t'));
  }
  // footer (single summary row)
  const tfoot = table.tFoot;
  if (tfoot && tfoot.rows[0]) {
    rows.push(Array.from(tfoot.rows[0].cells).map(c => clean(c.textContent)).join('\t'));
  }
  return rows.join('\n');
}

async function loadAndRender(){         // single entry point
  try{
    tblWrap.textContent = t('dash.state.loading');
    const result = await fetchStats();

    if (!result || result.ok !== true) {
      const code = Number(result?.status || 0);

      if (code === 401 || code === 403) {
        await renderAccessBlocked({ status: code, detail: result?.detail || '' });
        return;
      }

      const fallback = (typeof t === 'function' && t('dash.error.load-failed')) || 'Failed to load stats';
      const d = String(result?.detail || '').trim();
      tblWrap.textContent = d ? `${fallback}: ${d}` : fallback;
      return;
    }

    const json = result.json;
    if (Array.isArray(json.order) && json.order.length){
      // merge server-specified order; backend guarantees correct keys (underscored)
      json.order.forEach((kRaw) => {
        const k = String(kRaw).replaceAll('_', '-'); // normalize legacy ids
        // Do not add qr-redeem to ORDER; keep Click Info focused on scans
        if (k === 'qr-redeem') return;
        if (!ORDER.includes(k)) ORDER.push(k);
      });
    }

    // cache latest stats so all aspects can reuse the same payload
    lastStats = json;
    renderCurrentView(); // show active view (Click Info / QR Info / Campaigns)
  } catch (e) {
    // fetchStats now returns structured results; if we got here, it's an unexpected crash.
    tblWrap.textContent = (e && e.message) ? e.message : t('dash.error.load-failed');
  }
}

if (periodEl) periodEl.addEventListener('change', () => loadAndRender()); // safe if missing
loadAndRender();                                            // auto-load once
