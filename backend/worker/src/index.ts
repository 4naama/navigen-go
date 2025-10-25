// src/index.ts
// ES module Worker: QR (/s/*, /api/qr), Analytics (/api/track), Status (/api/status)

import QRCode from "qrcode";

// Fixed event order used by API + UI
const EVENT_ORDER = [
  "lpm-open","call","email","whatsapp","telegram","messenger",
  "official","booking","newsletter",
  "facebook","instagram","pinterest","spotify","tiktok","youtube",
  "share","save","unsave","map","qr-scan","qr-view"
] as const; // add qr-scan; keep qr-view for image/modal-only

type EventKey = typeof EVENT_ORDER[number];

// tz: payload.tz → country → fallback Berlin → UTC
const TZ_FALLBACK = "Europe/Berlin";
const TZ_BY_COUNTRY: Record<string,string> = {
  HU:"Europe/Budapest", DE:"Europe/Berlin", AT:"Europe/Vienna", CH:"Europe/Zurich",
  GB:"Europe/London",  IE:"Europe/Dublin",  // extend as needed
};
function dayKeyFor(dateUTC: Date, tz?: string, countryCode?: string) {
  const pick = tz || (countryCode && TZ_BY_COUNTRY[countryCode.toUpperCase()]) || TZ_FALLBACK;
  try { return new Intl.DateTimeFormat('en-CA',{ timeZone: pick, year:'numeric',month:'2-digit',day:'2-digit'}).format(dateUTC); }
  catch { return dateUTC.toISOString().slice(0,10); } // UTC fallback
}
async function kvIncr(kv: KVNamespace, key: string) {
  const cur = parseInt((await kv.get(key))||"0",10) || 0;
  await kv.put(key, String(cur+1), { expirationTtl: 60*60*24*366 });
}

export interface Env {
  KV_STATUS: KVNamespace;
  KV_ALIASES: KVNamespace;
  KV_OVERRIDES: KVNamespace;
  KV_STATS: KVNamespace;
  JWT_SECRET: string; // set via wrangler secret
  // STRIPE_SECRET_KEY?: string;
  // STRIPE_WEBHOOK_SECRET?: string;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    // normalize once: collapse repeats; strip one trailing slash (not root)
    const pathname = url.pathname;
    const normPath = pathname.replace(/\/{2,}/g, "/").replace(/(.+)\/$/, "$1");

