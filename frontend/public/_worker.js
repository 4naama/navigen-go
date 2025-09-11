// _worker.js — Cloudflare Pages: i18n + SEO rewrites at the edge.
// - Sets <html lang="…">
// - Adds <link rel="alternate" hreflang="…"> (+ x-default)
// - Sets Open Graph locale tags
// - Injects <meta name="cf-country"> (you already read this in app.js)

// Add all locales we plan to serve (robots still block indexing; this only shapes HTML head)
const SUPPORTED = [
  'en','fr','de','hu','it','he','uk','nl','ro','pl','cs','es','sk','da','sv','nb','sl','ru','pt','is','tr','zh','el','bg','hr','et','fi','lv','lt','mt','hi','ko','ja','ar'
];
const DEFAULT = 'en';

// Map to regioned OG locales (best defaults; adjust if your target market differs)
const OG_MAP = {
  en:'en_US', fr:'fr_FR', de:'de_DE', hu:'hu_HU', it:'it_IT', he:'he_IL', uk:'uk_UA', nl:'nl_NL',
  ro:'ro_RO', pl:'pl_PL', cs:'cs_CZ', es:'es_ES', sk:'sk_SK', da:'da_DK', sv:'sv_SE', nb:'nb_NO',
  sl:'sl_SI', ru:'ru_RU', pt:'pt_PT', is:'is_IS', tr:'tr_TR',
  // For Chinese you may want to split later: zh_CN (Simplified), zh_TW (Traditional)
  zh:'zh_CN',
  el:'el_GR', bg:'bg_BG', hr:'hr_HR', et:'et_EE', fi:'fi_FI', lv:'lv_LV', lt:'lt_LT', mt:'mt_MT',
  hi:'hi_IN', ko:'ko_KR', ja:'ja_JP', ar:'ar_SA'
};

