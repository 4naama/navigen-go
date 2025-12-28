# RUNBOOK.md
## NaviGen Owner Platform — Internal Operations Guide

**Audience:** Platform / infra maintainer  
**Scope:** Owner Platform (Phases 1–3)  
**Status:** Production baseline  
**Last reviewed:** 2025-12-27

--------------------------------------------------------------------
## 1) Purpose
--------------------------------------------------------------------

This document defines **how to operate, rotate, deploy, and recover** the NaviGen Owner Platform safely.

It is **not** user-facing documentation.  
It exists to prevent:
- secret loss,
- accidental authority leaks,
- unsafe debugging,
- data drift between repo and KV,
- and “fix-by-regeneration” incidents.

--------------------------------------------------------------------
## 2) Core Security Model (Authoritative)
--------------------------------------------------------------------

**Invariant:**

> **Ownership grants authority.  
> Sessions grant access.  
> Neither alone is sufficient.**

Breaking this invariant is a production incident.

--------------------------------------------------------------------
## 3) Secrets — Source of Truth
--------------------------------------------------------------------

### 3.1 Authoritative storage
- **All secrets live in 1Password**
- Cloudflare Workers are **deployment targets only**
- Git, shell history, PDFs, temp files are **never** sources of truth

### 3.2 Secrets in scope

| Secret | Purpose | Rotation |
|------|--------|----------|
| `OWNER_LINK_HMAC_SECRET` | Signs owner access links | Rare (incident only) |
| `JWT_SECRET` | Admin endpoints (if any remain) | Periodic |

### 3.3 Vault structure (recommended)

- Item type: **Secure Note**
- Titles:
  - `Navigen — OWNER_LINK_HMAC_SECRET`
  - `Navigen — JWT_SECRET`
- Body includes:
  - secret value
  - `Rotated: YYYY-MM-DD`
  - worker name (`navigen-api`)

--------------------------------------------------------------------
## 4) Secret Rotation — Canonical Procedure
--------------------------------------------------------------------

### 4.1 Golden rules
- Generate **once**
- Store **before deploying**
- Deploy **once**
- Never regenerate to “fix” a bug

### 4.2 Rotating `OWNER_LINK_HMAC_SECRET`

1. Generate 48 bytes base64 (≈64 chars)
2. Store immediately in 1Password
3. Deploy via Cloudflare (`wrangler secret put`)
4. Deploy worker
5. Validate functionally:
   - fresh `/owner/exchange` → **302**
   - `/api/stats` authorized → **200**
6. Old links become invalid automatically (expected)

### 4.3 Rotating `JWT_SECRET`
Same procedure; affects admin endpoints only.

--------------------------------------------------------------------
## 5) Operational Truths (Non-Negotiable)
--------------------------------------------------------------------

### 5.1 Single-use owner links
- `/owner/exchange` tokens are **single-use**
- Reuse → **403** (expected)
- CLI tests must exchange **before** browser use

### 5.2 Cookie precedence
- No `op_sess` cookie → **401**
- Valid cookie + wrong ULID → **403**
- This ordering is intentional and correct

### 5.3 Cloudflare secrets
- Write-only
- Cannot be read back
- Losing the value means **forced rotation**

--------------------------------------------------------------------
## 6) Testing Discipline (Authoritative)
--------------------------------------------------------------------

### 6.1 Correct test order
1. Generate fresh signed link
2. Exchange once
3. Immediately test `/api/stats`
4. Never reuse the same exchange URL across tools

### 6.2 Browser vs CLI
- Browser validates **real user flow**
- CLI validates **protocol correctness**
- Never mix both with the same exchange token

--------------------------------------------------------------------
## 7) Incident Handling
--------------------------------------------------------------------

### 7.1 Suspected secret leak
**Immediate actions**
1. Rotate affected secret in 1Password
2. Deploy new secret to Cloudflare
3. Deploy worker
4. Old owner links become invalid automatically

### 7.2 Session abuse suspicion
- Sessions are bounded by:
  - `opsess.expiresAt`
  - `ownership.exclusiveUntil`
- Worst-case blast radius = **one location**

### 7.3 Analytics leakage concern
Verify immediately:
- `/api/stats` without cookie → **401**
- `/api/stats` wrong ULID → **403**

