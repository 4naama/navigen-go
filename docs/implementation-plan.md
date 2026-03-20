# Implementation Order (Authoritative)

This document defines the implementation sequence for the NaviGen Owner Platform,
ordered by dependency, with explicit happy-path tests, failure tests, and ship gates.

This document is NON-NORMATIVE.
The normative requirements live in `navigen-spec.md`.

--------------------------------------------------------------------
CURRENT PROJECT CONSTRAINT (Authoritative for planning order)
--------------------------------------------------------------------

For the current project, multi-location campaign management operates only on
already-existing locations.

This means:

• Locations may already exist from profiles.json / alias-seeded records.
• Future owner-created locations are explicitly out of scope for the
  multi-location campaign phase below.
• Multi-location campaign management must not depend on the Locations Project
  wizard or publish flow.
• A location may become eligible for multi-location control on a device when it is:
    - already present and owner-proven on that device, or
    - freshly established on that same device through a qualifying purchase.

This document therefore treats:
• multi-location campaign management as a current-project implementation phase, and
• location creation / publishing as a separate later track.

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
• plan:<payment_intent.id> stored in KV_STATUS (priceId + tier + maxPublishedLocations)
• KV_OWNERSHIP and KV_IDEMPOTENCY are reserved for a later refactor

Processing order:
1. Receive Stripe webhook (POST /api/stripe/webhook)
2. Verify Stripe signature
3. Extract required metadata (locationID, campaignPreset, initiationType)
4. Resolve locationID → ULID via KV_ALIASES
5. Enforce idempotency using stripe_processed:<payment_intent.id>
6. Create or extend ownership:<ULID> monotonically for the purchased active Plan window
6a. Persist plan:<payment_intent.id> with expiresAt = ownership:<ULID>.exclusiveUntil (post-extension)
6b. Persist campaignPreset when supplied by Checkout metadata:
    - "visibility"
    - "promotion"
7. Persist idempotency marker
8. Return 2xx to Stripe

Happy-path tests:
• Valid webhook creates ownership record
• Repeat webhook does not extend ownership twice
• plan:<payment_intent.id> is stored correctly (priceId / tier / maxPublishedLocations)
• campaignPreset is stored correctly when supplied

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
• No client-supplied tier/capacity value can alter plan:<payment_intent.id>

--------------------------------------------------------------------
📌 Phase 1 status (locked)
--------------------------------------------------------------------

✅ Stripe webhook endpoint live (API Worker authoritative)

✅ Stripe signature verification enforced

✅ Required ownership metadata validated
    (locationID, campaignPreset, initiationType)

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
On the same device, successful Stripe Checkout mints the owner session immediately.
Later, or on another device, Restore Access uses the Stripe Payment ID (pi_...)
from the receipt, invoice, or payment confirmation email.
From then on, Dash access works on that device until ownership expires.

Scope (Phase 2 only):
• /owner/stripe-exchange endpoint in API Worker
• /owner/restore endpoint in API Worker
• Server-side Checkout Session lookup / reconciliation
• KV-backed owner session record + HttpOnly cookie
• Optional device-bound session registry for Owner Center

Explicit non-goals:
• No Dash gating implementation yet (that is Phase 3)
• No LPM “Owner settings” modal changes (Phase 4)
• No campaign setup UI
• No profile edit API

Storage (Phase 2; uses existing KV_STATUS):
• opsess:<sessionId> stored in KV_STATUS
• devsess:<deviceId>:<ULID> stored in KV_STATUS (optional)
• devsess:<deviceId>:index stored in KV_STATUS (optional)
• Cookie: op_sess=<sessionId> (HttpOnly)

Rationale:
• KV_STATUS already exists and is authoritative
• These keys are access/session artifacts, not stats

--------------------------------------------------------------------
2.1 Inputs required (must exist before Phase 2 works)
--------------------------------------------------------------------

A) API Worker secrets:
• STRIPE_SECRET_KEY
  - used to fetch Checkout Sessions server-side
  - must never appear in client bundles

B) Phase 1 ownership records:
• ownership:<ULID> must exist and contain exclusiveUntil
  - Phase 2 validates ownership is active before setting a session

C) Price mapping:
• Internal Stripe price.id → { tier, maxPublishedLocations } mapping must exist
  - used when reconciling plan:<payment_intent.id>

D) Email / receipt availability:
• Owners may later use the Payment ID (pi_...) from the Stripe receipt, invoice,
  or payment confirmation email for Restore Access.
• No Owner-access action link is required.

--------------------------------------------------------------------
2.2 /owner/stripe-exchange endpoint (API Worker) — post-checkout session minting
--------------------------------------------------------------------

Plain language:
The post-checkout exchange endpoint converts a completed Stripe Checkout Session
into an owner session cookie immediately after payment, enabling the real-time flow:

  Choose plan → Checkout → Pay → Redirect → Campaign Management / Dash opens

Endpoint:
• GET /owner/stripe-exchange?sid=<CHECKOUT_SESSION_ID>&next=<relativePath>

Inputs:
• sid: Stripe Checkout Session id (cs_...)
• next: same-origin relative path (e.g. "/?locationID=<slug>&lp=<slug>")

Validation rules:
• Fetch Checkout Session using STRIPE_SECRET_KEY
• Fetch Checkout Session line items and persist plan:<payment_intent.id> using internal price.id → tier mapping
• Require payment_status="paid" and status="complete"
• Require metadata.locationID
• Resolve locationID → ULID via KV_ALIASES
• Reconcile ownership:<ULID> idempotently if missing/stale, then verify ownership:<ULID>.exclusiveUntil > now and ownership.lastEventId == payment_intent.id
• Persist plan:<payment_intent.id> with expiresAt = ownership:<ULID>.exclusiveUntil (post-reconciliation)

