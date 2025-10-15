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

  // header
  const cols = ['Date', ...ORDER, 'Sum'];
  const thead = `<thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead>`;

  // rows
  const rows = dates.map(d => {
    const row = days[d] || {};
    const nums = ORDER.map(k => Number(row[k]||0));
    const sum = nums.reduce((a,b)=>a+b,0);
    return `<tr><td>${d}</td>${nums.map(n=>`<td>${n}</td>`).join('')}<td>${sum}</td></tr>`;
  }).join('');

  // footer sums
  const colSums = ORDER.map(k =>
    dates.reduce((acc, d) => acc + Number((days[d]||{})[k]||0), 0)
  );
  const total = colSums.reduce((a,b)=>a+b,0);
  const tfoot = `<tfoot><tr><td>Period sum</td>${colSums.map(n=>`<td>${n}</td>`).join('')}<td>${total}</td></tr></tfoot>`;

  tblWrap.innerHTML = `<div id="table-scroller"><table class="stats-table">${thead}<tbody>${rows||''}</tbody>${tfoot}</table></div>`;
  
  // transpose: columns -> rows, and make only the table scrollable (left-aligned)
  {
    const scroller = tblWrap.querySelector('#table-scroller');
    const t = scroller.querySelector('table');
    // scroll container + left align
    scroller.style.overflowY = 'auto';
    scroller.style.overflowX = 'auto';
    scroller.style.maxWidth = '100%';
    scroller.style.textAlign = 'left';
    t.style.margin = '0';

    // compute available height so only the table area scrolls
    const setScrollerSize = () => {
      const r = scroller.getBoundingClientRect();
      scroller.style.maxHeight = Math.max(120, window.innerHeight - r.top - 16) + 'px';
    };
    setScrollerSize();
    const ro2 = new ResizeObserver(() => setScrollerSize());
    ro2.observe(scroller);
    if (scroller.parentElement) ro2.observe(scroller.parentElement);
    ro2.observe(document.documentElement);
    ro2.observe(document.body);

    const thead = t.querySelector('thead');
    const tbody = t.querySelector('tbody');
    if (!thead || !tbody) return; // safety

    const headCells = Array.from(thead.querySelectorAll('th'));     // original column headers
    const bodyRows  = Array.from(tbody.querySelectorAll('tr'))      // original rows
                           .map(tr => Array.from(tr.children));     // as cell arrays

    // Build transposed table
    const newT = document.createElement('table');
    newT.className = t.className || 'stats-table';

    // New THEAD: top-left empty + headers taken from original first-column cells
    const newThead = document.createElement('thead');
    const headRow  = document.createElement('tr');
    const corner   = document.createElement('th'); headRow.appendChild(corner);

    // header for each original row (use the first cell text as the label)
    bodyRows.forEach(r => {
      const th = document.createElement('th');
      th.innerHTML = (r[0]?.innerHTML ?? '').trim(); // preserve formatting if any
      headRow.appendChild(th);
    });
    newThead.appendChild(headRow);

    // New TBODY: each original column (from index 1) becomes a row
    const newBody = document.createElement('tbody');
    const colCount = Math.max(headCells.length, bodyRows[0]?.length || 0);

    for (let c = 1; c < colCount; c++) {
      const tr = document.createElement('tr');

      // Row header from original column header
      const rh = document.createElement('th');
      rh.scope = 'row';
      rh.innerHTML = (headCells[c]?.innerHTML ?? '').trim();
      tr.appendChild(rh);

      // Cells: take column c from each original row
      bodyRows.forEach(r => {
        const td = document.createElement('td');
        td.innerHTML = r[c]?.innerHTML ?? '';
        tr.appendChild(td);
      });

      newBody.appendChild(tr);
    }

    // Replace old table with the transposed one
    t.replaceWith(newT);
    newT.append(newThead, newBody);
  }    
  
  // keep table left; only table area scrolls
  const scroller = tblWrap.querySelector('#table-scroller'); // local styles only
  scroller.style.overflowY = 'auto';
  scroller.style.overflowX = 'auto';
  scroller.style.maxWidth = '100%';
  tblWrap.style.textAlign = 'left';
  tblWrap.style.overflow = 'hidden'; // prevent page scrollbars from scroller growth
  const tbl = scroller.querySelector('table'); // compact table
  tbl.style.margin = '0';
  tbl.style.width = 'max-content';

  // recompute height on load/resize so only table scrolls
  const setScrollerSize2 = () => {
    const r = scroller.getBoundingClientRect();
    scroller.style.maxHeight = Math.max(120, window.innerHeight - r.top - 16) + 'px';
  };
  setScrollerSize2();
  // observe size/layout changes without touching globals
  const ro = new ResizeObserver(() => setScrollerSize2());
  ro.observe(scroller);
  if (scroller.parentElement) ro.observe(scroller.parentElement);
  ro.observe(document.documentElement);
  ro.observe(document.body);

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
