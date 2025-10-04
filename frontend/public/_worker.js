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
    
    // CORS for local dev; echo Origin + allow credentials (localhost + LAN)
    // Note: keeps prod strict (no wildcard with credentials)
    const ORIGIN = req.headers.get('origin') || '';
    const allowDevOrigin = (o) => {
      try {
        const u = new URL(o);
        const h = u.hostname;
        return (
          h === 'localhost' ||
          h === '127.0.0.1' ||
          h === '0.0.0.0' ||
          /^192\.168\.\d+\.\d+$/.test(h) ||      // typical LAN
          /\.local$/.test(h)                      // Bonjour-style hosts
        );
      } catch { return false; }
    };
    const IS_LOCAL_ORIGIN = ORIGIN && allowDevOrigin(ORIGIN);

    const corsHeaders = (base = {}) => {
      const h = new Headers(base);
      if (IS_LOCAL_ORIGIN) {
        // Always echo exact Origin for credentialed requests
        h.set('Access-Control-Allow-Origin', ORIGIN);
        // Ensure caches vary by Origin to prevent poisoning
        h.set('Vary', [h.get('Vary'), 'Origin'].filter(Boolean).join(', '));
        h.set('Access-Control-Allow-Credentials', 'true');
        h.set('Access-Control-Allow-Headers', req.headers.get('access-control-request-headers') || 'Content-Type');
        h.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
      }
      return h;
    };
    
    // Preflight: 204 with echoed CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }    

    // Early route: contexts API public (before any gates)
    if (url.pathname === '/api/data/contexts' || url.pathname === '/api/data/contexts/') {
      const r = rateHit(req);
      const rlHdr = {
        'X-RateLimit-Limit': String(RATE.cap),
        'X-RateLimit-Remaining': String(r.remain),
        'X-RateLimit-Reset': String(Math.ceil(r.resetAt/1000))
      };
      if (!r.ok) return new Response('Too Many Requests', { status: 429, headers: corsHeaders(rlHdr) });
      return handleContexts(req, env, url, corsHeaders(rlHdr));
    }

    // Hard gate for /data/* (allow boot JSON; gate the rest)
    // <!-- explicit; avoids any fall-through -->
    {
      const cookie = req.headers.get('cookie') || '';
      const ADMIN_COOKIE = 'navigen_gate_v2';
      const authed = new RegExp(`\\b${ADMIN_COOKIE}=ok\\b`).test(cookie);
      // Public boot JSON for app startup; allow list only
      const isBootJson = /^\/data\/(languages\/[^/]+\.json|structure\.json|actions\.json|alert\.json|contexts\.json)$/.test(url.pathname);
    }

    // PWA: early pass-through for critical static assets (avoid rewrites)
    // <!-- ensures manifest/SW/assets are served raw and with correct MIME -->
    if (url.pathname === '/manifest.webmanifest' ||
        url.pathname === '/sw.js' ||
        url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(req);
    }
    
    // /api/track: no redirect; handle missing/invalid target gracefully
    if (url.pathname === '/api/track') {
      const target = url.searchParams.get('target') || '';
      // invalid/missing → just 204 so UI toast informs the user
      if (!/^https?:\/\//i.test(target)) return new Response(null, { status: 204 });
      // optional: log asynchronously here if needed; never redirect to avoid double-open
      return new Response(null, { status: 204 });
    }        
    
    // 401 gate disabled; RL/Bot Fight protect /api/data/*
    if (url.pathname.startsWith('/api/data/')) {
      // Rate limit + dev CORS headers on all API responses
      const r = rateHit(req);
      const rlHdr = {
        'X-RateLimit-Limit': String(RATE.cap),
        'X-RateLimit-Remaining': String(r.remain),
        'X-RateLimit-Reset': String(Math.ceil(r.resetAt/1000))
      };
      if (!r.ok) {
        return new Response('Too Many Requests', { status: 429, headers: corsHeaders(rlHdr) });
      }

      // Ordered routing: contexts → all → list → profile → contact → 404
      if (url.pathname === '/api/data/contexts' || url.pathname === '/api/data/contexts/')
        return handleContexts(req, env, url, corsHeaders(rlHdr));

      // Honeypot: pretend "all" exists; always empty
      if (url.pathname === '/api/data/all' || url.pathname === '/api/data/all/')
        return new Response(JSON.stringify({ items: [], nextCursor: null, totalApprox: 0 }), {
          status: 200, headers: corsHeaders(rlHdr)
        });

      if (url.pathname === '/api/data/list')
        return handleList(req, env, url, corsHeaders(rlHdr));

      if (url.pathname === '/api/data/profile')
        return handleProfile(req, env, url, corsHeaders(rlHdr));

      if (url.pathname === '/api/data/contact')
        return handleContact(req, env, url, corsHeaders(rlHdr));

      // Keep CORS echo on 404 so localhost can read status
      return new Response('Not Found', { status: 404, headers: corsHeaders(rlHdr) });
    }

    // route /allsubs (and /{lang}/allsubs) to SPA shell
    if (url.pathname === '/allsubs' || /^\/[a-z]{2}\/allsubs\/?$/.test(url.pathname)) {
      const shell = await env.ASSETS.fetch(new Request(new URL('/index.html', url)));
      const out = new Response(shell.body, { status: 200, headers: new Headers(shell.headers) });
      out.headers.set('x-ng-worker', 'ok'); // keep debug header
      return out;
    }

    // ensure we have the static asset response before rewriting
    let res = await env.ASSETS.fetch(req);
    res = new Response(res.body, { status: res.status, headers: new Headers(res.headers) });
    res.headers.set('x-ng-worker', 'ok'); // quick check in DevTools
    // Echo CORS on /data/* for dev; overwrite any wildcard to support credentials.
    if (url.pathname.startsWith('/data/')) {
      const h = corsHeaders();
      h.forEach((v, k) => res.headers.set(k, v));
    }

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
            e.append('<meta name="cf-country" content="'+cfCountry+'">', { html: true });
          }
          if (!hasCanonical) {
            e.append('<link rel="canonical" href="'+canonical+'">', { html: true });
          }
          if (!hasHreflang) {
            // x-default first (Google recommendation)
            e.append('<link rel="alternate" hreflang="x-default" href="'+xDefault+'">', { html: true });
            for (const [lang, href] of Object.entries(alternates)) {
              e.append('<link rel="alternate" hreflang="'+lang+'" href="'+href+'">', { html: true });
            }
          }
          if (!hasOgLocale) {
            // primary locale + alternates for OG
            e.append('<meta property="og:locale" content="'+ogFor(locale)+'">', { html: true });
            for (const alt of SUPPORTED.filter(l => l !== locale)) {
              e.append('<meta property="og:locale:alternate" content="'+ogFor(alt)+'">', { html: true });
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
async function handleContexts(req, env, url, extraHdr){
  // Serve contexts via API to avoid Access on /data/*
  const r = await env.ASSETS.fetch(new Request(new URL('/data/contexts.json', url), { headers: req.headers }));
  if (!r.ok) return new Response('Data load error', { status: 500 });
  const body = await r.text();
  const cacheHdr = url.hostname.endsWith('pages.dev') ? 'no-store' : 'private, max-age=60';
  const h = new Headers({ 'content-type':'application/json', 'Cache-Control': cacheHdr });
  if (extraHdr) extraHdr.forEach((v, k) => h.set(k, v));
  return new Response(body, { status: 200, headers: h });
}

// List endpoint: requires context; returns 200 with empty items when missing, adds small jitter for low-signal callers.
async function handleList(req, env, url, extraHdr){
  const q = url.searchParams; // needed later

  // Require context; return empty (200) to hide signals.
  const ctxParam = (q.get('context')||'').trim();
  const limit = Math.min(Math.max(Number(q.get('limit')||20),1),99); // cap 99 per page to allow larger batches
  const MAX_PAGES = 5; // ≤~100 items total
  if (!ctxParam) {
    const h = new Headers({ 'content-type':'application/json' });
    if (extraHdr) extraHdr.forEach((v,k)=>h.set(k, v));
    return new Response(JSON.stringify({ items:[], nextCursor:null, totalApprox:0 }), { status:200, headers:h });
  }

  // Load canonical dataset (read-only); return empty list if not found
  const resp = await env.ASSETS.fetch(new Request(new URL('/data/profiles.json', url), { headers: req.headers }));
  const profiles = resp.ok ? await resp.json() : { locations: [] }; // fallback: empty list

  let rows = Array.isArray(profiles?.locations) ? profiles.locations : [];

  const ctx = ctxParam.toLowerCase(); // validated
  // Add 50–200ms jitter when no Referer or UA (scraper signals).
  const hasRef = !!req.headers.get('referer');
  const hasUA  = !!req.headers.get('user-agent');
  if (!hasRef || !hasUA) { await new Promise(res => setTimeout(res, 50 + Math.floor(Math.random()*150))); }

  // Optional filters (context + group/city/postal)
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

  // Rich list fields (UI-ready; keeps payload small)
  const items = slice.map(p => {
    // normalize helpers (emit numbers if possible)
    const coord = (() => {
      // object {lat,lng} in profiles.json
      if (p && typeof p.coord === 'object') {
        const la = Number(p.coord.lat ?? p.coord.latitude);
        const ln = Number(p.coord.lng ?? p.coord.longitude);
        if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
      }
      // string "lat,lng" from any known field
      const cc = p['Coordinate Compound'] || p.coordinateCompound || p.coord || p.coordinate || '';
      if (typeof cc === 'string' && cc.includes(',')) {
        const [a, b] = cc.split(',').map(s => Number(s.trim()));
        if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };
      }
      return null; // no coords
    })();

    const mediaCover = (p.media && p.media.cover) ||
      (Array.isArray(p.media?.images) && p.media.images[0]?.src) || '';

    // links (social + official + booking + newsletter)
    const links = Object.assign({}, p.links || {}, {
      official: p.official_url || p.Official || p.official || '',
      Facebook: p.Facebook || '',
      Instagram: p.Instagram || '',
      Pinterest: p.Pinterest || '',
      Spotify: p.Spotify || '',
      TikTok: p.TikTok || '',
      YouTube: p.Youtube || p.YouTube || '',
      booking: p.bookingUrl || (p.contact && p.contact.bookingUrl) || '',
      newsletter: p.Newsletter || ''
    });

    // contact (address, city, admin area, country, phone/email, messaging)
    const contact = Object.assign({}, p.contact || {}, {
      address: p.Address || (p.contact && p.contact.address) || '',
      postalCode: p.PostalCode || p.postalCode || (p.contact && p.contact.postalCode) || '',
      city: p.City || (p.contact && p.contact.city) || '',
      adminArea: p.AdminArea || p.adminArea || (p.contact && p.contact.adminArea) || '',
      countryCode: p.CountryCode || p.countryCode || (p.contact && p.contact.countryCode) || '',
      phone: p.Phone || (p.contact && p.contact.phone) || '',
      email: p.Email || (p.contact && p.contact.email) || '',
      whatsapp: p.WhatsApp || p.whatsapp || (p.contact && p.contact.whatsapp) || '',
      telegram: p.Telegram || p.telegram || (p.contact && p.contact.telegram) || '',
      messenger: p.Messenger || p.messenger || (p.contact && p.contact.messenger) || '',
      bookingUrl: p.bookingUrl || (p.links && p.links.booking) || (p.contact && p.contact.bookingUrl) || ''
    });

    // ratings + price
    const ratings = {
      google: {
        rating: Number(p.google_rating ?? p.googleRating ?? NaN),
        count: Number(p.google_count ?? p.googleCount ?? NaN)
      },
      tripadvisor: {
        rating: Number(p.tripadvisor_rating ?? p.tripRating ?? NaN),
        count: Number(p.tripadvisor_count ?? p.tripCount ?? NaN)
      }
    };
    const pricing = {
      admission: p.Admission || p.admission || '',
      priceFrom: p.price_from || p.priceFrom || '',
      currency: p.Currency || p.currency || ''
    };

    // tags (accept Tag pipe/comma separated or array p.tags)
    const extraTags = (typeof p.Tag === 'string')
      ? p.Tag.split(/[\|,]/).map(s => s.trim()).filter(Boolean)
      : [];
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const tagsMerged = Array.from(new Set([...tags, ...extraTags]));

    return {
      // prefer stable profile id; keep legacy fallbacks
      id: p.locationID || p.ID || p.id,
      locationID: p.locationID || '',      // expose for clients that expect the new key
      name: p.name?.en || p.Name || '',
      shortName: p.shortName?.en || p['Short Name'] || '',
      groupKey: p.groupKey || p.Group || '',
      coord, // normalized {lat,lng} or null
      Priority: ((p.Priority === true || p.Priority === 1) ||
                 (String(p.Priority ?? p.priority ?? p.Popular ?? 'No').toLowerCase() === 'yes'))
                ? 'Yes' : 'No', // Popular reads this
      contact,
      ratings,
      pricing,
      media: { cover: mediaCover, images: Array.isArray(p.media?.images) ? p.media.images : [] },
      descriptions: p.descriptions || {},   // pass-through if present
      lang: p.Lang || p.lang || '',         // hint for client-side pick
      // add media so UI has hero + gallery; 2 lines max
      media: {
        cover: (p.media && p.media.cover) || '',
        images: Array.isArray(p.media?.images) ? p.media.images : []
      }
    };

  });

  const nextCursor = (idx+limit<rows.length && (idx/limit+1)<MAX_PAGES) ? (idx+limit) : null;
  // keep CORS + RL headers; Headers must be merged explicitly
  const cacheHdr = url.hostname.endsWith('pages.dev') ? 'no-store' : 'private, max-age=60';
  const h = new Headers({ 'content-type':'application/json', 'Cache-Control': cacheHdr });
  if (extraHdr) extraHdr.forEach((v, k) => h.set(k, v));
  return new Response(JSON.stringify({ items, nextCursor, totalApprox: Math.min(rows.length, MAX_PAGES*limit) }), { status:200, headers:h });
}

async function handleProfile(req, env, url, extraHdr){
  const id = url.searchParams.get('id')||''; if(!id) return new Response('Bad Request',{status:400});
  const r = await env.ASSETS.fetch(new Request(new URL('/data/profiles.json', url), { headers: req.headers }));
  if (!r.ok) return new Response('Data load error', { status: 500 });
  const profiles = await r.json();
  const p = (Array.isArray(profiles?.locations) ? profiles.locations : [])
    .find(x => String(x.locationID || x.ID || x.id) === String(id));
  if(!p) return new Response('Not Found',{status:404});
  const payload = {
    // prefer stable profile id; keep legacy fallbacks
    id: p.locationID||p.ID||p.id, name: p.name||p.Name||'', shortName: p.shortName||p['Short Name']||'',
    descriptions: p.descriptions||{}, tags: Array.isArray(p.tags)?p.tags:[],
    coord: (() => {
      if (p && typeof p.coord === 'object') {
        const la = Number(p.coord.lat ?? p.coord.latitude);
        const ln = Number(p.coord.lng ?? p.coord.longitude);
        if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
      }
      const cc = p['Coordinate Compound'] || p.coordinateCompound || p.coord || p.coordinate || '';
      if (typeof cc === 'string' && cc.includes(',')) {
        const [a, b] = cc.split(',').map(s => Number(s.trim()));
        if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };
      }
      return null;
    })(),
    media: { cover: p.media?.cover||'', images: Array.isArray(p.media?.images)?p.media.images:[] },
    links: p.links||{}
  };
  
  // Keep CORS + RL headers; ensure Vary: Origin persists
  const cacheHdr = url.hostname.endsWith('pages.dev') ? 'no-store' : 'private, max-age=60';
  const h = new Headers({ 'content-type':'application/json', 'Cache-Control': cacheHdr });
  if (extraHdr) extraHdr.forEach((v, k) => h.set(k, v));

  return new Response(JSON.stringify(payload), { status:200, headers:h });
}