Output:
• Set HttpOnly cookie: op_sess=<id>; Max-Age bounded by exclusiveUntil
• Redirect (302) to:
  - the first incomplete Campaign Funding / Campaign Management step when next carries an in-progress owner flow, or
  - /dash/<ULID> when no pending owner flow exists

Notes:
• success_url MUST keep "{CHECKOUT_SESSION_ID}" literal (not URL-encoded)
• This is the primary same-device access path

Happy-path test H1:
1) Complete Checkout (cs_...)
2) GET /owner/stripe-exchange?sid=<cs_...>&next=/?locationID=<slug>&lp=<slug>
3) Confirm op_sess cookie + /api/stats returns 200

--------------------------------------------------------------------
2.3 /owner/restore endpoint (API Worker) — recovery by PaymentIntent id (pi_*)
--------------------------------------------------------------------

Plain language:
Owners frequently restore access on a new device where only the Stripe receipt,
invoice, or payment confirmation email is available. Those reliably contain
a Payment ID (pi_*).

Endpoint:
• GET /owner/restore?pi=<PAYMENT_INTENT_ID>&next=<relativePath>

Validation rules:
• Lookup Checkout Session by payment_intent=pi_*
• Fetch Checkout Session line items and persist plan:<pi_*> using internal price.id → tier mapping
• Require payment_status="paid" AND status="complete"
• Require metadata.locationID
• Resolve locationID → ULID via KV_ALIASES
• Reconcile ownership:<ULID> idempotently if missing/stale, then verify ownership:<ULID>.exclusiveUntil > now and ownership.lastEventId == pi_*
• Persist plan:<pi_*> with expiresAt = ownership:<ULID>.exclusiveUntil (post-reconciliation)

Output:
• Set HttpOnly cookie: op_sess=<id>; Max-Age bounded by exclusiveUntil
• Redirect (302) to:
  - the first incomplete Campaign Funding / Campaign Management step when next carries an in-progress owner flow, or
  - /dash/<ULID> when no pending owner flow exists

Happy-path test H2:
1) Take Payment ID (pi_*) from Stripe receipt, invoice, or payment confirmation email
2) GET /owner/restore?pi=<pi_*>&next=/dash/<slug-or-ulid>
3) Confirm op_sess cookie + /api/stats returns 200 for the location

--------------------------------------------------------------------
2.3a Device-bound session registry (Owner Center)
--------------------------------------------------------------------

To reduce friction for owners managing multiple locations on one device:

• The system stores a per-device mapping:
  - devsess:<deviceId>:<ULID> = <sessionId>
  - devsess:<deviceId>:index = [<ULID>, ...] (most recent first)

• DeviceId is stored as a non-HttpOnly cookie: ng_dev
• Owner exchange endpoints (stripe-exchange and restore) register sessions to the device

This enables an Owner Center UI to switch locations without repeating Restore Access.

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

Happy test H1 — “Create session from successful Stripe Checkout”
1) Complete a real Checkout Session for a location
2) Open:
   /owner/stripe-exchange?sid=<cs_...>&next=/dash/<slug-or-ulid>
3) Confirm:
   • browser receives op_sess cookie
   • KV_STATUS has opsess:<sessionId>
4) Confirm redirect:
   • lands on Campaign Management / Dash with a clean URL

Happy test H2 — “Create session from Payment ID restore”
1) Ensure a real ownership record exists (Phase 1):
   • ownership:<ULID>.exclusiveUntil is in the future
2) Take the Payment ID (pi_...) from Stripe receipt / invoice / payment email
3) Open:
   /owner/restore?pi=<pi_...>&next=/dash/<slug-or-ulid>
4) Confirm:
   • browser receives op_sess cookie
   • KV_STATUS has opsess:<sessionId>

Happy test H3 — “Session record respects ownership expiry”
1) Create session (H1 or H2)
2) Manually set ownership:<ULID>.exclusiveUntil to a past time (test env only)
3) Validate (via manual request in Phase 3 later):
   • session becomes invalid when ownership is expired

--------------------------------------------------------------------
2.6 Failure testing (must be deterministic)
--------------------------------------------------------------------

F1 — Invalid or unknown Checkout Session id
• Open /owner/stripe-exchange with invalid sid
Expected:
• denied (no cookie, no opsess)

F2 — Invalid or unknown Payment ID
• Open /owner/restore with invalid pi
Expected:
• denied (no cookie, no opsess)

F3 — Unpaid / incomplete checkout
• Lookup resolves, but payment_status != "paid" OR status != "complete"
Expected:
• denied (no session created)

F4 — Ownership expired at exchange / restore time
• Checkout exists but ownership:<ULID>.exclusiveUntil <= now
Expected:
• denied (no session created)

F5 — KV write fails
• Simulate KV failure (test env)
Expected:
• exchange / restore fails closed (no cookie)

--------------------------------------------------------------------
2.7 Safeguard tests (ensure Phase 2 doesn’t break existing system)
--------------------------------------------------------------------

S1 — QR flow unaffected
• Info QR scan works and increments stats/qrlog as before
• Promo redeem flow works as before

S2 — Dash still loads as before (no gating yet)
• Opening /dash/<ULID> should behave exactly as current until Phase 3 introduces gating

