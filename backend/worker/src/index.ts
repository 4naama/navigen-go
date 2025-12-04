// src/index.ts
// ES module Worker: QR (/s/*, /api/qr), Analytics (/api/track), Status (/api/status)

import QRCode from "qrcode";

// Fixed event order used by API + UI
const EVENT_ORDER = [
  "lpm-open","call","email","whatsapp","telegram","messenger",
  "official","booking","newsletter",
  "facebook","instagram","pinterest","spotify","tiktok","youtube",
  "share","rating","save","unsave","map","qr-print","qr-scan","qr-view","qr-redeem"
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
      // --- QR image: /api/qr?locationID=...&c=...&fmt=svg|png&size=512
      if (pathname === "/api/qr" && req.method === "GET") {
        return await handleQr(req, env);
      }

      // --- Promotion QR URL: GET /api/promo-qr?locationID=... [&campaignKey=...]
      if (pathname === "/api/promo-qr" && req.method === "GET") {
        const u = new URL(req.url);
        const locationRaw = (u.searchParams.get("locationID") || "").trim();
        const campaignKeyRaw = (u.searchParams.get("campaignKey") || "").trim(); // optional

        if (!locationRaw) {
          return json(
            { error: { code: "invalid_request", message: "locationID required" } },
            400
          );
        }

        // Resolve slug → canonical ULID (or accept ULID as-is)
        const locULID = (await resolveUid(locationRaw, env)) || locationRaw;
        if (!locULID) {
          return json(
            { error: { code: "invalid_request", message: "unknown location" } },
            400
          );
        }

        const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
        const campaigns = await loadCampaigns(siteOrigin, env);

        // Build today's date (shifted) for campaign active checks
        const dayISO = new Date();
        dayISO.setHours(dayISO.getHours() + 12); // shift to avoid off-by-one
        const today = dayISO.toISOString().slice(0, 10);

        // Filter candidates for this location + active period
        const candidates = campaigns.filter(c =>
          c.locationID === locULID &&
          (!c.startDate || today >= c.startDate) &&
          (!c.endDate || today <= c.endDate) &&
          (!c.status || c.status.toLowerCase() !== "ended")
        );

        if (!candidates.length) {
          return json(
            { error: { code: "not_found", message: "no active campaign for this location" } },
            404
          );
        }

        // If campaignKeyRaw is provided, pick that one; else use the first active one.
        let campaign: CampaignDef | undefined;
        if (campaignKeyRaw) {
          campaign = candidates.find(c => c.campaignKey === campaignKeyRaw);
          if (!campaign) {
            return json(
              { error: { code: "not_found", message: "specified campaignKey not active for this location" } },
              404
            );
          }
        } else {
          campaign = candidates[0];
        }

        const chosenKey = campaign.campaignKey;

        // Create redeem token for this location + campaign
        const token = await createRedeemToken(env.KV_STATS, locULID, chosenKey);

        // Build Promotion QR URL using the original locationRaw (slug), not ULID
        const qrBase = siteOrigin || "https://navigen.io";
        const qrUrlObj = new URL(`/out/qr-redeem/${encodeURIComponent(locationRaw)}`, qrBase);
        qrUrlObj.searchParams.set("camp", chosenKey);
        qrUrlObj.searchParams.set("rt", token);

        return json({
          qrUrl: qrUrlObj.toString(),
          campaignName: campaign.campaignName || "",
          startDate: campaign.startDate || "",
          endDate: campaign.endDate || "",
          eligibilityType: campaign.eligibilityType || "",
          discountKind: campaign.discountKind || "",
          discountValue: campaign.discountValue
        }, 200);
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
                
      // --- Admin seed: POST /api/admin/seed-alias-ulids
      // Generate deterministic ULIDs for all aliases in profiles.json and write KV_ALIASES.
      if (pathname === "/api/admin/seed-alias-ulids" && req.method === "POST") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error:{ code:"unauthorized", message:"Bearer token required" } }, 401);
        }
        const token = auth.slice(7).trim();
        if (!token || token !== env.JWT_SECRET) {
          return json({ error:{ code:"forbidden", message:"Bad token" } }, 403);
        }

        // Load profiles.json from caller origin (keeps staging/prod safe)
        const base = req.headers.get("Origin") || "https://navigen.io";
        const src  = new URL("/data/profiles.json", base).toString();
        const resp = await fetch(src, { cf: { cacheTtl: 60, cacheEverything: true }, headers: { "Accept": "application/json" } });
        if (!resp.ok) return json({ error:{ code:"upstream", message:"profiles.json not reachable" } }, 502);
        const data: any = await resp.json();

        // Normalize locations list: supports array or object map
        const list: Array<{locationID:string}> =
          Array.isArray(data?.locations) ? data.locations :
          (data?.locations && typeof data.locations === "object")
            ? Object.values(data.locations) as any[] : [];

        // Collect aliases (anything not already a 26-char ULID)
        const aliases: string[] = list
          .map(x => String(x?.locationID || "").trim())
          .filter(id => id && !/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id));

        // Small helpers local to this request (no globals)
        const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
        const toBase32 = (bytes: Uint8Array) => {
          let bits = 0, val = 0, out = "";
          for (const b of bytes) {
            val = (val << 8) | b; bits += 8;
            while (bits >= 5) { bits -= 5; out += B32[(val >>> bits) & 31]; val &= (1 << bits) - 1; }
          }
          if (bits > 0) out += B32[(val << (5 - bits)) & 31];
          return out;
        };
        const deterministicUlid = async (alias: string) => {
          // Fixed timestamp keeps outputs stable across runs.
          const t = new Uint8Array(8);
          new DataView(t.buffer).setBigUint64(0, 1735689600000n); // 2025-01-01T00:00:00.000Z
          const time48 = t.slice(2); // last 6 bytes

          const enc = new TextEncoder().encode(alias);
          const hashBuf = await crypto.subtle.digest("SHA-256", enc); // Web Crypto at edge
          const h = new Uint8Array(hashBuf).slice(0, 10); // 80 bits

          const bytes = new Uint8Array(16);
          bytes.set(time48, 0); bytes.set(h, 6);

          let b32 = toBase32(bytes);
          if (b32.length < 26) b32 = b32.padEnd(26, "0");
          if (b32.length > 26) b32 = b32.slice(0, 26);
          return b32;
        };

        let wrote = 0, skipped = 0;
        for (const alias of aliases) {
          try {
            const ulid = await deterministicUlid(alias);
            await env.KV_ALIASES.put(`alias:${alias}`, JSON.stringify({ locationID: ulid }));
            wrote++;
          } catch { skipped++; }
        }

        return json({ ok:true, wrote, skipped, total: aliases.length }, 200);
      }

      // GET /api/stats?locationID=.
      if (url.pathname === "/api/stats" && req.method === "GET") {
        const locRaw = (url.searchParams.get("locationID") || "").trim();
        const loc = (await resolveUid(locRaw, env)) || locRaw;
        const from = (url.searchParams.get("from") || "").trim();
        const to = (url.searchParams.get("to") || "").trim();
        const tz = (url.searchParams.get("tz") || "").trim() || undefined;

        if (!loc || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          return json({ error: { code: "invalid_request", message: "locationID, from, to required (YYYY-MM-DD)" } }, 400);
        }

        const prefix = `stats:${loc}:`;
        const days: Record<string, Partial<Record<EventKey, number>>> = {};
        let cursor: string | undefined = undefined;

        let ratedSum = 0;
        let ratingScoreSum = 0;

        const allowed = new Set<string>(EVENT_ORDER as readonly string[]);

        do {
          const page = await env.KV_STATS.list({ prefix, cursor });
          for (const k of page.keys) {
            const name = k.name;
            const parts = name.split(":");
            if (parts.length !== 4) continue;

            const day = parts[2];
            if (day < from || day > to) continue;

            const rawEv = (parts[3] as string).replaceAll("_", "-");

            if (rawEv === "rating-score") {
              const sv = parseInt((await env.KV_STATS.get(name)) || "0", 10) || 0;
              ratingScoreSum += sv;
              continue;
            }

            if (!allowed.has(rawEv)) continue;
            const ev = rawEv as EventKey;

            const n = parseInt((await env.KV_STATS.get(name)) || "0", 10) || 0;
            if (!days[day]) days[day] = {};
            days[day][ev] = (days[day][ev] || 0) + n;

            if (ev === "rating") ratedSum += n;
          }
          cursor = page.cursor || undefined;
        } while (cursor);

        const ratingAvg = ratedSum > 0 ? ratingScoreSum / ratedSum : 0;

        const siteOrigin =
          req.headers.get("Origin") || "https://navigen.io";

        // --- Build QR Info (per-scan logs) and Campaign aggregates --- //
        const qrInfo: any[] = [];
        const campaignsAgg: Record<string, {
          campaignKey: string;
          scans: number;
          redemptions: number;
          invalids: number;
          uniqueVisitors: Set<string>;
          repeatVisitors: Set<string>;
          uniqueRedeemers: Set<string>;
          repeatRedeemers: Set<string>;
          langs: Set<string>;
          countries: Set<string>;
        }> = {};

        // load campaigns once per stats call
        const allCampaigns = await loadCampaigns(siteOrigin, env);

        // QR logs live under qrlog:<loc>:<day>:<scanId>
        const qrPrefix = `qrlog:${loc}:`;
        let qrCursor: string | undefined = undefined;

        do {
          const page = await env.KV_STATS.list({ prefix: qrPrefix, cursor: qrCursor });
          for (const k of page.keys) {
            const name = k.name;
            const parts = name.split(":"); // ['qrlog', '<loc>', '<day>', '<scanId>']
            if (parts.length !== 4) continue;

            const dayKey = parts[2];
            if (dayKey < from || dayKey > to) continue;

            const raw = await env.KV_STATS.get(name, "text");
            if (!raw) continue;

            let entry: QrLogEntry | null = null;
            try {
              entry = JSON.parse(raw) as QrLogEntry;
            } catch {
              entry = null;
            }
            if (!entry || entry.locationID !== loc) continue;

            const scanId = parts[3];

            // Push into qrInfo array (shape aligned with dash expectations)
            // Build QR Info row
            qrInfo.push({
              time: entry.time,
              source: entry.source || "",
              // Location: use physical scanner country code (CF country), not the location ULID
              location: entry.city
                ? `${entry.city}, ${entry.country || ''}`.trim().replace(/,\s*$/, '')
                : (entry.country || ""),
              // Device/Browser: keep UA here; frontend will bucketize into Device + Browser
              device: entry.ua || "",
              browser: entry.ua || "",
              lang: entry.lang || "",
              scanId,
              visitor: entry.visitor || "",
              campaign: entry.campaignKey || "",
              signal: entry.signal || "scan"
            });

            // Aggregate by campaignKey for Campaigns view
            const cKey = entry.campaignKey || "";
            const bucketKey = cKey || "_no_campaign";

            if (!campaignsAgg[bucketKey]) {
              campaignsAgg[bucketKey] = {
                campaignKey: cKey,
                scans: 0,
                redemptions: 0,
                invalids: 0,
                uniqueVisitors: new Set<string>(),
                repeatVisitors: new Set<string>(),
                uniqueRedeemers: new Set<string>(),
                repeatRedeemers: new Set<string>(),
                langs: new Set<string>(),
                countries: new Set<string>()
              };
            }

            const agg = campaignsAgg[bucketKey];

            // Scans: only count entries with signal="scan"
            if (entry.signal === "scan") {
              agg.scans += 1;
            }

            // Redemptions: only explicit "redeem" signals count as true redemptions.
            if (entry.signal === "redeem") {
              agg.redemptions += 1;
            }

            // Invalid attempts (expired/used/invalid tokens)
            if (entry.signal === "invalid") {
              agg.invalids += 1;
            }

            // Visitor identity (for now): derive from UA + country if visitor field is empty
            const visitorKey = entry.visitor && entry.visitor.trim()
              ? entry.visitor.trim()
              : `${entry.ua || ""}|${entry.country || ""}`;

            if (visitorKey) {
              // All visitors (scan + redeem + invalid)
              if (agg.uniqueVisitors.has(visitorKey)) {
                agg.repeatVisitors.add(visitorKey);
              } else {
                agg.uniqueVisitors.add(visitorKey);
              }

              // Redeemers: only consider entries with signal="redeem"
              if (entry.signal === "redeem") {
                if (agg.uniqueRedeemers.has(visitorKey)) {
                  agg.repeatRedeemers.add(visitorKey);
                } else {
                  agg.uniqueRedeemers.add(visitorKey);
                }
              }
            }

            // Aggregate primary language and scanner country
            if (entry.lang) {
              const primaryLang = String(entry.lang).split(",")[0].trim();
              if (primaryLang) agg.langs.add(primaryLang);
            }
            if (entry.country) {
              agg.countries.add(entry.country);
            }
         
          }
          qrCursor = page.cursor || undefined;
        } while (qrCursor);
        
        // Sort QR Info rows by time (newest first)
        qrInfo.sort((a, b) => {
          const ta = String(a.time || '');
          const tb = String(b.time || '');
          if (ta < tb) return 1;   // reverse comparison for newest-first
          if (ta > tb) return -1;
          return 0;
        });

        // Serialize campaignsAgg into a simple array
        const campaigns = Object.values(campaignsAgg)
          // hide "_no_campaign" bucket (scans without a campaignKey)
          .filter(agg => (agg.campaignKey || "").trim() !== "")
          .map((agg) => {
            const key = agg.campaignKey;
            const meta = allCampaigns.find(c => c.locationID === loc && c.campaignKey === key) || null;

            const uniqueCount = agg.uniqueVisitors.size;
            const repeatCount = agg.repeatVisitors.size;
            const uniqueRedeemerCount = agg.uniqueRedeemers.size;
            const repeatRedeemerCount = agg.repeatRedeemers.size;

            // Period: prefer campaign start/end if available, otherwise stats window
            const campaignStart = meta?.startDate || "";
            const campaignEnd   = meta?.endDate || "";
            const periodLabel = (campaignStart && campaignEnd)
              ? `${campaignStart} → ${campaignEnd}`
              : `${from} → ${to}`;

            return {
              // Campaign ID + Name + Brand for dashboard
              campaign: key || "",
              campaignName: meta?.campaignName || "",
              brand: meta?.brandKey || "",
              target: meta?.context || "",
              period: periodLabel,
              scans: agg.scans,
              redemptions: agg.redemptions,
              invalids: agg.invalids,
              uniqueVisitors: uniqueCount,
              repeatVisitors: repeatCount,
              uniqueRedeemers: uniqueRedeemerCount,
              repeatRedeemers: repeatRedeemerCount,
              locations: agg.countries.size
            };
          });

        return json(
          {
            locationID: loc,
            locationName: await nameForLocation(loc, siteOrigin),
            from,
            to,
            tz: tz || TZ_FALLBACK,
            order: EVENT_ORDER,
            days,
            rated_sum: ratedSum,
            rating_avg: ratingAvg,
            qrInfo,
            campaigns
          },
          200
        );
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
        if (!allowed.has(ev)) {
          return json({ error:{ code:"invalid_request", message:"unsupported event" } }, 400);
        }

        // Gate only QR-redeem. QR-scan must be accepted from the app so qrInfo/Campaigns work.
        if (ev === "qr-redeem") {
          const src = (req.headers.get("X-NG-QR-Source") || "").trim();
          if (src !== "pages-worker") {
            return new Response(null, {
              status: 204,
              headers: {
                "Access-Control-Allow-Origin": "https://navigen.io",
                "Access-Control-Allow-Credentials": "true",
                "Vary": "Origin"
              }
            });
          }
        }

        const loc = await resolveUid(idRaw, env);
        if (!loc) {
          return json({ error:{ code:"invalid_request", message:"bad id" } }, 400);
        }

        const now = new Date();
        const country = (req as any).cf?.country || "";
        const day = dayKeyFor(now, undefined, country);

        // always increment the base event counter (e.g., 'rating' → how many people clicked a face)
        await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);

        // For rating hits, also accumulate the score so we can compute an average later.
        if (ev === "rating") {
          const url = new URL(req.url);
          const scoreRaw = (url.searchParams.get("score") || "").trim();
          const score = parseInt(scoreRaw, 10);
          if (Number.isFinite(score) && score >= 1 && score <= 5) {
            const scoreKey = `stats:${loc}:${day}:rating-score`;
            const cur = parseInt((await env.KV_STATS.get(scoreKey)) || "0", 10) || 0;
            await env.KV_STATS.put(scoreKey, String(cur + score), {
              expirationTtl: 60*60*24*366
            });
          }
        }

        // For QR scan events, also log a per-scan record (powers QR Info / Campaigns in the dash).
        if (ev === "qr-scan") {
          await logQrScan(env.KV_STATS, env, loc, req);
        }

        // For QR redeem events, validate token and log "redeem" vs "invalid".
        if (ev === "qr-redeem") {
          const token = (req.headers.get("X-NG-QR-Token") || "").trim();

          const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
          const campaigns = await loadCampaigns(siteOrigin, env);

          // Build today's date for campaign active checks (same shift as in promo-qr)
          const dayISO = new Date();
          dayISO.setHours(dayISO.getHours() + 12);
          const today = dayISO.toISOString().slice(0, 10);

          // Pick the active campaign for this location and date
          const campaignKey = pickCampaignForScan(campaigns, loc, today);
          const campaign = campaigns.find(c => c.locationID === loc && c.campaignKey === campaignKey) || null;

          if (!campaignKey || !campaign) {
            // No active campaign found: log invalid
            await logQrRedeemInvalid(env.KV_STATS, env, loc, req);
          } else {
            const result = await consumeRedeemToken(env.KV_STATS, token, loc, campaignKey);
            if (result === "ok") {
              await logQrRedeem(env.KV_STATS, env, loc, req);
              // Billing write will go here later; for now keep redeem logic simple.
            } else {
              await logQrRedeemInvalid(env.KV_STATS, env, loc, req);
            }
          }
        }

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

        const raw = (url.searchParams.get("id") || "").trim();
        const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(raw);
        const mapped = isUlid ? raw : (await resolveUid(raw, env)) || raw;

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

      // GET /api/data/item?id=...
      // item: accept alias or ULID; resolve alias → ULID; return single item + contexts[]
      if (normPath === "/api/data/item" && req.method === "GET") {
        const idParam = (url.searchParams.get("id") || "").trim();
        if (!idParam) {
          return json(
            { error: { code: "invalid_request", message: "id required" } },
            400,
            { "x-navigen-route": "/api/data/item" }
          );
        }

        const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

        // 1) canonical ULID (if idParam is a slug)
        const mapped = (await resolveUid(idParam, env)) || idParam;
        const isUlid = ULID_RE.test(mapped);

        // 2) load profiles.json once
        const base = req.headers.get("Origin") || "https://navigen.io";
        const src  = new URL("/data/profiles.json", base).toString();
        const resp = await fetch(src, {
          cf: { cacheTtl: 60, cacheEverything: true },
          headers: { "Accept": "application/json" }
        });

        if (!resp.ok) {
          return json(
            { error: { code: "upstream", message: "profiles.json not reachable" } },
            502,
            { "x-navigen-route": "/api/data/item" }
          );
        }

        let data: any;
        try {
          data = await resp.json();
        } catch {
          data = { locations: [] };
        }

        const locs: any[] = Array.isArray(data?.locations)
          ? data.locations
          : (data?.locations && typeof data.locations === "object")
            ? Object.values(data.locations)
            : [];

        // 3) first try: direct slug/ID match from profiles.json
        let hit = locs.find((p) => {
          const slug = String(p?.locationID || "").trim();
          const id   = String(p?.ID || p?.id || "").trim();
          // match by slug OR by ULID (if profiles.json ever stores it)
          return slug === idParam || id === mapped;
        });

        // 4) second try: ULID → slug via KV_ALIASES, then slug → profiles.json
        if (!hit && isUlid && env.KV_ALIASES) {
          let aliasSlug = "";
          let cursor: string | undefined = undefined;

          do {
            const page = await env.KV_ALIASES.list({ prefix: "alias:", cursor });
            for (const k of page.keys) {
              const name = k.name; // "alias:<slug>"
              const raw = await env.KV_ALIASES.get(name, "text");
              if (!raw) continue;

              let val = raw.trim();
              if (val.startsWith("{")) {
                try {
                  const j = JSON.parse(val) as any;
                  val = String(j?.locationID || "").trim();
                } catch {
                  val = "";
                }
              }

              if (val && val === mapped) {
                aliasSlug = name.replace(/^alias:/, "");
                break;
              }
            }
            if (aliasSlug) break;
            cursor = page.cursor || undefined;
          } while (cursor);

          if (aliasSlug) {
            hit = locs.find((p) => String(p?.locationID || "").trim() === aliasSlug);
          }
        }

        if (!hit) {
          return json(
            { error: { code: "not_found", message: "item not found" } },
            404,
            { "x-navigen-route": "/api/data/item" }
          );
        }

        const ctxStr = String(hit.context || hit.Context || "").trim();
        const ctxArr = ctxStr
          ? ctxStr.split(";").map((s: string) => s.trim()).filter(Boolean)
          : [];

        const payload = {
          id: mapped || hit.ID || hit.id || hit.locationID,
          locationID: String(hit.locationID || "").trim(),
          contexts: ctxArr,
          locationName: hit.locationName || hit.name,
          media: hit.media || {},
          coord: hit.coord || hit["Coordinate Compound"] || "",
          links: hit.links || {},
          contactInformation: hit.contactInformation || hit.contact || {},
          descriptions: hit.descriptions || {},
          tags: Array.isArray(hit.tags) ? hit.tags : [],
          ratings: hit.ratings || {},
          pricing: hit.pricing || {}
        };

        return json(payload, 200, { "x-navigen-route": "/api/data/item" });
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

async function handleQr(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("locationID") || "").trim();
  if (!raw) {
    return json(
      { error: { code: "invalid_request", message: "locationID required" } },
      400
    );
  }

  const fmt = (url.searchParams.get("fmt") || "svg").toLowerCase();
  const size = clamp(parseInt(url.searchParams.get("size") || "512", 10), 128, 1024);

  // 1) Load profiles.json and find the matching record by slug or ID
  let profiles: any;
  try {
    const src = new URL("/data/profiles.json", "https://navigen.io").toString();
    const resp = await fetch(src, {
      cf: { cacheTtl: 60, cacheEverything: true },
      headers: { Accept: "application/json" }
    });
    if (!resp.ok) {
      return json(
        { error: { code: "upstream", message: "profiles.json not reachable" } },
        502
      );
    }
    profiles = await resp.json();
  } catch {
    profiles = { locations: [] };
  }

  const locs: any[] = Array.isArray(profiles?.locations)
    ? profiles.locations
    : (profiles?.locations && typeof profiles.locations === "object")
      ? Object.values(profiles.locations)
      : [];

  const hit = locs.find((p) => {
    const slug = String(p?.locationID || "").trim();
    const id   = String(p?.ID || p?.id || "").trim();
    return slug === raw || id === raw;
  });

  // 2) Resolve final landing URL (qrUrl, or fallback ?lp=<raw>), then wrap it in /out/qr-scan
  let targetUrl = "";
  if (hit && hit.qrUrl) {
    targetUrl = String(hit.qrUrl).trim();
  } else {
    // Fallback: not expected in practice, but keep a sane default
    const dest = new URL("/", "https://navigen.io");
    dest.searchParams.set("lp", raw);
    targetUrl = dest.toString();
  }

  // Build tracked scan URL on navigen.io that will increment qr-scan, then redirect to targetUrl
  const scanUrl = new URL(`/out/qr-scan/${encodeURIComponent(raw)}`, "https://navigen.io");
  scanUrl.searchParams.set("to", targetUrl);
  const dataUrl = scanUrl.toString();

  // 3) Generate QR code with dataUrl as the payload (tracked via /out/qr-scan, then redirected to qrUrl)

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
    await kvIncr(env.KV_STATS, key); // base counter (e.g. "rating" → how many rating events)

    // For rating events, also accumulate the 1–5 score so /api/stats can compute an average.
    if (evKey === "rating") {
      const scoreRaw = (
        payload?.score ??
        payload?.rating ??
        payload?.value ??
        ""
      ).toString().trim();
      const score = parseInt(scoreRaw, 10);

      if (Number.isFinite(score) && score >= 1 && score <= 5) {
        const scoreKey = `stats:${loc}:${day}:rating-score`;
        const cur = parseInt((await env.KV_STATS.get(scoreKey)) || "0", 10) || 0;
        await env.KV_STATS.put(scoreKey, String(cur + score), {
          expirationTtl: 60 * 60 * 24 * 366 // keep stats ~1 year like kvIncr()
        });
      }
    }
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

// -------- QR log helpers (per-scan metadata for QR Info / Campaigns) --------

interface QrLogEntry {
  time: string;          // ISO timestamp (UTC)
  locationID: string;    // canonical ULID (location that owns this QR)
  day: string;           // YYYY-MM-DD (for quick filtering)
  ua: string;            // User-Agent
  lang: string;          // Accept-Language
  country: string;       // Cloudflare country code (scanner location, best-effort)
  city: string;          // Cloudflare city (scanner location, best-effort)
  source: string;        // logical source (for now: "qr-scan")
  signal: string;        // "scan" | "redeem" | other
  visitor: string;       // provisional visitor fingerprint (e.g. UA+country)
  campaignKey: string;   // resolved from campaign.json when possible, else empty
}

interface CampaignDef {
  locationID: string;
  campaignKey: string;
  campaignName?: string;
  brandKey?: string;
  context?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  sectorKey?: string;
  eligibilityType?: string;
  discountKind?: string;
  discountValue?: number | null;
}

/**
 * Fetch campaign definitions once per request.
 * Reads /data/campaign.json from the main site origin.
 */
async function loadCampaigns(baseOrigin: string, env: Env): Promise<CampaignDef[]> {
  const normalizeDate = (v: any): string | undefined => {
    if (!v) return undefined;
    const s = String(v).trim();
    if (!s) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const d = new Date(s);
    if (isNaN(d.getTime())) return undefined;

    // SHIFT: add 12 hours before converting to ISO date to avoid
    // off-by-one for midnight local times in campaign_data.
    d.setHours(d.getHours() + 12);

    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  try {
    const src = new URL("/data/campaigns.json", baseOrigin || "https://navigen.io").toString();
    const resp = await fetch(src, {
      cf: { cacheTtl: 60, cacheEverything: true },
      headers: { "Accept": "application/json" }
    });
    if (!resp.ok) return [];
    const data: any = await resp.json();
    const rows: any[] = Array.isArray(data) ? data : (Array.isArray(data?.campaigns) ? data.campaigns : []);

    // First map raw rows
    const rawDefs = rows.map((r) => ({
      locationID: String(r.locationID || "").trim(),
      campaignKey: String(r.campaignKey || "").trim(),
      campaignName: typeof r.campaignName === "string" ? r.campaignName : undefined,
      brandKey: typeof r.brandKey === "string" ? r.brandKey : undefined,
      context: typeof r.context === "string" ? r.context : undefined,
      startDate: normalizeDate(r.startDate),
      endDate: normalizeDate(r.endDate),
      status: typeof r.status === "string" ? r.status : undefined,
      sectorKey: typeof r.sectorKey === "string" ? r.sectorKey : undefined,
      eligibilityType: typeof r.eligibilityType === "string" ? r.eligibilityType : undefined,
      discountKind: typeof r.discountKind === "string" ? r.discountKind : undefined,
      discountValue: typeof r.discountValue === "number" ? r.discountValue : null
    })).filter(r => r.locationID && r.campaignKey);

    // Now canonicalize locationID to ULID when possible
    const normalized: CampaignDef[] = [];
    for (const def of rawDefs) {
      const ulid = await resolveUid(def.locationID, env);
      normalized.push({
        ...def,
        locationID: ulid || def.locationID
      });
    }

    return normalized;
  } catch {
    return [];
  }
}

interface FinanceRow {
  sectorKey: string;
  countryCode: string;
  currency: string;
  campFee: number | null;
  campFeeRate: number | null;
}

/**
 * Load finance (sector-based fee) definitions from /data/finance.json.
 */
async function loadFinance(baseOrigin: string, env: Env): Promise<FinanceRow[]> {
  try {
    const src = new URL("/data/finance.json", baseOrigin || "https://navigen.io").toString();
    const resp = await fetch(src, {
      cf: { cacheTtl: 60, cacheEverything: true },
      headers: { "Accept": "application/json" }
    });
    if (!resp.ok) return [];
    const data: any = await resp.json();
    const rows: any[] = Array.isArray(data) ? data : (Array.isArray(data?.finance) ? data.finance : []);
    return rows.map((r) => ({
      sectorKey: String(r.sectorKey || "").trim(),
      countryCode: String(r.countryCode || "").trim(),
      currency: String(r.currency || "").trim(),
      campFee: typeof r.campFee === "number" ? r.campFee : null,
      campFeeRate: typeof r.campFeeRate === "number" ? r.campFeeRate : null
    })).filter(r => r.sectorKey && r.countryCode);
  } catch {
    return [];
  }
}

/**
 * Given a locationID + day, find the best matching campaignKey.
 * For now: pick any campaign for that location where:
 *   - status is not "ended"
 *   - and the scan day is between startDate and endDate (if those exist)
 * If none match, return "".
 */
function pickCampaignForScan(
  campaigns: CampaignDef[],
  locationID: string,
  day: string
): string {
  const candidates = campaigns.filter(c => c.locationID === locationID);
  if (!candidates.length) return "";

  const d = day;
  let best: CampaignDef | null = null;

  for (const c of candidates) {
    const startOK = !c.startDate || d >= c.startDate;
    const endOK = !c.endDate || d <= c.endDate;
    const statusOK = !c.status || c.status.toLowerCase() !== "ended";
    if (!startOK || !endOK || !statusOK) continue;
    // Pick first matching; later we can add priority if needed.
    best = c;
    break;
  }
  return best?.campaignKey || "";
}

/**
 * Log a QR scan into KV_STATS under qrlog:<loc>:<day>:<scanId>.
 * This powers the QR Info and Campaigns views in the dashboard.
 */
async function logQrScan(
  kv: KVNamespace,
  env: Env,
  loc: string,
  req: Request
): Promise<void> {
  try {
    const now = new Date();
    const day = dayKeyFor(now, undefined, (req as any).cf?.country || "");
    const timeISO = now.toISOString();

    // For scans coming directly from the app, we use the browser UA/lang.
    const ua = req.headers.get("User-Agent") || "";
    const lang = req.headers.get("Accept-Language") || "";

    const country = ((req as any).cf?.country || "").toString();
    const city = ((req as any).cf?.city || "").toString();
    const source = "qr-scan"; // logical source for Business/Promotion QR views
    const signal = "scan";    // distinguishes scan events from redeems/invalids

    // provisional visitor identity (UA + country); no IP stored
    const visitor = `${ua}|${country}`;

    // base origin for campaign data
    const baseOrigin = "https://navigen.io";
    const campaigns = await loadCampaigns(baseOrigin, env);
    const campaignKey = pickCampaignForScan(campaigns, loc, day);

    // Generate a short random scan ID (hex string)
    const bytes = new Uint8Array(6);
    (crypto as any).getRandomValues(bytes);
    const scanId = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

    const entry: QrLogEntry = {
      time: timeISO,
      locationID: loc,
      day,
      ua,
      lang,
      country,
      city,
      source,
      signal,
      visitor,
      campaignKey
    };

    const key = `qrlog:${loc}:${day}:${scanId}`;
    // TTL: 56 days for QR logs (~8 weeks)
    const ttlSeconds = 56 * 24 * 60 * 60;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch {
    // never throw from logging; stats must not break the main flow
  }
}

/**
 * Log a QR redeem into KV_STATS under qrlog:<loc>:<day>:<scanId>.
 * This powers the QR Info and Campaigns views in the dashboard.
 */
async function logQrRedeem(
  kv: KVNamespace,
  env: Env,
  loc: string,
  req: Request
): Promise<void> {
  try {
    const now = new Date();
    const day = dayKeyFor(now, undefined, (req as any).cf?.country || "");
    const timeISO = now.toISOString();

    const ua = req.headers.get("X-NG-UA") || req.headers.get("User-Agent") || "";
    const lang = req.headers.get("X-NG-Lang") || req.headers.get("Accept-Language") || "";

    const country = ((req as any).cf?.country || "").toString();
    const city = ((req as any).cf?.city || "").toString();
    const source = "qr-redeem"; // logical source for Promotion QR redemptions
    const signal = "redeem";    // distinguishes redeem events from scans

    // provisional visitor identity (UA + country); no IP stored
    const visitor = `${ua}|${country}`;

    // base origin for campaign.json (always the app domain)
    const baseOrigin = "https://navigen.io";
    const campaigns = await loadCampaigns(baseOrigin, env);
    const campaignKey = pickCampaignForScan(campaigns, loc, day);

    // Generate a short random scan ID (hex string)
    const bytes = new Uint8Array(6);
    (crypto as any).getRandomValues(bytes);
    const scanId = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

    const entry: QrLogEntry = {
      time: timeISO,
      locationID: loc,
      day,
      ua,
      lang,
      country,
      city,
      source,
      signal,
      visitor,
      campaignKey
    };

    const key = `qrlog:${loc}:${day}:${scanId}`;
    // TTL: 56 days for QR logs (~8 weeks)
    const ttlSeconds = 56 * 24 * 60 * 60;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch {
    // never throw from logging; stats must not break the main flow
  }
}

/**
 * Log an invalid QR redeem attempt into KV_STATS (signal="invalid").
 */
async function logQrRedeemInvalid(
  kv: KVNamespace,
  env: Env,
  loc: string,
  req: Request
): Promise<void> {
  try {
    const now = new Date();
    const day = dayKeyFor(now, undefined, (req as any).cf?.country || "");
    const timeISO = now.toISOString();

    const ua = req.headers.get("X-NG-UA") || req.headers.get("User-Agent") || "";
    const lang = req.headers.get("X-NG-Lang") || req.headers.get("Accept-Language") || "";

    const country = ((req as any).cf?.country || "").toString();
    const city = ((req as any).cf?.city || "").toString();
    const source = "qr-redeem"; // same logical source
    const signal = "invalid";   // distinguishes invalid attempts

    // provisional visitor identity (UA + country); no IP stored
    const visitor = `${ua}|${country}`;

    const baseOrigin = "https://navigen.io";
    const campaigns = await loadCampaigns(baseOrigin, env);
    const campaignKey = pickCampaignForScan(campaigns, loc, day);

    const bytes = new Uint8Array(6);
    (crypto as any).getRandomValues(bytes);
    const scanId = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

    const entry: QrLogEntry = {
      time: timeISO,
      locationID: loc,
      day,
      ua,
      lang,
      country,
      city,
      source,
      signal,
      visitor,
      campaignKey
    };

    const key = `qrlog:${loc}:${day}:${scanId}`;
    const ttlSeconds = 56 * 24 * 60 * 60;
    await kv.put(key, JSON.stringify(entry), { expirationTtl: ttlSeconds });
  } catch {
    // never throw from logging; stats must not break the main flow
  }
}

// -------- Redeem token helpers (one-time Promotion QR tokens) --------

interface RedeemTokenRecord {
  locationID: string;
  campaignKey: string;
  status: "fresh" | "redeemed" | "invalid";
  createdAt: string;
}

/**
 * Create a fresh redeem token for a given location + campaignKey.
 * Token is a short random hex string, stored under redeem:<token>.
 */
async function createRedeemToken(
  kv: KVNamespace,
  locationID: string,
  campaignKey: string
): Promise<string> {
  // Generate 8-byte random token (16 hex chars)
  const bytes = new Uint8Array(8);
  (crypto as any).getRandomValues(bytes);
  const token = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

  const record: RedeemTokenRecord = {
    locationID,
    campaignKey,
    status: "fresh",
    createdAt: new Date().toISOString()
  };

  const key = `redeem:${token}`;
  const ttlSeconds = 56 * 24 * 60 * 60; // align with QR logs (~8 weeks)
  await kv.put(key, JSON.stringify(record), { expirationTtl: ttlSeconds });

  return token;
}

/**
 * Try to consume a redeem token for a given location + campaignKey.
 * Returns "ok" if token is valid and now marked redeemed, otherwise "invalid".
 */
async function consumeRedeemToken(
  kv: KVNamespace,
  token: string,
  locationID: string,
  campaignKey: string
): Promise<"ok" | "invalid"> {
  if (!token) return "invalid";
  const key = `redeem:${token}`;
  const raw = await kv.get(key, "text");
  if (!raw) return "invalid";

  let rec: RedeemTokenRecord;
  try {
    rec = JSON.parse(raw) as RedeemTokenRecord;
  } catch {
    return "invalid";
  }

  if (
    rec.status !== "fresh" ||
    rec.locationID !== locationID ||
    rec.campaignKey !== campaignKey
  ) {
    return "invalid";
  }

  // Mark as redeemed
  rec.status = "redeemed";
  await kv.put(key, JSON.stringify(rec));
  return "ok";
}

interface BillingRecord {
  locationID: string;
  campaignKey: string;
  sectorKey: string;
  countryCode: string;
  currency: string;
  timestamp: string;
  campFee: number;
  campFeeRate: number | null;
}

/**
 * Write a billing ledger record into KV_STATS under billing:YYYY-MM:<loc>:<id>.
 * For now we reuse KV_STATS as storage; later this can be moved to its own namespace.
 */
async function writeBillingRecord(kv: KVNamespace, rec: BillingRecord): Promise<void> {
  const d = new Date(rec.timestamp || new Date().toISOString());
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  // random 6-byte id
  const bytes = new Uint8Array(6);
  (crypto as any).getRandomValues(bytes);
  const rid = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

  const key = `billing:${ym}:${rec.locationID}:${rid}`;
  await kv.put(key, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 366 });
}
