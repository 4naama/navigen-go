// Minimal dashboard: pulls /api/stats* and renders a fixed-order daily table.
// Robust i18n loader: tries local and absolute; falls back to key-echo if server serves HTML
let t = (k) => k; // safe fallback so UI renders even if i18n.js isn’t served as JS
try {
  // try absolute prod path first; fall back to local root copy
  try {
    // keep URL; call loader so t() has strings
    const __i18nA = await import('/scripts/i18n.js'); ({ t } = __i18nA);
    await __i18nA.loadTranslations(document.documentElement.lang || localStorage.getItem('lang') || 'en');
  } catch (_e1) {
    ({ t } = await import(new URL('./i18n.js', import.meta.url).href)); // local minimal build
  }

} catch (_e) {
  console.warn('i18n module failed to load (served as HTML?) — using key fallback');
}

const $ = (s) => document.querySelector(s);
const modeEl = $('#mode'), locEl = $('#locationID'), entEl = $('#entityID');
const periodEl = $('#period'); // single control drives the window
const hintEl = $('#hint'), metaEl = $('#meta'), tblWrap = $('#table-wrap');
const locWrap = $('#loc-wrap'), entWrap = $('#ent-wrap');

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

// Match app behavior: reload when tapping the logo
const dashLogo = document.getElementById('logo-icon');
// tap anim first, then reload (keeps comments concise)
if (dashLogo) {
  dashLogo.addEventListener('animationend', () => dashLogo.classList.remove('animating'));
  dashLogo.addEventListener('click', (e) => {
    e.preventDefault();                       // allow anim to play
    dashLogo.classList.add('animating');      // trigger CSS keyframes
    setTimeout(() => location.reload(), 280); // reload after brief pop
  }, { passive: false });
}

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

  if (entEl) entEl.value = eid;

  if (modeEl && locWrap && entWrap) syncMode();
}

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
  'call','email','whatsapp','telegram','messenger', 'rating-sum'
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
  'rating-sum':   t('metric.rating-sum'),
  "rating-avg":   t('metric.rating-avg')
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

async function fetchStats() {
  // single source for all stats calls
  const base = 'https://navigen-api.4naama.workers.dev';
  const periodDays = Number(periodEl?.value) || 14;
  const end = day(TODAY);                               // today (local)
  const start = new Date(end.getTime() - (periodDays - 1) * 86400e3);
  const from = iso(start), to = iso(end);               // API window

  const isEntity = (modeEl?.value || 'location') === 'entity';

  // Accept either ULID or slug — pass through; backend resolves slug → ULID (KV aliases)
  // Prefer what the user sees (slug) over the stashed ULID for request composition,
  // but keep the stashed ULID available for advanced flows if needed.
  let locId = String((locEl?.value || locEl?.dataset?.canonicalId || '')).trim();

  // Always send locationID=; backend resolves ULID or slug via KV aliases (no client pre-resolution)
  const q = isEntity
    ? new URL(`/api/stats/entity?entityID=${encodeURIComponent(entEl.value)}&from=${from}&to=${to}`, base)
    : new URL(`/api/stats?locationID=${encodeURIComponent(locId)}&from=${from}&to=${to}`, base);

  const res = await fetch(q, { cache: 'no-store' });
  if (!res.ok) {
    const txt = await res.text().catch(()=>String(res.status));
    throw new Error(`Stats error ${res.status}: ${txt}`);
  }
  return res.json();
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
        const table = tblWrap.querySelector('table.stats-table');
        if (!table) return;
        const tsv = toTSV(table);
        try{
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(tsv);
          else if (document.execCommand) document.execCommand('copy');
          copyBtn.classList.add('copied');
          const oldTitle = copyBtn.title;
          copyBtn.title = t('dash.copy.copied');
          setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.title = oldTitle; }, 2500);
        }catch(_e){ /* noop */ }
      });
      metaEl.appendChild(copyBtn);
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
    // rating summary (Rated + Average rating) when backend provides it
    {
      const ratedTotal = Number(json.rated_sum ?? 0);
      const ratingAvg = Number(json.rating_avg ?? 0);

      // only render when we actually have rating data
      const hasRating = Number.isFinite(ratedTotal) && ratedTotal > 0 && Number.isFinite(ratingAvg) && ratingAvg > 0;
      let ratingLine = metaEl.querySelector('.meta-rating');

      if (hasRating) {
        if (!ratingLine) {
          ratingLine = document.createElement('span');
          ratingLine.className = 'meta-rating';
          metaEl.appendChild(ratingLine);
        }

        const avgText = ratingAvg.toFixed(2);
        ratingLine.textContent = `${t('metric.rating-sum')}: ${ratedTotal} • ${t('metric.rating-avg')}: ${avgText}`;
      } else if (ratingLine) {
        ratingLine.remove();
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
    const json = await fetchStats();
    if (Array.isArray(json.order) && json.order.length){
      // merge server-specified order; backend guarantees correct keys (underscored)
      json.order.forEach((kRaw) => {
        const k = String(kRaw).replaceAll('_', '-'); // normalize legacy ids
        if (!ORDER.includes(k)) ORDER.push(k);
      });
    }

    renderTable(json);
  }catch(e){
    tblWrap.textContent = (e && e.message) ? e.message : t('dash.error.load-failed');
  }
}

if (periodEl) periodEl.addEventListener('change', () => loadAndRender()); // safe if missing
loadAndRender();                                            // auto-load once