S3 — Service worker does not cache /owner/stripe-exchange or /owner/restore
• DevTools “from ServiceWorker” must not appear for these endpoints

--------------------------------------------------------------------
2.8 Ship gate (Phase 2 complete)
--------------------------------------------------------------------

Phase 2 is complete when:
• /owner/stripe-exchange creates a cookie session and KV session record after successful payment
• /owner/restore creates a cookie session and KV session record from a valid Payment ID (pi_...)
• Invalid sid / pi values never create sessions
• Ownership expiry invalidates sessions (by contract, enforced later)
• Existing QR/promo/stats behaviors remain unchanged

--------------------------------------------------------------------
📌 Phase 2 status (locked)
--------------------------------------------------------------------

✅ /owner/stripe-exchange

✅ /owner/restore

✅ Payment ID (pi_...) recovery

✅ Ownership validated

✅ Session cookie hardened

✅ No signed-link dependency remains

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
• No changes to owner session transport or recovery endpoints (Phase 2)
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
  “You already own this location, but your access session is missing on this device.”
• Actions:
  1) Restore access
     - Instruction: use Restore Access with the Payment ID (pi_...) from your Stripe receipt, invoice, or payment confirmation email
     - CTA: opens Restore Access modal
  2) See example dashboards
     - CTA: opens Example Dashboards modal (3–6 cards)

Restrictions:
• No payment actions shown
• No standalone protection / exclusivity action shown

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
     - CTA: opens Campaign Funding / Plan selection for this LPM
     - Notes:
       • the owner later chooses Standard / Multi / Large / Network as applicable
       • the owner later chooses the campaign preset:
         - Visibility only
         - Promotion
  2) See example dashboards
     - CTA: opens Example Dashboards modal (3–6 cards)

Restrictions:
• No restore-access action shown
• No standalone protection / exclusivity action shown

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
• Run campaign and Example Dashboards visible

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
• Discoverability is granted by time-bounded participation, not by existence.
• A location may exist indefinitely, but it is only discoverable inside NaviGen while within an active campaign or courtesy visibility window.
• Ownership expiry affects discoverability, not identity.

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
• Existing flows for Campaign Funding / Campaign Management, Restore Access, MSM, Promotions, Help

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
   • Opens Campaign Funding / Plan selection
   • If a location context is later required, prompt user to select a location

2) Restore access
   • Opens Restore Access modal
   • Displays guidance to use the Payment ID (pi_...) from Stripe receipt / invoice / payment email

3) See example dashboards
   • Opens Example Dashboards modal
   • Displays 3–6 designated example locations

4) Find my location (optional)
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
• Stripe exchange, Restore Access, and session creation are always network-verified.

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
• /owner/stripe-exchange
• /owner/restore
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

H2 — Stripe exchange / Restore Access
1) Open a valid /owner/stripe-exchange or /owner/restore request
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
• Omit locationID or campaignPreset
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
Stripe exchange, Payment ID restore, and cookies must never be usable beyond their intent.

Tests:

A) Invalid Checkout Session id
• Use an invalid or unrelated sid with /owner/stripe-exchange
Expected:
• Denied, no session created

B) Invalid Payment ID
• Use an invalid or unrelated pi with /owner/restore
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
• Switch between Run Campaign / Restore Access / Example Dashboards
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
PHASE 7A — MULTI-LOCATION CAMPAIGNS (CURRENT PROJECT, EXISTING LOCATIONS ONLY)
--------------------------------------------------------------------

Goal (plain language):
Allow a Business Owner with a paid Plan to run one campaign
across one, selected, or all locations already proven on the same device,
without turning portfolio/entity management into a separate user product.

This phase implements the derived portfolio model defined in the spec:
• internal only
• auto-created from the current seed location
• same-device proven control only
• shared parent campaign budget / plan
• child campaign rows per included location
• plan-first owner flow
• owner-selected campaign preset:
    - Visibility only
    - Promotion

Scope (Phase 7A only):
• Plan step in Campaign Funding / Campaign Management
• Current Plan / current capacity visibility in Campaign Management
• Scope values:
    - This location only
    - Selected locations
    - All my locations
• Deterministic tier → scope mapping:
    - Standard → This location only
    - Multi / Large / Network → all three scope values
• Owner-facing flow:
    - Choose plan
    - Choose campaign scope
    - Choose locations
    - Checkout / activate
• Auto-creation of the derived portfolio from the current seed location
• Eligibility source = locations already proven on the same device
• Parent campaign_group record + child campaigns:byUlid rows
• Flat location roster with filters (not grouped sections)
• Include / exclude controls for selected locations
• Capacity-aware auto-inheritance for scope="all" when a newly eligible location is later added
• Immediate notice + inline Campaign Management notice for inherited additions
• Inline upgrade path when current Plan does not allow requested scope or capacity
• Campaign preset:
    - Visibility only
    - Promotion
• Suspend / resume:
    - all included locations
    - selected included locations
    - one included location as a local override

Explicit non-goals:
• No new location-creation wizard
• No remote-join / cross-device portfolio claims
• No entity_data / entity_outlet_map runtime integration in v1
• No account system
• No replacement of per-location campaign execution
• No grouped roster UI
• No separate “Portfolio product” surface
• No standalone protection / exclusivity product

Dependencies:
• Phase 1 ownership writer
• Phase 2 owner session + Restore Access flows
• Phase 3 Dash gating
• Phase 4 / 5 owner-entry surfaces already present
• Existing location inventory (profiles.json / aliases / already-known locations)
• Current campaign KV spine (campaigns:byUlid:<ULID>)