// Simple 10-min soft limiter (instance-local; enough to bounce bots)
// <!-- per IP/UA, cookie-bound when present -->
const RATE = { windowMs: 10*60*1000, cap: 120, map: new Map() };
function rateKey(req){
  const ip = req.headers.get('cf-connecting-ip') || '0.0.0.0';
  const ua = (req.headers.get('user-agent') || '').slice(0,64);
  const cookie = req.headers.get('cookie') || '';
  const hasAdmin = /\bnavigen_gate_v2=ok\b/.test(cookie);
  return (hasAdmin?'C:':'N:') + ip + '|' + ua;
}
function rateHit(req){
  const k = rateKey(req), now = Date.now();
  let e = RATE.map.get(k);
  if (!e || now > e.resetAt) { e = { count:0, resetAt: now + RATE.windowMs }; RATE.map.set(k, e); }
  e.count++;
  return { ok: e.count <= RATE.cap, remain: Math.max(0, RATE.cap - e.count), resetAt: e.resetAt };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    
    // CORS for local dev; echo Origin + allow credentials
    const ORIGIN = req.headers.get('origin') || '';
    const IS_LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(ORIGIN);
    const corsHeaders = (base = {}) => {
      const h = new Headers(base);
      if (IS_LOCAL_ORIGIN) {
        h.set('Access-Control-Allow-Origin', ORIGIN);
        h.set('Vary', 'Origin');
        h.set('Access-Control-Allow-Credentials', 'true');
        h.set('Access-Control-Allow-Headers', req.headers.get('access-control-request-headers') || 'Content-Type');
        h.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
      }
      return h;
    };
    // Preflight for API
    if (req.method === 'OPTIONS' && url.pathname.startsWith('/api/data/')) {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Hard gate for /data/* (no raw JSON unless admin cookie)
    // <!-- explicit; avoids any fall-through -->
    {
      const cookie = req.headers.get('cookie') || '';
      const ADMIN_COOKIE = 'navigen_gate_v2';
      const authed = new RegExp(`\\b${ADMIN_COOKIE}=ok\\b`).test(cookie);
      if (url.pathname.startsWith('/data/')) {
        if (!authed) {
          // show the same admin code page you already serve later
          const body = `<!doctype html><title>Admin Access</title><meta charset="utf-8">`+
                       `<body style="font:16px system-ui"><h1>🔒 Admin Access</h1>`+
                       `<form method="POST"><input name="code" inputmode="numeric" pattern="\\d{6}" maxlength="6" required>`+
                       `<button>Enter</button></form></body>`;
          return new Response(body, { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'x-ng-worker': 'gate' } });
        }
      }
    }        

    // PWA: early pass-through for critical static assets (avoid rewrites)
    // <!-- ensures manifest/SW/assets are served raw and with correct MIME -->
    if (url.pathname === '/manifest.webmanifest' ||
        url.pathname === '/sw.js' ||
        url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(req);
    }

    // -------- Admin-only Showcase Gate (no guest codes) --------
    // <!-- Bans navigen.io to everyone except admin with 6-digit code -->
    {
      // Keep only minimal static assets public so the login page can load clean
      const PUBLIC_PREFIXES = ['/assets/']; // gate /data/* — datasets allowed only after admin login
      const PUBLIC_FILES = new Set(['/robots.txt','/favicon.ico']);
      const isPublic = PUBLIC_FILES.has(url.pathname) || PUBLIC_PREFIXES.some(p => url.pathname.startsWith(p));

      const cookie = req.headers.get('cookie') || '';
      const ADMIN_COOKIE = 'navigen_gate_v2'; // rename to force global logout
      const authed = new RegExp(`\\b${ADMIN_COOKIE}=ok\\b`).test(cookie);

      // Everything non-public is admin-gated
      if (!isPublic && !authed) {
        const expected = (env.SHOWCASE_STATIC6 || '').trim(); // set in Pages → Settings → Variables
        const codeQ = (url.searchParams.get('code') || '').trim();
        const codeBody = await (async () => {
          if (req.method !== 'POST') return '';
          try {
            const ct = req.headers.get('content-type') || '';
            if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
              const form = await req.formData();
              return String(form.get('code') || '').trim();
            }
            if (ct.includes('application/json')) {
              const j = await req.json();
              return String(j.code || '').trim();
            }
          } catch {}
          return '';
        })();

        // Accept only the admin 6-digit (no guest acceptance)
        const submitted = codeQ || codeBody;
        if (/^\\d{6}$/.test(submitted) && expected && submitted === expected) {
          const headers = new Headers({
            // 1-year remember-me (31536000 seconds)
            'Set-Cookie': `${ADMIN_COOKIE}=ok; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=None`
          });
          url.searchParams.delete('code'); // clean URL
          return new Response(null, {
            status: 303,
            headers: new Headers({ ...Object.fromEntries(headers), Location: url.toString() })
          });
        }
        
        // If this is an AJAX/API request to /api/data/*, return 401 JSON (not HTML)
        if (url.pathname.startsWith('/api/data/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: corsHeaders({ 'content-type': 'application/json' })
          });
        }
                
        // Minimal login page (no external deps)
        const body = `<!doctype html><html lang="en"><head>
          <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
          <title>NaviGen — Admin Access</title>
          <style>
            body{font:16px system-ui;margin:0;background:#f7f7f7;color:#111}
            .card{max-width:420px;margin:14vh auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
            h1{font-size:20px;margin:0 0 12px}.muted{opacity:.75;margin:0 0 16px}
            form{display:flex;gap:8px}input{flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:8px}
            button{padding:10px 14px;border:1px solid #111;border-radius:8px;background:#111;color:#fff;cursor:pointer}
            .small{font-size:13px;opacity:.7;margin-top:12px}
          </style></head><body>
          <div class="card" role="dialog" aria-labelledby="t">
            <h1 id="t">🔒 Admin Access</h1>
            <p class="muted">Enter your 6-digit admin code.</p>
            <form method="POST"><input name="code" inputmode="numeric" pattern="\\\\d{6}" maxlength="6" placeholder="123456" required>
            <button type="submit">Enter</button></form>
            <p class="small">Tip: add <code>?code=123456</code> to your own URL for quicker login.</p>
          </div></body></html
        return new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } });
      }
    }
    
    // -------- End Admin-only Showcase Gate --------

    // Data API: same-origin + admin cookie; tiny JSON; soft 429
        if (url.pathname.startsWith('/api/data/')) {
          const r = rateHit(req);
          const rlHdr = {
            'X-RateLimit-Limit': String(RATE.cap),
            'X-RateLimit-Remaining': String(r.remain),
            'X-RateLimit-Reset': String(Math.ceil(r.resetAt/1000))
          };
          if (!r.ok) {
            return new Response('Too Many Requests', { status: 429, headers: corsHeaders(rlHdr) });
          }

          if (url.pathname === '/api/data/list')    return handleList(req, env, url, corsHeaders(rlHdr));
          if (url.pathname === '/api/data/profile') return handleProfile(req, env, url, corsHeaders(rlHdr));
          if (url.pathname === '/api/data/contact') return handleContact(req, env, url, corsHeaders(rlHdr));
          return new Response('Not Found', { status: 404, headers: corsHeaders() });
        }

    let res = await env.ASSETS.fetch(req);
    res = new Response(res.body, { status: res.status, headers: new Headers(res.headers) });
    res.headers.set('x-ng-worker', 'ok'); // quick check in DevTools

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return res; // only rewrite HTML

    // ---- locale detection (explicit → implicit → fallback)
    const qLang = url.searchParams.get('lang');                  // ?lang=hu
    const pathSeg = url.pathname.split('/').filter(Boolean);
    const pathLang = SUPPORTED.includes(pathSeg[0]) ? pathSeg[0] : null;
    const cookieLang = readCookie(req.headers.get('cookie') || '', 'app_lang');
    const acceptLang = pickFromAcceptLanguage(req.headers.get('accept-language') || '');

    // URL path decides language; root (no prefix) is EN.
    // Do not honor query, cookies, or Accept-Language for <html lang>.
    const locale = pathLang || DEFAULT;

    // ---- build canonical + alternates for the current route
    const { canonical, alternates, xDefault } = buildLocalizedUrls(url, locale);

    // country meta from CF, used by your JS
    const cfCountry = (req.cf && req.cf.country) || 'US';

    // flags to avoid duplicating existing tags
    let hasHreflang = false, hasOgLocale = false, hasCountryMeta = false, hasCanonical = false;

    const rewriter = new HTMLRewriter()
      // <html lang="…">
      .on('html', {
        element(e) {
          e.setAttribute('lang', locale);
        }
      })

      // mark existing tags we might otherwise duplicate
      .on('link[rel="alternate"][hreflang]', { element() { hasHreflang = true; } })
      .on('link[rel="canonical"]', {
        element(e) { hasCanonical = true; e.setAttribute('href', canonical); }
      })
      .on('meta[name="cf-country"]', { element() { hasCountryMeta = true; } })
      .on('meta[property="og:locale"]', {
        element(e) { hasOgLocale = true; e.setAttribute('content', ogFor(locale)); }
      })

      // inject what’s missing near the end of <head>
      .on('head', {
        element(e) {
          if (!hasCountryMeta) {
            e.append(`<meta name="cf-country" content="${cfCountry}">`, { html: true });
          }
          if (!hasCanonical) {
            e.append(`<link rel="canonical" href="${canonical}">`, { html: true });
          }
          if (!hasHreflang) {
            // x-default first (Google recommendation)
            e.append(`<link rel="alternate" hreflang="x-default" href="${xDefault}">`, { html: true });
            for (const [lang, href] of Object.entries(alternates)) {
              e.append(`<link rel="alternate" hreflang="${lang}" href="${href}">`, { html: true });
            }
          }
          if (!hasOgLocale) {
            // primary locale + alternates for OG
            e.append(`<meta property="og:locale" content="${ogFor(locale)}">`, { html: true });
            for (const alt of SUPPORTED.filter(l => l !== locale)) {
              e.append(`<meta property="og:locale:alternate" content="${ogFor(alt)}">`, { html: true });
            }
          }
        }
      });
    const out = await rewriter.transform(res);
    out.headers.set('x-ng-worker', 'ok'); // persists on HTML too
    return out;
  }
};

// -------- Data handlers (tiny payloads; no secrets) --------
async function handleList(req, env, url, extraHdr){
  const q = url.searchParams;
  const limit = Math.min(Math.max(Number(q.get('limit')||20),1),20); // ≤20 per page
  const MAX_PAGES = 5; // ≤~100 items total; humane by design

  // Load canonical dataset (already gated by admin cookie)
  const r = await env.ASSETS.fetch(new Request(new URL('/data/profiles.json', url), { headers: req.headers }));
  if (!r.ok) return new Response('Data load error', { status: 500 });
  const profiles = await r.json();
  let rows = Array.isArray(profiles?.locations) ? profiles.locations : [];

  // Optional filters (context + group/city/postal)
  const ctx=(q.get('context')||'').toLowerCase();
  const group=(q.get('group')||'').toLowerCase();
  const city=(q.get('city')||'').toLowerCase();
  const postal=(q.get('postal')||'').toLowerCase();
  if (ctx)   rows = rows.filter(r=>String(r.context||r.Context||'').toLowerCase().includes(ctx));
  if (group) rows = rows.filter(r=>String(r.groupKey||r.Group||'').toLowerCase().includes(group));
  if (city)  rows = rows.filter(r=>String(r?.contact?.city||'').toLowerCase().includes(city));
  if (postal)rows = rows.filter(r=>String(r?.contact?.postalCode||'').toLowerCase().includes(postal));
  rows = rows.filter(r=>String(r.Visible||r.visible||'Yes').toLowerCase()==='yes');

  const idx = Math.max(Number(q.get('cursor')||0),0);
  const slice = rows.slice(idx, idx+limit);

  // Minimal list fields only
  const items = slice.map(p=>({
    id: p.ID||p.id,
    name: p.name?.en || p.Name || '',
    shortName: p.shortName?.en || p['Short Name'] || '',
    groupKey: p.groupKey||p.Group||'',
    tags: Array.isArray(p.tags)?p.tags:[],
    coord: (typeof p['Coordinate Compound']==='string' && p['Coordinate Compound'].includes(',')) ? p['Coordinate Compound'] : '',
    cover: (p.media && p.media.cover) || (Array.isArray(p.media?.images)&&p.media.images[0]?.src) || ''
  }));

  const nextCursor = (idx+limit<rows.length && (idx/limit+1)<MAX_PAGES) ? (idx+limit) : null;
  return new Response(JSON.stringify({ items, nextCursor, totalApprox: Math.min(rows.length, MAX_PAGES*limit) }),
    { status:200, headers:{ 'content-type':'application/json','Cache-Control':'private, max-age=60', ...extraHdr }});
}

async function handleProfile(req, env, url, extraHdr){
  const id = url.searchParams.get('id')||''; if(!id) return new Response('Bad Request',{status:400});
  const r = await env.ASSETS.fetch(new Request(new URL('/data/profiles.json', url), { headers: req.headers }));
  if (!r.ok) return new Response('Data load error', { status: 500 });
  const profiles = await r.json();
  const p = (Array.isArray(profiles?.locations)?profiles.locations:[]).find(x=>String(x.ID||x.id)===String(id));
  if(!p) return new Response('Not Found',{status:404});
  const payload = {
    id: p.ID||p.id, name: p.name||p.Name||'', shortName: p.shortName||p['Short Name']||'',
    descriptions: p.descriptions||{}, tags: Array.isArray(p.tags)?p.tags:[],
    coord: (typeof p['Coordinate Compound']==='string' && p['Coordinate Compound'].includes(',')) ? p['Coordinate Compound'] : '',
    media: { cover: p.media?.cover||'', images: Array.isArray(p.media?.images)?p.media.images:[] },
    links: p.links||{}
  };
  return new Response(JSON.stringify(payload), { status:200, headers:{ 'content-type':'application/json','Cache-Control':'private, max-age=60', ...extraHdr }});
}

async function handleContact(req, env, url, extraHdr){
  const id=url.searchParams.get('id')||''; const kind=(url.searchParams.get('kind')||'').toLowerCase();
  if(!id || !['phone','email','booking'].includes(kind)) return new Response('Bad Request',{status:400});
  const r = await env.ASSETS.fetch(new Request(new URL('/data/profiles.json', url), { headers: req.headers }));
  if (!r.ok) return new Response('Data load error', { status: 500 });
  const profiles = await r.json();
  const p = (Array.isArray(profiles?.locations)?profiles.locations:[]).find(x=>String(x.ID||x.id)===String(id));
  if(!p) return new Response('Not Found',{status:404});
  const c = p.contact||{};
  if(kind==='booking'){ const link=p?.contact?.bookingUrl||p?.links?.booking||''; return link?Response.redirect(link,302):new Response('No booking',{status:204}); }
  if(kind==='phone'){ const v=c.phone?`tel:${String(c.phone).trim()}`:''; return v?new Response(JSON.stringify({href:v}),{status:200,headers:{'content-type':'application/json',...extraHdr}}):new Response('No phone',{status:204}); }
  if(kind==='email'){ const v=c.email?`mailto:${String(c.email).trim()}`:''; return v?new Response(JSON.stringify({href:v}),{status:200,headers:{'content-type':'application/json',...extraHdr}}):new Response('No email',{status:204}); }
}

/* ---------------- helpers ---------------- */

function readCookie(cookieHeader, name) {
  const m = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/[-[\\]/{}()*+?.\\\\^$|]/g, '\\\\$&') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function pickFromAcceptLanguage(al) {
  // parse "en-GB,en;q=0.9,hu;q=0.8"
  const parts = al.split(',').map(s => {
    const [tag, qStr] = s.trim().split(';q=');
    return { tag: tag.toLowerCase(), q: qStr ? parseFloat(qStr) : 1 };
  }).sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    const primary = tag.split('-')[0];
    if (SUPPORTED.includes(primary)) return primary;
  }
  return null;
}

function ogFor(lang) {
  return OG_MAP[lang] || `${lang}_${lang.toUpperCase()}`;
}

function buildLocalizedUrls(url, locale) {
  const origin = `${url.protocol}//${url.host}`;
  const segs = url.pathname.split('/').filter(Boolean);
  const firstIsLocale = SUPPORTED.includes(segs[0]);

  // compute path for a given target locale
  const pathFor = (target) => {
    const rest = firstIsLocale ? '/' + segs.slice(1).join('/') : url.pathname;
    if (target === DEFAULT) return rest || '/';
    return firstIsLocale ? `/${target}${rest}` : `/${target}${url.pathname}`;
  };

  const canonical = origin + pathFor(locale);
  const xDefault = origin + pathFor(DEFAULT);

  const alternates = {};
  for (const lang of SUPPORTED) {
    alternates[lang] = origin + pathFor(lang);
  }

  return { canonical, alternates, xDefault };
}
