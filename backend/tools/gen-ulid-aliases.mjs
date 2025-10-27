// tools/gen-ulid-aliases.mjs
// purpose: read profiles.json → emit NDJSON for KV_ALIASES; ULIDs are deterministic.

import { readFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Crockford Base32, no I/L/O/U to match ULID charset.
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function toBase32(bytes) {
  // encode to Crockford base32 (no padding); used for ULID charspace.
  let bits = 0, val = 0, out = '';
  for (const b of bytes) { val = (val << 8) | b; bits += 8;
    while (bits >= 5) { bits -= 5; out += B32[(val >>> bits) & 31]; val &= (1 << bits) - 1; } }
  if (bits) out += B32[(val << (5 - bits)) & 31];
  return out;
}

function isUlid(id) { return /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id); }

function normalizeLocations(obj) {
  // accepts array or object form; returns array of entries with locationID.
  if (Array.isArray(obj?.locations)) return obj.locations;
  if (obj?.locations && typeof obj.locations === 'object') return Object.values(obj.locations);
  return [];
}

function ulidFromAlias(alias) {
  // fixed 48-bit time (2025-01-01T00:00:00.000Z) + 80 bits from sha256(alias).
  const fixedMs = 1735689600000n; // 2025-01-01 UTC
  const time48 = Buffer.alloc(6);
  let x = fixedMs;
  for (let i = 5; i >= 0; i--) { time48[i] = Number(x & 0xffn); x >>= 8n; }

  const hash = createHash('sha256').update(alias).digest(); // 32 bytes
  const rand10 = hash.subarray(0, 10);

  const bytes = Buffer.concat([time48, rand10]); // 16 bytes
  let b32 = toBase32(bytes);
  if (b32.length < 26) b32 = b32.padEnd(26, '0');
  if (b32.length > 26) b32 = b32.slice(0, 26);
  return b32;
}

async function main() {
  // args: --in <profiles.json> --out <aliases.ndjson>
  const args = new Map();
  for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
  const inPath = resolve(process.cwd(), args.get('--in') || 'profiles.json');
  const outPath = resolve(process.cwd(), args.get('--out') || 'aliases.ndjson');

  const raw = await readFile(inPath, 'utf8');
  const data = JSON.parse(raw);
  const items = normalizeLocations(data);

  const aliases = items.map(x => String(x?.locationID || '').trim()).filter(Boolean);
  const out = createWriteStream(outPath, { encoding: 'utf8' });

  let wrote = 0;
  for (const alias of aliases) {
    const key = `alias:${alias}`;
    const value = isUlid(alias) ? { locationID: alias } : { locationID: ulidFromAlias(alias) };
    out.write(JSON.stringify({ key, value: JSON.stringify(value) }) + '\n'); // KV bulk NDJSON
    wrote++;
  }
  out.end();
  out.on('finish', () => console.log(`Wrote ${wrote} alias lines → ${outPath}`));
}

main().catch(err => { console.error(err?.stack || String(err)); process.exit(1); });