--------------------------------------------------------------------
7A.1 Core implementation model
--------------------------------------------------------------------

Authoritative model:
• location remains the execution unit
• one parent network campaign controls shared budget / shared offer definition
• each included location materializes its own child campaign row
• all child rows share one campaignGroupKey
• campaignPreset is parent-level state and applies uniformly to included child rows
• Network is shown to owners as “10+ locations”, but backend enforcement still uses a fixed numeric maxPublishedLocations from the resolved Plan record

Implications:
• analytics remain attributable per location child row
• billing / redeem accounting remain per location child row
• parent controls network-level state only
• child rows retain local state (including local suspension)
• Visibility only hides Promo QR / cashier / redeem setup across the included set, but does not change rights, duration, or capacity

--------------------------------------------------------------------
7A.2 Campaign Management UI contract
--------------------------------------------------------------------

Rules:
• Plan choice MUST precede scope choice in owner-facing flows.
• If an active qualifying Plan already exists, Campaign Management MAY treat the Plan step as already satisfied, but MUST show the current tier / capacity state prominently.
• Standard plan:
    - Campaign Management exposes only “This location only”
• Multi / Large / Network plan:
    - Campaign Management exposes:
         • This location only
         • Selected locations
         • All my locations

Minimum current-Plan visibility:
• Standard · 1 location
• Multi · up to 3 locations
• Large · up to 10 locations
• Network · 10+ locations

First-time multi-location behavior:
• If the operator first chooses “Selected locations” or “All my locations”:
    - the derived portfolio is auto-created from the current seed location
    - no confirmation modal is shown
    - the UI may show a short informational note only

Locations step:
• shown only for scope = selected or all
• uses one flat roster with filters always available
• seed location starts included by default
• seed location MAY be unchecked in “selected”
• selected scope MUST require at least one included location before activation

Eligibility:
• a location is eligible only if already proven on the same device
• a fresh qualifying purchase on the same device may also add a location
• if no additional eligible locations exist yet:
    - Campaign Management MUST provide an inline “Add another location” path

Preset rules:
• The owner chooses one campaign preset for the active Plan:
    - Visibility only
    - Promotion
• Preset choice does NOT change tier, capacity, scope options, ownership rights, or the 30-day active + 60-day courtesy timeline.
• Visibility only MUST hide Promo QR / cashier / redeem setup in Campaign Management.
• Promotion MUST expose the full Promo QR / redeem path.

User-facing behavior:
• “portfolio” is internal language only
• the user experience is an organic expansion from one location to many
• no separate portfolio-setup product is introduced

--------------------------------------------------------------------
7A.3 Deterministic row updates
--------------------------------------------------------------------

When scope changes after creation, affected child rows MUST be updated
deterministically.

Required behavior:
• newly included location:
    - create / activate child row
• removed location:
    - transition child row to Excluded (or equivalent non-executing state)
    - preserve history and analytics
• unchanged location:
    - keep row intact
• scope = all:
    - future eligible additions auto-join by rule only while current Plan capacity remains available

Historical rows and historical analytics MUST never be deleted.

--------------------------------------------------------------------
7A.4 Inherited additions under “All my locations”
--------------------------------------------------------------------

If scope = all and a new eligible location is later added on the same device:

• it MUST inherit the running network campaign immediately only if the current Plan still has remaining capacity
• the UI MUST show:
    - an immediate notice at add / restore time
    - an inline notice in Campaign Management on next open

If capacity is already exhausted:
• the location becomes eligible on the device, but MUST NOT auto-join the running campaign
• Campaign Management MUST show an inline upgrade path
• no child row may be double-created

This applies only to:
• locations proven on the same device
• locations eligible under the current Plan / portfolio rule set

--------------------------------------------------------------------
7A.5 Upgrade behavior
--------------------------------------------------------------------

Upgrade behavior is owner-facing and mandatory when:
• a Standard owner attempts multi-location scope
• a Multi owner attempts to include a 4th location
• a Large owner attempts to include an 11th location
• an “all” campaign would inherit a newly eligible location beyond current capacity
• Network reaches its internal numeric capacity ceiling

Required behavior:
• the current tier limit MUST be explained in plain language
• the upgrade action MUST reopen the Plan step with the current tier visible
• backend rejections for disallowed scope or capacity overflow MUST map to this upgrade path, not to an opaque error

--------------------------------------------------------------------
7A.6 Suspend / resume model
--------------------------------------------------------------------

Required controls:
• suspend all included locations
• resume all included locations
• suspend selected included locations
• resume selected included locations
• suspend one included location locally
• resume one included location locally

Invariant:
• a local child-row suspension MUST NOT stop the network campaign elsewhere

--------------------------------------------------------------------
7A.7 Storage & authority expectations
--------------------------------------------------------------------

KV / state expectations:
• campaign_group:<campaignGroupKey> stores shared parent state
• campaigns:byUlid:<ULID> stores child rows
• campaign_group:<campaignGroupKey> SHOULD persist:
    - scope
    - campaignPreset
    - included location references
    - shared parent lifecycle state
• no new public identity layer is introduced
• no entity runtime authority table is required in v1

Authority:
• API Worker remains the sole writer for campaign authority state
• client UI never computes inclusion truth on its own
• same-device proven-control requirement is enforced server-side
• tier / capacity is derived only from the resolved Plan record

--------------------------------------------------------------------
7A.8 Happy-path tests
--------------------------------------------------------------------

