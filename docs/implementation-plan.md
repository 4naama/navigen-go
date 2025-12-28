# Implementation Order (Authoritative)

This document defines the implementation sequence for the NaviGen Owner Platform,
ordered by dependency, with explicit happy-path tests, failure tests, and ship gates.

This document is NON-NORMATIVE.
The normative requirements live in `navigen-spec.md`.

--------------------------------------------------------------------
PHASE 1 — STRIPE WEBHOOK PROCESSOR → OWNERSHIP RECORD
--------------------------------------------------------------------

Goal:
Implement the API Worker as the Stripe webhook processor and the sole writer
of ownership:<ULID>, establishing authoritative ownership state exactly once
per successful payment.

Scope (Phase 1 only):
• Stripe webhook endpoint in API Worker
• Stripe signature verification
• Idempotent processing by payment_intent.id
• Write/update ownership:<ULID> in KV_STATUS

Explicit non-goals:
• No Dash gating
• No owner access sessions
• No UI changes
• No campaign lifecycle enforcement beyond minimum ownership extension

Storage (Phase 1):
• ownership:<ULID> stored in KV_STATUS
• stripe_processed:<payment_intent.id> stored in KV_STATUS
• KV_OWNERSHIP and KV_IDEMPOTENCY are reserved for a later refactor

Processing order:
1. Receive Stripe webhook (POST /api/stripe/webhook)
2. Verify Stripe signature
3. Extract required metadata (locationID, ownershipSource, initiationType)
4. Resolve locationID → ULID via KV_ALIASES
5. Enforce idempotency using stripe_processed:<payment_intent.id>
6. Create or extend ownership:<ULID> monotonically
7. Persist idempotency marker
8. Return 2xx to Stripe

Happy-path tests:
• Valid webhook creates ownership record
• Repeat webhook does not extend ownership twice
• Ownership source is stored correctly (campaign / exclusive)

Failure & safeguard tests:
• Invalid signature → no KV writes
• Missing metadata → no KV writes
• Unresolvable locationID → no KV writes
• Partial write failure → idempotency marker not written
• Existing QR, promo, and stats flows remain unaffected

Ship gate:
• API Worker is the only component writing ownership:<ULID>
• Ownership extension is monotonic and idempotent
• Stripe retries never mutate ownership state twice

--------------------------------------------------------------------
📌 Phase 1 status (locked)
--------------------------------------------------------------------

✅ Stripe webhook endpoint live (API Worker authoritative)

✅ Stripe signature verification enforced

✅ Required ownership metadata validated
    (locationID, ownershipSource, initiationType)

✅ Alias → ULID resolution working

✅ Idempotency enforced by payment_intent.id

✅ Ownership record written exactly once
    (ownership:<ULID> in KV_STATUS)

✅ Ownership extension is monotonic (exclusiveUntil)

✅ Replay / resend safe
    (stripe_processed:<payment_intent.id>)

✅ Invalid / partial events produce no writes

✅ API Worker is the sole ownership writer

✅ No UI, no sessions, no Dash coupling (scope respected)

✅ No spec changes required

--------------------------------------------------------------------
PHASE 2 — OWNER ACCESS SESSION (NO ACCOUNTS)
--------------------------------------------------------------------

Goal (plain language):
Owners must be able to open Dash without accounts.
They receive an email link, click it, and NaviGen sets a secure cookie session.
From then on, Dash access works on that device until ownership expires.

Scope (Phase 2 only):
• Signed owner access link token (HMAC)
• /owner/exchange endpoint in API Worker
• Single-use enforcement for access links
• KV-backed owner session record + HttpOnly cookie

Explicit non-goals:
• No Dash gating implementation yet (that is Phase 3)
• No LPM “Owner settings” modal changes (Phase 4)
• No campaign setup UI
• No profile edit API

Storage (Phase 2; uses existing KV_STATUS):
• ownerlink_used:<jti> stored in KV_STATUS
• opsess:<sessionId> stored in KV_STATUS
• Cookie: op_sess=<sessionId> (HttpOnly)

Rationale:
• KV_STATUS already exists and is authoritative
• These keys are access/session artifacts, not stats

--------------------------------------------------------------------
2.1 Inputs required (must exist before Phase 2 works)
--------------------------------------------------------------------

A) API Worker secrets:
• OWNER_LINK_HMAC_SECRET (new)
  - used to sign/verify access tokens
  - must never appear in client bundles

B) Phase 1 ownership records:
• ownership:<ULID> must exist and contain exclusiveUntil
  - Phase 2 validates ownership is active before setting a session

C) Email sending:
Phase 2 assumes the system has a way to send the owner access link.
If email sending is not yet implemented, Phase 2 is still testable by
generating a token and manually opening the exchange URL.

(No new email system is invented here.)

--------------------------------------------------------------------
2.2 Signed Link Token (HMAC) — definition and lifecycle
--------------------------------------------------------------------

Plain language:
The signed link is a short-lived “one-time entry ticket” to create a device session.

It must:
• expire quickly (15 minutes from issue)
• be single-use (first click creates the session; reuse is denied)
• be tied to a specific ULID

Tech cookbook:
Token payload fields (minimal; as spec):
• ver, ulid, iat, exp, jti, purpose="owner-dash"

Signing:
• signature = HMAC-SHA256(payload) using OWNER_LINK_HMAC_SECRET

Encoding:
• payload encoded as URL-safe base64 (or compact JSON string)
• signature encoded as URL-safe base64 (or hex)
• link format:
  /owner/exchange?tok=<payload>&sig=<signature>

Validation rules:
• signature verifies
• now <= exp
• purpose == "owner-dash"
• ownerlink_used:<jti> does not exist
• ownership:<ULID>.exclusiveUntil > now