    // --- CORS preflight: allow credentialed requests from allowed web origins
    // GLOBAL CORS PREFLIGHT — must run before all routing
    if (req.method === "OPTIONS") {
      const origin  = req.headers.get("Origin") || "";
      const reqHdrs = req.headers.get("Access-Control-Request-Headers") || "";
      const allow = new Set(["https://navigen.io","https://navigen-go.pages.dev"]);
      const allowOrigin = allow.has(origin) ? origin : "https://navigen.io";

      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Credentials": "true", // REQUIRED for credentials
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": reqHdrs || "content-type, authorization, cache-control, pragma",
          "Access-Control-Max-Age": "600",
          "Vary": "Origin"
        }
      });
    }

    try {
      // --- QR short link: /s/{locationID}?c=....
      if (pathname.startsWith("/s/")) {
        return await handleShortLink(req, env);
      }

      // --- QR image: /api/qr?locationID=...&c=...&fmt=svg|png&size=512
      if (pathname === "/api/qr") {
        return await handleQr(req, env);
      }

    // --- Admin purge (one-off): POST /api/admin/purge-legacy
    // Merges stats:<loc>:<day>:<event_with_underscores> → hyphen, or burns legacy keys entirely.
    if (pathname === "/api/admin/purge-legacy" && req.method === "POST") {
      const auth = req.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) {
        return json({ error:{ code:"unauthorized", message:"Bearer token required" } }, 401);
      }
      const token = auth.slice(7).trim();
      if (!token || token !== env.JWT_SECRET) {
        return json({ error:{ code:"forbidden", message:"Bad token" } }, 403);
      }

      const body = await req.json().catch(() => ({}));
      const mode = (body?.mode || "merge").toString(); // 'merge' or 'burn'

      let cursor: string|undefined = undefined;
      let migrated = 0, removed = 0;

      do {
        const page = await env.KV_STATS.list({ prefix: "stats:", cursor });
        for (const k of page.keys) {
          // keys look like: stats:<loc>:YYYY-MM-DD:<event>
          const name = k.name;
          const parts = name.split(":");
          if (parts.length !== 4) continue;

          const ev = parts[3];
          if (!ev.includes("_")) continue; // only legacy

          if (mode === "merge") {
            const n = parseInt((await env.KV_STATS.get(name)) || "0", 10) || 0;
            if (!n) { await env.KV_STATS.delete(name); removed++; continue; } // drop empty
            const hyphen = ev.replaceAll("_","-");
            const target = `stats:${parts[1]}:${parts[2]}:${hyphen}`;
            const cur = parseInt((await env.KV_STATS.get(target)) || "0", 10) || 0;
            await env.KV_STATS.put(target, String(cur + n), { expirationTtl: 60*60*24*366 });
            migrated++;
          }
          // 'burn' deletes legacy without merging
          await env.KV_STATS.delete(name);
          removed++;
        }
        cursor = page.cursor || undefined;
      } while (cursor);

      return json({ ok:true, mode, migrated, removed }, 200);
      }

      // --- Admin backfill: POST /api/admin/backfill-slug-stats
      // Moves stats:<slug>:YYYY-MM-DD:<event> → stats:<ULID>:YYYY-MM-DD:<event> using KV_ALIASES.
      if (pathname === "/api/admin/backfill-slug-stats" && req.method === "POST") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error:{ code:"unauthorized", message:"Bearer token required" } }, 401);
        }
        const token = auth.slice(7).trim();
        if (!token || token !== env.JWT_SECRET) {
          return json({ error:{ code:"forbidden", message:"Bad token" } }, 403);
        }

        let cursor: string|undefined = undefined;
        let moved = 0, removed = 0, skipped = 0;

        do {
          const page = await env.KV_STATS.list({ prefix: "stats:", cursor });
          for (const k of page.keys) {
            // shape: stats:<id>:YYYY-MM-DD:<event>
            const parts = k.name.split(":");
            if (parts.length !== 4) continue;

            const id = parts[1];
            const day = parts[2];
            const ev  = parts[3];

            // skip if already ULID
            if (/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) { skipped++; continue; }

            // try alias → ULID
            const mapped = await env.KV_ALIASES.get(aliasKey(id), "json");
            const ulid = (typeof mapped === "string" ? mapped : mapped?.locationID) || "";
            if (!ulid || !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(ulid)) { skipped++; continue; }

            const srcVal = parseInt((await env.KV_STATS.get(k.name)) || "0", 10) || 0;
            if (!srcVal) { await env.KV_STATS.delete(k.name); removed++; continue; }

            const dstKey = `stats:${ulid}:${day}:${ev.replaceAll("_","-")}`; // normalize event
            const cur = parseInt((await env.KV_STATS.get(dstKey)) || "0", 10) || 0;
            await env.KV_STATS.put(dstKey, String(cur + srcVal), { expirationTtl: 60*60*24*366 });
            await env.KV_STATS.delete(k.name);
            moved++;
          }
          cursor = page.cursor || undefined;
        } while (cursor);

        return json({ ok:true, moved, removed, skipped }, 200);
      }
                
      // GET /api/stats?locationID=.&from=YYYY-MM-DD&to=YYYY-MM-DD[&tz=Europe/Berlin]

      if (url.pathname === "/api/stats" && req.method === "GET") {
        const locRaw = (url.searchParams.get("locationID")||"").trim(); // accept alias or ULID
        const loc    = (await resolveUid(locRaw, env)) || locRaw; // prefer canonical ULID for reads
        const from = (url.searchParams.get("from")||"").trim();
        const to   = (url.searchParams.get("to")  ||"").trim();
        const tz   = (url.searchParams.get("tz")  ||"").trim() || undefined;
        if (!loc || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          return json({ error:{code:"invalid_request", message:"locationID, from, to required (YYYY-MM-DD)"} }, 400);
        }

        // list all keys for this location; keys look like stats:<loc>:YYYY-MM-DD:<event>
        const prefix = `stats:${loc}:`;
        const days: Record<string, Partial<Record<EventKey, number>>> = {};
        let cursor: string|undefined = undefined;

        do {
          const page = await env.KV_STATS.list({ prefix, cursor });
          for (const k of page.keys) {
            const name = k.name; // stats:<loc>:<day>:<event>
            const parts = name.split(":");
            if (parts.length !== 4) continue;
            const day = parts[2];
            const ev = (parts[3] as string).replaceAll("_", "-") as EventKey;
            if (day < from || day > to) continue;
            const n = parseInt((await env.KV_STATS.get(name))||"0",10) || 0; // safe read
            if (!days[day]) days[day] = {};
            days[day][ev] = (days[day][ev] || 0) + n;
          }
          cursor = page.cursor || undefined;
        } while (cursor);

        const siteOrigin = req.headers.get("Origin") || "https://navigen.io"; // use caller's origin for profiles.json
        return json({ locationID: loc, locationName: await nameForLocation(loc, siteOrigin), from, to, tz: tz || TZ_FALLBACK, order: EVENT_ORDER, days }, 200);
      }            

      // GET /api/stats/entity?entityID=...&from=YYYY-MM-DD&to=YYYY-MM-DD[&tz=Europe/Berlin]
      if (url.pathname === "/api/stats/entity" && req.method === "GET") {
        const ent  = (url.searchParams.get("entityID")||"").trim();
        const from = (url.searchParams.get("from")||"").trim();
        const to   = (url.searchParams.get("to")  ||"").trim();
        const tz   = (url.searchParams.get("tz")  ||"").trim() || undefined;
        if (!ent || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          return json({ error:{code:"invalid_request", message:"entityID, from, to required (YYYY-MM-DD)"} }, 400);
        }

        // Resolve the entity's locations. To start, read a KV list (write it when you approve the entity).
        // Format: KV key entity:<entityID>:locations => JSON array of locationIDs
        const raw = await env.KV_STATUS.get(`entity:${ent}:locations`);
        const locs: string[] = raw ? JSON.parse(raw) : [];
        const days: Record<string, Partial<Record<EventKey, number>>> = {};

        for (const loc of locs) {
          const prefix = `stats:${loc}:`;
          let cursor: string|undefined = undefined;
          do {
            const page = await env.KV_STATS.list({ prefix, cursor });
            for (const k of page.keys) {
              const parts = k.name.split(":");
              if (parts.length !== 4) continue;
              const day = parts[2];
              const ev = (parts[3] as string).replaceAll("_", "-") as EventKey;
              if (day < from || day > to) continue;
              const n = parseInt((await env.KV_STATS.get(k.name))||"0",10) || 0;
              if (!days[day]) days[day] = {};
              days[day][ev] = (days[day][ev] || 0) + n; // keep additive; now normalized
            }
            cursor = page.cursor || undefined;
          } while (cursor);
        }

        return json({ entityID: ent, entityName: await nameForEntity(ent), from, to, tz: tz || TZ_FALLBACK, order: EVENT_ORDER, days }, 200);
      }

      // --- Analytics track: POST /api/track
      if (pathname === "/api/track" && req.method === "POST") {
        return await handleTrack(req, env);
      }

      // --- Status: GET /api/status?locationID=...
      if (pathname === "/api/status" && req.method === "GET") {
        return await handleStatus(req, env);
      }

      // --- Outbound tracked redirect: /out/{event}/{id}?to=<url>
      if (pathname.startsWith("/out/") && req.method === "GET") {
        const parts = pathname.split("/").filter(Boolean); // ['out','event','id']
        const ev = (parts[1] || "").toLowerCase().replaceAll("_","-");
        const idRaw = parts[2] || "";
        const to = (new URL(req.url)).searchParams.get("to") || "";

        const allowed = new Set<string>(EVENT_ORDER as readonly string[]);
        if (!allowed.has(ev)) {
          return json({ error:{ code:"invalid_request", message:"unsupported event" } }, 400);
        }

        const loc = await resolveUid(idRaw, env);
        if (!loc) {
          return json({ error:{ code:"invalid_request", message:"bad id" } }, 400);
        }

        // basic redirect safety: https only
        if (!/^https:\/\/[^ ]+/i.test(to)) {
          return json({ error:{ code:"invalid_request", message:"https to= required" } }, 400);
        }

        // lightweight human-navigation guard (skip obvious bots/previews)
        const method = req.method || "GET";
        const sfm = req.headers.get("Sec-Fetch-Mode") || "";
        const ua = req.headers.get("User-Agent") || "";
        const isHumanNav =
          method === "GET" &&
          (!sfm || /navigate|same-origin/i.test(sfm)) &&
          !/(bot|crawler|spider|facebookexternalhit|twitterbot|slackbot)/i.test(ua);

        if (isHumanNav) {
          try {
            const now = new Date();
            const country = (req as any).cf?.country || "";
            const day = dayKeyFor(now, undefined, country);
            await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);
          } catch {}
        }

        return new Response(null, {
          status: 302,
          headers: {
            "Location": to,
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin"
          }
        });
      }
      
      // --- Non-redirect hit: POST /hit/{event}/{id}
      if (pathname.startsWith("/hit/") && req.method === "POST") {
        const parts = pathname.split("/").filter(Boolean); // ['hit','event','id']
        const ev = (parts[1] || "").toLowerCase().replaceAll("_","-");
        const idRaw = parts[2] || "";
        const allowed = new Set<string>(EVENT_ORDER as readonly string[]);
        if (!allowed.has(ev)) return json({ error:{ code:"invalid_request", message:"unsupported event" } }, 400);

        const loc = await resolveUid(idRaw, env); if (!loc) return json({ error:{ code:"invalid_request", message:"bad id" } }, 400);

        const now = new Date(); const country = (req as any).cf?.country || "";
        const day = dayKeyFor(now, undefined, country);
        await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);

        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin"
          }
        });
      }            

      // (Stubs for later)
      // if (pathname === "/api/checkout") { ... }
      // if (pathname === "/api/webhook")  { ... }
      // if (pathname === "/m/edit")       { ... }
      // if (pathname === "/api/location/update") { ... }

      // use normPath declared earlier; do not redeclare here

      // GET /api/data/list?context=...&limit=...
      if (normPath === "/api/data/list" && req.method === "GET") {
        const target = new URL("https://navigen.io/api/data/list"); // fixed upstream path
        url.searchParams.forEach((v, k) => target.searchParams.set(k, v)); // pass through query exactly
        const r = await fetch(target.toString(), { cf: { cacheTtl: 30, cacheEverything: true }, headers: { "Accept": "application/json" } });

        // on error, log minimal details for triage
        if (r.status >= 400) {
          const preview = await r.clone().text().then(t => t.slice(0, 256)).catch(() => "<no-body>");
          const qs = Object.fromEntries(target.searchParams);
          console.warn(JSON.stringify({ route: "/api/data/list", status: r.status, qs, preview }));
        }

        const body = await r.text();
        return new Response(body, {
          status: r.status,
          headers: {
            "Content-Type": r.headers.get("Content-Type") || "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
            "Cache-Control": "no-store",
            "x-navigen-route": "/api/data/list"
          }
        });
      }

      // GET /api/data/profile?id=...
      // profile: accept alias or ULID; resolve alias → ULID via KV_ALIASES
      if (normPath === "/api/data/profile" && req.method === "GET") {
        const base = req.headers.get("Origin") || "https://navigen.io"; // keep caller origin
        const target = new URL("/api/data/profile", base);

        // accept alias or ULID; resolve alias → ULID
        const raw = (url.searchParams.get("id") || "").trim();
        const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(raw);
        const mapped = isUlid ? raw : (await resolveUid(raw, env)) || raw;

        // rebuild query with mapped id
        url.searchParams.forEach((v, k) => { if (k !== "id") target.searchParams.set(k, v); });
        target.searchParams.set("id", mapped);

        const r = await fetch(target.toString(), { cf: { cacheTtl: 30, cacheEverything: true }, headers: { "Accept": "application/json" } });

        const body = await r.text();
        return new Response(body, {
          status: r.status,
          headers: {
            "Content-Type": r.headers.get("Content-Type") || "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
            "Cache-Control": "no-store",
            "x-navigen-route": "/api/data/profile"
          }
        });
      }

      // Fallback 404 — include the evaluated path for live verification

      return json(
        { error: { code: "not_found", message: "No such route", path: (new URL(req.url)).pathname } },
        404,
        { "x-navigen-route": (new URL(req.url)).pathname }
      );

    } catch (err: any) {
      return json({ error: { code: "server_error", message: err?.message || "Unexpected" } }, 500);
    }
  },
};

