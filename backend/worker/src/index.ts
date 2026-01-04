// src/index.ts
// ES module Worker: QR (/s/*, /api/qr), Analytics (/api/track), Status (/api/status)

import QRCode from "qrcode";

// Fixed event order used by API + UI
const EVENT_ORDER = [
  "lpm-open","call","email","whatsapp","telegram","messenger",
  "official","booking","newsletter",
  "facebook","instagram","pinterest","spotify","tiktok","youtube",
  "share","rating","save","unsave","map","qr-print","qr-scan","qr-view","qr-redeem",
  "redeem-confirmation-cashier",    // cashier confirmed that a redeem event completed
  "redeem-confirmation-customer"    // customer confirmed that a redeem event completed
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
  STRIPE_SECRET_KEY: string; // Stripe secret key for creating Checkout Sessions (server-only)
  STRIPE_WEBHOOK_SECRET: string; // Stripe webhook signing secret (whsec_...)
  OWNER_LINK_HMAC_SECRET: string; // HMAC secret for signed owner access links (Phase 2)
}

// --- Stripe webhook verification (HMAC SHA-256) ---
// Lead: keep verification server-side only; never expose secrets to clients.
function parseStripeSigHeader(h: string): { t: string; v1: string[] } | null {
  const parts = String(h || '').split(',').map(s => s.trim()).filter(Boolean);
  const out: { t: string; v1: string[] } = { t: '', v1: [] };
  for (const p of parts) {
    const [k, v] = p.split('=').map(s => s.trim());
    if (!k || !v) continue;
    if (k === 't') out.t = v;
    if (k === 'v1') out.v1.push(v);
  }
  if (!out.t || !out.v1.length) return null;
  return out;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(secret: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return bytesToHex(new Uint8Array(sig));
}

// Lead: Stripe tolerates minor clock skew; keep tolerance conservative.
async function verifyStripeSignature(rawBody: string, sigHeader: string, secret: string, toleranceSec = 300): Promise<boolean> {
  const parsed = parseStripeSigHeader(sigHeader);
  if (!parsed) return false;

  const ts = Number(parsed.t);
  if (!Number.isFinite(ts)) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > toleranceSec) return false;

  const signedPayload = `${parsed.t}.${rawBody}`;
  const expected = await hmacSha256Hex(secret, signedPayload);

  // accept if any v1 matches (Stripe may send multiple)
  return parsed.v1.some(v => v.toLowerCase() === expected.toLowerCase());
}

// Stripe signs the exact raw request bytes: HMAC_SHA256(secret, `${t}.${rawBody}`).
// This verifier avoids decode/re-encode mismatches and must be used for webhook authenticity checks.a
async function verifyStripeSignatureBytes(rawBody: Uint8Array, sigHeader: string, secret: string, toleranceSec = 300): Promise<boolean> {
  const parsed = parseStripeSigHeader(sigHeader);
  if (!parsed) return false;

  const ts = Number(parsed.t);
  if (!Number.isFinite(ts)) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > toleranceSec) return false;

  const enc = new TextEncoder();
  const prefix = enc.encode(`${parsed.t}.`);
  const signed = new Uint8Array(prefix.length + rawBody.length);
  signed.set(prefix, 0);
  signed.set(rawBody, prefix.length);

  const expected = await (async () => {
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, signed);
    return bytesToHex(new Uint8Array(sig));
  })();

  return parsed.v1.some(v => v.toLowerCase() === expected.toLowerCase());
}

function hexPrefix(buf: ArrayBuffer, nBytes = 4): string {
  const bytes = new Uint8Array(buf);
  const take = Math.min(bytes.length, nBytes);
  let out = '';
  for (let i = 0; i < take; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}

// --- Owner access session (Phase 2) ---
// Signed link token exchange: /owner/exchange?tok=...&sig=...
// - Verifies HMAC signature (server-only secret)
// - Enforces exp + purpose
// - Enforces single-use via ownerlink_used:<jti> (KV_STATUS)
// - Verifies active ownership via ownership:<ULID>.exclusiveUntil
// - Creates opsess:<sessionId> and sets HttpOnly cookie op_sess=<sessionId>

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSha256B64url(secret: string, msgBytes: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgBytes);
  return bytesToB64url(new Uint8Array(sig));
}

// Constant-time-ish compare to reduce timing signal. (Edge runtime; keep simple and deterministic.)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  return out === 0;
}

type OwnerLinkPayload = {
  ver: number;
  ulid: string;
  iat: number;
  exp: number;
  jti: string;
  purpose: string;
};

function parseOwnerLinkPayload(payloadBytes: Uint8Array): OwnerLinkPayload | null {
  try {
    const txt = new TextDecoder().decode(payloadBytes);
    const j = JSON.parse(txt) as any;

    const ver = Number(j?.ver);
    const ulid = String(j?.ulid || "").trim();
    const iat = Number(j?.iat);
    const exp = Number(j?.exp);
    const jti = String(j?.jti || "").trim();
    const purpose = String(j?.purpose || "").trim();

    if (!Number.isFinite(ver) || ver < 1) return null;
    if (!ULID_RE.test(ulid)) return null;
    if (!Number.isFinite(iat) || !Number.isFinite(exp)) return null;
    if (!jti) return null;
    if (purpose !== "owner-dash") return null;

    return { ver, ulid, iat, exp, jti, purpose };
  } catch {
    return null;
  }
}

