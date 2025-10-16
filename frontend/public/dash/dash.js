// Minimal dashboard: pulls /api/stats* and renders a fixed-order daily table.
// Robust i18n loader: tries local and absolute; falls back to key-echo if server serves HTML
let t = (k) => k; // safe fallback so UI renders even if i18n.js isn’t served as JS
try {
  // robust path: resolves next to dash.js; avoids SPA HTML fallback
  // robust path resolution (2 tries) to avoid SPA HTML fallback
  try {
    ({ t } = await import(new URL('./scripts/i18n.js', import.meta.url).href)); // next to dash.js
  } catch (_e1) {
    ({ t } = await import('/scripts/i18n.js')); // absolute root as fallback
  }
} catch (_e) {
  console.warn('i18n module failed to load (served as HTML?) — using key fallback');
}

const $ = (s) => document.querySelector(s);
const modeEl = $('#mode'), locEl = $('#locationID'), entEl = $('#entityID');
const periodEl = $('#period'); // single control drives the window
const hintEl = $('#hint'), metaEl = $('#meta'), tblWrap = $('#table-wrap');
const locWrap = $('#loc-wrap'), entWrap = $('#ent-wrap');

const TODAY = new Date();
const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);

// default: 2 weeks
periodEl.value = '14';

// normalize date input to YYYY-MM-DD; handles valueAsDate or localized text (1-2 lines of logic, keep simple)
function getISODate(input){
  const d = input.valueAsDate;
  if (d instanceof Date && !isNaN(d)) return iso(d);
  const v = (input.value||'').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  return m ? `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}` : v; // keep last resort
}

// load initial params from URL (?locationID=…&entityID=…&mode=…)
{
  const u = new URL(location.href);
  const m = u.searchParams.get('mode') || 'location';
  const lid = u.searchParams.get('locationID') || '';
  const eid = u.searchParams.get('entityID') || '';
  modeEl.value = m;
  locEl.value = lid;
  entEl.value = eid;
  syncMode();
}

modeEl.addEventListener('change', syncMode);
function syncMode() {
  const isEntity = modeEl.value === 'entity';
  entWrap.style.display = isEntity ? '' : 'none';
  locWrap.style.display = isEntity ? 'none' : '';
  hintEl.textContent = t('dash.hint.single'); // baseline
}

// fixed order as served by your Worker (extend if needed)
const ORDER = [
  'lpm-open','call','email','whatsapp','telegram','messenger',
  'official','booking','newsletter',
  'facebook','instagram','pinterest','spotify','tiktok','youtube',
  'share','save','unsave','map','qr-view'
];

// display labels for metrics (centralized, tweak here)
// fallback humanizer keeps others readable; 2-line comments only
const METRIC_LABEL = Object.freeze({
  lpm_open: t('metric.lpm-open'),
  call:     t('metric.call'),
  qr_view:  t('metric.qr-view'),
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
  const base = 'https://navigen-api.4naama.workers.dev'; // Worker stays
  const periodDays = Number(periodEl.value) || 14;
  const end = day(TODAY);                               // today (local)
  const start = new Date(end.getTime() - (periodDays - 1) * 86400e3);
  const from = iso(start), to = iso(end);               // API window

  const isEntity = modeEl.value === 'entity';
  const q = isEntity
    ? new URL(`/api/stats/entity?entityID=${encodeURIComponent(entEl.value)}&from=${from}&to=${to}`, base)
    : new URL(`/api/stats?locationID=${encodeURIComponent(locEl.value)}&from=${from}&to=${to}`, base);

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
    const vals = dates.map(d => Number(((days[d] || {})[metric]) || 0));
    const sum  = vals.reduce((a,b)=>a+b, 0);
    return `<tr><th scope="row">${labelFor(metric)}</th>${vals.map(n=>`<td>${n}</td>`).join('')}<td>${sum}</td></tr>`;
  }).join('');

  // footer: per-date sums (sum across all metrics for each date)
  const perDateSums = dates.map(d =>
    ORDER.reduce((acc, k) => acc + Number(((days[d] || {})[k]) || 0), 0)
  );
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
  /* update period subtitle under the title */
  {
    const days = Number(periodEl.value) || 14;               // period length
    const end = day(TODAY);                                   // today (local)
    const start = new Date(end.getTime() - (days - 1) * 86400e3);
    const startISO = iso(start), endISO = iso(end);

    // inline date range + right-aligned copy button
    metaEl.innerHTML = `<span class="meta-range">${startISO} → ${endISO}</span>`;
    let btn = document.getElementById('copy-tsv');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'copy-tsv';
      btn.type = 'button';
      btn.title = t('dash.copy.tsv');
      btn.ariaLabel = t('dash.copy.tsv');

      btn.textContent = '⧉'; // copy/duplicate emoji
      btn.addEventListener('click', async () => {
        const table = tblWrap.querySelector('table.stats-table');
        if (!table) return;
        const tsv = toTSV(table); // helper stays simple

        try{
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(tsv);
          else if (document.execCommand) document.execCommand('copy'); // legacy
          // clicked feedback: 2–3s darker state
          btn.classList.add('copied');              // visual cue
          const oldTitle = btn.title;
          btn.title = t('dash.copy.copied');        // short tooltip cue
          setTimeout(() => {                        // clear after ~2.5s
            btn.classList.remove('copied');
            btn.title = oldTitle;
          }, 2500);
        }catch(_e){
          // if copy fails, keep silent; button stays normal
        }
      });

      metaEl.appendChild(btn);
    }
    // lightweight inline layout so button sits to the right of the range
    metaEl.style.display = 'flex';
    metaEl.style.alignItems = 'center';
    metaEl.style.gap = '8px';
    btn.style.marginLeft = 'auto';
  }

  // update hint to include selected name when available (keeps "Single location daily counts" otherwise)
  const dispName = (json.locationName || json.entityName || '').trim();
  hintEl.textContent = dispName ? `${t('dash.hint.single-for')} ${dispName}` : t('dash.hint.single');
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
      json.order.forEach(k => { if (!ORDER.includes(k)) ORDER.push(k); }); // keep server order
    }
    renderTable(json);
  }catch(e){
    tblWrap.textContent = (e && e.message) ? e.message : t('dash.error.load-failed');
  }
}

periodEl.addEventListener('change', () => loadAndRender()); // react to user
loadAndRender();                                            // auto-load once
