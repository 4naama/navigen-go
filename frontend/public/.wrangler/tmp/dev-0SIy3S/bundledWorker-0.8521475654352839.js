var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../../.wrangler/tmp/pages-47fhXb/bundledWorker-0.8521475654352839.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var SUPPORTED = [
  "en",
  "fr",
  "de",
  "hu",
  "it",
  "he",
  "uk",
  "nl",
  "ro",
  "pl",
  "cs",
  "es",
  "sk",
  "da",
  "sv",
  "nb",
  "sl",
  "ru",
  "pt",
  "is",
  "tr",
  "zh",
  "el",
  "bg",
  "hr",
  "et",
  "fi",
  "lv",
  "lt",
  "mt",
  "hi",
  "ko",
  "ja",
  "ar"
];
var DEFAULT = "en";
var OG_MAP = {
  en: "en_US",
  fr: "fr_FR",
  de: "de_DE",
  hu: "hu_HU",
  it: "it_IT",
  he: "he_IL",
  uk: "uk_UA",
  nl: "nl_NL",
  ro: "ro_RO",
  pl: "pl_PL",
  cs: "cs_CZ",
  es: "es_ES",
  sk: "sk_SK",
  da: "da_DK",
  sv: "sv_SE",
  nb: "nb_NO",
  sl: "sl_SI",
  ru: "ru_RU",
  pt: "pt_PT",
  is: "is_IS",
  tr: "tr_TR",
  // For Chinese you may want to split later: zh_CN (Simplified), zh_TW (Traditional)
  zh: "zh_CN",
  el: "el_GR",
  bg: "bg_BG",
  hr: "hr_HR",
  et: "et_EE",
  fi: "fi_FI",
  lv: "lv_LV",
  lt: "lt_LT",
  mt: "mt_MT",
  hi: "hi_IN",
  ko: "ko_KR",
  ja: "ja_JP",
  ar: "ar_SA"
};
var RATE = { windowMs: 10 * 60 * 1e3, cap: 120, map: /* @__PURE__ */ new Map() };
function rateKey(req) {
  const ip = req.headers.get("cf-connecting-ip") || "0.0.0.0";
  const ua = (req.headers.get("user-agent") || "").slice(0, 64);
  const cookie = req.headers.get("cookie") || "";
  const hasAdmin = /\bnavigen_gate_v2=ok\b/.test(cookie);
  return (hasAdmin ? "C:" : "N:") + ip + "|" + ua;
}
__name(rateKey, "rateKey");
__name2(rateKey, "rateKey");
function rateHit(req) {
  const k = rateKey(req), now = Date.now();
  let e = RATE.map.get(k);
  if (!e || now > e.resetAt) {
    e = { count: 0, resetAt: now + RATE.windowMs };
    RATE.map.set(k, e);
  }
  e.count++;
  return { ok: e.count <= RATE.cap, remain: Math.max(0, RATE.cap - e.count), resetAt: e.resetAt };
}
__name(rateHit, "rateHit");
__name2(rateHit, "rateHit");
var worker_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    const ORIGIN = req.headers.get("origin") || "";
    const allowDevOrigin = /* @__PURE__ */ __name2((o) => {
      try {
        const u = new URL(o);
        const h = u.hostname;
        return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || /^192\.168\.\d+\.\d+$/.test(h) || // typical LAN
        /\.local$/.test(h);
      } catch {
        return false;
      }
    }, "allowDevOrigin");
    const IS_LOCAL_ORIGIN = ORIGIN && allowDevOrigin(ORIGIN);
    const corsHeaders = /* @__PURE__ */ __name2((base = {}) => {
      const h = new Headers(base);
      if (IS_LOCAL_ORIGIN) {
        h.set("Access-Control-Allow-Origin", ORIGIN);
        h.set("Vary", [h.get("Vary"), "Origin"].filter(Boolean).join(", "));
        h.set("Access-Control-Allow-Credentials", "true");
        h.set("Access-Control-Allow-Headers", req.headers.get("access-control-request-headers") || "Content-Type");
        h.set("Access-Control-Allow-Methods", "GET,OPTIONS");
      }
      return h;
    }, "corsHeaders");
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (url.pathname === "/api/data/contexts" || url.pathname === "/api/data/contexts/") {
      const r = rateHit(req);
      const rlHdr = {
        "X-RateLimit-Limit": String(RATE.cap),
        "X-RateLimit-Remaining": String(r.remain),
        "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1e3))
      };
      if (!r.ok) return new Response("Too Many Requests", { status: 429, headers: corsHeaders(rlHdr) });
      return handleContexts(req, env, url, corsHeaders(rlHdr));
    }
    {
      const cookie = req.headers.get("cookie") || "";
      const ADMIN_COOKIE = "navigen_gate_v2";
      const authed = new RegExp(`\\b${ADMIN_COOKIE}=ok\\b`).test(cookie);
      const isBootJson = /^\/data\/(languages\/[^/]+\.json|structure\.json|actions\.json|alert\.json|contexts\.json)$/.test(url.pathname);
    }
    if (url.pathname === "/manifest.webmanifest" || url.pathname === "/sw.js" || url.pathname.startsWith("/assets/")) {
      return env.ASSETS.fetch(req);
    }
    if (url.pathname === "/api/track") {
      const target = url.searchParams.get("target") || "";
      if (!/^https?:\/\//i.test(target)) return new Response(null, { status: 204 });
      return new Response(null, { status: 204 });
    }
    if (url.pathname.startsWith("/api/data/")) {
      const r = rateHit(req);
      const rlHdr = {
        "X-RateLimit-Limit": String(RATE.cap),
        "X-RateLimit-Remaining": String(r.remain),
        "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1e3))
      };
      if (!r.ok) {
        return new Response("Too Many Requests", { status: 429, headers: corsHeaders(rlHdr) });
      }
      if (url.pathname === "/api/data/contexts" || url.pathname === "/api/data/contexts/")
        return handleContexts(req, env, url, corsHeaders(rlHdr));
      if (url.pathname === "/api/data/all" || url.pathname === "/api/data/all/")
        return new Response(JSON.stringify({ items: [], nextCursor: null, totalApprox: 0 }), {
          status: 200,
          headers: corsHeaders(rlHdr)
        });
      if (url.pathname === "/api/data/list")
        return handleList(req, env, url, corsHeaders(rlHdr));
      if (url.pathname === "/api/data/profile")
        return handleProfile(req, env, url, corsHeaders(rlHdr));
      if (url.pathname === "/api/data/contact")
        return handleContact(req, env, url, corsHeaders(rlHdr));
      return new Response("Not Found", { status: 404, headers: corsHeaders(rlHdr) });
    }
    if (url.pathname === "/allsubs" || /^\/[a-z]{2}\/allsubs\/?$/.test(url.pathname)) {
      const shell = await env.ASSETS.fetch(new Request(new URL("/index.html", url)));
      const out2 = new Response(shell.body, { status: 200, headers: new Headers(shell.headers) });
      out2.headers.set("x-ng-worker", "ok");
      return out2;
    }
    let res = await env.ASSETS.fetch(req);
    res = new Response(res.body, { status: res.status, headers: new Headers(res.headers) });
    res.headers.set("x-ng-worker", "ok");
    if (url.pathname.startsWith("/data/")) {
      const h = corsHeaders();
      h.forEach((v, k) => res.headers.set(k, v));
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;
    const qLang = url.searchParams.get("lang");
    const pathSeg = url.pathname.split("/").filter(Boolean);
    const pathLang = SUPPORTED.includes(pathSeg[0]) ? pathSeg[0] : null;
    const cookieLang = readCookie(req.headers.get("cookie") || "", "app_lang");
    const acceptLang = pickFromAcceptLanguage(req.headers.get("accept-language") || "");
    const locale = pathLang || DEFAULT;
    const { canonical, alternates, xDefault } = buildLocalizedUrls(url, locale);
    const cfCountry = req.cf && req.cf.country || "US";
    let hasHreflang = false, hasOgLocale = false, hasCountryMeta = false, hasCanonical = false;
    const rewriter = new HTMLRewriter().on("html", {
      element(e) {
        e.setAttribute("lang", locale);
      }
    }).on('link[rel="alternate"][hreflang]', { element() {
      hasHreflang = true;
    } }).on('link[rel="canonical"]', {
      element(e) {
        hasCanonical = true;
        e.setAttribute("href", canonical);
      }
    }).on('meta[name="cf-country"]', { element() {
      hasCountryMeta = true;
    } }).on('meta[property="og:locale"]', {
      element(e) {
        hasOgLocale = true;
        e.setAttribute("content", ogFor(locale));
      }
    }).on("head", {
      element(e) {
        if (!hasCountryMeta) {
          e.append('<meta name="cf-country" content="' + cfCountry + '">', { html: true });
        }
        if (!hasCanonical) {
          e.append('<link rel="canonical" href="' + canonical + '">', { html: true });
        }
        if (!hasHreflang) {
          e.append('<link rel="alternate" hreflang="x-default" href="' + xDefault + '">', { html: true });
          for (const [lang, href] of Object.entries(alternates)) {
            e.append('<link rel="alternate" hreflang="' + lang + '" href="' + href + '">', { html: true });
          }
        }
        if (!hasOgLocale) {
          e.append('<meta property="og:locale" content="' + ogFor(locale) + '">', { html: true });
          for (const alt of SUPPORTED.filter((l) => l !== locale)) {
            e.append('<meta property="og:locale:alternate" content="' + ogFor(alt) + '">', { html: true });
          }
        }
      }
    });
    const out = await rewriter.transform(res);
    out.headers.set("x-ng-worker", "ok");
    return out;
  }
};
async function handleContexts(req, env, url, extraHdr) {
  const r = await env.ASSETS.fetch(new Request(new URL("/data/contexts.json", url), { headers: req.headers }));
  if (!r.ok) return new Response("Data load error", { status: 500 });
  const body = await r.text();
  const h = new Headers({ "content-type": "application/json", "Cache-Control": "private, max-age=60" });
  if (extraHdr) extraHdr.forEach((v, k) => h.set(k, v));
  return new Response(body, { status: 200, headers: h });
}
__name(handleContexts, "handleContexts");
__name2(handleContexts, "handleContexts");
async function handleList(req, env, url, extraHdr) {
  const q = url.searchParams;
  const ctxParam = (q.get("context") || "").trim();
  const limit = Math.min(Math.max(Number(q.get("limit") || 20), 1), 20);
  const MAX_PAGES = 5;
  if (!ctxParam) {
    const h2 = new Headers({ "content-type": "application/json" });
    if (extraHdr) extraHdr.forEach((v, k) => h2.set(k, v));
    return new Response(JSON.stringify({ items: [], nextCursor: null, totalApprox: 0 }), { status: 200, headers: h2 });
  }
  const resp = await env.ASSETS.fetch(new Request(new URL("/data/profiles.json", url), { headers: req.headers }));
  const profiles = resp.ok ? await resp.json() : { locations: [] };
  let rows = Array.isArray(profiles?.locations) ? profiles.locations : [];
  const ctx = ctxParam.toLowerCase();
  const hasRef = !!req.headers.get("referer");
  const hasUA = !!req.headers.get("user-agent");
  if (!hasRef || !hasUA) {
    await new Promise((res) => setTimeout(res, 50 + Math.floor(Math.random() * 150)));
  }
  const group = (q.get("group") || "").toLowerCase();
  const city = (q.get("city") || "").toLowerCase();
  const postal = (q.get("postal") || "").toLowerCase();
  if (ctx) rows = rows.filter((r) => String(r.context || r.Context || "").toLowerCase().includes(ctx));
  if (group) rows = rows.filter((r) => String(r.groupKey || r.Group || "").toLowerCase().includes(group));
  if (city) rows = rows.filter((r) => String(r?.contact?.city || "").toLowerCase().includes(city));
  if (postal) rows = rows.filter((r) => String(r?.contact?.postalCode || "").toLowerCase().includes(postal));
  rows = rows.filter((r) => String(r.Visible || r.visible || "Yes").toLowerCase() === "yes");
  const idx = Math.max(Number(q.get("cursor") || 0), 0);
  const slice = rows.slice(idx, idx + limit);
  const items = slice.map((p) => {
    const coord = (() => {
      if (p && typeof p.coord === "object") {
        const la = Number(p.coord.lat ?? p.coord.latitude);
        const ln = Number(p.coord.lng ?? p.coord.longitude);
        if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
      }
      const cc = p["Coordinate Compound"] || p.coordinateCompound || p.coord || p.coordinate || "";
      if (typeof cc === "string" && cc.includes(",")) {
        const [a, b] = cc.split(",").map((s) => Number(s.trim()));
        if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };
      }
      return null;
    })();
    const mediaCover = p.media && p.media.cover || Array.isArray(p.media?.images) && p.media.images[0]?.src || "";
    const links = Object.assign({}, p.links || {}, {
      official: p.official_url || p.Official || p.official || "",
      Facebook: p.Facebook || "",
      Instagram: p.Instagram || "",
      Pinterest: p.Pinterest || "",
      Spotify: p.Spotify || "",
      TikTok: p.TikTok || "",
      YouTube: p.Youtube || p.YouTube || "",
      booking: p.bookingUrl || p.contact && p.contact.bookingUrl || "",
      newsletter: p.Newsletter || ""
    });
    const contact = Object.assign({}, p.contact || {}, {
      address: p.Address || p.contact && p.contact.address || "",
      postalCode: p.PostalCode || p.postalCode || p.contact && p.contact.postalCode || "",
      city: p.City || p.contact && p.contact.city || "",
      adminArea: p.AdminArea || p.adminArea || p.contact && p.contact.adminArea || "",
      countryCode: p.CountryCode || p.countryCode || p.contact && p.contact.countryCode || "",
      phone: p.Phone || p.contact && p.contact.phone || "",
      email: p.Email || p.contact && p.contact.email || "",
      whatsapp: p.WhatsApp || p.whatsapp || p.contact && p.contact.whatsapp || "",
      telegram: p.Telegram || p.telegram || p.contact && p.contact.telegram || "",
      messenger: p.Messenger || p.messenger || p.contact && p.contact.messenger || "",
      bookingUrl: p.bookingUrl || p.links && p.links.booking || p.contact && p.contact.bookingUrl || ""
    });
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
      admission: p.Admission || p.admission || "",
      priceFrom: p.price_from || p.priceFrom || "",
      currency: p.Currency || p.currency || ""
    };
    const extraTags = typeof p.Tag === "string" ? p.Tag.split(/[\|,]/).map((s) => s.trim()).filter(Boolean) : [];
    const tags = Array.isArray(p.tags) ? p.tags : [];
    const tagsMerged = Array.from(/* @__PURE__ */ new Set([...tags, ...extraTags]));
    return {
      id: p.ID || p.id,
      name: p.name?.en || p.Name || "",
      shortName: p.shortName?.en || p["Short Name"] || "",
      groupKey: p.groupKey || p.Group || "",
      coord,
      // normalized {lat,lng} or null
      Priority: p.Priority === true || p.Priority === 1 || String(p.Priority ?? p.priority ?? p.Popular ?? "No").toLowerCase() === "yes" ? "Yes" : "No",
      // Popular reads this
      contact,
      ratings,
      pricing,
      descriptions: p.descriptions || {},
      // pass-through if present
      lang: p.Lang || p.lang || ""
      // hint for client-side pick
    };
  });
  const nextCursor = idx + limit < rows.length && idx / limit + 1 < MAX_PAGES ? idx + limit : null;
  const h = new Headers({ "content-type": "application/json", "Cache-Control": "private, max-age=60" });
  if (extraHdr) extraHdr.forEach((v, k) => h.set(k, v));
  return new Response(JSON.stringify({ items, nextCursor, totalApprox: Math.min(rows.length, MAX_PAGES * limit) }), { status: 200, headers: h });
}
__name(handleList, "handleList");
__name2(handleList, "handleList");
async function handleProfile(req, env, url, extraHdr) {
  const id = url.searchParams.get("id") || "";
  if (!id) return new Response("Bad Request", { status: 400 });
  const r = await env.ASSETS.fetch(new Request(new URL("/data/profiles.json", url), { headers: req.headers }));
  if (!r.ok) return new Response("Data load error", { status: 500 });
  const profiles = await r.json();
  const p = (Array.isArray(profiles?.locations) ? profiles.locations : []).find((x) => String(x.ID || x.id) === String(id));
  if (!p) return new Response("Not Found", { status: 404 });
  const payload = {
    id: p.ID || p.id,
    name: p.name || p.Name || "",
    shortName: p.shortName || p["Short Name"] || "",
    descriptions: p.descriptions || {},
    tags: Array.isArray(p.tags) ? p.tags : [],
    coord: (() => {
      if (p && typeof p.coord === "object") {
        const la = Number(p.coord.lat ?? p.coord.latitude);
        const ln = Number(p.coord.lng ?? p.coord.longitude);
        if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
      }
      const cc = p["Coordinate Compound"] || p.coordinateCompound || p.coord || p.coordinate || "";
      if (typeof cc === "string" && cc.includes(",")) {
        const [a, b] = cc.split(",").map((s) => Number(s.trim()));
        if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lng: b };
      }
      return null;
    })(),
    media: { cover: p.media?.cover || "", images: Array.isArray(p.media?.images) ? p.media.images : [] },
    links: p.links || {}
  };
  const h = new Headers({ "content-type": "application/json", "Cache-Control": "private, max-age=60" });
  if (extraHdr) extraHdr.forEach((v, k) => h.set(k, v));
  return new Response(JSON.stringify(payload), { status: 200, headers: h });
}
__name(handleProfile, "handleProfile");
__name2(handleProfile, "handleProfile");
async function handleContact(req, env, url, extraHdr) {
  const id = url.searchParams.get("id") || "";
  const kind = (url.searchParams.get("kind") || "").toLowerCase();
  if (!id || !["phone", "email", "booking"].includes(kind)) return new Response("Bad Request", { status: 400 });
  const r = await env.ASSETS.fetch(new Request(new URL("/data/profiles.json", url), { headers: req.headers }));
  if (!r.ok) return new Response("Data load error", { status: 500 });
  const profiles = await r.json();
  const p = (Array.isArray(profiles?.locations) ? profiles.locations : []).find((x) => String(x.ID || x.id) === String(id));
  if (!p) return new Response("Not Found", { status: 404 });
  const c = p.contact || {};
  if (kind === "booking") {
    const link = p?.contact?.bookingUrl || p?.links?.booking || "";
    if (!link) return new Response("No booking", { status: 204 });
    const h = new Headers({ "content-type": "application/json" });
    if (extraHdr) extraHdr.forEach((v2, k) => h.set(k, v2));
    return new Response(JSON.stringify({ href: link }), { status: 200, headers: h });
  }
  if (kind === "phone") {
    const v = c.phone ? "tel:" + String(c.phone).trim() : "";
    if (!v) return new Response("No phone", { status: 204 });
    const h = new Headers({ "content-type": "application/json" });
    if (extraHdr) extraHdr.forEach((v2, k) => h.set(k, v2));
    return new Response(JSON.stringify({ href: v }), { status: 200, headers: h });
  }
  if (kind === "email") {
    const v = c.email ? "mailto:" + String(c.email).trim() : "";
    if (!v) return new Response("No email", { status: 204 });
    const h = new Headers({ "content-type": "application/json" });
    if (extraHdr) extraHdr.forEach((v2, k) => h.set(k, v2));
    return new Response(JSON.stringify({ href: v }), { status: 200, headers: h });
  }
}
__name(handleContact, "handleContact");
__name2(handleContact, "handleContact");
function readCookie(cookieHeader, name) {
  const m = cookieHeader.match(new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
__name(readCookie, "readCookie");
__name2(readCookie, "readCookie");
function pickFromAcceptLanguage(al) {
  const parts = al.split(",").map((s) => {
    const [tag, qStr] = s.trim().split(";q=");
    return { tag: tag.toLowerCase(), q: qStr ? parseFloat(qStr) : 1 };
  }).sort((a, b) => b.q - a.q);
  for (const { tag } of parts) {
    const primary = tag.split("-")[0];
    if (SUPPORTED.includes(primary)) return primary;
  }
  return null;
}
__name(pickFromAcceptLanguage, "pickFromAcceptLanguage");
__name2(pickFromAcceptLanguage, "pickFromAcceptLanguage");
function ogFor(lang) {
  return OG_MAP[lang] || `${lang}_${lang.toUpperCase()}`;
}
__name(ogFor, "ogFor");
__name2(ogFor, "ogFor");
function buildLocalizedUrls(url, locale) {
  const origin = `${url.protocol}//${url.host}`;
  const segs = url.pathname.split("/").filter(Boolean);
  const firstIsLocale = SUPPORTED.includes(segs[0]);
  const pathFor = /* @__PURE__ */ __name2((target) => {
    const rest = firstIsLocale ? "/" + segs.slice(1).join("/") : url.pathname;
    if (target === DEFAULT) return rest || "/";
    return firstIsLocale ? `/${target}${rest}` : `/${target}${url.pathname}`;
  }, "pathFor");
  const canonical = origin + pathFor(locale);
  const xDefault = origin + pathFor(DEFAULT);
  const alternates = {};
  for (const lang of SUPPORTED) {
    alternates[lang] = origin + pathFor(lang);
  }
  return { canonical, alternates, xDefault };
}
__name(buildLocalizedUrls, "buildLocalizedUrls");
__name2(buildLocalizedUrls, "buildLocalizedUrls");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-iZtP4T/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-iZtP4T/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=bundledWorker-0.8521475654352839.js.map