If violated → block and investigate.

--------------------------------------------------------------------
## 8) Hygiene Rules
--------------------------------------------------------------------

### Never
- Commit secret files
- Store secrets in PDFs
- Use `.env` files as long-term storage
- Regenerate secrets casually
- Leave diagnostic endpoints deployed

### Always
- Treat vault as source of truth
- Rotate deliberately
- Fail closed
- Prefer functional verification over introspection

--------------------------------------------------------------------
## 9) Phase Boundaries (Mental Model)
--------------------------------------------------------------------

| Phase | Responsibility |
|-----|----------------|
| Phase 1 | Ownership authority (Stripe) |
| Phase 2 | Access session creation |
| Phase 3 | Analytics enforcement |
| Phase 4 | Owner UX (modals) |
| Phase 6 | Cache / Service Worker safety |

No phase may violate another’s invariants.

--------------------------------------------------------------------
## 10) Pre-Deploy Checklist (MANDATORY)
--------------------------------------------------------------------

Run this **before every production deploy** touching Owner Platform code.

### 10.1 Secrets
- [ ] Secrets exist in 1Password
- [ ] No secrets in git diff
- [ ] No temp secret files present
- [ ] Rotations documented in vault notes

### 10.2 Routing & access
- [ ] `/owner/exchange` is network-only
- [ ] `/api/stats` requires session
- [ ] Wrong ULID → 403
- [ ] No example bypass unless explicitly flagged

### 10.3 Dash behavior
- [ ] Dash shows analytics only when authorized
- [ ] Dash blocks cleanly without session
- [ ] No partial analytics rendering

### 10.4 Pages Worker
- [ ] Cookies forwarded where required
- [ ] OP-sensitive routes never cached
- [ ] No permissive CORS headers on stats

### 10.5 Cleanup
- [ ] No diag endpoints
- [ ] No TEMP admin routes
- [ ] No debug logging of secrets or tokens

--------------------------------------------------------------------
## 11) Data Sync Runbook — Preseed KV Aliases from profiles.json
--------------------------------------------------------------------

**Purpose:**  
Ensure `KV_ALIASES` accurately reflects the canonical `profiles.json` shipped with the frontend.

This pipeline is:
- **idempotent**
- **authoritative**
- safe to run on **every profiles.json change**

### When to run
- On every change to `frontend/public/data/profiles.json`
- Before production deploys that depend on alias resolution
- In CI (preferred) or manually (fallback)

### Invariants
- `profiles.json` in repo is the source of truth
- KV_ALIASES must match the deployed build
- No manual KV edits

--------------------------------------------------------------------
### Canonical pipeline
--------------------------------------------------------------------

# --- Pipeline: run on every profiles.json change (idempotent) ---
cd C:\Users\USER\Documents\a_git\navigen-go\backend

# --- Generate alias map from the repo's profiles.json (matches deployed build). ---
Copy-Item "..\frontend\public\data\profiles.json" ".\profiles.json" -Force
node .\tools\gen-ulid-aliases.mjs --in .\profiles.json --out .\aliases.ndjson

# --- Convert NDJSON → single JSON array (Wrangler v4 bulk format). ---
$lines  = Get-Content .\aliases.ndjson | Where-Object { $_.Trim() -ne "" }
$joined = "[" + ($lines -join ",") + "]"
Set-Content -Path .\aliases.json -Value $joined -Encoding UTF8

# --- Authenticate for KV bulk (use CI secret in real pipeline). ---
$env:CLOUDFLARE_API_TOKEN = "<CI_SECRET_TOKEN>"