// build per-request; base comes from Origin header (staging/prod safe)

async function nameForLocation(id: string, siteOrigin?: string): Promise<string | undefined> {
  try {
    const base = siteOrigin || "https://navigen.io"; // fallback only
    const url  = new URL("/data/profiles.json", base).toString();
    const res  = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!res.ok) return undefined;
    const data: any = await res.json();

    // supports both: locations: [...] and locations: { [id]: {...} }
    const arr = Array.isArray(data?.locations) ? data.locations : undefined;
    const map = (!arr && data?.locations && typeof data.locations === "object") ? data.locations : undefined;
    const hit = arr ? arr.find((x: any) => x?.locationID === id) : map?.[id];

    // supports { locationName: { en: "…" } } or { name: "…" }
    const ln = hit?.locationName || hit?.name;
    const name = typeof ln === "string" ? ln : (ln?.en || ln?.default);
    return typeof name === "string" ? name : undefined; // safe fallback
  } catch { return undefined; }
}

async function nameForEntity(_id: string): Promise<string | undefined> {
  return undefined; // entities don't have names in profiles.json
}

// ---------- handlers ----------

async function handleShortLink(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const [, , idRaw = ""] = url.pathname.split("/"); // "/s/{id}"
  const c = url.searchParams.get("c") || "";

  const resolved = await resolveUid(idRaw, env);
  const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(resolved || "");

  // count the view against the resolved ULID when we have one; otherwise skip counting
  if (isUlid) {
    const now = new Date(); const country = (req as any).cf?.country || "";
    const day = dayKeyFor(now, undefined, country);
    await kvIncr(env.KV_STATS, `stats:${resolved!}:${day}:qr-scan`); // count only human scans
  }

  const target = isUlid
    ? `https://navigen.io/?lp=${encodeURIComponent(resolved!)}${c ? `&c=${encodeURIComponent(c)}` : ""}`
    : `https://navigen.io/?lp=${encodeURIComponent(idRaw)}${c ? `&c=${encodeURIComponent(c)}` : ""}`;

  return new Response(null, {
    status: 302,
    headers: {
      "Location": target,
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "https://navigen.io",
      "Access-Control-Allow-Credentials": "true",
      "Vary": "Origin"
    }
  });
}

