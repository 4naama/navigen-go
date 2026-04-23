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
}

// --- Plan persistence (Phase 8 prerequisite) ---
// Authoritative source: Stripe Checkout Session line items (price.id) at reconciliation time.
// Publish MUST NOT call Stripe; publish reads plan:<payment_intent.id> from KV_STATUS.

type PlanTier = "standard" | "multi" | "large" | "network" | "unknown";

type PlanRecord = {
  priceId: string;
  tier: PlanTier;
  maxPublishedLocations: number;
  purchasedAt: string; // ISO
  expiresAt: string;   // ISO (must equal ownership.exclusiveUntil for same payment)
  initiationType: string;
  campaignPreset: string;
};

// Stripe price.id values from the Dashboard.
// Fail-closed behavior for publish is enforced by maxPublishedLocations=0 when unknown.
const PRICE_ID_TO_PLAN: Record<string, { tier: PlanTier; maxPublishedLocations: number }> = {
  "price_1TDfBIFf2RZOYEdOobudnFRW": { tier: "standard", maxPublishedLocations: 1 },     // TESTING: real Stripe price id for €1
  "price_1TDfBtFf2RZOYEdOGIfPn6uu": { tier: "multi",    maxPublishedLocations: 3 },     // TESTING: real Stripe price id for €2
  "price_1TDfDfFf2RZOYEdOFicVRcQ8": { tier: "large",    maxPublishedLocations: 10 },    // TESTING: real Stripe price id for €319
  "price_1TDfFaFf2RZOYEdOXzIMBxbO": { tier: "network",  maxPublishedLocations: 10000 }, // TESTING: real Stripe price id for €749
};

// Plan chooser codes are BO-facing; price ids are Worker-authoritative.
// Keep this mapping centralized so checkout, restore, and enforcement resolve the same tier contract.
const PLAN_CODE_TO_PRICE_ID: Record<string, string> = {
  standard: "price_1TDfBIFf2RZOYEdOobudnFRW", // TESTING: real Stripe price id for €1
  multi: "price_1TDfBtFf2RZOYEdOGIfPn6uu",   // TESTING: real Stripe price id for €2
  large: "price_1TDfDfFf2RZOYEdOFicVRcQ8",   // TESTING: real Stripe price id for €319
  network: "price_1TDfFaFf2RZOYEdOXzIMBxbO"  // TESTING: real Stripe price id for €749
};

function normalizePlanTier(v: unknown): PlanTier {
  const s = String(v || "").trim().toLowerCase();
  if (s === "standard" || s === "multi" || s === "large" || s === "network") return s;
  return "unknown";
}

function planDefinitionForCode(planCode: unknown): { code: string; priceId: string; tier: PlanTier; maxPublishedLocations: number } | null {
  const code = String(planCode || "").trim().toLowerCase();
  const priceId = String(PLAN_CODE_TO_PRICE_ID[code] || "").trim();
  if (!priceId) return null;

  const mapped = PRICE_ID_TO_PLAN[priceId];
  if (!mapped) return null;

  return {
    code,
    priceId,
    tier: normalizePlanTier(mapped.tier),
    maxPublishedLocations: Math.max(0, Number(mapped.maxPublishedLocations || 0) || 0)
  };
}

async function fetchStripeCheckoutLineItemPriceId(sk: string, checkoutSessionId: string): Promise<string> {
  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(checkoutSessionId)}/line_items?limit=1`;
  const r = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${sk}` } });
  const txt = await r.text();
  let j: any = null;
  try { j = JSON.parse(txt); } catch { j = null; }

  if (!r.ok) throw new Error(`stripe_line_items_fetch_failed:${r.status}`);
  const item = j?.data && Array.isArray(j.data) && j.data.length ? j.data[0] : null;

  // Stripe line item structure: item.price.id OR item.price (string) depending on API version
  const priceId = String(item?.price?.id || item?.price || "").trim();
  if (!priceId) throw new Error("stripe_line_items_missing_price_id");
  return priceId;
}

async function persistPlanRecord(
  env: Env,
  sk: string,
  checkoutSessionId: string,
  paymentIntentId: string,
  expiresAtIso: string,
  provenance?: { initiationType?: unknown; campaignPreset?: unknown }
): Promise<PlanRecord> {
  const priceId = await fetchStripeCheckoutLineItemPriceId(sk, checkoutSessionId);

  const mapped = PRICE_ID_TO_PLAN[priceId];
  const tier: PlanTier = mapped?.tier || "unknown";
  const maxPublishedLocations = mapped?.maxPublishedLocations ?? 0;
  const initiationType = String(provenance?.initiationType || "").trim();
  const campaignPreset = String(provenance?.campaignPreset || "").trim();

  const rec: PlanRecord = {
    priceId,
    tier,
    maxPublishedLocations,
    purchasedAt: new Date().toISOString(),
    expiresAt: expiresAtIso,
    initiationType,
    campaignPreset
  };

  await env.KV_STATUS.put(`plan:${paymentIntentId}`, JSON.stringify(rec));
  return rec;
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
// Real-time owner access uses /owner/stripe-exchange.
// Cross-device or later recovery uses /owner/restore with PaymentIntent id (pi_*).
// Both flows mint the same HttpOnly op_sess cookie and bind one ULID per device session.

const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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

function readDeviceId(req: Request): string {
  const dev = readCookie(req.headers.get("Cookie") || "", "ng_dev");
  return String(dev || "").trim();
}

function mintDeviceId(): { dev: string; cookie: string } {
  // 18 bytes → URL-safe base64; unguessable; stable per device cookie lifetime
  const bytes = new Uint8Array(18);
  (crypto as any).getRandomValues(bytes);
  const dev = bytesToB64url(bytes);

  const cookie = cookieSerialize("ng_dev", dev, {
    Path: "/",
    Secure: true,
    SameSite: "Lax",
    "Max-Age": 60 * 60 * 24 * 366 // ~12 months
    // Not HttpOnly: client can read, but Worker is authoritative on binding.
  });

  return { dev, cookie };
}

function devSessKey(dev: string, ulid: string): string {
  return `devsess:${dev}:${ulid}`;
}

function devIndexKey(dev: string): string {
  return `devsess:${dev}:index`;
}

const ULID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function uniqueTrimmedStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map(v => String(v || "").trim())
        .filter(Boolean)
    )
  );
}

function encodeUlidTimePart(ms: number): string {
  let n = Math.max(0, Math.floor(ms));
  let out = "";
  for (let i = 0; i < 10; i++) {
    out = ULID_ALPHABET[n % 32] + out;
    n = Math.floor(n / 32);
  }
  return out;
}

function encodeUlidRandomPart(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += ULID_ALPHABET[bytes[i] % 32];
  return out;
}

function mintDraftUlid(): string {
  return `${encodeUlidTimePart(Date.now())}${encodeUlidRandomPart(16)}`;
}

function mintDraftSessionId(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return bytesToB64url(bytes);
}

function isValidGooglePlaceId(v: string): boolean {
  return /^[A-Za-z0-9._:-]{6,255}$/.test(String(v || "").trim());
}

function round6(n: number): number {
  return Number(n.toFixed(6));
}

