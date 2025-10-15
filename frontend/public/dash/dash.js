// Minimal dashboard: pulls /api/stats* and renders a fixed-order daily table.

const $ = (s) => document.querySelector(s);
const modeEl = $('#mode'), locEl = $('#locationID'), entEl = $('#entityID');
const fromEl = $('#from'), toEl = $('#to'), loadBtn = $('#load');
const hintEl = $('#hint'), metaEl = $('#meta'), tblWrap = $('#table-wrap');
const locWrap = $('#loc-wrap'), entWrap = $('#ent-wrap');

const TODAY = new Date();
const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10);

// default: last 30d
toEl.value = iso(TODAY);
fromEl.value = iso(new Date(day(TODAY).getTime() - 29*86400e3));

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
  hintEl.textContent = isEntity ? 'Sum across mapped locations of the entity' : 'Single location daily counts';
}

// fixed order as served by your Worker (extend if needed)
const ORDER = [
  'lpm_open','call','email','whatsapp','telegram','messenger',
  'official','booking','newsletter',
  'facebook','instagram','pinterest','spotify','tiktok','youtube',
  'share','save','unsave','map','qr_view'
];

async function fetchStats() {
  const base = 'https://navigen-api.4naama.workers.dev'; // use Worker; avoids HTML from site
  const from = fromEl.value, to = toEl.value;

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

  // TRANSPOSED: metrics as rows, dates as columns
  const headCells = ['Metric', ...dates, 'Sum'];
  const thead = `<thead><tr>${headCells.map(c=>`<th>${c}</th>`).join('')}</tr></thead>`;

  // build one row per metric in ORDER
  const bodyRows = ORDER.map(metric => {
    // values for this metric across all dates
    const vals = dates.map(d => Number(((days[d]||{})[metric]) || 0));
    const sum = vals.reduce((a,b)=>a+b,0);
    return `<tr><th scope="row">${metric}</th>${vals.map(n=>`<td>${n}</td>`).join('')}<td>${sum}</td></tr>`;
  }).join('');

  // column sums (by date) + grand total
  const perDateSums = dates.map(d =>
    ORDER.reduce((acc, metric) => acc + Number(((days[d]||{})[metric]) || 0), 0)
  );
  const grandTotal = perDateSums.reduce((a,b)=>a+b,0);
  const tfoot = `<tfoot><tr><th scope="row">Total per day</th>${perDateSums.map(n=>`<td>${n}</td>`).join('')}<td>${grandTotal}</td></tr></tfoot>`;

  // only the TABLE scrolls (left-aligned) + sticky header/left col
  tblWrap.innerHTML = `
    <div id="table-scroller" style="overflow:auto; max-width:100%; text-align:left;">
      <table class="stats-table" style="margin:0; width:max-content; border-collapse:collapse;">
        ${thead}
        <tbody>${bodyRows}</tbody>
        ${tfoot}
      </table>
    </div>
  `;

  // inject scoped styles once (sticky header + sticky left column)
  let style = document.getElementById('dash-transpose-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dash-transpose-styles';
    style.textContent = `
      #table-scroller { overflow: auto; max-width: 100%; text-align: left; }
      #table-scroller table { border-collapse: collapse; }
      #table-scroller th, #table-scroller td { padding: 6px 10px; }
      #table-scroller thead th { position: sticky; top: 0; z-index: 2; background: #fff; }
      #table-scroller tbody th[scope="row"] { position: sticky; left: 0; z-index: 1; background: #fff; }
    `;
    document.head.appendChild(style);
  }

  // dynamic height so only the table area scrolls (no globals)
  {
    const scroller = tblWrap.querySelector('#table-scroller');
    const setSize = () => {
      const r = scroller.getBoundingClientRect();
      scroller.style.maxHeight = Math.max(120, window.innerHeight - r.top - 16) + 'px';
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(scroller);
    if (scroller.parentElement) ro.observe(scroller.parentElement);
    ro.observe(document.documentElement);
    ro.observe(document.body);
  }

  // dynamic height so page doesn't scroll – scoped observer (no globals)
  {
    const scroller = tblWrap.querySelector('#table-scroller');
    const setSize = () => {
      const r = scroller.getBoundingClientRect();
      scroller.style.maxHeight = Math.max(120, window.innerHeight - r.top - 16) + 'px';
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(scroller);
    if (scroller.parentElement) ro.observe(scroller.parentElement);
    ro.observe(document.documentElement);
    ro.observe(document.body);
  }

  // meta
  const label = json.locationID ? `locationID=${json.locationID}` :
               json.entityID   ? `entityID=${json.entityID}` : '';
  metaEl.textContent = `${label} • ${json.from} → ${json.to} • tz=${json.tz || '—'}`;
}

loadBtn.addEventListener('click', async () => {
  try {
    tblWrap.textContent = 'Loading…';
    const json = await fetchStats();
    // align to API-provided order if present
    if (Array.isArray(json.order) && json.order.length) {
      // include qr_view if server has it but client not yet
      json.order.forEach(k => { if (!ORDER.includes(k)) ORDER.push(k); });
    }
    renderTable(json);
  } catch (e) {
    tblWrap.textContent = (e && e.message) ? e.message : 'Failed to load stats';
  }
});

// auto-load once
loadBtn.click();
