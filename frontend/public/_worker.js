// _worker.js — Cloudflare Pages: i18n + SEO rewrites at the edge.
// - Sets <html lang="…">
// - Adds <link rel="alternate" hreflang="…"> (+ x-default)
// - Sets Open Graph locale tags
// - Injects <meta name="cf-country"> (you already read this in app.js)

const SUPPORTED = ['en', 'hu'];          // add more when ready: e.g. ['en','hu','de']
const DEFAULT   = 'en';
const OG_MAP    = { en: 'en_US', hu: 'hu_HU' }; // extend as you add locales

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const res = await env.ASSETS.fetch(req);

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

    return rewriter.transform(res);
  }
};

/* ---------------- helpers ---------------- */

function readCookie(cookieHeader, name) {
  const m = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') + '=([^;]*)'));
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