function cookieSerialize(name: string, value: string, attrs: Record<string, string | boolean | number | undefined>): string {
  const parts: string[] = [`${name}=${value}`];
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (v === true) parts.push(k);
    else parts.push(`${k}=${String(v)}`);
  }
  return parts.join("; ");
}

function readCookie(header: string, name: string): string {
  const h = String(header || "");
  const parts = h.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (!k) continue;
    if (k === name) return rest.join("=").trim();
  }
  return "";
}

type OwnerSession = {
  ver: number;
  ulid: string;
  createdAt: string;
  expiresAt: string;
};

async function requireOwnerSession(req: Request, env: Env): Promise<{ ulid: string } | Response> {
  const sid = readCookie(req.headers.get("Cookie") || "", "op_sess");
  if (!sid) {
    return new Response("Denied", {
      status: 401,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }

  const sessKey = `opsess:${sid}`;
  const sess = await env.KV_STATUS.get(sessKey, { type: "json" }) as OwnerSession | null;
  if (!sess || !sess.ulid) {
    return new Response("Denied", {
      status: 401,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }

  const exp = new Date(String(sess.expiresAt || ""));
  if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) {
    // Session expired; fail closed. (We do not rely on cookie expiry alone.)
    return new Response("Denied", {
      status: 401,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }

  // Authentication only: session validity + ULID binding.
  // Campaign entitlement is enforced by the endpoint itself, not here.
  return { ulid: String(sess.ulid).trim() };
}

async function handleOwnerExchange(req: Request, env: Env): Promise<Response> {
  const u = new URL(req.url);
  const tok = (u.searchParams.get("tok") || "").trim();
  const sig = (u.searchParams.get("sig") || "").trim();

  const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

  if (!tok || !sig) {
    return new Response("Denied", { status: 400, headers: noStoreHeaders });
  }

  const secret = String(env.OWNER_LINK_HMAC_SECRET || "").trim();
  if (secret.length < 32) {
    // Misconfiguration: fail closed (do not create sessions).
    console.error("owner_exchange: secret_invalid", { secretLen: secret.length });
    return new Response("Owner exchange misconfigured", { status: 500, headers: noStoreHeaders });
  }

  // Verify signature over the *exact* tok bytes (base64url string → bytes).
  // This avoids JSON re-serialization mismatches. Issuer must sign the same tok bytes.
  let tokBytes: Uint8Array;
  try {
    tokBytes = b64urlToBytes(tok);
  } catch {
    return new Response("Denied", { status: 400, headers: noStoreHeaders });
  }

  const expected = await hmacSha256B64url(secret, tokBytes);
  if (!safeEqual(expected, sig)) {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }

  const payload = parseOwnerLinkPayload(tokBytes);
  if (!payload) {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > payload.exp) {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }

  // Enforce single-use
  const usedKey = `ownerlink_used:${payload.jti}`;
  const used = await env.KV_STATUS.get(usedKey);
  if (used) {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }

  // Verify active ownership
  const ownKey = `ownership:${payload.ulid}`;
  const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }

  // Create sessionId (unguessable)
  const sidBytes = new Uint8Array(18);
  (crypto as any).getRandomValues(sidBytes);
  const sessionId = bytesToB64url(sidBytes);

  const createdAt = new Date();
  // Phase 2: session expiry MUST NOT exceed ownership.exclusiveUntil.
  const expiresAt = exclusiveUntil;

  const sessKey = `opsess:${sessionId}`;
  const sessVal = {
    ver: 1,
    ulid: payload.ulid,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  // Compute Max-Age (seconds), bounded and non-negative
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - createdAt.getTime()) / 1000));

  // Two-step write; ensure ownerlink_used is not written unless session is created.
  try {
    await env.KV_STATUS.put(sessKey, JSON.stringify(sessVal), { expirationTtl: Math.max(60, maxAge) });

    try {
      await env.KV_STATUS.put(
        usedKey,
        JSON.stringify({ ulid: payload.ulid, usedAt: createdAt.toISOString() }),
        { expirationTtl: 60 * 60 * 24 * 7 } // keep single-use markers for a week
      );
    } catch (e) {
      // Fail closed: do not leave an orphan session if single-use marker failed.
      try { await env.KV_STATUS.delete(sessKey); } catch {}
      throw e;
    }
  } catch {
    return new Response("Denied", { status: 500, headers: noStoreHeaders });
  }

  const cookie = cookieSerialize("op_sess", sessionId, {
    Path: "/",
    HttpOnly: true,
    Secure: true,
    SameSite: "Lax",
    "Max-Age": maxAge
  });

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": cookie,
      "Location": `/dash/${encodeURIComponent(payload.ulid)}`,
      ...noStoreHeaders
    }
  });
}