Single-use marker:
• ownerlink_used:<jti> = { ulid, usedAt }

--------------------------------------------------------------------
2.3 /owner/exchange endpoint (API Worker)
--------------------------------------------------------------------

Plain language:
The exchange endpoint converts a short-lived link into a cookie session.
It never exposes analytics; it only grants the ability to access owner-only APIs later.

Tech cookbook:
Endpoint:
• GET /owner/exchange?tok=...&sig=...

Steps:
1) Parse tok/sig
2) Verify HMAC signature
3) Validate payload fields and time window
4) Enforce single-use (ownerlink_used:<jti>)
5) Confirm ownership active (ownership:<ULID>.exclusiveUntil > now)
6) Create random sessionId
7) Write opsess:<sessionId> = { ver, ulid, createdAt, expiresAt }
   - expiresAt MUST NOT exceed ownership.exclusiveUntil
8) Set cookie:
   op_sess=<sessionId>; HttpOnly; Secure; SameSite=Lax; Path=/
9) Redirect to /dash/<ulid> (clean URL)

Important:
• This endpoint must be Network-only (SW must not cache /owner/*)

--------------------------------------------------------------------
2.4 Owner session validation contract (used in later phases)
--------------------------------------------------------------------

Plain language:
A cookie alone is never enough. The server must look up the session record.

Tech cookbook:
Given op_sess cookie:
• read opsess:<sessionId>
• require:
  - session exists
  - now < opsess.expiresAt
  - ownership:<ULID>.exclusiveUntil > now
If any check fails: treat as no session.

Note:
• This validation is consumed by Phase 3 gating.

--------------------------------------------------------------------
2.5 Direct testing steps (Happy path)
--------------------------------------------------------------------

Happy test H1 — “Create session from a valid link”
1) Ensure a real ownership record exists (Phase 1):
   • ownership:<ULID>.exclusiveUntil is in the future
2) Create a signed link token for that ULID (manual tooling or temporary script)
3) Open:
   /owner/exchange?tok=...&sig=...
4) Confirm:
   • browser receives op_sess cookie
   • KV_STATUS has opsess:<sessionId>
   • KV_STATUS has ownerlink_used:<jti>
5) Confirm redirect:
   • lands on /dash/<ULID> (even if Phase 3 gating is not implemented yet)

Happy test H2 — “Session record respects ownership expiry”
1) Create session (H1)
2) Manually set ownership:<ULID>.exclusiveUntil to a past time (test env only)
3) Validate (via manual request in Phase 3 later):
   • session becomes invalid when ownership is expired

--------------------------------------------------------------------
2.6 Failure testing (must be deterministic)
--------------------------------------------------------------------

F1 — Expired link
• Generate token with exp in the past
• Open /owner/exchange
Expected:
• denied (no cookie, no opsess, no ownerlink_used)

F2 — Invalid signature
• Modify one byte of tok or sig
Expected:
• denied (no cookie, no writes)

F3 — Reuse link (single-use)
• Use a valid link once (H1)
• Open the same link again
Expected:
• denied (no new session), ownerlink_used prevents reuse

F4 — Ownership expired at exchange time
• Token is valid but ownership:<ULID>.exclusiveUntil <= now
Expected:
• denied (no session created)

F5 — KV write fails
• Simulate KV failure (test env)
Expected:
• exchange fails closed (no cookie), and ownerlink_used must NOT be written unless session is created

--------------------------------------------------------------------
2.7 Safeguard tests (ensure Phase 2 doesn’t break existing system)
--------------------------------------------------------------------

S1 — QR flow unaffected
• Info QR scan works and increments stats/qrlog as before
• Promo redeem flow works as before

S2 — Dash still loads as before (no gating yet)
• Opening /dash/<ULID> should behave exactly as current until Phase 3 introduces gating

S3 — Service worker does not cache /owner/exchange
• DevTools “from ServiceWorker” must not appear for /owner/exchange

--------------------------------------------------------------------
2.8 Ship gate (Phase 2 complete)
--------------------------------------------------------------------

Phase 2 is complete when:
• A valid signed link creates a cookie session and KV session record
• The link cannot be reused
• Expired/invalid links never create sessions
• Ownership expiry invalidates sessions (by contract, enforced later)
• Existing QR/promo/stats behaviors remain unchanged

--------------------------------------------------------------------
📌 Phase 2 status (locked)
--------------------------------------------------------------------

✅ Signed owner links

✅ Single-use enforced

✅ Ownership validated

✅ Session cookie hardened

✅ Replay blocked

✅ Referrer leakage prevented

✅ TEMP endpoints removed

✅ No spec changes required

--------------------------------------------------------------------
PHASE 3 — DASH & STATS GATING (OWNER-ONLY ANALYTICS)
--------------------------------------------------------------------

Goal (plain language):
Prevent any real analytics from being shown unless:
• the location is owned, and
• the requester has a valid owner session.

Dash must be either:
• fully accessible (owned + session), or
• fully blocked (all other cases).

There is no partial visibility and no public fallback.

Scope (Phase 3 only):
• Gate /api/stats responses
• Gate Dash data loading
• Allow Example Locations explicitly
• Do NOT implement new UI flows (handled in Phase 4)

Explicit non-goals:
• No Owner settings modal changes
• No root-shell BO/Individuals changes
• No service-worker changes (Phase 6)
• No campaign logic changes

Dependencies:
• Phase 1: ownership:<ULID> exists
• Phase 2: opsess:<sessionId> exists + cookie op_sess

--------------------------------------------------------------------
3.1 Gating model (authoritative)
--------------------------------------------------------------------

Plain language:
Analytics access is binary.

Rules:
• If ownership does not exist → analytics blocked
• If ownership exists but no valid session → analytics blocked
• If ownership exists and session valid → analytics allowed
• If location is flagged as Example Location → analytics allowed

Blocked means:
• No real analytics data returned
• No partial aggregates
• No masked values

--------------------------------------------------------------------
3.2 /api/stats gating (server-side)
--------------------------------------------------------------------

Plain language:
All Dash data originates from /api/stats.
If this endpoint is gated correctly, analytics cannot leak.

Tech cookbook:
1) Extract requested location ULID
2) Check Example Location flag
   • if true → allow (skip ownership/session checks)
3) Load ownership:<ULID>
   • if missing or exclusiveUntil <= now → return blocked response
4) Validate owner session:
   • read op_sess cookie
   • load opsess:<sessionId>
   • ensure:
     - session exists
     - now < opsess.expiresAt
     - ownership.exclusiveUntil > now
   • if any fail → return blocked response
5) If all checks pass → return full stats payload

Blocked response contract:
• HTTP 403 (or 200 with `{ blocked: true }`, choose one and be consistent)
• MUST NOT include any analytics fields
• MUST be distinguishable by Dash UI

A wrong-ULID request must return 403 Forbidden only after a valid owner session is established.
If no valid session exists, 401 Unauthorized takes precedence.

--------------------------------------------------------------------
3.3 Dash UI behavior on blocked responses
--------------------------------------------------------------------

Plain language:
Dash must not attempt to “partially render” when blocked.

Tech cookbook:
1) Dash fetches /api/stats
2) If blocked response detected:
   • Do NOT render charts, tables, or counters
   • Show a neutral “Dash blocked” state
   • Provide guidance text only (no CTAs here; Phase 4 handles actions)

Note:
• Dash itself does not open modals in Phase 3
• Entry into Owner settings is handled from LPM 📈 (Phase 4)

--------------------------------------------------------------------
3.4 Example Location allowlist
--------------------------------------------------------------------

Plain language:
Certain locations are explicitly allowed to show Dash without ownership.
These are examples, not demos.

Tech cookbook:
• Example flag source: internal flag (per spec 8.3.1.1)
• Gate bypass applies only if flag is true
• All other rules remain unchanged

--------------------------------------------------------------------
3.5 Direct testing steps (Happy path)
--------------------------------------------------------------------

H1 — Owned + session
1) ownership:<ULID>.exclusiveUntil > now
2) Valid opsess cookie present
3) Request /api/stats?uid=<ULID>
Expected:
• Full analytics payload returned
• Dash renders normally

H2 — Example Location
1) Location flagged as Example
2) No ownership, no session
3) Request /api/stats
Expected:
• Full analytics payload returned
• Dash renders normally

--------------------------------------------------------------------
3.6 Failure testing (must be deterministic)
--------------------------------------------------------------------

F1 — Unowned location
• ownership:<ULID> missing
Expected:
• /api/stats blocked
• No analytics fields present

F2 — Owned but no session
• ownership exists
• op_sess cookie missing or invalid
Expected:
• /api/stats blocked

F3 — Session expired
• opsess exists but expiresAt <= now
Expected:
• /api/stats blocked

F4 — Ownership expired
• ownership.exclusiveUntil <= now
Expected:
• /api/stats blocked even if session cookie exists

F5 — Tampered cookie
• op_sess present but no matching opsess:<sessionId>
Expected:
• /api/stats blocked

--------------------------------------------------------------------
3.7 Safeguard tests (regression prevention)
--------------------------------------------------------------------

S1 — QR flows unaffected
• Info QR scans still increment stats
• Promo redeem flows still log correctly

S2 — Campaign flows unaffected
• Campaign creation, redeem, and confirmation unaffected

S3 — Stats schema unchanged
• When allowed, /api/stats payload matches previous structure exactly

S4 — No analytics leakage
• Inspect blocked responses: no counts, no aggregates, no totals

--------------------------------------------------------------------
3.8 Ship gate (Phase 3 complete)
--------------------------------------------------------------------

Phase 3 is complete when:
• /api/stats never returns real analytics for unowned or sessionless requests
• Dash never renders analytics in blocked states
• Example Locations are the only bypass
• Existing non-analytics functionality behaves exactly as before

--------------------------------------------------------------------
PHASE 4 — LPM 📈 → “OWNER SETTINGS” MODAL (CONTEXTUAL OWNERSHIP ACTIONS)
--------------------------------------------------------------------

Goal (plain language):
When a user clicks 📈 on an LPM and Dash access is blocked,
the system must not redirect or partially render analytics.

Instead, it must open a contextual “Owner settings” modal
that explains the situation and offers the correct next actions
for that specific LPM.

This phase makes ownership actionable and understandable
without leaving the LPM context.

Scope (Phase 4 only):
• Implement the “Owner settings” modal
• Wire LPM 📈 click behavior to modal vs Dash
• Support two modal variants based on ownership/session state
• Provide access to Example Dashboards from the modal

Explicit non-goals:
• No changes to Stripe payments (Phase 1)
• No changes to signed links or sessions (Phase 2)
• No changes to Dash gating logic (Phase 3)
• No root-shell BO/Individuals changes (Phase 5)

Dependencies:
• Phase 1: ownership:<ULID> authoritative
• Phase 2: opsess cookie + session record
• Phase 3: Dash is correctly blocked when required

--------------------------------------------------------------------
4.1 Trigger condition (authoritative)
--------------------------------------------------------------------

Plain language:
The 📈 icon on an LPM is the contextual entry point for owner actions.

Rules:
• 📈 click is intercepted before navigating to Dash
• The system evaluates ownership + session state
• Behavior branches deterministically

Decision table:

A) Owned + valid session
→ Open Dash normally (/dash/<ULID>)

B) Owned + no valid session
→ Dash is blocked
→ Open “Owner settings” modal (restore variant)

C) Unowned
→ Dash is blocked
→ Open “Owner settings” modal (claim variant)

There is no redirect in Phase 4.

--------------------------------------------------------------------
4.2 Owner settings modal — shared UI contract
--------------------------------------------------------------------

Plain language:
The “Owner settings” modal is a neutral, contextual action panel.
It never shows analytics and never implies ownership.

UI contract:
• Modal title: “Owner settings”
• Modal is dismissible (X)
• Modal content is translation-driven (t(key))
• Modal must not display any real analytics data
• Modal actions are specific to the current LPM

The same modal shell is reused for all variants.

--------------------------------------------------------------------
4.3 Variant A — Owned + no session (restore access)
--------------------------------------------------------------------

Plain language:
The user already owns this location, but their access session is missing or expired.

Modal content:
• Explanation:
  “You already own this location, but your access session has expired.”
• Actions:
  1) Restore access
     - Instruction: use the most recent Owner access email / Stripe receipt
     - CTA: opens Restore Access modal (guidance only; no resend)
  2) See example dashboards
     - CTA: opens Example Dashboards modal (3–6 cards)

Restrictions:
• No payment actions shown
• No “Run campaign” or “Protect” actions shown

--------------------------------------------------------------------
4.4 Variant B — Unowned (claim ownership)
--------------------------------------------------------------------

Plain language:
The user does not own this location.

Modal content:
• Explanation:
  “Analytics and owner controls are available to the active operator.”
• Actions:
  1) Run campaign
     - CTA: opens Campaign Setup modal (contextual to this LPM)
  2) Protect this location
     - CTA: opens Exclusive Operation Period modal (€5 / 30 days)
  3) See example dashboards
     - CTA: opens Example Dashboards modal (3–6 cards)

Restrictions:
• No restore-access action shown

--------------------------------------------------------------------
4.5 Example Dashboards modal (from Owner settings)
--------------------------------------------------------------------

Plain language:
Example Dashboards show real analytics for designated example locations.

Rules:
• Example locations must be explicitly flagged (spec 8.3.1.1)
• Dash opens normally for those locations
• Example Dashboards must never imply performance guarantees
• A CTA back to ownership actions must be available

This modal is informational only.

--------------------------------------------------------------------
4.6 Direct testing steps (Happy path)
--------------------------------------------------------------------

H1 — Owned + valid session
1) Open an LPM you own
2) Click 📈
Expected:
• Dash opens normally
• No modal appears

H2 — Owned + no session
1) Clear op_sess cookie
2) Open owned LPM
3) Click 📈
Expected:
• “Owner settings” modal opens (restore variant)
• Restore access and Example Dashboards visible
• No payment actions visible

H3 — Unowned LPM
1) Open an unowned LPM
2) Click 📈
Expected:
• “Owner settings” modal opens (claim variant)
• Run campaign, Protect, Example Dashboards visible

--------------------------------------------------------------------
4.7 Failure testing (must be deterministic)
--------------------------------------------------------------------

F1 — Modal shows analytics
• Inspect modal DOM and network requests
Expected:
• No analytics requests issued
• No charts or counters rendered

F2 — Wrong variant shown
• Force owned/no-session vs unowned cases
Expected:
• Correct variant always selected

F3 — Modal dismissal
• Close modal without action
Expected:
• User remains on LPM; no navigation side effects

--------------------------------------------------------------------
4.8 Safeguard tests (regression prevention)
--------------------------------------------------------------------

S1 — LPM behavior unaffected
• Non-owner actions (map, call, share, etc.) still work

S2 — Dash gating unchanged
• Direct /dash/<ULID> access still blocked per Phase 3

S3 — Example Dash unaffected
• Example locations still load Dash normally

S4 — No phantom Static QR scan
• Navigate to /?lp=<slug> via in-app links (Campaigns list, root shell, etc.)
  Expected: Static QR scan does not increment
• Scan a real Info QR externally (camera scan to ...?lp=<slug>)
  Expected: Static QR scan increments exactly once 

S5 — Discoverability decay (courtesy window)
• Set ownership:<ULID>.exclusiveUntil to a time more than 60 days in the past (test env).
Expected:
• /api/data/list?context=... does not include the location (hidden from discovery).
• Direct link /?lp=<slug> still opens the LPM.
• LPM shows an “inactive” notice (informational only).

--------------------------------------------------------------------
4.9 Ship gate (Phase 4 complete)
--------------------------------------------------------------------

Phase 4 is complete when:
• 📈 never redirects when Dash is blocked
• “Owner settings” modal opens reliably in all blocked cases
• Correct modal variant is shown for ownership/session state
• No analytics data is ever shown inside the modal
• Existing LPM behavior is unchanged

--------------------------------------------------------------------
Phase4 status (locked)
--------------------------------------------------------------------

✅ Root shell entry points open Example Dashboards (no toast-only dead ends)
✅ Internal /?lp= navigations do not emit qr-scan hits (prevents phantom “Static QR scan” counts)

--------------------------------------------------------------------
PHASE 5 — ROOT SHELL ONBOARDING (BUSINESS OWNERS & INDIVIDUALS)
--------------------------------------------------------------------

Goal (plain language):
When the app is opened without a location context, NaviGen must present
clear, non-intrusive entry points for both business operators and individuals.

This phase ensures that:
• business users can discover ownership actions without an LPM,
• individual users see meaningful utilities,
• the root shell no longer appears empty or confusing.

Scope (Phase 5 only):
• Render Business Owners and Individuals groups on the root shell
• Wire all cards to existing modals or flows
• Hide empty geo-driven groups (Popular / Accordion) on root

Explicit non-goals:
• No Dash gating changes (Phase 3)
• No LPM 📈 changes (Phase 4)
• No payment logic changes (Phase 1)
• No new analytics or data models

Dependencies:
• Modal system is available (modal-injector.js)
• Existing flows for Campaigns, Protect Location, Restore Access, MSM, Promotions, Help

--------------------------------------------------------------------
5.1 Root shell detection (authoritative)
--------------------------------------------------------------------

Plain language:
The root shell is defined as the app state where no location context exists
and no geo-driven lists can be populated.

Rules:
• Root shell is active when:
  - no LPM is open, and
  - no location search or geo context is active.
• In root shell mode, geo-driven UI sections must not render if empty.

--------------------------------------------------------------------
5.2 Root shell layout contract
--------------------------------------------------------------------

Plain language:
In root shell mode, the app must prioritize role-based entry points
over location lists.

Layout order (top to bottom):
1) Business Owners group
2) Individuals group
3) (No Popular group if empty)
4) (No Accordion groups if empty)

Rules:
• Business Owners and Individuals are top-level groups.
• They are not location lists and must not be treated as such.
• They must not reuse Popular/Accordion quick-button styles.
• Both groups are collapsed by default when both are present.

--------------------------------------------------------------------
5.3 Business Owners group
--------------------------------------------------------------------

Plain language:
The Business Owners group exposes ownership-related actions
without requiring a location to be currently selected.

UI contract:
• Group label: “Business Owners”
• Rendered as an accordion-style group header
• Group body contains card-style action buttons

Actions (minimum set):

1) Run campaign
   • Opens Campaign Setup modal
   • If a location context is later required, prompt user to select a location

2) Protect this location
   • Opens Exclusive Operation Period modal (€5 / 30 days)
   • Prompts location selection if none is active

3) Restore access
   • Opens Restore Access modal
   • Displays guidance to use Owner access email / Stripe receipt

4) See example dashboards
   • Opens Example Dashboards modal
   • Displays 3–6 designated example locations

5) Find my location (optional)
   • Focuses search or opens location selector

Rules:
• No analytics data is shown directly in this group.
• All labels and descriptions must be translation-driven.
• Actions must reuse existing modals where available.

--------------------------------------------------------------------
5.4 Individuals group
--------------------------------------------------------------------

Plain language:
The Individuals group provides useful utilities for non-business users
and avoids leaving the root shell empty.

UI contract:
• Group label: “Individuals”
• Rendered as an accordion-style group header
• Group body contains card-style action buttons

Actions (minimum set):

1) How it works?
   • Opens an informational modal explaining NaviGen basics

2) Install / Support
   • Opens install and support guidance (PWA pin, help entry)

3) My Stuff
   • Opens MSM (favorites, purchases, preferences)

4) Promotions
   • Opens Promotions modal

5) Help / Emergency
   • Opens Help modal

Rules:
• No ownership or payment actions appear here.
• All labels and descriptions must be translation-driven.

--------------------------------------------------------------------
5.5 Direct testing steps (Happy path)
--------------------------------------------------------------------

H1 — Root shell renders correctly
1) Open app with no location context
Expected:
• Business Owners group visible
• Individuals group visible
• Both groups collapsed by default
• Popular / Accordion groups hidden if empty

H2 — Business Owners actions
1) Expand Business Owners
2) Click each card
Expected:
• Correct modal opens for each action
• No navigation to Dash occurs

H3 — Individuals actions
1) Expand Individuals
2) Click each card
Expected:
• MSM, Promotions, Help, and other utilities open correctly

--------------------------------------------------------------------
5.6 Failure testing (must be deterministic)
--------------------------------------------------------------------

F1 — Empty geo data
• Simulate no geo results / empty Popular
Expected:
• No empty list UI
• Business Owners / Individuals still shown

F2 — Partial wiring
• Disable one modal temporarily
Expected:
• Action fails gracefully (toast or no-op), no crash

--------------------------------------------------------------------
5.7 Safeguard tests (regression prevention)
--------------------------------------------------------------------

S1 — LPM flows unaffected
• Open an LPM
Expected:
• Business Owners / Individuals groups not injected into LPM context
• Normal LPM UI remains unchanged

S2 — Dash gating unaffected
• Attempt Dash access from root
Expected:
• Dash remains blocked unless ownership + session valid

--------------------------------------------------------------------
5.8 Ship gate (Phase 5 complete)
--------------------------------------------------------------------

Phase 5 is complete when:
• Root shell no longer appears empty or confusing
• Business Owners and Individuals provide clear entry points
• No location-based UI is misused for onboarding
• Existing location and Dash behaviors remain unchanged

--------------------------------------------------------------------
PHASE 6 — SERVICE WORKER & CACHE SAFETY (OWNER PLATFORM CRITICAL)
--------------------------------------------------------------------

Goal (plain language):
Ensure that ownership, access, and analytics visibility are never affected
by stale cached assets, service worker behavior, or delayed updates.

This phase guarantees that:
• Dash access reflects current ownership immediately,
• Owner settings actions are never served from cache,
• Signed-link exchange and session creation are always network-verified.

Scope (Phase 6 only):
• Service Worker routing rules
• Cache policy enforcement
• Update / activation strategy
• Verification that OP-sensitive routes are network-only

Explicit non-goals:
• No changes to ownership logic (Phase 1)
• No changes to owner sessions (Phase 2)
• No changes to Dash gating logic (Phase 3)
• No UI changes (Phases 4–5)

Dependencies:
• Existing Service Worker implementation
• Owner Platform routes and modals already wired

--------------------------------------------------------------------
6.1 Critical invariant (authoritative)
--------------------------------------------------------------------

Plain language:
Owner Platform behavior must always reflect live backend state.

Rules:
• No OP-sensitive route may be served from cache.
• No stale UI may grant access, privacy, or control.
• Network failure must fail closed (no analytics shown).
• Client-side heuristics (e.g., internal LP navigation markers) must not be broken by SW-cached shell reloads.

--------------------------------------------------------------------
6.2 Route classification (authoritative)
--------------------------------------------------------------------

Routes are classified by sensitivity.

Owner Platform–sensitive routes (MUST be network-only):
• /api/*
• /dash/*
• /owner/*
• /owner/exchange
• Any endpoint that returns ownership, session, or analytics state

Safe-to-cache routes (with versioning):
• JS bundles
• CSS
• Icons, images, fonts
• Translation bundles (with version bump)

Rules:
• Network-only means: Service Worker MUST bypass cache entirely.
• No fallback-to-cache is permitted for OP-sensitive routes.

--------------------------------------------------------------------
6.3 Service Worker fetch rules
--------------------------------------------------------------------

Plain language:
The Service Worker must explicitly exclude OP-sensitive routes
from its fetch interception logic.

Tech cookbook:
• In the fetch handler:
  - if request.url matches OP-sensitive route → fetch(request)
  - do NOT cache the response
• Cached responses MUST NOT be consulted for these routes.

Failure handling:
• If network request fails:
  - return an explicit failure response
  - do not return cached data

--------------------------------------------------------------------
6.4 Update & activation strategy
--------------------------------------------------------------------

Plain language:
When a new version is deployed, old Service Workers must not remain active.

Rules:
• Service Worker MUST call skipWaiting() during install.
• Service Worker MUST call clientsClaim() during activate.
• New SW must take control immediately.

Rationale:
• Ownership and access state may change at any time.
• Delayed SW activation risks stale access decisions.

--------------------------------------------------------------------
6.5 Direct testing steps (Happy path)
--------------------------------------------------------------------

H1 — Network-only enforcement
1) Open DevTools → Network
2) Load /dash/<location>
Expected:
• Requests to /api/stats show “from network”, never “from ServiceWorker”

H2 — Signed link exchange
1) Open a valid /owner/exchange link
Expected:
• Network request visible
• Cookie set only after network response

H3 — Owner settings modal actions
1) Click 📈 on LPM (blocked state)
Expected:
• Modal opens
• No cached network responses involved

--------------------------------------------------------------------
6.6 Failure testing (must be deterministic)
--------------------------------------------------------------------

F1 — Offline mode
• Simulate offline in DevTools
Expected:
• Dash does not load analytics
• Owner settings actions fail closed

F2 — Stale Service Worker
• Deploy a new version
• Keep old tab open
Expected:
• New behavior takes effect without reload
• Old SW does not serve Dash or OP routes

F3 — Cache poisoning attempt
• Manually cache /api/stats via DevTools
Expected:
• App still fetches live data
• Cached response ignored

--------------------------------------------------------------------
6.7 Safeguard tests (regression prevention)
--------------------------------------------------------------------

S1 — Non-OP routes unaffected
• Static assets still cached normally
• App loads fast as before

S2 — QR and promo flows unaffected
• QR scans and redeems still work offline/online as before
• No regressions in customer-facing flows

--------------------------------------------------------------------
6.8 Ship gate (Phase 6 complete)
--------------------------------------------------------------------

Phase 6 is complete when:
• OP-sensitive routes are never served from cache
• Ownership and Dash visibility update immediately after deploy
• Offline or stale conditions never leak analytics or access
• Existing caching benefits remain intact for safe assets

--------------------------------------------------------------------
PHASE 7 — FAILURE & ABUSE TESTING (SYSTEM RESILIENCE)
--------------------------------------------------------------------

Goal (plain language):
Ensure that NaviGen behaves deterministically and safely under:
• invalid inputs,
• malicious or careless user actions,
• partial system failures,
• timing edge cases,
• replay and abuse scenarios.

This phase validates that:
• ownership cannot be forged or duplicated,
• analytics never leak,
• UI never grants authority accidentally,
• failures fail closed, not open.

Scope (Phase 7 only):
• Failure scenarios across Phases 1–6
• Abuse attempts by users and operators
• Timing, replay, and race conditions
• Regression verification for unaffected features

Explicit non-goals:
• No new features
• No UX changes
• No performance optimization

Dependencies:
• Phases 1–6 implemented
• Test/staging environment available
• Ability to simulate Stripe webhooks and cookies

--------------------------------------------------------------------
7.1 Payment & webhook abuse tests
--------------------------------------------------------------------

Plain language:
External payment systems retry, reorder, and may be abused.
Ownership must remain correct regardless.

Tests:

A) Webhook replay storm
• Replay the same Stripe webhook event multiple times
Expected:
• ownership:<ULID> extended exactly once
• stripe_processed:<payment_intent.id> exists
• No additional writes occur

B) Webhook out-of-order delivery
• Deliver non-final event before final event (Stripe retry behavior)
Expected:
• Ownership updated only on valid final payment event
• Intermediate events do not create ownership

C) Invalid signature injection
• Send webhook payload with invalid Stripe signature
Expected:
• Request rejected
• No KV writes

D) Missing or malformed metadata
• Omit locationID or ownershipSource
Expected:
• Request rejected
• No ownership record created

--------------------------------------------------------------------
7.2 Ownership timing edge cases
--------------------------------------------------------------------

Plain language:
Ownership is time-based and must behave correctly at boundaries.

Tests:

A) Expiry boundary
• Set exclusiveUntil = now + 1 second
• Access Dash immediately after expiry
Expected:
• Dash blocked deterministically
• No grace period

B) Overlapping extensions
• Purchase ownership before previous period expires
Expected:
• exclusiveUntil moves forward monotonically
• No gaps, no overlaps

C) Delayed webhook
• Simulate webhook delivered after ownership already expired
Expected:
• Extension applies from now, not from old exclusiveUntil

--------------------------------------------------------------------
7.3 Access session abuse tests
--------------------------------------------------------------------

Plain language:
Signed links and cookies must never be usable beyond their intent.

Tests:

A) Link reuse
• Use a valid owner access link twice
Expected:
• First succeeds, second denied

B) Link expiry
• Use link after exp time
Expected:
• Denied, no session created

C) Cookie theft simulation
• Copy op_sess cookie to another browser
Expected:
• Session validity tied to ownership
• Access revoked when ownership expires

D) Orphaned session
• Delete opsess:<sessionId> from KV
• Keep cookie in browser
Expected:
• Session invalid
• Dash blocked

--------------------------------------------------------------------
7.4 UI abuse & misuse tests
--------------------------------------------------------------------

Plain language:
Users may click things in unexpected orders or attempt to bypass flows.

Tests:

A) Repeated 📈 clicks
• Rapidly click 📈 on LPM in blocked state
Expected:
• Single modal instance
• No duplicate requests

B) Modal hopping
• Switch between Run Campaign / Protect / Restore
Expected:
• Correct modal opens each time
• No state bleed between flows

C) Root shell misuse
• Use Business Owners actions without selecting a location
Expected:
• Location selection or guidance shown
• No ownership created without explicit location

--------------------------------------------------------------------
7.5 Example Dashboard abuse tests
--------------------------------------------------------------------

Plain language:
Example Dash is the only bypass to Dash gating and must be tightly scoped.

Tests:

A) Example-only access
• Attempt to access /dash/<non-example> without ownership
Expected:
• Blocked

B) Flag removal
• Remove Example flag from a location
Expected:
• Dash immediately blocked without ownership

C) Example cross-linking
• Navigate from Example Dash to non-example Dash
Expected:
• Blocked

--------------------------------------------------------------------
7.6 Cache & deployment abuse tests
--------------------------------------------------------------------

Plain language:
Caching and deployment must never undermine authority.

Tests:

A) Cached stats injection
• Attempt to force cached /api/stats response
Expected:
• Ignored, live data enforced

B) Stale Service Worker
• Keep old tab open across deploy
Expected:
• New rules applied immediately

C) Offline fallback
• Open Dash offline
Expected:
• No analytics shown
• Clear blocked state

--------------------------------------------------------------------
7.7 Regression verification (must not break existing features)
--------------------------------------------------------------------

Plain language:
OP must not destabilize the core NaviGen product.

Tests:

A) QR Info flow
• Scan Info QR
Expected:
• Stats increment correctly

B) Promo flow
• Redeem promo QR
Expected:
• Armed → Redeem → Confirm still work

C) Non-owner browsing
• Browse LPM without touching 📈
Expected:
• No prompts, no modals

--------------------------------------------------------------------
7.8 Ship gate (Phase 7 complete)
--------------------------------------------------------------------

Phase 7 is complete when:
• All abuse tests fail closed
• No ownership duplication is possible
• No analytics leak is observed
• No UI path grants authority accidentally
• Core non-OP flows behave exactly as before

Only after Phase 7 passes may the Owner Platform
be considered production-ready.

--------------------------------------------------------------------

END OF IMPLEMENTATION PLAN

--------------------------------------------------------------------

# Implementation Plan Checklist

--------------------------------------------------------------------
EPIC 1 — Ownership Authority
--------------------------------------------------------------------
- [ ] Stripe webhook endpoint implemented
- [ ] Signature verification enforced
- [ ] Idempotency by payment_intent.id
- [ ] ownership:<ULID> written correctly

Done when:
• Duplicate webhooks do not change state
• Invalid signatures never write

--------------------------------------------------------------------
EPIC 2 — Owner Access Session
--------------------------------------------------------------------
- [ ] Signed owner link generation
- [ ] /owner/exchange endpoint
- [ ] Single-use enforcement
- [ ] opsess:<sessionId> stored
- [ ] HttpOnly cookie set

Done when:
• Valid link → access granted
• Expired/reused link → denied

--------------------------------------------------------------------
EPIC 3 — Dash Gating
--------------------------------------------------------------------
- [ ] /api/stats gated
- [ ] Dash UI gated
- [ ] Example Location bypass

Done when:
• No unowned analytics visible
• Example Locations accessible

--------------------------------------------------------------------
EPIC 4 — LPM 📈 Owner Settings
--------------------------------------------------------------------
- [ ] Owner settings modal shell
- [ ] Unowned variant implemented
- [ ] Owned+no-session variant implemented
- [ ] 📈 click wiring complete

Done when:
• 📈 never redirects
• Correct modal variant always shown

--------------------------------------------------------------------
EPIC 5 — Root Shell Onboarding
--------------------------------------------------------------------
- [ ] Business Owners group rendered
- [ ] Individuals group rendered
- [ ] Groups collapsed by default
- [ ] BO cards wired
- [ ] Individuals cards wired

Done when:
• Root shell has clear entry points
• No empty Popular shown

--------------------------------------------------------------------
EPIC 6 — Service Worker Safety
--------------------------------------------------------------------
- [ ] Network-only routes enforced
- [ ] Update strategy verified

Done when:
• No cached Dash/API responses observed

--------------------------------------------------------------------
EPIC 7 — Failure & Abuse Testing
--------------------------------------------------------------------
- [ ] Webhook replay tested
- [ ] Signed link misuse tested
- [ ] Ownership expiry tested
- [ ] Example Location bypass tested

Done when:
• All failures handled deterministically
• No data leakage

--------------------------------------------------------------------
END OF IMPLEMENTATION PLAN CHECKLIST
--------------------------------------------------------------------

--------------------------------------------------------------------
END-TO-END WALKTHROUGH — PAYMENT → ACCESS → DASH → EXPIRY
--------------------------------------------------------------------

Purpose:
This walkthrough describes a single, complete lifecycle of ownership,
from the moment a location is public and unowned, through payment,
owner access, normal usage, session loss, and eventual expiry.

It serves as:
• a narrative acceptance test,
• a shared mental model for developers,
• a regression reference when behavior changes.

This section is NON-NORMATIVE and complements the phases above.

--------------------------------------------------------------------
1) Initial state — public, unowned location
--------------------------------------------------------------------

A location exists on NaviGen.

• The Location Profile Modal (LPM) is publicly accessible.
• Anyone can view location details and promotions.
• The 📈 icon is visible.
• Dash analytics are blocked.

System state:
• No ownership:<ULID> record exists.
• No one has authority over analytics, campaigns, or edits.

--------------------------------------------------------------------
2) Payment — ownership is established
--------------------------------------------------------------------

A business operator decides to take control of the location.

They start a paid campaign (e.g., €50 / 30 days).

Stripe Checkout is completed successfully.

Backend behavior:
1) Stripe emits a webhook.
2) API Worker receives POST /api/stripe/webhook.
3) Signature is verified.
4) Required metadata is extracted:
   • locationID
   • ownershipSource (campaign | exclusive)
   • initiationType
5) locationID is resolved to ULID via KV_ALIASES.
6) Idempotency is enforced by payment_intent.id.
7) ownership:<ULID> is written or extended in KV_STATUS.

Resulting ownership record:
• state = owned
• exclusiveUntil = now + duration
• source recorded
• idempotent against retries

No UI changes occur yet.

--------------------------------------------------------------------
3) Owner access is issued (no accounts)
--------------------------------------------------------------------

After payment:

• Stripe sends its receipt email.
• NaviGen sends an Owner access email.

The email contains a signed, single-use link:
  /owner/exchange?tok=...&sig=...

Link properties:
• Valid for 15 minutes from issue.
• Single-use.
• Bound to a specific ULID.

--------------------------------------------------------------------
4) Owner opens access link — session is created
--------------------------------------------------------------------

The owner clicks the link.

Backend behavior:
1) /owner/exchange is called.
2) Signature and expiry are verified.
3) Single-use is enforced.
4) Ownership is verified as active.
5) opsess:<sessionId> is written to KV_STATUS.
6) HttpOnly cookie op_sess=<sessionId> is set.
7) Browser is redirected to /dash/<location>.

Result:
• Owner now has a valid access session.
• No analytics have been exposed without verification.

--------------------------------------------------------------------
5) Normal usage — owned + session
--------------------------------------------------------------------

The owner uses Dash normally.

For each Dash load:
• /api/stats is called.
• API Worker verifies:
  - ownership exists,
  - ownership not expired,
  - op_sess cookie matches opsess record.

Result:
• Full analytics are returned.
• Dash renders normally.

This is the steady-state owned experience.

--------------------------------------------------------------------
6) Returning later — session still valid
--------------------------------------------------------------------

The owner returns on the same device before expiry.

• Opens the LPM.
• Clicks 📈.

Because ownership and session are valid:
• Dash opens immediately.
• No modal, no email, no friction.

--------------------------------------------------------------------
7) Session lost — ownership still active
--------------------------------------------------------------------

The owner loses the session:
• cookies cleared, or
• new device, or
• private browsing.

Ownership is still active, but session is missing.

User action:
• Opens LPM.
• Clicks 📈.

Result:
• Dash does not open.
• “Owner settings” modal opens (restore variant).

Modal content:
• Explains access expired.
• Instructs to use Owner access email / Stripe receipt.
• Offers:
  - Restore access (guidance),
  - See example dashboards.

No payment actions are shown.

--------------------------------------------------------------------
8) Ownership expiry — authority is revoked
--------------------------------------------------------------------

exclusiveUntil passes.

Immediate effects:
• ownership is inactive.
• Dash access is blocked.
• /api/stats returns blocked responses.
• Profile editing is disabled.
• Campaign control is disabled.
• Campaigns may continue serving customers if active.

No data is deleted.
No historical analytics are modified.

--------------------------------------------------------------------
9) Post-expiry behavior
--------------------------------------------------------------------

Former owner clicks 📈:
• “Owner settings” modal opens (unowned variant).
• Options shown:
  - Run campaign,
  - (Optional) Keep visible (deferred),
  - See example dashboards.

Random user clicks 📈:
• Same result.
• No analytics are exposed.

The location has fully reverted to public, unowned state.

--------------------------------------------------------------------
10) Renewal (explicit, optional)
--------------------------------------------------------------------

If control is desired again:

• The user explicitly pays again:
  - €5 / 30 days, or
  - starts a new campaign.

Stripe webhook fires.
Ownership is re-established.
A new access link is issued.
A new session can be created.

There is:
• no automatic renewal,
• no silent deduction,
• no account state to recover.

--------------------------------------------------------------------
End-to-end invariants verified
--------------------------------------------------------------------

• Ownership is created only by payment.
• Ownership is enforced only by backend state.
• Sessions do not grant authority by themselves.
• Dash never leaks analytics.
• Expiry is immediate and deterministic.
• Recovery is explicit and payment-driven.
• No accounts or identities are required.

--------------------------------------------------------------------
END OF END-TO-END WALKTHROUGH
--------------------------------------------------------------------

