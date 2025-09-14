// src/index.ts
// ES module Worker: QR (/s/*, /api/qr), Analytics (/api/track), Status (/api/status)

import QRCode from "qrcode";

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
    
    // CORS preflight (must be before any route checks)
    if (req.method === "OPTIONS" && pathname === "/api/track") {
      const origin = req.headers.get("Origin") || "";
      const allowOrigin = origin || "*"; // echo origin when provided
      return new Response(null, {
        headers: {
          "access-control-allow-origin": allowOrigin,
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "POST,OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "600",
          "vary": "Origin"
        }
      });
    }

    try {
      // --- QR short link: /s/{school_uid}?c=....
      if (pathname.startsWith("/s/")) {
        return await handleShortLink(req, env);
      }

      // --- QR image: /api/qr?school_uid=...&c=...&fmt=svg|png&size=512
      if (pathname === "/api/qr") {
        return await handleQr(req, env);
      }

      // --- Analytics track: POST /api/track
      if (pathname === "/api/track" && req.method === "POST") {
        return await handleTrack(req, env);
      }

      // --- Status: GET /api/status?school_uid=...
      if (pathname === "/api/status" && req.method === "GET") {
        return await handleStatus(req, env);
      }

      // (Stubs for later)
      // if (pathname === "/api/checkout") { ... }
      // if (pathname === "/api/webhook")  { ... }
      // if (pathname === "/m/edit")       { ... }
      // if (pathname === "/api/school/update") { ... }

      return json({ error: { code: "not_found", message: "No such route" } }, 404);
    } catch (err: any) {
      return json({ error: { code: "server_error", message: err?.message || "Unexpected" } }, 500);
    }
  },
};

// ---------- handlers ----------

async function handleShortLink(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const [, , idRaw = ""] = url.pathname.split("/"); // "/s/{id}"
  const c = url.searchParams.get("c") || "";

  const resolved = await resolveUid(idRaw, env);
  const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(resolved || "");

  // count the view against the resolved ULID when we have one; otherwise skip counting
  if (isUlid) await increment(env.KV_STATS, keyForStat(resolved!, "qr_view"));

  const target = isUlid
    ? `https://navigen.io/?school=${encodeURIComponent(resolved!)}${c ? `&c=${encodeURIComponent(c)}` : ""}`
    : `https://navigen.io/?school=${encodeURIComponent(idRaw)}${c ? `&c=${encodeURIComponent(c)}` : ""}`;

  return new Response(null, {
    status: 302,
    headers: { Location: target, "Cache-Control": "public, max-age=300" }
  });
}

async function handleQr(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const raw = (url.searchParams.get("school_uid") || "").trim();
  if (!raw) return json({ error: { code: "invalid_request", message: "school_uid required" } }, 400);

  const resolved = await resolveUid(raw, env);
  const isUlid = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(resolved || "");

  const c = url.searchParams.get("c") || "";
  const fmt = (url.searchParams.get("fmt") || "svg").toLowerCase();
  const size = clamp(parseInt(url.searchParams.get("size") || "512", 10), 128, 1024);

  // ✅ ULID/alias → use /s/{uid}; otherwise fall back to /?school={raw}
  const dataUrl = isUlid
    ? `https://navigen.io/s/${encodeURIComponent(resolved!)}${c ? `?c=${encodeURIComponent(c)}` : ""}`
    : `https://navigen.io/?school=${encodeURIComponent(raw)}${c ? `&c=${encodeURIComponent(c)}` : ""}`;

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

  const school_uid = (typeof payload.school_uid === "string" && payload.school_uid.trim()) ? payload.school_uid.trim() : "";
  const event = (payload.event || "").toString();
  const action = (payload.action || "").toString();

  if (!school_uid || !event) {
    return json({ error: { code: "invalid_request", message: "school_uid and event required" } }, 400);
  }

  // Only accept known event types (open list as needed)
  const allowed = new Set(["cta_click", "qr_view", "lpm_open"]);
  if (!allowed.has(event)) {
    return json({ error: { code: "invalid_request", message: "unsupported event" } }, 400);
  }

  // bucket by action (website/booking/phone/wa/apple/waze/...)
  const bucket = event === "cta_click" ? (action || "other") : event;

  await increment(env.KV_STATS, keyForStat(school_uid, bucket));
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
  const school_uid = (await resolveUid(url.searchParams.get("school_uid") || "", env)) || "";
  if (!school_uid) return json({ error: { code: "invalid_request", message: "school_uid required" } }, 400);

  const raw = await env.KV_STATUS.get(statusKey(school_uid), "json");
  const status = raw?.status || "free";
  const tier = raw?.tier || "free";

  return json({ school_uid, status, tier }, 200, { "cache-control": "no-store" });
}

// ---------- helpers ----------

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
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

function keyForStat(school_uid: string, bucket: string): string {
  // KV is eventually consistent; this is fine for MVP. Move to Durable Object for atomicity later.
  return `stats:${school_uid}:${todayKey()}:${bucket}`;
}

function statusKey(school_uid: string): string {
  return `status:${school_uid}`;
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
  return mapped?.school_uid || null;
}

async function increment(kv: KVNamespace, key: string): Promise<void> {
  // Simple read-modify-write; good enough for MVP. Upgrade to Durable Object later.
  const current = parseInt((await kv.get(key)) || "0", 10) || 0;
  await kv.put(key, String(current + 1));
}