H1 — Plan step and current-Plan visibility
1) Open Campaign Management
Expected:
• current Plan / capacity is visible when a Plan already exists
• otherwise the flow begins with Choose plan

H2 — Standard plan gating
1) Open Campaign Management on Standard plan
Expected:
• only “This location only” visible

H3 — First multi-location selection
1) Open Campaign Management on qualifying plan
2) Choose “Selected locations”
Expected:
• derived portfolio auto-created from seed location
• no confirmation modal
• flat roster appears

H4 — Seed location uncheckable
1) In selected scope, uncheck the seed location
Expected:
• allowed
• activation still requires at least one included location

H5 — Visibility only preset
1) Choose Visibility only for an active Plan
Expected:
• Promo QR / cashier / redeem setup hidden
• all other paid rights unchanged

H6 — Selected subset activation
1) Check a subset of eligible locations
2) Activate campaign
Expected:
• parent campaign group created
• child rows created only for checked locations

H7 — All-locations activation
1) Choose “All my locations”
2) Activate campaign
Expected:
• parent created
• child rows created for all currently eligible locations within current Plan capacity

H8 — Inherited addition within capacity
1) Running campaign exists with scope = all
2) Add a new eligible location on the same device (restore or fresh qualifying purchase)
Expected:
• location joins immediately
• immediate notice shown
• inline CM notice shown later

H9 — Inherited addition over capacity
1) Running campaign exists with scope = all and no remaining capacity
2) Add a new eligible location on the same device
Expected:
• location does not auto-join
• inline upgrade path shown
• no duplicate child row created

H10 — Subset suspension
1) Active multi-location campaign exists
2) Suspend selected included locations
Expected:
• only selected child rows become non-executing
• others remain active

H11 — Local override
1) Suspend one included location only
Expected:
• that child row stops issuing / redeeming
• network campaign remains active elsewhere

--------------------------------------------------------------------
7A.9 Failure & safeguard tests
--------------------------------------------------------------------

F1 — Standard plan submits selected/all
Expected:
• rejected server-side
• mapped to upgrade path
• no parent or child writes

F2 — No eligible extra locations
Expected:
• Locations step still opens cleanly
• inline “Add another location” guidance shown
• no crash / dead-end

F3 — Attempt to include a location not proven on this device
Expected:
• server rejects inclusion
• no child row created

F4 — Selected scope with zero checked locations
Expected:
• activation blocked
• validation shown
• no writes

F5 — Duplicate inherited addition
Expected:
• child row not double-created
• notice may be deduped or shown once
• analytics / billing not duplicated

F6 — Capacity overflow
Expected:
• rejected server-side
• upgrade path shown
• no over-cap child row written

F7 — Scope edit while campaign not Active/Paused
Expected:
• rejected
• no deterministic row update runs

Safeguards:
S1 — Single-location campaign behavior unchanged
S2 — Promo QR / redeem behavior unchanged in Promotion preset
S3 — Dash gating unchanged
S4 — Historical analytics preserved when locations are excluded
S5 — No grouped-roster UI introduced
S6 — No dependency on the future Locations Project publish flow

--------------------------------------------------------------------
7A.10 Ship gate (Phase 7A complete)
--------------------------------------------------------------------

Phase 7A is complete when:
• Choose plan → Choose campaign scope → Choose locations → Checkout / activate is visible in owner flows
• current Plan / capacity visibility is present in Campaign Management
• Multi-location scope appears only for qualifying plans
• “Selected locations” and “All my locations” work only on same-device proven locations
• Seed location can be unchecked in selected scope
• Parent + child campaign model is written deterministically
• scope = all auto-inherits newly eligible same-device additions only while capacity remains
• both notices (immediate + inline) are present
• inline upgrade path appears for scope / capacity overflow
• Visibility only hides promo setup without changing paid rights
• suspend/resume works for all, selected, and local override
• single-location flows remain unchanged
• no location-creation dependency exists

--------------------------------------------------------------------
PHASE 8 — LOCATIONS PROJECT (DRAFT + PUBLISH + DO INDEX)
--------------------------------------------------------------------

Goal (plain language):
Enable Business Owners to create and publish Location Profiles without JSON export tooling,
using KV-backed canonical records + published overrides, with DO-backed indexing.

Scope (Phase 8 only):
• /api/location/draft endpoint (draft creation + updates)
• /api/location/publish endpoint (publish promotion to override:<ULID>)
• PlanAllocDO capacity enforcement (maxPublishedLocations)
• DO index upsert wiring (SearchShardDO + ContextShardDO)
• Read-path compatibility: KV-first, fallback to profiles.json where required

Explicit non-goals:
• No UI wizard implementation (UI comes after backend contracts are proven)
• No migration removal of profiles.json yet
• No geocoding/address verification services
• No geo-fencing of redeems
• No automatic cross-location campaign propagation

