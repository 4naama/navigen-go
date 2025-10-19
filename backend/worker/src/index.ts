// src/index.ts
// ES module Worker: QR (/s/*, /api/qr), Analytics (/api/track), Status (/api/status)

import QRCode from "qrcode";

// Fixed event order used by API + UI
const EVENT_ORDER = [
  "lpm-open","call","email","whatsapp","telegram","messenger",
  "official","booking","newsletter",
  "facebook","instagram","pinterest","spotify","tiktok","youtube",
  "share","save","unsave","map","qr-view"
] as const;
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
    const { pathname } = url;
    
    // CORS preflight for all API endpoints (GET/POST from https://navigen.io)
    if (req.method === "OPTIONS" && pathname.startsWith("/api/")) {
      const origin = req.headers.get("Origin") || "";
      const allowOrigin = origin || "*"; // echo origin when present
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": allowOrigin,
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "600",
          "vary": "Origin"
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
    // Merges stats:<loc>:<day>:<event_with_underscores> into hyphen form and deletes legacy keys.
    if (pathname === "/api/admin/purge-legacy" && req.method === "POST") {
      const auth = req.headers.get("Authorization") || "";
      if (!auth.startsWith("Bearer ")) {
        return json({ error:{ code:"unauthorized", message:"Bearer token required" } }, 401);
      }
      const token = auth.slice(7).trim();
      if (!token || token !== env.JWT_SECRET) {
        return json({ error:{ code:"forbidden", message:"Bad token" } }, 403);
      }

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

          const n = parseInt((await env.KV_STATS.get(name)) || "0", 10) || 0;
          // delete empty legacy rows immediately
          if (!n) { await env.KV_STATS.delete(name); removed++; continue; }

          const hyphen = ev.replaceAll("_","-");
          const target = `stats:${parts[1]}:${parts[2]}:${hyphen}`;

          const cur = parseInt((await env.KV_STATS.get(target)) || "0", 10) || 0;
          await env.KV_STATS.put(target, String(cur + n), { expirationTtl: 60*60*24*366 });
          await env.KV_STATS.delete(name);

          migrated++; removed++;
        }
        cursor = page.cursor || undefined;
      } while (cursor);

      return json({ ok:true, migrated, removed }, 200);
    }
          
      // GET /api/stats?locationID=...&from=YYYY-MM-DD&to=YYYY-MM-DD[&tz=Europe/Berlin]
      if (url.pathname === "/api/stats" && req.method === "GET") {
        const loc  = (url.searchParams.get("locationID")||"").trim();
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

      // (Stubs for later)
      // if (pathname === "/api/checkout") { ... }
      // if (pathname === "/api/webhook")  { ... }
      // if (pathname === "/m/edit")       { ... }
      // if (pathname === "/api/location/update") { ... }

      return json({ error: { code: "not_found", message: "No such route" } }, 404);
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
  if (isUlid) await increment(env.KV_STATS, keyForStat(resolved!, "qr-view"));

  const target = isUlid
    ? `https://navigen.io/?lp=${encodeURIComponent(resolved!)}${c ? `&c=${encodeURIComponent(c)}` : ""}`
    : `https://navigen.io/?lp=${encodeURIComponent(idRaw)}${c ? `&c=${encodeURIComponent(c)}` : ""}`;

  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "public, max-age=300" }
  });
}

async function handleQr(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("locationID") || "").trim();
  if (!raw) return json({ error: { code: "invalid_request", message: "locationID required" } }, 400);

  // count a QR scan for daily stats
  const now = new Date();
  const country = (req as any).cf?.country || "";
  const day = dayKeyFor(now, undefined, country); // uses Berlin fallback internally
  await kvIncr(env.KV_STATS, `stats:${raw}:${day}:qr-view`);

  const resolved = await resolveUid(raw, env);
  const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(resolved || "");

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
      headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" }
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

  // coerce to canonical tokens before validation; accept common synonyms
  const loc = (typeof payload.locationID === "string" && payload.locationID.trim()) ? payload.locationID.trim() : "";
  const rawEvent  = String(payload.event  ?? "");
  const rawAction = String(payload.action ?? "");
  const event = rawEvent.trim().toLowerCase()
    .replaceAll("_","-").replaceAll(".","-").replace(/\s+/g,"-")
    .replace(/^qr$/,"qr-view").replace(/^open$/,"lpm-open"); // map short aliases
  const action = rawAction.trim().toLowerCase().replaceAll("_","-").replaceAll(".","-").replace(/\s+/g,"-");

  // accept locationID (primary)
  if (!loc || !event) {
    return json({ error: { code: "invalid_request", message: "locationID and event required" } }, 400);
  }
  
  // Only accept known event types (open list as needed)
  const allowed = new Set(["cta-click", "qr-view", "lpm-open"]);
  if (!allowed.has(event)) {
    return json({ error: { code: "invalid_request", message: "unsupported event" } }, 400);
  }
  
  // A) daily counter
  const now = new Date();
  const country = (req as any).cf?.country || "";      // CF edge country
  const tz = (payload?.tz || "").trim() || undefined;  // optional client tz
  // map "cta-click" + action → button key; pass through "lpm-open"
  const evKey = (event === "cta-click")
    ? String(action || "").toLowerCase()
    : String(event || "").toLowerCase();
  if ((EVENT_ORDER as readonly string[]).includes(evKey)) {
    const day = dayKeyFor(now, tz, country);
    const key = `stats:${loc}:${day}:${evKey}`;
    await kvIncr(env.KV_STATS, key);
  }

  // keep response as before (e.g., return 204)    

  // bucket by action (website/booking/phone/wa/apple/waze/...)
  const bucket = event === "cta-click" ? (action || "other") : event;

  await increment(env.KV_STATS, keyForStat(loc, bucket));
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = origin || "*";

  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": allowOrigin,
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

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "https://navigen.io",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "origin",
      ...headers
    },
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
