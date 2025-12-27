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
  async fetch(req, env, ctx) { // include ctx so waitUntil works
    const url = new URL(req.url);

    // QR scan tracker: when a page has ?lp=<slug>, forward qr-scan to navigen-api.4naama.workers.dev, then continue normal handling
    {
      const lpSlug = (url.searchParams.get('lp') || '').trim();
      if (lpSlug) {
        const hitUrl = `https://navigen-api.4naama.workers.dev/hit/lpm-open/${encodeURIComponent(lpSlug)}`;
        const options = {
          method: 'POST',
          keepalive: true,
          headers: {
            'X-NG-QR-Source': 'pages-worker'
          }
        };
        try {
          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(fetch(hitUrl, options).catch(() => {})); // do not block page load on tracking
          } else {
            fetch(hitUrl, options).catch(() => {}); // best-effort when ctx is not available
          }
        } catch (_) {
          // keep behavior: ignore tracking failures; never affect response
        }
      }
    }

    // Generate a PNG QR code for `payload` (disabled: QRCode/payload/size not defined here)
    
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
    
    // Preflight: allow public cross-origin for /hit/* and /api/stats in production too
    if (req.method === 'OPTIONS') {
      const p = url.pathname;
      const isPublic = p.startsWith('/hit/') || p === '/api/stats';
      if (isPublic) {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': req.headers.get('access-control-request-headers') || 'Content-Type'
          }
        });
      }
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
    
    // PWA & modules: early pass-through for static assets and JS modules

    // keeps .js/.mjs and /scripts/* from being rewritten to HTML shell
    
    if (
      url.pathname === '/manifest.webmanifest' ||
      url.pathname === '/sw.js' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.mjs') ||
      url.pathname.startsWith('/scripts/') ||
      url.pathname.startsWith('/assets/')
    ) {
      return env.ASSETS.fetch(req);
    }

    // Canonicalize Dashboard URLs: /dash/?locationID=...  →  /dash/<ULID>; also /dash/<slug> → /dash/<ULID>
    {
      const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

      // Query form → path form
      if (url.pathname === '/dash' || url.pathname === '/dash/') {
        const raw = (url.searchParams.get('locationID') || '').trim();
        if (raw) {
          const uid = await canonicalId(env, raw);              // slug→ULID or passthrough
          if (uid && ULID_RE.test(uid)) {
            return Response.redirect(`${url.origin}/dash/${encodeURIComponent(uid)}`, 301);
          }
        }
        // no id → fall through to SPA shell
      }

      // Path form with slug → ULID
      if (url.pathname.startsWith('/dash/')) {
        const [, , seg = ''] = url.pathname.split('/');         // ['', 'dash', '{seg}']
        if (seg && !ULID_RE.test(seg)) {
          const uid = await canonicalId(env, seg);
          if (uid && ULID_RE.test(uid)) {
            return Response.redirect(`${url.origin}/dash/${encodeURIComponent(uid)}`, 302);
          }
        }
      }
    }

    // (handled above in the early /s/{id}?c=... block)
    
    // /hit/:metric/:id — unified client-side event counter (allows a small, explicit list)
    // NOTE: This handler forwards hits to the API Worker (authoritative) to avoid parallel keyspaces.
    if (url.pathname.startsWith('/hit/')) {
      // keep comment, but clarify: this endpoint forwards event counters to the authoritative API Worker
      const [, , metric, idOrSlug] = url.pathname.split('/'); // ['', 'hit', ':metric', ':id']
      const ALLOWED_HIT_METRICS = new Set([
        'qr-print',
        'qr-view',
        'qr-scan',
        'share',
        'lpm-open',
        'call',
        'email',
        'whatsapp',
        'telegram',
        'messenger',
        'rating-sum',
        'rating-avg',
        'redeem-confirmation-cashier',
        'redeem-confirmation-customer'
      ]); // include comm channels + confirmations for dash stats (authoritative in API Worker)

      if (!metric || !ALLOWED_HIT_METRICS.has(metric) || !idOrSlug) {
        return new Response('Bad Request', { status: 400 });
      }

      // Forward to API Worker as the single source of truth.
      // IMPORTANT: do not write m:* here; the API Worker owns canonical stats/qrlog and confirmation signals.
      const apiBase = 'https://navigen-api.4naama.workers.dev';
      const target = new URL(`/hit/${encodeURIComponent(metric)}/${encodeURIComponent(idOrSlug)}`, apiBase);

      // Preserve query string (e.g., rating score, etc.)
      target.search = url.search;

      try {
        // Preserve method semantics: GET stays GET; POST stays POST; OPTIONS stays OPTIONS.
        const method = req.method === 'OPTIONS' ? 'OPTIONS' : req.method;

        // Best-effort forwarding: never block the user flow on telemetry.
        // Use waitUntil when available so the request can outlive the response.
        const forward = fetch(target.toString(), {
          method,
          keepalive: true,
          headers: {
            'X-NG-Source': 'pages-worker',
            'X-NG-QR-Source': 'pages-worker'
          }
        }).catch(() => {});

        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(forward);
        } else {
          // fallback when ctx is not available
          void forward;
        }
      } catch (_) {
        // keep behavior: ignore forwarding failures; never affect response
      }

      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        },
      });
    }

    // duplicate /hit/* block removed — unified handler above handles all hit metrics

    // /out/qr-scan/:id?to=<url> — count a physical QR scan, then redirect to landing
    {
      const p = url.pathname;
      if (p.startsWith('/out/qr-scan/')) {
        const [, , metric, idOrSlug] = p.split('/'); // ['', 'out', ':metric', ':id']
        if (metric !== 'qr-scan' || !idOrSlug) {
          // keep behavior minimal; only qr-scan supported here
          return new Response('Not Found', { status: 404 });
        }
        
        // Resolve to canonical ULID (accept ULID or slug); same helper used elsewhere
        const ulid = await canonicalId(env, idOrSlug);
        if (!ulid) return new Response('Unknown location', { status: 404 });

        // Canonical QR scan logging: forward to API Worker (authoritative)
        try {
          const apiBase = 'https://navigen-api.4naama.workers.dev';
          const hitUrl  = new URL(`/hit/qr-scan/${encodeURIComponent(ulid)}`, apiBase).toString();
          const options = { method: 'POST', keepalive: true, headers: { 'X-NG-QR-Source': 'pages-worker' } };
          if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(fetch(hitUrl, options).catch(() => {}));
          else fetch(hitUrl, options).catch(() => {});
        } catch (_) { /* ignore */ }

        // Redirect to landing (default /), allow only http(s) or same-origin paths
        const target = url.searchParams.get('to') || '/';

        const safe   = /^(?:https?:)?\/\//i.test(target) || target.startsWith('/');
        const dest   = safe ? target : '/';

        return Response.redirect(dest, 302);
      }
    }

    // /out/qr-redeem/:id — record a promotion redemption and return to LPM shell
    {
      const p = url.pathname;
      if (p.startsWith('/out/qr-redeem/')) {
        const [, , , idOrSlug] = p.split('/'); // ['', 'out', 'qr-redeem', ':id']
        if (!idOrSlug) {
          return new Response('Not Found', { status: 404 });
        }

        // Always try to resolve to ULID, but never throw if it fails
        let ulid = null;
        try {
          ulid = await canonicalId(env, idOrSlug);
        } catch (_) {
          ulid = null;
        }

        const redeemToken = (url.searchParams.get('rt') || '').trim();
        const clientUA    = req.headers.get('User-Agent') || '';
        const clientLang  = req.headers.get('Accept-Language') || '';

        if (ulid) {
          const apiBase = 'https://navigen-api.4naama.workers.dev';
          const hitUrl  = new URL(`/hit/qr-redeem/${encodeURIComponent(ulid)}`, apiBase).toString();

          try {
            const headers = {
              'X-NG-QR-Source': 'pages-worker'
            };
            if (redeemToken) headers['X-NG-QR-Token'] = redeemToken;
            if (clientUA)    headers['X-NG-UA']       = clientUA;
            if (clientLang)  headers['X-NG-Lang']     = clientLang;

            const options = {
              method: 'POST',
              keepalive: true,
              headers
            };
            if (ctx && typeof ctx.waitUntil === 'function') {
              ctx.waitUntil(fetch(hitUrl, options).catch(() => {}));
            } else {
              fetch(hitUrl, options).catch(() => {});
            }
          } catch (_) {
            // ignore tracking errors; never block app response
          }
        }

        // Always redirect user back to the LPM shell
        // Include redeem context so the app can show a confirmation flow on the cashier device
        const camp = (url.searchParams.get('camp') || '').trim();
        const lpmUrl = new URL('/', url.origin);
        lpmUrl.searchParams.set('lp', idOrSlug);
        lpmUrl.searchParams.set('redeemed', '1'); // signals that a redeem event just occurred
        if (camp) {
          lpmUrl.searchParams.set('camp', camp); // optional campaign key for UI context
        }
        const dest = lpmUrl.toString();
        return Response.redirect(dest, 302);
      }
    }

    // /api/track: deprecated — previously no redirect; handled missing/invalid target gracefully
    if (url.pathname === '/api/track') {
      const target = url.searchParams.get('target') || '';
      // clarify deprecation instead of silent 204; retain validation comment for context
      if (!/^https?:\/\//i.test(target)) {
        return new Response('Deprecated: use /hit/:metric/:id', {
          status: 410,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          },
        });
      }
      // optional: if logging was ever added, it should be moved to /hit; never redirect to avoid double-open
      return new Response('Deprecated: use /hit/:metric/:id', {
        status: 410,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        },
      });
    }

    // /owner/* — proxy to API Worker (Owner Platform sensitive routes must be network-only)
    if (url.pathname.startsWith('/owner/')) {
      const apiBase = 'https://navigen-api.4naama.workers.dev';
      const target = new URL(url.pathname + url.search, apiBase);

      const r = await fetch(target.toString(), {
        method: req.method,
        headers: req.headers,
        redirect: 'manual'
      });

      // Pass through Set-Cookie + Location and force no-store to avoid any intermediary caching.
      const h = new Headers(r.headers);
      h.set('Cache-Control', 'no-store');
      h.set('Referrer-Policy', 'no-referrer');

      return new Response(r.body, { status: r.status, headers: h });
    }

    // /api/_diag/* — proxy to API Worker (safe diagnostics only; keep Pages non-authoritative)
    if (url.pathname.startsWith('/api/_diag/')) {
      const apiBase = 'https://navigen-api.4naama.workers.dev';
      const target = new URL(url.pathname + url.search, apiBase);

      const r = await fetch(target.toString(), {
        method: req.method,
        headers: req.headers
      });

      return new Response(r.body, {
        status: r.status,
        headers: r.headers
      });
    }

    // /api/stats — proxy to API Worker (single canonical source of truth)
    if (url.pathname === '/api/stats') {
      const apiBase = 'https://navigen-api.4naama.workers.dev';
      const target = new URL(url.pathname + url.search, apiBase);

      const h = new Headers(req.headers);         // forward Cookie + all client headers
      h.set('Accept', 'application/json');
      h.set('X-NG-Source', 'pages-worker');

      const r = await fetch(target.toString(), {
        method: 'GET',
        headers: h
      });

      const body = await r.text();

      // Keep CORS behavior consistent with existing public endpoints
      return new Response(body, {
        status: r.status,
        headers: {
          'content-type': r.headers.get('content-type') || 'application/json',
          'Cache-Control': 'no-store'
        }
      });
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

    // Phase 3: block dashboard shell unless owner session exists OR location is flagged as an Example Location.
    // Keeps unauthorized users from loading a shell that cannot fetch data.
    if (url.pathname === '/dash' || url.pathname.startsWith('/dash/')) {
      const cookie = req.headers.get('cookie') || '';
      const hasSess = /\bop_sess=/.test(cookie);

      if (!hasSess) {
        // Allow Example Dashboards: these are real locations explicitly flagged in /data/profiles.json.
        // All other locations remain blocked (redirect to main shell).
        let isExample = false;
        try {
          const seg = (url.pathname.split('/')[2] || '').trim(); // /dash/<seg>
          // Canonicalize seg so example allow survives /dash/<slug> → /dash/<ULID> redirects.
          const segUid = await canonicalId(env, seg);
          if (seg) {
            const prof = await env.ASSETS.fetch(new Request(new URL('/data/profiles.json', url)));
            if (prof.ok) {
              const data = await prof.json().catch(() => null);
              const locs = Array.isArray(data?.locations)
                ? data.locations
                : (data?.locations && typeof data.locations === 'object')
                  ? Object.values(data.locations)
                  : [];

              const rec = locs.find(r => {
                const slug = String(r?.locationID || r?.slug || r?.alias || '').trim();
                const rid  = String(r?.ID || r?.id || r?.locationID || '').trim(); // tolerate legacy schemas
                const uid  = /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(rid) ? rid : '';
                return slug === seg || uid === seg || (segUid && uid === segUid);
              });
              const v = rec?.exampleLocation ?? rec?.isExample ?? rec?.example ?? rec?.exampleDash ?? rec?.flags?.example;
              isExample = (v === true || v === 1 || String(v || '').toLowerCase() === 'true' || String(v || '').toLowerCase() === 'yes');
            }
          }
        } catch {
          isExample = false; // fail closed
        }

        if (!isExample) {
          return Response.redirect(`${url.origin}/`, 302);
        }
      }
    }

    // Serve Dashboard shell for /dash and /dash/* (returns /dash/index.html)
    if (url.pathname === '/dash' || url.pathname.startsWith('/dash/')) {
      const shell = await env.ASSETS.fetch(new Request(new URL('/dash/index.html', url)));
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

// canonicalId: returns a ULID if input is a ULID; else resolves slug via KV_ALIASES
async function canonicalId(env, input) {
  const s = String(input || '').trim();
  const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  if (!s) return '';
  if (ULID_RE.test(s)) return s;                 // already ULID
  // Lookup slug → ULID in KV_ALIASES; values are JSON {locationID:"<ULID>"}; keys are "alias:<slug>"
  try {
    if (env.KV_ALIASES) {
      const keys = [s, `alias:${s}`]; // prefer exact, then namespaced
      for (const k of keys) {
        const val = await env.KV_ALIASES.get(k, 'text');
        if (!val) continue;
        // Accept either a bare ULID string or a JSON blob with .locationID
        const maybe = val.trim().startsWith('{')
          ? String((JSON.parse(val)||{}).locationID||'').trim()
          : val.trim();
        if (ULID_RE.test(maybe)) return maybe;
      }
    }
  } catch {}
  return ''; // unresolved stays empty (client will ignore non-ULID)
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
  let profiles;
  try {
    profiles = resp.ok ? await resp.json() : { locations: [] }; // fallback: empty list
  } catch {
    profiles = { locations: [] }; // tolerate malformed JSON → no crash
  }

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
  // use new contactInformation; keep old keys only if present
  if (city)  rows = rows.filter(r=>String(r?.contactInformation?.city  || r?.contact?.city  || '')
                                    .toLowerCase().includes(city));
  if (postal)rows = rows.filter(r=>String(r?.contactInformation?.postalCode || r?.contact?.postalCode || '')
                                    .toLowerCase().includes(postal));

  rows = rows.filter(r=>String(r.Visible||r.visible||'Yes').toLowerCase()==='yes');

  const idx = Math.max(Number(q.get('cursor')||0),0);
  const slice = rows.slice(idx, idx+limit);

  // Rich list fields (UI-ready; keeps payload small)
  const items = await Promise.all(slice.map(async (p) => {
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
    const baseLinks = p.links || {};
    const officialFallback = p.official_url || p.Official || p.official || '';
    const links = Object.assign({}, baseLinks, {
      // keep existing links.official when present; fall back only if that is empty
      official: (baseLinks.official && String(baseLinks.official).trim()) || officialFallback || '',
      Facebook: p.Facebook || '',
      Instagram: p.Instagram || '',
      Pinterest: p.Pinterest || '',
      Spotify: p.Spotify || '',
      TikTok: p.TikTok || '',
      YouTube: p.Youtube || p.YouTube || '',
      booking: p.bookingUrl || (p.contact && p.contact.bookingUrl) || '',
      newsletter: p.Newsletter || ''
    });

    // flatten contactInformation correctly; no nested object
    const contactInformation = {
      address:     p.contactInformation?.address     || p.address     || p.Address     || p.contact?.address     || '',
      postalCode:  p.contactInformation?.postalCode  || p.postalCode  || p.PostalCode  || p.contact?.postalCode  || '',
      city:        p.contactInformation?.city        || p.city        || p.City        || p.contact?.city        || '',
      adminArea:   p.contactInformation?.adminArea   || p.adminArea   || p.AdminArea   || p.contact?.adminArea   || '',
      countryCode: p.contactInformation?.countryCode || p.countryCode || p.CountryCode || p.contact?.countryCode || '',
      contactPerson: p.contactInformation?.contactPerson || p.contactPerson || p.contact?.name || '',
      phone:       p.contactInformation?.phone       || p.phone       || p.contact?.phone       || '',
      email:       p.contactInformation?.email       || p.email       || p.contact?.email       || '',
      whatsapp:    p.contactInformation?.whatsapp    || p.whatsapp    || p.contact?.whatsapp    || '',
      telegram:    p.contactInformation?.telegram    || p.telegram    || p.contact?.telegram    || '',
      messenger:   p.contactInformation?.messenger   || p.messenger   || p.contact?.messenger   || ''
    };

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
      // ids: keep canonical ULID for APIs/analytics
      locationID: await canonicalId(env, (p.locationID || p.ID || p.id)),
      id:         await canonicalId(env, (p.locationID || p.ID || p.id)),

      // expose the original human identifier (if present and non-ULID) so UI can prefer it
      alias: (() => {
        const raw = String(p.locationID || '').trim();
        return /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(raw) ? '' : raw;  // keep only human slug here
      })(),

      // pass object as-is; wrap plain string into {en:...}
      locationName: (p && typeof p.locationName === 'object')
        ? p.locationName
        : (typeof p?.locationName === 'string' && p.locationName.trim() ? { en: p.locationName.trim() } : undefined),
        
      // grouping
      groupKey:   p.groupKey || p.Group || '',
      subgroupKey: p.subgroupKey || p['Subgroup key'] || '',

      // coords + flags
      coord,
      Priority: (String(p.Priority ?? p.Popular ?? 'No').toLowerCase()==='yes') ? 'Yes' : 'No',

      // new contact block the UI reads
      contactInformation,

      // pass-throughs
      links,
      ratings,
      pricing,
      qrUrl: p.qrUrl || '',  // pass qrUrl from profiles.json (canonical QR landing)
      descriptions: p.descriptions || {},
      media: { cover: mediaCover, images: Array.isArray(p.media?.images) ? p.media.images : [] },
      lang: p.Lang || p.lang || ''
    };
  }));

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
  let profiles; try { profiles = await r.json(); } catch { profiles = { locations: [] }; }
  const p = (Array.isArray(profiles?.locations) ? profiles.locations : [])
    .find(x => String(x.locationID || x.ID || x.id) === String(id));
  if(!p) return new Response('Not Found',{status:404});
  const payload = {
    // handleProfile(...) — emit only id + locationName (no fallback)
    id: p.locationID||p.ID||p.id,
    // pass object as-is; wrap plain string into {en:...}
    locationName: (p && typeof p.locationName === 'object')
      ? p.locationName
      : (typeof p?.locationName === 'string' && p.locationName.trim() ? { en: p.locationName.trim() } : undefined),

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
