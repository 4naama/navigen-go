# NaviGen v1.1 User Test Protocol
State: v1.1 — Preferential visibility inside NaviGen surfaces (deterministic ordering)
Stripe: v1 (unchanged)
Purpose: validate closed behavior (public vs owner), promo flow integrity, dash gating, and preferential visibility value.

--------------------------------------------------------------------

## Actors
1) Visitor (free passerby)
- No op_sess cookie
- No payments
- Can browse LPM and public lists
- Must not access Dash analytics

2) Business Owner (paid operator)
- Has active ownership window (exclusiveUntil > now)
- Can mint op_sess via /owner/stripe-exchange
- Must see preferential visibility during active campaign

--------------------------------------------------------------------

## Test Matrix

### 1) Preferential visibility (v1.1 value)
Goal: prove paid locations appear before non-paid inside NaviGen lists.

Steps:
1. Open ctx: language-schools/helen-doron/hungary
2. Observe Popular list:
   - Ensure promoted locations appear before visible ones.
3. Pick 1 promoted slug and 1 visible slug.
4. Confirm via /api/status:
   - promoted slug: visibilityState=promoted
   - visible slug: visibilityState=visible

Pass:
- promoted locations appear earlier in the list (deterministic).

--------------------------------------------------------------------

### 2) Visitor (no payment, no session)
Goal: visitor can browse but cannot access owner-only analytics.

Steps:
1. Open an unowned location LPM
2. Tap 📈 (Dash)
3. Confirm Dash shows access interstitial (401) and never real stats
4. Tap 🎁 (Promo)
   - If location not owned: must show gated toast (403)

Pass:
- No real analytics without op_sess + entitlement.
- Promo QR cannot be issued on unowned locations (Policy B).

--------------------------------------------------------------------

### 3) Owner session minting
Goal: ensure /owner/stripe-exchange mints a cookie and stats access works.

Steps:
1. Complete Stripe checkout for a promoted location.
2. Confirm redirect hits /owner/stripe-exchange (302 + Set-Cookie op_sess=...)
3. Open /dash/<slug>
4. Confirm /api/stats returns 200 for the correct location.

Pass:
- Dash loads without refresh loops.
- op_sess is per-location.

--------------------------------------------------------------------

### 4) Owner mismatch UX (intelligent routing)
Goal: show mismatch interstitial and route owner to signed-in location.

Steps:
1. Mint op_sess for Location A.
2. Open /dash/Location B.
3. Expect 403 interstitial.
4. Ensure interstitial offers:
   - “Open my signed-in location”
5. Tap it; should navigate to Location A Dash.

Pass:
- Reduces confusion; no “Denied” raw.

--------------------------------------------------------------------

### 5) Promo issuance (Policy B)
Goal: promo QR only when (ownedNow=true) AND campaign record active.

Cases:
A) not owned + no campaign -> /api/promo-qr => 403
B) owned + campaign -> /api/promo-qr => 200 qrUrl
C) owned + no campaign -> /api/promo-qr => 404 (no promo configured) OR 403 (if you later decide to treat it as “campaign required”)
D) not owned + campaign -> /api/promo-qr => 403

Pass:
- A and D must be blocked.
- B must work.

--------------------------------------------------------------------

### 6) Promo redeem integrity
Goal: ARMED → SCAN → REDEEM/INVALID chain holds.

Steps:
1. On customer device: LPM → 🎁 → show promo QR (ARMED)
2. On cashier device: scan promo QR (SCAN)
3. Confirm cashier redirect shows redeemed=1 and cashier confirmation modal
4. Confirm customer modal polls and shows customer confirmation modal
5. Re-scan the same promo QR:
   - must log INVALID (no double redeem)

Pass:
- Exactly-once token.
- Invalid attempts logged.

--------------------------------------------------------------------

## Artifacts to capture for any failure
- URL, slug, time
- /api/status output (ownedNow, visibilityState, exclusiveUntil)
- /api/promo-qr status code and body
- /api/stats status code and whether cookie present
- For Dash: whether interstitial is shown vs raw Denied