Dependencies:
• Phase 1 ownership:<ULID> writer exists
• Phase 2 opsess cookie + session record exists
• Phase 6 SW network-only rules exist for /api/* and /owner/*
• Spec sections: 8.3.5, 92.3.2–92.3.4, 13.12, Appendix H, Appendix G

Storage (Phase 8):
KV_ALIASES:
• alias:<slug> → { locationID: <ULID> }

KV_STATUS:
• profile_base:<ULID>
• override:<ULID>
• override_log:<ULID>:<timestamp>
• override_draft:<ULID>:<actorKey>
• plan_alloc:<payment_intent.id> → { ulids: [<ULID>, ...] }

Durable Objects (DO):
• search:<countryCode>:<bucket>      (SearchShardDO)
• ctx:<contextKey>                  (ContextShardDO)
• planalloc:<payment_intent.id>     (PlanAllocDO — serialized publish capacity enforcement)

--------------------------------------------------------------------
8.1 /api/location/draft (Draft Save API)
--------------------------------------------------------------------

Endpoint:
• POST /api/location/draft

Purpose:
• Create/update non-authoritative drafts
• Allow geo edits pre-publish (coordinates mutable during draft)
• Do not mint final slug during draft phase (Appendix H)

Auth:
• None (draft has no authority effect)

Behavior:
A) locationID provided:
  1) resolve slug → ULID via alias:<slug>
  2) write override_draft:<ULID>:<actorKey>
  3) return { ok:true, locationID:<slug> }

B) locationID absent (new draft shell):
  1) mint ULID
  2) store draft payload temporarily without final slug
  3) return { ok:true, draftULID:<ULID>, draftSessionId:<string> }

Critical invariant:
• Draft creation MUST NOT create alias:<slug> unless slug is minted at publish time.
• Draft writes MUST NOT trigger DO updates.

Happy-path tests:
H1: draft update with existing slug:
• POST draft with locationID
Expected:
• override_draft written
• no DO messages
• no alias changes

H2: new draft shell without slug:
• POST draft without locationID
Expected:
• draft record created
• no alias written
• no DO messages
• response contains draft reference

H3 — draftSessionId stability:
• First POST /api/location/draft returns draftSessionId.
• Subsequent POSTs using the same draftSessionId overwrite only that actor’s draft key.
• A different draftSessionId produces a separate override_draft record (no collisions).

Failure & safeguard tests:
F1: malformed JSON → 400, no writes
F2: invalid coordinate range → 400, no writes
F3: invalid slug → 404/400, no writes
S1: existing promo/dash flows unaffected

Ship gate for /api/location/draft:
• Draft writes never create public visibility
• Draft writes never alter aliases or DO indexes
• Draft writes accept geo changes pre-publish

--------------------------------------------------------------------
8.2 /api/location/publish (Publish API)
--------------------------------------------------------------------

Endpoint:
• POST /api/location/publish

Purpose:
• Mint final slug (Appendix H)
• Create alias mapping
• Promote draft to published override (override:<ULID>)
• Enforce publish capacity via plan_alloc
• Trigger DO index upsert

Auth:
• require valid Operator Session (op_sess → opsess:<id>)
• require active ownership window (ownership:<ULID>.exclusiveUntil > now)

Publish steps (authoritative):
1) Verify session:
   • requireOwnerSession() returns ULID
2) Verify ownership:
   • ownership:<ULID>.exclusiveUntil > now
3) Verify Plan capacity source (deterministic):
   • payment_intent.id is the Plan allocation key (ownership.lastEventId)
   • Read plan:<payment_intent.id> from KV_STATUS.
   • Require now < plan.expiresAt AND plan.expiresAt == ownership.exclusiveUntil (invariant).
   • Extract { priceId, tier, maxPublishedLocations } from the plan record.
   • Publish MUST NOT call Stripe.
   • Reserve allocation atomically via PlanAllocDO(payment_intent.id) before any publish writes.
   • KV plan_alloc:<payment_intent.id> may be updated as a best-effort mirror after reservation.
4) Capacity enforcement (authoritative):
   • Call PlanAllocDO to reserve ULID under payment_intent.id with maxPublishedLocations.
   • If DO rejects (capacity exceeded) → 403 and abort publish with no writes.
   • If DO accepts → proceed with publish writes.
5) Validate publish rules:
   • ≥ 3 images
   • description ≥ 200 chars
   • at least one website OR social link
   • social fields domain validated
6) Slug stamping (Appendix H):
   • normalize coordinates to 6 decimals
   • compute slug per Appendix G
   • enforce collision handling (append -2,-3,… if needed)
   • write alias:<slug> → { locationID:<ULID> }
   • set profile_base:<ULID>.locationID = slug
7) Promote draft:
   • write override:<ULID>
   • write override_log:<ULID>:<ts> with payment_intent.id + initiationType
7a) Commit point (authoritative):
   • Once override:<ULID> and override_log:<ULID>:<ts> are written successfully,
     publish is considered committed.
   • Subsequent failures (including DO upsert failure) MUST NOT rollback KV writes.
8) DO upsert:
   • compute tokens + contexts
   • send IndexUpsert to SearchShardDO and ContextShardDO shards

Optional campaign join step (no automatic propagation):
If owner chooses to join existing campaigns at publish time:
• UI will explicitly request this
• backend may duplicate campaign rows for this ULID only when explicitly requested
• no campaignScope="all" dynamic inheritance is permitted

Happy-path tests:
H3: publish succeeds:
• With valid op_sess, active ownership, valid draft
Expected:
• alias created
• profile_base set
• override written
• override_log written
• plan_alloc updated
• DO upsert sent

H4: republish same ULID under same plan:
Expected:
• plan_alloc not double-counted
• override updated
• DO upsert sent if indexed fields changed

Failure & safeguard tests:
F4: no session → 401, no writes
F5: ownership expired → 403, no writes
F6: capacity exceeded → 403, no writes to override/log/DO
F7: publish validation fails → 403, no writes to override/log/DO
F8: slug collision → suffix increments; alias points to correct ULID
F9 — Concurrent publish race (capacity = 1):
• With maxPublishedLocations = N and allocated = N−1,
  issue two publish requests in parallel for two different ULIDs.
Expected:
• Exactly one request returns 200.
• The other returns 403 (capacity exceeded).
• No “lost allocation” is possible.

S2: Campaigns KV untouched unless explicit join is requested
S3: No geo edits allowed post-publish via /api/profile/update whitelist
S4 — Tier source integrity:
• maxPublishedLocations is derived only from plan:<payment_intent.id> (priceId resolved at reconciliation time via internal mapping).
• Publish MUST NOT accept tier/maxPublishedLocations from client input or Stripe metadata.
S5 — Plan/Ownership expiry invariant:
• plan:<payment_intent.id>.expiresAt MUST equal ownership:<ULID>.exclusiveUntil for the same payment event (ownership.lastEventId).
• Publish MUST reject (403) if the invariant is violated, even if plan_alloc capacity is available.

Ship gate for /api/location/publish:
• Capacity enforcement cannot be bypassed
• Slug stamping occurs only at publish time
• Drafts never become visible without publish
• DO index always reflects published state only

--------------------------------------------------------------------
8.3 Read-path integration (KV-first with fallback)
--------------------------------------------------------------------

Goal:
Begin migration without breaking existing client contracts.

Changes:
• /api/data/profile and /api/data/item must return:
  effectiveProfile = deepMerge(profile_base, override)
  when profile_base exists for the ULID.
• If profile_base is missing:
  fallback to profiles.json read path.

Happy-path tests:
H5: KV-first:
• With profile_base present
Expected:
• merged profile returned
• contract remains profiles.json schema

H6: fallback:
• Without profile_base present
Expected:
• profiles.json record returned as today

Safeguards:
S4: Never cache merged profile responses via Service Worker
S5 — /api/status entitlement shape:
• activeCampaignKeys MUST always be returned as an array (possibly empty).
• activeCampaignKey, if present, must equal activeCampaignKeys[0] or "".
• No publish or draft operation may alter entitlement shape.

Ship gate for read-path:
• Zero regressions in LPM rendering
• Zero schema drift in /api/data/profile payloads

--------------------------------------------------------------------
8.4 DO index implementation (SearchShardDO + ContextShardDO)
--------------------------------------------------------------------

Goal:
Enable scalable SYB search and context lists without dataset scans.

Implementation:
• SearchShardDO:
  - store slug:<slug> → ULID
  - store tok:<token> postings lists
• ContextShardDO:
  - store ulids list per contextKey

Update source:
• Only publish and KV base changes trigger DO updates.
• Draft updates never trigger DO updates.

Happy-path tests:
H7: after publish, location appears in:
• search shard token results
• context shard results
within eventual consistency tolerances

Failure tests:
F9: DO update fails:
• override:<ULID> and override_log:<ULID>:<ts> remain committed.
• publish returns 200 OK (authoritative commit already occurred).
• DO retry is best-effort and asynchronous.
• No rollback of slug, alias, or override state is permitted.

Ship gate for DO index:
• Search/list can be served without scanning profiles.json
• Drafts never appear in index

--------------------------------------------------------------------
📌 Phase 8 status (locked)
--------------------------------------------------------------------

Done when:
✅ /api/location/draft implemented and verified
✅ /api/location/publish implemented and verified
✅ plan_alloc enforced deterministically
✅ DO upsert works with shard naming contract
✅ KV-first read path works with fallback
✅ No regressions in QR/promo/dash flows

--------------------------------------------------------------------
8.5 Ship gate (Phase 8 complete — Authoritative Invariants)
--------------------------------------------------------------------

Phase 8 is complete only when ALL of the following invariants are verified:

Identity & Slug Integrity
• Slug is minted only at publish time.
• Slug never changes after publish.
• alias:<slug> always resolves to the correct ULID.
• Collision handling never overwrites existing alias mappings.

Draft Safety
• Draft writes never create alias entries.
• Draft writes never trigger DO index updates.
• Draft state is never returned by /api/data/profile.

Publish Enforcement
• Publish requires:
    - valid operator session
    - active ownership
    - active Plan
    - available publish capacity
• Capacity enforcement via PlanAllocDO(payment_intent.id) cannot be bypassed.
• Re-publish does not double-count ULID in plan_alloc.

Index Integrity
• Only published overrides are indexed.
• Draft state never appears in search or context lists.
• Discoverability transitions remove items from DO index correctly.

Read-Path Safety
• KV-first read returns deepMerge(profile_base, override).
• Fallback to profiles.json occurs only when profile_base is absent.
• No response schema changes in /api/data/profile or /api/data/item.

System Regression Safety
• QR flow unaffected.
• Promo redeem unaffected.
• Dash gating unaffected.
• Ownership expiry behavior unchanged.

Migration Safety
• profiles.json and KV authority never conflict for the same ULID.
• profile_base entries do not duplicate legacy entries.
• No data loss occurs during fallback reads.

Only when ALL invariants pass may Phase 8 be considered production-ready.

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
- [ ] /owner/stripe-exchange endpoint
- [ ] /owner/restore endpoint
- [ ] opsess:<sessionId> stored
- [ ] HttpOnly cookie set
- [ ] Payment ID (pi_...) recovery verified

Done when:
• Valid Stripe exchange → access granted
• Valid Payment ID restore → access granted
• Invalid sid / pi → denied

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
- [ ] Stripe exchange / Payment ID restore misuse tested
- [ ] Ownership expiry tested
- [ ] Example Location bypass tested

Done when:
• All failures handled deterministically
• No data leakage

--------------------------------------------------------------------
END OF IMPLEMENTATION PLAN CHECKLIST
--------------------------------------------------------------------

--------------------------------------------------------------------
EPIC 7A — Multi-Location Campaigns (Current Project)
--------------------------------------------------------------------
- [ ] Plan step implemented
- [ ] Current Plan / capacity visibility implemented
- [ ] Plan-gated scope step implemented
- [ ] Derived portfolio auto-created from seed location
- [ ] Same-device proven-control eligibility enforced
- [ ] Parent campaign_group storage implemented
- [ ] Child row materialization implemented
- [ ] Flat roster with filters implemented
- [ ] Selected include / exclude implemented
- [ ] Capacity-aware “All my locations” inheritance implemented
- [ ] Immediate inherited-addition notice implemented
- [ ] Inline Campaign Management inherited-addition notice implemented
- [ ] Inline upgrade path implemented
- [ ] Visibility only / Promotion preset implemented
- [ ] Suspend all / selected / local override implemented
- [ ] Deterministic scope-change row updates verified

Done when:
• Multi-location campaigns work against already-existing locations only
• No dependency on location creation exists
• Single-location campaign flows remain unchanged
• Ship gate 7A passes

--------------------------------------------------------------------
END OF IMPLEMENTATION PLAN CHECKLIST
--------------------------------------------------------------------

Purpose:
This walkthrough describes a single, complete lifecycle of ownership,
from the moment a location is public and unowned, through payment,
owner access, normal usage, session loss, courtesy visibility, and renewal.

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
2) Payment — a paid Plan is purchased
--------------------------------------------------------------------

A business operator decides to take control of the location.

They start a paid Plan purchase.
As part of Campaign Funding / Campaign Management, they choose:
• Standard / Multi / Large / Network
• Visibility only / Promotion

Stripe Checkout is completed successfully.

Backend behavior:
1) Stripe emits a webhook.
2) API Worker receives POST /api/stripe/webhook.
3) Signature is verified.
4) Required metadata is extracted:
   • locationID
   • campaignPreset
   • initiationType
5) locationID is resolved to ULID via KV_ALIASES.
6) Idempotency is enforced by payment_intent.id.
7) ownership:<ULID> is written or extended in KV_STATUS.
8) plan:<payment_intent.id> is persisted.

Resulting ownership record:
• state = owned
• exclusiveUntil = now + active Plan duration
• plan stored
• idempotent against retries

No analytics are exposed yet.

--------------------------------------------------------------------
3) Same-device owner access — session is created immediately
--------------------------------------------------------------------

After payment:

• the browser is redirected through /owner/stripe-exchange
• API Worker verifies the completed Checkout Session
• opsess:<sessionId> is written to KV_STATUS
• HttpOnly cookie op_sess=<sessionId> is set
• browser is redirected to:
  - the first incomplete Campaign Funding / Campaign Management step, or
  - /dash/<location> if no pending owner flow exists

Result:
• Owner now has a valid access session on this device.
• No analytics have been exposed without verification.

--------------------------------------------------------------------
4) Later or cross-device recovery — Payment ID restore
--------------------------------------------------------------------

If the owner later changes device, clears cookies, or loses the session:

• they use Restore Access
• they provide the Payment ID (pi_...) from the Stripe receipt, invoice,
  or payment confirmation email

Backend behavior:
1) /owner/restore is called with pi_...
2) API Worker looks up the associated Checkout Session
3) Payment status and completion are verified
4) ownership and plan are reconciled idempotently if needed
5) opsess:<sessionId> is written
6) HttpOnly cookie op_sess=<sessionId> is set
7) browser is redirected back into the app with a clean URL

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
6) Session lost — ownership still active
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
• Explains access is missing on this device.
• Instructs to use Restore Access with the Payment ID (pi_...) from Stripe receipt / invoice / payment email.
• Offers:
  - Restore access
  - See example dashboards

No payment actions are shown.

--------------------------------------------------------------------
7) Active Plan window ends — courtesy visibility begins
--------------------------------------------------------------------

exclusiveUntil passes.

Immediate effects:
• ownership is inactive
• Dash access is blocked
• /api/stats returns blocked responses
• Profile editing is disabled
• Campaign control is disabled
• Courtesy visibility begins automatically

For the next 60 days:
• the location remains discoverable inside NaviGen
• preferential visibility is gone
• owner analytics access remains blocked

No data is deleted.
No historical analytics are modified.

--------------------------------------------------------------------
8) Post-expiry behavior
--------------------------------------------------------------------

Former owner clicks 📈:
• “Owner settings” modal opens (unowned variant).
• Options shown:
  - Run campaign
  - See example dashboards

Random user clicks 📈:
• Same result.
• No analytics are exposed.

The location is no longer owned.
It may still remain discoverable during the courtesy window, then becomes inactive.

--------------------------------------------------------------------
9) Renewal (explicit, optional)
--------------------------------------------------------------------

If control is desired again:

• the user explicitly buys a new paid Plan

Stripe webhook fires.
Ownership is re-established.
A new session can be created through /owner/stripe-exchange or /owner/restore.

There is:
• no automatic renewal,
• no €5 hold / extension product,
• no signed owner-access link,
• no account state to recover.

--------------------------------------------------------------------
End-to-end invariants verified
--------------------------------------------------------------------

• Ownership is created only by payment.
• Ownership is enforced only by backend state.
• Sessions do not grant authority by themselves.
• Dash never leaks analytics.
• Expiry is immediate and deterministic.
• Courtesy visibility does not extend ownership.
• Recovery is explicit and payment-driven.
• No accounts or identities are required.
--------------------------------------------------------------------