# --- Upload alias→ULID map into KV_ALIASES (idempotent bulk write). ---
wrangler kv bulk put `
  --namespace-id 56c318c8648145e580a825afa8e3d710 `
  --remote `
  .\aliases.json

--------------------------------------------------------------------
## 12) Deployment Runbook — Cloudflare Workers & Pages
--------------------------------------------------------------------

**Cloudflare Console:**  
https://dash.cloudflare.com/cf19953d07012cb6bbb7c10fbe29ad26/workers-and-pages
https://dash.cloudflare.com/cf19953d07012cb6bbb7c10fbe29ad26/workers/kv/namespaces

This project has **three independent deploy surfaces**.  
They must **not** be conflated.

### 12.1 Backend — Node server (`server.js`)

cd C:\Users\USER\Documents\a_git\navigen-go
git status
git add backend\server.js backend\package.json backend\package-lock.json
git commit -m "Backend server deploy"
git push origin main

### 12.2 Backend — API Worker (Production)

cd C:\Users\USER\Documents\a_git\navigen-go\backend\worker
git add .
git commit -m "Backend deploy"
git push origin main

cd C:\Users\USER\Documents\a_git\navigen-go\backend\worker
wrangler deploy

If nothing changed (force rebuild):
git commit --allow-empty -m "Backend deploy"
git push origin main

### 12.3 Frontend — Cloudflare Pages (navigen.io)

cd C:\Users\USER\Documents\a_git\navigen-go\frontend
git add -A
git commit -m "Frontend deploy"
git push origin main

If nothing changed (force Pages rebuild):

git commit --allow-empty -m "Deploy: rebuild prod"
git push origin main

--------------------------------------------------------------------
## 13) Final Invariant (Memorize This)
--------------------------------------------------------------------

Authority is earned by payment.
Access is granted by session.
Visibility is enforced by backend only.

If this invariant holds, the Owner Platform is safe.

***End of RUNBOOK.md***

Timeline management with NaviGen-level tools (not search engines)
What you control today (the real levers)

Inside NaviGen, you already control:

Discoverability

Appears in search results / lists

Appears in “Popular”, “Nearby”, etc.

Appears when users browse

Ranking / prominence

Order in results

Featured vs buried

Capabilities

Campaigns

Analytics

Dash

Owner CTAs

UI messaging

What the owner sees

What the public sees

That’s all you need.

The finalized timeline (rephrased for internal ops)

We’ll rename the phases to reflect what the system does, not how it feels.

Phase 1 — Active campaign

(€50 / 30 days)

System behavior

LPM = discoverable = true

Ranking = boosted

Campaigns = enabled

Analytics = enabled

Exclusive operation = enforced

Owner message

“Your business is actively promoted.”

Public

Sees business everywhere it should be

Phase 2 — Courtesy visibility

(free, Y × 30 days)

System behavior

LPM = discoverable = true

Ranking = reduced (natural fall)

Campaigns = disabled

Analytics = disabled

Exclusive operation = off (but nobody else promoted yet)

Owner message

“Your campaign ended, but we’re keeping your business visible so customers can still find you.”

Public

Still finds the business

It’s just less prominent

This is the “nice guy” phase.

Phase 3 — Held visibility

(€5 / 30 days, optional)

This is not protection.
This is holding a place.

System behavior

LPM = discoverable = true

Ranking = stabilized (does not decay further)

Campaigns = disabled

Analytics = disabled

Owner message

“If you’d like to keep your place visible while you decide what’s next, you can hold it for a little longer.”

Public

Business still appears

Not promoted

Not highlighted

Important:
If the owner does nothing, the system proceeds to Phase 4 automatically.

Phase 4 — Not discoverable

(after long inactivity: e.g. 6–12 months)

This is where your clarification matters most.

“We simply set LPM to not discoverable.”

Exactly.

System behavior

LPM = discoverable = false

Removed from:

search results

lists

browsing

Direct link:

may still open (initially)

but does not appear anywhere

Owner message

“Your business is currently inactive on NaviGen.
Start a campaign anytime to become visible again.”

Public

Will not encounter the business organically

This solves:

orphaned LPM cost

clutter

false presence

Without deleting anything.

Why this works without “indexing”

You’re not trying to control Google.
You’re controlling attention flow inside your product.

From a business owner’s POV:

“Visible on NaviGen” = valuable

“Hidden on NaviGen” = effectively gone

Whether a direct link technically works is irrelevant unless:

it’s shared intentionally

and someone already knows it

That’s acceptable free residue, not value leakage.

One subtle but important rule (prevents abuse)

Discoverability is granted by time-bounded participation, not by existence.

This means:

Creating an LPM does not guarantee visibility

Visibility is earned by activity (campaign or courtesy)

Inactivity leads to quiet removal

This is fair and intuitive.