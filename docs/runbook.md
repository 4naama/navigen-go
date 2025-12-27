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

Test plan (save for later)
0) Preconditions (what you need ready)

You need three identities to run the full matrix later:

Unowned location (slug/ULID)

no ownership:<ULID> or exclusiveUntil expired

Owned location (slug/ULID)

real ownership exists and is active (exclusiveUntil in future)

Example location (optional but recommended for early Dash validation)

a location explicitly flagged as example in the dataset (once you implement that mechanism)

You also need two browser states:

With owner session (after using /owner/exchange link, cookie op_sess present)

Without owner session (incognito or cleared cookie)

1) Test Case — Unowned → Owner settings (claim)

Steps

Open LPM for an unowned location

Click 📈

Expected

Dash does not open

Owner settings modal opens (Claim variant)

Shows: Run campaign / Protect / Example dashboards

No analytics rendered

2) Test Case — Owned + NO session → Owner settings (restore)

Steps

Ensure location is owned

Ensure browser has no op_sess (incognito)

Open owned LPM

Click 📈

Expected

Dash does not open

Owner settings modal opens (Restore variant)

Shows: Restore access / Example dashboards

Does not show: Run campaign / Protect

3) Test Case — Owned + session → Dash opens

Steps

Ensure location is owned

Establish owner session by visiting /owner/exchange?... (cookie set)

Open owned LPM

Click 📈

Expected

Opens https://navigen.io/dash/<ULID> in new tab

No Owner settings modal

4) Test Case — Example dashboards path

Steps

From any Owner settings modal, click See example dashboards

Open one of the example entries

Expected

Dash opens normally for that example location

Analytics loads (counts, QR Info, Campaigns, Analytics)

5) Abuse / resilience checks

Rapidly click 📈 multiple times → only one modal instance

Set DevTools Offline → click 📈 → must fail closed (no Dash, no analytics)