function normalizeDraftCoord(raw: any): { lat: number; lng: number } | undefined {
  if (raw == null || raw === "") return undefined;

  let lat: number;
  let lng: number;

  if (typeof raw === "string") {
    const parts = raw.split(/[,\s;]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length < 2) throw new Error("invalid_coordinates");
    lat = Number(parts[0]);
    lng = Number(parts[1]);
  } else if (typeof raw === "object") {
    lat = Number(raw?.lat ?? raw?.latitude);
    lng = Number(raw?.lng ?? raw?.lon ?? raw?.longitude);
  } else {
    throw new Error("invalid_coordinates");
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("invalid_coordinates");
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error("invalid_coordinates");

  return { lat: round6(lat), lng: round6(lng) };
}

function normalizeDraftPatch(raw: any, providerRef = ""): Record<string, any> {
  const src = (raw && typeof raw === "object") ? raw : {};
  const out: Record<string, any> = {};

  for (const [k, v] of Object.entries(src)) {
    if (v !== undefined) out[k] = v;
  }

  const coord = normalizeDraftCoord((src as any).coord ?? (src as any).coordinates);
  if (coord) out.coord = coord;
  delete out.coordinates;

  if (Object.prototype.hasOwnProperty.call(src, "context")) {
    const ctxVals = Array.isArray((src as any).context)
      ? (src as any).context
      : String((src as any).context || "").split(";");
    out.context = uniqueTrimmedStrings(ctxVals).join(";");
  }

  if (Object.prototype.hasOwnProperty.call(src, "tags")) {
    const tagVals = Array.isArray((src as any).tags)
      ? (src as any).tags
      : String((src as any).tags || "").split(";");
    out.tags = uniqueTrimmedStrings(tagVals);
  }

  if (providerRef && !String(out.googlePlaceId || "").trim()) {
    out.googlePlaceId = providerRef;
  }

  return out;
}

function mergeDraftPatch(base: any, patch: any): any {
  const out: any = (base && typeof base === "object") ? { ...base } : {};
  for (const [k, v] of Object.entries((patch && typeof patch === "object") ? patch : {})) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

async function fetchStaticJson(req: Request, path: string): Promise<any> {
  const origin = req.headers.get("Origin") || "https://navigen.io";
  const u = new URL(path, origin).toString();
  const r = await fetch(u, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  if (!r.ok) throw new Error(`catalog_fetch_failed:${path}`);
  return await r.json();
}

async function loadStructureCatalog(req: Request): Promise<any[]> {
  const j = await fetchStaticJson(req, "/data/structure.json");
  return Array.isArray(j) ? j : [];
}

async function loadContextCatalog(req: Request): Promise<any[]> {
  const j = await fetchStaticJson(req, "/data/contexts.json");
  return Array.isArray(j) ? j : [];
}

function allowedSubgroupsByGroup(structureRows: any[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const row of Array.isArray(structureRows) ? structureRows : []) {
    const groupKey = String(row?.groupKey || "").trim();
    if (!groupKey) continue;
    const set = out.get(groupKey) || new Set<string>();
    const subs = Array.isArray(row?.subgroups) ? row.subgroups : [];
    for (const sg of subs) {
      const key = String(sg?.key || "").trim();
      if (key) set.add(key);
    }
    out.set(groupKey, set);
  }
  return out;
}

function allowedContextKeys(contextRows: any[]): Set<string> {
  const out = new Set<string>();
  for (const row of Array.isArray(contextRows) ? contextRows : []) {
    const key = String(row?.key || "").trim();
    if (key) out.add(key);
  }
  return out;
}

async function validateClassificationSelection(req: Request, profile: any): Promise<string | null> {
  const groupKey = String(profile?.groupKey || "").trim();
  const subgroupKey = String(profile?.subgroupKey || "").trim();
  const contextVals = splitContextMemberships(profile?.context);

  // Drafts may still be partial; only validate when the classification block is present.
  if (!groupKey && !subgroupKey && !contextVals.length) return null;
  if (!groupKey || !subgroupKey || !contextVals.length) return "classification_required";

  const [structureRows, contextRows] = await Promise.all([
    loadStructureCatalog(req),
    loadContextCatalog(req)
  ]);

  const subgroups = allowedSubgroupsByGroup(structureRows);
  const groupSubs = subgroups.get(groupKey);
  if (!groupSubs) return "invalid_groupKey";
  if (!groupSubs.has(subgroupKey)) return "invalid_subgroupKey";

  const contexts = allowedContextKeys(contextRows);
  for (const ctx of contextVals) {
    if (!contexts.has(ctx)) return "invalid_context";
  }

  return null;
}

async function safeValidateClassificationSelection(req: Request, profile: any): Promise<string | null> {
  try {
    return await validateClassificationSelection(req, profile);
  } catch (e: any) {
    const msg = String(e?.message || "").trim();
    if (msg.startsWith("catalog_fetch_failed:")) {
      return "Could not validate categories and context options.";
    }
    throw e;
  }
}

const RATING_WINDOW_MS = 30 * 60 * 1000;

function ratingSummaryKey(locationID: string): string {
  return `rating_summary:${locationID}`;
}

function ratingVoteKey(locationID: string, deviceKey: string): string {
  return `rating_vote:${locationID}:${deviceKey}`;
}

function readRatingDeviceKey(req: Request): string {
  const explicit = String(req.headers.get("X-NG-Device") || "").trim();
  if (explicit) return explicit;

  const cookieDev = readDeviceId(req);
  if (cookieDev) return cookieDev;

  const ip = String(req.headers.get("CF-Connecting-IP") || "").trim();
  const ua = String(req.headers.get("User-Agent") || "").trim().slice(0, 120);
  return encodeURIComponent(`${ip}|${ua}`.trim());
}

async function kvAdd(kv: KVNamespace, key: string, delta: number, ttlSec = 60 * 60 * 24 * 366): Promise<number> {
  const cur = parseInt((await kv.get(key)) || "0", 10) || 0;
  const next = Math.max(0, cur + (Number.isFinite(delta) ? delta : 0));

  if (next <= 0) {
    try { await kv.delete(key); } catch {}
    return 0;
  }

  await kv.put(key, String(next), { expirationTtl: ttlSec });
  return next;
}

type RatingSummary = {
  count: number;
  sum: number;
  avg: number;
};

async function readRatingSummary(env: Env, locationID: string): Promise<RatingSummary> {
  const cached = await env.KV_STATUS.get(ratingSummaryKey(locationID), { type: "json" }) as any;
  const cachedCount = Number(cached?.count);
  const cachedSum = Number(cached?.sum);

  if (Number.isFinite(cachedCount) && cachedCount >= 0 && Number.isFinite(cachedSum) && cachedSum >= 0) {
    return {
      count: cachedCount,
      sum: cachedSum,
      avg: cachedCount > 0 ? (cachedSum / cachedCount) : 0
    };
  }

  let count = 0;
  let sum = 0;
  let cursor: string | undefined = undefined;

  do {
    const page = await env.KV_STATS.list({ prefix: `stats:${locationID}:`, cursor });
    for (const key of page.keys) {
      const name = String(key.name || "");
      const parts = name.split(":");
      if (parts.length !== 4) continue;

      const bucket = String(parts[3] || "").trim();
      if (bucket !== "rating" && bucket !== "rating-score") continue;

      const value = parseInt((await env.KV_STATS.get(name)) || "0", 10) || 0;
      if (bucket === "rating") count += value;
      else sum += value;
    }
    cursor = page.cursor || undefined;
  } while (cursor);

  try {
    await env.KV_STATUS.put(
      ratingSummaryKey(locationID),
      JSON.stringify({ count, sum, updatedAt: new Date().toISOString() })
    );
  } catch {
    // summary cache must never block reads
  }

  return {
    count,
    sum,
    avg: count > 0 ? (sum / count) : 0
  };
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

async function promoteCampaignDraftAndBuildRedirectHint(
  req: Request,
  sess: any,
  ulid: string,
  env: Env,
  logTag: string
): Promise<string> {
  // Build a deterministic hint for the landing UI (not a source of truth; just prevents sticky wrong paint).
  // If this checkout session funded a campaign, promote draft now and enrich redirect with campaign hint.
  try {
    const md = (sess?.metadata && typeof sess.metadata === "object") ? sess.metadata : {};
    const ownershipSource = String(md?.ownershipSource || "").trim();
    const campaignKey = String(md?.campaignKey || "").trim();

    if (ownershipSource !== "campaign" || !campaignKey) return "";

    const draftKey = `campaigns:draft:${ulid}`;
    const draft = await env.KV_STATUS.get(draftKey, { type: "json" }) as any;

    if (!draft || String(draft?.campaignKey || "").trim() !== campaignKey) return "";

    const currentPlan = await currentPlanForUlid(env, ulid);
    const promoted = await promoteCampaignDraftToActiveRows({
      req,
      env,
      ownerUlid: ulid,
      draft,
      locationSlug: String(md?.locationID || "").trim(),
      campaignKey,
      stripeSessionId: String(sess?.id || "").trim(),
      paidPlan: currentPlan,
      logTag
    });

    if (!promoted.ok) return "";

    await env.KV_STATUS.delete(draftKey);

    const end = String(promoted.endDate || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      return `ce=1&ced=${encodeURIComponent(end)}&cak=${encodeURIComponent(campaignKey)}`;
    }
    return `ce=1&cak=${encodeURIComponent(campaignKey)}`;
  } catch (e: any) {
    console.error(`${logTag}: promote_failed`, {
      ulid,
      err: String(e?.message || e || "")
    });
    // Do not block exchange/restore on hint/promotion failure.
    return "";
  }
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
let redirectHint = ""; // ensure local scope for redirect logic used later in /owner/restore

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
    redirectHint = '';

  const target = await resolveTargetIdentity(env, {
    locationID: meta?.locationID,
    draftULID: meta?.draftULID,
    draftSessionId: meta?.draftSessionId
  }, { validateDraft: true });
  if (!target) return new Response("Denied", { status: 403, headers: noStoreHeaders });

  const ulid = target.ulid;
  const locationID = target.locationID;

  // Canonical: a paid campaign checkout is itself the state transition trigger.
  // Do NOT depend on webhook timing for ownership/session/campaign visibility.
  const ownKey = `ownership:${ulid}`;

  // Compute ownership window. Keep current behavior: 30d exclusive + 60d courtesy.
  // If an ownership record already exists, extend from its exclusiveUntil when later than now.
  const now = Date.now();
  const prev = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

  const prevExIso = String(prev?.exclusiveUntil || "").trim();
  const prevEx = prevExIso ? new Date(prevExIso) : null;
  const baseMs = (prevEx && !Number.isNaN(prevEx.getTime()) && prevEx.getTime() > now) ? prevEx.getTime() : now;

  const EXCLUSIVE_MS = 30 * 24 * 60 * 60 * 1000;
  const COURTESY_MS  = 60 * 24 * 60 * 60 * 1000;

  const exclusiveUntil = new Date(baseMs + EXCLUSIVE_MS);
  const courtesyUntil  = new Date(exclusiveUntil.getTime() + COURTESY_MS);

  // Persist ownership deterministically (reconciliation path).
  // Invariant: ownership.lastEventId is the Plan anchor for publish capacity.
  await env.KV_STATUS.put(ownKey, JSON.stringify({
    uid: ulid,
    state: "owned",
    exclusiveUntil: exclusiveUntil.toISOString(),
    source: String(meta?.ownershipSource || "campaign").trim() || "campaign",
    lastEventId: String(sess?.payment_intent || "").trim(),
    updatedAt: new Date().toISOString()
  }));

  // Persist Plan record for publish capacity (KV-only at publish time).
  // Requires Checkout Session line items → price.id → internal tier map.
  try {
    const paymentIntentId = String(sess?.payment_intent || "").trim();
    if (paymentIntentId) {
      // expiresAt must align with ownership exclusiveUntil invariant
      await persistPlanRecord(env, sk, String(sess?.id || "").trim(), paymentIntentId, exclusiveUntil.toISOString(), {
        initiationType: meta?.initiationType,
        campaignPreset: meta?.campaignPreset
      });      
    }
  } catch (e: any) {
    console.error("owner_stripe_exchange: plan_persist_failed", { ulid, err: String(e?.message || e || "") });
    // Must NOT block session minting if plan persistence fails.
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

  // Register this session to the current device so Owner Center can switch without email receipts (ng_dev cookie).
  let devSetCookie = "";
  try {
    let dev = readDeviceId(req);
    if (!dev) {
      const minted = mintDeviceId();
      dev = minted.dev;
      devSetCookie = minted.cookie;
    }

    if (dev) {
      const mapKey = devSessKey(dev, ulid);
      await env.KV_STATUS.put(mapKey, sessionId, { expirationTtl: Math.max(60, maxAge) });

      const idxKey = devIndexKey(dev);
      const rawIdx = await env.KV_STATUS.get(idxKey, "text");
      let arr: string[] = [];
      try { arr = rawIdx ? (JSON.parse(rawIdx) as any) : []; } catch { arr = []; }
      if (!Array.isArray(arr)) arr = [];
      if (!arr.includes(ulid)) arr.unshift(ulid);
      // keep small, deterministic list (most recent first)
      arr = arr.slice(0, 24);
      await env.KV_STATUS.put(idxKey, JSON.stringify(arr), { expirationTtl: 60 * 60 * 24 * 366 });
    }
  } catch {
    // device registry must never block owner exchange
  }

  // If this checkout session funded a campaign, promote draft now and enrich redirect with campaign hint.
  // This avoids "sticky wrong" LPM badge rendering after redirect.
  redirectHint = await promoteCampaignDraftAndBuildRedirectHint(req, sess, ulid, env, "owner_stripe_exchange");
  
  const cookie = cookieSerialize("op_sess", sessionId, {
    Path: "/",
    HttpOnly: true,
    Secure: true,
    SameSite: "Lax",
    "Max-Age": maxAge
  });

  const headers = new Headers({ ...noStoreHeaders });

  headers.append("Set-Cookie", cookie);
  if (devSetCookie) headers.append("Set-Cookie", devSetCookie);

  headers.set("Location", (() => {
    const base = next || `/dash/${encodeURIComponent(ulid)}`;
    if (!redirectHint) return base;

    const u = new URL(base, "https://navigen.io");
    if (!u.searchParams.get("ce")) {
      const parts = redirectHint.split("&");
      parts.forEach(kv => {
        const [k, v] = kv.split("=");
        if (k && v && !u.searchParams.get(k)) u.searchParams.set(k, decodeURIComponent(v));
        else if (k && !u.searchParams.get(k)) u.searchParams.set(k, "1");
      });
    }
    return u.pathname + u.search + u.hash;
  })());

  console.info("owner_exchange_success", { ulid, stripeSessionId: sess?.id, sessionId });
  return new Response(null, { status: 302, headers });
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
  const ownershipSource = String(meta.ownershipSource || '').trim();   // "campaign" | "exclusive"
  const initiationType = String(meta.initiationType || '').trim();     // "owner" | "agent" | "platform"

  // Non-ownership checkouts (e.g. donations) may have empty metadata.
  // We must acknowledge the webhook to prevent Stripe retries and simply ignore it.
  if (!ownershipSource || !initiationType) {
    return new Response('Ignored (no ownership metadata)', { status: 200 });
  }

  const target = await resolveTargetIdentity(env, {
    locationID: meta?.locationID,
    draftULID: meta?.draftULID,
    draftSessionId: meta?.draftSessionId
  }, { validateDraft: true });
  if (!target || !/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(target.ulid)) {
    return new Response('target identity did not resolve to a canonical ULID', { status: 400 });
  }

  const ulid = target.ulid;
  const locationID = target.locationID;

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
  
  // Persist plan record (priceId from line items) with expiry aligned to ownership window.
  try {
    const sk = String((env as any).STRIPE_SECRET_KEY || "").trim();
    const checkoutSessionId = String(session?.id || "").trim();
    if (sk && checkoutSessionId) {
      await persistPlanRecord(env, sk, checkoutSessionId, paymentIntentId, rec.exclusiveUntil, {
        initiationType,
        campaignPreset: meta?.campaignPreset
      });      
    }
  } catch (e: any) {
    console.error("stripe_webhook: plan_persist_failed", { ulid, err: String(e?.message || e || "") });
    // Must NOT block ownership establishment if plan persistence fails.
  }
    
  await env.KV_STATUS.put(idemKey, JSON.stringify({
    paymentIntentId,
    ulid,
    ownershipSource,
    processedAt: now.toISOString()
  }));

  return new Response('OK', { status: 200, headers: { "x-ng-verify": verifyMode || "" } });
}

async function createCampaignCheckoutSession(env: Env, req: Request, body: any, noStore: Record<string, string>) {
  // Fail closed if not configured
  const sk = String((env as any).STRIPE_SECRET_KEY || "").trim();
  if (!sk) return json({ error: { code: "misconfigured", message: "STRIPE_SECRET_KEY not set" } }, 500, noStore);

  const locationID = String(body?.locationID || "").trim();           // MUST be slug when provided
  const draftULID = String(body?.draftULID || "").trim();
  const draftSessionId = String(body?.draftSessionId || "").trim();
  const campaignKey = String(body?.campaignKey || "").trim();         // required for ownershipSource="campaign"
  const initiationType = String(body?.initiationType || "").trim();   // "owner" | "public"
  const ownershipSource = String(body?.ownershipSource || "").trim(); // "campaign"
  const navigenVersion = String(body?.navigenVersion || "").trim() || "phase5";
  const planCode = String(body?.planCode || "").trim().toLowerCase();

  // Allow both owner-initiated and public (no-session) initiation types.
  // Canonical product: campaign payment is the only purchase; session is minted on return.
  const okInitiation = (initiationType === "owner" || initiationType === "public");
  const requestedPlan = planDefinitionForCode(planCode);
  const hasLocationRoute = !!locationID;
  const hasDraftRoute = !!draftULID || !!draftSessionId;
  if ((!hasLocationRoute && !hasDraftRoute) || (hasLocationRoute && hasDraftRoute) || !campaignKey || !okInitiation || ownershipSource !== "campaign" || !requestedPlan) {
    return json(
      { error: { code: "invalid_request", message: "exactly one target identity route (locationID OR draftULID + draftSessionId), campaignKey, valid planCode, initiationType in {'owner','public'}, ownershipSource='campaign' required" } },
      400,
      noStore
    );
  }

  // Reject generic billing keys; campaignKey must bind to the specific saved draft.
  // Prevents "paid but no campaign row" when promotion expects a draft-bound campaignKey.
  if (campaignKey === "campaign-30d") {
    return json(
      { error: { code: "invalid_request", message: "campaignKey must be the draft campaignKey (not 'campaign-30d')" } },
      400,
      noStore
    );
  }

  // Enforce the spec invariant: clients must never supply ULIDs as locationID
  if (locationID && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(locationID)) {
    return json({ error: { code: "invalid_request", message: "locationID must be a slug, not a ULID" } }, 400, noStore);
  }

  const target = await resolveTargetIdentity(env, { locationID, draftULID, draftSessionId }, { validateDraft: hasDraftRoute }).catch(() => null);
  if (!target) {
    return json({ error: { code: "not_found", message: hasLocationRoute ? "unknown locationID" : "unknown private shell target" } }, 404, noStore);
  }

  const ulid = target.ulid;

  // Validate the authoritative saved draft against the requested Plan tier before payment.
  // This keeps Stripe checkout aligned with scope/capacity rules and produces upgrade-safe failures.
  const draftKey = `campaigns:draft:${ulid}`;
  const draft = await env.KV_STATUS.get(draftKey, { type: "json" }) as any;
  if (!draft || String(draft?.campaignKey || "").trim() !== campaignKey) {
    return json({ error: { code: "invalid_state", message: "draft not found for the requested campaignKey" } }, 409, noStore);
  }

  const scope = normCampaignScope(draft?.campaignScope);
  const eligibleLocations = await eligibleLocationsForRequest(req, env, ulid);
  const eligibleByUlid = new Map(eligibleLocations.map((x) => [x.ulid, x]));
  const eligibleUlids = eligibleLocations.map((x) => x.ulid);

  if (scope !== "single" && requestedPlan.maxPublishedLocations <= 1) {
    return json(buildPlanUpgradeErrorBody(requestedPlan, scope, 2), 409, noStore);
  }

  let includedUlids: string[] = [ulid];
  if (scope === "selected") {
    includedUlids = Array.from(new Set((Array.isArray(draft?.selectedLocationULIDs) ? draft.selectedLocationULIDs : []).map((x: any) => String(x || "").trim()).filter(Boolean)));
    includedUlids = includedUlids.filter((id) => eligibleByUlid.has(id));
    if (!includedUlids.length) {
      return json({ error: { code: "invalid_state", message: "selected scope has no eligible locations" } }, 409, noStore);
    }
  } else if (scope === "all") {
    includedUlids = eligibleUlids.length ? eligibleUlids : [ulid];
  }

  if (requestedPlan.maxPublishedLocations > 0 && includedUlids.length > requestedPlan.maxPublishedLocations) {
    return json(buildPlanUpgradeErrorBody(requestedPlan, scope, includedUlids.length), 409, noStore);
  }

  const campaignPreset = normCampaignPreset(body?.campaignPreset || draft?.campaignPreset || "promotion");

  // Build redirect URLs on the web app origin (not the API Worker origin)
  const siteOrigin = req.headers.get("Origin") || "https://navigen.io";
  // IMPORTANT: keep {CHECKOUT_SESSION_ID} unencoded or Stripe will not substitute it.
  const successUrlObj = new URL("/", siteOrigin);
  successUrlObj.searchParams.set("flow", "campaign");
  if (target.route === "existing-location") {
    successUrlObj.searchParams.set("locationID", target.locationID);
  } else {
    successUrlObj.searchParams.set("draftULID", target.draftULID);
    successUrlObj.searchParams.set("draftSessionId", target.draftSessionId);
  }
  successUrlObj.searchParams.set("sid", "{CHECKOUT_SESSION_ID}");
  const successUrl = successUrlObj.toString().replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL("/", siteOrigin);
  cancelUrl.searchParams.set("flow", "campaign");
  if (target.route === "existing-location") {
    cancelUrl.searchParams.set("locationID", target.locationID);
  } else {
    cancelUrl.searchParams.set("draftULID", target.draftULID);
    cancelUrl.searchParams.set("draftSessionId", target.draftSessionId);
  }
  cancelUrl.searchParams.set("canceled", "1");

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_creation", "if_required");
  form.set("billing_address_collection", "auto");
  form.set("success_url", successUrl);
  form.set("cancel_url", cancelUrl.toString());

  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price]", requestedPlan.priceId);

  // Metadata contract (MUST be copied to PaymentIntent)
  if (target.route === "existing-location") {
    form.set("metadata[locationID]", target.locationID);
    form.set("payment_intent_data[metadata][locationID]", target.locationID);
  } else {
    form.set("metadata[draftULID]", target.draftULID);
    form.set("metadata[draftSessionId]", target.draftSessionId);
    form.set("payment_intent_data[metadata][draftULID]", target.draftULID);
    form.set("payment_intent_data[metadata][draftSessionId]", target.draftSessionId);
  }
  form.set("metadata[campaignKey]", campaignKey);
  form.set("metadata[initiationType]", initiationType);
  form.set("metadata[ownershipSource]", ownershipSource);
  form.set("metadata[campaignPreset]", campaignPreset);
  form.set("metadata[navigenVersion]", navigenVersion);

  // Ensure metadata is also on PaymentIntent (spec requirement)
  form.set("payment_intent_data[metadata][campaignKey]", campaignKey);
  form.set("payment_intent_data[metadata][initiationType]", initiationType);
  form.set("payment_intent_data[metadata][ownershipSource]", ownershipSource);
  form.set("payment_intent_data[metadata][campaignPreset]", campaignPreset);
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
    return json({ error: { code: "stripe_error", message: String(out?.error?.message || "Stripe create session failed") } }, 502, noStore);
  }

  return json({ sessionId: out.id, url: String(out.url || "") }, 200, noStore);
}

// Internal helper: resolve an item by canonical ULID (same semantics as /api/data/item?id=...).
// Returns null if not found. Keeps logic centralized for future “locations project”.
async function getItemById(ulid: string, env: Env): Promise<any | null> {
  const id = String(ulid || "").trim();
  if (!id) return null;

  try {
    const src = new URL("/data/profiles.json", "https://navigen.io").toString();
    const resp = await fetch(src, {
      cf: { cacheTtl: 60, cacheEverything: true },
      headers: { "Accept": "application/json" }
    });
    if (!resp.ok) return null;

    const data: any = await resp.json().catch(() => ({ locations: [] }));
    const arr: any[] = Array.isArray(data?.locations)
      ? data.locations
      : (data?.locations && typeof data.locations === "object")
        ? Object.values(data.locations)
        : [];

    if (!Array.isArray(arr)) return null;

    // 1) direct ULID match from profiles.json when present
    let hit = arr.find((r: any) => String(r?.ID || r?.id || "").trim() === id);
    if (hit) return hit;

    // 2) fallback: reverse alias lookup ULID -> slug via KV_ALIASES, then slug -> profiles.json
    if (env.KV_ALIASES) {
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

          if (val && val === id) {
            aliasSlug = name.replace(/^alias:/, "");
            break;
          }
        }
        if (aliasSlug) break;
        cursor = page.cursor || undefined;
      } while (cursor);

      if (aliasSlug) {
        hit = arr.find((r: any) => String(r?.locationID || "").trim() === aliasSlug);
        if (hit) return hit;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Normalize a multilingual name field to a short display string.
function pickName(name: any): string {
  if (!name) return "";
  if (typeof name === "string") return name;
  if (typeof name === "object") {
    return String(name.en || name.hu || Object.values(name)[0] || "").trim();
  }
  return "";
}

const DO_ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

function doJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function doError(reason: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return doJson({ ok: false, reason, ...extra }, status);
}

async function doReadJson(req: Request): Promise<any | null> {
  try { return await req.json(); } catch { return null; }
}

function doNowIso(): string {
  return new Date().toISOString();
}

function doUniqueStrings(values: unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .map(v => String(v || "").trim())
        .filter(Boolean)
    )
  );
}

function doNormalizeSlug(slug: unknown): string {
  return String(slug || "").trim().toLowerCase();
}

function doNormalizeToken(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

function doNormalizeTokens(values: unknown[]): string[] {
  const out = values
    .map(doNormalizeToken)
    .filter(Boolean)
    .sort();
  return Array.from(new Set(out)).slice(0, 64);
}

// --- Phase 8 Durable Objects ---
// Replaces the old deploy-unblock stubs with the real authoritative objects used by:
// - publish-capacity enforcement (PlanAllocDO)
// - search indexing (SearchShardDO)
// - context membership indexing (ContextShardDO)

type PlanAllocState = {
  heldUlids: string[];
  committedUlids: string[];
  updatedAt: string;
};

export class PlanAllocDO {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  private async readState(): Promise<PlanAllocState> {
    const hit = await this.state.storage.get<PlanAllocState>("state");
    return hit || { heldUlids: [], committedUlids: [], updatedAt: doNowIso() };
  }

  private async writeState(next: PlanAllocState): Promise<void> {
    next.updatedAt = doNowIso();
    await this.state.storage.put("state", next);
  }

  async fetch(req: Request): Promise<Response> {
    const method = req.method.toUpperCase();
    const body = method === "GET" ? null : await doReadJson(req);
    const op = String(body?.op || new URL(req.url).searchParams.get("op") || "snapshot").trim().toLowerCase();

    if (op === "snapshot") {
      const state = await this.readState();
      return doJson({
        ok: true,
        heldUlids: state.heldUlids,
        committedUlids: state.committedUlids,
        heldCount: state.heldUlids.length,
        allocatedCount: state.committedUlids.length
      });
    }

    const ulid = String(body?.ulid || "").trim();
    const max = Math.max(0, Number(body?.max || 0) || 0);

    if (!DO_ULID_RE.test(ulid)) return doError("invalid_ulid", 400);

    const state = await this.readState();
    const held = new Set(state.heldUlids);
    const committed = new Set(state.committedUlids);

    if (op === "reserve") {
      if (!Number.isFinite(max) || max <= 0) return doError("invalid_max", 400, { max });

      if (committed.has(ulid)) {
        return doJson({
          ok: true,
          alreadyAllocated: true,
          allocatedCount: committed.size,
          max,
          reservationState: "committed"
        });
      }

      if (held.has(ulid)) {
        return doJson({
          ok: true,
          alreadyAllocated: false,
          allocatedCount: committed.size,
          max,
          reservationState: "held"
        });
      }

      const used = committed.size + held.size;
      if (used >= max) {
        return doJson({
          ok: false,
          reason: "capacity_exceeded",
          allocatedCount: committed.size,
          heldCount: held.size,
          max
        }, 409);
      }

      held.add(ulid);
      await this.writeState({
        heldUlids: Array.from(held),
        committedUlids: Array.from(committed),
        updatedAt: doNowIso()
      });

      return doJson({
        ok: true,
        alreadyAllocated: false,
        allocatedCount: committed.size,
        heldCount: held.size,
        max,
        reservationState: "held"
      });
    }

    if (op === "commit") {
      if (committed.has(ulid)) {
        return doJson({
          ok: true,
          alreadyAllocated: true,
          allocatedCount: committed.size,
          reservationState: "committed"
        });
      }

      if (!held.has(ulid)) {
        return doError("missing_hold", 409);
      }

      held.delete(ulid);
      committed.add(ulid);

      await this.writeState({
        heldUlids: Array.from(held),
        committedUlids: Array.from(committed),
        updatedAt: doNowIso()
      });

      return doJson({
        ok: true,
        alreadyAllocated: false,
        allocatedCount: committed.size,
        reservationState: "committed"
      });
    }

    if (op === "release") {
      const existed = held.delete(ulid);

      await this.writeState({
        heldUlids: Array.from(held),
        committedUlids: Array.from(committed),
        updatedAt: doNowIso()
      });

      return doJson({
        ok: true,
        released: existed,
        allocatedCount: committed.size,
        heldCount: held.size
      });
    }

    return doError("unsupported_op", 400, { op });
  }
}

type SearchShardState = {
  slugToUlid: Record<string, string>;
  slugByUlid: Record<string, string>;
  tokensByUlid: Record<string, string[]>;
  tokenToUlids: Record<string, string[]>;
  metaByUlid: Record<string, { city?: string; postalCode?: string; name?: string }>;
  hashByUlid: Record<string, string>;
  updatedAt: string;
};

export class SearchShardDO {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  private async readState(): Promise<SearchShardState> {
    const hit = await this.state.storage.get<SearchShardState>("state");
    return hit || {
      slugToUlid: {},
      slugByUlid: {},
      tokensByUlid: {},
      tokenToUlids: {},
      metaByUlid: {},
      hashByUlid: {},
      updatedAt: doNowIso()
    };
  }

  private async writeState(next: SearchShardState): Promise<void> {
    next.updatedAt = doNowIso();
    await this.state.storage.put("state", next);
  }

  private removeExisting(state: SearchShardState, ulid: string): void {
    const prevSlug = String(state.slugByUlid[ulid] || "").trim();
    if (prevSlug) delete state.slugToUlid[prevSlug];
    delete state.slugByUlid[ulid];

    const prevTokens = Array.isArray(state.tokensByUlid[ulid]) ? state.tokensByUlid[ulid] : [];
    for (const tok of prevTokens) {
      const current = Array.isArray(state.tokenToUlids[tok]) ? state.tokenToUlids[tok] : [];
      const next = current.filter(v => v !== ulid);
      if (next.length) state.tokenToUlids[tok] = next;
      else delete state.tokenToUlids[tok];
    }
    delete state.tokensByUlid[ulid];
    delete state.metaByUlid[ulid];
    delete state.hashByUlid[ulid];
  }

  async fetch(req: Request): Promise<Response> {
    const method = req.method.toUpperCase();
    const body = method === "GET" ? null : await doReadJson(req);
    const url = new URL(req.url);
    const op = String(body?.op || url.searchParams.get("op") || "snapshot").trim().toLowerCase();

    if (op === "snapshot") {
      const state = await this.readState();
      return doJson({
        ok: true,
        slugs: Object.keys(state.slugToUlid).length,
        tokens: Object.keys(state.tokenToUlids).length,
        ulids: Object.keys(state.slugByUlid).length
      });
    }

    if (op === "lookup_slug") {
      const slug = doNormalizeSlug(body?.slug || url.searchParams.get("slug") || "");
      if (!slug) return doError("invalid_slug", 400);
      const state = await this.readState();
      return doJson({ ok: true, ulid: String(state.slugToUlid[slug] || "") });
    }

    if (op === "search") {
      const rawTokens = Array.isArray(body?.tokens)
        ? body.tokens
        : String(url.searchParams.get("tokens") || "").split(",");
      const tokens = doNormalizeTokens(rawTokens);
      const state = await this.readState();

      if (!tokens.length) return doJson({ ok: true, ulids: [] });

      let result: string[] | null = null;
      for (const tok of tokens) {
        const hits = Array.isArray(state.tokenToUlids[tok]) ? state.tokenToUlids[tok] : [];
        result = result === null ? [...hits] : result.filter(v => hits.includes(v));
        if (!result.length) break;
      }

      return doJson({ ok: true, ulids: result || [] });
    }

    const ulid = String(body?.ulid || "").trim();
    if (!DO_ULID_RE.test(ulid)) return doError("invalid_ulid", 400);

    const state = await this.readState();

    if (op === "delete") {
      this.removeExisting(state, ulid);
      await this.writeState(state);
      return doJson({ ok: true, deleted: true });
    }

    if (op === "upsert") {
      const slug = doNormalizeSlug(body?.slug);
      if (!slug) return doError("invalid_slug", 400);

      const tokens = doNormalizeTokens(Array.isArray(body?.tokens) ? body.tokens : []);
      const indexedFieldsHash = String(body?.indexedFieldsHash || "").trim();
      const prevHash = String(state.hashByUlid[ulid] || "").trim();
      const prevSlug = String(state.slugByUlid[ulid] || "").trim();

      if (indexedFieldsHash && prevHash && indexedFieldsHash === prevHash && prevSlug === slug) {
        return doJson({ ok: true, noChange: true });
      }

      this.removeExisting(state, ulid);

      state.slugToUlid[slug] = ulid;
      state.slugByUlid[ulid] = slug;
      state.tokensByUlid[ulid] = tokens;
      state.hashByUlid[ulid] = indexedFieldsHash;

      const meta = body?.meta && typeof body.meta === "object" ? body.meta : {};
      state.metaByUlid[ulid] = {
        city: String(meta?.city || "").trim(),
        postalCode: String(meta?.postalCode || "").trim(),
        name: String(meta?.name || "").trim()
      };

      for (const tok of tokens) {
        const current = Array.isArray(state.tokenToUlids[tok]) ? state.tokenToUlids[tok] : [];
        if (!current.includes(ulid)) current.push(ulid);
        state.tokenToUlids[tok] = current;
      }

      await this.writeState(state);
      return doJson({ ok: true, upserted: true, tokenCount: tokens.length });
    }

    return doError("unsupported_op", 400, { op });
  }
}

type ContextShardState = {
  ulids: string[];
  updatedAt: string;
};

export class ContextShardDO {
  state: DurableObjectState;
  env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  private async readState(): Promise<ContextShardState> {
    const hit = await this.state.storage.get<ContextShardState>("state");
    return hit || { ulids: [], updatedAt: doNowIso() };
  }

  private async writeState(next: ContextShardState): Promise<void> {
    next.updatedAt = doNowIso();
    await this.state.storage.put("state", next);
  }

  async fetch(req: Request): Promise<Response> {
    const method = req.method.toUpperCase();
    const body = method === "GET" ? null : await doReadJson(req);
    const op = String(body?.op || new URL(req.url).searchParams.get("op") || "snapshot").trim().toLowerCase();

    if (op === "snapshot" || op === "list") {
      const state = await this.readState();
      return doJson({ ok: true, ulids: state.ulids, count: state.ulids.length });
    }

    const ulid = String(body?.ulid || "").trim();
    if (!DO_ULID_RE.test(ulid)) return doError("invalid_ulid", 400);

    const state = await this.readState();
    const set = new Set(state.ulids);

    if (op === "upsert") {
      set.add(ulid);
      await this.writeState({ ulids: Array.from(set), updatedAt: doNowIso() });
      return doJson({ ok: true, upserted: true, count: set.size });
    }

    if (op === "delete") {
      const existed = set.delete(ulid);
      await this.writeState({ ulids: Array.from(set), updatedAt: doNowIso() });
      return doJson({ ok: true, deleted: existed, count: set.size });
    }

    return doError("unsupported_op", 400, { op });
  }
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
      // --- Phase 8 one-time legacy preseed (admin-only, temporary; remove after preseed + KV read cutover ship)
      // POST /api/_admin/p8/preseed
      // Auth: Authorization: Bearer <JWT_SECRET>
      // Body:
      //   { "all": true }
      //   OR
      //   { "locationID": "<slug>" }
      if (normPath === "/api/_admin/p8/preseed" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }

        const body = await req.json().catch(() => ({})) as any;
        const targetSlug = String(body?.locationID || "").trim();
        const doAll = !!body?.all;
        const force = !!body?.force;
        const purgeContexts = Array.isArray(body?.purgeContexts)
          ? body.purgeContexts.map((v: any) => String(v || "").trim()).filter(Boolean)
          : [];

        if (!targetSlug && !doAll) {
          return json(
            { error: { code: "invalid_request", message: "set { all:true } or provide locationID" } },
            400,
            { "cache-control": "no-store" }
          );
        }

        let profiles: any;
        try {
          profiles = await fetchLegacyProfilesJson(req);
        } catch (e: any) {
          return json(
            { error: { code: "upstream", message: String(e?.message || "profiles.json not reachable") } },
            502,
            { "cache-control": "no-store" }
          );
        }

        const rows = legacyLocationsArray(profiles);
        const picked = targetSlug
          ? rows.filter((r: any) => legacyLocationSlug(r) === targetSlug)
          : rows;

        if (!picked.length) {
          return json(
            { error: { code: "not_found", message: "no matching legacy locations" } },
            404,
            { "cache-control": "no-store" }
          );
        }

        const out: Array<Record<string, any>> = [];
        let created = 0;
        let skipped = 0;
        let failed = 0;

        for (const rec of picked) {
          try {
            const result = await preseedLegacyLocationRecord(env, rec, { force });
            out.push(result);
            if (result.created || result.overwritten) created++;
            else if (result.skipped) skipped++;
            else failed++;
          } catch (e: any) {
            failed++;
            out.push({
              ok: false,
              slug: legacyLocationSlug(rec),
              ulid: "",
              reason: String(e?.message || "preseed_failed")
            });
          }
        }

        return json(
          {
            ok: true,
            mode: targetSlug ? "single" : "all",
            total: picked.length,
            created,
            skipped,
            failed,
            items: out
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      
      // --- Phase 8 preseed sanity check (admin-only, temporary)
      // GET /api/_admin/p8/preseed-check?locationID=<slug>
      if (normPath === "/api/_admin/p8/preseed-check" && req.method === "GET") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }

        const slug = String(url.searchParams.get("locationID") || "").trim();
        if (!slug) {
          return json(
            { error: { code: "invalid_request", message: "locationID required" } },
            400,
            { "cache-control": "no-store" }
          );
        }

        const ulid = await resolveUid(slug, env);
        const hasBase = ulid ? !!(await env.KV_STATUS.get(`profile_base:${ulid}`, "text")) : false;

        return json(
          {
            ok: true,
            locationID: slug,
            ulid: ulid || "",
            hasAlias: !!ulid,
            hasProfileBase: hasBase
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      
      // --- Phase 8 DO backfill for preseeded published rows (admin-only, temporary)
      // POST /api/_admin/p8/backfill-do
      // Auth: Authorization: Bearer <JWT_SECRET>
      // Body:
      //   { "all": true }
      //   OR
      //   { "locationID": "<slug>" }
      if (normPath === "/api/_admin/p8/backfill-do" && req.method === "POST") {
        if (!isAdminPreseedAuthorized(req, env)) {
          return json(
            { error: { code: "forbidden", message: "admin authorization required" } },
            403,
            { "cache-control": "no-store" }
          );
        }

        const body = await req.json().catch(() => ({})) as any;
        const targetSlug = String(body?.locationID || "").trim();
        const doAll = !!body?.all;
        const force = !!body?.force;
        const purgeContexts = Array.isArray(body?.purgeContexts)
          ? body.purgeContexts.map((v: any) => String(v || "").trim()).filter(Boolean)
          : [];

        if (!targetSlug && !doAll) {
          return json(
            { error: { code: "invalid_request", message: "set { all:true } or provide locationID" } },
            400,
            { "cache-control": "no-store" }
          );
        }

        const targets: Array<{ ulid: string; slug: string }> = [];

        if (targetSlug) {
          const ulid = await resolveUid(targetSlug, env);
          if (!ulid) {
            return json(
              { error: { code: "not_found", message: "unknown locationID" } },
              404,
              { "cache-control": "no-store" }
            );
          }
          targets.push({ ulid, slug: targetSlug });
        } else {
          let cursor: string | undefined = undefined;
          do {
            const page = await env.KV_STATUS.list({ prefix: "profile_base:", cursor });
            for (const key of page.keys) {
              const name = String(key.name || "");
              const ulid = name.replace(/^profile_base:/, "").trim();
              if (!ULID_RE.test(ulid)) continue;

              const rec = await readPublishedEffectiveProfileByUlid(ulid, env);
              if (!rec) continue;

              targets.push({ ulid, slug: rec.locationID });
            }
            cursor = page.cursor || undefined;
          } while (cursor);
        }

        const out: Array<Record<string, any>> = [];
        let indexed = 0;
        let hidden = 0;
        let failed = 0;

        for (const t of targets) {
          try {
            const result = await backfillPublishedLocationDoState(env, t.ulid, { purgeContexts });
            out.push(result);
            if (result.ok && result.indexed) indexed++;
            else if (result.ok && result.visibilityState === "hidden") hidden++;
            else failed++;
          } catch (e: any) {
            failed++;
            out.push({
              ok: false,
              ulid: t.ulid,
              slug: t.slug,
              reason: String(e?.message || "do_backfill_failed")
            });
          }
        }

        return json(
          {
            ok: true,
            mode: targetSlug ? "single" : "all",
            total: targets.length,
            indexed,
            hidden,
            failed,
            items: out
          },
          200,
          { "cache-control": "no-store" }
        );
      }
      
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

      // --- Owner location selector: query-first, capped, status-enriched BO search
      // GET /api/owner/location-options?q=...&limit=5
      if (normPath === "/api/owner/location-options" && req.method === "GET") {
        const url = new URL(req.url);
        const q = String(url.searchParams.get("q") || "").trim();
        const limitRaw = Number(url.searchParams.get("limit") || 5);
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.trunc(limitRaw), 5)) : 5;

        if (ownerSelectorNormalizeText(q).replace(/\s+/g, "").length < 3) {
          return json({ items: [], q, limit, threshold: 3 }, 200, { "cache-control": "no-store" });
        }

        const items = await listPublishedLocationSelectorItems(env, { query: q, limit }).catch(() => []);
        return json({ items, q, limit }, 200, { "cache-control": "no-store" });
      }
      
      // --- Owner Center / SYB Recently used: list device-bound locations (no secrets)
      if (normPath === "/api/owner/sessions" && req.method === "GET") {
        const dev = readDeviceId(req);
        if (!dev) {
          // No device id cookie set on this browser. Owner Center is device-bound, so we can’t list sessions yet.
          return json({ items: [], rows: [], reason: "no_device_id" }, 200, { "cache-control": "no-store" });
        }

        const idxKey = devIndexKey(dev);
        const rawIdx = await env.KV_STATUS.get(idxKey, "text");
        let ulids: string[] = [];
        try { ulids = rawIdx ? JSON.parse(rawIdx) : []; } catch { ulids = []; }
        if (!Array.isArray(ulids)) ulids = [];

        const out: string[] = [];
        for (const u of ulids) {
          const ulid = String(u || "").trim();
          if (!ULID_RE.test(ulid)) continue;
          const sid = await env.KV_STATUS.get(devSessKey(dev, ulid), "text");
          if (sid) out.push(ulid);
        }

        const rows = (await Promise.all(
          out.map(async (ulid) => {
            const rec = await readPublishedEffectiveProfileByUlid(ulid, env);
            if (!rec) return null;
            return await buildOwnerLocationSelectorItem(env, rec);
          })
        )).filter(Boolean);

        return json({ items: out, rows }, 200, { "cache-control": "no-store" });
      }

      // --- Owner Center: remove a device-bound location from this device registry
      // POST /api/owner/sessions/remove   body: { ulid: "<ULID>" }
      // Removes:
      // - devsess:<ng_dev>:<ULID>
      // - ULID from devsess:<ng_dev>:index
      if (normPath === "/api/owner/sessions/remove" && req.method === "POST") {
        const dev = readDeviceId(req);
        if (!dev) {
          return json({ error: { code: "no_device_id", message: "ng_dev missing" } }, 401, { "cache-control": "no-store" });
        }

        const body = await req.json().catch(() => ({})) as any;
        const ulid = String(body?.ulid || "").trim();
        if (!ULID_RE.test(ulid)) {
          return json({ error: { code: "invalid_request", message: "ulid required" } }, 400, { "cache-control": "no-store" });
        }

        // 1) delete mapping devsess:<dev>:<ulid>
        try { await env.KV_STATUS.delete(devSessKey(dev, ulid)); } catch {}

        // 2) remove from devsess:<dev>:index
        try {
          const idxKey = devIndexKey(dev);
          const rawIdx = await env.KV_STATUS.get(idxKey, "text");
          let arr: string[] = [];
          try { arr = rawIdx ? JSON.parse(rawIdx) : []; } catch { arr = []; }
          if (!Array.isArray(arr)) arr = [];
          arr = arr.filter(x => String(x || "").trim() !== ulid);
          await env.KV_STATUS.put(idxKey, JSON.stringify(arr), { expirationTtl: 60 * 60 * 24 * 366 });
        } catch {}

        return json({ ok: true, ulid }, 200, { "cache-control": "no-store" });
      }

      // --- Owner Campaigns: list active/history + current draft for this session-bound ULID
      // GET /api/owner/campaigns
      if (normPath === "/api/owner/campaigns" && req.method === "GET") {
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();

        const draftKey = `campaigns:draft:${ulid}`;
        const histKey = campaignsByUlidKey(ulid);

        let draft: any = null;
        let history: any[] = [];

        try {
          const rawDraft = await env.KV_STATUS.get(draftKey, { type: "json" }) as any;
          if (rawDraft && typeof rawDraft === "object") draft = rawDraft;
        } catch {}

        try {
          const rawHist = await env.KV_STATUS.get(histKey, { type: "json" }) as any;
          history = Array.isArray(rawHist) ? rawHist : [];
        } catch {
          history = [];
        }

        const inherited = await materializeInheritedAllScopeForCurrentUlid(req, env, ulid).catch(() => ({
          addedRows: 0,
          addedGroups: 0,
          blockedRows: 0,
          blockedGroups: 0,
          blockedPlanTier: "",
          blockedMaxPublishedLocations: 0
        }));        
        if (inherited.addedRows > 0) {
          try {
            const refreshed = await env.KV_STATUS.get(histKey, { type: "json" }) as any;
            history = Array.isArray(refreshed) ? refreshed : history;
          } catch {}
        }

        const eligibleLocations = await eligibleLocationsForRequest(req, env, ulid);

        const currentPlan = await currentPlanForUlid(env, ulid);
        const currentGroupPlan = await currentGroupPlanForUlid(env, ulid);

        const effectivePlanTier = normalizePlanTier(currentPlan?.tier || currentGroupPlan?.tier);
        const effectivePlanCapacity = Math.max(
          0,
          Number(currentPlan?.maxPublishedLocations || currentGroupPlan?.maxPublishedLocations || 0) || 0
        );
        const multiLocationEnabled = effectivePlanCapacity > 1;

        // Provide a shallow "active" view for convenience (no resolver duplication).
        const nowMs = Date.now();
        const active = history.filter((r: any) => {
          const st = effectiveCampaignStatus(r);
          if (st !== "active") return false;
          const sMs = parseYmdUtcMs(String(r?.startDate || ""));
          const eMs = parseYmdUtcMs(String(r?.endDate || ""));
          if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;
          return nowMs >= sMs && nowMs <= (eMs + 24 * 60 * 60 * 1000 - 1);
        });

        return json(
          {
            ulid,
            draft,
            active,
            history,
            plan: {
              tier: String(effectivePlanTier || "").trim() || "unknown",
              maxPublishedLocations: effectivePlanCapacity,
              multiLocationEnabled
            },
            eligibleLocations,
            inheritedNotice: (inherited.addedRows > 0 || inherited.blockedRows > 0) ? {
              addedRows: inherited.addedRows,
              addedGroups: inherited.addedGroups,
              blockedRows: inherited.blockedRows,
              blockedGroups: inherited.blockedGroups,
              blockedPlanTier: inherited.blockedPlanTier,
              blockedMaxPublishedLocations: inherited.blockedMaxPublishedLocations
            } : null
          },
          200,
          { "cache-control": "no-store" }
        );
      }

      // --- Owner Campaign Group: flat roster for one campaignGroupKey on this device
      // GET /api/owner/campaigns/group?campaignGroupKey=<key>
      if (normPath === "/api/owner/campaigns/group" && req.method === "GET") {
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;

        const ulid = String(sess.ulid || "").trim();
        const campaignGroupKey = String(url.searchParams.get("campaignGroupKey") || "").trim();
        if (!campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignGroupKey required" } }, 400, { "cache-control": "no-store" });
        }

        const eligible = await eligibleLocationsForRequest(req, env, ulid);
        const items = [];

        for (const loc of eligible) {
          const histRaw = await env.KV_STATUS.get(campaignsByUlidKey(loc.ulid), { type: "json" }) as any;
          const rows: any[] = Array.isArray(histRaw) ? histRaw : [];

          const row = [...rows].reverse().find((r: any) =>
            String(r?.campaignGroupKey || "").trim() === campaignGroupKey
          );

          if (row) {
            items.push({
              ulid: loc.ulid,
              slug: loc.slug,
              locationName: loc.locationName,
              included: true,
              status: String(row?.statusOverride || row?.status || "").trim().toLowerCase() || "active",
              campaignKey: String(row?.campaignKey || "").trim(),
              inheritedAt: String(row?.inheritedAt || "").trim() || ""
            });
          } else {
            items.push({
              ulid: loc.ulid,
              slug: loc.slug,
              locationName: loc.locationName,
              included: false,
              status: "excluded",
              campaignKey: "",
              inheritedAt: ""
            });
          }
        }

        return json(
          { campaignGroupKey, items },
          200,
          { "cache-control": "no-store" }
        );
      }
      
      // --- Owner Campaigns: upsert draft for this session-bound ULID
      // POST /api/owner/campaigns/draft  body: CampaignRow-like (slug + dates + rules)
      // Stores: campaigns:draft:<ULID>
      if (normPath === "/api/owner/campaigns/draft" && req.method === "POST") {
        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();

        const body = await req.json().catch(() => ({})) as any;

        const campaignKey = String(body?.campaignKey || "").trim();
        const startDate = String(body?.startDate || "").trim();
        const endDate = String(body?.endDate || "").trim();
        const scope = normCampaignScope(body?.campaignScope);
        const campaignPreset = normCampaignPreset(body?.campaignPreset);
        const requestedPlan = planDefinitionForCode(body?.planCode) || await currentPlanForUlid(env, ulid);

        if (!campaignKey) {
          return json({ error: { code: "invalid_request", message: "campaignKey required" } }, 400, { "cache-control": "no-store" });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return json({ error: { code: "invalid_request", message: "startDate/endDate must be YYYY-MM-DD" } }, 400, { "cache-control": "no-store" });
        }

        const eligibleLocations = await eligibleLocationsForRequest(req, env, ulid);
        const eligibleByUlid = new Map(eligibleLocations.map((x) => [x.ulid, x]));
        const eligibleUlids = eligibleLocations.map((x) => x.ulid);

        if (scope !== "single" && Number(requestedPlan?.maxPublishedLocations || 0) <= 1) {
          return json(buildPlanUpgradeErrorBody(requestedPlan, scope, 2), 409, { "cache-control": "no-store" });
        }

        const selectedLocationULIDs: string[] = Array.isArray(body?.selectedLocationULIDs)
          ? Array.from(new Set(body.selectedLocationULIDs.map((x: any) => String(x || "").trim()).filter(Boolean))) as string[]
          : [];

        if (scope === "selected") {
          if (!selectedLocationULIDs.length) {
            return json({ error: { code: "invalid_request", message: "selected scope requires at least one location" } }, 400, { "cache-control": "no-store" });
          }
          for (const id of selectedLocationULIDs) {
            if (!eligibleByUlid.has(id)) {
              return json({ error: { code: "denied", message: "selected location is not eligible on this device" } }, 403, { "cache-control": "no-store" });
            }
          }
        }

        const requestedLocations = scope === "selected"
          ? selectedLocationULIDs.length
          : scope === "all"
            ? (eligibleUlids.length || 1)
            : 1;

        if (Number(requestedPlan?.maxPublishedLocations || 0) > 0 && requestedLocations > Number(requestedPlan?.maxPublishedLocations || 0)) {
          return json(buildPlanUpgradeErrorBody(requestedPlan, scope, requestedLocations), 409, { "cache-control": "no-store" });
        }

        const draft = {
          ...body,
          locationID: ulid,
          campaignKey,
          campaignGroupKey: scope === "single" ? "" : String(body?.campaignGroupKey || deriveCampaignGroupKey(String(body?.locationSlug || ulid), campaignKey)).trim(),
          campaignScope: scope,
          campaignPreset,
          planCode: String(body?.planCode || "").trim().toLowerCase(),
          selectedLocationULIDs,
          startDate,
          endDate,
          status: "Draft",
          updatedAt: new Date().toISOString()
        };

        const draftKey = `campaigns:draft:${ulid}`;
        await env.KV_STATUS.put(draftKey, JSON.stringify(draft));

        return json({ ok: true, ulid, draftKey: `campaigns:draft:<ULID>` }, 200, { "cache-control": "no-store" });
      }

      // --- Public Campaigns: create checkout session and persist draft without requiring owner session
      // POST /api/campaigns/checkout
      //   existing route: { locationID:"<slug>", draft:{...}, planCode?:string }
      //   brand-new route: { draftULID:"<ULID>", draftSessionId:"<opaque>", draft:{...}, planCode?:string }
      if (normPath === "/api/campaigns/checkout" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        const body = await req.json().catch(() => ({})) as any;
        const locationSlug = String(body?.locationID || "").trim();
        const draftULID = String(body?.draftULID || "").trim();
        const draftSessionId = String(body?.draftSessionId || "").trim();
        const draftIn = (body?.draft && typeof body.draft === "object") ? body.draft : {};

        const target = await resolveTargetIdentity(
          env,
          { locationID: locationSlug, draftULID, draftSessionId },
          { validateDraft: !!draftULID || !!draftSessionId }
        ).catch(() => null);

        if (!target) {
          return json(
            { error: { code: "invalid_request", message: "valid locationID or draftULID + draftSessionId required" } },
            400,
            noStore
          );
        }

        // Validate draft minimally (server-authoritative; we only accept structurally valid campaigns).
        const campaignKey = String(draftIn?.campaignKey || "").trim();
        const startDate = String(draftIn?.startDate || "").trim();
        const endDate = String(draftIn?.endDate || "").trim();

        if (!campaignKey) return json({ error:{ code:"invalid_request", message:"draft.campaignKey required" } }, 400, noStore);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
          return json({ error:{ code:"invalid_request", message:"draft.startDate/endDate must be YYYY-MM-DD" } }, 400, noStore);
        }

        // Persist draft server-side, keyed by authoritative ULID.
        const draft = {
          ...draftIn,
          locationID: target.ulid,
          campaignKey,
          startDate,
          endDate,
          status: "Draft",
          updatedAt: new Date().toISOString()
        };

        await env.KV_STATUS.put(`campaigns:draft:${target.ulid}`, JSON.stringify(draft));

        const stripeReq: any = {
          campaignKey,
          initiationType: "public",
          ownershipSource: "campaign",
          navigenVersion: "phase5",
          planCode: body?.planCode
        };

        if (target.route === "existing-location") {
          stripeReq.locationID = locationSlug;
        } else {
          stripeReq.draftULID = target.draftULID;
          stripeReq.draftSessionId = target.draftSessionId;
        }

        return await createCampaignCheckoutSession(env, req, stripeReq, noStore);
      }

      // --- Owner Campaigns: create checkout session from the current draft (session-bound)
      // POST /api/owner/campaigns/checkout  body: { locationID: "<slug>", planCode?: string }      
      if (normPath === "/api/owner/campaigns/checkout" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();

        const body = await req.json().catch(() => ({})) as any;
        const locationSlug = String(body?.locationID || "").trim();

        if (!locationSlug) {
          return json({ error: { code: "invalid_request", message: "locationID (slug) required" } }, 400, noStore);
        }

        // Zero-trust: verify slug resolves to THIS session ULID.
        if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(locationSlug)) {
          return json({ error: { code: "invalid_request", message: "locationID must be a slug, not a ULID" } }, 400, noStore);
        }

        const resolved = await resolveUid(locationSlug, env).catch(() => null);
        if (!resolved || String(resolved).trim() !== ulid) {
          return new Response("Denied", { status: 401, headers: noStore });
        }

        const draftKey = `campaigns:draft:${ulid}`;
        const draft = await env.KV_STATUS.get(draftKey, { type: "json" }) as any;
        const campaignKey = String(draft?.campaignKey || "").trim();
        if (!campaignKey) {
          return json({ error: { code: "invalid_request", message: "no draft campaign found for this location" } }, 400, noStore);
        }

        // Delegate to the same Stripe session creator used by /api/stripe/create-checkout-session
        const stripeReq = {
          locationID: locationSlug,
          campaignKey,
          initiationType: "owner",
          ownershipSource: "campaign",
          navigenVersion: "phase5",
          planCode: body?.planCode
        };

        return await createCampaignCheckoutSession(env, req, stripeReq, { "cache-control": "no-store" });
      }

      // --- Owner Campaigns: promote draft → active after Stripe checkout
      // POST /api/owner/campaigns/promote  body: { sessionId: "cs_..." }
      // Requires owner session; also verifies Stripe session is paid/complete.
      if (normPath === "/api/owner/campaigns/promote" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();

        const body = await req.json().catch(() => ({})) as any;
        const cs = String(body?.sessionId || "").trim();
        if (!/^cs_(live|test)_/i.test(cs)) {
          return json({ error: { code: "invalid_request", message: "sessionId (cs_...) required" } }, 400, noStore);
        }

        const sk = String((env as any).STRIPE_SECRET_KEY || "").trim();
        if (!sk) return json({ error: { code: "misconfigured", message: "STRIPE_SECRET_KEY not set" } }, 500, noStore);

        const stripeUrl = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(cs)}?expand[]=payment_intent`;
        const r = await fetch(stripeUrl, { headers: { "Authorization": `Bearer ${sk}` } });
        const txt = await r.text();
        let out: any = null;
        try { out = JSON.parse(txt); } catch { out = null; }

        if (!r.ok || !out) {
          return json({ error: { code: "stripe_error", message: String(out?.error?.message || "Stripe session fetch failed") } }, 502, noStore);
        }

        const status = String(out?.status || "").toLowerCase();
        const payStatus = String(out?.payment_status || "").toLowerCase();
        if (status !== "complete" || payStatus !== "paid") {
          return json({ error: { code: "not_paid", message: "checkout not complete/paid" } }, 409, noStore);
        }

        const pi = out?.payment_intent;
        const meta = (pi && pi.metadata) ? pi.metadata : (out.metadata || {});
        const locationSlug = String(meta?.locationID || "").trim();
        const campaignKey = String(meta?.campaignKey || "").trim();

        if (!locationSlug || !campaignKey) {
          return json({ error: { code: "invalid_state", message: "missing metadata.locationID/campaignKey" } }, 500, noStore);
        }

        const resolved = await resolveUid(locationSlug, env).catch(() => null);
        if (!resolved || String(resolved).trim() !== ulid) {
          return new Response("Denied", { status: 401, headers: noStore });
        }

        const draftKey = `campaigns:draft:${ulid}`;
        const draft = await env.KV_STATUS.get(draftKey, { type: "json" }) as any;
        if (!draft) {
          return json({ error: { code: "not_found", message: "draft not found" } }, 404, noStore);
        }

        if (String(draft?.campaignKey || "").trim() !== campaignKey) {
          return json({ error: { code: "invalid_state", message: "draft campaignKey mismatch" } }, 409, noStore);
        }

        const paidPriceId = await fetchStripeCheckoutLineItemPriceId(sk, cs).catch(() => "");
        const paidPlan = paidPriceId ? PRICE_ID_TO_PLAN[paidPriceId] : null;
        if (!paidPlan) {
          return json({ error: { code: "invalid_state", message: "paid checkout session has no recognized Plan tier" } }, 409, noStore);
        }

        const promoted = await promoteCampaignDraftToActiveRows({
          req,
          env,
          ownerUlid: ulid,
          draft,
          locationSlug,
          campaignKey,
          stripeSessionId: cs,
          paidPlan,
          logTag: "owner_campaigns_promote"
        });

        if ("body" in promoted) {
          return json(promoted.body, promoted.status, noStore);
        }

        await env.KV_STATUS.delete(draftKey);

        return json({
          ok: true,
          ulid,
          campaignKey,
          campaignGroupKey: promoted.campaignGroupKey,
          includedCount: promoted.includedTargets.length
        }, 200, { "cache-control": "no-store" });
      }

      // --- Owner Campaigns: suspend/resume a campaign row or campaign group (KV-authoritative)
      // POST /api/owner/campaigns/suspend body: { campaignKey?: "<key>", campaignGroupKey?: "<group>", action: "suspend"|"resume" }
      if (normPath === "/api/owner/campaigns/suspend" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;
        const ulid = String(sess.ulid || "").trim();

        const body = await req.json().catch(() => ({})) as any;
        const campaignKey = String(body?.campaignKey || "").trim();
        const campaignGroupKey = String(body?.campaignGroupKey || "").trim();
        const action = String(body?.action || "suspend").trim().toLowerCase();

        if (!campaignKey && !campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignKey or campaignGroupKey required" } }, 400, noStore);
        }
        if (action !== "suspend" && action !== "resume") {
          return json({ error: { code: "invalid_request", message: "action must be suspend|resume" } }, 400, noStore);
        }

        const applyToRows = async (targetUlid: string): Promise<boolean> => {
          const histKey = campaignsByUlidKey(targetUlid);
          const hist = await env.KV_STATUS.get(histKey, { type: "json" }) as any;
          const arr: any[] = Array.isArray(hist) ? hist : [];
          let changed = false;

          const next = arr.map((row: any) => {
            const sameKey = campaignKey && String(row?.campaignKey || "").trim() === campaignKey;
            const sameGroup = campaignGroupKey && String(row?.campaignGroupKey || "").trim() === campaignGroupKey;
            if (!sameKey && !sameGroup) return row;

            changed = true;
            const out = { ...row };
            if (action === "suspend") {
              out.statusOverride = "Suspended";
              out.suspendedAt = new Date().toISOString();
            } else {
              out.statusOverride = "";
              delete out.suspendedAt;
            }
            return out;
          });

          if (changed) {
            await env.KV_STATUS.put(histKey, JSON.stringify(next));
          }
          return changed;
        };

        if (campaignGroupKey) {
          const eligible = await eligibleLocationsForRequest(req, env, ulid);
          let affected = 0;
          for (const loc of eligible) {
            if (await applyToRows(loc.ulid)) affected += 1;
          }
          return json({ ok: true, ulid, campaignGroupKey, action, affected }, 200, noStore);
        }

        const changed = await applyToRows(ulid);
        if (!changed) {
          return json({ error: { code: "not_found", message: "campaign not found for this location" } }, 404, noStore);
        }

        return json({ ok: true, ulid, campaignKey, action }, 200, noStore);
      }

      // --- Owner Campaign Group: suspend/resume selected included locations only
      // POST /api/owner/campaigns/suspend-selected
      // body: { campaignGroupKey: "<group>", action: "suspend"|"resume", ulids: ["<ULID>", ...] }
      if (normPath === "/api/owner/campaigns/suspend-selected" && req.method === "POST") {
        const noStore = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        const sess = await requireOwnerSession(req, env);
        if (sess instanceof Response) return sess;

        const currentUlid = String(sess.ulid || "").trim();
        const body = await req.json().catch(() => ({})) as any;

        const campaignGroupKey = String(body?.campaignGroupKey || "").trim();
        const action = String(body?.action || "").trim().toLowerCase();
        const rawUlids = Array.isArray(body?.ulids) ? body.ulids : [];

        if (!campaignGroupKey) {
          return json({ error: { code: "invalid_request", message: "campaignGroupKey required" } }, 400, noStore);
        }
        if (action !== "suspend" && action !== "resume") {
          return json({ error: { code: "invalid_request", message: "action must be suspend|resume" } }, 400, noStore);
        }

        const eligible = await eligibleLocationsForRequest(req, env, currentUlid);
        const eligibleSet = new Set(eligible.map((x) => String(x.ulid || "").trim()));
        const targetUlids = Array.from(new Set(rawUlids.map((x: any) => String(x || "").trim()).filter(Boolean)))
          .filter((id) => eligibleSet.has(id));

        if (!targetUlids.length) {
          return json({ error: { code: "invalid_request", message: "no eligible selected locations" } }, 400, noStore);
        }

        let affected = 0;

        for (const targetUlid of targetUlids) {
          const histKey = campaignsByUlidKey(targetUlid);
          const histRaw = await env.KV_STATUS.get(histKey, { type: "json" }) as any;
          const arr: any[] = Array.isArray(histRaw) ? histRaw : [];

          let changed = false;
          const next = arr.map((row: any) => {
            if (String(row?.campaignGroupKey || "").trim() !== campaignGroupKey) return row;

            changed = true;
            const out = { ...row };
            if (action === "suspend") {
              out.statusOverride = "Suspended";
              out.suspendedAt = new Date().toISOString();
            } else {
              out.statusOverride = "";
              delete out.suspendedAt;
            }
            return out;
          });

          if (changed) {
            await env.KV_STATUS.put(histKey, JSON.stringify(next));
            affected += 1;
          }
        }

        return json(
          { ok: true, campaignGroupKey, action, affected, ulids: targetUlids },
          200,
          noStore
        );
      }
      
      // --- Owner session diag: /api/_diag/opsess (safe; no secrets)
      if (normPath === "/api/_diag/opsess" && req.method === "GET") {
        const cookieHdr = req.headers.get("Cookie") || "";
        const sid = readCookie(cookieHdr, "op_sess");

        const sessKey = sid ? `opsess:${sid}` : "";
        const sess = sid
          ? await env.KV_STATUS.get(sessKey, { type: "json" })
          : null;

        return json(
          {
            hasCookieHeader: !!cookieHdr,
            cookieHeaderLen: cookieHdr.length,
            hasOpSessCookie: !!sid,
            opSessLen: sid ? String(sid).length : 0,
            kvHit: !!sess,
            kvKey: sessKey ? `opsess:<redacted>` : "",
            ulid: (sess && typeof sess === "object") ? String((sess as any).ulid || "") : ""
          },
          200,
          { "cache-control": "no-store", "x-ng-worker": "navigen-api" }
        );
      }

      // --- Owner exchange from Stripe Checkout (Phase 5: sid → cookie session)
      if (normPath === "/owner/stripe-exchange" && req.method === "GET") {
        return await handleOwnerStripeExchange(req, env);
      }

      // --- Restore by PaymentIntent id (pi_...) for cross-device recovery
      if (normPath === "/owner/restore" && req.method === "GET") {
        const u = new URL(req.url);
        const pi = String(u.searchParams.get("pi") || "").trim();
        const nextRaw = String(u.searchParams.get("next") || "").trim();

        const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        if (!pi || !/^pi_/i.test(pi)) return new Response("Denied", { status: 400, headers: noStoreHeaders });

        const isSafeNext = (p: string) =>
          p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\");

        const next = (nextRaw && isSafeNext(nextRaw)) ? nextRaw : "";
        const jsonMode = u.searchParams.get("json") === "1" || /\bapplication\/json\b/i.test(String(req.headers.get("Accept") || ""));
        let redirectHint = "";

        const sk = String((env as any).STRIPE_SECRET_KEY || "").trim();
        if (!sk) return new Response("Misconfigured", { status: 500, headers: noStoreHeaders });

        // Find the Checkout Session by payment_intent
        const listUrl = `https://api.stripe.com/v1/checkout/sessions?payment_intent=${encodeURIComponent(pi)}&limit=1`;
        const rr = await fetch(listUrl, { method: "GET", headers: { "Authorization": `Bearer ${sk}` } });
        const txt = await rr.text();
        let out: any = null;
        try { out = JSON.parse(txt); } catch { out = null; }

        const sess = out?.data && Array.isArray(out.data) && out.data.length ? out.data[0] : null;
        if (!rr.ok || !sess) return new Response("Denied", { status: 403, headers: noStoreHeaders });

        const paymentStatus = String(sess?.payment_status || "").toLowerCase();
        const status = String(sess?.status || "").toLowerCase();
        if (paymentStatus !== "paid" || status !== "complete") {
          return new Response("Denied", { status: 403, headers: noStoreHeaders });
        }

        const meta = sess?.metadata || {};
        const target = await resolveTargetIdentity(env, {
          locationID: meta?.locationID,
          draftULID: meta?.draftULID,
          draftSessionId: meta?.draftSessionId
        }, { validateDraft: true });
        if (!target) return new Response("Denied", { status: 403, headers: noStoreHeaders });

        const ulid = target.ulid;
        const locationID = target.locationID;

        const ownKey = `ownership:${ulid}`;
        const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;
        const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
        const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
        if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
          return new Response("Denied", { status: 403, headers: noStoreHeaders });
        }
        
        try {
          await persistPlanRecord(env, sk, String(sess?.id || "").trim(), pi, exclusiveUntil.toISOString(), {
            initiationType: meta?.initiationType,
            campaignPreset: meta?.campaignPreset
          });          
        } catch (e: any) {
          console.error("owner_restore: plan_persist_failed", { ulid, err: String(e?.message || e || "") });
        }        

        // Mint op_sess exactly like handleOwnerStripeExchange
        const sidBytes = new Uint8Array(18);
        (crypto as any).getRandomValues(sidBytes);
        const sessionId = bytesToB64url(sidBytes);

        const createdAt = new Date();
        const expiresAt = exclusiveUntil;
        const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - createdAt.getTime()) / 1000));

        const sessKey = `opsess:${sessionId}`;
        const sessVal = { ver: 1, ulid, createdAt: createdAt.toISOString(), expiresAt: expiresAt.toISOString() };

        await env.KV_STATUS.put(sessKey, JSON.stringify(sessVal), { expirationTtl: Math.max(60, maxAge) });

        // Register to device (mint ng_dev if missing) so Owner Center works on this device
        let devSetCookie = "";
        try {
          let dev = readDeviceId(req);
          if (!dev) {
            const minted = mintDeviceId();
            dev = minted.dev;
            devSetCookie = minted.cookie;
          }

          if (dev) {
            await env.KV_STATUS.put(devSessKey(dev, ulid), sessionId, { expirationTtl: Math.max(60, maxAge) });
            const idxKey = devIndexKey(dev);
            const rawIdx = await env.KV_STATUS.get(idxKey, "text");
            let arr: string[] = [];
            try { arr = rawIdx ? JSON.parse(rawIdx) : []; } catch { arr = []; }
            if (!Array.isArray(arr)) arr = [];
            if (!arr.includes(ulid)) arr.unshift(ulid);
            arr = arr.slice(0, 24);
            await env.KV_STATUS.put(idxKey, JSON.stringify(arr), { expirationTtl: 60 * 60 * 24 * 366 });
          }
        } catch {}

        // If this checkout session funded a campaign, promote draft now and enrich redirect with campaign hint.
        // This avoids "sticky wrong" LPM badge rendering after redirect.
        redirectHint = await promoteCampaignDraftAndBuildRedirectHint(req, sess, ulid, env, "owner_restore");        
        
        const cookie = cookieSerialize("op_sess", sessionId, {
          Path: "/",
          HttpOnly: true,
          Secure: true,
          SameSite: "Lax",
          "Max-Age": maxAge
        });

        const redirectTarget = (() => {
          const base = next || `/dash/${encodeURIComponent(ulid)}`;
          if (!redirectHint) return base;

          const u = new URL(base, "https://navigen.io");
          if (!u.searchParams.get("ce")) {
            const parts = redirectHint.split("&");
            parts.forEach(kv => {
              const [k, v] = kv.split("=");
              if (k && v && !u.searchParams.get(k)) u.searchParams.set(k, decodeURIComponent(v));
              else if (k && !u.searchParams.get(k)) u.searchParams.set(k, "1");
            });
          }
          return u.pathname + u.search + u.hash;
        })();

        const headers = new Headers({ ...noStoreHeaders });
        headers.append("Set-Cookie", cookie);
        if (devSetCookie) headers.append("Set-Cookie", devSetCookie);

        console.info("owner_restore_success", { ulid, locationID, pi, sessionId });

        if (jsonMode) {
          headers.set("Content-Type", "application/json; charset=utf-8");
          return new Response(JSON.stringify({
            ok: true,
            ulid,
            locationID,
            redirectTo: redirectTarget
          }), { status: 200, headers });
        }

        headers.set("Location", redirectTarget);
        return new Response(null, { status: 302, headers });
      }

      // --- Owner session clear: /owner/clear-session
      // Clears the active op_sess cookie on this device (HttpOnly, so JS can't delete it).
      if (normPath === "/owner/clear-session" && req.method === "GET") {
        const u = new URL(req.url);
        const nextRaw = String(u.searchParams.get("next") || "").trim();

        const isSafeNext = (p: string) =>
          p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\");

        const next = (nextRaw && isSafeNext(nextRaw)) ? nextRaw : "/";

        const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        // Expire cookie. We do not need to delete opsess:<id> in KV; it expires naturally.
        const cookie = cookieSerialize("op_sess", "", {
          Path: "/",
          HttpOnly: true,
          Secure: true,
          SameSite: "Lax",
          "Max-Age": 0
        });

        return new Response(null, {
          status: 302,
          headers: {
            "Set-Cookie": cookie,
            "Location": next,
            ...noStoreHeaders
          }
        });
      }

      // --- Owner Center: switch active op_sess to a device-bound location
      if (normPath === "/owner/switch" && req.method === "GET") {
        const u = new URL(req.url);
        const ulid = String(u.searchParams.get("ulid") || "").trim();
        const nextRaw = String(u.searchParams.get("next") || "").trim();

        const noStoreHeaders = { "cache-control": "no-store", "Referrer-Policy": "no-referrer" };

        if (!ULID_RE.test(ulid)) return new Response("Denied", { status: 400, headers: noStoreHeaders });

        const isSafeNext = (p: string) =>
          p.startsWith("/") && !p.startsWith("//") && !p.includes("://") && !p.includes("\\");

        const next = (nextRaw && isSafeNext(nextRaw)) ? nextRaw : `/dash/${encodeURIComponent(ulid)}`;

        const dev = readDeviceId(req);
        if (!dev) return new Response("Denied", { status: 401, headers: noStoreHeaders });

        const sid = await env.KV_STATUS.get(devSessKey(dev, ulid), "text");
        if (!sid) return new Response("Denied", { status: 403, headers: noStoreHeaders });

        // Validate session still exists and is not expired
        const sessKey = `opsess:${sid}`;
        const sess = await env.KV_STATUS.get(sessKey, { type: "json" }) as OwnerSession | null;
        if (!sess || !sess.ulid) return new Response("Denied", { status: 403, headers: noStoreHeaders });

        const exp = new Date(String(sess.expiresAt || ""));
        if (Number.isNaN(exp.getTime()) || exp.getTime() <= Date.now()) {
          return new Response("Denied", { status: 401, headers: noStoreHeaders });
        }

        // Set cookie to the mapped session id
        const maxAge = Math.max(0, Math.floor((exp.getTime() - Date.now()) / 1000));
        const cookie = cookieSerialize("op_sess", sid, {
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
            "Location": next,
            ...noStoreHeaders
          }
        });
      }

      // --- Location draft: /api/location/draft (Phase 8 private shell)
      if (normPath === "/api/location/draft" && req.method === "POST") {
        return await handleLocationDraft(req, env);
      }

      // --- Location publish: /api/location/publish (Phase 8 authoritative publish)
      if (normPath === "/api/location/publish" && req.method === "POST") {
        return await handleLocationPublish(req, env);
      }

      // --- Stripe webhook: /api/stripe/webhook (Phase 1: ownership writer)
      if (normPath === "/api/stripe/webhook" && req.method === "POST") {
        return await handleStripeWebhook(req, env);
      }

      // --- QR image: /api/qr?locationID=...&c=...&fmt=svg|png&size=512
      if (pathname === "/api/qr" && req.method === "GET") {
        return await handleQr(req, env);
      }

      // --- Campaign summary (read-only): GET /api/campaign-summary?locationID=...&campaignKey=...
      if (pathname === "/api/campaign-summary" && req.method === "GET") {
        const u = new URL(req.url);
        const locationRaw = (u.searchParams.get("locationID") || "").trim();
        const campaignKeyRaw = (u.searchParams.get("campaignKey") || "").trim();

        if (!locationRaw || !campaignKeyRaw) {
          return json(
            { error: { code: "invalid_request", message: "locationID and campaignKey required" } },
            400,
            { "cache-control": "no-store" }
          );
        }

        const locULID = (await resolveUid(locationRaw, env)) || locationRaw;
        if (!locULID || !ULID_RE.test(locULID)) {
          return json(
            { error: { code: "invalid_request", message: "unknown location" } },
            400,
            { "cache-control": "no-store" }
          );
        }

        const rawRows = await env.KV_STATUS.get(campaignsByUlidKey(locULID), { type: "json" }) as any;
        const rows: any[] = Array.isArray(rawRows) ? rawRows : [];

        const nowMs = Date.now();
        const row = rows.find((r) => {
          if (!r) return false;
          if (String(r?.locationID || "").trim() !== locULID) return false;
          if (String(r?.campaignKey || "").trim() !== campaignKeyRaw) return false;

          const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
          if (st !== "active") return false;

          const sMs = parseYmdUtcMs(String(r?.startDate || ""));
          const eMs = parseYmdUtcMs(String(r?.endDate || ""));
          if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;

          if (nowMs < sMs) return false;
          if (nowMs > (eMs + 24 * 60 * 60 * 1000 - 1)) return false;

          return true;
        });

        if (!row) {
          return json(
            { error: { code: "forbidden", message: "campaign not active" } },
            403,
            { "cache-control": "no-store" }
          );
        }

        const item = await getItemById(locULID, env).catch(() => null);
        const locationName = pickName(item?.locationName) || "";

        const dvRaw = (row?.campaignDiscountValue != null) ? row.campaignDiscountValue : null;
        const discountValue =
          (typeof dvRaw === "number") ? dvRaw :
          (typeof dvRaw === "string" && dvRaw.trim() && Number.isFinite(Number(dvRaw))) ? Number(dvRaw) :
          null;

        return json(
          {
            locationID: locationRaw,
            locationULID: locULID,
            locationName,
            campaignKey: String(row?.campaignKey || "").trim(),
            campaignName: String(row?.campaignName || "").trim(),
            offerType: String(row?.offerType || "").trim(),
            productName: String(row?.productName || "").trim(),
            startDate: String(row?.startDate || "").trim(),
            endDate: String(row?.endDate || "").trim(),
            eligibilityType: String(row?.eligibilityType || "").trim(),
            eligibilityNotes: String(row?.eligibilityNotes || "").trim(),
            discountKind: String(row?.discountKind || "").trim(),
            discountValue
          },
          200,
          { "cache-control": "no-store" }
        );
      }

      // --- Promotion QR URL: GET /api/promo-qr?locationID=... [&campaignKey=...]
      if (pathname === "/api/promo-qr" && req.method === "GET") {        const u = new URL(req.url);
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

        // Resolve active campaign from KV (authoritative)
        const requestedKey = String(campaignKeyRaw || "").trim();

        // Load all active rows (effective status === active, in-window)
        const rawRows = await env.KV_STATUS.get(campaignsByUlidKey(locULID), { type: "json" }) as any;
        const rows: any[] = Array.isArray(rawRows) ? rawRows : [];

        const nowMs = Date.now();

        const isActiveRow = (r: any) => {
          if (!r) return false;
          if (String(r?.locationID || "").trim() !== locULID) return false;

          const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
          if (st !== "active") return false;

          const sMs = parseYmdUtcMs(String(r?.startDate || ""));
          const eMs = parseYmdUtcMs(String(r?.endDate || ""));
          if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;

          if (nowMs < sMs) return false;
          if (nowMs > (eMs + 24 * 60 * 60 * 1000 - 1)) return false;

          return true;
        };

        const actives = rows.filter(isActiveRow);

        if (!actives.length) {
          return json({ error: { code: "forbidden", message: "campaign required" } }, 403);
        }

        // If caller specified campaignKey, use it only if it's active.
        if (requestedKey) {
          const hit = actives.find(r => String(r?.campaignKey || "").trim() === requestedKey);
          if (!hit) {
            return json({ error: { code: "forbidden", message: "campaign not active" } }, 403);
          }
          // continue with activeRow = hit
          var activeRow = hit;
        } else {
          // No campaignKey specified:
          // - if exactly one active, proceed
          // - if multiple, force selection
          if (actives.length !== 1) {
            const items = actives.map(r => {
              const dvRaw = (r?.campaignDiscountValue != null) ? r.campaignDiscountValue : null;
              const discountValue =
                (typeof dvRaw === "number") ? dvRaw :
                (typeof dvRaw === "string" && dvRaw.trim() && Number.isFinite(Number(dvRaw))) ? Number(dvRaw) :
                null;

              return {
                campaignKey: String(r?.campaignKey || "").trim(),
                campaignName: String(r?.campaignName || "").trim(),
                productName: String(r?.productName || "").trim(),
                startDate: String(r?.startDate || "").trim(),
                endDate: String(r?.endDate || "").trim(),
                eligibilityType: String(r?.eligibilityType || "").trim(),
                eligibilityNotes: String(r?.eligibilityNotes || "").trim(),
                discountKind: String(r?.discountKind || "").trim(),
                discountValue
              };
            });
            return json({ error: { code: "multiple_active", message: "multiple active campaigns" }, items }, 409, { "cache-control": "no-store" });
          }
          var activeRow = actives[0];
        }
        if (!activeRow) {
          return json(
            { error: { code: "forbidden", message: "campaign required" } },
            403
          );
        }

        if (normCampaignPreset(activeRow?.campaignPreset) === "visibility") {
          return json(
            { error: { code: "campaign_preset_visibility", message: "Promotion is turned off for this campaign." } },
            403,
            { "cache-control": "no-store" }
          );
        }

        const chosenKey = String(activeRow.campaignKey || "").trim();
        if (!chosenKey) {
          return json(
            { error: { code: "forbidden", message: "campaign required" } },
            403
          );
        }

        // Create redeem token for this location + campaign
        const token = await createRedeemToken(env.KV_STATS, locULID, chosenKey);

        // Record that a promotion QR was shown (ARMED) for this campaign/location
        await logQrArmed(env.KV_STATS, env, locULID, req, chosenKey);

        // Build Promotion QR URL using the original locationRaw (slug), not ULID
        const qrBase = "https://navigen-api.4naama.workers.dev"; // temporary hotfix: bypass the site redeem entry until /out/qr-redeem serves pending-v2 live
        const qrUrlObj = new URL(`/out/qr-redeem/${encodeURIComponent(locationRaw)}`, qrBase);
        qrUrlObj.searchParams.set("camp", chosenKey);
        qrUrlObj.searchParams.set("rt", token);

        const dvRaw = (activeRow.campaignDiscountValue != null) ? activeRow.campaignDiscountValue : null;
        const discountValue =
          (typeof dvRaw === "number") ? dvRaw :
          (typeof dvRaw === "string" && dvRaw.trim() && Number.isFinite(Number(dvRaw))) ? Number(dvRaw) :
          null;

        return json({
          qrUrl: qrUrlObj.toString(),
          campaignName: String(activeRow.campaignName || "").trim(),
          offerType: String(activeRow.offerType || "").trim(),
          productName: String(activeRow.productName || "").trim(),
          startDate: String(activeRow.startDate || "").trim(),
          endDate: String(activeRow.endDate || "").trim(),
          eligibilityType: String(activeRow.eligibilityType || "").trim(),
          eligibilityNotes: String(activeRow.eligibilityNotes || "").trim(),
          discountKind: String(activeRow.discountKind || "").trim(),
          discountValue
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

      // --- Admin read (one-off): GET /api/admin/ownership?locationID=.
      // Returns raw ownership:<ULID> record + computed ownedNow/exclusiveUntil.
      // Auth: Bearer <JWT_SECRET> (same pattern as other admin endpoints).
      if (pathname === "/api/admin/ownership" && req.method === "GET") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error:{ code:"unauthorized", message:"Bearer token required" } }, 401, { "cache-control":"no-store" });
        }
        const token = auth.slice(7).trim();
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          return json({ error:{ code:"misconfigured", message:"JWT_SECRET not set in runtime env" } }, 500, { "cache-control":"no-store" });
        }
        if (!token || token !== expected) {
          return json({ error:{ code:"forbidden", message:"Bad token" } }, 403, { "cache-control":"no-store" });
        }

        const u = new URL(req.url);
        const idRaw = String(u.searchParams.get("locationID") || "").trim();
        if (!idRaw) {
          return json({ error:{ code:"invalid_request", message:"locationID required" } }, 400, { "cache-control":"no-store" });
        }

        const ulid = ULID_RE.test(idRaw) ? idRaw : ((await resolveUid(idRaw, env)) || "");
        if (!ulid) {
          return json({ error:{ code:"invalid_request", message:"unknown locationID" } }, 404, { "cache-control":"no-store" });
        }

        const ownKey = `ownership:${ulid}`;
        const rec = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;

        const exclusiveUntilIso = String(rec?.exclusiveUntil || "").trim();
        const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;
        const ownedNow = !!exclusiveUntil && !Number.isNaN(exclusiveUntil.getTime()) && exclusiveUntil.getTime() > Date.now();

        return json({
          ulid,
          key: ownKey,
          ownedNow,
          exclusiveUntil: exclusiveUntilIso || "",
          source: String(rec?.source || "").trim(),
          lastEventId: String(rec?.lastEventId || "").trim(),
          updatedAt: String(rec?.updatedAt || "").trim(),
          state: String(rec?.state || "").trim(),
          uid: String(rec?.uid || "").trim(),
          raw: rec || null
        }, 200, { "cache-control":"no-store" });
      }

      // --- Admin seed: POST /api/admin/seed-campaigns
      // Seeds KV_STATUS campaigns:byUlid:<ULID> from a batch of campaign rows (preseed step).
      // Auth: Bearer <JWT_SECRET> (same pattern as other admin endpoints).
      if (pathname === "/api/admin/seed-campaigns" && req.method === "POST") {
        const auth = req.headers.get("Authorization") || "";
        if (!auth.startsWith("Bearer ")) {
          return json({ error:{ code:"unauthorized", message:"Bearer token required" } }, 401);
        }
        const token = auth.slice(7).trim();
        const expected = String(env.JWT_SECRET || "").trim();
        if (!expected) {
          return json({ error:{ code:"misconfigured", message:"JWT_SECRET not set in runtime env" } }, 500, { "cache-control": "no-store" });
        }
        if (!token || token.trim() !== expected) {
          return json({ error:{ code:"forbidden", message:"Bad token" } }, 403, { "cache-control": "no-store" });
        }

        const body = await req.json().catch(() => null) as any;
        const rowsRaw: any[] =
          Array.isArray(body) ? body :
          Array.isArray(body?.rows) ? body.rows :
          Array.isArray(body?.campaigns) ? body.campaigns : [];

        if (!Array.isArray(rowsRaw) || !rowsRaw.length) {
          return json({ error:{ code:"invalid_request", message:"rows[] required" } }, 400);
        }

        // Group by ULID after resolving slug/alias where needed.
        const byUlid = new Map<string, CampaignRow[]>();
        let total = 0, wrote = 0, skipped = 0, unresolved = 0;

        for (const r of rowsRaw) {
          total++;
          try {
            const locIn = String(r?.locationID || "").trim();
            if (!locIn) { skipped++; continue; }

            const locResolved = ULID_RE.test(locIn) ? locIn : ((await resolveUid(locIn, env)) || "");
            if (!locResolved || !ULID_RE.test(locResolved)) { unresolved++; continue; }

            const ulid = locResolved;

            // Normalize campaign dates to YYYY-MM-DD.
            // campaigns.json may store Date strings (e.g. "Sun Nov 30 2025 ..."); KV requires YYYY-MM-DD.
            const normYmd = (v: any): string => {
              const s = String(v || "").trim();
              if (!s) return "";
              if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

              const d = new Date(s);
              if (Number.isNaN(d.getTime())) return "";

              // Shift forward 12h to avoid off-by-one when local midnight is parsed across timezones.
              d.setHours(d.getHours() + 12);
              return d.toISOString().slice(0, 10);
            };

            const startDate = normYmd(r?.startDate);
            const endDate   = normYmd(r?.endDate);

            if (!startDate || !endDate) { skipped++; continue; }

            const row: any = {
              locationID: ulid, // canonical ULID (existing contract)
              locationULID: ulid,
              locationSlug: locIn, // original input (slug) from campaigns.json
              campaignKey: String(r?.campaignKey || "").trim(),
              campaignName: typeof r?.campaignName === "string" ? r.campaignName : undefined,
              sectorKey: typeof r?.sectorKey === "string" ? r.sectorKey : undefined,
              brandKey: typeof r?.brandKey === "string" ? r.brandKey : undefined,
              context: typeof r?.context === "string" ? r.context : undefined,

              startDate,
              endDate,
              status: String(r?.status || "").trim() || "Draft",
              statusOverride: (r?.statusOverride != null) ? String(r.statusOverride).trim() : undefined,

              campaignType: (r?.campaignType != null) ? String(r.campaignType).trim() : undefined,
              targetChannels: r?.targetChannels,
              offerType: (r?.offerType != null) ? String(r.offerType).trim() : undefined,
              productName: (r?.productName != null) ? String(r.productName).trim() : undefined,
              discountKind: (r?.discountKind != null) ? String(r.discountKind).trim() : undefined,
              campaignDiscountValue: (r?.campaignDiscountValue != null) ? r.campaignDiscountValue : undefined,
              eligibilityType: (r?.eligibilityType != null) ? String(r.eligibilityType).trim() : undefined,
              eligibilityNotes: (r?.eligibilityNotes != null) ? String(r.eligibilityNotes).trim() : undefined,

              utmSource: (r?.utmSource != null) ? String(r.utmSource).trim() : undefined,
              utmMedium: (r?.utmMedium != null) ? String(r.utmMedium).trim() : undefined,
              utmCampaign: (r?.utmCampaign != null) ? String(r.utmCampaign).trim() : undefined,

              notes: (r?.notes != null) ? String(r.notes).trim() : undefined
            };

            if (!row.campaignKey) { skipped++; continue; }

            const arr = byUlid.get(ulid) || [];
            arr.push(row);
            byUlid.set(ulid, arr);

          } catch {
            skipped++;
          }
        }

        for (const [ulid, arr] of byUlid.entries()) {
          try {
            await env.KV_STATUS.put(campaignsByUlidKey(ulid), JSON.stringify(arr));
            wrote++;
          } catch {
            // keep going; seed should be best-effort
          }
        }

        return json({ ok: true, total, wrote, skipped, unresolved }, 200);
        }

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
        // Example locations must bypass campaign entitlement so Example Dashboards always load.
        if (!isExample) {
          const camp = await campaignEntitlementForUlid(env, loc);
          if (!camp.entitled) {
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
        const allCampaigns = await env.KV_STATUS.get(campaignsByUlidKey(loc), { type: "json" }) as any;
        const allCampaignRows: CampaignRow[] = Array.isArray(allCampaigns) ? allCampaigns : [];

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
            const meta = allCampaignRows.find(c => String(c.locationID || "").trim() === loc && String(c.campaignKey || "").trim() === key) || null;

            const uniqueCount = agg.uniqueVisitors.size;
            const repeatCount = agg.repeatVisitors.size;
            const uniqueRedeemerCount = agg.uniqueRedeemers.size;
            const repeatRedeemerCount = agg.repeatRedeemers.size;

            // Period: prefer campaign start/end if available, otherwise stats window
            const campaignStart = meta ? String((meta as any).startDate || "").trim() : "";
            const campaignEnd   = meta ? String((meta as any).endDate || "").trim() : "";
            const periodLabel = (campaignStart && campaignEnd)
              ? `${campaignStart} → ${campaignEnd}`
              : `${from} → ${to}`;

            return {
              // Campaign ID + Name + Brand for dashboard
              campaign: key || "",
              campaignName: meta ? (String((meta as any).campaignName || "").trim()) : "",
              brand: meta ? (String((meta as any).brandKey || "").trim()) : "",
              target: meta ? (String((meta as any).context || "").trim()) : "",
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

      // --- Promo redeem landing: /out/qr-redeem/<slug>?camp=...&rt=...
      // Redirect only with pending state; the landing page must ask the backend for the real redeem outcome.
      if (pathname.startsWith("/out/qr-redeem/") && req.method === "GET") {
        const parts = pathname.split("/").filter(Boolean); // ['out','qr-redeem','id']
        const idRaw = parts[2] || "";
        const loc = await resolveUid(idRaw, env);
        if (!loc) {
          return json({ error:{ code:"invalid_request", message:"bad id" } }, 400);
        }

        const u = new URL(req.url);
        const token =
          (u.searchParams.get("rt") || "").trim() ||
          (u.searchParams.get("token") || "").trim();
        const camp = (u.searchParams.get("camp") || "").trim();

        const landing = new URL("/", "https://navigen.io"); // redeem landing must always return to the site shell, even when QR entry uses the API worker
        landing.searchParams.set("lp", idRaw);
        landing.searchParams.set("redeem", "pending");
        if (camp) landing.searchParams.set("camp", camp);
        if (token) landing.searchParams.set("rt", token);

        return new Response(null, {
          status: 302,
          headers: {
            "Location": landing.toString(),
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "CDN-Cache-Control": "no-store",
            "Pragma": "no-cache",
            "Expires": "0",
            "Referrer-Policy": "no-referrer",
            "X-NG-Redeem-Contract": "pending-v2",
            "X-NG-Redeem-Build": "2026-03-11-api-pending-v4",
            "Access-Control-Allow-Origin": "https://navigen.io",
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin"
          }
        });
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

        // QR-redeem must be accepted broadly; token + KV record enforce validity.

        const loc = await resolveUid(idRaw, env);
        if (!loc) {
          return json({ error:{ code:"invalid_request", message:"bad id" } }, 400);
        }

        const now = new Date();
        const country = (req as any).cf?.country || "";
        const day = dayKeyFor(now, undefined, country);

        if (ev === "rating") {
          const url = new URL(req.url);
          const scoreRaw = (url.searchParams.get("score") || "").trim();
          const score = parseInt(scoreRaw, 10);

          if (!Number.isFinite(score) || score < 1 || score > 5) {
            return json(
              { error: { code: "invalid_request", message: "score must be 1-5" } },
              400,
              { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
            );
          }

          const deviceKey = readRatingDeviceKey(req);
          if (!deviceKey) {
            return json(
              { error: { code: "invalid_request", message: "rating device missing" } },
              400,
              { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
            );
          }

          const voteKey = ratingVoteKey(loc, deviceKey);
          const prev = await env.KV_STATUS.get(voteKey, { type: "json" }) as any;

          const prevScore = Number(prev?.score);
          const prevDay = String(prev?.day || "").trim();
          const prevVotedAtMs = Date.parse(String(prev?.votedAt || ""));

          const isLocked =
            Number.isFinite(prevScore) &&
            prevScore >= 1 &&
            prevScore <= 5 &&
            Number.isFinite(prevVotedAtMs) &&
            (now.getTime() - prevVotedAtMs) < RATING_WINDOW_MS;

          const summary = await readRatingSummary(env, loc);

          let nextCount = summary.count;
          let nextSum = summary.sum;
          let applied: "new" | "updated" | "noop" = "new";

          if (isLocked) {
            const delta = score - prevScore;

            if (delta !== 0) {
              if (prevDay && prevDay !== day) {
                await kvAdd(env.KV_STATS, `stats:${loc}:${prevDay}:rating`, -1);
                await kvAdd(env.KV_STATS, `stats:${loc}:${prevDay}:rating-score`, -prevScore);
                await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating`, 1);
                await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating-score`, score);
              } else {
                await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating-score`, delta);
              }

              nextSum = Math.max(0, nextSum + delta);
              applied = "updated";
            } else {
              applied = "noop";
            }
          } else {
            await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);
            await kvAdd(env.KV_STATS, `stats:${loc}:${day}:rating-score`, score);
            nextCount += 1;
            nextSum += score;
            applied = "new";
          }

          await env.KV_STATUS.put(
            ratingSummaryKey(loc),
            JSON.stringify({
              count: nextCount,
              sum: nextSum,
              updatedAt: now.toISOString()
            })
          );

          const lockedUntil = new Date(now.getTime() + RATING_WINDOW_MS).toISOString();

          await env.KV_STATUS.put(
            voteKey,
            JSON.stringify({
              score,
              day,
              votedAt: now.toISOString()
            }),
            { expirationTtl: 60 * 60 * 24 * 31 }
          );

          return json(
            {
              ok: true,
              locationID: loc,
              applied,
              ratingAvg: nextCount > 0 ? (nextSum / nextCount) : 0,
              ratedSum: nextCount,
              userScore: score,
              ratingLockedUntil: lockedUntil,
              ratingCooldownMinutes: 30
            },
            200,
            { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
          );
        }

        // always increment the base event counter (e.g., 'share' → how many times the action was used)
        await kvIncr(env.KV_STATS, `stats:${loc}:${day}:${ev}`);

        // For QR scan events, also log a per-scan record (powers QR Info / Campaigns in the dash).
        if (ev === "qr-scan") {
          await logQrScan(env.KV_STATS, env, loc, req);
        }

        // For QR redeem events, validate token and return a truthful outcome for the landing page.
        if (ev === "qr-redeem") {
          // Accept token from header OR query string.
          // Reason: real QR scans open a URL and cannot send custom headers.
          const u = new URL(req.url);
          const token =
            (req.headers.get("X-NG-QR-Token") || "").trim() ||
            (u.searchParams.get("rt") || "").trim() ||
            (u.searchParams.get("token") || "").trim();
          const wantsJson = (u.searchParams.get("json") || "").trim() === "1";

          const finish = async (
            outcome: "ok" | "used" | "inactive" | "invalid",
            campaignKey = ""
          ) => {
            if (outcome === "ok") {
              await logQrRedeem(env.KV_STATS, env, loc, req, campaignKey);
            } else {
              await logQrRedeemInvalid(env.KV_STATS, env, loc, req, campaignKey);
            }

            if (wantsJson) {
              return json(
                { ok: outcome === "ok", outcome, campaignKey },
                200,
                { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
              );
            }

            return new Response(null, {
              status: 204,
              headers: {
                "Access-Control-Allow-Origin": "https://navigen.io",
                "Access-Control-Allow-Credentials": "true",
                "Vary": "Origin"
              }
            });
          };

          // Promo redeem is campaign-paid: campaign entitlement is enforced below via tokenCampaignKey.
          if (!token) {
            return await finish("invalid");
          }

          const recRaw = await env.KV_STATS.get(`redeem:${token}`, "text");
          let tokenCampaignKey = "";
          let tokenLocationID = "";
          let tokenStatus = "";

          try {
            const rec = recRaw ? (JSON.parse(recRaw) as RedeemTokenRecord) : null;
            tokenCampaignKey = String(rec?.campaignKey || "").trim();
            tokenLocationID = String(rec?.locationID || "").trim();
            tokenStatus = String(rec?.status || "").trim();
          } catch {
            tokenCampaignKey = "";
            tokenLocationID = "";
            tokenStatus = "";
          }

          if (!tokenCampaignKey || !tokenLocationID || tokenLocationID !== loc) {
            return await finish("invalid", tokenCampaignKey);
          }

          // Validate: the token's campaignKey must still be active for this ULID (no "winner" logic).
          const rawRows = await env.KV_STATUS.get(campaignsByUlidKey(loc), { type: "json" }) as any;
          const rows: any[] = Array.isArray(rawRows) ? rawRows : [];

          const nowMs = Date.now();
          const tokenCampaignIsActive = rows.some((r: any) => {
            if (!r || String(r.locationID || "").trim() !== loc) return false;
            const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
            if (st !== "active") return false;
            const sMs = parseYmdUtcMs(String(r?.startDate || ""));
            const eMs = parseYmdUtcMs(String(r?.endDate || ""));
            if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) return false;
            if (nowMs < sMs) return false;
            if (nowMs > (eMs + 24 * 60 * 60 * 1000 - 1)) return false;
            return String(r?.campaignKey || "").trim() === tokenCampaignKey;
          });

          if (!tokenCampaignIsActive) {
            return await finish("inactive", tokenCampaignKey);
          }

          if (tokenStatus === "redeemed") {
            return await finish("used", tokenCampaignKey);
          }

          const result = await consumeRedeemToken(env.KV_STATS, token, loc, tokenCampaignKey);

          if (result === "ok") {
            return await finish("ok", tokenCampaignKey);
          }
          if (result === "used") {
            return await finish("used", tokenCampaignKey);
          }
          return await finish("invalid", tokenCampaignKey);
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
        const body = await req.json().catch(() => null) as any;
        return await createCampaignCheckoutSession(env, req, body, noStore);
      }

      // (Stubs for later)
      // if (pathname === "/api/checkout") { ... }
      // if (pathname === "/api/webhook")  { ... }
      // if (pathname === "/m/edit")       { ... }
      // if (pathname === "/api/location/update") { ... }

      // use normPath declared earlier; do not redeclare here

      // GET /api/campaigns/active?context=<pageKey?>
      // KV-authoritative list of active campaigns, used by Promotions modal.
      if (pathname === "/api/campaigns/active" && req.method === "GET") {
        const u = new URL(req.url);
        const ctx = String(u.searchParams.get("context") || "").trim().toLowerCase();

        const todayISO = (() => {
          const now = new Date();
          // normalize to YYYY-MM-DD in UTC for window comparisons
          return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        })();

        const isActiveRow = (r: any) => {
          const st = String(r?.statusOverride || r?.status || "").trim().toLowerCase();
          if (st !== "active") return false;
          const sd = String(r?.startDate || "").trim();
          const ed = String(r?.endDate || "").trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(sd) || !/^\d{4}-\d{2}-\d{2}$/.test(ed)) return false;
          return todayISO >= sd && todayISO <= ed;
        };

        const matchesContext = (r: any) => {
          if (!ctx) return true;
          const raw = String(r?.context || "").trim().toLowerCase();
          if (!raw) return true; // empty ctx means global
          const arr = raw.split(";").map(s => s.trim()).filter(Boolean);
          return arr.includes(ctx);
        };

        // Walk KV campaigns:byUlid:* (small set; safe for now)
        const out: any[] = [];
        let cursor: string | undefined = undefined;

        for (let guard = 0; guard < 25; guard++) { // hard guard against accidental infinite paging
          const page = await env.KV_STATUS.list({ prefix: "campaigns:byUlid:", cursor });
          for (const k of (page.keys || [])) {
            const raw = await env.KV_STATUS.get(k.name, "text");
            if (!raw) continue;
            let rows: any[] = [];
            try { rows = JSON.parse(raw); } catch { rows = []; }
            if (!Array.isArray(rows)) continue;

            const actives = rows.filter(r => isActiveRow(r) && matchesContext(r));
            for (const r of actives) {
              const locationULID = String(r?.locationULID || r?.locationID || "").trim();
              const locationSlug = String(r?.locationSlug || "").trim();

              // Resolve human name by slug (profiles.json is keyed by locationID=slug)
              const locationName = (await nameForLocation(locationSlug, env)) || "";

              const dvRaw = (r?.campaignDiscountValue != null) ? r.campaignDiscountValue : null;
              const discountValue =
                (typeof dvRaw === "number") ? dvRaw :
                (typeof dvRaw === "string" && dvRaw.trim() && Number.isFinite(Number(dvRaw))) ? Number(dvRaw) :
                null;

              out.push({
                campaignKey: String(r?.campaignKey || "").trim(),
                campaignName: String(r?.campaignName || "").trim(),
                locationID: locationSlug || locationULID,
                locationULID,
                locationSlug,
                locationName,
                context: String(r?.context || "").trim(),
                offerType: String(r?.offerType || "").trim(),
                productName: String(r?.productName || r?.offerType || "").trim(),
                eligibilityType: String(r?.eligibilityType || "").trim(),
                eligibilityNotes: String(r?.eligibilityNotes || "").trim(),
                discountKind: String(r?.discountKind || "").trim(),
                discountValue,
                startDate: String(r?.startDate || "").trim(),
                endDate: String(r?.endDate || "").trim(),
                status: String(r?.statusOverride || r?.status || "").trim()
              });
            }
          }

          cursor = page.cursor;
          if (!page.list_complete) break;
          if (!cursor) break;
        }

        return json({ items: out }, 200, { "cache-control": "no-store" });
      }

      // GET /api/data/list?context=...&limit=...&cursor=...
      // Authoritative Phase 8 context list:
      // - membership from ContextShardDO
      // - rows hydrated from KV effective published profiles
      // - visibility ordering applied here: promoted → visible → hidden excluded
      if (normPath === "/api/data/list" && req.method === "GET") {
        const contextKey = String(url.searchParams.get("context") || "").trim().toLowerCase();
        const limitRaw = Number(url.searchParams.get("limit") || "99");
        const limit = Math.max(1, Math.min(250, Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 99));

        const cursorStr = String(url.searchParams.get("cursor") || "").trim();
        const start = /^[0-9]+$/.test(cursorStr) ? Math.max(0, parseInt(cursorStr, 10)) : 0;

        if (!contextKey) {
          return json(
            { items: [], nextCursor: null, totalApprox: 0 },
            200,
            { "x-navigen-route": "/api/data/list", "Cache-Control": "no-store" }
          );
        }

        try {
          const contextUlids = await listContextShardUlids(env, contextKey);

          const ranked: Array<{ payload: any; rank: number; idx: number }> = [];

          for (let idx = 0; idx < contextUlids.length; idx++) {
            const ulid = contextUlids[idx];
            const rec = await readPublishedEffectiveProfileByUlid(ulid, env);
            if (!rec) continue;

            const vis = await computeVisibilityState(env, ulid);
            if (vis.visibilityState === "hidden") continue;

            const rank =
              vis.visibilityState === "promoted" ? 2 :
              vis.visibilityState === "visible" ? 1 : 0;

            ranked.push({
              payload: buildPublicListPayload(rec),
              rank,
              idx
            });
          }

          ranked.sort((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            return a.idx - b.idx; // stable within same visibility class
          });

          const totalApprox = ranked.length;
          const items = ranked.slice(start, start + limit).map((x) => x.payload);
          const nextCursor = (start + limit) < totalApprox ? String(start + limit) : null;

          return json(
            { items, nextCursor, totalApprox },
            200,
            {
              "x-navigen-route": "/api/data/list",
              "x-ng-list-order": "promoted-visible-hidden-excluded",
              "Cache-Control": "no-store"
            }
          );
        } catch (e: any) {
          return json(
            {
              error: {
                code: "list_failed",
                message: String(e?.message || "context list failed")
              }
            },
            500,
            {
              "x-navigen-route": "/api/data/list",
              "Cache-Control": "no-store"
            }
          );
        }
      }

      // GET /api/data/profile?id=...
      // profile: accept alias or ULID; return merged effective published profile from KV authority
      if (normPath === "/api/data/profile" && req.method === "GET") {
        const raw = (url.searchParams.get("id") || "").trim();
        if (!raw) {
          return json(
            { error: { code: "invalid_request", message: "id required" } },
            400,
            { "x-navigen-route": "/api/data/profile" }
          );
        }

        const rec = await readPublishedEffectiveProfileByAnyId(raw, env);
        if (!rec) {
          return json(
            { error: { code: "not_found", message: "profile not found" } },
            404,
            { "x-navigen-route": "/api/data/profile" }
          );
        }

        return json(
          buildPublicProfilePayload(rec),
          200,
          { "x-navigen-route": "/api/data/profile", "Cache-Control": "no-store" }
        );
      }

      // GET /api/data/item?id=...
      // item: accept alias or ULID; return single item + contexts[] from KV authority
      if (normPath === "/api/data/item" && req.method === "GET") {
        const idParam = (url.searchParams.get("id") || "").trim();
        if (!idParam) {
          return json(
            { error: { code: "invalid_request", message: "id required" } },
            400,
            { "x-navigen-route": "/api/data/item" }
          );
        }

        const rec = await readPublishedEffectiveProfileByAnyId(idParam, env);
        if (!rec) {
          return json(
            { error: { code: "not_found", message: "item not found" } },
            404,
            { "x-navigen-route": "/api/data/item" }
          );
        }

        return json(
          buildPublicItemPayload(rec),
          200,
          { "x-navigen-route": "/api/data/item", "Cache-Control": "no-store" }
        );
      }
      
      // GET /api/data/contact?id=...
      // contact: accept alias or ULID; return contact payload from KV authority
      if (normPath === "/api/data/contact" && req.method === "GET") {
        const idParam = (url.searchParams.get("id") || url.searchParams.get("locationID") || "").trim();
        if (!idParam) {
          return json(
            { error: { code: "invalid_request", message: "id required" } },
            400,
            { "x-navigen-route": "/api/data/contact" }
          );
        }

        const rec = await readPublishedEffectiveProfileByAnyId(idParam, env);
        if (!rec) {
          return json(
            { error: { code: "not_found", message: "contact not found" } },
            404,
            { "x-navigen-route": "/api/data/contact" }
          );
        }

        return json(
          buildPublicContactPayload(rec),
          200,
          { "x-navigen-route": "/api/data/contact", "Cache-Control": "no-store" }
        );
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

async function nameForLocation(id: string, env: Env): Promise<string | undefined> {
  try {
    const mapped = (await resolveUid(id, env)) || String(id || "").trim();
    const ulid = ULID_RE.test(mapped) ? mapped : "";
    if (!ulid) return undefined;

    const base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" }) as any;
    if (!base || typeof base !== "object") return undefined;

    const override = (await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) as any) || {};
    const effective = deepMergeProfile(base, override);

    const ln = effective?.locationName || effective?.name || effective?.listedName;
    const name =
      typeof ln === "string"
        ? ln.trim()
        : String(ln?.en || ln?.hu || Object.values(ln || {})[0] || "").trim();

    return name || undefined;
  } catch {
    return undefined;
  }
}

async function nameForEntity(_id: string): Promise<string | undefined> {
  return undefined; // entities don't have names in profiles.json
}

async function readPublishedEffectiveProfileByAnyId(
  idOrAlias: string,
  env: Env
): Promise<{ ulid: string; locationID: string; effective: any } | null> {
  const raw = String(idOrAlias || "").trim();
  if (!raw) return null;

  const mapped = (await resolveUid(raw, env)) || raw;
  const ulid = ULID_RE.test(mapped) ? mapped : "";
  if (!ulid) return null;

  const base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" }) as any;
  if (!base || typeof base !== "object") return null;

  const override = (await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) as any) || {};
  const effective = deepMergeProfile(base, override);
  const locationID = String(effective?.locationID || base?.locationID || "").trim();

  if (!locationID) return null;

  return { ulid, locationID, effective };
}

function buildPublicProfilePayload(rec: { ulid: string; locationID: string; effective: any }): any {
  const effective = (rec?.effective && typeof rec.effective === "object") ? rec.effective : {};
  return {
    ...effective,
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    contexts: splitContextMemberships(effective?.context)
  };
}

function buildPublicItemPayload(rec: { ulid: string; locationID: string; effective: any }): any {
  const effective = (rec?.effective && typeof rec.effective === "object") ? rec.effective : {};
  return {
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    contexts: splitContextMemberships(effective?.context),
    locationName: effective.locationName || effective.name,
    media: effective.media || {},
    coord: effective.coord || effective["Coordinate Compound"] || "",
    links: effective.links || {},
    contactInformation: effective.contactInformation || effective.contact || {},
    descriptions: effective.descriptions || {},
    tags: Array.isArray(effective.tags) ? effective.tags : [],
    ratings: effective.ratings || {},
    pricing: effective.pricing || {},
    groupKey: effective.groupKey || "",
    subgroupKey: effective.subgroupKey || ""
  };
}

function buildPublicContactPayload(rec: { ulid: string; locationID: string; effective: any }): any {
  const effective = (rec?.effective && typeof rec.effective === "object") ? rec.effective : {};
  return {
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    contexts: splitContextMemberships(effective?.context),
    locationName: effective.locationName || effective.name,
    contactInformation: effective.contactInformation || effective.contact || {},
    links: effective.links || {}
  };
}

async function readPublishedEffectiveProfileByUlid(
  ulid: string,
  env: Env
): Promise<{ ulid: string; locationID: string; effective: any } | null> {
  const id = String(ulid || "").trim();
  if (!ULID_RE.test(id)) return null;

  const base = await env.KV_STATUS.get(`profile_base:${id}`, { type: "json" }) as any;
  if (!base || typeof base !== "object") return null;

  const override = (await env.KV_STATUS.get(`override:${id}`, { type: "json" }) as any) || {};
  const effective = deepMergeProfile(base, override);
  const locationID = String(effective?.locationID || base?.locationID || "").trim();
  if (!locationID) return null;

  return { ulid: id, locationID, effective };
}

function buildPublicListPayload(rec: { ulid: string; locationID: string; effective: any }): any {
  const effective = (rec?.effective && typeof rec.effective === "object") ? rec.effective : {};
  const media = (effective?.media && typeof effective.media === "object") ? effective.media : {};
  const images = Array.isArray(media.images) ? media.images : [];

  return {
    ...effective,
    id: rec.ulid,
    ID: rec.ulid,
    locationUID: rec.ulid,
    locationID: rec.locationID,
    alias: rec.locationID,
    contexts: splitContextMemberships(effective?.context),
    coord: effective?.coord || effective?.["Coordinate Compound"] || "",
    media: {
      ...media,
      cover: String(media?.cover || "").trim(),
      images: images.map((v: any) => (typeof v === "string" ? v : v?.src)).filter(Boolean)
    },
    contactInformation: effective?.contactInformation || effective?.contact || {},
    links: effective?.links || {},
    descriptions: effective?.descriptions || {},
    tags: Array.isArray(effective?.tags) ? effective.tags : [],
    ratings: effective?.ratings || {},
    pricing: effective?.pricing || {}
  };
}

async function listContextShardUlids(env: Env, contextKey: string): Promise<string[]> {
  const key = String(contextKey || "").trim();
  if (!key) return [];

  const j = await contextShardCall(env, key, { ver: 1, op: "list" });
  const arr = Array.isArray(j?.ulids) ? j.ulids : [];

  return arr
    .map((v: any) => String(v || "").trim())
    .filter((v: string) => ULID_RE.test(v));
}

function selectorNormalizeText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_.\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function selectorTokens(value: unknown): string[] {
  return selectorNormalizeText(value).split(/\s+/).filter(Boolean);
}

function selectorDisplayName(profile: any): string {
  const raw = profile?.locationName ?? profile?.listedName ?? profile?.name ?? "";
  if (typeof raw === "string") return String(raw || "").trim();
  if (raw && typeof raw === "object") {
    return String((raw as any).en || Object.values(raw)[0] || "").trim();
  }
  return "";
}

function selectorAddressLine(profile: any): string {
  const c =
    profile?.contactInformation && typeof profile.contactInformation === "object"
      ? profile.contactInformation
      : (profile?.contact && typeof profile.contact === "object" ? profile.contact : {});

  return [c.address, c.city]
    .map((v: any) => String(v || "").trim())
    .filter(Boolean)
    .join(", ");
}

function selectorSearchHay(profile: any, slug: string): string {
  const c =
    profile?.contactInformation && typeof profile.contactInformation === "object"
      ? profile.contactInformation
      : (profile?.contact && typeof profile.contact === "object" ? profile.contact : {});

  const tags = Array.isArray(profile?.tags)
    ? profile.tags.map((k: any) => String(k || "").replace(/^tag\./, "")).join(" ")
    : "";

  const person = String(c.contactPerson || "").trim();
  const contact = [c.phone, c.email, c.whatsapp, c.telegram, c.messenger]
    .map((v: any) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");

  const addressSearch = [c.address, c.city, c.adminArea, c.postalCode, c.countryCode]
    .map((v: any) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");

  const names = (() => {
    const ln = profile?.locationName;
    if (typeof ln === "string") return ln;
    if (ln && typeof ln === "object") return Object.values(ln).map(v => String(v || "").trim()).filter(Boolean).join(" ");
    return "";
  })();

  return selectorNormalizeText([names, slug, addressSearch, tags, person, contact].filter(Boolean).join(" "));
}

function selectorScore(profile: any, slug: string, query: string): number {
  const qNorm = selectorNormalizeText(query);
  const tokens = selectorTokens(query);
  if (!tokens.length) return 0;

  const nameNorm = selectorNormalizeText(selectorDisplayName(profile));
  const slugNorm = selectorNormalizeText(slug);
  const hay = selectorSearchHay(profile, slug);

  if (!tokens.every((tok) => hay.includes(tok))) return 0;

  let score = 0;

  if (slugNorm === qNorm) score += 520;
  if (nameNorm === qNorm) score += 480;
  if (slugNorm.startsWith(qNorm)) score += 260;
  if (nameNorm.startsWith(qNorm)) score += 220;
  if (hay.includes(qNorm)) score += 40;

  for (const tok of tokens) {
    if (nameNorm.includes(tok)) score += 32;
    if (slugNorm.includes(tok)) score += 28;
    if (hay.includes(tok)) score += 8;
  }

  return score;
}

async function readPublishedEffectiveProfile(env: Env, ulid: string): Promise<any | null> {
  const base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" }) as any;
  if (!base || typeof base !== "object") return null;

  const override = (await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) as any) || {};
  return deepMergeProfile(base, override);
}

async function buildLocationSelectorItem(env: Env, ulid: string, effective: any): Promise<any | null> {
  const slug = String(effective?.locationID || "").trim();
  if (!slug) return null;

  const vis = await computeVisibilityState(env, ulid);
  const camp = await campaignEntitlementForUlid(env, ulid);

  return {
    ...effective,
    id: ulid,
    ID: ulid,
    locationUID: ulid,
    locationID: slug,
    sybAddressLine: selectorAddressLine(effective),
    sybStatus: {
      ownedNow: vis.ownedNow,
      visibilityState: vis.visibilityState,
      courtesyUntil: vis.courtesyUntil,
      campaignEntitled: camp.entitled,
      campaignEndsAt: camp.endDate,
      activeCampaignKey: camp.campaignKey
    }
  };
}

function ownerSelectorNormalizeText(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_.\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ownerSelectorTokens(value: unknown): string[] {
  return ownerSelectorNormalizeText(value).split(/\s+/).filter(Boolean);
}

function ownerSelectorDisplayName(profile: any): string {
  const raw = profile?.locationName ?? profile?.listedName ?? profile?.name ?? "";
  if (typeof raw === "string") return String(raw || "").trim();
  if (raw && typeof raw === "object") {
    return String((raw as any).en || Object.values(raw)[0] || "").trim();
  }
  return "";
}

function ownerSelectorAddressLine(profile: any): string {
  const c =
    profile?.contactInformation && typeof profile.contactInformation === "object"
      ? profile.contactInformation
      : ((profile?.contact && typeof profile.contact === "object") ? profile.contact : {});

  return [c.address, c.city]
    .map((v: any) => String(v || "").trim())
    .filter(Boolean)
    .join(", ");
}

function ownerSelectorSearchHay(profile: any, slug: string): string {
  const c =
    profile?.contactInformation && typeof profile.contactInformation === "object"
      ? profile.contactInformation
      : ((profile?.contact && typeof profile.contact === "object") ? profile.contact : {});

  const tags = Array.isArray(profile?.tags)
    ? profile.tags.map((k: any) => String(k || "").replace(/^tag\./, "")).join(" ")
    : "";

  const person = String(c.contactPerson || "").trim();
  const contact = [c.phone, c.email, c.whatsapp, c.telegram, c.messenger]
    .map((v: any) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");

  const addressSearch = [c.address, c.city, c.adminArea, c.postalCode, c.countryCode]
    .map((v: any) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");

  const names = (() => {
    const ln = profile?.locationName;
    if (typeof ln === "string") return ln;
    if (ln && typeof ln === "object") return Object.values(ln).map(v => String(v || "").trim()).filter(Boolean).join(" ");
    return "";
  })();

  return ownerSelectorNormalizeText([names, slug, addressSearch, tags, person, contact].filter(Boolean).join(" "));
}

function ownerSelectorScore(profile: any, slug: string, query: string): number {
  const qNorm = ownerSelectorNormalizeText(query);
  const tokens = ownerSelectorTokens(query);
  if (!tokens.length) return 0;

  const nameNorm = ownerSelectorNormalizeText(ownerSelectorDisplayName(profile));
  const slugNorm = ownerSelectorNormalizeText(slug);
  const hay = ownerSelectorSearchHay(profile, slug);

  if (!tokens.every((tok) => hay.includes(tok))) return 0;

  let score = 0;

  if (slugNorm === qNorm) score += 520;
  if (nameNorm === qNorm) score += 480;
  if (slugNorm.startsWith(qNorm)) score += 260;
  if (nameNorm.startsWith(qNorm)) score += 220;
  if (hay.includes(qNorm)) score += 40;

  for (const tok of tokens) {
    if (nameNorm.includes(tok)) score += 32;
    if (slugNorm.includes(tok)) score += 28;
    if (hay.includes(tok)) score += 8;
  }

  return score;
}

async function buildOwnerLocationSelectorItem(
  env: Env,
  rec: { ulid: string; locationID: string; effective: any }
): Promise<any | null> {
  const vis = await computeVisibilityState(env, rec.ulid);
  const camp = await campaignEntitlementForUlid(env, rec.ulid);

  return {
    ...buildPublicListPayload(rec),
    sybAddressLine: ownerSelectorAddressLine(rec.effective),
    sybStatus: {
      ownedNow: vis.ownedNow,
      visibilityState: vis.visibilityState,
      courtesyUntil: vis.courtesyUntil,
      campaignEntitled: camp.entitled,
      campaignEndsAt: camp.endDate,
      activeCampaignKey: camp.campaignKey
    }
  };
}

async function listPublishedLocationSelectorItems(
  env: Env,
  opts: { query?: string; limit?: number } = {}
): Promise<any[]> {
  const query = String(opts?.query || "").trim();
  const limitRaw = Number(opts?.limit || 5);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(Math.trunc(limitRaw), 10)) : 5;

  if (ownerSelectorNormalizeText(query).replace(/\s+/g, "").length < 3) return [];

  const candidates: Array<{ ulid: string; locationID: string; score: number; displayName: string }> = [];
  let cursor: string | undefined = undefined;

  do {
    const page = await env.KV_STATUS.list({ prefix: "profile_base:", cursor });
    const pageHits = await Promise.all(
      page.keys.map(async (key) => {
        const name = String(key.name || "");
        const ulid = name.replace(/^profile_base:/, "").trim();
        if (!ULID_RE.test(ulid)) return null;

        const base = await env.KV_STATUS.get(name, { type: "json" }) as any;
        if (!base || typeof base !== "object") return null;

        const slug = String(base?.locationID || "").trim();
        if (!slug) return null;

        const score = ownerSelectorScore(base, slug, query);
        if (score <= 0) return null;

        return {
          ulid,
          locationID: slug,
          score,
          displayName: ownerSelectorDisplayName(base) || slug
        };
      })
    );

    pageHits.forEach((hit) => {
      if (hit) candidates.push(hit);
    });

    cursor = page.cursor || undefined;
  } while (cursor);

  if (!candidates.length) return [];

  candidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
  });

  const top = candidates.slice(0, limit);

  const items = await Promise.all(
    top.map(async (row) => {
      const rec = await readPublishedEffectiveProfileByUlid(row.ulid, env);
      if (!rec) return null;
      return await buildOwnerLocationSelectorItem(env, rec);
    })
  );

  return items.filter(Boolean);
}

// ---------- handlers ----------

async function handleLocationDraft(req: Request, env: Env): Promise<Response> {
  const noStore = { "cache-control": "no-store" };

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore
    );
  }

  const locationID = String((body as any)?.locationID || "").trim();
  const draftULID = String((body as any)?.draftULID || "").trim();
  const googlePlaceId = String((body as any)?.googlePlaceId || (body as any)?.place_id || "").trim();
  let draftSessionId = String((body as any)?.draftSessionId || "").trim();
  const rawDraft = ((body as any)?.draft && typeof (body as any).draft === "object")
    ? (body as any).draft
    : {};

  if (locationID && draftULID) {
    return json(
      { error: { code: "invalid_request", message: "locationID and draftULID cannot be combined" } },
      400,
      noStore
    );
  }

  if (googlePlaceId && !isValidGooglePlaceId(googlePlaceId)) {
    return json(
      { error: { code: "invalid_request", message: "invalid googlePlaceId" } },
      400,
      noStore
    );
  }

  let normalizedPatch: Record<string, any>;
  try {
    normalizedPatch = normalizeDraftPatch(rawDraft, googlePlaceId);
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "invalid_coordinates") {
      return json(
        { error: { code: "invalid_request", message: "invalid coordinates" } },
        400,
        noStore
      );
    }
    return json(
      { error: { code: "invalid_request", message: msg || "invalid draft payload" } },
      400,
      noStore
    );
  }

  // A) existing location route
  if (locationID) {
    const ulid = await resolveUid(locationID, env);
    if (!ulid) {
      return json(
        { error: { code: "not_found", message: "unknown locationID" } },
        404,
        noStore
      );
    }

    if (!draftSessionId) draftSessionId = mintDraftSessionId();

    const key = `override_draft:${ulid}:${draftSessionId}`;
    const prev = await env.KV_STATUS.get(key, { type: "json" }) as any;
    const nextDraft = mergeDraftPatch(prev, normalizedPatch);

    const classificationError = await safeValidateClassificationSelection(req, nextDraft);
    if (classificationError) {
      return json(
        { error: { code: "invalid_request", message: classificationError } },
        400,
        noStore
      );
    }

    nextDraft.updatedAt = new Date().toISOString();

    await env.KV_STATUS.put(key, JSON.stringify(nextDraft));

    return json(
      { ok: true, locationID, draftSessionId },
      200,
      noStore
    );
  }

  // B) existing brand-new draft update
  if (draftULID) {
    if (!ULID_RE.test(draftULID) || !draftSessionId) {
      return json(
        { error: { code: "invalid_request", message: "draftULID and draftSessionId required" } },
        400,
        noStore
      );
    }

    const key = `override_draft:${draftULID}:${draftSessionId}`;
    const prev = await env.KV_STATUS.get(key, { type: "json" }) as any;
    if (!prev) {
      return json(
        { error: { code: "not_found", message: "draft not found" } },
        404,
        noStore
      );
    }

    const nextDraft = mergeDraftPatch(prev, normalizedPatch);

    const classificationError = await safeValidateClassificationSelection(req, nextDraft);
    if (classificationError) {
      return json(
        { error: { code: "invalid_request", message: classificationError } },
        400,
        noStore
      );
    }

    nextDraft.updatedAt = new Date().toISOString();

    await env.KV_STATUS.put(key, JSON.stringify(nextDraft));

    return json(
      { ok: true, draftULID, draftSessionId },
      200,
      noStore
    );
  }

  // C / D) new manual shell or new Google-reference shell
  const newDraftULID = mintDraftUlid();
  const newDraftSessionId = mintDraftSessionId();
  const key = `override_draft:${newDraftULID}:${newDraftSessionId}`;

  const nextDraft = mergeDraftPatch({}, normalizedPatch);

  const classificationError = await safeValidateClassificationSelection(req, nextDraft);
  if (classificationError) {
    return json(
      { error: { code: "invalid_request", message: classificationError } },
      400,
      noStore
    );
  }

  nextDraft.updatedAt = new Date().toISOString();

  await env.KV_STATUS.put(key, JSON.stringify(nextDraft));

  return json(
    { ok: true, draftULID: newDraftULID, draftSessionId: newDraftSessionId },
    200,
    noStore
  );
}

function deepMergeProfile(base: any, patch: any): any {
  if (patch === undefined) return base;
  if (Array.isArray(base) || Array.isArray(patch)) return patch;
  if (base && typeof base === "object" && patch && typeof patch === "object") {
    const out: any = { ...base };
    for (const [k, v] of Object.entries(patch)) {
      out[k] = deepMergeProfile(out[k], v);
    }
    return out;
  }
  return patch;
}

function pickCanonicalName(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object") {
    return String(raw.en || raw.hu || Object.values(raw)[0] || "").trim();
  }
  return "";
}

function extractCoord(profile: any): { lat: number; lng: number } | null {
  const c = profile?.coord;
  if (!c || typeof c !== "object") return null;
  const lat = Number(c?.lat);
  const lng = Number(c?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function slugifyNamePart(name: string): string {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function geoSuffixFromCoord(coord: { lat: number; lng: number }): string {
  const lat = Math.round(Math.abs(coord.lat) * 1e6);
  const lng = Math.round(Math.abs(coord.lng) * 1e6);
  const composite = `${lat}${lng}`;
  return composite.slice(-4).padStart(4, "0");
}

async function findAvailableSlug(env: Env, baseSlug: string, currentUlid = ""): Promise<string> {
  let candidate = baseSlug;
  for (let i = 0; i < 1000; i++) {
    const mapped = await env.KV_ALIASES.get(aliasKey(candidate), "json") as any;
    const hit = String(typeof mapped === "string" ? mapped : mapped?.locationID || "").trim();
    if (!hit || (currentUlid && hit === currentUlid)) return candidate;
    candidate = `${baseSlug}-${i + 2}`;
  }
  throw new Error("slug_collision_exhausted");
}

async function loadLegacyProfileBySlug(req: Request, locationID: string): Promise<any | null> {
  const slug = String(locationID || "").trim();
  if (!slug) return null;

  const origin = req.headers.get("Origin") || "https://navigen.io";
  const u = new URL("/api/data/profile", origin);
  u.searchParams.set("id", slug);

  const r = await fetch(u.toString(), {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store"
  });

  if (!r.ok) return null;
  return await r.json().catch(() => null);
}

async function readEffectivePublishedProfile(
  req: Request,
  env: Env,
  ulid: string,
  locationID: string
): Promise<{ base: any; override: any; effective: any }> {
  let base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" }) as any;
  const override = (await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) as any) || {};

  if (!base && locationID) {
    base = await loadLegacyProfileBySlug(req, locationID);
  }

  const effective = deepMergeProfile(base || {}, override || {});
  return { base: base || {}, override: override || {}, effective };
}

function collectPublishImages(profile: any): string[] {
  const media = (profile?.media && typeof profile.media === "object") ? profile.media : {};
  const out: string[] = [];

  const cover = String(media.cover || "").trim();
  if (cover) out.push(cover);

  if (Array.isArray(media.images)) {
    for (const img of media.images) {
      const s = String(img || "").trim();
      if (s) out.push(s);
    }
  }

  return Array.from(new Set(out));
}

function extractDescriptionText(profile: any): string {
  const d = profile?.descriptions;
  if (typeof d === "string") return d.trim();
  if (d && typeof d === "object") return String(d.en || d.hu || Object.values(d)[0] || "").trim();
  return String(profile?.description || "").trim();
}

function isHttpUrl(v: any): boolean {
  try {
    const u = new URL(String(v || "").trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function hasWebsiteOrSocialLink(profile: any): boolean {
  const links = (profile?.links && typeof profile.links === "object") ? profile.links : {};
  for (const v of Object.values(links)) {
    if (isHttpUrl(v)) return true;
  }

  const ci = (profile?.contactInformation && typeof profile.contactInformation === "object") ? profile.contactInformation : {};
  if (isHttpUrl(ci?.website)) return true;

  return false;
}

function validatePublishCandidate(profile: any): string | null {
  const name = pickCanonicalName(profile?.locationName ?? profile?.listedName);
  if (!name) return "missing_name";

  const coord = extractCoord(profile);
  if (!coord) return "missing_coordinates";

  if (collectPublishImages(profile).length < 3) return "images_min_3";
  if (extractDescriptionText(profile).length < 200) return "description_min_200";
  if (!hasWebsiteOrSocialLink(profile)) return "website_or_social_required";

  const groupKey = String(profile?.groupKey || "").trim();
  const subgroupKey = String(profile?.subgroupKey || "").trim();
  const context = String(profile?.context || "").trim();
  if (!groupKey || !subgroupKey || !context) return "classification_required";

  return null;
}

async function planAllocCall(env: Env, pi: string, op: string, payload: Record<string, unknown>): Promise<any> {
  const ns =
    (env as any).PLAN_ALLOC ||
    (env as any).PLANALLOC ||
    (env as any).PLAN_ALLOC_DO ||
    (env as any).DO_PLAN_ALLOC;

  if (!ns || typeof ns.idFromName !== "function") {
    throw new Error("planalloc_binding_missing");
  }

  const id = ns.idFromName(`planalloc:${pi}`);
  const stub = ns.get(id);

  const r = await stub.fetch("https://do.internal/planalloc", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ver: 1,
      op,
      pi,
      ts: doNowIso(),
      ...payload
    })
  });

  const txt = await r.text();
  let j: any = null;
  try { j = JSON.parse(txt); } catch {}

  if (!r.ok && !j) throw new Error(`planalloc_${op}_failed:${r.status}`);
  return j || { ok: r.ok };
}

function splitContextMemberships(raw: unknown): string[] {
  const vals = Array.isArray(raw) ? raw : String(raw || "").split(";");
  return uniqueTrimmedStrings(vals);
}

function publishedCountryCode(profile: any): string {
  const cc = String(
    profile?.contactInformation?.countryCode ||
    profile?.contact?.countryCode ||
    ""
  ).trim().toUpperCase();

  return /^[A-Z]{2}$/.test(cc) ? cc : "XX";
}

function searchBucketForSlug(slug: string): string {
  const s = doNormalizeSlug(slug);
  const ch = s.slice(0, 1);
  return /^[a-z0-9]$/.test(ch) ? ch : "_";
}

function extractIndexNameValues(profile: any): string[] {
  const out: string[] = [];
  const ln = profile?.locationName;

  if (typeof ln === "string") out.push(ln);
  else if (ln && typeof ln === "object") {
    for (const v of Object.values(ln)) {
      const s = String(v || "").trim();
      if (s) out.push(s);
    }
  }

  const listed = String(profile?.listedName || "").trim();
  if (listed) out.push(listed);

  return uniqueTrimmedStrings(out);
}

function extractIndexAddressValues(profile: any): string[] {
  const ci = (profile?.contactInformation && typeof profile.contactInformation === "object")
    ? profile.contactInformation
    : ((profile?.contact && typeof profile.contact === "object") ? profile.contact : {});

  return uniqueTrimmedStrings([
    ci?.address,
    profile?.listedAddress,
    ci?.postalCode,
    profile?.postalCode,
    ci?.city,
    profile?.city,
    ci?.adminArea,
    profile?.adminArea
  ]);
}

function extractIndexTagValues(profile: any): string[] {
  const rawTags = Array.isArray(profile?.tags)
    ? profile.tags
    : String(profile?.tags || "").split(";");

  return uniqueTrimmedStrings(rawTags);
}

async function computeIndexedFieldsHash(bundle: unknown): Promise<string> {
  const enc = new TextEncoder();
  const dig = await crypto.subtle.digest("SHA-256", enc.encode(JSON.stringify(bundle)));
  return `sha256:${bytesToHex(new Uint8Array(dig))}`;
}

async function searchShardCall(
  env: Env,
  countryCode: string,
  bucket: string,
  payload: Record<string, unknown>
): Promise<any> {
  const ns =
    (env as any).SEARCH_SHARD ||
    (env as any).SEARCH ||
    (env as any).SEARCH_DO ||
    (env as any).DO_SEARCH_SHARD;

  if (!ns || typeof ns.idFromName !== "function") {
    throw new Error("searchshard_binding_missing");
  }

  const id = ns.idFromName(`search:${countryCode}:${bucket}`);
  const stub = ns.get(id);

  const r = await stub.fetch("https://do.internal/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return { ok: r.ok, raw: txt }; }
}

async function contextShardCall(
  env: Env,
  contextKey: string,
  payload: Record<string, unknown>
): Promise<any> {
  const ns =
    (env as any).CONTEXT_SHARD ||
    (env as any).CONTEXT ||
    (env as any).CONTEXT_DO ||
    (env as any).DO_CTX_SHARD;

  if (!ns || typeof ns.idFromName !== "function") {
    throw new Error("contextshard_binding_missing");
  }

  const id = ns.idFromName(`ctx:${contextKey}`);
  const stub = ns.get(id);

  const r = await stub.fetch("https://do.internal/context", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const txt = await r.text();
  try { return JSON.parse(txt); } catch { return { ok: r.ok, raw: txt }; }
}

async function syncPublishedDoIndex(
  env: Env,
  args: {
    ulid: string;
    slug: string;
    prevProfile: any;
    nextProfile: any;
    visibilityState: VisibilityState;
  }
): Promise<void> {
  const ulid = String(args.ulid || "").trim();
  const slug = String(args.slug || "").trim();
  if (!DO_ULID_RE.test(ulid) || !slug) throw new Error("invalid_index_target");

  const prevContexts = splitContextMemberships(args.prevProfile?.context);
  const nextContexts = splitContextMemberships(args.nextProfile?.context);
  const allContexts = uniqueTrimmedStrings([...prevContexts, ...nextContexts]);

  const countryCode = publishedCountryCode(args.nextProfile);
  const bucket = searchBucketForSlug(slug);
  const ts = doNowIso();

  if (args.visibilityState === "hidden") {
    await searchShardCall(env, countryCode, bucket, {
      ver: 1,
      op: "delete",
      ulid,
      slug,
      countryCode,
      contexts: allContexts,
      ts
    });

    for (const ctx of allContexts) {
      await contextShardCall(env, ctx, {
        ver: 1,
        op: "delete",
        ulid,
        ts
      });
    }
    return;
  }

  const tokens = doNormalizeTokens([
    ...extractIndexNameValues(args.nextProfile),
    ...extractIndexAddressValues(args.nextProfile),
    ...extractIndexTagValues(args.nextProfile),
    slug
  ]);

  const indexedFieldsHash = await computeIndexedFieldsHash({
    slug,
    countryCode,
    contexts: nextContexts,
    tokens
  });

  await searchShardCall(env, countryCode, bucket, {
    ver: 1,
    op: "upsert",
    ulid,
    slug,
    countryCode,
    contexts: nextContexts,
    tokens,
    indexedFieldsHash,
    meta: {
      city: String(
        args.nextProfile?.contactInformation?.city ||
        args.nextProfile?.contact?.city ||
        args.nextProfile?.city ||
        ""
      ).trim(),
      postalCode: String(
        args.nextProfile?.contactInformation?.postalCode ||
        args.nextProfile?.contact?.postalCode ||
        args.nextProfile?.postalCode ||
        ""
      ).trim(),
      name: pickCanonicalName(args.nextProfile?.locationName ?? args.nextProfile?.listedName)
    },
    ts
  });

  const staleContexts = prevContexts.filter(ctx => !nextContexts.includes(ctx));
  for (const ctx of staleContexts) {
    await contextShardCall(env, ctx, {
      ver: 1,
      op: "delete",
      ulid,
      ts
    });
  }

  for (const ctx of nextContexts) {
    await contextShardCall(env, ctx, {
      ver: 1,
      op: "upsert",
      ulid,
      ts
    });
  }
}

async function handleLocationPublish(req: Request, env: Env): Promise<Response> {
  const noStore = { "cache-control": "no-store" };

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_request", message: "valid JSON body required" } },
      400,
      noStore
    );
  }

  const locationID = String((body as any)?.locationID || "").trim();
  const draftULID = String((body as any)?.draftULID || "").trim();
  const sourceDraftActorKey = String((body as any)?.sourceDraftActorKey || (body as any)?.draftSessionId || "").trim();

  if (!sourceDraftActorKey) {
    return json(
      { error: { code: "invalid_request", message: "draftSessionId required" } },
      400,
      noStore
    );
  }

  const target = locationID
    ? await resolveTargetIdentity(env, { locationID }, {})
    : await resolveTargetIdentity(env, { draftULID, draftSessionId: sourceDraftActorKey }, { validateDraft: true });

  if (!target) {
    return json(
      { error: { code: "not_found", message: "publish target not found" } },
      404,
      noStore
    );
  }

  const auth = await requireOwnerSession(req, env);
  if (auth instanceof Response) return auth;
  if (String(auth.ulid || "").trim() !== target.ulid) {
    return new Response("Denied", {
      status: 403,
      headers: { "cache-control": "no-store", "Referrer-Policy": "no-referrer" }
    });
  }

  const ownKey = `ownership:${target.ulid}`;
  const ownership = await env.KV_STATUS.get(ownKey, { type: "json" }) as any;
  const exclusiveUntilIso = String(ownership?.exclusiveUntil || "").trim();
  const exclusiveUntil = exclusiveUntilIso ? new Date(exclusiveUntilIso) : null;

  if (!exclusiveUntil || Number.isNaN(exclusiveUntil.getTime()) || exclusiveUntil.getTime() <= Date.now()) {
    return json(
      { error: { code: "ownership_inactive", message: "active ownership required" } },
      403,
      noStore
    );
  }

  const paymentIntentId = String(ownership?.lastEventId || "").trim();
  if (!paymentIntentId) {
    return json(
      { error: { code: "plan_missing", message: "ownership has no plan anchor" } },
      403,
      noStore
    );
  }

  const plan = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" }) as any;
  const planExpIso = String(plan?.expiresAt || "").trim();
  const planExp = planExpIso ? new Date(planExpIso) : null;

  if (!plan || !planExp || Number.isNaN(planExp.getTime()) || planExp.getTime() <= Date.now()) {
    return json(
      { error: { code: "plan_inactive", message: "active plan required" } },
      403,
      noStore
    );
  }

  if (planExp.toISOString() !== exclusiveUntil.toISOString()) {
    return json(
      { error: { code: "plan_invariant_failed", message: "plan/ownership expiry mismatch" } },
      403,
      noStore
    );
  }

  const draftKey = `override_draft:${target.ulid}:${sourceDraftActorKey}`;
  const draft = await env.KV_STATUS.get(draftKey, { type: "json" }) as any;
  if (!draft) {
    return json(
      { error: { code: "not_found", message: "draft not found" } },
      404,
      noStore
    );
  }

  const current = await readEffectivePublishedProfile(req, env, target.ulid, target.locationID);
  const candidate = target.route === "existing-location"
    ? deepMergeProfile(current.effective || {}, draft)
    : deepMergeProfile({}, draft);

  if (target.route === "existing-location" && target.locationID) {
    candidate.locationID = target.locationID;
  }

  const classificationError = await validateClassificationSelection(req, candidate);
  if (classificationError) {
    return json(
      { error: { code: "validation_failed", message: classificationError } },
      403,
      noStore
    );
  }

  const validationError = validatePublishCandidate(candidate);
  if (validationError) {
    return json(
      { error: { code: "validation_failed", message: validationError } },
      403,
      noStore
    );
  }

  let slug = "";
  let aliasWritten = false;
  let capacityHeld = false;
  let kvCommitted = false;

  try {
    const reserve = await planAllocCall(env, paymentIntentId, "reserve", {
      ulid: target.ulid,
      max: Math.max(0, Number(plan?.maxPublishedLocations || 0) || 0)
    });

    if (!reserve?.ok) {
      return json(
        { error: { code: "capacity_exceeded", message: "publish capacity exceeded" } },
        403,
        noStore
      );
    }

    capacityHeld = String(reserve?.reservationState || "").toLowerCase() === "held";

    let baseWrite: any = null;
    let overrideWrite: any = null;

    if (target.route === "existing-location") {
      slug = String(target.locationID || current.base?.locationID || current.effective?.locationID || "").trim();
      if (!slug) throw new Error("missing_existing_slug");

      if (!current.base || !Object.keys(current.base).length) {
        baseWrite = deepMergeProfile({}, current.effective || {});
        baseWrite.locationID = slug;
      }

      overrideWrite = deepMergeProfile(current.override || {}, draft);
      if (overrideWrite && typeof overrideWrite === "object") {
        delete overrideWrite.locationID;
      }
    } else {
      const name = pickCanonicalName(candidate?.locationName ?? candidate?.listedName);
      const coord = extractCoord(candidate);
      if (!name || !coord) throw new Error("invalid_brand_new_identity");

      const baseSlug = `${slugifyNamePart(name)}-${geoSuffixFromCoord(coord)}`.replace(/^-+|-+$/g, "").slice(0, 64);
      slug = await findAvailableSlug(env, baseSlug, target.ulid);

      baseWrite = deepMergeProfile({}, candidate);
      baseWrite.locationID = slug;
      overrideWrite = {};
    }

    if (target.route === "brand-new-private-shell") {
      await env.KV_ALIASES.put(aliasKey(slug), JSON.stringify({ locationID: target.ulid }));
      aliasWritten = true;
    }

    if (baseWrite) {
      await env.KV_STATUS.put(`profile_base:${target.ulid}`, JSON.stringify(baseWrite));
    }

    await env.KV_STATUS.put(`override:${target.ulid}`, JSON.stringify(overrideWrite || {}));

    await env.KV_STATUS.put(
      `override_log:${target.ulid}:${Date.now()}`,
      JSON.stringify({
        ts: doNowIso(),
        ulid: target.ulid,
        locationID: slug,
        paymentIntentId,
        initiationType: String(plan?.initiationType || "").trim(),
        route: target.route,
        draftSessionId: sourceDraftActorKey
      })
    );

    kvCommitted = true;

    if (capacityHeld) {
      try {
        const commit = await planAllocCall(env, paymentIntentId, "commit", { ulid: target.ulid });
        if (commit?.ok) {
          try {
            await env.KV_STATUS.put(
              `plan_alloc:${paymentIntentId}`,
              JSON.stringify({
                lastCommittedUlid: target.ulid,
                updatedAt: doNowIso()
              })
            );
          } catch {
            // mirror only; never block publish
          }
        } else {
          console.error("planalloc_commit_failed", { ulid: target.ulid, paymentIntentId, commit });
        }
      } catch (e: any) {
        console.error("planalloc_commit_failed", {
          ulid: target.ulid,
          paymentIntentId,
          err: String(e?.message || e || "")
        });
      }
    }

    const effectiveAfterCommit = target.route === "existing-location"
      ? deepMergeProfile(baseWrite || current.base || current.effective || {}, overrideWrite || {})
      : deepMergeProfile(baseWrite || {}, overrideWrite || {});

    effectiveAfterCommit.locationID = slug;

    const visibility = await computeVisibilityState(env, target.ulid);

    try {
      await syncPublishedDoIndex(env, {
        ulid: target.ulid,
        slug,
        prevProfile: current.effective || {},
        nextProfile: effectiveAfterCommit,
        visibilityState: visibility.visibilityState
      });
    } catch (e: any) {
      console.error("publish_index_sync_failed", {
        ulid: target.ulid,
        slug,
        err: String(e?.message || e || "")
      });
      // DO best-effort only; never block or rollback committed publish
    }

    return json(
      { ok: true, locationID: slug },
      200,
      noStore
    );
  } catch (e: any) {
    if (!kvCommitted && capacityHeld) {
      try {
        await planAllocCall(env, paymentIntentId, "release", { ulid: target.ulid });
      } catch {}
    }

    if (!kvCommitted && aliasWritten && slug) {
      try { await env.KV_ALIASES.delete(aliasKey(slug)); } catch {}
    }

    if (kvCommitted) {
      console.error("publish_postcommit_error", {
        ulid: target.ulid,
        slug,
        err: String(e?.message || e || "")
      });

      return json(
        { ok: true, locationID: slug },
        200,
        noStore
      );
    }

    return json(
      { error: { code: "publish_failed", message: String(e?.message || "publish failed") } },
      500,
      noStore
    );
  }
}

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

  const mapped = (await resolveUid(raw, env)) || raw;
  const ulid = ULID_RE.test(mapped) ? mapped : "";
  if (!ulid) {
    return json(
      { error: { code: "not_found", message: "location not found" } },
      404
    );
  }

  const base = await env.KV_STATUS.get(`profile_base:${ulid}`, { type: "json" }) as any;
  if (!base || typeof base !== "object") {
    return json(
      { error: { code: "not_found", message: "published profile not found" } },
      404
    );
  }

  const override = (await env.KV_STATUS.get(`override:${ulid}`, { type: "json" }) as any) || {};
  const effective = deepMergeProfile(base, override);

  const canonicalSlug = String(effective?.locationID || base?.locationID || raw).trim();
  let targetUrl = String(effective?.qrUrl || "").trim();

  if (!targetUrl) {
    const dest = new URL("/", "https://navigen.io");
    dest.searchParams.set("lp", canonicalSlug);
    targetUrl = dest.toString();
  }

  const scanUrl = new URL(`/out/qr-scan/${encodeURIComponent(canonicalSlug)}`, "https://navigen.io");
  scanUrl.searchParams.set("to", targetUrl);
  const dataUrl = scanUrl.toString();

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

  // campaign entitlement (authoritative, KV-backed)
  const camp = await campaignEntitlementForUlid(env, locID);

  // Expose the full active set so the LPM can distinguish single vs multiple campaigns.
  const rawCampaignRows = await env.KV_STATUS.get(campaignsByUlidKey(locID), { type: "json" }) as any;
  const campaignRows: any[] = Array.isArray(rawCampaignRows) ? rawCampaignRows : [];
  const nowMs = Date.now();

  const activeCampaignKeys = campaignRows
    .filter((row: any) => {
      if (!row || String(row?.locationID || "").trim() !== locID) return false;

      const st = String(row?.statusOverride || row?.status || "").trim().toLowerCase();
      if (st !== "active") return false;

      const startMs = parseYmdUtcMs(String(row?.startDate || ""));
      const endMs = parseYmdUtcMs(String(row?.endDate || ""));
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return false;

      if (nowMs < startMs) return false;
      if (nowMs > (endMs + 24 * 60 * 60 * 1000 - 1)) return false;

      return true;
    })
    .map((row: any) => String(row?.campaignKey || "").trim())
    .filter(Boolean)
    .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index);

  const ratingSummary = await readRatingSummary(env, locID);
  const ratingDeviceKey = readRatingDeviceKey(req);
  const rawRatingVote = ratingDeviceKey
    ? await env.KV_STATUS.get(ratingVoteKey(locID, ratingDeviceKey), { type: "json" }) as any
    : null;

  const userScoreRaw = Number(rawRatingVote?.score);
  const ratingLockedUntil = (() => {
    const votedAtMs = Date.parse(String(rawRatingVote?.votedAt || ""));
    if (!Number.isFinite(votedAtMs)) return "";

    const untilMs = votedAtMs + RATING_WINDOW_MS;
    return untilMs > Date.now() ? new Date(untilMs).toISOString() : "";
  })();    

  return json(
    {
      locationID: locID,
      status,
      tier,
      ownedNow: vis.ownedNow,
      visibilityState: vis.visibilityState,
      exclusiveUntil: vis.exclusiveUntil,
      courtesyUntil: vis.courtesyUntil,

      // Campaign entitlement spine (authoritative)
      campaignEntitled: camp.entitled,
      campaignEndsAt: camp.endDate,
      activeCampaignKey: camp.campaignKey,
      activeCampaignKeys,

      // Rating spine (authoritative, cross-device read model for the LPM)
      ratingAvg: ratingSummary.avg,
      ratedSum: ratingSummary.count,
      userScore: (Number.isFinite(userScoreRaw) && userScoreRaw >= 1 && userScoreRaw <= 5) ? userScoreRaw : 0,
      ratingLockedUntil,
      ratingCooldownMinutes: 30
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
      "Access-Control-Allow-Headers": "content-type, authorization, x-ng-device",      
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

  // If it already looks like a ULID, accept directly.
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(idOrAlias)) return idOrAlias;

  const key = aliasKey(idOrAlias);
  const raw = await env.KV_ALIASES.get(key, "text");
  if (!raw) return null;

  const txt = String(raw || "").trim();
  if (!txt) return null;

  // Legacy compatibility:
  // - plain ULID string
  // - JSON string
  // - JSON object { locationID: "<ULID>" }
  if (/^[0-9A-HJKMNP-TV-Z]{26}$/i.test(txt)) return txt;

  try {
    const parsed = JSON.parse(txt);
    return (typeof parsed === "string" ? parsed : parsed?.locationID) || null;
  } catch {
    return null;
  }
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

// -------- Campaign KV model + entitlement resolver (authoritative) --------

// Storage keys (KV_STATUS):
// - campaigns:byUlid:<ULID> -> CampaignRow[] (rules/rich model)
// - campaigns:activeIndex:<ULID> -> { entitled:boolean, campaignKey:string, endDate:string } (optional fast path)
function campaignsByUlidKey(ulid: string): string {
  return `campaigns:byUlid:${ulid}`;
}

function campaignGroupKeyKey(campaignGroupKey: string): string {
  return `campaign_group:${campaignGroupKey}`;
}

function normCampaignScope(v: unknown): "single" | "selected" | "all" {
  const s = String(v || "").trim().toLowerCase();
  if (s === "selected") return "selected";
  if (s === "all") return "all";
  return "single";
}

function normCampaignPreset(v: unknown): "visibility" | "promotion" {
  const s = String(v || "").trim().toLowerCase();
  return s === "visibility" ? "visibility" : "promotion";
}

function deriveCampaignGroupKey(seedSlug: string, campaignKey: string): string {
  const seed = String(seedSlug || "").trim() || "location";
  const key = String(campaignKey || "").trim() || "campaign";
  return `${seed}::${key}`;
}

interface EligibleLocation {
  ulid: string;
  slug: string;
  locationName: string;
}

async function eligibleLocationsForRequest(req: Request, env: Env, activeUlid = ""): Promise<EligibleLocation[]> {
  const dev = readDeviceId(req);
  if (!dev) return [];

  const idxKey = devIndexKey(dev);
  const rawIdx = await env.KV_STATUS.get(idxKey, "text");
  let arr: string[] = [];
  try { arr = rawIdx ? JSON.parse(rawIdx) : []; } catch { arr = []; }
  if (!Array.isArray(arr)) arr = [];

  const out: EligibleLocation[] = [];
  const seen = new Set<string>();

  const ordered = [
    ...arr.map(v => String(v || "").trim()).filter(Boolean),
    String(activeUlid || "").trim()
  ].filter(Boolean);

  for (const ulid of ordered) {
    if (!ulid || seen.has(ulid)) continue;
    seen.add(ulid);

    const sid = await env.KV_STATUS.get(devSessKey(dev, ulid), "text");
    if (!sid) continue;

    const sess = await env.KV_STATUS.get(`opsess:${sid}`, { type: "json" }) as any;
    if (!sess || String(sess?.ulid || "").trim() !== ulid) continue;

    let slug = ulid;
    let locationName = ulid;
    try {
      const item = await getItemById(ulid, env).catch(() => null);
      slug = String(item?.locationID || ulid).trim() || ulid;

      const ln = item?.locationName;
      const nm = (ln && typeof ln === "object")
        ? String(ln.en || Object.values(ln)[0] || "").trim()
        : String(ln || "").trim();

      if (nm) locationName = nm;
      else if (slug) locationName = slug;
    } catch {}

    out.push({ ulid, slug, locationName });
  }

  return out;
}

async function currentPlanForUlid(env: Env, ulid: string): Promise<PlanRecord | null> {
  try {
    const own = await env.KV_STATUS.get(`ownership:${ulid}`, { type: "json" }) as any;
    const paymentIntentId = String(own?.lastEventId || "").trim();
    if (!paymentIntentId) return null;

    const plan = await env.KV_STATUS.get(`plan:${paymentIntentId}`, { type: "json" }) as any;
    if (!plan || typeof plan !== "object") return null;

    return {
      priceId: String(plan?.priceId || "").trim(),
      tier: normalizePlanTier(plan?.tier),
      maxPublishedLocations: Math.max(0, Number(plan?.maxPublishedLocations || 0) || 0),
      purchasedAt: String(plan?.purchasedAt || "").trim(),
      expiresAt: String(plan?.expiresAt || "").trim()
    };
  } catch {
    return null;
  }
}

async function currentGroupPlanForUlid(env: Env, ulid: string): Promise<{ tier: PlanTier; maxPublishedLocations: number } | null> {
  try {
    const hist = await env.KV_STATUS.get(campaignsByUlidKey(ulid), { type: "json" }) as any;
    const rows: any[] = Array.isArray(hist) ? hist : [];
    const nowMs = Date.now();

    for (const row of [...rows].reverse()) {
      const groupKey = String(row?.campaignGroupKey || "").trim();
      if (!groupKey) continue;

      const st = effectiveCampaignStatus(row as any);
      if (st !== "active" && st !== "suspended") continue;

      const endMs = parseYmdUtcMs(String(row?.endDate || ""));
      if (Number.isFinite(endMs) && nowMs > (endMs + 24 * 60 * 60 * 1000 - 1)) continue;

      const parent = await env.KV_STATUS.get(campaignGroupKeyKey(groupKey), { type: "json" }) as any;
      const tier = normalizePlanTier(parent?.planTier || row?.planTier);
      const maxPublishedLocations = Math.max(
        0,
        Number(parent?.maxPublishedLocations || row?.maxPublishedLocations || 0) || 0
      );

      if (tier !== "unknown" || maxPublishedLocations > 0) {
        return { tier, maxPublishedLocations };
      }
    }
  } catch {}

  return null;
}

async function multiLocationEnabledForUlid(env: Env, ulid: string): Promise<boolean> {
  try {
    const plan = await currentPlanForUlid(env, ulid);
    return Number(plan?.maxPublishedLocations || 0) > 1;
  } catch {
    return false;
  }
}

function buildPlanUpgradeErrorBody(plan: { tier?: PlanTier; maxPublishedLocations?: number } | null, scope: "single" | "selected" | "all", requestedLocations: number) {
  const currentTier = normalizePlanTier(plan?.tier);
  const currentCapacity = Math.max(0, Number(plan?.maxPublishedLocations || 0) || 0);
  const message = currentCapacity > 0
    ? `This selection needs ${requestedLocations} locations, but the current Plan allows ${currentCapacity}.`
    : "This selection is not available for the current Plan.";

  return {
    error: {
      code: "plan_upgrade_required",
      message
    },
    upgrade: {
      currentTier,
      currentCapacity,
      requestedLocations,
      scope
    }
  };
}

interface CampaignGroupRow {
  campaignGroupKey: string;
  campaignKey: string;
  campaignScope: "single" | "selected" | "all";
  campaignPreset?: "visibility" | "promotion";
  seedLocationULID: string;
  seedLocationSlug: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  stripeSessionId?: string;
  planTier?: PlanTier;
  maxPublishedLocations?: number;
}

type PromoteCampaignDraftResult =
  | {
      ok: true;
      campaignGroupKey: string;
      includedTargets: EligibleLocation[];
      endDate: string;
    }
  | {
      ok: false;
      status: number;
      body: any;
    };

async function describeLocationForMaterialization(env: Env, ulid: string, fallbackSlug = ""): Promise<EligibleLocation> {
  let slug = String(fallbackSlug || ulid).trim() || ulid;
  let locationName = slug || ulid;

  try {
    const item = await getItemById(ulid, env).catch(() => null);
    const resolvedSlug = String(item?.locationID || "").trim();
    const resolvedName = pickName(item?.locationName);

    if (resolvedSlug) slug = resolvedSlug;
    if (resolvedName) locationName = resolvedName;
    else if (slug) locationName = slug;
  } catch {}

  return { ulid, slug, locationName };
}

async function promoteCampaignDraftToActiveRows(params: {
  req: Request;
  env: Env;
  ownerUlid: string;
  draft: any;
  locationSlug: string;
  campaignKey: string;
  stripeSessionId: string;
  paidPlan: { tier?: PlanTier; maxPublishedLocations?: number } | null;
  logTag: string;
}): Promise<PromoteCampaignDraftResult> {
  const { req, env, ownerUlid, draft, locationSlug, campaignKey, stripeSessionId, paidPlan, logTag } = params;

  const scope = normCampaignScope(draft?.campaignScope);
  const campaignPreset = normCampaignPreset(draft?.campaignPreset);
  const eligibleLocations = await eligibleLocationsForRequest(req, env, ownerUlid);
  const eligibleByUlid = new Map(eligibleLocations.map((x) => [x.ulid, x]));

  if (scope !== "single" && Number(paidPlan?.maxPublishedLocations || 0) <= 1) {
    return { ok: false, status: 409, body: buildPlanUpgradeErrorBody(paidPlan, scope, 2) };
  }

  let includedTargets: EligibleLocation[] = [];

  if (scope === "selected") {
    const storedSelectedUlids: string[] = Array.from(
      new Set(
        (Array.isArray(draft?.selectedLocationULIDs) ? draft.selectedLocationULIDs : [])
          .map((x: any) => String(x || "").trim())
          .filter(Boolean)
      )
    );

    if (!storedSelectedUlids.length) {
      return {
        ok: false,
        status: 409,
        body: { error: { code: "invalid_state", message: "selected scope has no stored locations" } }
      };
    }

    for (const targetUlid of storedSelectedUlids) {
      const eligibleLoc = eligibleByUlid.get(targetUlid);
      if (eligibleLoc) {
        includedTargets.push({ ...eligibleLoc });
        continue;
      }

      if (!ULID_RE.test(targetUlid)) {
        return {
          ok: false,
          status: 409,
          body: { error: { code: "invalid_state", message: "selected scope contains an invalid location id" } }
        };
      }

      console.warn(`${logTag}: selected_target_rehydrated_from_draft`, {
        ownerUlid,
        targetUlid,
        campaignKey
      });
      includedTargets.push(await describeLocationForMaterialization(env, targetUlid));
    }
  } else if (scope === "all") {
    if (eligibleLocations.length) includedTargets = eligibleLocations.map((loc) => ({ ...loc }));
    else includedTargets = [await describeLocationForMaterialization(env, ownerUlid, locationSlug)];
  } else {
    const currentLoc = eligibleByUlid.get(ownerUlid)
      ? { ...eligibleByUlid.get(ownerUlid)! }
      : await describeLocationForMaterialization(env, ownerUlid, locationSlug);
    includedTargets = [currentLoc];
  }

  const seenTargets = new Set<string>();
  includedTargets = includedTargets.filter((loc) => {
    const id = String(loc?.ulid || "").trim();
    if (!id || seenTargets.has(id)) return false;
    seenTargets.add(id);
    return true;
  });

  if (!includedTargets.length) {
    return {
      ok: false,
      status: 409,
      body: { error: { code: "invalid_state", message: "campaign materialization resolved zero locations" } }
    };
  }

  if (Number(paidPlan?.maxPublishedLocations || 0) > 0 && includedTargets.length > Number(paidPlan?.maxPublishedLocations || 0)) {
    return { ok: false, status: 409, body: buildPlanUpgradeErrorBody(paidPlan, scope, includedTargets.length) };
  }

  const campaignGroupKey = scope === "single"
    ? ""
    : String((draft as any)?.campaignGroupKey || deriveCampaignGroupKey(locationSlug, campaignKey)).trim();

  if (campaignGroupKey) {
    const parent: CampaignGroupRow = {
      campaignGroupKey,
      campaignKey,
      campaignScope: scope,
      campaignPreset,
      seedLocationULID: ownerUlid,
      seedLocationSlug: locationSlug,
      startDate: String(draft?.startDate || "").trim(),
      endDate: String(draft?.endDate || "").trim(),
      createdAt: new Date().toISOString(),
      stripeSessionId,
      planTier: normalizePlanTier(paidPlan?.tier),
      maxPublishedLocations: Math.max(0, Number(paidPlan?.maxPublishedLocations || 0) || 0)
    };
    await env.KV_STATUS.put(campaignGroupKeyKey(campaignGroupKey), JSON.stringify(parent));
  }

  for (const target of includedTargets) {
    await writeCampaignChildRow({
      env,
      targetUlid: target.ulid,
      targetSlug: target.slug,
      draft: { ...draft, campaignPreset },
      campaignGroupKey,
      stripeSessionId,
      inherited: false
    });
  }

  return {
    ok: true,
    campaignGroupKey,
    includedTargets,
    endDate: String(draft?.endDate || "").trim()
  };
}

async function writeCampaignChildRow(params: {
  env: Env;
  targetUlid: string;
  targetSlug: string;
  draft: any;
  campaignGroupKey: string;
  stripeSessionId: string;
  inherited: boolean;
}): Promise<void> {
  const { env, targetUlid, targetSlug, draft, campaignGroupKey, stripeSessionId, inherited } = params;

  const histKey = campaignsByUlidKey(targetUlid);
  const hist = await env.KV_STATUS.get(histKey, { type: "json" }) as any;
  const arr: any[] = Array.isArray(hist) ? hist : [];

  const row = {
    ...draft,
    locationID: targetUlid,
    locationULID: targetUlid,
    locationSlug: targetSlug,
    campaignGroupKey,
    campaignScope: normCampaignScope(draft?.campaignScope),
    status: "Active",
    promotedAt: new Date().toISOString(),
    stripeSessionId
  } as any;

  if (inherited) row.inheritedAt = new Date().toISOString();

  const next = arr.filter((x) => {
    const sameKey = String(x?.campaignKey || "").trim() === String(row?.campaignKey || "").trim();
    const sameGroup = String(x?.campaignGroupKey || "").trim() === String(row?.campaignGroupKey || "").trim();
    return !(sameKey && sameGroup);
  });

  next.push(row);
  await env.KV_STATUS.put(histKey, JSON.stringify(next));
}

async function materializeInheritedAllScopeForCurrentUlid(
  req: Request,
  env: Env,
  currentUlid: string
): Promise<{
  addedRows: number;
  addedGroups: number;
  blockedRows: number;
  blockedGroups: number;
  blockedPlanTier: PlanTier | "";
  blockedMaxPublishedLocations: number;
}> {  
  const eligible = await eligibleLocationsForRequest(req, env, currentUlid);
  const eligibleByUlid = new Map(eligible.map((x) => [x.ulid, x]));
  const currentLoc = eligibleByUlid.get(currentUlid);
  if (!currentLoc) return { addedRows: 0, addedGroups: 0, blockedRows: 0, blockedGroups: 0, blockedPlanTier: "", blockedMaxPublishedLocations: 0 };  

  const currentHistKey = campaignsByUlidKey(currentUlid);
  const currentHistRaw = await env.KV_STATUS.get(currentHistKey, { type: "json" }) as any;
  const currentRows: any[] = Array.isArray(currentHistRaw) ? currentHistRaw : [];

  const existing = new Set(
    currentRows
      .map((r: any) => `${String(r?.campaignGroupKey || "").trim()}::${String(r?.campaignKey || "").trim()}`)
      .filter(Boolean)
  );

  const countIncludedForGroup = async (groupKey: string, campaignKey: string): Promise<number> => {
    let count = 0;
    for (const checkLoc of eligible) {
      const histRaw = await env.KV_STATUS.get(campaignsByUlidKey(checkLoc.ulid), { type: "json" }) as any;
      const rows: any[] = Array.isArray(histRaw) ? histRaw : [];
      const hit = rows.some((r: any) =>
        String(r?.campaignGroupKey || "").trim() === groupKey &&
        String(r?.campaignKey || "").trim() === campaignKey &&
        effectiveCampaignStatus(r) !== "finished"
      );
      if (hit) count += 1;
    }
    return count;
  };

  let addedRows = 0;
  let blockedRows = 0;
  const touchedGroups = new Set<string>();
  const blockedGroups = new Set<string>();
  let blockedPlanTier: PlanTier | "" = "";
  let blockedMaxPublishedLocations = 0;  
  const nowMs = Date.now();

  for (const loc of eligible) {
    const histRaw = await env.KV_STATUS.get(campaignsByUlidKey(loc.ulid), { type: "json" }) as any;
    const rows: any[] = Array.isArray(histRaw) ? histRaw : [];

    for (const row of rows) {
      const groupKey = String(row?.campaignGroupKey || "").trim();
      const campaignKey = String(row?.campaignKey || "").trim();
      if (!groupKey || !campaignKey) continue;
      if (normCampaignScope(row?.campaignScope) !== "all") continue;

      const st = effectiveCampaignStatus(row);
      if (st !== "active" && st !== "suspended") continue;

      const endMs = parseYmdUtcMs(String(row?.endDate || ""));
      if (Number.isFinite(endMs) && nowMs > (endMs + 24 * 60 * 60 * 1000 - 1)) continue;

      const sig = `${groupKey}::${campaignKey}`;
      if (existing.has(sig)) continue;

      const parent = await env.KV_STATUS.get(campaignGroupKeyKey(groupKey), { type: "json" }) as any;
      const maxAllowed = Math.max(
        0,
        Number(parent?.maxPublishedLocations || row?.maxPublishedLocations || 0) || 0
      );

      if (maxAllowed > 0) {
        const includedCount = await countIncludedForGroup(groupKey, campaignKey);
        if (includedCount >= maxAllowed) {
          blockedRows += 1;
          blockedGroups.add(groupKey);
          if (!blockedPlanTier) blockedPlanTier = normalizePlanTier(parent?.planTier || row?.planTier);
          if (!blockedMaxPublishedLocations) blockedMaxPublishedLocations = maxAllowed;
          continue;
        }
      }

      await writeCampaignChildRow({
        env,
        targetUlid: currentUlid,
        targetSlug: currentLoc.slug,
        draft: row,
        campaignGroupKey: groupKey,
        stripeSessionId: String(row?.stripeSessionId || "").trim(),
        inherited: true
      });

      existing.add(sig);
      addedRows += 1;
      touchedGroups.add(groupKey);
    }
  }

  return { addedRows, addedGroups: touchedGroups.size, blockedRows, blockedGroups: blockedGroups.size, blockedPlanTier, blockedMaxPublishedLocations };  
}

type CampaignStatus =
  | "Active"
  | "Paused"
  | "Finished"
  | "Suspended"
  | "Draft";

interface CampaignRow {
  // Identity
  locationID: string;              // canonical ULID (required in KV representation)
  campaignKey: string;
  campaignGroupKey?: string;
  campaignScope?: string;          // single | selected | all
  campaignName?: string;
  sectorKey?: string;
  brandKey?: string;
  context?: string;

  // Core lifecycle
  startDate: string;               // YYYY-MM-DD
  endDate: string;                 // YYYY-MM-DD
  status: CampaignStatus | string; // tolerate legacy capitalization
  statusOverride?: CampaignStatus | string;

  // Rules (rich model; validated/used progressively)
  campaignType?: string;
  targetChannels?: string[] | string;
  offerType?: string;
  discountKind?: string;           // Percent | Amount | None
  campaignDiscountValue?: number | string;
  eligibilityType?: string;
  eligibilityNotes?: string;
  selectedLocationULIDs?: string[];

  // Attribution
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;

  // Misc
  inheritedAt?: string;
  promotedAt?: string;
  stripeSessionId?: string;
  notes?: string;
}

// Safe date parsing: accept only YYYY-MM-DD; return ms at UTC midnight
function parseYmdUtcMs(s: string): number {
  const v = String(s || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return NaN;
  const t = Date.parse(`${v}T00:00:00Z`);
  return Number.isFinite(t) ? t : NaN;
}

function normStatus(v: unknown): string {
  return String(v || "").trim().toLowerCase();
}

function effectiveCampaignStatus(row: CampaignRow): string {
  const ov = normStatus(row.statusOverride);
  if (ov) return ov;
  return normStatus(row.status);
}

async function campaignEntitlementForUlid(
  env: Env,
  ulid: string,
  nowMs = Date.now()
): Promise<{ entitled: boolean; campaignKey: string; endDate: string }> {
  // Optional fast path (can be written later during seed / updates)
  try {
    const fast = await env.KV_STATUS.get(`campaigns:activeIndex:${ulid}`, { type: "json" }) as any;
    if (fast && typeof fast === "object") {
      const entitled = fast.entitled === true;
      const campaignKey = String(fast.campaignKey || "").trim();
      const endDate = String(fast.endDate || "").trim();
      if (entitled && campaignKey && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        const endMs = parseYmdUtcMs(endDate);
        if (Number.isFinite(endMs) && endMs >= nowMs) {
          return { entitled: true, campaignKey, endDate };
        }
      }
      // If fast says not entitled, we still fall through (fast index may be stale)
    }
  } catch {
    // fall through to full evaluation
  }

  const raw = await env.KV_STATUS.get(campaignsByUlidKey(ulid), { type: "json" }) as any;
  const rows: CampaignRow[] = Array.isArray(raw) ? raw : [];

  if (!rows.length) return { entitled: false, campaignKey: "", endDate: "" };

  // Entitling rule:
  // - effective status is "active"
  // - today within [startDate, endDate] inclusive (UTC dates)
  const active: Array<{ row: CampaignRow; startMs: number; endMs: number }> = [];

  for (const row of rows) {
    if (!row || String(row.locationID || "").trim() !== ulid) continue;

    const st = effectiveCampaignStatus(row);
    if (st !== "active") continue;

    const startMs = parseYmdUtcMs(String(row.startDate || ""));
    const endMs = parseYmdUtcMs(String(row.endDate || ""));
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

    // inclusive window: start <= now <= end+24h-1ms; easier: compare date-midnights
    if (nowMs < startMs) continue;
    if (nowMs > (endMs + 24 * 60 * 60 * 1000 - 1)) continue;

    active.push({ row, startMs, endMs });
  }

  if (!active.length) return { entitled: false, campaignKey: "", endDate: "" };

  // Deterministic "primary" selection:
  // 1) earliest endDate wins (soonest to expire)
  // 2) if tie, latest startDate wins
  active.sort((a, b) => {
    if (a.endMs !== b.endMs) return a.endMs - b.endMs;
    return b.startMs - a.startMs;
  });

  const winner = active[0].row;
  const campaignKey = String(winner.campaignKey || "").trim();
  const endDate = String(winner.endDate || "").trim();

  return { entitled: true, campaignKey, endDate };
}

async function activeCampaignRowForUlid(
  env: Env,
  ulid: string,
  nowMs = Date.now()
): Promise<CampaignRow | null> {
  const raw = await env.KV_STATUS.get(campaignsByUlidKey(ulid), { type: "json" }) as any;
  const rows: CampaignRow[] = Array.isArray(raw) ? raw : [];
  if (!rows.length) return null;

  const active: Array<{ row: CampaignRow; startMs: number; endMs: number }> = [];

  for (const row of rows) {
    if (!row || String(row.locationID || "").trim() !== ulid) continue;

    const st = effectiveCampaignStatus(row);
    if (st !== "active") continue;

    const startMs = parseYmdUtcMs(String(row.startDate || ""));
    const endMs = parseYmdUtcMs(String(row.endDate || ""));
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

    if (nowMs < startMs) continue;
    if (nowMs > (endMs + 24 * 60 * 60 * 1000 - 1)) continue;

    active.push({ row, startMs, endMs });
  }

  if (!active.length) return null;

  active.sort((a, b) => {
    if (a.endMs !== b.endMs) return a.endMs - b.endMs;
    return b.startMs - a.startMs;
  });

  return active[0].row || null;
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

type TargetIdentityRoute = "existing-location" | "brand-new-private-shell";

type TargetIdentity = {
  route: TargetIdentityRoute;
  ulid: string;
  locationID: string;
  draftULID: string;
  draftSessionId: string;
};

async function readPrivateShellDraft(env: Env, draftULID: string, draftSessionId: string): Promise<any | null> {
  const key = `override_draft:${draftULID}:${draftSessionId}`;
  const hitJson = await env.KV_STATUS.get(key, { type: "json" }) as any;
  if (hitJson) return hitJson;
  const hitText = await env.KV_STATUS.get(key, "text");
  if (!hitText) return null;
  try { return JSON.parse(hitText); } catch { return { raw: hitText }; }
}

async function resolveTargetIdentity(
  env: Env,
  input: { locationID?: unknown; draftULID?: unknown; draftSessionId?: unknown },
  opts: { validateDraft?: boolean } = {}
): Promise<TargetIdentity | null> {
  const locationID = String(input?.locationID || "").trim();
  const draftULID = String(input?.draftULID || "").trim();
  const draftSessionId = String(input?.draftSessionId || "").trim();

  const hasLocation = !!locationID;
  const hasDraft = !!draftULID || !!draftSessionId;
  if ((hasLocation && hasDraft) || (!hasLocation && !hasDraft)) return null;

  if (hasLocation) {
    const ulid = await resolveUid(locationID, env);
    if (!ulid) return null;
    return {
      route: "existing-location",
      ulid,
      locationID,
      draftULID: "",
      draftSessionId: ""
    };
  }

  if (!ULID_RE.test(draftULID) || !draftSessionId) return null;
  if (opts.validateDraft) {
    const draft = await readPrivateShellDraft(env, draftULID, draftSessionId);
    if (!draft) return null;
  }

  return {
    route: "brand-new-private-shell",
    ulid: draftULID,
    locationID: "",
    draftULID,
    draftSessionId
  };
}

async function fetchLegacyProfilesJson(req: Request): Promise<any> {
  const origin = req.headers.get("Origin") || "https://navigen.io";
  const src = new URL("/data/profiles.json", origin).toString();
  const resp = await fetch(src, {
    cf: { cacheTtl: 60, cacheEverything: true },
    headers: { Accept: "application/json" }
  });
  if (!resp.ok) throw new Error("profiles_json_not_reachable");
  return await resp.json();
}

function legacyLocationsArray(data: any): any[] {
  return Array.isArray(data?.locations)
    ? data.locations
    : (data?.locations && typeof data.locations === "object")
      ? Object.values(data.locations)
      : [];
}

function legacyLocationSlug(rec: any): string {
  return String(rec?.locationID || "").trim();
}

function legacyLocationEmbeddedUlid(rec: any): string {
  const raw = String(rec?.ID || rec?.id || "").trim();
  return ULID_RE.test(raw) ? raw : "";
}

async function resolveLegacyLocationUlid(rec: any, env: Env): Promise<string> {
  const slug = legacyLocationSlug(rec);
  const embedded = legacyLocationEmbeddedUlid(rec);
  if (embedded) return embedded;
  if (slug) {
    const mapped = await resolveUid(slug, env);
    if (mapped) return mapped;
  }
  return "";
}

function buildLegacyProfileBase(rec: any, ulid: string): any {
  const out = (rec && typeof rec === "object")
    ? JSON.parse(JSON.stringify(rec))
    : {};

  const slug = legacyLocationSlug(rec);
  if (slug) out.locationID = slug;
  out.locationUID = ulid;

  return out;
}

async function preseedLegacyLocationRecord(
  env: Env,
  rec: any,
  opts: { force?: boolean } = {}
): Promise<{ ok: boolean; slug: string; ulid: string; reason?: string; created?: boolean; skipped?: boolean; overwritten?: boolean }> {
  const slug = legacyLocationSlug(rec);
  const ulid = await resolveLegacyLocationUlid(rec, env);

  if (!slug) return { ok: false, slug: "", ulid: "", reason: "missing_slug" };
  if (!ulid) return { ok: false, slug, ulid: "", reason: "missing_ulid" };

  const baseKey = `profile_base:${ulid}`;
  const existing = await env.KV_STATUS.get(baseKey, "text");
  const force = !!opts.force;

  // Keep alias continuity authoritative even if base already exists
  await env.KV_ALIASES.put(aliasKey(slug), JSON.stringify({ locationID: ulid }));

  if (existing && !force) {
    return { ok: true, slug, ulid, skipped: true };
  }

  const base = buildLegacyProfileBase(rec, ulid);
  await env.KV_STATUS.put(baseKey, JSON.stringify(base));

  if (existing && force) {
    return { ok: true, slug, ulid, overwritten: true };
  }

  return { ok: true, slug, ulid, created: true };
}

async function backfillPublishedLocationDoState(
  env: Env,
  ulid: string,
  opts: { purgeContexts?: string[] } = {}
): Promise<{ ok: boolean; ulid: string; slug: string; visibilityState?: string; indexed?: boolean; reason?: string }> {
  const id = String(ulid || "").trim();
  if (!ULID_RE.test(id)) {
    return { ok: false, ulid: id, slug: "", reason: "invalid_ulid" };
  }

  const rec = await readPublishedEffectiveProfileByUlid(id, env);
  if (!rec) {
    return { ok: false, ulid: id, slug: "", reason: "missing_profile_base" };
  }

  const vis = await computeVisibilityState(env, id);
  const purgeContexts = uniqueTrimmedStrings(Array.isArray(opts.purgeContexts) ? opts.purgeContexts : []);

  await syncPublishedDoIndex(env, {
    ulid: id,
    slug: rec.locationID,
    prevProfile: purgeContexts.length ? { context: purgeContexts.join(";") } : {},
    nextProfile: rec.effective,
    visibilityState: vis.visibilityState
  });

  return {
    ok: true,
    ulid: id,
    slug: rec.locationID,
    visibilityState: vis.visibilityState,
    indexed: vis.visibilityState !== "hidden"
  };
}

function isAdminPreseedAuthorized(req: Request, env: Env): boolean {
  const auth = String(req.headers.get("Authorization") || "").trim();
  const secret = String(env.JWT_SECRET || "").trim();
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
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
  req: Request,
  campaignKey: string = ""
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

    const ck = String(campaignKey || "").trim();

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
      campaignKey: ck
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
  req: Request,
  campaignKey: string = ""
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

    const ck = String(campaignKey || "").trim();

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
      campaignKey: ck
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
): Promise<"ok" | "used" | "invalid"> {
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

  if (rec.locationID !== locationID || rec.campaignKey !== campaignKey) {
    return "invalid";
  }

  if (rec.status === "redeemed") {
    return "used";
  }

  if (rec.status !== "fresh") {
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