async function handleQr(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("locationID") || "").trim();
  if (!raw) return json({ error: { code: "invalid_request", message: "locationID required" } }, 400);

  // count a QR scan for daily stats (prefer resolved ULID)
  const now = new Date();
  const country = (req as any).cf?.country || "";
  const day = dayKeyFor(now, undefined, country); // uses Berlin fallback internally
  const resolved = await resolveUid(raw, env); // require canonical id for counting
  // removed counting at generation-time; QR scans are counted at /s/{id} only
  const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(resolved || ""); // reflect counted id

  const c = url.searchParams.get("c") || "";
  const fmt = (url.searchParams.get("fmt") || "svg").toLowerCase();
  const size = clamp(parseInt(url.searchParams.get("size") || "512", 10), 128, 1024);

  // ✅ ULID/alias → use /s/{locationID}; otherwise fall back to /?lp={raw}  
  const dataUrl = isUlid
    ? `https://navigen.io/s/${encodeURIComponent(resolved!)}${c ? `?c=${encodeURIComponent(c)}` : ""}`
    : `https://navigen.io/?lp=${encodeURIComponent(raw)}${c ? `&c=${encodeURIComponent(c)}` : ""}`;

  if (fmt === "svg") {
    const svg = await QRCode.toString(dataUrl, { type: "svg", width: size, margin: 0 });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "https://navigen.io",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin"
      }
    });
  } else {
    const bytes = await QRCode.toBuffer(dataUrl, { type: "png", width: size, margin: 0 });
    return new Response(bytes, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400",
        "access-control-allow-origin": "*"
      }
    });
  }

  if (fmt === "png") {
    const dataUrlPng: string = await QRCode.toDataURL(dataUrl, { width: size, margin: 0 });
    const base64 = dataUrlPng.split(",")[1] || "";
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return new Response(bytes, {
      headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" }
    });
  }
  return json({ error: { code: "invalid_request", message: "fmt must be svg or png" } }, 400);
}