async function handleOwnerStripeExchange(req: Request, env: Env): Promise<Response> {
  const u = new URL(req.url);
  const sid = String(u.searchParams.get("sid") || "").trim();
  const nextRaw = String(u.searchParams.get("next") || "").trim();

  const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

  if (!sid) return new Response("Denied", { status: 400, headers: noStoreHeaders });

  // Prevent open redirects: allow only same-origin relative paths.
  const isSafeNext = (p: string) =>
    p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\");
  const next = (nextRaw && isSafeNext(nextRaw)) ? nextRaw : "";

  const sk = String((env as any).STRIPE_SECRET_KEY || "").trim();
  if (!sk) return new Response("Misconfigured", { status: 500, headers: noStoreHeaders });

  // Fetch Stripe Checkout Session and verify payment.
  const stripeUrl = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sid)}`;
  const r = await fetch(stripeUrl, {
    method: "GET",
    headers: { "Authorization": `Bearer ${sk}` }
  });

  const txt = await r.text();
  let sess: any = null;
  try { sess = JSON.parse(txt); } catch { sess = null; }
  if (!r.ok || !sess) return new Response("Denied", { status: 403, headers: noStoreHeaders });

  const paymentStatus = String(sess?.payment_status || "").toLowerCase();
  const status = String(sess?.status || "").toLowerCase();
  if (paymentStatus !== "paid" || status !== "complete") {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }

  const meta = sess?.metadata || {};
  const locationID = String(meta?.locationID || "").trim();
  if (!locationID) return new Response("Denied", { status: 403, headers: noStoreHeaders });

  // Resolve slug → ULID (aliases are preseeded by design).
  const ulid = await resolveUid(locationID, env);
  if (!ulid) return new Response("Denied", { status: 403, headers: noStoreHeaders });

  // Verify active ownership (defense-in-depth).
  const ownKey = `ownership:${ulid}`;
  const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
    return new Response("Denied", { status: 403, headers: noStoreHeaders });
  }

  // Create sessionId (unguessable) and store opsess:<sid> (same as /owner/exchange).
  const sidBytes = new Uint8Array(18);
  (crypto as any).getRandomValues(sidBytes);
  const sessionId = bytesToB64url(sidBytes);

  const createdAt = new Date();
  const expiresAt = exclusiveUntil;

  const sessKey = `opsess:${sessionId}`;
  const sessVal = {
    ver: 1,
    ulid,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - createdAt.getTime()) / 1000));
  try {
    await env.KV_STATUS.put(sessKey, JSON.stringify(sessVal), { expirationTtl: Math.max(60, maxAge) });
  } catch {
    return new Response("Denied", { status: 500, headers: noStoreHeaders });
  }

  const cookie = cookieSerialize("op_sess", sessionId, {
    Path: "/",
    HttpOnly: true,
    Secure: true,
    SameSite: "Lax",
    "Max-Age": maxAge
  });

  return new Response(null, {
    status: 302,
    headers: {
      "Set-Cookie": cookie,
      "Location": next || `/dash/${encodeURIComponent(ulid)}`,
      ...noStoreHeaders
    }
  });
}

// --- Ownership writer (Phase 1): KV_STATUS keys ---
// - ownership:<ULID>
// - stripe_processed:<payment_intent.id>
async function handleStripeWebhook(req: Request, env: Env): Promise<Response> {
  const sig = req.headers.get('Stripe-Signature') || '';
  if (!sig) {
    const u = new URL(req.url);
    console.warn('stripe_webhook: missing_signature_header', { host: u.host, path: u.pathname });
    return new Response('Missing Stripe-Signature header', { status: 400 });
  }

  // Raw body is required for signature verification
  const rawBuf = await req.arrayBuffer();
  const rawBytes = new Uint8Array(rawBuf);
  // Decode once for optional text-based verification fallback (do NOT parse until verified).
  const rawText = new TextDecoder().decode(rawBytes);

  // Verify against raw bytes (Stripe signs exact bytes)
  let secretRaw = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
  // Guard against accidental surrounding quotes (common when pasting secrets via shells/UIs).
  if (
    (secretRaw.startsWith('"') && secretRaw.endsWith('"')) ||
    (secretRaw.startsWith("'") && secretRaw.endsWith("'")) ||
    (secretRaw.startsWith("`") && secretRaw.endsWith("`"))
  ) {
    secretRaw = secretRaw.slice(1, -1).trim();
  }

  // Safe fingerprint: lets us confirm which secret is deployed without exposing it.
  const enc = new TextEncoder();
  const secretFpBuf = await crypto.subtle.digest('SHA-256', enc.encode(secretRaw));
  const secretFp = hexPrefix(secretFpBuf, 6); // 12 hex chars

  // Reject obviously invalid/misconfigured secrets early.
  // Stripe webhook signing secrets are "whsec_..." and are long; anything else is a config error.
  if (secretRaw.length < 20 || !secretRaw.startsWith("whsec_")) {
    console.error("stripe_webhook: secret_invalid", { secretLen: secretRaw.length, secretFp });
    return new Response("Stripe webhook secret invalid/misconfigured", { status: 500 });
  }

  // Allow a comma/whitespace-separated list to support safe multi-env deployments (test+live).
  const secrets = secretRaw.split(/[\s,]+/g).map(s => s.trim()).filter(Boolean);

  // Per-secret fingerprinting (safe): helps identify which candidate secrets are present.
  const secretFps: string[] = [];
  for (const s of secrets) {
    const b = await crypto.subtle.digest('SHA-256', enc.encode(s));
    secretFps.push(hexPrefix(b, 6)); // 12 hex chars each
  }

  // Fail loudly if the secret is not configured. (A silent 400 looks like a bad Stripe delivery.)
  if (!secrets.length) {
    const u = new URL(req.url);
    console.error('stripe_webhook: secret_not_configured', { host: u.host, path: u.pathname });
    return new Response('Stripe webhook secret not configured', { status: 500 });
  }

  let ok = false;
  let verifyMode: 'bytes' | 'text' | null = null;
  let bytesOk = false;
  let textOk = false;

  for (const s of secrets) {
    // Try bytes first (canonical)
    bytesOk = await verifyStripeSignatureBytes(rawBytes, sig, s);
    if (bytesOk) { ok = true; verifyMode = 'bytes'; break; }

    // Then try text fallback (diagnostic)
    textOk = await verifyStripeSignature(rawText, sig, s);
    if (textOk) { ok = true; verifyMode = 'text'; break; }
  }

  if (!ok) {
    const u = new URL(req.url);

    // Parse Stripe timestamp to detect tolerance/skew issues (without trusting clocks blindly).
    let ts: number | null = null;
    try {
      const parsed = parseStripeSigHeader(sig);
      ts = parsed ? Number(parsed.t) : null;
      if (ts !== null && !Number.isFinite(ts)) ts = null;
    } catch {
      ts = null;
    }

    const nowSec = Math.floor(Date.now() / 1000);

    const parsedForLog = parseStripeSigHeader(sig);
    console.warn('stripe_webhook: sig_invalid', {
      host: u.host,
      path: u.pathname,
      skewSec: ts === null ? null : (nowSec - ts),
      contentEncoding: req.headers.get('content-encoding') || null,
      contentType: req.headers.get('content-type') || null,
      bodyLen: rawBytes.length,

      // Header parse diagnostics
      sigParsed: !!parsedForLog,
      v1Count: parsedForLog?.v1?.length || 0,
      stripeAccount: req.headers.get("Stripe-Account") || "",

      // Secret diagnostics
      secretsCount: secrets.length,
      secretFp,          // keep legacy combined fingerprint
      secretFps,         // per-candidate fingerprints (safe)
      bytesOk,
      textOk
    });

    return new Response('Invalid Stripe signature', {
      status: 400,
      headers: {
        // Safe diagnostics: helps prove which secret is deployed and whether header parse looks sane.
        "x-ng-secretfp": secretFp,
        "x-ng-secretfps": secretFps.join(","),      // per-candidate fingerprints
        "x-ng-secrets": String(secrets.length),
        "x-ng-worker": "navigen-api",
        "x-ng-sigparsed": String(!!parsedForLog),
        "x-ng-v1count": String(parsedForLog?.v1?.length || 0),

        "x-ng-verify": verifyMode || "",
        "x-ng-skewsec": String(ts === null ? "" : (nowSec - ts)),
        "x-ng-encoding": req.headers.get("content-encoding") || "",
        "x-ng-bodylen": String(rawBytes.length)
      }
    });
  }

  const rawBody = new TextDecoder().decode(rawBytes); // decode only after signature verification
  let evt: any = null;
  try { evt = JSON.parse(rawBody); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const type = String(evt?.type || '').trim();
  // Phase 1: only accept checkout.session.completed as ownership-confirming
  if (type !== 'checkout.session.completed') return new Response('Ignored', { status: 200 });

  const session = evt?.data?.object || {};
  const paymentIntentId = String(session?.payment_intent || '').trim();
  if (!paymentIntentId) return new Response('Missing payment_intent', { status: 400 });

  const meta = (session?.metadata && typeof session.metadata === 'object') ? session.metadata : {};
  const locationID = String(meta.locationID || '').trim();
  const ownershipSource = String(meta.ownershipSource || '').trim();   // "campaign" | "exclusive"
  const initiationType = String(meta.initiationType || '').trim();     // "owner" | "agent" | "platform"

  // Non-ownership checkouts (e.g. donations) may have empty metadata.
  // We must acknowledge the webhook to prevent Stripe retries and simply ignore it.
  if (!locationID || !ownershipSource || !initiationType) {
    return new Response('Ignored (no ownership metadata)', { status: 200 });
  }

  // Resolve slug → ULID (authoritative)
  const ulid = await resolveUid(locationID, env);
  if (!ulid || !/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(ulid)) {
    return new Response('locationID did not resolve to a canonical ULID', { status: 400 });
  }

  // Idempotency
  const idemKey = `stripe_processed:${paymentIntentId}`;
  const seen = await env.KV_STATUS.get(idemKey);
  if (seen) return new Response('OK', { status: 200 });

  const ownKey = `ownership:${ulid}`;
  const current = await env.KV_STATUS.get(ownKey, { type: 'json' }) as any;

  const now = new Date();
  const curUntil = current?.exclusiveUntil ? new Date(String(current.exclusiveUntil)) : null;
  const base = (curUntil && !Number.isNaN(curUntil.getTime()) && curUntil > now) ? curUntil : now;

  // Phase 1: minimum ownership extension = 30 days (campaign coverage logic can expand later)
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const newUntil = new Date(base.getTime() + THIRTY_DAYS_MS);

  const rec = {
    uid: ulid,
    state: 'owned',
    exclusiveUntil: newUntil.toISOString(),
    source: ownershipSource,
    lastEventId: paymentIntentId,
    updatedAt: now.toISOString()
  };

  // Write ownership first; only then write idempotency marker
  await env.KV_STATUS.put(ownKey, JSON.stringify(rec));
  await env.KV_STATUS.put(idemKey, JSON.stringify({
    paymentIntentId,
    ulid,
    ownershipSource,
    processedAt: now.toISOString()
  }));

  return new Response('OK', { status: 200, headers: { "x-ng-verify": verifyMode || "" } });
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
      // --- Stripe diag: /api/_diag/stripe-secret (safe fingerprint only)
      if (normPath === "/api/_diag/stripe-secret" && req.method === "GET") {
        const secretRaw = (env.STRIPE_WEBHOOK_SECRET || "").trim();
        const enc = new TextEncoder();
        const fpBuf = await crypto.subtle.digest("SHA-256", enc.encode(secretRaw));
        const fp = hexPrefix(fpBuf, 6);
        return new Response(JSON.stringify({
          hasSecret: !!secretRaw,
          secretLen: secretRaw.length,
          secretFp: fp
        }), { status: 200, headers: { "content-type": "application/json", "x-ng-worker": "navigen-api" } });
      }

      // --- Owner exchange: /owner/exchange (Phase 2: signed link → cookie session)
      if (normPath === "/owner/exchange" && req.method === "GET") {
        return await handleOwnerExchange(req, env);
      }

      // --- Owner exchange from Stripe Checkout (Phase 5: sid → cookie session)
      if (normPath === "/owner/stripe-exchange" && req.method === "GET") {
        return await handleOwnerStripeExchange(req, env);
      }

      // --- Stripe webhook: /api/stripe/webhook (Phase 1: ownership writer)
      if (normPath === "/api/stripe/webhook" && req.method === "POST") {
        return await handleStripeWebhook(req, env);
      }

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

        // Promo access is owner-gated: require active ownership window.
        {
          const ownKey = `ownership:${locULID}`;
          const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

          const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
          const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;

          if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
            return json(
              { error: { code: "forbidden", message: "campaign required" } },
              403,
              { "cache-control": "no-store" }
            );
          }
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

        // Record that a promotion QR was shown (ARMED) for this campaign/location
        await logQrArmed(env.KV_STATS, env, locULID, req, chosenKey);

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
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          // Misconfiguration must be explicit; otherwise you chase ghosts.
          return json({ error:{ code:"misconfigured", message:"JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error:{ code:"forbidden", message:"Bad token" } }, 403, { "cache-control": "no-store" });
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
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          // Misconfiguration must be explicit; otherwise you chase ghosts.
          return json({ error:{ code:"misconfigured", message:"JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error:{ code:"forbidden", message:"Bad token" } }, 403, { "cache-control": "no-store" });
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
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          // Misconfiguration must be explicit; otherwise you chase ghosts.
          return json({ error:{ code:"misconfigured", message:"JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error:{ code:"forbidden", message:"Bad token" } }, 403, { "cache-control": "no-store" });
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

      // (removed) /api/admin/diag-auth — temporary Phase 2 test endpoint

      // (removed) /api/admin/mint-owner-link — temporary Phase 2 test endpoint

        // (removed) leftover mint-owner-link body (fully deleted)

      // GET /api/stats?locationID=.
      // Phase 3: owner session required; requested location must match the session ULID.
      if (url.pathname === "/api/stats" && req.method === "GET") {
        // Allow Example Locations without a session (real stats; no synthetic data).
        // For all non-example locations, require an owner session (fail closed).
        let auth: { ulid: string } | null = null;

        const locRaw = (url.searchParams.get("locationID") || "").trim();
        const locResolved = (await resolveUid(locRaw, env)) || locRaw;
        const loc = String(locResolved || "").trim();

        let isExample = false;
        try {
          // Load profiles.json once and check the example flag for this location.
          const base = req.headers.get("Origin") || "https://navigen.io";
          const src = new URL("/data/profiles.json", base).toString();
          const resp = await fetch(src, { cf: { cacheTtl: 60, cacheEverything: true }, headers: { "Accept": "application/json" } });
          if (resp.ok) {
            const data: any = await resp.json().catch(() => null);
            const locs: any[] = Array.isArray(data?.locations)
              ? data.locations
              : (data?.locations && typeof data.locations === "object")
                ? Object.values(data.locations)
                : [];

            const rec = locs.find(r => String(r?.locationID || "").trim() === locRaw || String(r?.ID || r?.id || "").trim() === locRaw || String(r?.ID || r?.id || "").trim() === loc);
            const v = rec?.exampleLocation ?? rec?.isExample ?? rec?.example ?? rec?.exampleDash ?? rec?.flags?.example;
            isExample = (v === true || v === 1 || String(v || "").toLowerCase() === "true" || String(v || "").toLowerCase() === "yes");
          }
        } catch {
          isExample = false; // fail closed
        }

        if (!isExample) {
          const a = await requireOwnerSession(req, env);
          if (a instanceof Response) return a;
          auth = a;
        }
        if (auth instanceof Response) return auth;

        // locRaw resolved above

        // locResolved resolved above

        // loc resolved above

        if (!loc || !/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(loc)) {
          return json({ error: { code: "invalid_request", message: "locationID, from, to required (YYYY-MM-DD)" } }, 400);
        }

        // Enforce single-ULID session binding
        if (auth && loc !== auth.ulid) {
          return new Response("Denied", {
            status: 403,
            headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
          });
        }

        // Enforce campaign entitlement (Dash access gate)
        {
          const ownKey = `ownership:${loc}`;
          const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

          const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
          const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;

          if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
            return new Response("Campaign required", {
              status: 403,
              headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
            });
          }
        }

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
          armed: number;                 // how many times a promotion QR was shown (ARMED)
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
                armed: 0,                         // promo QR shown counter
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

            // Promo QR shown (ARMED): track how many times a promotion QR was displayed
            if (entry.signal === "armed") {
              agg.armed += 1;
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
        const campaignAggValues = Object.values(campaignsAgg);

        // Aggregate promo QR + redeem metrics across all campaigns for QA tagging.
        let totalArmed = 0;
        let totalRedeems = 0;
        let totalInvalid = 0;
        for (const agg of campaignAggValues) {
          if ((agg.campaignKey || "").trim() === "") continue; // ignore "_no_campaign"
          totalArmed += agg.armed;
          totalRedeems += agg.redemptions;
          totalInvalid += agg.invalids;
        }

        const campaigns = campaignAggValues
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
              armed: agg.armed,                     // Promo QR shown (ARMED)
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

        // Silent QA auto-tagging per location (internal only: admin dashboards, monitoring).
        try {
          const hasPromoActivity = totalArmed > 0 || totalRedeems > 0 || totalInvalid > 0;
          if (hasPromoActivity) {
            // Sum confirmation metrics from daily buckets
            let cashierConfs = 0;
            let customerConfs = 0;
            for (const dayKey of Object.keys(days)) {
              const bucket: any = (days as any)[dayKey] || {};
              const cashierVal = Number(bucket["redeem-confirmation-cashier"] ?? bucket["redeem_confirmation_cashier"] ?? 0);
              const customerVal = Number(bucket["redeem-confirmation-customer"] ?? bucket["redeem_confirmation_customer"] ?? 0);
              if (cashierVal) cashierConfs += cashierVal;
              if (customerVal) customerConfs += customerVal;
            }

            const totalRedeemAttempts = totalRedeems + totalInvalid;
            const complianceRatio = totalArmed > 0 ? (totalRedeems / totalArmed) : null;
            const invalidRatio = totalRedeemAttempts > 0 ? (totalInvalid / totalRedeemAttempts) : 0;
            const cashierCoverage = totalRedeems > 0 ? (cashierConfs / totalRedeems) : null;
            const customerCoverage = totalArmed > 0 ? (customerConfs / totalArmed) : null;

            const flags: string[] = [];

            if (complianceRatio !== null && complianceRatio < 0.7) {
              flags.push("low-scan-discipline");
            }
            if (invalidRatio > 0.10 && totalInvalid >= 3) {
              flags.push("high-invalid-attempts");
            }
            if (cashierCoverage !== null && cashierCoverage < 0.8) {
              flags.push("low-cashier-coverage");
            }
            if (customerCoverage !== null && totalArmed >= 10 && customerCoverage < 0.5) {
              flags.push("low-customer-confirmation");
            }

            if (!flags.length) {
              flags.push("qa-ok");
            }

            // Fire-and-forget: do not delay the stats response.
            ctx.waitUntil(writeQaFlags(env, loc, flags));
          }
        } catch {
          // tagging errors must never break stats
        }

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
      // Phase 3: owner session required; entity access allowed only if the session ULID is in entity:<id>:locations.
      if (url.pathname === "/api/stats/entity" && req.method === "GET") {
        const auth = await requireOwnerSession(req, env);
        if (auth instanceof Response) return auth;

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

        // Single-ULID session binding: entity sums are allowed only if the session ULID is explicitly part of the entity.
        if (!Array.isArray(locs) || !locs.includes(auth.ulid)) {
          return new Response("Denied", {
            status: 403,
            headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
          });
        }

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

      // --- Redeem token status: GET /api/redeem-status?token=... (or &rt=...)
      // Used by the customer device to detect when a promo QR token was actually redeemed.
      if (pathname === "/api/redeem-status" && req.method === "GET") {
        const u = new URL(req.url);
        const token =
          (u.searchParams.get("token") || "").trim() ||
          (u.searchParams.get("rt") || "").trim();

        if (!token) {
          return json(
            { error: { code: "invalid_request", message: "token required" } },
            400
          );
        }

        const key = `redeem:${token}`;
        const raw = await env.KV_STATS.get(key, "text");

        let status: "pending" | "redeemed" | "invalid" = "invalid";
        if (raw) {
          try {
            const rec = JSON.parse(raw) as RedeemTokenRecord;
            if (rec && rec.status === "fresh") status = "pending";
            else if (rec && rec.status === "redeemed") status = "redeemed";
            else status = "invalid";
          } catch {
            status = "invalid";
          }
        }

        return json({ token, status }, 200);
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

          // Promo redeem must be owner-gated: require active ownership window.
          {
            const ownKey = `ownership:${loc}`;
            const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

            const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
            const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;

            if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
              // Fail closed: log as invalid and return (no redeem, no billing).
              await logQrRedeemInvalid(env.KV_STATS, env, loc, req);
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

      // --- Stripe: create Checkout Session for campaign purchase (Phase 5)
      // Server-only: uses STRIPE_SECRET_KEY; client never sees Stripe secret.
      if (normPath === "/api/stripe/create-checkout-session" && req.method === "POST") {
        const noStore = { "cache-control": "no-store" };

        // Fail closed if not configured
        const sk = String((env as any).STRIPE_SECRET_KEY || "").trim();
        if (!sk) return json({ error: { code: "misconfigured", message: "STRIPE_SECRET_KEY not set" } }, 500, noStore);

        const body = await req.json().catch(() => null) as any;
        const locationID = String(body?.locationID || "").trim();           // MUST be slug (no ULID)
        const campaignKey = String(body?.campaignKey || "").trim();         // required for ownershipSource="campaign"
        const initiationType = String(body?.initiationType || "").trim();   // "owner"
        const ownershipSource = String(body?.ownershipSource || "").trim(); // "campaign"
        const navigenVersion = String(body?.navigenVersion || "").trim() || "phase5";

        if (!locationID || !campaignKey || initiationType !== "owner" || ownershipSource !== "campaign") {
          return json({ error: { code: "invalid_request", message: "locationID, campaignKey, initiationType='owner', ownershipSource='campaign' required" } }, 400, noStore);
        }

        // Enforce the spec invariant: clients must never supply ULIDs as locationID
        if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(locationID)) {
          return json({ error: { code: "invalid_request", message: "locationID must be a slug, not a ULID" } }, 400, noStore);
        }

        // Price: €50 / 30 days (spec: Campaign) — single fixed SKU for now
        const amountCents = 100; // Kept at €1.00 for testing €50.00
        const currency = "eur";

        // Build redirect URLs on the web app origin (not the API Worker origin)
        const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
        // IMPORTANT: keep {CHECKOUT_SESSION_ID} unencoded or Stripe will not substitute it.
        const successUrl =
          `${siteOrigin}/?flow=campaign` +
          `&locationID=${encodeURIComponent(locationID)}` +
          `&sid={CHECKOUT_SESSION_ID}`;


        const cancelUrl = new URL("/", siteOrigin);
        cancelUrl.searchParams.set("flow", "campaign");
        cancelUrl.searchParams.set("locationID", locationID);
        cancelUrl.searchParams.set("canceled", "1");

        // Stripe Checkout Session create (no SDK; direct API call)
        const form = new URLSearchParams();
        form.set("mode", "payment");
        form.set("customer_creation", "if_required");
        form.set("billing_address_collection", "auto");
        form.set("success_url", successUrl);
        form.set("cancel_url", cancelUrl.toString());

        // One line item (fixed amount)
        form.set("line_items[0][quantity]", "1");
        form.set("line_items[0][price_data][currency]", currency);
        form.set("line_items[0][price_data][unit_amount]", String(amountCents));
        form.set("line_items[0][price_data][product_data][name]", "NaviGen Campaign — 30 days");

        // Metadata contract (MUST be copied to PaymentIntent)
        form.set("metadata[locationID]", locationID);
        form.set("metadata[campaignKey]", campaignKey);
        form.set("metadata[initiationType]", initiationType);
        form.set("metadata[ownershipSource]", ownershipSource);
        form.set("metadata[navigenVersion]", navigenVersion);

        // Ensure metadata is also on PaymentIntent (spec requirement)
        form.set("payment_intent_data[metadata][locationID]", locationID);
        form.set("payment_intent_data[metadata][campaignKey]", campaignKey);
        form.set("payment_intent_data[metadata][initiationType]", initiationType);
        form.set("payment_intent_data[metadata][ownershipSource]", ownershipSource);
        form.set("payment_intent_data[metadata][navigenVersion]", navigenVersion);

        const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sk}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: form.toString()
        });

        const txt = await r.text();
        let out: any = null;
        try { out = JSON.parse(txt); } catch { out = null; }

        if (!r.ok || !out?.id) {
          // fail closed; do not leak secrets; return Stripe error code/message only
          return json({ error: { code: "stripe_error", message: String(out?.error?.message || "Stripe create session failed") } }, 502, noStore);
        }

        return json({ sessionId: out.id }, 200, noStore);
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

        // Discoverability policy (Business-first):
        // Filter out locations whose visibilityState is "hidden" so inactive businesses do not appear in discovery lists.
        // This does not affect direct-link LPM access; it only controls in-app discovery surfaces.
        let outBody = body;

        try {
          // Only filter successful JSON responses.
          if (r.ok) {
            const parsed = JSON.parse(body);

            const arr: any[] = Array.isArray(parsed?.locations)
              ? parsed.locations
              : (parsed?.locations && typeof parsed.locations === "object")
                ? Object.values(parsed.locations)
                : [];

            const filtered: any[] = [];
            for (const rec of arr) {
              const slug = String(rec?.locationID || "").trim();
              const ulid = (await resolveUid(slug, env)) || ""; // canonical ULID (required for ownership lookup)

              // If we can't resolve a ULID, fail open (keep visible).
              if (!ulid || !/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(ulid)) {
                filtered.push(rec);
                continue;
              }

              const vis = await computeVisibilityState(env, ulid);
              if (vis.visibilityState !== "hidden") filtered.push(rec);
            }

            // Preserve original shape: if upstream returned { locations: [...] }, keep that.
            outBody = JSON.stringify({ ...parsed, locations: filtered });
          }
        } catch {
          // Fail open: never break list loading due to a filtering error.
          outBody = body;
        }

        return new Response(outBody, {
          status: r.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
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
  const idRaw = String(idParam || "").trim();
  const locID = ULID_RE.test(idRaw) ? idRaw : ((await resolveUid(idRaw, env)) || "");  
  if (!locID) return json({ error: { code: "invalid_request", message: "locationID required" } }, 400);

  const raw = await env.KV_STATUS.get(statusKey(locID), "json");
  const status = raw?.status || "free";
  const tier = raw?.tier || "free";

  // return minimal status payload for the app (no caching to reflect live changes)
  const vis = await computeVisibilityState(env, locID);

  return json(
    {
      locationID: locID,
      status,
      tier,
      ownedNow: vis.ownedNow,
      visibilityState: vis.visibilityState,
      exclusiveUntil: vis.exclusiveUntil,
      courtesyUntil: vis.courtesyUntil
    },
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

// Silent QA auto-tagging: store per-location QA flags alongside status/tier in KV_STATUS.
// Flags are internal-only (admin dashboards, monitoring); merchants never see them.
async function writeQaFlags(env: Env, locationID: string, flags: string[]): Promise<void> {
  try {
    const key = statusKey(locationID);
    const raw = await env.KV_STATUS.get(key, "json");
    const base: any = raw && typeof raw === "object" ? raw : {};

    const next = {
      ...base,
      qaFlags: Array.isArray(flags) ? flags : [],
      qaUpdatedAt: new Date().toISOString()
    };

    await env.KV_STATUS.put(key, JSON.stringify(next));
  } catch {
    // never throw from QA tagging; stats endpoint must not fail because of tagging
  }
}

// Visibility policy (Business-first):
// - "promoted": campaign/exclusive operation is active (paid window).
// - "visible": courtesy visibility after paid window ends (Y=2 → 60 days).
// - "hidden": not discoverable inside NaviGen (direct link may still open LPM later).
// This is a NaviGen-internal discoverability concept, not web indexing.
type VisibilityState = "promoted" | "visible" | "hidden";

async function computeVisibilityState(env: Env, ulid: string, nowMs = Date.now()): Promise<{
  visibilityState: VisibilityState;
  ownedNow: boolean;
  exclusiveUntil: string;   // ISO or ""
  courtesyUntil: string;    // ISO or ""
}> {
  // Courtesy window approved: Y = 2 → 60 days
  const COURTESY_MS = 60 * 24 * 60 * 60 * 1000;

  const ownKey = `ownership:${ulid}`;
  const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;

  // No ownership record → treat as publicly discoverable.
  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime())) {
    return {
      visibilityState: "visible",
      ownedNow: false,
      exclusiveUntil: "",
      courtesyUntil: ""
    };
  }

  const ownedNow = exclusiveUntil.getTime() > nowMs;
  if (ownedNow) {
    return {
      visibilityState: "promoted",
      ownedNow: true,
      exclusiveUntil: exclusiveUntil.toISOString(),
      courtesyUntil: new Date(exclusiveUntil.getTime() + COURTESY_MS).toISOString()
    };
  }

  const courtesyUntil = new Date(exclusiveUntil.getTime() + COURTESY_MS);
  const isCourtesy = courtesyUntil.getTime() > nowMs;

  return {
    visibilityState: isCourtesy ? "visible" : "hidden",
    ownedNow: false,
    exclusiveUntil: exclusiveUntil.toISOString(),
    courtesyUntil: courtesyUntil.toISOString()
  };
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

    // Info QR scans must remain detached from campaigns
    const campaignKey = ""; // Info QR scans must never attach to campaigns

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
 * Log that a promotion QR was shown (ARMED) for a given campaign.
 * This is called when /api/promo-qr is used to generate a promo QR code.
 */
async function logQrArmed(
  kv: KVNamespace,
  _env: Env,
  loc: string,
  req: Request,
  campaignKey: string
): Promise<void> {
  try {
    const now = new Date();
    const day = dayKeyFor(now, undefined, (req as any).cf?.country || "");
    const timeISO = now.toISOString();

    const ua = req.headers.get("User-Agent") || "";
    const lang = req.headers.get("Accept-Language") || "";

    const country = ((req as any).cf?.country || "").toString();
    const city = ((req as any).cf?.city || "").toString();
    const source = "qr-redeem"; // same logical family as promotion QR
    const signal = "armed";     // distinguishes promo QR shown from scans/redeems

    const visitor = `${ua}|${country}`;

    // explicit campaignKey: promo QR is always tied to a campaign
    const keyBytes = new Uint8Array(6);
    (crypto as any).getRandomValues(keyBytes);
    const scanId = Array.from(keyBytes).map(b => b.toString(16).padStart(2, "0")).join("");

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
    const ttlSeconds = 56 * 24 * 60 * 60; // align with other QR logs (~8 weeks)
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