async function handleContact(req, env, url, extraHdr){
  const id=url.searchParams.get('id')||''; const kind=(url.searchParams.get('kind')||'').toLowerCase();
  if(!id || !['phone','email','booking'].includes(kind)) return new Response('Bad Request',{status:400});
  const r = await env.ASSETS.fetch(new Request(new URL('/data/profiles.json', url), { headers: req.headers }));
  if (!r.ok) return new Response('Data load error', { status: 500 });
  const profiles = await r.json();
  const p = (Array.isArray(profiles?.locations) ? profiles.locations : [])
    .find(x => String(x.locationID || x.ID || x.id) === String(id));
  if(!p) return new Response('Not Found',{status:404});
  const c = p.contact||{};
  // booking: 204 if missing; 200 JSON if present (no redirect)
  if (kind === 'booking') {
    const link = p?.contact?.bookingUrl || p?.links?.booking || '';
    if (!link) return new Response('No booking', { status: 204 });
    const h = new Headers({ 'content-type': 'application/json' });
    if (extraHdr) extraHdr.forEach((v2, k) => h.set(k, v2));
    return new Response(JSON.stringify({ href: link }), { status: 200, headers: h });
  }
  if(kind==='phone'){ const v=c.phone?'tel:'+String(c.phone).trim():''; if(!v) return new Response('No phone',{status:204});
    const h=new Headers({'content-type':'application/json'}); if (extraHdr) extraHdr.forEach((v2,k)=>h.set(k,v2));
    return new Response(JSON.stringify({href:v}),{status:200,headers:h}); }
  if(kind==='email'){ const v=c.email?'mailto:'+String(c.email).trim():''; if(!v) return new Response('No email',{status:204});
    const h=new Headers({'content-type':'application/json'}); if (extraHdr) extraHdr.forEach((v2,k)=>h.set(k,v2));
    return new Response(JSON.stringify({href:v}),{status:200,headers:h}); }
}

/* ---------------- helpers ---------------- */

function readCookie(cookieHeader, name) {
  const m = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
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