async function handleTrack(req: Request, env: Env): Promise<Response> {
  // Expected small JSON from navigator.sendBeacon
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: { code: "invalid_request", message: "JSON body required" } }, 400);
  }

  const locRaw = (typeof payload.locationID === "string" && payload.locationID.trim()) ? payload.locationID.trim() : ""; // accept slug or ULID
  const loc = await resolveUid(locRaw, env); if (!loc) { // require canonical id
    // unknown id: no-op (do not leak); keep CORS consistent with allowlist
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "https://navigen.io", // or your allowOrigin variable
        "access-control-allow-credentials": "true",
        "vary": "Origin"
      }
    });
  }

  // canonicalize: _→- and trim; clients send hyphen metrics
  const event = (payload.event || "").toString().toLowerCase().replaceAll("_","-").trim();
  // normalize action into canonical dashboard keys
  let action = (payload.action || "").toString().toLowerCase().replaceAll("_","-").trim(); // normalize legacy
  // normalize action into canonical keys (keeps daily stats consistent)
  if (action.startsWith("nav.")) action = "map";                  // nav.google/nav.apple → map
  if (action === "route") action = "map";                         // older client emitted "route"
  if (action.startsWith("social.")) action = action.slice(7) || "other"; // social.instagram → instagram
  if (action === "share-contact" || action === "share_contact") action = "share"; // Business Card share → share

  if (action.startsWith("share")) action = "share";               // share_contact / share-qr → share
  // optional: fold anything not in EVENT_ORDER into "other" (keeps data consolidated)

  // accept locationID (primary)
  if (!loc || !event) {
    return json({ error: { code: "invalid_request", message: "locationID and event required" } }, 400);
  }
  
  // accept any metric listed in EVENT_ORDER (hyphen canonical)
  const allowed = new Set<string>(EVENT_ORDER as readonly string[]);
  if (!allowed.has(event)) {
    return json({ error: { code: "invalid_request", message: "unsupported event" } }, 400);
  }

  // A) daily counter
  const now = new Date();
  const country = (req as any).cf?.country || "";      // CF edge country
  const tz = (payload?.tz || "").trim() || undefined;  // optional client tz
  // direct metric counting (event itself is the metric key)
  const evKey = event;
  if ((EVENT_ORDER as readonly string[]).includes(evKey)) {
    const day = dayKeyFor(now, tz, country);
    const key = `stats:${loc}:${day}:${evKey}`;
    await kvIncr(env.KV_STATS, key);
  }
  
  // count by the metric key directly (event is canonical)
  const bucket = event;
  await increment(env.KV_STATS, keyForStat(loc, bucket));

  // keep response as before (e.g., return 204)
  // daily counters above + legacy YYYYMMDD bucket for older readers

  const origin = req.headers.get("Origin") || "";
  const allowOrigin = origin || "*";

  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "https://navigen.io", // same as above (or allowOrigin variable)
      "access-control-allow-credentials": "true",
      "vary": "Origin"
    }
  });
}

async function handleStatus(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const idParam = url.searchParams.get("locationID") || "";
  const locID = (await resolveUid(idParam, env)) || "";
  if (!locID) return json({ error: { code: "invalid_request", message: "locationID required" } }, 400);

  const raw = await env.KV_STATUS.get(statusKey(locID), "json");
  const status = raw?.status || "free";
  const tier = raw?.tier || "free";

  // return minimal status payload for the app (no caching to reflect live changes)
  return json(
    { locationID: locID, status, tier },
    200,
    { "cache-control": "no-store" }
  );
}

// ---------- helpers ----------

// JSON: must be compatible with credentialed fetches from the app
function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  const allowOrigin = "https://navigen.io"; // keep in sync with ALLOW set above
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Vary": "Origin",
      ...headers
    }
  });
}

function clamp(n: number, min: number, max: number): number {
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function todayKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function keyForStat(locationID: string, bucket: string): string {
  return `stats:${locationID}:${todayKey()}:${bucket}`;
}

function statusKey(locationID: string): string {
  return `status:${locationID}`;
}

function aliasKey(legacy: string): string {
  return `alias:${legacy}`;
}

async function resolveUid(idOrAlias: string, env: Env): Promise<string | null> {
  if (!idOrAlias) return null;
  // If it looks like a ULID, accept directly; else try alias map
  const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(idOrAlias);
  if (isUlid) return idOrAlias;

  const mapped = await env.KV_ALIASES.get(aliasKey(idOrAlias), "json");
  return (typeof mapped === "string" ? mapped : mapped?.locationID) || null;
}

async function increment(kv: KVNamespace, key: string): Promise<void> {
  // Simple read-modify-write; good enough for MVP. Upgrade to Durable Object later.
  const current = parseInt((await kv.get(key)) || "0", 10) || 0;
  await kv.put(key, String(current + 1));
}
