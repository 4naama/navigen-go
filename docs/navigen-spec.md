NaviGen Platform – Complete Specification
(App, Workers, Dash, QR System, Campaigns, Billing, MSM/LPM, Translations, CSS, UX Patterns)

--------------------------------------------------------------------

0. STRATEGIC & QUALITY FOUNDATIONS

0.A Purpose

This section defines the strategic, architectural, and quality principles that
guide NaviGen’s design. These principles express what makes the platform
reliable, secure, scalable, and operationally superior.

The subsections below represent durable commitments that apply across all
other sections (1–13 and 90.x).

--------------------------------------------------------------------

0.B Zero-Trust Client, Full-Trust Server

NaviGen assumes the client cannot be trusted:
  • All validation occurs in API Worker
  • No business logic is evaluated on devices
  • No redeem logic lives on the client
  • Billing and compliance are immune to client manipulation

This ensures operational correctness under all conditions.

--------------------------------------------------------------------

0.C Single-Use Token Economy

Promotions depend on backend-issued, one-time redeem tokens:
  • Unique per request
  • Verified only by Workers
  • Consumed exactly once
  • Immutable after consumption

This creates a cryptographically robust promotion flow without accounts.

--------------------------------------------------------------------

0.D Canonical Auditable Event Chain

Promo QR flow follows the canonical chain:

ARMED → SCAN → REDEEM → CONFIRM (cashier / customer)

Where:

- ARMED denotes that a promotion is activated for a visitor, but the promo QR
  has not yet been revealed.
- SCAN denotes the physical scanning of the promo QR by a cashier.
  This is a promo-specific scan and is distinct from any business Info QR scan.
- REDEEM denotes the logical processing result of the promotion following the
  physical promo QR scan (successful redemption or invalid attempt).
- CONFIRM denotes backward confirmation signals emitted by cashier and/or customer
  after redemption.

This chain is deterministic, logged, and auditable.
Note: Although the signal name SCAN is shared, the canonical ARMED → SCAN → REDEEM
chain refers specifically to the promo (cashier) flow, not to Info QR navigation scans.

--------------------------------------------------------------------

0.E Anti-Circumvention by Architecture

Merchants cannot:
  • give discounts without scanning
  • synthesize redeem events
  • reuse or replay promo QR codes
  • manipulate compliance or ratios
  • bypass confirmation modals

Security emerges from architecture, not policy.

--------------------------------------------------------------------

0.F Merchant-Safe Analytics

Merchant-visible surfaces never expose:
  • compliance ratios
  • diagnostic metrics
  • QA internals
  • sensitive patterns

Dashboard Campaigns view is **counts-only**, ensuring safe interpretation.
Merchant-facing dashboards must present factual counts only.
Any ratios, percentages, or interpretive performance indicators are strictly non-merchant
surfaces and are used solely for QA, compliance, and internal monitoring.

--------------------------------------------------------------------

0.G Internal QA System for Operational Health

QA flags illuminate hidden risks:
  • low scan discipline
  • elevated invalid attempts
  • low cashier coverage
  • low customer coverage
  • window-shift (>100%) scenarios

QA is strictly internal (90.x), never merchant-facing.

--------------------------------------------------------------------

0.H PWA as a Platform Strength

NaviGen leverages an advanced PWA lifecycle:
  • install → support transformation (📌 → 👋)
  • standalone performance & UX
  • offline continuity for browsing & MSM
  • identical behavior across devices

This increases engagement and reliability without requiring native apps.

--------------------------------------------------------------------

0.I Global, Robust, Modular UI Design

UI is compartmentalized into modules:
  • LPM
  • MSM
  • Promo flow modals
  • Search UI
  • Donation/Install flows
  • Navigation components

Modules are independent, testable, translation-driven, and PWA-compatible.

--------------------------------------------------------------------

0.J Translation-First Philosophy

All text is:
  • key-based (t(key))
  • grammar-safe
  • locale-aware (plural rules, word order)
  • never concatenated at runtime

This enables international expansion with minimal friction.

--------------------------------------------------------------------

0.K Backend-Generated Analytics with Human Narrative

All analytics rely on Worker-produced datasets:
  • stats
  • qrlog
  • confirmation signals
  • QA flags

Dash transforms data into narrative insights using translation templates.

--------------------------------------------------------------------

0.L Privacy by Design

NaviGen is privacy-first by design.

NaviGen storage (KV, datasets, logs):
  • does not store PII (no names, emails, phone numbers, billing addresses)
  • does not track users
  • does not personalize analytics
  • uses anonymous visitor signals only for aggregate insight

Owner Platform clarification:
  • Stripe is the system of record for billing identity (email, billing details, tax/VAT data).
  • NaviGen may transiently process Stripe-provided email solely to deliver owner reminder or recovery emails that reference Payment ID (pi_...).
  • NaviGen MUST NOT persist Stripe email or billing identity fields into KV/logs/datasets.

Privacy emerges from architectural minimalism, not patchwork compliance.

--------------------------------------------------------------------

0.M Operational Stability & Performance

NaviGen guarantees:
  • safe, minimal redirects
  • constant-time stats updates
  • append-only event logs
  • CDN-backed asset distribution
  • PWA caching for speed & resilience
  • zero client-side branching logic

This provides performance even on low-end devices and unstable networks.

--------------------------------------------------------------------

0.N Extensibility Without Instability (90.x Framework)

The 90.x extension namespace isolates:
  • QA dashboards
  • Monitoring & alerting
  • Operational scoring
  • Location prioritization
  • Onboarding tools

Extensions evolve without touching the 1–13 spine.

--------------------------------------------------------------------

0.O Strategic Positioning

NaviGen is designed to deliver:

  • secure, tamper-proof promotions  
  • trustworthy analytics  
  • merchant-safe transparency  
  • seamless offline-first UX  
  • modern PWA engagement  
  • operational intelligence through QA  
  • scalable international deployment  

“Our architecture prevents misuse while delivering superior, frictionless user experiences.”

--------------------------------------------------------------------

0.P Quality Guarantees

NaviGen provides a set of explicit, enforceable quality guarantees that ensure
the platform behaves predictably, safely, and consistently across all devices,
locations, and promotional environments.

0.P.1 Functional Guarantees
  • Every redeem event is validated exclusively by backend token logic.
  • A token can be consumed exactly once; reuse always produces INVALID.
  • Promo flow cannot bypass ARMED → SCAN → REDEEM → CONFIRM steps.
  • Dashboard never exposes merchant-sensitive ratios or compliance values.
  • PWA and browser modes produce identical promotional outcomes.

0.P.2 Reliability Guarantees
  • Stats and qrlog writes are append-only and cannot corrupt prior data.
  • Worker logic is stateless per request; no session memory is required.
  • Promo QR display is guaranteed even with intermittent connectivity.
  • Dash remains functional under partial-data conditions using safe fallbacks.
  • All modal interactions remain available even in offline PWA mode.

0.P.3 Security Guarantees
  • No business logic is evaluated on the client; all critical flows run server-side.
  • QR codes contain no sensitive or inferable computation.
  • Identity resolution (slug → ULID) prevents link breakage and tampering.
  • No personal data (PII) is collected, stored, or inferred.
  • Confirmation metrics cannot be forged client-side.

0.P.4 Consistency Guarantees
  • All UI text is translation-keyed; no runtime string concatenation.
  • All analytics narratives derive from the same server-produced dataset.
  • All merchant-facing views respect the count-only rule.
  • QA flags use deterministic thresholds consistently across locations.
  • PWA lifecycle (📌 → 👋) behaves uniformly across supported browsers.

0.P.5 Performance Guarantees
  • Promo QR issuance completes within minimal latency via KV-backed resolution.
  • Redirect flows (/out/qr-*) are optimized to a single-hop model.
  • Stats aggregation uses constant-time KV scans for daily buckets.
  • PWA caching reduces app shell loading time dramatically on repeat visits.
  • Dash renders large datasets efficiently using client-side incremental computation.

0.P.6 Operational Guarantees
  • Updates to datasets (profiles.json, finance.json, contexts.json)
    propagate without downtime.
  • QA auto-tagging runs automatically during each stats request, requiring no cron.
  • Internal systems (90.x) remain isolated from merchant-facing UX.
  • Test Mode provides complete simulation fidelity without polluting production.
  
0.Q Quality KPIs & SLAs

This section defines the measurable performance and reliability characteristics
NaviGen commits to internally. These KPIs and SLAs reflect architectural design
choices and set quality expectations for engineering, operations, and partners.

--------------------------------------------------------------------

0.Q.1 Platform Availability SLA

The core platform (Workers + dataset layer + QR routing) must uphold:

  • 99.95% monthly uptime for:
       - Pages Worker routing
       - API Worker business logic
       - Static asset delivery
  • 99.99% uptime for:
       - QR redirect endpoints (/out/qr-scan, /out/qr-redeem)

Downtime events include only server-side faults; client offline mode does not
count against SLA.

--------------------------------------------------------------------

0.Q.2 Redeem Flow Performance KPIs

The redeem system is time-sensitive and must meet the following thresholds:

  • Promo QR issuance (GET /api/promo-qr):
       P95 ≤ 150ms, P99 ≤ 300ms
  • QR Redeem redirect (Pages Worker → API Worker):
       P95 ≤ 80ms, P99 ≤ 150ms
  • Token consumption (redeem:<token> status update):
       ≤ 30ms KV write latency
  • Customer polling loop (redeem-status):
       P95 ≤ 100ms per poll

Any significant deviation is treated as a system alert.

--------------------------------------------------------------------

0.Q.3 Data Integrity KPIs

NaviGen guarantees:

  • 0% tolerance for token double-consumption
  • 0% tolerance for REDEEM/INVALID misclassification
  • 100% deterministic ARMED → REDEEM → CONFIRM sequence
  • 100% append-only event logs
  • 100% consistency between stats bucket and qrlog

Nightly audits validate:
  • token immutability
  • stats/key alignment
  • counters vs. logs reconciliation

--------------------------------------------------------------------

0.Q.4 Analytics Accuracy KPIs

For Dash and internal QA systems:

  • Counts consistency (stats vs. qrlog):
       ≥ 99.995% match rate
  • Narrative completeness:
       100% of Analytics blocks render in presence of partial data
  • QA diagnostic accuracy:
       100% deterministic thresholding across locations
  • Merchant-facing Campaigns view:
       0% ratios shown (count-only guarantee)
  • Translation availability:
       100% key coverage in base (EN) bundle

--------------------------------------------------------------------

0.Q.5 PWA User Experience KPIs

The PWA shell must achieve:

  • Cold launch time:
       P75 ≤ 1.5s, P95 ≤ 2.5s (cached)
  • Post-install consistency:
       100% deterministic 📌 → 👋 transformation
  • Offline safety:
       LPM, MSM, and navigation available within cached constraints
  • Deep-link reliability:
       lp=<id> always resolves in both browser and standalone modes

--------------------------------------------------------------------

0.Q.6 UI Responsiveness KPIs

Modal and UI transitions must satisfy:

  • Modal open/close:
       ≤ 250ms perceived latency
  • LPM open from list:
       P95 ≤ 300ms after lp resolution
  • Search UI:
       ≤ 16ms per keystroke (filter-local only)
  • MSM load:
       instantaneous (purely localStorage-driven)
  • Donation modal transitions:
       deterministic staging (Intro → Tiers → Thanks)

--------------------------------------------------------------------

0.Q.7 Operational SLAs for Merchants

Although merchants do not see internal diagnostics, NaviGen maintains:

  • End-to-end promo reliability:
       ≥ 99.99% (no failed redeem due to system error)
  • Token issuance success:
       ≥ 99.98% (failures auto-retry)
  • Dash availability:
       ≥ 99.9% for analytics & exports
  • Data currency:
       T+1 minute freshness for new events in stats

--------------------------------------------------------------------

0.Q.8 Internal Monitoring & Alerting KPIs

The internal QA and monitoring tier must support:

  • alert triggers within ≤ 60s of anomaly detection
  • auto-tagging reliability:
       ≥ 99.99% chance QA flag writes correctly
  • status:<ULID> updates:
       atomic and isolated per location
  • daily operational rollups:
       100% completeness

--------------------------------------------------------------------

0.Q.9 Release Safety SLAs

Every production deployment must meet:

  • 0 blocking regressions in:
       - QR → Promo flow
       - Token lifecycle
       - Billing signals
       - Dash analytics
       - Translation integrity
  • Full fallback compatibility:
       previous-version clients work flawlessly with new Workers
  • Migration safety:
       profiles.json / finance.json / contexts.json updates
       cannot break QR routing or Dash views

--------------------------------------------------------------------

0.Q.10 User Trust SLAs

NaviGen guarantees:

  • 100% privacy protection:
       no PII stored, no tracking, no analytics fingerprinting
  • 100% transparency of UI intent:
       QR codes always lead to predictable flows
  • 0 misleading UX patterns:
       donation & install modals appear only when user-triggered
  • 0 forced flows:
       no auto-popup promotions, no auto-install banners

These safeguards support cross-region trust and regulatory compliance.

--------------------------------------------------------------------

0.Q.11 Summary

NaviGen’s KPIs and SLAs ensure:

  • measurable performance  
  • verifiable correctness  
  • defensible integrity  
  • trustworthy analytics  
  • superior PWA and UX reliability  
  • safe and scalable global deployment

These commitments guide engineering, QA, DevOps, and product evolution across
the entire NaviGen platform.

--------------------------------------------------------------------

0.R SECURITY & THREAT MODEL

This section defines the security posture, threat assumptions, and defensive
architecture of NaviGen. It outlines how the platform protects revenue,
integrity, privacy, and operational trust in a hostile real-world environment.

--------------------------------------------------------------------

0.R.1 Threat Assumptions

NaviGen assumes the following realistic attack vectors:

  • Merchant-side circumvention:
        - providing discounts without scanning QR codes
        - forging or replaying redeemed promo tokens
        - suppressing or manipulating cashier confirmations

  • Customer-side exploitation:
        - attempting to reuse promo codes
        - scanning from screenshots or external sources
        - redeeming after expiration

  • Network-level challenges:
        - poor connectivity during redeem
        - device clock inaccuracies
        - inconsistent geolocation reflectors (e.g., CF POP)

  • UI/UX edge tampering:
        - reloads or navigation during redeem confirmation
        - offline reenactment of promo screens

  • External actors:
        - scanning Info QR for analytics inflation
        - tampering with QR renderings or deep links

NaviGen treats all clients as untrusted and all merchants as potentially adversarial.

--------------------------------------------------------------------

0.R.2 Core Defense Principles

A) **Zero-Trust Client Model**  
All business logic runs on the backend.  
No client UI action can create, approve, or revoke promotional benefits.

B) **Token-Driven Authorization**  
Redeem authorization derives solely from:
  • backend-issued, one-time token  
  • token status transition: "fresh" → "ok" → immutable

C) **Inviolable Event Chain**  
ARMED → SCAN → REDEEM → CONFIRM_CASH → CONFIRM_CUST  
ensures an auditable operational truth.

D) **Immutable Logs**  
stats and qrlog entries are append-only and cannot be rewritten or deleted.

E) **Merchant-Safe Exposure**  
Merchants see only counts; no internal ratios or QA metrics are exposed.

--------------------------------------------------------------------

0.R.3 Attack Surface Analysis

0.R.3.1 Client Manipulation  
Threat: Attempting to counterfeit redeem events by modifying JS or UI.  
Mitigation:  
  • redeem handled entirely server-side  
  • tokens validated independently of UI  
  • confirmation metrics logged only via Worker endpoints  
  • no privileged APIs exposed to the client

0.R.3.2 QR Replay / Screenshot Abuse  
Threat: Reusing a valid promo QR image.  
Mitigation:  
  • single-use tokens  
  • token invalidation logged automatically  
  • INVALID never overwritten by REDEEM  
  • QA detects repeated invalid attempts

0.R.3.3 Cashier Bypass  
Threat: Merchant gives discount without scanning.  
Mitigation:  
  • only redeem:<token>.status="ok" triggers REDEEM  
  • cashier confirmation required after every redeem  
  • QA cashierCoverage reveals systemic bypass

0.R.3.4 Customer Abandonment  
Threat: Customer does not see or acknowledge redeem.  
Mitigation:  
  • customer confirmation is optional but logged when it occurs  
  • customerCoverage part of QA  
  • merchant cannot exploit this to influence billing or compliance

0.R.3.5 URL Tampering  
Threat: Modifying /out/qr-redeem URL or token parameters.  
Mitigation:  
  • token validation prevents forgery  
  • ULID resolution ensures wrong slugs cannot map incorrectly  
  • Worker rejects malformed parameters

0.R.3.6 Stats Poisoning  
Threat: Hitting /hit endpoints repeatedly to inflate counts.  
Mitigation:  
  • volume-based analytics do not affect billing or QA  
  • QA models rely on ratios + patterns, not raw counts  
  • Merchant interface hides sensitive ratios  
  • Abnormal patterns surface only internally

--------------------------------------------------------------------

0.R.4 Secure Data Model

The distributed data model enforces:

  • Token states stored in isolated KV namespaces  
  • Redeem logs are append-only  
  • No PII stored in any store  
  • stats and qrlog keyed exclusively by ULID + date  
  • Data model consistent across Workers, Dash, and App shell  
  • No direct user identity → no privacy breach surface

--------------------------------------------------------------------

0.R.5 Secure Worker Architecture

Pages Worker provides:
  • pure routing  
  • no business decisions  
  • strict URL interpretation  
  • zero sensitive data exposure  

API Worker provides:
  • secure token lifecycle  
  • campaign validation  
  • financial rule enforcement  
  • QA tagging  
  • stable origin for Dash analytics

Workers never trust:
  • arbitrary client parameters  
  • client-side state  
  • unverified timestamps or geolocation information

--------------------------------------------------------------------

0.R.6 Secure Promotion Flow

The redeem flow cannot be faked:

  • Promo QR encodes location, campaign, token  
  • Token created server-side only  
  • Redeem requires Worker-level validation  
  • Confirmation modals create human-side verification  
  • INVALID attempts logged and monitored  
  • Billing triggered only on true REDEEM events  

All manipulation attempts lead to either:
  • no discount  
  • invalidation  
  • internal QA flagging

--------------------------------------------------------------------

0.R.7 Privacy Model

NaviGen enforces strict privacy:

  • No PII stored in NaviGen systems; billing identity is handled by Stripe only  
  • No cookies used for tracking  
  • No cross-site profiling  
  • VisitorID optional and anonymous  
  • All analytics aggregated  
  • QR logs contain metadata only for operational understanding  

This allows deployment in jurisdictions with strict privacy laws without modification.

--------------------------------------------------------------------

0.R.8 Supply Chain & Deployment Security

  • Workers deployed via Cloudflare with immutable builds  
  • Dataset updates are atomic and controlled  
  • Service worker behavior is explicitly constrained (see Section 6.5)  
  • All production keys, tokens, and configs isolated from frontend  
  • No secret keys ever appear in client bundles  

Service Worker invariants (security-critical):

  • Owner-sensitive endpoints MUST NEVER be served from cache.
  • Authority, ownership, and access decisions MUST always reflect live backend state.
  • Stale service worker code MUST NOT grant access, privacy, or control.

--------------------------------------------------------------------

0.R.9 Security SLAs

NaviGen guarantees:

  • 0% chance of token double consumption  
  • 100% deterministic token state transitions  
  • 0 merchant-visible security failures  
  • INVALID always takes precedence over UI-provided context  
  • All redeem attempts are verified regardless of device state  

Security is never dependent on:
  • user behavior  
  • cashier behavior  
  • UI correctness  
Only backend logic determines outcomes.

--------------------------------------------------------------------

0.R.10 Summary

NaviGen’s security posture derives from:
  • zero-trust assumptions  
  • server-only decision making  
  • immutable event logs  
  • minimal attack surface  
  • strong privacy boundaries  
  • deterministic promotion lifecycle  

This threat model ensures the system is resistant to misuse by merchants,
customers, third parties, and environmental disruptions.
  

These guarantees establish the operational excellence, trustworthiness, and
predictability that define NaviGen as a high-quality, production-grade platform.

--------------------------------------------------------------------

0.S Core Definitions (Authority & Access)

--------------------------------------------------------------------

## Core Definitions (Authority & Access)

### Owner Exchange

Owner Exchange is the server-side step that follows either:
- a successful payment on the current device, or
- a Restore Access flow using Payment ID (pi_...) on the current device.

During Owner Exchange:
- ownership is verified server-side
- an Operator Session is minted
- the browser is bound to a single location

Owner Exchange does NOT grant Dash access by itself.

--------------------------------------------------------------------

### Operator Session

An Operator Session is a short-lived, browser-bound authentication credential.

Properties:
- scoped to one browser and one location
- implemented as a secure HttpOnly cookie
- backed by a server-side session record
- proves authentication only

Operator Session:
- does NOT represent ownership
- does NOT represent campaign activity
- does NOT guarantee Dash access

--------------------------------------------------------------------

### Owner Center

Owner Center is a Business Owner surface in the main shell that allows an owner
to switch between locations previously authenticated on the current device.

Owner Center is device-bound, not account-bound.
Removing a location from Owner Center removes only the device registry entry for that device.
It does not affect ownership, campaign entitlement, or visibility of the location on other devices.

Key properties:
• Device-scoped (per browser/device), no accounts
• Lists only locations that have had a successful Owner Exchange on this device
• Supports “Switch & Open Dash” without requiring email recovery each time

Security posture:
• Switching devices requires Restore Access (one-time per device per location)
• Owner access is stored per device for security and privacy

--------------------------------------------------------------------

### Derived Portfolio (Internal, Device-Scoped)

For multi-location campaign control, NaviGen derives a portfolio from locations
already proven on the current device.

Properties:
- not a separate user product or account
- auto-created from the current seed location when the operator first chooses
  a multi-location campaign scope inside Campaign Management
- contains only existing locations already proven on the same device
- a location may join this portfolio when it is:
  • restored on the same device using Restore Access, or
  • established on the same device through a fresh qualifying purchase
- powers “Selected locations” and “All my locations” campaign-scope flows only

A derived portfolio does not replace:
- location ownership
- Operator Session
- per-location campaign execution

--------------------------------------------------------------------

### Restore Access

Restore Access is the recovery of a missing or expired Operator Session.

Restore Access:
- is free
- does not modify ownership
- does not extend campaigns
- only restores authentication

Restore Access — Cross-device recovery (Payment ID)

When restoring access on a different device, the owner may have only a Stripe
receipt, invoice, or payment confirmation email that contains the PaymentIntent ID (pi_...).

Therefore, NaviGen MUST support recovery using the Stripe PaymentIntent ID:

• Owner provides: Payment ID (pi_...)
• System performs: server-side lookup of the associated Checkout Session
• System validates: payment_status="paid" AND status="complete"
  If ownership:<ULID> is missing or lastEventId != pi_...,
  the API Worker MUST reconcile ownership idempotently and persist lastEventId = pi_... before minting the session.
• System requires one valid target identity route:
  - existing-location: metadata.locationID
  - brand-new private shell: metadata.draftULID + metadata.draftSessionId
• Existing-location route resolves: metadata.locationID → ULID
• Brand-new private-shell route treats draftULID as the authoritative pre-slug target ULID and validates draftSessionId
• System mints: op_sess cookie and opsess:<sessionId> record
• System redirects: /dash/<ULID>
• During /owner/restore reconciliation, the API Worker MUST also persist plan:<pi_...> from the resolved Checkout Session line items.

This restores access on the current device without requiring accounts.

--------------------------------------------------------------------

### Restore Access Messaging (strict)

Restore Access UI copy MUST:
• Refer only to **session recovery**
• NEVER imply campaign renewal
• NEVER imply analytics activation

Allowed phrasing:
• “Restore access”
• “Recover owner access on this device”

Forbidden phrasing:
• “Reactivate analytics”
• “Resume campaign”
• “Unlock dashboard” (ambiguous)

--------------------------------------------------------------------

### Campaign Entitlement

Campaign Entitlement is the time-bounded authorization that permits Dash access.

An entitlement-bearing active row MAY originate from either paid preset: `Visibility only` or `Promotion`.

Campaign Entitlement:
- is independent of Operator Session
- controls Dash and analytics access
- must be active for Dash to open

--------------------------------------------------------------------

### Promotion (NaviGen-specific)

In NaviGen, “Promotion” does **not** refer to advertising, SEO, paid placement,
or external marketing.

Promotion means **preferential visibility inside NaviGen discovery surfaces only**.

During an active campaign (visibilityState = "promoted"):
- locations MUST be ordered ahead of non-promoted locations
- this ordering applies only within NaviGen lists (e.g. Popular, context lists)
- no external ranking or distribution is implied or claimed

Implementation reference:
- Deterministic ordering enforced at `GET /api/data/list`
- promoted → visible → hidden (excluded)

--------------------------------------------------------------------

## Dash Access Decision Matrix (authoritative)

Dash access is governed by **two independent conditions**:

1) Operator Session (authentication)
2) Campaign Entitlement (authorization)

Both conditions MUST be satisfied to open Dash.

--------------------------------------------------------------------------------|
| Ownership | Operator Session | Campaign Entitlement | Result                  |
|-----------|------------------|----------------------|-------------------------|
| No        | —                | —                    | Claim / Run campaign    |
| Yes       | No               | —                    | Restore access          |
| Yes       | Yes              | No                   | Campaign renewal needed |
| Yes       | Yes              | Yes                  | Open Dash               |
--------------------------------------------------------------------------------|

Notes:
- “Restore access” recovers a missing Operator Session only.
- Campaign renewal is required when ownership exists but the campaign is inactive.
- Dash MUST NOT open unless both conditions are true.

Dash access is permitted **only when**:
- a valid Operator Session exists, AND
- Campaign Entitlement is active

This rule is enforced server-side and MUST NOT be inferred by the client.

--------------------------------------------------------------------

## Dash Access — HTTP Semantics (Authoritative)

The API Worker MUST use HTTP status codes to reflect
authentication vs authorization vs entitlement state.

The client MUST interpret these codes strictly and MUST NOT infer state.

--------------------------------------------------------------------

### /api/stats and /dash Access Semantics

| HTTP Status | Meaning | Authoritative Condition | Required UI Action |
|-------------|--------|-------------------------|--------------------|
| 200 OK | Access granted | Operator Session valid AND Campaign Entitlement active | Open Dash |
| 401 Unauthorized | Authentication missing or expired | Operator Session missing or invalid | Show Restore Access UI |
| 403 Forbidden | Authorization denied | Operator Session valid BUT Campaign Entitlement inactive OR ownership expired | Show Campaign Required UI |
| 404 Not Found | Location not resolvable | Invalid slug/ULID | Show safe error / fallback |

--------------------------------------------------------------------

### Invariants

• 401 MUST NEVER be used for campaign inactivity.  
• 403 MUST NEVER be used for missing session.  
• 200 MUST NEVER be returned unless both conditions are satisfied.  

--------------------------------------------------------------------

### Client Responsibilities

• Client MUST NOT:
  – guess entitlement state
  – open Dash on non-200 responses
  – downgrade 403 into “restore”

• Client MUST:
  – treat 401 as **session recovery**
  – treat 403 as **campaign renewal required**
  – treat ownership as orthogonal (from /api/status)

--------------------------------------------------------------------

### Server Responsibilities

• API Worker is the sole authority for:
  – ownership checks
  – entitlement checks
  – session validation

• Pages Worker and client UI:
  – present guidance only
  – never decide access

--------------------------------------------------------------------

## UI Copy Alignment (Owner-Facing, Authoritative)

This section defines the **exact semantic intent** of owner-facing UI copy.
All strings MUST be implemented via translation keys (t(key)).

The UI MUST NOT invent additional meanings beyond what is defined here.

--------------------------------------------------------------------

### Visibility Status Labels (LPM badges, lists)

| UI Label        | Meaning (authoritative)                    | When shown                               |
|-----------------|--------------------------------------------|------------------------------------------|
| Active campaign | Campaign Entitlement is active             | exclusiveUntil > now AND campaign active |
| Still visible   | Courtesy or Hold visibility; no campaign   | campaign inactive, courtesy/hold window  |
| Inactive        | Not discoverable in public surfaces        | after courtesy + holds expire            |

Notes:
• “Still visible” NEVER implies analytics or Dash access.  
• “Inactive” NEVER implies deletion or loss of ownership eligibility.

--------------------------------------------------------------------

### Dash Access Blocking Messages (Owner-facing)

| Situation                                 | Primary message                                               | Secondary clarification                                                                      |
|-------------------------------------------|---------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| Owned + no Operator Session               | “Owner access required”                                       | “Use Restore Access with the Payment ID (pi_...) from your Stripe receipt or payment email.” |
| Owned + session + no Campaign Entitlement | “Activate analytics by running a campaign for this location.” | “Dashboard access remains blocked until the listing runs an active campaign.”                |
| Unowned                                   | “Analytics access required”                                   | “Activate ownership by running a campaign.”                                                  |

Rules:
• Messages must be factual, non-salesy, and non-alarming.  
• UI MUST NOT suggest data loss when analytics are merely gated.


--------------------------------------------------------------------

0.T UI-State → Backend-State Matrix (Authoritative)

Core backend signals:

• OwnedNow = exclusiveUntil > now
• SessionValid = op_sess resolves to ULID on this device
• CampaignEntitled = ≥1 campaign row effectively Active (Active, in window, not suspended)
• SelectedULID = Business currently selected in UI
• ActiveULID = Business bound to op_sess

Canonical Action Labels:

• Not owned → Run a campaign
• Owned + no entitlement → Run a campaign
• Owned + session valid + entitlement → Manage campaign
• Draft editing → New campaign

These labels MUST be used consistently across all UI variants.

--------------------------------------------------------------------

A) Owner Settings Variants

1) Claim state (SessionValid = false, OwnedNow = false)
Primary:
• Run a campaign
Secondary:
• See example dashboards

2) Restore state (SessionValid = false, OwnedNow = true)
Primary:
• Restore owner access
Secondary:
• See example dashboards

3) Mismatch state (SessionValid = true, ActiveULID ≠ SelectedULID)
Primary:
• Owner Center (switch)
Secondary:
• Sign out on this device
• See example dashboards

4) Signed-in + entitlement (SessionValid = true, ActiveULID = SelectedULID, CampaignEntitled = true)
Primary:
• Open dashboard
• Manage campaign
Secondary:
• Owner Center
• See example dashboards
• Sign out

5) Signed-in + no entitlement (OwnedNow = true, CampaignEntitled = false)
Primary:
• Run a campaign
Secondary:
• Owner Center
• See example dashboards
• Sign out

--------------------------------------------------------------------

B) SYB Cards — Dots & 🎁 Logic

• 🟢 Free dot → OwnedNow = false AND visible
• 🔴 Taken dot → OwnedNow = true
• 🔵 Visible (courtesy) → OwnedNow = false AND courtesyUntil present
• 🟠 Parked → visibilityState = hidden
• 🎁 → CampaignEntitled = true

Notes:
• 🎁 indicates active campaign only.
• Dots reflect discoverability, not Dash access.

--------------------------------------------------------------------

C) Dash Gating (Authoritative)

Dash requires:
OwnedNow AND SessionValid AND CampaignEntitled

HTTP Semantics:

• 200 → Open Dashboard
• 401 → Restore access
• 403 + session exists → Switch business OR Run campaign
• 403 + no session → Run campaign OR Restore

--------------------------------------------------------------------

1. CORE SYSTEM OVERVIEW

1.1 Architectural Intent

NaviGen is a multi-tenant, location-centric platform for presenting business
profiles, running promotions, generating verifiable QR-based redemptions,
and producing analytics and operational diagnostics. It is implemented as:

  • A PWA-capable client (App shell + Dash)
  • A Pages Worker (routing, QR redirect, static hosting)
  • An API Worker (stats, token handling, campaign logic, QA tagging)
  • KV-backed runtime profile authority plus controlled static datasets (finance.json, contexts.json, i18n bundles)
  • A translation layer (Section 7) driving all text

The architecture separates *merchant-visible UX* from *internal diagnostics*
and enforces anti-circumvention at every point in the promotion lifecycle.

--------------------------------------------------------------------

1.12 Interpretive Guardrails (Non-Negotiable)

The following clarifications summarize core platform rules that are enforced
throughout the system and must not be reinterpreted or relaxed.

A) Ownership is not identity
Ownership is a time-limited operational state derived from payment.
There are no user accounts, no login identities, and no persistent owner records.

B) Dash analytics are owner-gated

Dash analytics are an owner capability and are not visible for unowned locations.

When an LPM is unowned:
• Dash access is blocked.
• No real analytics are exposed (no partial metrics, no masked summaries).

When an LPM is owned:
• Dash access is exclusive to the Owner (requires valid owner session).
• Merchant-facing Dash remains counts-only and merchant-safe.

Example Dash is permitted only for NaviGen-designated Example Locations.

C) Owner analytics are exclusive
When an LPM is owned, analytics become exclusive to the Owner.
No partial or metric-level visibility tiers exist.

D) Access mechanisms do not define authority
Stripe exchange, Payment ID (pi_...) restore, and cookies provide access continuity only.
Authority is defined exclusively by backend ownership state.

E) Agents initiate; owners operate
Agents may initiate onboarding and receive attribution.
Agents never acquire ownership or access to owner-only analytics.

F) Payment effects are single-purpose
Payment establishes operational authority or prepaid balance only.
It does not imply legal verification, identity persistence, or entitlement beyond scope.

G) Creation does not imply ownership
LPM creation (by owner, agent, or NaviGen) does not grant ownership.
Ownership always begins at payment confirmation.

These guardrails exist to prevent feature drift and preserve platform integrity.

--------------------------------------------------------------------

1.2 Major Subsystems

The system consists of the following cooperating layers:

1) **Data Layer**  
   Data governing locations, campaigns, contexts, and pricing:
     • `profile_base:<ULID>` + `override:<ULID>` in KV (runtime location authority)
     • campaigns.json deprecated
       Campaign lifecycle and entitlement are KV-authoritative.
       No JSON file is used for runtime campaign logic.
     • finance.json
     • contexts.json
     • profiles.json legacy export / migration artifact only

   Static data files are deployed with the site where applicable.
   Runtime location reads are KV-authoritative once Phase 8 is enabled.

2) **Pages Worker**  
   Responsibilities:
     • Serve the app shell and assets  
     • Resolve landing contexts (/souvenirs/…, /giftshops/…)  
     • Handle Info QR and Promo QR redirect endpoints  
     • Annotate requests for /hit/* metrics  
     • Deliver manifest and service worker files  

   Pages Worker performs **no business logic** other than structured redirects.

3) **API Worker (Business Logic Layer)**  
   Responsibilities:
     • Campaign resolution  
     • Promo QR issuance (token generator + ARMED log)  
     • Redeem handling (token consumption → REDEEM/INVALID logs)  
     • Stats aggregation (/api/stats)  
     • QR log query (qrlog)  
     • Auto-tagging QA flags (status:<uid>)  
     • Identity resolution (slug → ULID via KV_ALIASES)

   The API Worker is the authoritative truth for:
     • redeem validity  
     • invalid attempts  
     • confirmation metrics  
     • operational QA  

4) **Client App Shell (PWA)**  
   Responsibilities:
     • Location Profile Modal (LPM)  
     • Promotion modal + Promotion QR modal  
     • Cashier and Customer confirmation modals  
     • Install UX (📌 → 👋)  
     • Navigation context rendering  
     • Offline caching and fallback behaviors  

   The app shell never computes business logic. All logic comes from Workers.

5) **Dashboard (Dash)**  
   Responsibilities:
     • Present Click Info, QR Info, Campaigns, and Analytics views  
     • Produce written analytics using translation templates  
     • Render QA diagnostics  
     • Provide export/copy features  
     • Represent data only from /api/stats; no on-client mutation  

6) **Billing Layer (Section 5)**  
   Computes charges based on redeem events and finance.json definitions,
   fully independent of the client.

7) **Translation System (Section 7)**  
   Responsible for loading t(key) dictionaries, fallback behavior, and
   language-specific rendering of complex analytics text.

--------------------------------------------------------------------
1.2.1 Owner Platform (Core Authority Layer)

### Purpose

The Owner Platform defines how economic actors gain operational control over
locations (LPMs), campaigns, and gated analytics within NaviGen.

It is not a traditional merchant account system.
It is a payment-led authority layer operating without persistent user accounts.

### Scope

The Owner Platform governs:

• who may run or suspend campaigns  
• who may edit limited LPM profile fields  
• who may unlock gated analytics or exclusive visibility  
• how prepaid campaign budgets are created and consumed  

It does not govern:
• QR logic
• redeem validity
• analytics computation
• billing calculation

Those remain exclusively backend-controlled.

### Actor Model

An **Owner** is any economic actor who funds a campaign:
• merchant
• venue
• individual
• organizer
• university
• brand
• temporary operator

An **Agent** is a third party who assists an Owner in onboarding and campaign
activation and may receive compensation from campaign fees.

Ownership is economic, not identity-based.

### Authority Model

• Successful prepaid payment establishes operational authority
• No persistent user accounts are required
• No identity verification (KYC) is performed beyond payment
• The system never trusts the client or browser
• The API Worker is the sole authority for state changes

### Separation Rule

Owner Platform authority MUST NOT influence:

• redeem token creation or validation
• promo integrity logic
• QA diagnostics
• billing correctness

Owner actions are subject to backend enforcement at all times.

NaviGen does not introduce persistent Owner accounts.

Operational authority is derived from:
• successful payment events
• active unlock or exclusivity windows
• backend-recognized control scope

Authority is time-bound and capability-based.
It is not tied to long-lived user identity, login credentials, or personal accounts.

--------------------------------------------------------------------

1.3 Identity & Location Resolution

NaviGen supports stable identities via the alias system:

  • All public-facing links use locationID (slug)  
  • KV_ALIASES maps slug → ULID  
  • API and Dash internally resolve everything to ULID  
  • All stats, promo tokens, and logs are keyed by ULID  
  • Slug changes do not break historical analytics or QR codes

Identity normalization is a strict invariant across all components.

1.4 Event Model (High-Level)

The core event classes powering analytics are:

  • Interaction events (Clicks, Saves, Shares…)  
  • QR events (SCAN, ARMED, REDEEM, INVALID)  
  • Promotion confirmation events (cashier, customer)  
  • Rating events (sum, average)  

Canonical storage:

  • **stats:** stats:<ULID>:<YYYY-MM-DD>:<metric> → integer  
  • **qrlog:** qrlog:<ULID>:<day>:<scanId> → structured event object  
  • **token:** redeem:<token> → {status, uid, campaignKey, timestamp}

These event categories support:
  • Promo flow correctness  
  • Anti-circumvention  
  • Analytics summaries  
  • Merchant-safe Campaigns view  
  • Internal QA diagnostics  
  • Billing

1.5 Promotion Lifecycle Overview

A promotion travels through the following phases:

  1) Customer opens LPM → Promotion modal  
  2) Customer reveals Promo QR → ARMED  
  3) Cashier scans QR → SCAN  
  4) API Worker consumes token  
       → REDEEM (first use)  
       → INVALID (reuse)  
  5) Cashier confirmation modal → CONFIRM_CASH  
  6) Customer confirmation modal → CONFIRM_CUST  

This 6-point chain supports both user experience and diagnostic correctness.

1.6 QR Redirect Architecture

All QR scans use structured redirect endpoints via Pages Worker:

  • /out/qr-scan/<slug>?to=…  
  • /out/qr-redeem/<slug>?camp=<key>&rt=<token>

Pages Worker logs the visit, then sends the browser to the final landing URL.
API Worker handles all redeem-state updates; the redirect never implies success.

1.7 Compliance & Anti-Circumvention Model

Compliance is evaluated internally using:

  • armed  
  • scan  
  • redeem  
  • invalid  
  • cashier confirmations  
  • customer confirmations  

The system detects:

  • Discounts without cashier scans  
  • Expired or reused QR codes  
  • Late-window redeems (>100% compliance)  
  • Broken customer experience patterns  

Compliance ratios never appear in merchant views.

1.8 Dashboard Model (Conceptual)

Dashboard retrieves /api/stats and renders four consistent slices:

  • Click activity metrics  
  • QR activity metrics  
  • Campaign-safe summaries (counts only)  
  • Analytics narrative + QA  

Analytics text is computed client-side with templates and localization.

1.9 PWA Model

NaviGen functions as a progressive web app (PWA), offering enhanced continuity
and performance beyond browser mode.

The PWA model guarantees:

  • Standalone mode launch when installed from the OS
  • Unified install → support lifecycle (📌 → 👋)
  • Consistent behavior for deep links (Info QR + Promo QR)
  • Service worker–backed caching of UI shell and translations
  • Offline continuity for general browsing and MSM functions
  • Promo QR display offline, with redeem operations requiring network

Section 6.5 defines the full install and PWA lifecycle mechanics.

1.10 Data Integrity Rules (Global Invariants)

All layers respect:

  • Promotions belong strictly to time windows  
  • Tokens are single-use  
  • Invalid attempts are always logged, never overwritten  
  • Confirmation metrics always increment, never overwrite  
  • stats and qrlog must remain append-only  
  • No UI surface may infer logic on its own; all business state comes from API Worker  

1.11 Out-of-Scope for Section 1

This overview does not define:

  • Specific modal structures (Section 12)  
  • QR and promotion UI flows (Section 3)  
  • Analytics formulas (Section 4)  
  • Translation engine (Section 7)  
  • Dataset schemas (Section 8)  
  • QA flag mechanics (90.x)  
  • Onboarding workflows (90.x)  

Section 1 defines the **architectural skeleton** of NaviGen and how all other
sections interoperate across Workers, PWA shell, Dash, and the data model.

2. QR SYSTEM

2.1 Purpose

NaviGen uses QR codes as the connective tissue between the physical world
(locations, promotions, redeem events) and the digital stack (Workers, App,
Analytics, QA). QR codes are deterministic, stateless, and encode stable URLs
which route through the Pages Worker.

There are **two classes of QR codes**:

  • Info QR      – navigational entry to the business (LPM)
  • Promo QR     – secure one-time token enabling a redeem event

Both must work without login, across all devices, in browsers and PWAs.

--------------------------------------------------------------------
2.2 QR Code Types

A) **Info QR**
   Encodes:
       https://navigen.io/<context>?lp=<locationID>

   Purpose:
     • Bring the visitor directly into the business profile (LPM)
     • Display location info, contact, media, ratings, promotions

   Properties:
     • Never time-limited
     • No redeem logic
     • Always merchant-safe

B) **Promo QR**
   Encodes:
       https://navigen.io/out/qr-redeem/<slug>?camp=<key>&rt=<token>

   Purpose:
     • Support secure, single-use promotion redemption
     • Bridge customer → cashier → backend token lifecycle

   Properties:
     • Token-bound (rt)           → single use
     • Campaign-bound (camp=)     → active window
     • Location-bound (<slug>)    → ULID-resolved
     • Generates REDEEM or INVALID event server-side

--------------------------------------------------------------------
2.3 QR Redirect Architecture

Pages Worker routes QR requests via structured endpoints:

A) **Info QR Redirect**
   /out/qr-scan/<slug>?to=<finalURL>

   Behavior:
     • Logs SCAN event (qr-scan)
     • Redirects user to finalURL (usually <context>?lp=<id>)
     • Never alters business logic
     • Supports PWA or browser landing seamlessly

B) **Promo QR Redirect**
   /out/qr-redeem/<slug>?camp=<key>&rt=<token>

   Behavior:
     • Performs redirect only at the Pages layer
     • Does NOT emit /hit/qr-redeem from Pages Worker
     • Does NOT consume or pre-confirm the token
     • Redirects cashier device to:
          /?lp=<slug>&redeem=pending&camp=<key>&rt=<token>
     • The landing app then calls the API Worker for the truthful redeem outcome

Redirects are instantaneous and idempotent.  
QR system never assumes success solely from URL parameters.

--------------------------------------------------------------------
2.4 QR Event Semantics (Canonical Signals)

Every QR interaction emits one of the following canonical signals.
Signal meaning depends on QR type and context.

• **ARMED**  
  Promo-only signal.
  Emitted when a customer reveals a Promo QR and a redeem token is issued.
  No physical scan has occurred yet.

• **SCAN**  
  A physical QR scan event.

  Context-dependent meaning:
  - For **Info QR**, SCAN represents a visitor physically scanning a static,
    navigational QR code to enter the Location Profile Modal (LPM).
  - For **Promo QR**, SCAN represents the physical scanning of the promo QR
    by a cashier device as part of the redeem process.

  SCAN does not imply redeem success.

• **REDEEM**  
  Promo-only signal.
  Emitted when the backend consumes a redeem token successfully
  (first valid use following a promo QR scan).

• **INVALID**  
  Promo-only signal.
  Emitted when a redeem token is reused, expired, or otherwise invalid.

These signals populate:
• stats:<ULID>:<day>:<metric>
• qrlog:<ULID>:<day>:<scanId>

Signal names are shared, but **their interpretation is context-bound**.

--------------------------------------------------------------------
2.5 Info QR Flow (Customer)

The Info QR journey is:

  1) User scans QR found at the location  
  2) Pages Worker logs SCAN  
  3) User is redirected into <context>?lp=<locationID>  
  4) App shell loads Location Profile Modal (LPM)  
  5) User may explore: contact, media, social, ratings, promotions

Info QR has no security constraints and must never block access.
Static QR scan (Info QR SCAN) must only be logged by the QR redirect endpoint (/out/qr-scan/<slug>).
Loading /?lp=<slug> inside the app (internal navigation) MUST NOT be interpreted as a QR scan.

--------------------------------------------------------------------
2.6 Promo QR Flow (Customer → Cashier)

The Promo QR journey consists of two devices, synchronized by token state:

A) **Customer**
   1. Opens promotion modal from LPM  
   2. Requests Promo QR via /api/promo-qr  
   3. ARMED event logged  
   4. Displays QR containing rt=<token>  
   5. Polls /api/redeem-status until token consumed → CONFIRM_CUST modal

B) **Cashier**
   1. Scans the promo QR  
   2. Pages Worker performs redirect only and sends the cashier device to:
        /?lp=<slug>&redeem=pending&camp=<campaignKey>&rt=<token>
   3. The landing app requests the truthful redeem outcome from:
        POST /hit/qr-redeem/<UID>?rt=<token>&json=1
   4. API Worker consumes the token:
        - fresh → outcome:"ok" → REDEEM
        - used/expired/inactive → non-ok outcome → INVALID
   5. Cashier confirmation modal is shown only when backend outcome is ok → CONFIRM_CASH

Promo QR flow enables multi-actor integrity without authentication.

If multiple campaigns are simultaneously active for a location:
• /api/promo-qr without explicit campaignKey MUST return 409.
• Client MUST present a campaign selection modal.
• Selected campaignKey is passed explicitly to /api/promo-qr.

--------------------------------------------------------------------
2.7 Token Model

Promo QR contains a one-time token:

  • Created by /api/promo-qr  
  • ULID-based, opaque to clients  
  • Stored as KV entry:
        redeem:<token> = {status, uid, campaignKey, timestamp}

Token states:

  • "fresh"     → not yet redeemed  
  • "ok"        → redeemed (REDEEM)  
  • "invalid"   → reused/expired (INVALID)

Token is validated **only** by API Worker, never by client.

--------------------------------------------------------------------
2.8 Confirmation Layer (Human-Side Integrity)

Two confirmation channels ensure in-store compliance:

A) **Cashier Confirmation**  
   Triggered after landing on redeem=pending and receiving backend outcome ok.  
   Logs:
       redeem-confirmation-cashier

B) **Customer Confirmation**  
   Triggered once redeem-status API reports token consumed.  
   Logs:
       redeem-confirmation-customer

These logs enable:
  • scan-discipline interpretation  
  • cashier coverage vs. redeems  
  • customer experience completion measurement  
  • detection of circumvention patterns  
(See Sections 3, 4, and 90.x)

--------------------------------------------------------------------
2.9 Data Surface for QR System

QR interactions populate:

A) **stats bucket** (per-day counters):
   • qr-scan  
   • qr-view  
   • qr-print  
   • armed  
   • redeem  
   • invalid  
   • confirmation metrics

B) **qrlog** (per-event records):
   • signal: scan/armed/redeem/invalid  
   • scanId  
   • device/browser/lang/country (CF metadata)  
   • visitor ID (anonymous)  
   • campaignKey (if promo)  
   • timestamp  

C) **API Worker state:**
   • redeem:<token> entries  
   • status:<ULID> QA flags  
   • alias:<slug> → canonical ULID

QR system does **not** persist user identity or personal data.

--------------------------------------------------------------------
2.10 QR System → Dashboard (Analytics Integration)

Dashboard Analytics (Section 4) derives:

  • Total QR events  
  • Breakdown per type (SCAN, ARMED, REDEEM, INVALID)  
  • Redemption efficiency (promo-led or static-led)  
  • Window-shift detection (>100% compliance)  
  • Invalid attempt patterns  
  • Campaign-level armed/redeem/invalid counts  
  • Full QA diagnostics (scan discipline, invalids, cashier/customer coverage)

QR events are the **primary source** of operational intelligence.

--------------------------------------------------------------------
2.11 QR System → Billing (Internal)

Billing (Section 5) uses:

  • REDEEM events  
  • campaignKey  
  • finance.json (sectorKey/countryCode/campFeeRate)  
  • timestamp  

ARMED, SCAN, INVALID events do not incur charges but influence QA and risk scoring.

--------------------------------------------------------------------
2.12 QR System Invariants (Non-Negotiable)

  • Tokens are single-use.  
  • SCAN does not imply REDEEM.  
  • INVALID must never overwrite REDEEM.  
  • ARMED may precede REDEEM by hours/days (window-shift must be tolerated).  
  • Confirmation events must not be synthesised or repeated.  
  • QR must never encode logic; only stable URLs.  
  • QR redirects must be safe, deterministic, instantaneous.

--------------------------------------------------------------------
2.13 Out-of-Scope for Section 2

Section 2 does not cover:

  • Promotion UX (Section 3)  
  • QR analytics narratives (Section 4)  
  • Data model structures (Section 8)  
  • Worker internal logic (Section 9)  
  • Translation engine (Section 7)  
  • Modal system (Section 12)  

Section 2 defines the **role, behavior, and invariants** of QR codes within NaviGen.

3. PROMOTION & REDEEM EXPERIENCE

3.1 Purpose of the Promotion Flow

The promotion system enables merchants to run time-bounded, rules-based
discount campaigns that activate via QR codes shown to customers. The flow must:

  • Be frictionless for customers
  • Enforce one-time-use redemption tokens
  • Prevent circumvention by cashiers or managers
  • Ensure all required events are logged for analytics and billing
  • Provide a uniform experience across web, PWA, and standalone surfaces

All promotion text is driven by t(key) (see Section 7).

3.2 Promotion Entry Points

Promotions may be reached from:

  • The Location Profile Modal (LPM) → “Promotion” or “Redeem Coupon”
  • Sharing a location → user opens the promo modal directly
  • Deep links (e.g., ?promo=active) where accepted

Promotions require the customer to be at a location or browsing that location’s LPM.

3.3 Promotion Modal (Customer-Facing Entry)

The promotion modal provides:

  • Campaign name (quoted)  
  • Discount description (e.g., “10% off your purchase”)  
  • Eligibility notes (translated)  
  • Campaign validity window (start → end)  
  • “Show QR” CTA

The modal rarely changes across campaigns; campaign data is injected into its template.

Closing the modal returns the user to the LPM without side effects.

3.4 Promo QR Modal (Customer Device)

When the customer taps “Show QR”, the system:

  • Calls /api/promo-qr?locationID=<slug>
  • Resolves active campaign (time window + status)
  • Issues a one-time redeem token (rt=<token>)
  • Logs ARMED event in qrlog (promo QR shown)
  • Presents a QR containing:
        /out/qr-redeem/<slug>?camp=<key>&rt=<token>

The displayed QR remains visible until closed.  
No redemption occurs until the cashier scans this code.

3.5 Cashier Scan (POS Device)

When the cashier scans the promo QR:

  1. Pages Worker receives GET /out/qr-redeem/<slug>?camp=…&rt=…
  2. Pages Worker redirects the cashier device to:
       /?lp=<slug>&redeem=pending&camp=<campaignKey>&rt=<token>
  3. App shell requests the truthful outcome from:
       POST /hit/qr-redeem/<UID>?rt=<token>&json=1
  4. Backend consumes the token:
       • outcome = "ok" → REDEEM event
       • outcome = "used" | "invalid" | "inactive" → INVALID-style cashier branch
  5. App shell opens the cashier success or invalid modal based on backend outcome

The redirect URL does not imply redeem success on its own.

3.6 Cashier Redeem Confirmation Modal

Upon arriving with `redeem=pending` and receiving backend outcome `ok`, the cashier device shows a mandatory modal:

  • Title: Redeem Confirmation  
  • Body: “How smooth did the redeem event go?”  
  • 5-point emoji scale (😕 😐 🙂 😄 🤩)  
  • Tapping one logs: redeem-confirmation-cashier

Behavioral purpose:

  • Guarantees the cashier acknowledges a redeem event
  • Prevents “I won’t scan but I’ll give the discount anyway”
  • Provides a second compliance anchor paired with campaign activity
  • Builds internal QA coverage signals

After submission, modal closes; underlying LPM remains.

3.7 Customer Redeem Confirmation Modal (Token-Aware)

On the customer device, the Promo QR modal performs token-aware polling:

  • Calls /api/redeem-status?rt=<token>
  • If the backend marks the token as redeemed:
       → Show “Redeem Successful – How was your experience?” modal
  • Customer selects a smiley-scale response:
       → Logs redeem-confirmation-customer

Characteristics:

  • Cannot trigger early; tied strictly to the redeem token
  • Provides third compliance anchor
  • All text driven by translation keys

3.8 Invalid or Reused Tokens

If a QR code is rescanned after redeem:

  • Backend marks token as invalid
  • INVALID event is logged
  • Invalid attempts accumulate in QR Info / Campaigns
  • Analytics + QA interpret this safely (window shift or misuse)

Customer device will *not* show a second confirmation modal.

3.9 Cashier & Customer Flow Summary

The complete event chain is:

    ARMED          → customer sees promo QR  
    SCAN           → cashier scans QR  
    REDEEM         → backend consumes token  
    CONFIRM_CASH   → cashier confirmation modal  
    CONFIRM_CUST   → customer confirmation modal  

Analytics and QA derive compliance patterns from these 5 signals.

3.10 Promotion & Redeem Data Contracts (Derived)

Each redeem event includes:

  • locationID (slug), resolved server-side to canonical ULID  
  • campaignKey  
  • token ULID  
  • timestamp  
  • cashier confirmation flag  
  • customer confirmation flag  
  • invalidAttemptCount (for that window)

These are stored entirely server-side; the client never interprets token validity.

Billing (Section 5) references these data points only via backend, never client.

3.11 Merchant-Facing Behavior

Merchants see:

  • Promotions shown (armed)  
  • Scans  
  • Redemptions  
  • Invalid attempts  
  • No compliance %  
  • No confirmation metrics  
  • A simplified operational status (“OK” / “Needs attention”)

This prevents merchants from gaming the system by watching live compliance.

3.12 Internal Diagnostics & Analytics

Analytics view includes:

  • Narrative summaries using translated templates  
  • Proper plural rules  
  • Label-first formatting  
  • QA Analysis block interpreting:
        - scan discipline
        - invalid attempt patterns
        - cashier confirmation coverage
        - customer confirmation coverage
        - window-shift (>100% compliance)

QA text is not shown in merchant Campaigns view.

3.13 Anti-Circumvention Properties

The flow enforces:

  • No valid redeem without scanning customer QR  
  • No silent/hidden redeem because cashier confirmation is mandatory  
  • No mismatch between customer and cashier flows  
  • No possibility of issuing discount after skipping QR scan  
  • Window-shift logic to detect late redeems

The architecture is designed to deter:

  • “Just give a discount without scanning”  
  • “Reuse the same QR multiple times”  
  • “Scan after redeem period”  
  • “Invalidate or overwrite customer intent”

3.14 Error & Edge Handling

  • Missing rt → redeem denied  
  • Expired campaign → redeem denied  
  • Token reuse → INVALID event  
  • Redirect interruptions → promo may be reopened safely  
  • Customer modal appears only once per token  
  • Cashier modal appears only on redeem pages

3.15 Promotion Flow in Offline/PWA Mode

  • Customer device: promo QR always displays (cached modal + dynamic token)
  • Cashier device: redeem requires online backend
  • Modals function offline except where backend state is required
  • Translations loaded from i18n bundles (cached by SW)

3.16 Out-of-Scope Items

Section 3 does not define:

  • Billing calculations (Section 5)  
  • Dash analytics behaviors (Section 4)  
  • Modal internal code structure (Section 12)  
  • Translation domains (Section 7)  
  • ULID/alias mapping (Section 1 & 9)

Section 3 defines the **promotion interaction architecture**, not the UI code.

4. DASHBOARD

4.1 Purpose & Scope

The Dashboard provides merchant-facing and internal-facing analytics derived
from NaviGen’s event logs (stats and QR logs). It complements the in-app Location
Profile Modal (LPM) by providing structured tables, trend summaries, campaign
performance views, and a diagnostic Quality Assurance (QA) layer.

The dashboard is read-only. It does not permit editing business data, campaigns,
or configuration.

4.2 Dashboard Entry & Identity

The dashboard may be opened via:

  • /dash?locationID=<id-or-alias>
  • /dash/<id-or-alias>

The dashboard resolves both direct ULIDs and slugs via the alias layer before
requesting stats from:

    GET /api/stats?locationID=<UID>&from=YYYY-MM-DD&to=YYYY-MM-DD

The dashboard always reflects:

  • the resolved canonical location name
  • the selected time window
  • the user’s chosen language (via t(key), Section 7)

4.3 Dashboard Views (Tabs)

Dashboard has four views, each tied to a button or tab:

  • Click Info               → interaction metrics (non-QR)
  • QR Info                  → QR activity (static scans + promo scans)
  • Campaigns                → campaign-level view (counts only)
  • Analytics                → narrative report + QA diagnostics

All views reflect the same time window and location identity.

4.4 Export Behavior (Copy Button)

A unified “Copy / Export” button provides:

  • Click Info / QR Info / Campaigns:       TSV export of the visible table
  • Analytics:                               plain-text export of the full written report:
        - Header (location, period, rating line)
        - Click Summary
        - QR Summary
        - Campaigns Summary
        - Quality Assurance Analysis
        - Footer (timestamp + brand line)

The exported TSV or text must match the data on screen exactly.

4.5 Core Event Data

Dashboard views are derived from events tracked by Workers:

  • Interaction metrics:      stats:<loc>:<day>:<metric>
  • QR flows:                 qrlog:<ulid>:<day>:<scanId>
  • Promotion flows:          armed, scan, redeem, invalid
  • Confirmation flows:       redeem-confirmation-cashier, redeem-confirmation-customer

All events resolve to canonical ULIDs before being aggregated.

4.6 Click Info View

Click Info shows:

  • The top N (e.g. 5) interaction metrics sorted by total count
  • A narrative summary:
      - “Most-used actions in this period were …”
      - Optional trend line vs previous day
  • A mini bar chart for quick comparison

Characteristics:

  • Metric names always come from t(key) (metric.* domain)
  • Grammar-free summaries (label-first, no English plural shorthands)
  • Empty state handled gracefully (“No click events recorded…”)

4.7 QR Info View

QR Info reflects the four QR event categories:

  • Static scans
  • Promo QR shown (ARMED)
  • Redemptions
  • Invalid attempts

Narrative summary includes:

  • Total QR events
  • Breakdown of each event type (label-first: “Static scans – 16”)
  • Conditional narrative:
      - Promo-led flow: redemption ratio from ARMED
      - Static-led flow: redemption ratio from static scans
      - Invalid attempt proportion

Tables use simple “label – value” rows; bar-chart visualizer is available.

4.8 Campaigns View (Merchant-facing)

The Campaigns view is a merchant-facing, operational summary of promotional activity.

When CampaignEntitled = false but OwnedNow = true,
the primary CTA in Owner surfaces MUST be labeled:
• "Renew campaign"

It MUST expose only absolute counts and non-interpretive facts, including:
- Promo QR shown (count)
- Redemptions (count)
- Invalid attempts (count)
- Unique visitors
- Repeat redeemers
- Locations
- Campaign period and status
- (No campaign “Scans” column; static scans are not campaign metrics)

The Campaigns view MUST NOT expose ratios, percentages, or derived performance metrics
(e.g. “Efficiency %”, “Conversion rate”, “Scan discipline”).

All ratios and interpretive metrics are reserved exclusively for:
- internal monitoring,
- quality assurance,
- compliance analysis,
- and management tooling.

These metrics MAY be calculated and used by the system, but MUST NOT be rendered in
merchant-facing Campaigns tables or dashboards.

4.9 Analytics View (Written Report)

Analytics produces a narrative report composed of four blocks:

A) Header  
   • Location, period, rating summary  
   • Fully translated via t(key)

B) Click Analytics Summary  
   • Most-used actions list  
   • Up to three trend phrases  
   • Templates fully translated (no inline English)

C) QR Analytics Summary  
   • Total QR events and component breakdown  
   • Promo-led vs static-led redemption ratios  
   • Invalid attempt interpretation  
   • Translated templates with {percent}, {count}, etc.

D) Campaigns Summary (Merchant-Safe)  
   • Count-based summary (“Promotions were shown 7 times…”)  
   • Invalid attempts count if present  
   • No ratios here

E) Quality Assurance Analysis (Internal Diagnostics)  
   • Scan discipline evaluation (normal / low / >100% window shift)  
   • Invalid attempt analysis (normal / elevated)  
   • Cashier confirmation coverage (normal / low)  
   • Customer confirmation coverage (normal / low)  
   • All sentences translation-driven, grammar-neutral, using template variables

4.10 QA Logic (Internal Only)

Analytics QA block is not visible in Campaigns view.

QA interprets:

  • complianceRatio = redemptions / armed
  • invalidRatio = invalid / (redeem + invalid)
  • cashierCoverage = redeem-confirmation-cashier / redeem
  • customerCoverage = redeem-confirmation-customer / armed

Thresholds:

  • complianceRatio < 0.7 → low scan discipline
  • complianceRatio > 1.05 → reporting-window misalignment
  • invalidRatio > 0.10 AND invalid ≥ 3 → elevated invalid attempts
  • cashierCoverage < 0.8 → operational inconsistency / skipped cashier scans
  • customerCoverage < 0.5 when armed ≥ 10 → early sign of incomplete customer flow

QA always outputs a deterministic narrative.

4.11 Ratings Line

Ratings block uses singular vs. plural templates:

  • {avg}, {count}, {plural}  
  • No English “s” suffix generated in code  
  • Fully language-dependent

4.12 Plural-Safe Narrative Rules

All Analytics text must:

  • Avoid English-driven noun-number concatenation  
  • Use label-first ordering:
        “Promo QR shown – 7”
        “Invalid attempts – 2”
  • Use explicit singular vs plural templates as needed
  • Never derive grammar in JS

4.13 Dash Header Localization

Dashboard header components follow:

  • “Total daily counts for” → dash.meta.total-daily-counts-for  
  • “Location / Entity (Sum)” → dash.label.location / dash.label.entity  
  • “Period” → dash.period  
  • Period options → dash.period.option.*  
  • Title → dash.title  

All must be sourced from t(key), not index.html literals.

4.14 Layout & Scroll Behavior

  • Main table region uses a unified scrollport (#dash-table-scroller)
  • Right padding and symmetric table scroll prevent cutoff
  • Mini bar charts provide screen-safe visual summaries
  • Analytics is scrollable text, not a table

4.15 Modal Interactions from Dash

Dash may invoke system-level modals:

  • Donation modal (👋)  
  • Share/Copy modal (⧉)  
  • Install modal (if running in browser mode)

All ancillary text must be translated; Section 12 defines modal architecture.

4.16 Data Refresh & Caching

  • Dash does not cache data; each navigation triggers /api/stats  
  • Stats aggregation is performed server-side  
  • PWA service worker must not cache dash.js or stats responses  
  • Cache-busting via versioned script URLs is recommended

4.17 Error Handling

  • If stats payload is incomplete or empty → graceful empty states  
  • If data inconsistencies arise (e.g., armed < redeems) → QA interprets them, rather than failing  
  • Dash must never crash due to missing translations or missing metrics

4.18 Out-of-Scope Items

Section 4 does not specify:

  • Modal definitions  
  • Full translation matrices  
  • Pricing or billing logic  
  • Data ingestion rules  
  • Campaign configuration

These belong to Sections 3, 7, 8, 12, and 90.x.

--------------------------------------------------------------------

4.20 BUSINESS REPORT MODULE

4.20.1 Purpose

The Business Report module provides merchants and authorized entities with a 
progressively expanding suite of analytical insights. These insights extend 
beyond basic counts into behaviour, timing, performance, competition, and 
profile optimization.

The system is designed for staged rollout. Each phase introduces new metrics 
that remain fully compatible with the underlying navigation, promotion, QR, 
and stats systems.

--------------------------------------------------------------------------

4.20.2 Design Principles

• All insights derive from existing event data (stats, qrlog, confirmation metrics)  
• No personal identifiers are collected or stored  
• Default Dashboard remains merchant-safe; advanced intelligence requires unlock  
• Premium insights remain gated behind Stripe payments  
• All computation runs on the backend; the frontend displays results only  
• Data interpretation favors clarity, not raw statistical noise  

--------------------------------------------------------------------------

4.20.3 Indicator Families

The Business Report organizes insights into these major indicator groups:

A) Action Drivers  
    - Top CTAs  
    - Static QR scans  
    - Promo QR shown  
    - Redemptions & invalids  
    - Confirmation coverage (cashier/customer)

B) Time Intelligence  
    - Peak days  
    - Peak hours*  
    - Week-over-week change*

C) Audience Behavior  
    - New vs returning visitors  
    - Context→location displacement patterns*  
    - Visitor switching across nearby LPMs*

D) Competition Intelligence  
    - Cannibalization across contexts*  
    - Nearby competitor overlap*  
    - Category replacements / alternatives*

E) Profile Optimization  
    - Profile completeness score  
    - Missing attribute suggestions  
    - Broken link diagnostics*

F) Promotion Performance  
    - Efficiency evolution over time  
    - Invalid attempt diagnostics  
    - Redemption quality patterns  

G) Ratings & Social Indicators*  
    - Rating change  
    - Review volume change

(*) Indicates metrics requiring backend expansion or new computation pipelines.

--------------------------------------------------------------------------

4.20.4 Ownership & Visibility Model

Dashboard analytics are a paid operational feature.

Real analytics for a Location Profile Modal (LPM) are visible
only to the active Owner of that location.

An LPM is always in one of two visibility states with respect to Dash:

• Unowned (No Analytics Access)
• Owned (Exclusive Analytics Access)

--------------------------------------------------------------------------

A) Unowned LPM (No Real Dash Access)

When an LPM is unowned (exclusiveUntil ≤ now):

• Dashboard analytics for that LPM are NOT accessible.
• /dash/<location> requests MUST NOT return real data.
• Analytics are neither partially revealed nor masked.

Rationale:
• Real analytics incur infrastructure cost.
• Analytics are an ownership capability, not a public right.
• Public exposure of real analytics creates uncontrolled free-riding.

Unowned LPMs remain fully public in the App (LPM):
• profile information
• contact channels
• promotions (if any)
• ratings and saves

Only Dash analytics are restricted.

--------------------------------------------------------------------------

B) Owned LPM (Exclusive Analytics Access)

When an LPM is owned (exclusiveUntil > now):

• Dashboard analytics become exclusively accessible to the Owner.
• Access requires:
    - active ownership, and
    - a valid owner access session.

Analytics visibility remains:
• count-only (merchant-safe)
• free of QA ratios or internal diagnostics.

--------------------------------------------------------------------------

C) Demo Analytics (Non-Location-Specific)

NaviGen may provide one or more Demo Dash views showing example analytics.

Demo Dash:
• is not tied to any real LPM.
• may use synthetic or curated datasets.
• exists solely to demonstrate analytics structure and interpretation.

Demo Dash MUST be clearly labeled as example data
and MUST NOT be confused with real location analytics.

Demo Dash does not affect ownership rules.

--------------------------------------------------------------------------

E) Example Dash (Real Data, Designated Locations)

When Dash access is blocked for an unowned LPM, NaviGen MAY present
links to analytics views of designated Example Locations.

Example Dash properties:
• Uses real Dash views and real analytics data.
• Is always tied to real, existing LPMs.
• Is never derived from or related to the requested LPM.
• Exists solely to demonstrate how analytics look and behave.

Rules:
• Example Dash locations MUST be explicitly flagged by NaviGen.
• Example Dash MUST NOT display analytics for the requested LPM.
• Example Dash is optional and supplemental to the access-required interstitial.

Example Dash does not alter ownership rules.
Access to real analytics for a specific LPM still requires ownership.

--------------------------------------------------------------------------

4.20.4.1 Ownership Gating Matrix (Authoritative)

This matrix defines how ownership state affects access to all major NaviGen surfaces.
It is authoritative and overrides any implicit assumptions elsewhere in the spec.

Ownership states:
• Unowned        → exclusiveUntil ≤ now OR no ownership record
• Owned          → exclusiveUntil > now

Access states:
• Public         → accessible to any visitor
• Owner-only     → requires active ownership AND valid owner access session
• Blocked        → explicitly denied

--------------------------------------------------------------------
Surface / Endpoint                     | Unowned LPM | Owned LPM (no session) | Owned LPM (with session)
--------------------------------------------------------------------
Location Profile Modal (LPM)           | Public      | Public                 | Public
Info QR                                | Public      | Public                 | Public
Promo QR (customer)                    | Public*     | Public*                | Public*
Promo QR (cashier redeem)              | Backend     | Backend                | Backend

/dashboard (/dash/<location>)          | Blocked     | Blocked → Interstitial | Owner-only
/api/stats                             | Blocked     | Blocked                | Owner-only

--------------------------------------------------------------------

HTTP semantics for blocked states are defined in Section 0.S.
This matrix defines surface behavior only.

Notes:
• “Blocked” means no real analytics data is returned under any circumstance.
• When Dash is blocked due to ownership state, the App must guide the user via:
    - the “Owner settings” modal (when entry originated from an LPM), or
    - the Owner Recovery page (when Dash is opened directly without LPM context).
• Example Dash locations are permitted only when explicitly flagged (Section 8.3.1.1).
• Promo QR customer flows remain accessible regardless of ownership state.
• Backend-only operations (redeem validation, billing) are never gated by UI state.

When Dash access is blocked for an unowned LPM:

• Real analytics for that LPM are not shown.
• The UI MAY present:
    - an access-required interstitial, and
    - links to analytics views of designated example locations.
• Example locations use real data and are not tied to the requested LPM.

--------------------------------------------------------------------

4.20.4.2 — Emphasis

Example Dash access bypasses ownership and campaign entitlement checks.
However, a location must be explicitly flagged as an example to qualify for this bypass.

--------------------------------------------------------------------

4.20.5 Development Phases

Phase 1 (Immediate)
    1. Rename “QR scan” → “Static QR scan”  
    2. Add customer guidance line to Promo QR modal  
    3. Add profile completeness score  
    4. Add missing field suggestions  
    5. Add “Peak days” (from existing daily totals)  
    6. Prepare gating UX (masking + unlock button)

Phase 2 (Owner Platform Foundations)
    1. Build Owner Platform (Section 92) with Payment ID (pi_...) restore + Stripe checkout  
    2. Gated indicators appear with unlock button  
    3. Campaign balance & basic financials  
    4. Profile edit tools

Phase 3 (Premium Intelligence)
    1. Hourly histograms for peak hours  
    2. Cannibalization metrics  
    3. Audience displacement metrics  
    4. Broken link health checker (cron)  
    5. Promo efficiency evolution over time  
    6. Enhanced profile optimization tips

Phase 4 (Advanced / Future)
    1. Ratings & review change detection  
    2. Multi-location competitive intelligence  
    3. Predictive analytics (burn rate, staffing hints, “best time to promote”)  
    4. Event anomaly detection pipelines  

--------------------------------------------------------------------------

4.20.6 Out-of-Scope

This module does not define:
• Worker logic (Section 9)  
• Billing calculation (Section 5)  

Business Report covers analytical surface, interpretation logic, and gating design.

--------------------------------------------------------------------

5. BILLING

5.1 Purpose

Billing converts verified, backend-confirmed **redeem events** into financial
charges for merchants running promo campaigns. Billing must:

  • Reflect actual redeemed promotions only
  • Reject invalid or duplicate redemptions
  • Follow campaign- and sector-specific pricing rules
  • Operate independent of client devices (no client trust)
  • Never expose cost data to end users or merchants via Dash

Billing is **internal-only** and does not influence in-app or dashboard UX.

--------------------------------------------------------------------
5.2 Billing Inputs (Authoritative Sources)

Billing draws exclusively from server-side state:

A) **Redeem events**  
   Logged when redeem:<token> transitions from "fresh" → "ok"
   Includes:
     • uid (location ULID)
     • campaignKey
     • timestamp
     • token ULID

B) **Campaign metadata (campaigns.json)** - deprecated!!!
     Campaign lifecycle and entitlement are KV-authoritative.
     No JSON file is used for runtime campaign logic.
   • sectorKey
   • campaignKey
   • startDate / endDate
   • offer type and discount value (for analytics, not billing calculation)

C) **Finance metadata (finance.json)**
   • sectorKey
   • countryCode
   • currency
   • campFee / campFeeRate (flat or percentage billing model)

D) **Token metadata**
   • Guarantees redeem is single-use
   • Provides canonical campaignKey and location identity

Billing does **not** trust:
  • client events
  • raw URLs
  • unverified "success" screens

Only backend token consumption is billable.

--------------------------------------------------------------------
5.3 Billable Event Definition

A billable event is created **only** when:

  1. A fresh redeem token is consumed by API Worker  
  2. The API Worker marks:
         redeem:<token>.status = "ok"
  3. A REDEEM event is logged in both:
         stats:<ULID>:<day>:redeem
         qrlog (with signal="redeem")

INVALID events (token reuse, expired) are **never** billed.

Customer- and cashier-confirmation events do **not** affect billing amounts.

--------------------------------------------------------------------
5.4 Billing Models (finance.json)

Each location belongs to a sectorKey, which maps to finance.json.
Finance metadata determines:

  • Flat fee per redeem:      campFee
  • Percentage-of-value fee:  campFeeRate (applied to estimated spend)
  • Currency symbol           (e.g., HUF, EUR, USD)

Billing system may evolve, but all models must be:

  • deterministic  
  • auditible  
  • explainable in internal logs  
  • independent of device behavior  

5.4.1 Flat-Fee Model  
    charge = campFee

5.4.2 Percentage Model  
    charge = estimatedSpend * campFeeRate  
Estimated spend may derive from sector parameters (min, median, max spend),
campaign metadata, or future dynamic heuristics.

--------------------------------------------------------------------
5.5 Billing Record Structure (Internal Only)

On token consumption, API Worker writes a billing record:

    billing:<token> = {
      uid,
      campaignKey,
      sectorKey,
      countryCode,
      currency,
      campFee,
      campFeeRate,
      redeemedAt,
      redeemToken: <token>,
      estimatedSpend?,   // optional
      appliedFee         // final fee in currency minor units
    }

Billing records are immutable and never modified after creation.

--------------------------------------------------------------------
5.6 Billing Day Closeout

Billing is processed in daily cycles:

  • All redeem events of day D are collated
  • Campaign metadata is re-read for correctness
  • finance.json is re-applied (if updated)
  • Billing anomalies flagged internally (never merchant-visible)
  • Summaries exported for accounting and invoicing

Dash does not expose any billing data.

--------------------------------------------------------------------
5.7 Interaction with QA & Compliance

QA signals (Section 90.x) **never** alter billing amounts, but they influence:

  • internal risk scoring  
  • merchant support prioritization  
  • audit triggers  

Examples:
  • High invalid attempts → potential misuse  
  • Low cashier coverage → operational risk  
  • Low scan discipline → enforcement issue  

Billing remains based on redeem events only, but QA supports “trust scoring.”

--------------------------------------------------------------------
5.8 Refunds / Reversals

NaviGen does not automatically reverse billing for edge cases.
Refunds require:

  • explicit internal handling  
  • manual adjustments in accounting  
  • never driven by client events  

Tokens marked "invalid" after reuse have no billing impact.

--------------------------------------------------------------------
5.9 Billing & Campaign Lifecycles

Redeems only bill when:

  • They occur inside the campaign's active window  
  • The token was issued during that window  
  • finance.json has a defined entry for the relevant sectorKey/countryCode  

If a campaign is disabled mid-flight:
  • Customers may still have valid ARMED codes  
  • Redeem is blocked by API Worker  
  • No billing occurs  

--------------------------------------------------------------------
5.10 Billing & Dashboard Interaction

Dash shows:
  • Campaign counts (armed, redeems, invalid)
  • Operational status (OK / Needs Attention)
  • Analytics & QA narratives

Dash does **not** display:
  • billing fees  
  • financial summaries  
  • redeem value estimates  

All financial data lives internally.

--------------------------------------------------------------------
5.11 Anti-Circumvention Guarantees

Billing depends solely on redeem tokens.  
This ensures:

  • No manual entry by cashier can create a billable event  
  • No merchant can avoid billing by skipping QR scanning  
  • No customer UI or deep link manipulations can trigger billing  
  • No invalid or replayed tokens create billable events  

Merchants have **zero control** over what is billed; the backend decides.

--------------------------------------------------------------------
5.12 Out-of-Scope

Section 5 does not define:

  • QR system (Section 2)
  • Promo UX (Section 3)
  • Analytics & QA rules (Section 4 + 90.x)
  • Identity/alias resolution (Section 1 & 9)
  • Data schemas (Section 8)

It defines **how billable events are derived** from verifiable backend state.

--------------------------------------------------------------------

6. USER INTERFACE MODULES

6.1 Purpose & Scope

This section defines the user-facing interface modules of the NaviGen platform.
These modules are shared across all contexts, devices, and PWA/browser modes.
They are responsible for presenting content, triggering interactions, collecting
user input, and orchestrating promotion- or navigation-related flows.

UI modules are:
  • Presentation-only (no business logic)
  • Fully translation-driven (Section 7)
  • Modal-based where appropriate (Section 12)
  • Designed for responsive and PWA-friendly operation

They exist alongside, but do not override:
  • QR logic (Section 2)
  • Promotion flows (Section 3)
  • Dashboard (Section 4)
  • Workers & data systems (Sections 8–9)

--------------------------------------------------------------------

6.2 Location Profile Modal (LPM)

6.2.1 Purpose  
The LPM is the central UI surface for any business location. It provides a
snapshot of the merchant profile and all user-facing actions.

6.2.2 Activation & Entry Points  
The LPM appears when:
  • The user opens <context>?lp=<locationID>
  • The app deep-links via scanned Info QR
  • A business is tapped in a results list
  • Dash links redirect to the location page
  • LPM may be opened by deep link (?lp=) or internal navigation; only deep links originating from /out/qr-scan/… represent a Static QR scan event.

6.2.3 Structure  
The LPM contains:
  • Header (location name, save/unsave)
  • Contact channels (call, email, map, socials)
  • Category/context tags
  • Media carousel or static image
  • Ratings block
  • Promotion entry point (“Promotion” CTAs)
  • Details (description, hours, links)

6.2.4 Supported Interactions  
  • Save / Unsave location  
  • Navigate to map  
  • Open promo modal  
  • Open share modal  
  • Visit website / socials  

6.2.5 Context Integration  
Business visibility in navigation is sourced from contexts.json.
LPM rendering is consistent regardless of context entry path.

6.2.6 LPM in PWA Mode  
Identical behavior with adaptive layout:
  • Safe-area padding for standalone  
  • Consistent modal behavior offline (with cached profiles)  
  • Promo QR paths require connectivity only at redeem stage

6.2.7 Out-of-Scope  
Promo logic defined in Section 3, modals defined in Section 12.

--------------------------------------------------------------------

6.2.8 Owner Platform Entry Points (LPM)

The Location Profile Modal (LPM) is the primary contextual entry point for owner actions.

Owner actions are invoked through a dedicated modal:
• “Owner settings”

Trigger:
• User taps the 📈 (Stats) entry on the LPM.

Behavior is state-driven:

--------------------------------------------------------------------
A) Owned LPM + Valid Owner Session

• 📈 opens the Dash normally for that LPM.
• No owner prompt is shown.

--------------------------------------------------------------------
B) Owned LPM + No Owner Session

• Dash access is blocked.
• 📈 MUST open the “Owner settings” modal (not a redirect).

“Owner settings” modal (owned/no-session) MUST include:
• Restore access
    - instruction: use the Payment ID (pi_...) from your Stripe receipt or payment email
    - CTA: opens Restore Access modal
• See example dashboards
    - CTA: opens Example Dashboards modal (3–6 example cards)

Campaign initiation MUST also be available in this state.
The Owner Settings modal MUST include:
• Restore owner access
• Run a campaign
• Owner Center
• See example dashboards

--------------------------------------------------------------------
C) Unowned LPM

• Dash access is blocked.
• 📈 MUST open the “Owner settings” modal (not a redirect).

“Owner settings” modal (unowned) MUST include:
• Run campaign
    - CTA: opens Campaign Setup / Campaign Management in guest mode for this LPM    
• See example dashboards
    - CTA: opens Example Dashboards modal (3–6 example cards)

--------------------------------------------------------------------
D) Owner Settings Modal UI Contract

• The modal is opened in-context from the LPM and must be dismissible (X).
• Modal content MUST be translation-driven (t(key)).
• The modal MUST NOT show any real analytics data for blocked states.
• The modal MAY include a “Find my location” helper action (optional).

--------------------------------------------------------------------

6.3 My Stuff Modal (MSM)

6.3.1 Purpose  
MSM is the user’s private utility panel. It contains no backend-driven state and
does not interact with promotions.

6.3.2 Activation  
Triggered by bottom-band icon or direct component call.

6.3.3 Sections  
A) **Favorites / Saved Locations**  
   Managed by localStorage. Provides:
     • list of saved ULIDs/slugs  
     • open LPM from saved list  
     • remove favorite  

B) **Purchases (Donation History)**  
   Device-local history of completed donation sessions:
     • Session ID  
     • Amount & currency  
     • Timestamp  
   Not synced, not part of billing (Section 5).

C) **Language**  
   Allows selecting the current UI language, persisted in localStorage and
   immediately applied.

D) **Data Tools**  
   • Export My Data (local only)  
   • Reset My Data (clears favorites, purchases, preferences)  
   • Opens Terms & Privacy modal  

E) **Terms & Policy**  
   Links into Terms modal.

6.3.4 Local Data Model  
MSM uses only device-local keys:
  • favorites[]  
  • myPurchases[]  
  • lang  
  • ephemeral flags  
No tokens, metrics, or campaign data ever appear here.

6.3.5 MSM in Promotion Flow  
MSM:
  • does not interrupt promo QR polling  
  • does not access redeem tokens  
  • has no impact on cashier/customer confirmations  
  • is unrelated to QA or billing

6.3.6 MSM in PWA Mode  
Fully functional offline:
  • favorites and purchases always accessible  
  • data tools remain operational  
  • translations source from cached i18n bundles  

6.3.7 Out-of-Scope  
Modal internals in Section 12; translation behaviors in Section 7.

--------------------------------------------------------------------

6.4 Donation & Support Flow (👋)

6.4.1 Purpose  
Provides a structured and optional way for users to support NaviGen, replacing
the “Install” pin once the app is in PWA mode.

6.4.2 Trigger  
In browser mode: 📌 (install pin)  
In PWA/standalone mode: 👋 (support pin)

6.4.3 Multi-Stage Donation Modals  
Stage 1 — Intro: “Support the Vibe”  
Stage 2 — Tier selector (e.g., €3 / €5 / €10 / Decline)  
Stage 3 — Thank-you modal for returning supporters  

All stages are modal-managed using Section 12 framework.

6.4.4 Local Purchase History  
After successful donation, the Stripe return handler writes:
  • session_id  
  • amount  
  • timestamp  
into localStorage.myPurchases.

6.4.5 Behavior Notes  
  • MSM displays donations; Dash does not.  
  • Donation does not influence promo or analytics logic.  
  • All texts fully translation-driven.

6.4.6 Out-of-Scope  
Stripe process and backend handling are external to this specification.

--------------------------------------------------------------------

6.5 INSTALL & PWA LIFECYCLE (📌 → 👋)

6.5.1 Purpose  
Define the unified browser → PWA → support lifecycle, ensuring predictable
install behavior and a stable standalone UX.

6.5.2 Install Entry Points (📌)  
When running in a browser (not standalone):
  • 📌 appears in the header  
  • Tapping 📌 always triggers install UX:
        - If beforeinstallprompt (BIP) is supported → OS-native install dialog  
        - Otherwise → Install Instructions modal  

6.5.3 beforeinstallprompt (BIP) Handling  
When BIP fires:
  • event is stored  
  • 📌 becomes active  
  • User tap → promptEvent.prompt()  
  • If accepted:
      - PWA installed
      - Tab flips from 📌 → 👋 without reload
  • If dismissed:
      - 📌 uses fallback modal (instructions)

6.5.4 Install Instructions Modal (Fallback)  
If BIP is not available:
  • Tapping 📌 opens translated modal with:
      - install guidance  
      - safe fallback CTA (“Got it”)  

6.5.5 Standalone Mode Detection  
Standalone state detected via:
  • matchMedia('(display-mode: standalone)')  
  • navigator.standalone (iOS)

In standalone mode:
  • Pin becomes 👋  
  • Install flow removed  
  • Donation flow active  
  • Safe-area paddings applied  
  • All navigation and promo flows work identically  

6.5.6 Donation Entry (👋)  
Once installed:
  • 👋 is the **only** entry to donation UI  
  • First tap → Support Intro  
  • Second tap → Tier selection  
  • After donation → Thank-you modal  
  • Further taps always show Thank-you  

Donation is purely opt-in and always user-triggered.

6.5.7 Offline & Caching Expectations  
Service worker ensures:
  • Shell, JS, CSS, and i18n bundles cached  
  • LPM loads if profile cached  
  • MSM fully functional offline  
  • Promo QR display works offline  
  • promo-qr issuance and redeem always require network  
  • redeem-status polling requires network

6.5.7.1 Cache Policy Matrix (Authoritative)

The service worker MUST apply different caching strategies
based on the sensitivity of the requested resource.

--------------------------------------------------------------------
Resource Class                                                  | Cache Policy
--------------------------------------------------------------------
App shell (index.html)                                          | Network-first
JS bundles (app.js, dash.js, etc.)                              | Network-first with versioning
CSS / images / fonts                                            | Cache-first (hashed assets only)
Translation bundles (/data/i18n)                                | Cache-first with version bump
--------------------------------------------------------------------
/api/* endpoints                                                | Network-only (no cache)
/dash/* routes                                                  | Network-only (no cache)
/owner/* endpoints                                              | Network-only (no cache)
--------------------------------------------------------------------
Owner interstitial responses                                    | Network-only
Owner session exchange (/owner/stripe-exchange, /owner/restore) | Network-only
--------------------------------------------------------------------

Rules:
• Network-only means the request MUST bypass service worker cache entirely.
• No fallback-to-cache is permitted for owner- or authority-sensitive routes.
• Cached responses MUST NEVER be used to infer ownership or access.

6.5.7.2 Service Worker Update Strategy (Authority-Safe)

The service worker update strategy MUST prioritize correctness
over aggressive offline continuity.

Update rules:

• The service worker MUST call skipWaiting() on install.
• The service worker MUST call clientsClaim() on activation.
• Old service worker instances MUST NOT continue serving UI after activation.

Rationale:
• Ownership, access, and analytics visibility may change at any time.
• Delayed activation risks stale authority or privacy state.
• Immediate takeover ensures UI always reflects current backend truth.

Failure handling:
• If a service worker update fails, the app MUST fall back to
  network-delivered resources rather than cached authority-sensitive content.

6.5.8 Deep Links & QR in PWA  
Info QR:
  • Opens LPM identically in browser or PWA  
  • lp cleared after modal mounts  

Promo QR:
  • Pages Worker → API Worker → redirect → Cashier confirmation modal  
  • PWA mode does not alter promo semantics  

6.5.9 Behavioral Guarantees  
  • 📌 always produces install UX  
  • 👋 always produces donation UX  
  • No automatic donation modals  
  • No silent install attempts  
  • PWA mode never alters QR or promo behavior  
  • Standalone layout always safe-area aware  

6.5.10 Out-of-Scope  
  • QR logic in Section 2  
  • Promo flow in Section 3  
  • SW implementation details  
  • Worker internals (Section 9)

--------------------------------------------------------------------

6.6 Search UI

6.6.1 Purpose  
Provide fast client-side filtering of context-based results.

6.6.2 Context-Based Search  
Results come from:
  /api/data/list?context=<ctx>  
Filtering is strictly local.

6.6.3 Name-Based Search  
Case- and accent-insensitive matching using localized names.

6.6.4 Multilingual Display  
All labels and category names use t(key).

6.6.5 Limitations  
Not global, not fuzzy, not personalized.

6.6.6 Out-of-Scope  
Search algorithms described in Section 13.

--------------------------------------------------------------------

6.7 Shared Navigation Components

6.7.1 Bottom Navigation Band  
Hosts:
  • Home / Context  
  • AI (if enabled)  
  • My Stuff  
  • More/tools  

6.7.2 Header Pin (📌 / 👋)  
Unified across app + Dash, using PWA lifecycle.

6.7.3 System Toasts  
Used for copy confirmations, thank-you, non-blocking notices.

6.7.4 Utility Buttons  
Share, Map, Contact, Save, Promo.

6.7.5 Out-of-Scope  
Component implementation details belong to Section 12.

6.7.6 Root Shell Entry (No-Context)

When the app is opened without a navigation context (root shell / no context list),
NaviGen presents two non-location action groups above all other groups:

• Business Owners
• Individual Users

These groups provide clear entry points without requiring an LPM context.

Rules:
• Business Owners and Individual Users are not data-driven location lists.
• They must not reuse Popular/Accordion location button styles.
• Their entries are rendered as card-style action buttons (modal-card language).
• Both groups are collapsed by default when both are present.
• In root/no-context mode, Popular should not be shown if it would be empty.

Business Owners actions (minimum set):
• How it works? → opens an explanatory modal
• Run campaign → opens a search-first “Select your business” (SYB) modal
  – SYB opens blank and does not render a generic location list up front
  – SYB presents three static owner routes:
    • Create a location
    • Import from Google
    • Recently used
  – Existing locations appear only after the owner types a query that satisfies the search threshold
  – Selecting an existing location routes into the owner / commercial flow
• Owner Center → opens Owner Center modal
• See example dashboards → opens Example Dashboards modal

Individual Users actions (minimum set):
• How it works? → opens an explanatory modal
• Install / Support → opens install/support UX entry
• My Stuff → opens MSM
• Promotions → opens Promotions modal
• Help / Emergency → opens Help modal

All labels and descriptions in these groups MUST be translation-driven (t(key)).

--------------------------------------------------------------------

6.8 Out-of-Scope for Section 6

This section does not define:
  • Modal machinery (Section 12)
  • Translation system (Section 7)
  • Promo mechanics (Section 3)
  • QR system (Section 2)
  • Data model (Section 8)
  • Worker responsibilities (Section 9)
  • Dashboard analytics (Section 4)

Section 6 defines **presentation-level UI modules**, not backend logic.
For modal mechanics and shared UI behaviors, see Section 12.
For PWA lifecycle, see Section 6.5 and the high-level overview in Section 1.9.

7. TRANSLATION & LOCALIZATION SYSTEM (t(key))

7.1 Purpose of the Translation Layer

NaviGen is a multilingual platform. All textual UI (App, Modals, Dash, Workers’ human output)
is driven by a unified translation engine exposed as:

    t(key) → string

Every user-facing string must be addressed through a translation key, never inline literals,
ensuring:

  • consistent language across the whole app shell and Dash
  • safe fallback behaviors (EN as default)
  • unified updates through a single translation source
  • clean separation of product logic vs. UI language

This section documents the translation mechanism, not the full list of keys.
Key inventories live outside the spec and are maintained in GSheets and exported to JSON.

7.2 Translation Data Sources

The translation pipeline consists of:

  A) GSheets: “language_data” table  
     • First column: Comment (developer-facing)  
     • Second column: Key  
     • Following columns: language codes (en, hu, it, he, …)  
     • Row 2 toggles: marks which languages are actively exported  
     • Rows ≥3: translation entries

  B) Apps Script → exports the sheet into:
     /data/i18n/<lang>.json

  C) Runtime loader (i18n.js):
     • pickLang() determines user’s language:
         1) explicit user selection (localStorage.lang)
         2) path-based language prefix
         3) navigator.languages
         4) EN fallback
     • loads <lang>.json into the active dictionary
     • t(key) resolves strings with fallback to EN or to the literal key

7.3 Translation Strategy (What Belongs Here)

The specification does NOT enumerate every UI text or modal content.
Instead, it defines the rules all UI must conform to:

  • Every permanent UI string must have a stable key (metric.*, dash.*, modal.*, promotion.*, qr.role.* …)
  • Modal and UI components must never embed free text; all text must be t(key)-driven
  • Complex narratives (Analytics, QA, Promo flows) must use placeholder-based templates:
        e.g. “Promo QR shown {armed} times”
        e.g. “≈ {percent}%”
  • Grammar-sensitive constructs must avoid English-only patterns:
        e.g. plural suffix “s”, ordered noun-number pairs, date ranges
  • For lists of modals or components, definitions stay in the UI/UX sections (Section 12), not here
  • For Dash keys, translation keys follow dash.* namespaces
  • For Workers, human-readable diagnostics rely on translation keys only when output appears in Dash

Section 7 defines how translation works —  
Section 12 defines WHAT modals exist —  
The translation sheet defines the ACTUAL keys.

7.4 Minimum Mandatory Key Domains

All pages and surfaces must draw text from one of these domains:

  promotion.*                 (promotion modal texts)
  campaign.*                  (campaign actions/notes)
  qr.role.*                   (QR modal semantic labels)
  metric.*                    (Click Info metric names)
  dash.*                      (all Dash headers, summaries, tables, QA texts)
  modal.*                     (generic modal framework text)
  myStuff.* / purchaseHistory.* (MSM & user tools)
  install.*                   (install/pinned modal)
  common.*                    (general UI: OK, Cancel, Loading, etc.)

These domains are defined at architectural level.
Actual key counts grow with the UI, but the domains remain stable.

7.5 Locale-Sensitive Constructs

Some languages cannot tolerate English word order, plural suffixes, or mixed placeholders.
Therefore:

  • Do not concatenate English-based grammar in code (e.g. “review” + “s”)
  • Use separate singular vs. plural templates:
        dash.analytics.rating.summary.singular
        dash.analytics.rating.summary.plural
  • Use label-first ordering for counts (“Static scans – 16”) rather than English (“16 Static scans”)
  • QR Analytics, Campaign Analytics, and QA texts must always be t(key)-driven
  • Dash period options (1 day, 7 days, 14 days, 28 days, 56 days, etc.) must be localized via t()

7.6 Fallback Behavior

If a key is missing from the user’s language:

  • t(key) falls back to English  
  • If missing in EN, it falls back to the literal key  
  • Dash and Modals must handle missing-text cases gracefully  
  • No UI may fail due to missing translations (crashes are unacceptable)

7.7 Modal Inventory and Translation Responsibility

Modal definitions themselves do NOT live in Section 7; they are described in:

  • Section 12 (Popular Components & UX Patterns)
  • Section 3 (Promotion UX flows)
  • Future Modal Inventory appendix (internal)

Section 7 requires:

  • All modal titles, body texts, CTA labels, notes, hints = translation keys  
  • No hard-coded strings inside modal-injector.js except fallbacks

7.8 Translation Lifecycle

Steps:

  1) Developer introduces new UI text → chooses a new key in the appropriate domain  
  2) Adds a row in language_data (Comment | Key | en | …)  
  3) Marks exported languages “yes”  
  4) Apps Script rebuilds the <lang>.json files  
  5) Deployment loads new keys automatically  
  6) Dash & App reflect new translations without structural changes

This ensures the specification remains stable regardless of how many keys the UI grows to.

7.9 Translation Quality Requirements

  • All user-visible analytics narratives (Click Info, QR Info, Campaigns, QA) must be fully translated  
  • Nulls, missing fields, and number formatting must be structurally safe  
  • Writers provide clear English baselines; translators localize grammar, not code  
  • Emojis may vary across locales; never rely on monochrome vs. colored glyphs

7.10 Out-of-Scope Items for Section 7

The following are intentionally *not* listed here:

  • Full key inventory (600–700 keys)  
  • Modal definitions  
  • Dash UI structures  
  • Component-level props and parameters  
  • Developer-only debug labels

These belong to:

  • UI Spec (Section 12)  
  • Dash Spec (Section 4)  
  • Data Model (Section 8)  
  • Extension Architecture (90.x)

Section 7 provides the translation architecture — not the dictionary.

--------------------------------------------------------------------

8. DATA MODEL

8.1 Purpose

The NaviGen data model is the canonical definition of all system-level data
objects consumed by:

  • Pages Worker (routing, deep links, promo QR flow)
  • API Worker (stats aggregation, campaign resolution, billing, QA flags)
  • App Shell (LPM, modals, PWA logic)
  • Dashboard (Click Info, QR Info, Campaigns, Analytics)
  • Promotion Token System (redeem, invalid, confirmations)

The data surfaces described here may originate from controlled exports
(GSheets/internal pipelines) or KV-backed runtime authority.

Once Phase 8 is enabled, runtime profile authority is KV-backed and is not a
read-only JSON resource.

--------------------------------------------------------------------

8.2 File Overview

The platform uses a small number of structured data surfaces:

  1) `profile_base:<ULID>` + `override:<ULID>` in KV – runtime profile authority
  2) campaigns.json     – deprecated
     Campaign lifecycle and entitlement are KV-authoritative.
     No JSON file is used for runtime campaign logic.
  3) finance.json       – sector/country pricing metadata
  4) contexts.json      – navigation context hierarchy (URL structure)
  5) i18n bundles       – /data/i18n/<lang>.json (see Section 7)
  6) profiles.json      – legacy export / migration artifact only; not runtime authority

Runtime location authority is KV-backed.
Static JSON may persist for export, migration, archival, or audit purposes,
but runtime reads MUST NOT fall back from KV authority to profiles.json once
Phase 8 is enabled.

--------------------------------------------------------------------

8.3 Location Profiles (Profiles) — Phase 8 Runtime Authority

Location Profiles define the human-readable, discoverable, and presentational
metadata of a location.

From Phase 8 rollout start, runtime profile authority is KV-backed:

• `profile_base:<ULID>`             – canonical published base record
• `override:<ULID>`                 – current published override
• `override_draft:<ULID>:<actorKey>` – non-authoritative draft state

Existing public locations MUST be preseeded into KV before the Phase 8 runtime
switch is enabled.

At cutover, all preseeded legacy public locations MUST enter runtime discoverability
as `visible` by default unless they already resolve to `promoted` through an active
entitlement state.

profiles.json may remain as a legacy export / migration artifact only.
It is not authoritative for runtime reads, publish, list, or search.

--------------------------------------------------------------------

8.3.1 Profile Definition & Scope

Each profile corresponds to exactly one location and includes:

• locationID (slug)                          – canonical human identifier
• locationName (multilingual)                – UI display name
• groupKey / subgroupKey                     – high-level classification (exactly one each)
• context                                    – one or more navigation paths (semicolon-delimited memberships)
• tags                                       – customer-intent match terms used for search matching
• coordinates                                – latitude / longitude
• contact info                               – phone, email, website, socials
• address / listedAddress / postalCode / city / adminArea / contact.countryCode – canonical published address fields used by indexing, validation, and SearchShard partitioning
• detailSlug                                 – optional extra slug for landing
• qrUrl (optional override)                  – Info QR landing override
• media                                      – images, icons, banners
• visibility & priority flags
• business-specific extensions

Profiles are **pure metadata**.

Profiles MUST NOT store:
• ownership
• campaign entitlement
• analytics
• billing state
• operator permissions

Those concerns are enforced exclusively by the API Worker and KV-backed systems.

--------------------------------------------------------------------

8.3.2 Canonical Schema & Source Attribution

The canonical field schema consumed by:

• App Shell (LPM)
• Dashboard (Dash)
• Pages Worker routing (context, qrUrl)
• API Worker profile and listing endpoints

is preserved in the published profile shape, but runtime authority is carried by:

• `profile_base:<ULID>`
• `override:<ULID>`

contexts.json remains the authoritative catalog of valid navigation shells.

External datasets (e.g. OpenStreetMap / OSM, commercial directories,
manual research) are treated as **ingestion sources**, not parallel runtime authorities.

NaviGen does not expose raw OSM tag structures to the UI layer.
Imported/provider data is normalized into the published profile schema.

--------------------------------------------------------------------
Minimal Sources Structure (Non-Redundant)

Each profile MAY include an optional `sources` object containing provenance only.

This block MUST NOT duplicate normalized profile fields.

Example (conceptual):

sources: {
  osm?: {
    id: string,                // e.g. "way/11643310"
    type?: string,             // "node" | "way" | "relation"
    fetchedAt: ISO-8601,
    license: string,
    rawTagsRef?: string        // pointer to raw archive (not embedded)
  },
  other?: [
    { name: string, ref?: string, fetchedAt?: ISO-8601 }
  ]
}

Rules:
• `sources` are metadata only (provenance + audit).
• Normalized profile fields remain single source of truth for UI.
• Raw OSM tags are never embedded in profiles.json.
• Licensing and attribution obligations MUST be satisfied via sources metadata.

--------------------------------------------------------------------

8.3.2a Load-Bearing Field Binding (Phase 8 Implementation Contract)

For Phase 8 implementation, the following field bindings are authoritative:

• Slug generation source:
  - publish-time slug generation uses the current canonical business name field from the draft / effective published profile
  - if multilingual `locationName` exists, API Worker MUST use one deterministic locale source consistently for slug generation
  - the chosen source locale MUST remain stable for that location’s first publish

• Coordinates source:
  - publish-time geo normalization uses the canonical coordinates fields only
  - coordinates are the values stamped into identity at publish

• Search shard country source:
  - `countryCode` for `SearchShardDO` partitioning is derived from the effective published contact country field
  - if absent, fallback is `"XX"`

• Indexed address fields:
  - indexed address terms are derived only from the canonical published address fields:
    `address`, `listedAddress`, `postalCode`, `city`, `adminArea`

• Published read response:
  - `/api/data/profile` and `/api/data/item` return the merged effective published profile only
  - draft-only fields or provider-only transient fields MUST NOT leak into public responses
  
--------------------------------------------------------------------

8.3.3 Example Location Flag (Analytics Showcase)

NaviGen may designate certain locations as **Example Locations** for analytics
demonstration and onboarding.

Example Location flag:

• boolean, set internally by NaviGen
• not editable by Owners
• not derived from campaign or ownership state

Rules:
• Only explicitly flagged locations may be used for Example Dash routing
• Example Locations use real analytics and real campaigns (if any)
• Example designation does NOT imply endorsement or performance guarantees
• Example Locations MUST be visually marked as examples in UI

Example designation exists solely for demonstration purposes.

--------------------------------------------------------------------

8.3.4 Profile Override Model (Owner Edits)

NaviGen supports owner-provided profile edits via a **non-destructive override
layer**.

Overrides allow Owners to modify a limited subset of profile fields
without mutating the canonical base record `profile_base:<ULID>`.

--------------------------------------------------------------------
A) Override Storage Model

Overrides are stored per location as server-side KV entries.

Keys:
• override:<ULID>                 – active published delta relative to `profile_base:<ULID>`
• override_log:<ULID>:<timestamp> – append-only audit trail

The canonical base record (`profile_base:<ULID>`) is immutable via normal owner edit flows.

--------------------------------------------------------------------
B) Override Schema (Partial, Field-Level)

Overrides are a **partial structure** matching the published profile schema,
restricted to the editable whitelist defined in Section 92.3.

Rules:
• Overrides MAY include only whitelisted fields
• Overrides MUST NOT include non-whitelisted fields
• Missing fields do NOT imply deletion

Example (conceptual):

override:<ULID> = {
  description: "Updated business description",
  contact: {
    phone: "+39 55 123 4567",
    website: "https://example.com"
  },
  openingHours: "...",
  media: {
    coverImage: "...",
    images: [ ... ]
  }
}

--------------------------------------------------------------------
C) Merge Rules (Deterministic)

The effective profile is computed server-side using:

effectiveProfile = deepMerge(baseProfile, override)

Rules:
• Base profile fields are defaults
• Override fields replace base fields
• Nested objects are deep-merged
• Arrays in override REPLACE base arrays entirely
• Null values MUST NOT remove base fields

Deletion semantics:
• Owners cannot delete base fields
• Optional data may be cleared only via allowed empty values

--------------------------------------------------------------------
D) Read Path (Authoritative)

All profile reads MUST return the merged effective profile.

Authoritative read paths:
• App Shell: GET /api/data/profile?id=<slug>
• Dash:      GET /api/data/profile?id=<slug>

Rules:
• API Worker performs merge before returning data
• Clients MUST NOT merge base and override themselves
• Clients MUST NOT access override KV directly

--------------------------------------------------------------------
E) Consistency & Caching Rules

• Overrides take effect immediately after successful write
• Client-side caching beyond normal HTTP semantics is forbidden
• Service Worker MUST NOT cache profile responses that include overrides

--------------------------------------------------------------------
F) Audit & Safety

Every override write MUST produce an override_log entry.

Override logs are:
• append-only
• timestamped
• internal-only

Each log entry includes:
• ULID
• edited fields
• timestamp
• payment_intent.id
• initiationType

Override logs are never exposed in UI.

--------------------------------------------------------------------
G) Non-Goals (Explicit)

Profile overrides do NOT:
• create new profile fields
• allow deletion or mutation of base data
• permit bulk edits
• expose edit history to Owners
• bypass QA or ingestion pipelines
• affect ownership, entitlement, or billing
• suppress discoverability or disadvantage competitors

Overrides exist solely to allow accountable,
reversible presentation-layer edits by an Owner.

--------------------------------------------------------------------

8.3.5 Locations Project (KV-Based Runtime Authority)

The Locations Project establishes KV-backed profile authority while preserving
client contract stability.

--------------------------------------------------------------------

A) Canonical Base Record (KV Authority)

Each location SHALL have a KV-backed canonical record:

Key:
    profile_base:<ULID>

The base record MUST conform to the existing published profile schema.
Client-facing contract remains unchanged.

Slug (locationID) is immutable after creation.

From Phase 8 rollout start, public runtime reads MUST use KV authority only.
profiles.json is not a runtime fallback.

--------------------------------------------------------------------

B) Override Layer (Published State)

Key:
    override:<ULID>

Properties:
• Partial structure (whitelist-limited)
• Merged server-side with profile_base
• Represents the active public state
• Never mutates base record

Effective profile = deepMerge(profile_base, override)

Merge invariants:
• Nested objects deep-merge
• Arrays replace arrays
• Null does not delete base fields

--------------------------------------------------------------------

C) Draft Layer

Key:
    override_draft:<ULID>:<actorKey>

Drafts:
• Are unlimited
• Are not indexed
• Are not publicly visible
• Do not affect discoverability
• Do not affect campaign eligibility

Only publish promotes draft → override.

--------------------------------------------------------------------

D) Audit Layer

Override audit semantics are defined in Section 8.3.4.F.
KV-based authority uses the same audit structure and invariants.

--------------------------------------------------------------------

8.4 Campaign Definitions (KV-Authoritative)

Campaigns are no longer sourced from a static campaigns.json file.

As of the Campaigns Project completion, **campaign state is fully KV-backed
and enforced exclusively by the API Worker**.

Campaign lifecycle and entitlement are KV-authoritative.
No JSON file is used for runtime campaign logic.

Static JSON campaign definitions are deprecated and retained only for
historical reference or migration tooling.

--------------------------------------------------------------------

8.4.1 Canonical Campaign Storage (Authoritative)

All campaigns are stored and enforced via KV under the API Worker.

Primary KV keys:

• campaigns:byUlid:<ULID>   → array of campaign rows for a location
• campaign_group:<campaignGroupKey> → shared parent record for a multi-location campaign
• status:<ULID>             → derived entitlement + QA flags (computed)

Each campaign row is immutable once written, except for status transitions
(Paused / Finished / Suspended) performed by Owner actions.

No client, Pages Worker, or static dataset is authoritative for campaigns.

--------------------------------------------------------------------

8.4.2 Campaign Row Schema (KV)

Each campaign row stored under campaigns:byUlid:<ULID> has the following
normalized schema:

• locationULID              – canonical ULID (authoritative)
• locationSlug              – original slug used at creation (informational)
• campaignKey               – stable identifier of the location-level campaign row
• campaignGroupKey          – optional shared identifier linking child rows to one multi-location parent campaign
• campaignName              – human-readable name (“10% off your purchase”)
• brandKey                  – branding reference (optional)
• sectorKey                 – lookup into finance.json
• context                   – semicolon-delimited navigation contexts
• campaignType              – controlled vocabulary (Discount, Dash access, etc.)
• campaignScope           – "single" | "selected" | "all"
• targetChannels            – e.g. QR, Social, Email
• startDate                 – YYYY-MM-DD (inclusive)
• endDate                   – YYYY-MM-DD (inclusive)
• status                    – Active | Paused | Finished | Suspended
• statusOverride            – optional hard override (authoritative)
• offerType                 – Info | Discount | Access | Event
• discountKind              – Percent | Amount | None
• campaignDiscountValue     – numeric value (minor units or percent)
• eligibilityType           – Everyone | First-time | Repeat | Staff-only
• eligibilityNotes          – optional human notes
• utmSource / utmMedium / utmCampaign – analytics enrichment only
• notes                     – internal / owner notes
• createdAt                 – ISO-8601 timestamp
• createdBy                 – initiationType (owner | agent | platform)

All dates are normalized to YYYY-MM-DD at write time.
No runtime date parsing is permitted in the client.

--------------------------------------------------------------------

8.4.2.1 Network Campaign Parent Record (Multi-Location Only)

When campaignScope != "single", the API Worker MUST persist a shared parent record:

• campaign_group:<campaignGroupKey>

The parent record holds:
• shared budget / plan anchor
• common offer definition
• common campaign dates
• scope mode
• seed location ULID
• createdAt / createdBy

Rules:
• child location rows remain authoritative for execution, redeem, analytics, and local state
• every included location materializes its own child campaign row under campaigns:byUlid:<ULID>
• all child rows belonging to the same multi-location campaign MUST share the same campaignGroupKey
• removing a location from scope must never delete historical rows or historical analytics

--------------------------------------------------------------------

8.4.3 Campaign Status Semantics (Authoritative)

Campaign status is enforced server-side by the API Worker and interpreted
consistently across:

• promo QR issuance
• redeem validation
• billing
• dashboard access
• UI decoration (🎁, promoted ordering)

Status meanings:

• Active  
  Campaign row is eligible for promo QR issuance and redeem
  if today ∈ [startDate, endDate].

• Paused  
  Owner-initiated temporary stop.
  Campaign row exists but is NOT eligible for promo QR or redeem.

• Finished  
  Terminal state after campaign completion.
  Finished campaigns are NEVER eligible again.

• Suspended  
  Temporary stop.
  May be applied:
  - to an entire single-location campaign,
  - to a whole multi-location campaign (propagated across included child rows), or
  - to one child location row only as a local override.

  Effects:

  - CampaignEntitled = false for the affected row(s)
  - Promo QR issuance disabled
  - Redeem disabled
  - 🎁 decoration removed
  - Status dot becomes grey
  - Campaign remains visible in Campaign Management

  Resume:

  - Clears statusOverride
  - Restores eligibility only if within campaign window

• Excluded  
  Child row was previously part of a multi-location campaign but is no longer
  included in the active location set.

  Effects:

  - CampaignEntitled = false for that child row
  - Promo QR issuance disabled
  - Redeem disabled
  - historical analytics and audit remain preserved

NaviGen does NOT automatically suspend campaigns due to payment disputes.
Only explicit backend state transitions are authoritative.

--------------------------------------------------------------------

8.4.4 Campaign Entitlement Spine (Authoritative)

A location is considered **CampaignEntitled** when **at least one** of its campaign rows
meets ALL of the following:

• effectiveStatus === "Active"  
• statusOverride is empty or not equal to "Suspended"  
• today ∈ [startDate, endDate] (inclusive)

effectiveStatus is derived as:

    effectiveStatus = statusOverride || status

Derived entitlement fields (computed by API Worker):

• campaignEntitled: boolean  
• activeCampaignKeys: string[]  
• activeCampaignKey: string (deprecated; if present it MUST equal activeCampaignKeys[0] or "")
• campaignEndsAt: YYYY-MM-DD | "" (only when exactly one active campaign exists)

If multiple campaigns are entitling:

• All are considered active.  
• No implicit primary campaign is selected.  
• GET /api/promo-qr without explicit campaignKey MUST return HTTP 409.  
• Client surfaces requiring a single campaign context (e.g., Promotion details, QR view)
  MUST present a campaign selector.

These derived fields are exposed via:

    GET /api/status?locationID=<slug|ULID>

/api/status MUST return activeCampaignKeys as an array under all circumstances.
Clients MUST treat activeCampaignKeys as authoritative and MUST NOT rely on activeCampaignKey.

Clients MUST NOT compute entitlement themselves.

--------------------------------------------------------------------

Campaign Scope (Authoritative)

Campaign scope determines which existing locations announce and execute a campaign.

User-facing labels:

• "This location only"   → internal value "single"
• "Selected locations"   → internal value "selected"
• "All my locations"     → internal value "all"

Plan-to-Scope Mapping (Authoritative UX Rule)

Campaign scope is a consequence of Plan tier, not hidden backend gating.

• Standard
  - show only: "This location only"

• Multi
  - show: "This location only" / "Selected locations" / "All my locations"

• Large
  - show: "This location only" / "Selected locations" / "All my locations"
  - larger allowed location capacity

• Network
  - show: "This location only" / "Selected locations" / "All my locations"
  - contract-defined or open-ended capacity

Rules:
• The owner MUST encounter the Plan step before multi-location scope is offered,
  unless Campaign Management already has an active qualifying Plan in context.
• Standard MUST NOT display multi-location options as disabled surprises.
• Multi / Large / Network MUST expose scope choice explicitly.

Eligibility source:

• Only existing locations already proven on the current device are eligible.
• A qualifying plan with multi-location capacity is required for "selected" and "all".
• Choosing "selected" or "all" auto-creates the derived portfolio from the current seed location if it does not yet exist.
• Campaign scope does not create locations; it operates only on already-existing locations.

Scope values:

• "single"
    Campaign applies only to the current location row.

• "selected"
    Campaign applies only to explicitly checked eligible locations in the derived portfolio.
    The current seed location starts preselected but MAY be unchecked.
    No future locations are added automatically.

• "all"
    Campaign applies to all currently eligible locations in the derived portfolio.
    Future eligible locations later added on the same device inherit the campaign automatically.

Rules:

• Plan choice MUST precede scope choice in owner-facing campaign flows.
• Scope MUST be explicitly chosen at campaign creation.
• Standard plans expose only "single".
• Multi, Large, and Network plans expose "single", "selected", and "all".
• Redeem validation remains token-based and location-agnostic.
• Billing / redeem accounting remains per ULID and per child campaign row.
• Shared budget / plan state is held at the parent campaign-group level.

Changing scope after creation:
• Allowed only while parent campaign status is Active or Paused.
• MUST update campaign rows deterministically across affected ULIDs.
• Deterministic update means:
  - newly included locations receive child rows,
  - removed locations transition to Excluded (or equivalent non-executing state) without deleting history,
  - unchanged locations preserve existing rows and analytics.

Inherited additions under "all":
• When a newly eligible location is added later on the same device, it MUST join the running campaign immediately only if the current Plan still has remaining capacity for that campaign group.
• If the newly eligible location would exceed current Plan capacity, the location becomes eligible on the device but MUST remain unincluded until upgrade or scope change.
• The UI MUST show:
  - an immediate notice at add / restore time,
  - an inline notice in Campaign Management on next open, and
  - an inline upgrade action when capacity is exhausted.

--------------------------------------------------------------------

8.4.5 Ownership vs Campaign vs Session (Hard Gate)

Three independent dimensions exist:

• Ownership            – exclusiveUntil > now
• Campaign Entitlement – computed as above
• Operator Session     – valid op_sess + opsess:<id>

Dash access requires ALL of the following:

    OwnedNow AND SessionValid AND CampaignEntitled

Violation handling (authoritative):

• 401 Unauthorized → missing or expired Operator Session
• 403 Forbidden    → campaign inactive OR ownership expired
• 200 OK           → access granted

Clients MUST interpret HTTP status codes exactly and MUST NOT infer state.

Operator sessions (`op_sess`) are bound to exactly one location ULID at a time.

If a valid session exists for a different location:
• access to Dash and owner APIs for other locations MUST return 403
• the UI MUST offer a clear escape hatch (Sign out / Switch location)

Multi-location owner sessions on a single device are explicitly forbidden.

UI Rule (Signed-in variant):

When `/api/stats` returns 200 (access granted), the UI MAY present an Owner Settings
“signed-in” menu instead of navigating directly to Dash.

The signed-in menu MUST include:
• Open dashboard
• Manage campaign (Campaign Management)
• Owner Center
• Example dashboards
• Sign out on this device

This does not change access semantics; it is a presentation rule to ensure campaign
management remains reachable in an owned+session context.

--------------------------------------------------------------------

8.4.6 Visibility States (Backend-Computed)

API Worker computes presentation-only visibility states:

• promoted  – CampaignEntitled === true
• visible   – courtesy window active
• hidden    – neither active nor courtesy

Visibility affects:
• in-app ordering
• discoverability
• UI badges

Visibility does NOT grant ownership, analytics, or control.

--------------------------------------------------------------------

8.4.7 campaignKey Naming Contract

campaignKey MUST be stable, deterministic, and namespace-safe.

Recommended structure:

    <brandKey>/<locationSlug>/<campaignType>/<YYYYMMDD-start>

Rules:

• brandKey mandatory when a brand exists
• locationSlug is human-readable; backend resolves to ULID
• campaignType from controlled vocabulary
• start date guarantees uniqueness without randomness

Clients MUST treat campaignKey as opaque.
Only the API Worker interprets its meaning.

--------------------------------------------------------------------

8.4.8 Deprecation of campaigns.json

The static campaigns.json file is deprecated.

Campaign lifecycle and entitlement are KV-authoritative.
No JSON file is used for runtime campaign logic.

--------------------------------------------------------------------

8.4.9 Campaign Management (Owner Platform)

Owners manage campaigns exclusively through API endpoints:

• POST /api/owner/campaigns/draft
• POST /api/owner/campaigns/checkout
• POST /api/owner/campaigns/promote
• POST /api/owner/campaigns/pause
• POST /api/owner/campaigns/finish

Campaign Management UI (CM modal):

• operates only for Owned locations
• never infers entitlement client-side
• reflects backend truth only
• is dismissible (X / ESC / tap-out)

Campaign Management replaces all static configuration workflows.

Campaign Management Availability:

Campaign Management is owner-only and requires a valid operator session.

Claim/unowned flows MUST route to Campaign Funding, not Campaign Management.

Campaign Management MUST be reachable from an owned+session context
(e.g. Owner Settings signed-in variant or Dash owner controls).

Owner-facing funding flow (authoritative)

Campaign Management and Campaign Funding MUST present a deterministic BO flow:

1) Choose plan
2) Choose campaign scope
3) Choose locations
4) Checkout / activate

Plan chooser (mandatory content)

The first step MUST present the available Plans in plain language:

• Standard — 1 location
• Multi — up to 3 locations
• Large — up to 10 locations
• Network — 10+ locations

The Plan step MUST explain:
• how many locations can join this campaign,
• whether future proven same-device locations can auto-join under “All my locations”,
• that only locations already proven on this device are eligible.

The Plan step MUST NOT expose internal terms such as:
• maxPublishedLocations
• campaign_group
• derived portfolio

Scope-gated UI:

• If a valid current Plan already exists and no upgrade is required, Campaign Management MAY treat the Plan step as already satisfied, but MUST show the current Plan state prominently.
• Standard proceeds in single-location campaign flow only.
• Scope step appears only for Multi / Large / Network.
• Locations step appears only when scope = "selected" or scope = "all".
• For Multi, Large, and Network plans, Campaign Management adds:
  - Campaign scope
  - Locations
  - Active location roster / controls

Current Plan visibility (mandatory)

Campaign Management MUST show the current tier and capacity whenever known.

Minimum owner-facing examples:
• Standard · 1 location
• Multi · up to 3 locations
• Large · up to 10 locations
• Network · 10+ locations

Campaign Management SHOULD also show included-count context when meaningful
(e.g. “2 of 3 locations included”).

Campaign scope step:

• "This location only"
• "Selected locations"
• "All my locations"

Derived-portfolio behavior:

• The current seed location auto-creates the derived portfolio the first time the operator chooses "selected" or "all".
• This is an internal system state change, not a separate user product.
• The UI MAY show a short explanatory information line, but MUST NOT require a confirmation step.

Locations step:

• Shown only when scope is "selected" or "all".
• Uses one flat, filterable roster (not grouped sections).
• The current seed location starts included by default, but MAY be unchecked in "selected".
• If no additional eligible locations exist yet, CM MUST offer an inline “Add another location” path using existing same-device proven-control flows.

How locations become eligible:

• A location becomes eligible for the derived portfolio when it is:
  - restored on the same device using Restore Access, or
  - established on the same device through a fresh qualifying purchase.

Add another location / capacity interaction

• If no additional eligible locations exist, Campaign Management MUST show inline “Add another location”.
• The inline explanation MUST state that only same-device proven locations can be added to the current campaign context.
• If the current Plan still has remaining capacity, the UI SHOULD explain that an added proven location can extend the current campaign reach under the current Plan.
• If Plan capacity is already exhausted, the UI MUST explain that the location may be restored or proven on this device but cannot join the campaign until the owner upgrades the Plan or removes another location from scope.

Roster after activation:

• Campaign Management MUST display one flat roster with filters always available.
• Supported filters MAY include Active / Suspended / Excluded / Newly added.
• Grouped state sections are not required.

Network / subset controls:

• Campaign Management MUST support:
  - suspend all included locations
  - suspend selected locations
  - resume all included locations
  - resume selected locations

• A single included location MAY be suspended locally without stopping the network campaign elsewhere.

Upgrade behavior (owner-facing, mandatory)

Campaign Management MUST provide an inline upgrade path instead of generic rejection whenever:
• a Standard owner attempts multi-location scope,
• a Multi owner attempts to include a 4th location,
• a Large owner attempts to include an 11th location,
• an “all” campaign would inherit a newly eligible location beyond current capacity.

Upgrade rules:
• The UI MUST explain the current tier limit in plain language.
• The upgrade action MUST reopen the Plan chooser with the current tier visible and the next qualifying tier suggested.
• Backend rejections for disallowed scope or capacity overflow MUST map to this upgrade experience, not to an opaque error state.

Post-checkout return behavior

After a successful Plan purchase or upgrade, Owner Exchange MUST restore the in-progress flow on the first incomplete step:

• Standard → reopen Campaign Management in single-location mode with scope fixed to “This location only”
• Multi / Large / Network with no scope chosen yet → reopen on Campaign scope
• Multi / Large / Network with scope already chosen as “selected” or “all” and roster incomplete → reopen on Locations
• Completed flows MAY reopen on Campaign Management summary / review

If the purchase or restore action proves a new location on the same device,
that location MUST become eligible immediately for the current campaign context,
subject to current Plan capacity.

Scope note:

• Multi-location campaigns operate only on already-existing locations.
• Location creation flows are outside this section.

--------------------------------------------------------------------


8.5 finance.json (Sector Pricing)

Per row:

  • sectorKey                                   – category mapping (e.g. souvenirs)
  • countryCode                                 – ISO country
  • currency                                    – billing currency
  • campFee / campFeeRate                       – pricing model for redeems
  • optional revenue expectations / spend models

Finance.json does **not** store any per-redeem data; it is purely parameterization for billing (Section 5).

8.6 contexts.json (Navigation Context Structure)

Defines all navigable URL shells, e.g.:

  • souvenirs
  • souvenirs/germany
  • souvenirs/germany/berlin
  • giftshops/germany/berlin
  • restaurants/germany/berlin

Each entry includes:

  • theme / namespace keys
  • context string (URL path)
  • visibility flags
  • multilingual labels
  • group/subgroup structure
  • priority

Contexts.json does **not** define which businesses belong to a context — that comes from profiles.json.

8.7 Event Data Model (Derived)

The true operational event streams are not stored in JSON files; they are logged
server-side by Workers into KV-backed structures:

A) **Daily metric counters (stats bucket)**  
   Stored as:

       stats:<ulid>:<YYYY-MM-DD>:<metric> = integer

   Example metrics:
     • lpm-open, save, unsave, share, map
     • qr-scan, qr-view, qr-print
     • promo metrics: qr-armed, qr-redeem, qr-invalid
     • confirmation metrics:
         redeem-confirmation-cashier
         redeem-confirmation-customer
     • rating metrics: rating-sum, rating-avg

B) **QR Log (per scan attempt)**  
   Stored as:

       qrlog:<ulid>:<YYYY-MM-DD>:<scanId> → object{
           signal: "scan" | "armed" | "redeem" | "invalid",
           location, device, country, browser, lang,
           campaignKey?, visitorId?,
           timestamp
       }

   QR log enables:
     • full ordering of events
     • invalid attempt detection
     • diagnose window-shift (>100% compliance)
     • Dash QR Info table

8.8 Redeem Token Model (Internal Only)

Promo QR issues a one-time token:

  • Token ULID (rt) generated on request  
  • Stored as:
        redeem:<token> = { status: "fresh" | "ok" | "invalid", uid, campaignKey, timestamp }
  • Consumed on first cashier redeem  
  • Polled by customer device for redeem-status

Token states drive:
  • REDEEM events  
  • INVALID events  
  • Customer confirmation appearance  
  • Window-shift analysis (late redeem)

Tokens are never exposed to merchants.

8.9 Confirmation Metrics (Cashier & Customer)

Two metrics measure human-side compliance around redemption:

  A) **redeem-confirmation-cashier**  
     • Logged once on cashier device after redeem redirect  
     • Prevents silent/unauthorized discounts  
     • Inputs into cashierCoverage for QA

  B) **redeem-confirmation-customer**  
     • Logged once on customer device after backend confirms redeem  
     • Inputs into customerCoverage for QA

Both are essential to anti-circumvention logic (Section 3 & 10).

8.10 Aggregated Data Model (Stats Response)

Dash consumes the normalized data model returned by:

    GET /api/stats

Response fields include:

  • locationID / name  
  • period start & end  
  • tz (display timezone)
  • days{}:
        day → { metric: count, ... }
  • campaigns[]:
        { campaignKey, armed, scans, redemptions, invalids, ... }
  • qrInfo[]:
        flat list of scan/armed/redeem/invalid entries
  • rated_sum, rating_avg
  • internal-only metadata (not shown to merchants):
        uniqueVisitors, repeatVisitors, uniqueRedeemers, repeatRedeemers

No compliance % is present in campaigns[]; ratios are computed only in Analytics QA.

8.11 QA Auto-Tagging Model (KV_STATUS)

The Worker writes QA diagnostic flags per location:

    status:<ulid> → {
        tier, status,
        qaFlags: [...],
        qaUpdatedAt: ISO-timestamp
    }

qaFlags may include:

  • low-scan-discipline  
  • high-invalid-attempts  
  • low-cashier-coverage  
  • low-customer-confirmation  
  • qa-ok

These flags are used internally (Section 90.x) and never displayed in merchant UI.

8.12 Billing-Derived Model (Internal Only)

Billing (Section 5) consumes:

  • Redeem events  
  • Campaign metadata  
  • Finance sector metadata  
  • Optional integration with promo effectiveness metrics

Billing does not mutate the data model; it reads it.

8.13 Data Safety & Invariants

The data model enforces:

  • Token = single-use  
  • armed ≤ scan window constraints (window shifts allowed)  
  • redeem ≤ armed + historical window shift  
  • invalid attempts always logged; never replace redeem  
  • confirmation metrics only increase; never overwritten  
  • stats buckets roll daily; qrlog entries always timestamped

Dashboard must gracefully handle:
  • out-of-window redeems  
  • misaligned scan histories  
  • incomplete confirmation metrics  
  • inconsistent browser location (CF POP)

8.14 Out-of-Scope for This Section

Section 8 does not define:

  • UI rendering (Section 12)  
  • Promotion UX (Section 3)  
  • Dashboard narrative logic (Section 4)  
  • Translation domains (Section 7)  
  • Worker logic beyond data shapes (Section 9)  
  • Onboarding processes (90.x)

Section 8 defines the **shape and meaning** of all persistent and derived data used across NaviGen.

9. WORKERS

Workers form NaviGen’s execution substrate. They run on Cloudflare and provide:
  • Intelligent routing and static hosting (Pages Worker)
  • Business rules, token lifecycle, stats aggregation, and QA auto-tagging (API Worker)
  • A consistent identity layer (slug → ULID)
  • A structured hit/logging system for analytics and billing

Workers are stateless per request and rely on KV storage for all counters,
QR logs, aliases, and token states.

--------------------------------------------------------------------

Worker Boundary Clarification (Pages vs API)

NaviGen uses two distinct Cloudflare Worker projects with different roles
and binding scopes.

A) Pages Worker (navigen.io)

• Deployed as part of the Pages project
• Source file: _worker.js
• Serves the app shell and static assets
• Handles QR redirect endpoints (/out/qr-*)
• May log lightweight routing or hit signals
• May forward signals to the API Worker
• NEVER decides redeem validity, ownership, billing, or QA state

Pages Worker is non-authoritative by design.

Explicitly:
• Pages Worker MUST NOT process Stripe webhooks.
• Pages Worker MUST NOT write ownership:<ULID>, ledger entries, or any billing-related state.
• Pages Worker MAY only forward observational hit signals to the API Worker.

B) API Worker (navigen-api)

• Deployed via wrangler (wrangler.toml)
• Source file: index.ts
• Holds authoritative KV bindings
• Issues and consumes redeem tokens
• Writes stats, qrlog, QA flags
• Enforces ownership and access
• Performs billing and attribution logic

API Worker is the sole authority for all business decisions.

C) KV Binding Scope

Both Workers may have KV bindings, but with different intent:

• Pages Worker KV is observational and non-critical
• API Worker KV is canonical and authoritative

No business decision may depend on Pages Worker state alone.

--------------------------------------------------------------------
9.1 Pages Worker (Routing, Static Hosting, QR Redirects)

The Pages Worker serves the app shell, pre-built assets, and provides
specialized routing behavior.

Responsibilities:

A) **Static Asset Hosting**
   • Serves index.html, dash.html, JS bundles, CSS, manifest, service worker.
   • Ensures PWA installation assets are delivered unmodified.

B) **Context-Aware Routing**
   • URLs like /souvenirs/germany/berlin resolve into the main app shell,
     which then loads profiles via /api/data/list.
   • All navigable contexts come from contexts.json (Section 8).

C) **Info QR Handling**
   Endpoint:
       /out/qr-scan/<slug>?to=<finalURL>

   Behavior:
     1. Worker increments scan metric (qr-scan) for this ULID/day.
     2. Redirects user to finalURL (either <context>?lp=<id> or qrUrl override).
     3. Context or lp param is not modified; the app shell handles interpretation.

D) **Promo QR Handling**
   Endpoint:
       /out/qr-redeem/<slug>?camp=<key>&rt=<token>

   Behavior:
     1. Redirects cashier device to:
           /?lp=<slug>&redeem=pending&camp=<key>&rt=<token>
     2. Preserves token and campaign context for the landing app.
     3. Does not consume, pre-confirm, or validate the token.

   Pages Worker **never** evaluates redeem validity; the landing app asks the API Worker for the authoritative outcome.

E) **Support for App → Dash Navigation**
   Serves dash.html and assets without applying app-level routing rules.

F) **Error Containment**
   • No business logic is executed here.
   • Errors fall back to app shell with safe defaults.

--------------------------------------------------------------------
9.2 API Worker (Core Business Logic)

The API Worker implements all business rules, promotion logic, data integrity,
stats aggregation, and QA systems. It is the authoritative source of truth for
promo/redeem correctness.

API Worker Responsibilities:

A) **Identity Normalization**
   • All incoming slugs and aliases resolve to canonical ULIDs:
         alias:<slug> → { locationID: <ULID> }
   • All stats and qrlog entries use ULID as key-space.

B) **Runtime Data Loading**
   • Reads finance.json and contexts.json plus KV-backed profile authority
     (`profile_base:<ULID>` + `override:<ULID>`).
   • `profiles.json` remains a legacy export / migration artifact only once
     Phase 8 is enabled.
   • Campaign lifecycle and entitlement are KV-authoritative and are not read
     from static JSON at runtime.

C) **Promotion QR Issuance**
   Endpoint:
       /api/promo-qr?locationID=<slug>

   Workflow:
     1. Resolve ULID from slug.
     2. Select active campaign (startDate ≤ now ≤ endDate).
     3. Generate one-time token (ULID): redeem:<token>.
     4. Store redeem:<token> = { status:"fresh", uid, campaignKey }.
     5. Log ARMED event: stats + qrlog.
     6. Return QR containing:
            /out/qr-redeem/<slug>?camp=<campaignKey>&rt=<token>

   No client device can mint a redeem token.

D) **Redeem Handling**
   Endpoint:
       /hit/qr-redeem/<ULID>

   Using token from headers:
     • If token is fresh:
         - Mark token status = "ok"
         - Log REDEEM event in stats + qrlog
     • If token already consumed or expired:
         - Mark token status = "invalid"
         - Log INVALID event
     • Compute campaign + finance metadata for billing

   Redeem logic is non-reversible and append-only.

E) **Redeem Status (Customer Polling)**
   Endpoint:
       /api/redeem-status?rt=<token>

   Returns:
     • { status:"pending" } or { status:"redeemed" }
   Once redeemed, customer UI displays confirmation modal and logs
   redeem-confirmation-customer.

F) **Stats Aggregation**
   Endpoint:
       /api/stats?locationID=<id>&from=<date>&to=<date>

   Produces the data model consumed by Dash:
     • days{} with metric counters
     • campaigns[] with armed/scans/redeems/invalid
     • qrInfo[] raw QR log rows
     • rated_sum, rating_avg
     • locationName (resolved)

   Backfills unique visitors and redemption patterns.

G) **Confirmation Metrics**
   Logged via:
     /hit/redeem-confirmation-cashier/<id>
     /hit/redeem-confirmation-customer/<id>

   These increment:
     • redeem-confirmation-cashier
     • redeem-confirmation-customer

   They are essential for:
     • detecting cashier bypass
     • diagnosing customer flow dropout
     • generating QA coverage metrics in Analytics

H) **QA Auto-Tagging**
   As part of /api/stats, the Worker computes QA health flags and stores:

       status:<ULID> → {
         qaFlags: [...],
         qaUpdatedAt: ISO-timestamp,
         tier/status preserved
       }

   Flags include:
     • low-scan-discipline
     • high-invalid-attempts
     • low-cashier-coverage
     • low-customer-confirmation
     • qa-ok

   These flags support internal dashboards (90.x).

I) **Billing Hooks**
   Redeem events trigger internal billing calculations using:
     • sectorKey
     • countryCode
     • finance.json (campFee / campFeeRate)
     • redeem timestamp + campaignKey

   Billing outputs do not affect the promo flow.

J) **Data Integrity Rules Enforced by the API Worker**
   • Token is single-use.
   • REDEEM > 1 for same token is impossible.
   • INVALID always logged on reuse.
   • Confirmation metrics are append-only.
   • Campaign time windows enforced server-side.
   • ULID resolution must succeed; otherwise reject.

K) **Stripe Webhook Processing (Authority Source)**

API Worker consumes ownership and billing state derived from Stripe events.

Stripe webhook processing performs authoritative, idempotent reconciliation for:

• ownership:<ULID>  
• prepaid ledger top-ups  
• agent attribution records (if applicable)

Checkout success (Stripe session complete + paid) is the canonical ownership transition trigger.

Webhook processing:

• ensures idempotency  
• reconciles missed events  
• protects against duplicate processing  

Stripe webhook processing is NOT executed by Pages Worker.

Ownership and prepaid balance updates originate from the Stripe webhook processor,
which may run outside the Worker stack.

API Worker consumes the resulting state for enforcement.

--------------------------------------------------------------------
9.3 Auxiliary API Endpoints

Used for app shell and Dash data loading:

A) /api/data/list?context=<ctx>  
   Returns list of locations in that context (profiles.json filtered).

B) /api/data/profile?id=<slug>  
   Returns detailed location entry (multilingual, contact, media).

C) /api/data/item?id=<slug>&fields=…  
   Lightweight data fetch for specific UI components.

D) /api/data/nearby?lat=<lat>&lng=<lng>  
   Optional, depending on deployment (not part of core spec).

E) /api/location/draft  
   Draft-only profile authoring (non-visible; no indexing)

F) /api/location/publish  
   Publish promotion to override:<ULID> with Plan capacity enforcement + DO index update
   
Auxiliary endpoints are read-only unless explicitly defined as write endpoints in Section 92.3.4.

--------------------------------------------------------------------
9.4 Hit Logging Endpoints

Uniform structure:

    /hit/<metric>/<ULID>

Used for:
  • click metrics (e.g. save, share, map)
  • qr-scan events when triggered from app
  • truthful promo-redeem validation calls from the landing app after the /out/qr-redeem redirect
  • confirmation metrics

Hits increment:
  • stats:<ULID>:<day>:<metric> = integer

All hit routes are side-effect-free beyond counter increments.

--------------------------------------------------------------------
9.5 Error Handling & Edge Cases

Workers must:

  • Reject unknown locationID/slug cleanly  
  • Fail closed on invalid tokens  
  • Allow “window-shift” redeems (compliance >100%)  
  • Never break promo flow because of CF POP or browser geolocation issues  
  • Never reveal operational diagnostics (QA) to merchants  
  • Always return valid JSON, even with partial stats  

Pages Worker:
  • Must never render errors to end-users  
  • Redirects must remain well-formed  
  • Info QR and Promo QR flows must remain stable under all network conditions  

API Worker:
  • Must handle missing campaign windows  
  • Must gracefully skip malformed events  
  • Must allow empty stats windows  
  • Must not allow redeem state corruption (token invariants)

--------------------------------------------------------------------
9.6 Worker Interaction Model

The system works as a pipeline:

  1. Customer receives Info QR or Promo QR  
  2. Pages Worker logs scan & redirects  
  3. App shell presents LPM or Promo QR  
  4. Cashier device hits /out/qr-redeem → Pages Worker redirects to /?lp=<slug>&redeem=pending&camp=<key>&rt=<token>  
  5. Landing app calls /hit/qr-redeem; API Worker consumes token and updates stats/qrlog    
  6. Dash later requests aggregated data from /api/stats  
  7. API Worker enriches stats with QA flags  
  8. Dash renders narratives and diagnostic insights  

Every Worker component fits into this deterministic flow.

--------------------------------------------------------------------
9.7 Out-of-Scope for Section 9

Section 9 does NOT define:

  • Client modals (Section 12)  
  • Promo UX logic (Section 3)  
  • Dashboard rendering (Section 4)  
  • Translation system behavior (Section 7)  
  • Dataset schemas (Section 8)  
  • Billing formulas (Section 5)  
  • Onboarding processes (90.x)

Section 9 defines the **execution roles** and **responsibilities** of Workers
in the overall NaviGen architecture.

10. VISITOR MODEL

10.1 Purpose

NaviGen tracks user activity strictly for:
  • analytics (Click Info, QR Info, Campaigns, QA)
  • promotion integrity (redeem correctness, confirmation signals)
  • operational safety (invalid attempts, compliance diagnostics)
  • internal monitoring and billing (redeem-based)

The visitor model is:
  • anonymous
  • event-driven
  • stateless at the browser level (except optional local storage)
  • never tied to personal identity
  • minimal by design

10.2 Visitor Identity (Anonymous UID)

A “visitor” in NaviGen means **an anonymous device/browser instance**.
Identity is represented by:

  • a short-lived browser-generated visitorID (UUID/ULID)
  • stored client-side only if necessary (Promo QR modal)
  • optionally embedded into QR logs for analytic patterns

Visitor identity:
  • does not contain personal data
  • does not survive cross-browser movement
  • is not guaranteed to be stable forever
  • is not used for any authentication or personalization

The system treats visitors as **probabilistic continuity**, not strong identity.

10.3 Where Visitor Identity Is Used

Visitor identifiers appear (optionally) in:

  • qrlog entries:
       signal, device type, browser name, language, visitorID?
  • analytics trends (repeat visitor patterns)
  • campaign-level behavior (uniqueRedeemers, repeatRedeemers)
  • anomaly patterns (e.g., repeated invalid attempts)

VisitorID is **never**:
  • exposed to merchants  
  • used for retargeting  
  • used for identification  
  • shared externally  

It exists only to support operational analytics.

10.4 Event Semantics (Visitor-Level)

A visitor may trigger:

A) Interaction Events  
   • clicking into LPM, save/unsave, open map, share, website visit  
   • emits stats:<ULID>:<day>:<metric>  

B) QR Events (Customer or Cashier)  
   • SCAN (static or promo)  
   • ARMED (promo QR shown)  
   • REDEEM (first token use)  
   • INVALID (token reuse or expired)  
   Logged via qrlog and stats.  

C) Confirmation Events  
   • redeem-confirmation-customer (customer device)  
   • redeem-confirmation-cashier  (cashier device)  
   Capture real-world compliance signals.

D) Rating Events  
   • visitor rates location → rating-sum, rating-avg, and visitorID pattern recorded

Each event type is anonymous but may include device/browser/geo metadata
(as provided by Cloudflare or the browser), always aggregated without identity.

10.5 Promotional Roles (Visitor Classes)

At runtime, NaviGen recognizes **visitor roles by context**, not by identity:

  • **Customer visitor**  
       arrives via Info QR, LPM, or browsing; may reveal Promo QR.

  • **Cashier visitor**  
       arrives via promo QR redirect (/out/qr-redeem → /?lp=...&redeem=pending&camp=...&rt=...).  
       The landing app then requests the truthful redeem outcome and presents the cashier success or invalid UI.

  • **Redeemer visitor**  
       the device participating in Promo QR → token redeem handshake (customer or cashier side depending on flow).

These roles exist only for a moment; they do not persist.

10.6 Visitor Continuity Rules

The system never requires long-term identity, only **short-session continuity**:

  • Promo QR modal retains token-awareness (redeem-status polling)
  • Dash analytics aggregates multiple visitorIDs for patterns
  • No flow assumes a persistent login or user account

Visitor continuity is **best-effort** and deliberately weak to preserve privacy.

10.7 Privacy Principles

NaviGen enforces:

  • No PII stored  
  • No cookies used for tracking  
  • No fingerprinting  
  • No cross-site tracking  
  • No sharing of visitor-level data with merchants  
  • QR logs & stats contain no personal information

All analytics are aggregate-only.

10.8 Visitor Model in QR Log

qrlog stores:

  • signal: "scan" | "armed" | "redeem" | "invalid"
  • device (Android/iOS/Desktop/Tablet)
  • browser family (Chrome, Safari, Firefox, etc.)
  • language (navigator language)
  • scan ID (unique per event)
  • visitorID? (optional)
  • campaignKey?
  • timestamp & rough location (CF geolocation)

This supports:

  • device-type segmentation  
  • promo funnel integrity  
  • invalid attempt analysis  
  • session continuity (repeat visitor behavior)

10.9 Visitor Model in Promotion Flow

A promotion relies on two parallel visitor journeys:

A) Customer Path
   1. Customer opens LPM  
   2. Customer reveals promo QR (armed)  
   3. Token gets linked to customer device for polling  
   4. When redeemed, customer sees confirmation modal  

B) Cashier Path
   1. Cashier scans promo QR  
   2. Pages Worker redirects the cashier device with `redeem=pending&camp=<key>&rt=<token>`  
   3. The landing app requests the truthful redeem outcome from the API Worker  
   4. If outcome is ok, cashier submits confirmation  

Visitors do not need to be the same person or device.
NaviGen uses only token state to synchronize both sides.

10.10 Visitor Model in Analytics

Analytics uses visitor-level patterns only as aggregates:

  • repeat visitor rate  
  • unique vs returning redeemers  
  • mixed device/browser analysis  
  • detection of suspicious patterns (e.g., repeated invalid attempts)

Analytics narratives never expose visitor count directly unless translated into
safe summary lines.

10.11 Visitor Model in QA (Internal)

Visitor-derived signals are crucial for QA:

  • Low scan discipline  
  • High invalid attempts  
  • Low cashier coverage  
  • Low customer coverage  
  • Out-of-window redeems (timestamp + visitorID distribution)

QA is strictly internal; visitor insights never appear in merchant-facing UI.

10.12 Visitor Model & Billing

Visitor identity does NOT enter billing.  
Billing uses:

  • redeem events  
  • campaign metadata  
  • finance.json  
  • token state at time of redeem  

VisitorID is irrelevant to pricing and remains strictly analytic.

10.13 Out-of-Scope for Section 10

Section 10 does not define:

  • Promo UX specifics (Section 3)  
  • Dashboard rendering (Section 4)  
  • Data model (Section 8)  
  • Workers logic (Section 9)  
  • Translation domains (Section 7)  

It defines the **privacy-safe conceptual model** of visitors and their relationship
to events throughout the system.

11. TEST MODE & SCENARIOS

11.1 Purpose

Test Mode provides a controlled environment for validating the complete
NaviGen promo ecosystem without needing physical signage or live campaigns.
It ensures testers, merchants, and developers can verify:

  • QR redirection correctness (Info + Promo)
  • Token issuance and single-use invariants
  • ARMED / SCAN / REDEEM / INVALID logs
  • Cashier- and customer-confirmation flows
  • Stats aggregation correctness (/api/stats)
  • Dash analytics narratives + QA block
  • PWA behaviors (install, deep links, modals)

Test Mode never affects production analytics.

11.2 Activation of Test Mode

Test Mode activates automatically when any of the following is true:

  • Data sources (profiles.json) include test-only entries.
  • Query parameters contain flags:
        ?test=1 or ?mode=test
  • Environment variables or build flags enable test routing (internal use).
  • The caller resolves to a known internal or test alias that maps to a canonical ULID.

Test Mode must **not** be exposed to external users accidentally.

11.3 Test Contexts

The system includes optional test contexts:

  • /test/demo                    (test-only shell)
  • /souvenirs/test               (test context under real theme)
  • /dash?locationID=test-*       (dash views for test-only IDs)

Each context loads the same LPM, Promo, and Dash mechanics with isolated data.

11.4 Test Campaigns

Test Mode supports synthetic campaigns with:

  • fixed time windows (always “active” in test)
  • known campaignKeys (e.g., test-1, test-qr)
  • deterministic discount structures (“10% Test Campaign”)
  • simplified metadata (no translations required for internal development)

Test campaigns must be clearly isolated from production identifiers and never
appear in merchant dashboards.

11.5 Test Promo QR Flow

A developer or tester may follow the full promotion lifecycle using only
their devices:

1. Open LPM (test profile)
2. Tap “Promotion”
3. Show promo QR:
     • /api/promo-qr issues token: redeem:<token>
     • ARMED logged in stats + qrlog

4. Cashier-scan simulation:
     • Scan promo QR using another device or browser window
     • /out/qr-redeem → /hit/qr-redeem consumes token
     • REDEEM or INVALID logged
     • redirected cashier-side modal appears automatically

5. Customer confirmation:
     • Promo modal polls redeem-status
     • Once redeemed, confirmation modal shown
     • Logs redeem-confirmation-customer

6. Cashier confirmation:
     • Cashier device sees redeem-confirmation-cashier modal
     • Logs cashier-confirmation metric

11.6 Test Scenarios (Recommended)

A) **Happy Path Redeem**
   • ARMED → SCAN → REDEEM → CASHIER CONFIRM → CUSTOMER CONFIRM  
   Expected Dash results:
     - armed = 1
     - redeem = 1
     - invalid = 0
     - cashierConfirm = 1
     - customerConfirm = 1
     - QA: all green

B) **Invalid Token Reuse**
   • Show promo QR  
   • Redeem once  
   • Rescan QR a second time  
   Expected:
     - second scan = INVALID  
     - Dash → invalid attempts count increments  
     - QA: invalid-normal or invalid-elevated depending on volume

C) **Cashier Bypass Attempt**
   • Redeem QR  
   • Cashier closes modal without answering (simulated by reloading)  
   Expected:
     - cashierConfirm = 0  
     - QA: low cashier coverage (⚠)

D) **Customer Flow Interruption**
   • Customer closes promo modal before polling finishes  
   • Redeem occurs on cashier device  
   Expected:
     - customerConfirm = 0  
     - QA: low customer coverage (⚠ if armed ≥ threshold)

E) **Window-Shift Redeem (>100% compliance)**
   • Promo is ARMED on Day N  
   • Redeem happens on Day N+1 inside new Dash time range  
   • Dash shows:
        armed < redeems  
        compliance > 1.0  
        QA: scan-over-100 (⚠)

F) **No Promo Activity**
   • No scans, armed, or redeems exist for the period  
   Expected:
     - Dash empty states  
     - Analytics empties  
     - QA: no promo activity message

11.7 Test Data Isolation

Test events must not:

  • mix with real locations  
  • pollute real campaigns  
  • trigger billing (Section 5)  
  • set internal QA flags for real locations  
  • appear in merchant dashboards

API Worker may skip QA auto-tagging for test ULIDs.

11.8 Test Tools & Developer Shortcuts

Test Mode may include:
  
  • shortcut modals for verifying translations (modal preview)  
  • QR debug overlays  
  • token inspector (/api/debug/token?rt=…)  
  • dash export preview tools  
  • sample JSON payload recording

These tools must remain private and inaccessible in production.

11.9 PWA & Multimodal Testing Scenarios

A) **Browser vs PWA behaviors**
   • ensure 📌 → 👋 transition consistency
   • ensure install fallback modal works
   • confirm redirects work in standalone mode

B) **Cross-device promo testing**
   • Show promo QR on Device A
   • Redeem on Device B
   • Confirm on both A and B
   • Verify Dash reconciles all events

C) **Offline / spotty connection simulation**
   • Promo modal should open fine
   • Redeem must fail cleanly until online
   • Confirmation modals must appear only when backend permits

11.10 Out-of-Scope for Section 11

Test Mode does NOT define:

  • Token algorithms (Section 9)  
  • Analytics formulas (Section 4)  
  • Promotion UX (Section 3)  
  • Dataset schemas (Section 8)  
  • Translation engine (Section 7)

It defines **how to test** the system end-to-end and the **expected outcomes**.


12. UI MODAL SYSTEM & SHARED COMPONENT PATTERNS

12.1 Purpose of the Modal Layer

The modal system provides a consistent interaction pattern for all pop-up
dialogs across NaviGen. Modals are used to present information, collect user
input, confirm actions, or deliver structured flows (e.g., promotions,
donation steps). The system ensures:

  • Consistent appearance, motion, and accessibility
  • Safe layering (only one primary modal visible at a time)
  • Keyboard / tap-out close support
  • Fully translation-driven text (see Section 7)
  • Limited, predictable animation behavior
  • DOM isolation (each modal is mounted/unmounted as needed)

12.2 Modal Architecture

All modals are built using a shared foundation:

  • injectModal(props)  → creates modal shell
  • showModal(id)      → displays the modal
  • hideModal(id)      → closes it
  • setupTapOutClose(id) → tap outside to close

A modal consists of the following required regions:

  • Top bar (title + close button)
  • Body area (content; scrollable if needed)
  • Optional action area (CTA buttons)
  • Optional fixed footer (e.g. install hints, donation tiers)

Modals do not share internal markup; each modal defines its content,
but all follow the same structural contract.

12.3 Modal Lifecycle & Behavior Rules

  • Opening a modal pauses background interactions
  • Closing a modal restores scroll/state but does not touch URL unless
    explicitly required (e.g. LPM deep-link cleanup)
  • Only one modal is intended to be visible at a time; stacking rules are
    discouraged except for system alerts
  • All modal text must use t(key)
  • Modals must remain functional in offline/PWA modes
  • Modals must avoid scroll hijacking; scrollable body only

12.4 Modal Categories

A) **Informational Modals**  
   Used for static or descriptive information.  
   Examples: Help modal, Pinned/Install modal, Terms modal, Data modal.

B) **Action Modals**  
   Used for user decisions or operations.  
   Examples: Share modal, My Stuff modal, Reset/Confirmation modals.

C) **Promotion Flow Modals**  
   Used for customer-facing & cashier-facing QR redemption interactions.  
   Examples: Promotion modal, Promotion QR modal, Redeem confirmation (cashier),
   Redeem confirmation (customer).

D) **Dashboard Modals**  
   Lightweight modals used inside Dash or Dash-triggered UI.  
   Examples: Copy/export modal (if present), share/export toolings.

12.5 Animation & Performance Requirements

  • Modal enters via a fade + slight upward offset
  • Modal exits via a fade-down
  • Timing must remain responsive under PWA service worker caching
  • No heavy reflow on open or close

12.6 Accessibility & Interaction

  • All modals include keyboard ESC close
  • Focus is trapped within modal content
  • Tap-out-close behavior is uniform
  • Buttons must remain accessible when keyboards are open on mobile

12.7 Shared UI Components

In addition to modals, several shared components follow unified styling:

  • Accordion lists (location lists, campaign lists)
  • Headers & navigation pins (📌 install, 👋 donation)
  • Rating display components
  • Mini-tables (Click Info, QR Info, Campaigns)
  • Bar-chart visualizers for Analytics
  • Toast notifications (“Thank you”, “Copied”, etc.)
  • In-app banners (seasonal or contextual)

These components conform to the same translation, animation, and accessibility rules described above.

12.8 Modal Placement within the Application Architecture

The modal system is used across:

  • Location Profile Modal (LPM) → primary entry point for business info
  • Promotion QR Flow → Promo modal + QR modal
  • Donation Support Flow → 3-stage support/donation modals
  • Install Flow → Pinned modal + OS prompt
  • Account & Data Tools → My Stuff, Data, Terms, Purchases
  • Administrative surfaces → Dash, Export/Copy flows

12.9 Out-of-Scope

Section 12 does not define:

  • Translation keys (Section 7)
  • UI module specifications (Section 6)
  • Promotion flow logic (Section 3)
  • Dashboard narrative logic (Section 4)
  • Data model definitions (Section 8)
  • Worker behavior (Section 9)
  • QA and internal scoring (90.x)

Section 12 defines only the modal architecture and shared UI component patterns,
not the content that modules present.

13. SEARCH CAPABILITIES

13.1 Purpose

NaviGen supports lightweight, deterministic search across its structured
location dataset. The goal of search in NaviGen is:

  • Fast access to locations based on name, tags, or context  
  • Accurate filtering within large contexts (e.g., cities, sectors)  
  • Multilingual label support  
  • Zero privacy risk (no behavioral or personalized search)  
  • Guaranteed correctness across PWA/browser modes  

Search is intentionally simple. It is not a general-purpose full-text engine.

--------------------------------------------------------------------
13.2 Search Modalities

There are **four categories** of search:

A) **Context-Based Search (Primary Public Mode)**  
   Activated when the user navigates into a context such as:
     • souvenirs/germany/berlin
     • restaurants/germany
     • giftshops/germany/berlin
     • pharmacies/germany/berlin

   The app requests:
       /api/data/list?context=<ctx>

   The server returns only the locations mapped to that context.
   Search then only filters/sorts these results locally.

B) **Context-Scoped Name Filter (Local Filter)**  
   Within an already loaded public context list, the search bar filters by:

     • locationName (localized)  
     • detailSlug (optional)  
     • transliteration-safe matching (accents removed)  

   The app does **not** request new context data while typing.

C) **Owner Business Lookup (SYB, Search-First)**  
   The Business Owner “Select your business” modal is a query-first owner lookup surface.

   Rules:
     • no generic location list is rendered on modal open
     • owner types first
     • client waits for a normalized query threshold of at least 3 characters
     • client debounces typing (~250–300 ms)
     • client requests:
         /api/owner/location-options?q=<term>&limit=5
     • server returns at most 5 already-ranked matches
     • the same response includes display-ready ownership / visibility status for each row
     • client MUST NOT fan out per-row `/api/status` calls

   SYB also presents four static owner routes before search:
     • Create a location
     • Import from Google
     • Create an outlet
     • Recently used

D) **Category / Tag Search (Context-Aware)**  
   Categories are surfaced by contexts.json and published profile attributes.
   User may filter within a context by:
     • groupKey / subgroupKey
     • tags
     • business type

--------------------------------------------------------------------
13.3 Search Data Sources

Search uses two runtime authorities:

  • published KV-backed location profiles (`profile_base:<ULID>` + `override:<ULID>`)
  • contexts.json (hierarchical structure + labels)

Workers do not perform open-ended full-text search; they return structured subsets
and use indexed tokens plus context membership.

Search uses:
  • translated display names  
  • t(key) for categories  
  • locationName in the active language  
  • tags as customer-intent match terms

Behavioral or personalized ranking is never applied.

Deterministic ranking MAY be applied for capped owner lookup results (SYB) using
normalized token hits, prefix matches, exact slug / name matches, and indexed
status-aware ordering.

--------------------------------------------------------------------
13.4 Search Behavior in the App Shell

Search adopts these rules:

  • Case-insensitive  
  • Accent-insensitive  
  • Matches prefixes and contained fragments  
  • Multilingual names included (if provided in the published profile schema) 
  • Fallback to English if translation missing  
  • Input does not alter URL unless context changes  

Public context search never loads more data than the context-scope dataset already fetched.

Owner business lookup (SYB) is separate:
  • no generic list is preloaded on open
  • network search begins only after query threshold is satisfied
  • response size is capped
  • owner status metadata is returned in the same result payload

--------------------------------------------------------------------
13.5 Search Limitations (Deliberate)

Search is intentionally **not**:

  • global across all locations  
  • full-text indexed  
  • fuzzy or typo-tolerant beyond simple normalization  
  • personalized  
  • behaviorally ranked  

This preserves performance, privacy, and predictable UX.

--------------------------------------------------------------------

13.6 Dash Location Selector (Not Full Search)

The Dash header includes a Location / Entity selector used to choose which
location’s analytics to display. It is not a general-purpose search engine.

Behavior:

  • Direct match by slug or ULID
  • Optional internal-only dropdown for known test or admin locations
  • No fuzzy matching, ranking, or global search semantics
  • No analytics or filtering while typing — stats load only after explicit “Go”

This selector operates independently from the app’s Search UI (Section 6.6).

--------------------------------------------------------------------
13.7 Search & Multilingual Support

All search labels use t(key):

  • context titles  
  • category names  
  • location names (localized fields)  

Search never infers grammar or modifies text.
Everything originates either from published KV-backed profile authority, contexts.json, or translation bundles.

--------------------------------------------------------------------
13.8 Search & QR Flows

Search has no impact on QR routing:

  • Info QR deep-links load LPM directly  
  • Promo QR bypasses search entirely  
  • Searching for a location does not modify promo flows or QR state  

Search is strictly a navigation aid.

--------------------------------------------------------------------
13.9 Search & PWA

Search bar and results behave identically whether:

  • in PWA standalone mode  
  • in mobile browser  
  • after installation  
  • offline (using cached profile list for the active context)

Search is resilient and requires no special PWA adaptations.

--------------------------------------------------------------------
13.10 Data Safety & Privacy Constraints

Search must not:

  • store search queries  
  • log per-character input  
  • record search history  
  • profile users across sessions  

Only the event "visited location" is logged (lpm-open), not search behavior.

--------------------------------------------------------------------
13.11 Out-of-Scope

Section 13 does not define:

  • promo or redeem flows (Section 3)  
  • dashboards or analytics (Section 4)  
  • datasets (Section 8)  
  • workers logic (Section 9)  
  • translation system (Section 7)  

It defines **how structured search works as a navigational mechanism** in NaviGen.

--------------------------------------------------------------------

13.12 Search Index Architecture (Durable Objects)

NaviGen search and context listing MUST NOT rely on full dataset scans
once profile authority migrates to KV.

Durable Objects provide indexed lookup and context membership performance.

Durable Objects store index metadata only.
KV (profile_base:<ULID> + override:<ULID>) remains the sole profile authority.

--------------------------------------------------------------------

A) Indexed Fields (Current)

The following fields are indexed for SYB search:

• locationName.*
• listedName
• locationID (slug)
• address
• listedAddress
• postalCode
• city
• adminArea
• tags   — normalized customer-intent match terms

Draft overrides are never indexed.
Only effective published overrides are eligible for indexing.

--------------------------------------------------------------------

B) Context Membership

Context index membership is derived exclusively from the `context` field.

A published location MAY belong to multiple context memberships when `context`
contains multiple semicolon-delimited values.

This does NOT create multiple domains or multiple public identities.
One ULID / one slug / one LPM MAY appear through multiple valid NaviGen
context entry paths.

Changes to context MUST trigger index update.

--------------------------------------------------------------------

C) Partitioning Model

Search index is partitioned by:

• countryCode
• first normalized letter of slug

Context lists are partitioned per contextKey.

Durable Objects store:

• tokenized name → ULID mappings
• slug → ULID mapping
• context → ordered ULID list

--------------------------------------------------------------------

D) Write Protocol

On any base or published override change affecting indexed fields:

1) KV write occurs
2) Worker sends upsert message to correct DO shard
3) DO updates index entries deterministically

Draft writes do NOT trigger index updates.

DO failure semantics:
• DO updates are best-effort and MUST NOT block authoritative KV commits.
• A publish is considered successful once KV writes (override + audit + alias/slug stamping where applicable) succeed.
• If DO update fails, the system MAY retry later, but MUST NOT revert KV state.

--------------------------------------------------------------------

E) Future Extension

Future indexed dimensions may include:

• geo buckets (for “around me” queries)
• eligibility tags (items, buyer qualifiers)
• campaign-active filters

Such extensions must not alter existing client contracts.

--------------------------------------------------------------------

90. EXTENSION ARCHITECTURE (INTERNAL ONLY)

The NaviGen specification uses sections 1–13 as a stable architectural spine.
All new internal subsystems, admin tooling, QA mechanisms, monitoring layers,
and operational models are defined under the 90.x namespace to avoid collision
with core system numbering and preserve long-term clarity.

90.x modules do not alter merchant-facing behavior unless explicitly elevated
to the core specification.

--------------------------------------------------------------------

90.1 Silent QA Auto-Tagging (Location Integrity Signals)

The navigen-api Worker derives operational quality signals for each location
whenever /api/stats?locationID=... is requested.

Tags are written to:

KV_STATUS:
  status:<locationID> => {
    status: "...",
    tier: "...",
    qaFlags: [...],
    qaUpdatedAt: "ISO timestamp"
  }

qaFlags may include:
  "low-scan-discipline"         // complianceRatio < 0.7
  "high-invalid-attempts"       // invalidRatio > 0.10 AND totalInvalid ≥ 3
  "low-cashier-coverage"        // cashier confirmations < 80% of redeems
  "low-customer-confirmation"   // customer confirmations < 50% of armed (armed ≥ 10)
  "qa-ok"                       // no issues detected

These flags are strictly internal and never rendered in merchant UI.

--------------------------------------------------------------------

90.2 NaviGen Admin Dashboard (Future Module)

The Admin Dashboard consumes qaFlags from KV_STATUS and provides
internal operational visibility:

  • Location-level operational integrity  
  • Sector / merchant risk summaries  
  • Sortable anomaly and health lists  
  • Drill-down on compliance deviations over time  
  • Tools for internal support, QA, and compliance teams  

Merchant-facing dashboards remain unaffected.

--------------------------------------------------------------------

90.3 Internal Monitoring & Alerting

Internal monitoring systems may subscribe to qaFlags and:

  • Trigger alerts on repeated low scan discipline  
  • Detect invalid or out-of-window redemption patterns  
  • Identify missing cashier confirmations  
  • Flag suspicious operational behavior for review  
  • Support rolling or threshold-based alerting strategies  

Alerting is strictly internal and not surfaced to merchants.

--------------------------------------------------------------------

90.4 Auto-Prioritization Per Location (Operational Support)

qaFlags feed internal prioritization mechanisms.

Uses include:
  • Ranking locations by operational risk  
  • Highlighting merchants needing onboarding or retraining  
  • Scheduling field-ops follow-up  
  • Supporting fraud-risk models  
  • Improving future campaign integrity  

This system is not visible to merchants.

--------------------------------------------------------------------

90.5 Onboarding Playbook (New Business)

Purpose:  
Ensure a newly added merchant/business is fully operational in NaviGen with
working Info QR, Promo QR, Dash analytics, and future billing compatibility.

90.5.1 Data Preparation (GSheets → JSON)

(A) location_data → profiles.json  
  • locationID (slug, stable, unique)  
  • locationName (multilingual)  
  • groupKey / subgroupKey  
  • context (primary landing path, e.g. souvenirs/germany/berlin)  
  • coordinates  
  • contact & media fields  
  • QR URL override (optional; Info QR defaults to <context>?lp=<id>)  

(B) campaign_data → campaigns.json deprecated
  Campaign lifecycle and entitlement are KV-authoritative.
  No JSON file is used for runtime campaign logic.

(C) finance_data → finance.json  
  • sectorKey + countryCode  
  • currency  
  • campFee, campFeeRate  

(D) contexts_data → contexts.json  
  Defines all valid navigational URL shells:
    /souvenirs
    /souvenirs/germany  
    /souvenirs/germany/berlin  
    /giftshops/germany/berlin  
  Each context row includes visibility flag, title, languages, ordering.

90.5.2 JSON Export Pipeline

A scheduled Apps Script exports the four sheets into:
  • /data/profiles.json  
  • /data/finance.json  
  • /data/contexts.json  

These exports remain useful for migration, audit, and legacy tooling, but runtime profile reads and campaign logic do not use `profiles.json` or `campaigns.json` once Phase 8 and KV-authoritative campaigns are enabled.

90.5.3 Alias / ULID Seeding

New slugs must be mapped to canonical ULIDs:

  POST /api/admin/seed-alias-ulids

Worker creates:
  alias:<slug> => { locationID: "<ULID>" }

From then on:
  • All APIs accept slug or ULID  
  • Dash works at /dash/<slug> or /dash/<ULID>  
  • Stats, QR, Promo flows normalize to ULID internally  

90.5.4 Onboarding Smoke Tests

Info QR:
  • GET /api/qr?locationID=<slug>  
  • Scan → LPM opens correctly  

Promo QR:
  • GET /api/promo-qr?locationID=<slug>  
  • Validate ARMED log  
  • Scan redeem QR → REDEEM or INVALID logged  

Dash:
  • /dash/<slug>  
  • Click Info → qr-scan increments  
  • QR Info → scan / redeem / invalid rows present  
  • Campaigns → Armed / Scans / Redemptions / Invalids  
  • Analytics → QA section populated  

90.5.5 Launch Readiness

A business is production-ready once:
  • Info QR and Promo QR flows validated  
  • /api/stats reflects all event types  
  • Dash displays full analytics  
  • Admin systems generate qaFlags  
  • Billing can be enabled later without schema changes  

--------------------------------------------------------------------

91. MERCHANT ONBOARDING & BILLING

91.1 Purpose

This section defines how commercial actors establish operational authority over
locations on NaviGen, how campaigns are funded, and how billing is applied.

The model prioritizes:
• immediate activation
• minimal friction
• clear responsibility
• strong operational integrity

NaviGen does not require manual document review or account creation.
Operational authority is established through successful payment.

--------------------------------------------------------------------

91.2 Merchant Entity Definition

A merchant entity in NaviGen is any legal or natural person who purchases a paid
Plan through Stripe Checkout.

The payor is recognized as the authorized operator of the paid Plan window and its
covered location(s) for the duration of the ownership window.

This model avoids traditional KYC friction while preserving clear economic
responsibility.

--------------------------------------------------------------------

91.3 Onboarding Entry Points

Onboarding defines how a Location Profile Modal (LPM) is created and how
operational authority is established.

An LPM may be created through three entry paths.
All paths share the same invariant:

• No LPM may be published without an active Plan purchase.
• Draft creation may occur without payment, but publication requires a Plan.
  Creation without payment produces a non-published draft state only.
  Publication requires Plan payment.
• Payment establishes ownership.
• Creation method does not affect authority.

--------------------------------------------------------------------

A) Owner Self-Creation (Manual Structured Draft)

Description:
A Business Owner creates a private shell directly in NaviGen using structured
input. This is the primary self-serve creation path.

Legacy UI copy such as “Request a listing” is non-normative and does not imply
an admin review queue. The operative meaning is self-creation draft save.

Structured inputs may include:
• business information
• context information
• business description
• links to the business
• media
• optional coordinates

Flow:
1) BO completes the structured self-creation form.
2) System saves a private shell draft.
3) BO obtains a paid Plan.
4) BO publishes the location.
5) Within the same paid window, BO may later choose **Visibility only** or **Promotion**.

Notes:
• Draft save alone creates no public visibility.
• Draft save alone creates no ownership authority.
• First publication is paid only.

--------------------------------------------------------------------

B) Owner Self-Creation (Google Import)

Description:
A Business Owner uses embedded Google business lookup inside NaviGen.
The BO searches by business name and city, selects the correct Google business,
and NaviGen receives `place_id` internally.

Target behavior:
• normal BO UX does not expose or ask for `place_id`
• embedded Google lookup returns internal `place_id`
• NaviGen checks same-device duplicate draft
• NaviGen checks place_id cache
• NaviGen checks unpaid unique-place quota
• if allowed, NaviGen performs full Places API New hydration upfront
• hydrated Create Location draft opens immediately
• BO reviews and edits all fields
• checkout / plan activation follows as the conversion step

Implemented / required behavior:
1) BO searches and selects a Google business in embedded lookup
2) NaviGen receives `place_id` internally
3) duplicate same-device `place_id` reopens / updates the same draft
4) cached place_id payload is reused where available
5) unique unpaid place_id imports are quota-controlled
6) full Places API New hydration creates a complete draft before checkout when policy allows
7) Create Location becomes the BO review/edit step
8) checkout / plan activation arms publish / network continuation

Notes:
• This is a BO self-creation path, not an admin request path.
• Publication is paid only.

--------------------------------------------------------------------

C) Owner Self-Creation (Outlet Spin-Off)

Description:
A Business Owner creates a physically separate outlet from an existing source profile.
The outlet may be a pop-up, temporary outlet, festival booth, seasonal outlet, market stall, or event outlet.

Source profile options:
• existing NaviGen business profile
• existing NaviGen draft
• Google business selected through embedded Google lookup

Behavior:
1) BO clicks Create an outlet in Create Location SYB.
2) NaviGen asks for the source profile.
3) BO selects an existing NaviGen profile or uses embedded Google lookup.
4) If Google lookup is used, NaviGen receives `place_id` internally.
5) Source profile is hydrated or loaded from cache.
6) NaviGen copies portable business/profile fields into a new outlet draft.
7) BO must provide separate outlet physical details.
8) BO confirms the outlet is physically separate from the source business.
9) BO reviews and edits all fields.
10) BO proceeds to checkout / plan activation.
11) Plan activation arms publish / network continuation.

Portable fields that may be copied:
• business name / brand name
• business type / cuisine tags
• website
• general phone number
• BO-owned logo or BO-owned media where already in NaviGen
• basic description where available
• internal category metadata

Fields that must not become outlet identity:
• source Google place_id
• source Google Maps URL
• source Google formatted address
• source Google coordinates
• source Google rating / rating count
• source Google business status
• source provider photos or reviews

Outlet-required fields:
• outlet name or label
• outlet kind
• venue or event name
• outlet address or venue address
• outlet map pin / coordinates
• start date
• end date
• outlet opening hours or operating notes
• confirmation that the outlet is physically separate from the source business

Outlet identity rule:
The source Google place_id belongs to the source profile.
The outlet does not inherit the source Google place_id as its own identity.
The outlet’s own googlePlaceId remains empty unless the outlet has its own legitimate Google place_id.

--------------------------------------------------------------------

D) Admin Bulk Seeding (Internal / Optional)

Description:
NaviGen may bulk seed records for migration, coverage, outreach, or operational
preparation. This is an internal inventory path, not a BO self-serve path.

Typical outcomes:
• preseeded alias / ULID mappings
• preseeded public inventory during migration / cutover
• draft-ready internal records for later owner-controlled completion

Notes:
• Bulk seeding does not itself grant ownership.
• Bulk seeding does not replace BO self-creation.

--------------------------------------------------------------------
Convergence Rules (Non-Negotiable)

• No LPM may be published without an active paid Plan.
• Draft creation may occur without payment but has no visibility or authority effect.
• Draft creation never creates an unpaid parked public state.
• Publication and later visibility restoration are paid only.
• For an already published but expired location, discoverability is restored only through a new paid Plan window surfaced in owner flows as **Run campaign** / **Renew visibility**.
• Within that paid window, the owner may choose **Visibility only** or **Promotion**.
• Ownership always belongs to the store operator.
• Manual self-creation remains the base BO path.
• P9 makes embedded Google Import the normal Google self-creation path and removes BO-visible `place_id` handling from the normal UX.
• Admin bulk seeding is separate from BO self-serve creation.
• There is no admin approval queue in BO self-creation.

--------------------------------------------------------------------

91.3.4 Agent Attribution & Deal Qualification

### Agent Role

An Agent is a third party who identifies and assists an Owner in creating or
activating an LPM and campaign on NaviGen.

Agents do not gain ownership rights.

### Deal Qualification Rule

A deal is recognized ONLY when a campaign is successfully paid.

• Leads without payment are not honored
• Attribution occurs at campaign payment time
• Agent initiation must be explicitly recorded

### Attribution Invariant

Agent attribution is bound to:
• a paid campaign
• a specific location
• a specific campaignKey

Agent compensation derives from campaign fees and is calculated internally.

--------------------------------------------------------------------

Invariant:

NaviGen provides a single, automated LPM creation mechanism.
Differences between Owner, Agent, or NaviGen-initiated onboarding affect
attribution and compensation only, not platform behavior or authority.

--------------------------------------------------------------------

Clarification on Section Scope

Section 91.3 defines how Location Profile Modals (LPMs) come into existence and
how onboarding is initiated.

Section 92.2 defines how ownership is established over an LPM once it exists.

The overlap between these sections is intentional.
Onboarding and ownership are related but distinct concerns and are specified
separately to preserve clarity and enforceability.

--------------------------------------------------------------------

91.4 Operational Authority Model

NaviGen does not perform identity verification in the traditional sense.
Authority in NaviGen is operational, not legal.

--------------------------------------------------------------------

A) Authority Triggers (Authoritative Events)

Operational authority over an LPM is established automatically when all of the
following conditions are met:

• A Stripe Checkout payment succeeds
  Authority refers to ownership and publish capability only.
  Draft existence does not imply authority.
• Billing profile data is available from Stripe
• ownership record (ownership:<ULID>) is created or updated
• internal ownership mapping assigns the payor as Owner/Operator

Authority is established only by verified backend payment events.

--------------------------------------------------------------------

B) Authority Rules (Invariants)

• Payment establishes operational authority.
Authority established by payment grants:
• ownership (exclusiveUntil window), AND
• publish capacity (if defined by Plan tier).
• Authority is time-limited and revocable.
• Authority is capability-based, not identity-based.
• Authority is enforced exclusively by backend logic.

Operational authority is established only through a paid Plan purchase.

A paid Plan may be operated in one of two owner-selected presets:
• Visibility only
• Promotion

Both presets are time-limited and equivalent in authority during the active Plan window.

--------------------------------------------------------------------

C) Stripe Customer Records (Explicit Non-Identity)

Stripe Customer records are not treated as user accounts.

They are used exclusively for:
• payment processing
• invoicing
• tax handling
• internal reconciliation

They do not define:
• login identity
• session continuity
• ownership persistence

--------------------------------------------------------------------

D) Commercial Attribution & VAT

• Stripe billing details provide sufficient commercial attribution.
• VAT data is collected only when required by jurisdiction
  or explicitly provided by the payor.
• NaviGen does not perform KYC beyond Stripe-provided billing signals.

--------------------------------------------------------------------

E) Verification Scope & Liability

Verification in NaviGen is operational, not legal.

By completing a paid Plan purchase, the payor asserts authorization to:
• operate the selected paid Plan window
• act on behalf of the associated covered business location(s)

NaviGen acts solely as a technology vendor providing campaign infrastructure.
It does not participate in, arbitrate, or guarantee the underlying commercial
transaction between business and customer.

--------------------------------------------------------------------

F) Suspension & Misuse Handling

Campaign suspension is not driven by chargebacks or payment disputes.

Suspension occurs only through:
• explicit Owner action, or
• staff-initiated reports from the business location

Unintended campaigns:
• Cashier may flag “Report unintended campaign”.
• NaviGen immediately pauses the campaign.
• NaviGen contacts the payor for resolution.

Suspension revokes operational authority until resolved.

--------------------------------------------------------------------

G) Ownership Acquisition Paths (Clarified)

Ownership may be established only through a paid Plan purchase.

Paid Plan presets:

1) Visibility only
• Establishes ownership automatically.
• Grants the same ownership capabilities as Promotion during the active Plan window.
• Disables Promo QR / cashier / redeem flows in Campaign Management.
• Does NOT require a consumer-facing offer.

2) Promotion
• Establishes ownership automatically.
• Grants the same ownership capabilities as Visibility only during the active Plan window.
• Enables the full Promo QR / cashier / redeem path.

Rules:
• There is no standalone Exclusive Operation Period.
• There is no €5 ownership-extension product.
• Plan pricing and capacity are defined by the Plan ladder, not by separate exclusivity products.

--------------------------------------------------------------------

91.4.1 Ownership Record (Authoritative KV State)

Definitions:
• Ownership record: the authoritative server-side state describing current ownership for one LPM.
• KV key name: the exact key used to store and retrieve the ownership record for an LPM ULID.
• Fields: the JSON properties stored under the ownership key.
• Writer: the only component allowed to create/update the ownership record.
• Readers: components allowed to read the record for enforcement and UX.

KV key name:
• ownership:<ULID>

Fields (JSON):
• uid: <ULID>                         // canonical location identity
• state: "unowned" | "owned"          // derived from exclusiveUntil but stored for clarity
• exclusiveUntil: ISO-8601 timestamp  // ownership is active iff now < exclusiveUntil
• source: "plan"                      // paid Plan purchase established/extended ownership
• lastEventId: string                 // idempotency anchor (Stripe payment_intent.id)
  Plan anchor invariant: lastEventId MUST equal the PaymentIntent ID of the currently active Plan purchase for this ownership window.
• updatedAt: ISO-8601 timestamp       // last write time

Ownership vs Campaign Separation (Authoritative)

Ownership, campaign budget, and campaign calendar are independent dimensions.

Rules:
• Ownership represents operational authority and analytics privacy.
• Campaign budget represents promotional volume (redeem capacity).
• Campaign calendar represents when a promotion is visible.

Constraints:
• Campaign budget size MUST NOT affect ownership duration.
• Campaign performance (redeems, traffic) MUST NOT extend or shorten ownership.
• Campaign top-ups that do not extend the campaign calendar MUST NOT extend ownership.

Writer (authoritative):
• API Worker is the Stripe webhook processor and is the only writer of ownership:<ULID>.
• Ownership is established or extended only upon verified Stripe webhook events processed by the API Worker.
• Pages Worker MUST NOT create, extend, or mutate ownership records under any circumstances.

Readers (enforcement):
• API Worker: enforces owner-only capabilities (Dash access, campaign control, profile edits).
• Pages Worker: may read to display non-authoritative “Owned” hints, but MUST NOT grant access.
• Dash: consumes API responses only; it does not read KV directly.

Invariants:
• Ownership never becomes active based on client input.
• Cookies and Payment ID–based Restore Access provide access continuity, not authority.
• Any owner-only capability requires now < exclusiveUntil at request time.
• Webhook deliveries MUST be processed idempotently using payment_intent.id.

--------------------------------------------------------------------

91.4.2 Stripe Metadata Contract (Ownership & Attribution)

Definitions:
• Stripe metadata contract: required metadata keys attached to Stripe objects to drive ownership and attribution.
• Canonical Stripe object: the Stripe object treated as authoritative for successful payment.
• Idempotency anchor: the unique identifier ensuring exactly-once processing.
• Initiation type: identifies who initiated onboarding.
• Agent attribution: optional linkage to an agent for compensation tracking.

--------------------------------------------------------------------

A) Canonical Stripe Object

• The canonical object is PaymentIntent.
• checkout.session.completed is used as the entry webhook, but ownership and billing
  must be keyed to the underlying payment_intent.id.

Rationale:
• PaymentIntent represents finalized funds movement.
• Webhook retries and ordering are idempotently resolved via payment_intent.id.

--------------------------------------------------------------------

B) Required Metadata (Mandatory)

The following metadata keys MUST be present on the Checkout Session
and MUST be copied onto the PaymentIntent.

Common keys:
• initiationType        // "owner" | "agent" | "platform"
• campaignPreset        // "visibility" | "promotion"
• navigenVersion        // spec/app version for audit/debug

Target identity keys (exactly one route MUST be used):

Existing-location route:
• locationID (slug)     // external identifier; resolved server-side to a canonical ULID

Brand-new private-shell route:
• draftULID             // server-issued draft identity from /api/location/draft
• draftSessionId        // server-issued private-shell actor key from /api/location/draft

Rules:
• Existing-location checkout MUST use `locationID` only.
• Brand-new private-shell checkout MUST use `draftULID` + `draftSessionId`.
• Arbitrary ULIDs must never be supplied by clients or Stripe metadata.
• `draftULID` is allowed only when it was server-issued by `/api/location/draft`.
• Slug is not required for brand-new checkout and is stamped only at publish.
• initiationType controls attribution logic only; it does not affect authority.
• ownershipSource determines which ownership window is extended.

--------------------------------------------------------------------

C) Optional Metadata (Conditional)

• agentId               // required if initiationType="agent"
• campaignKey           // required if ownershipSource="campaign"

Rules:
• agentId MUST be present at payment time to qualify for attribution.
• Missing agentId means no agent attribution, even if an agent was involved earlier.

--------------------------------------------------------------------

D) Idempotency & Exactly-Once Processing

• payment_intent.id is the idempotency anchor.
• Each payment_intent.id may produce:
    - at most one ownership extension, and
    - at most one ledger TopUp entry.
• Duplicate or out-of-order webhooks must be ignored safely.

--------------------------------------------------------------------

E) Writer Responsibilities (Webhook Processor)

On successful payment confirmation, the webhook processor MUST:

1) Validate presence and correctness of required metadata.  
2) Resolve ownership record:  
     • extend exclusiveUntil according to ownershipSource rules.  
3) Write/update ownership:<ULID> using payment_intent.id as lastEventId.  
4) Write billing ledger TopUp entry.  
5) If agentId present:  
     • write agent attribution record (see Mini-spec #4).

Webhook processing is idempotent and reconciliation-focused.

Checkout success (Stripe session complete + paid) is the state transition trigger.  
Webhook remains an idempotent reconciliation layer.

No other component may establish ownership.

--------------------------------------------------------------------

F) Non-Goals (Explicit)

The Stripe metadata contract does NOT:
• define pricing or fee calculation
• create user or owner accounts
• store personal data beyond Stripe-provided billing info
• imply legal ownership or identity verification

It exists solely to provide deterministic, auditable backend state transitions.

--------------------------------------------------------------------

91.4.3 Agent Attribution Record & Cap Tracking

Definitions:
• Agent attribution record: authoritative linkage between an agent, an LPM, and a payment event.
• Attributed LPM: a location whose qualifying revenue contributes toward an agent’s cap.
• Revenue share: percentage of qualifying revenue allocated to the agent.
• Cap: maximum commission amount per agent per LPM.
• Cap tracking: accumulation of commission until the cap is reached.

--------------------------------------------------------------------

A) Attribution Creation (Authoritative Event)

An agent attribution record is created only when:

• initiationType = "agent" in Stripe metadata
• agentId is present at payment time
• a Stripe payment succeeds (PaymentIntent confirmed)

Attribution MUST be established at payment time.
Attribution cannot be added, modified, or retroactively applied later.

--------------------------------------------------------------------

B) Attribution Record (Data Model)

For each attributed LPM, the system stores:

agent_attribution:<agentId>:<ULID> = {
  agentId: string,
  ulid: <ULID>,
  tier: "starter" | "active" | "strategic",
  sharePercent: number,          // e.g. 30 | 40 | 50
  capAmount: number,             // e.g. 500 | 1000 | 1500 (EUR)
  accruedAmount: number,         // total commission accrued so far
  createdAt: ISO-8601,
  lastUpdatedAt: ISO-8601
}

This record is authoritative for cap enforcement.

--------------------------------------------------------------------

C) Qualifying Revenue Sources

The following revenue sources contribute toward agent commission:

• campaign setup fees
• redeem-based fees
• Exclusive Operation Period fees

The following do NOT contribute:

• refunds
• internal adjustments
• penalties
• non-monetary credits

--------------------------------------------------------------------

D) Revenue Share Calculation

For each qualifying revenue event:

1) Compute agentShare = grossAmount × sharePercent.
2) If accruedAmount + agentShare ≤ capAmount:
     • allocate full agentShare.
3) If accruedAmount + agentShare > capAmount:
     • allocate only (capAmount − accruedAmount).
4) Update accruedAmount accordingly.
5) Once accruedAmount = capAmount:
     • no further revenue is shared for this LPM.

Revenue sharing is strictly capped and non-recurring beyond the cap.

--------------------------------------------------------------------

E) Tier Assignment & Promotion

Agent tier determines sharePercent and capAmount.

Tier assignment rules:
• Starter: 30% share, €500 cap
• Active: 40% share, €1,000 cap
• Strategic: 50% share, €1,500 cap

Promotion is automatic and irreversible.

Promotion criteria (OR condition):
• revenue-based threshold reached, or
• minimum number of LPMs with ≥1 paid campaign reached

Tier changes apply only to future attribution records.
Existing records retain their original tier and cap.

--------------------------------------------------------------------

F) Enforcement & Audit

• Agent attribution records are written once and never deleted.
• Cap tracking is append-only and monotonic.
• Commission allocation is computed server-side only.
• Dash and merchant UI never expose agent attribution or commission data.

--------------------------------------------------------------------

G) Non-Goals (Explicit)

Agent attribution does NOT:
• grant ownership rights
• affect campaign pricing for merchants
• alter billing calculations
• support retroactive attribution
• allow uncapped or perpetual revenue sharing

Agent compensation is bounded, auditable, and deterministic.

--------------------------------------------------------------------

91.5 Billing Model (Prepaid Wallet)

Billing in NaviGen converts verified backend events into financial charges.
It is fully prepaid, backend-driven, and independent of client behavior.

--------------------------------------------------------------------

A) Billing Preconditions

• All billable activity requires a prepaid balance.
• No credit, postpaid, or deferred billing is supported.
• Campaigns and Exclusive Operation Periods operate only while prepaid funds exist.

--------------------------------------------------------------------

B) Billable Event Definition

A billable event occurs only when:

• A redeem token transitions from "fresh" → "ok"
• The transition is executed by the API Worker
• A REDEEM event is logged server-side

No other event is billable.

The following are never billable:
• ARMED events
• SCAN events
• INVALID events
• cashier/customer confirmation events
• client-side signals of any kind

--------------------------------------------------------------------

C) Pricing Inputs (Authoritative)

Billing calculations rely exclusively on:

• redeem event metadata
• campaignKey
• sectorKey
• countryCode
• finance.json pricing definitions

Billing does not trust:
• client UI state
• URLs or query parameters
• timestamps supplied by devices

--------------------------------------------------------------------

D) Balance Handling

• Each campaign has an associated prepaid balance.
• Redeem charges deduct from the balance atomically.
• When balance reaches zero:
    - the campaign is automatically paused
    - no further redeems are accepted
• Balance may never become negative.

--------------------------------------------------------------------

E) Ledger & Audit Trail

All billing activity is recorded in an internal ledger.

Ledger entry types include:
• TopUp
• RedeemCharge
• Adjust (internal only)
• Refund (internal only)

Ledger entries are:
• append-only
• immutable
• timestamped
• fully auditable

--------------------------------------------------------------------

F) Separation from UI & Analytics

• Billing logic is never executed on the client.
• Billing data is never exposed in Dash.
• Analytics and QA signals do not affect billing amounts.

Billing correctness depends solely on backend token consumption.

--------------------------------------------------------------------

G) Failure & Edge Handling

• Duplicate webhook deliveries must be idempotent.
• Partial failures must not corrupt balances or ledgers.
• Expired or reused tokens never generate charges.
• Out-of-window redeems are rejected before billing.

--------------------------------------------------------------------

H) Non-Goals (Explicit)

Billing does not implement:
• subscriptions
• recurring charges
• automatic renewals
• client-side balance calculations
• merchant-visible cost breakdowns

Billing exists solely to convert verified redeem events into charges.

--------------------------------------------------------------------

91.6 VAT & Tax Handling

VAT data is collected only when:
  • Stripe provides billing_details.address.country
  • Merchant optionally enters VAT ID on Owner Platform

Invoices:
  • Stripe invoices include VAT based on Stripe Tax logic
  • Merchant can reclaim VAT if VAT number provided
  • NaviGen holds no fiduciary obligations beyond Stripe’s tax rules

--------------------------------------------------------------------

91.7 Risk, Abuse, and Abuse-Mitigation Model

Because campaigns require payment:
  • False-claim risk is extremely low
  • Economic incentive discourages malicious impersonation
  • First cashier encountering unintended campaign will decline promo
  • “Report unintended campaign” freezes immediately

NaviGen may:
  • Reverse, suspend, or investigate campaigns
  • Contact payor for clarification
  • Deny refunds for intentional misrepresentation

--------------------------------------------------------------------

91.8 Out-of-Scope
  • Worker logic (Section 9)
  • Billing computation (Section 5)
  • Legal contract text (separate ToS)
  • Full Merchant Portal UI (future expansion)
  • Owner platform user flows (Section 92)
  
--------------------------------------------------------------------

92. OWNER PLATFORM UX & FLOWS

--------------------------------------------------------------------
92.1 Purpose

The Owner Platform provides a controlled interface through which economic
actors establish and exercise ownership over a Location Profile Modal (LPM).

It is not a merchant dashboard and not an account-based system.

The Owner Platform exists to:
• establish ownership through payment
• grant exclusive access to analytics and profile control
• enable safe, auditable profile editing
• collect verified, high-quality business data for NaviGen

Ownership is time-bound, payment-based, and capability-driven.

--------------------------------------------------------------------
92.2 Ownership Entry Points

Ownership may be established through two primary flows:

A) Existing LPM (Claim by Operation)

• An LPM exists publicly (scraped, commissioned, or system-generated).
• Any actor may view it in the unowned (public) state.
• Selecting “Run Campaign” initiates ownership.
• Successful payment establishes ownership immediately.

This model treats *operation* as proof of authority.

B) New LPM Creation (Owner-Initiated)

• An actor creates a new location via the Owner Platform.
• Minimal required inputs:
    - business name
    - address (optional) OR coordinates (required)
    - reference link or website
    - initial data sufficient to create a draft
    (publish requires full validation per Section 92.3.3)    
• Ownership is not granted until payment completes.
• After payment:
    - LPM is created
    - ownership is established
    - analytics and editing become exclusive

There is no concept of “reserved” or “pending” ownership without payment.

--------------------------------------------------------------------

92.2.1 Campaign Funding / Plan Selection UX (Owner-Facing Bridge)

For campaign-led ownership flows, the owner-facing bridge into multi-location
behavior MUST begin with visible Plan selection.

This applies to:
• Run campaign
• Renew campaign
• Manage campaign when a new Plan is required
• inline upgrade flows triggered by scope or capacity limits

Owner-facing sequence:

• Choose plan
• Choose campaign scope
• Choose locations
• Checkout / activate

Step visibility rules:
• Plan choice MUST precede any multi-location decision.
• Scope step appears only when the chosen or current Plan qualifies for multi-location control.
• Locations step appears only when scope = "selected" or scope = "all".
• Standard proceeds in single-location flow only.

The UI MUST explain the chosen Plan in plain language:
• how many locations can join the campaign
• whether future proven same-device locations may auto-join under “All my locations”
• that only locations already proven on this device are eligible

The UI MUST NOT expose internal terms such as campaignGroupKey,
maxPublishedLocations, or derived portfolio to BOs.

This bridge is the required owner-facing layer between payment, scope availability,
and location selection.

--------------------------------------------------------------------

Campaign Preset Within a Paid Plan

A paid Plan may be operated in one of two presets:

• Visibility only
• Promotion

The preset affects whether promo / redeem flows are shown in Campaign Management,
not whether the paid Plan produces Campaign Entitlement.

Both presets:
• establish ownership through payment
• create an entitlement-bearing active row during the active Plan window
• grant the same analytics privacy and profile control during the active Plan window
• are time-limited
• do not create an account or permanent rights

Preset distinction:
• `Visibility only` suppresses promo / redeem flows in Campaign Management but still counts as CampaignEntitled for Dash access and promoted ordering during the active Plan window.
• `Promotion` does the same and additionally enables promo / redeem flows.

There is no standalone non-campaign exclusive product.

--------------------------------------------------------------------

92.3 Ownership Capabilities

Ownership grants a bounded set of exclusive capabilities for a specific LPM
while ownership is active (exclusiveUntil > now).

Capabilities are payment-derived, time-limited, and enforced server-side.
No capability exists outside an active ownership window.

Publish authority is controlled by Plan & Publish Capacity (Section 92.3.2).

Ownership alone does not guarantee the ability to publish
if publish capacity is exhausted or Plan is inactive.
Publish capacity alone does not establish ownership without an active ownership window.

--------------------------------------------------------------------
A) Capability Categories

Ownership capabilities fall into three categories:

1) Visibility
2) Campaign Operations
3) Profile Editing

Each category is defined independently and enforced explicitly.

--------------------------------------------------------------------
B) Visibility Capabilities

While owned:

• Dashboard analytics for the LPM are private.
• Only the Owner may access Dash views for that location.
• Analytics remain merchant-safe (counts-only; no QA internals).

When ownership expires:

• Dash access becomes blocked for that LPM.
• No real analytics are exposed.
• No historical data is deleted or altered.

Visibility is binary; there are no partial or metric-level visibility tiers.

--------------------------------------------------------------------
C) Campaign Operations

While owned, the Owner may:

• Start a new campaign.
• Pause an active campaign.
• Resume a paused campaign.
• Finish a campaign permanently.
• Top up campaign budget.

Rules:

• Campaign operations are permitted only if ownership is active.
• Campaign activity may extend or maintain ownership.
• campaigns.json is deprecated
  Campaign lifecycle and entitlement are KV-authoritative.
  No JSON file is used for runtime campaign logic.
• Owners cannot modify campaign identity, pricing rules, or sector mappings.

Campaign Performance Independence

• Campaign underperformance MUST NOT require ownership extension.
• Low redeem volume MUST NOT coerce additional exclusivity payments.
• Campaign budget exhaustion pauses promotion but does not revoke ownership.
• Ownership exists to control and observe, not to guarantee performance.

--------------------------------------------------------------------
D) Profile Editing Capabilities (Payment-Gated)

While owned, the Owner may edit a limited, explicitly defined subset of LPM fields.

Editable fields (whitelist):

• business description
• contact details (phone, email, website)
• links and social profiles
• images (within defined limits)
• opening hours

Editing rules:

• Editing is permitted only while ownership is active.
• All edits are validated server-side.
• All edits are attributable to a paying actor.
• All edits are logged for audit.
• Edits may be reverted internally if misuse is detected.

Non-editable fields (hard restrictions):

• locationID / slug
• ULID / alias mappings
• coordinates
• sectorKey / groupKey / subgroupKey
• context
• tags
• finance mappings
• internal classification
• QA flags or diagnostics

Rationale:

Payment establishes economic accountability.
This prevents prank edits, vandalism, and malicious data poisoning.

--------------------------------------------------------------------
E) Capability Enforcement

All ownership capabilities are enforced exclusively by backend logic.

Rules:

• Client UI may display capabilities but must never infer them.
• API Worker checks ownership state (exclusiveUntil > now) for every operation.
• Cookies or Payment ID–based Restore Access provide access continuity, not authority.
• Authority is never inferred from navigation context or UI state.

--------------------------------------------------------------------
F) Capability Revocation

Capabilities are revoked immediately when:

• ownership expires, or
• ownership is suspended due to reported misuse.

Revocation effects:

• Campaign operations are blocked.
• Profile editing is blocked.
• Exclusive analytics access is removed.

Revocation does not affect:

• historical analytics data
• public LPM visibility after reversion

--------------------------------------------------------------------

G) Non-Destructive & Accountable Authority (Critical Invariant)

Ownership in NaviGen grants the ability to modify presentation data,
but never the ability to cause irreversible harm.

Invariants:

• No owner action can directly erase or mutate a published LPM identity.
• No owner action can suppress a competitor’s discoverability.
• No owner action can erase historical analytics, QR logs, or stats.
• Normal owner edit flows cannot alter navigation contexts or ranking logic.
• Post-publish geo / taxonomy correction is permitted only through retire + recreate (Appendix H.6).

Accountability rules:

• All owner edits are logged server-side with:
    - ULID
    - edited fields
    - timestamp
    - payment_intent.id
    - initiationType

• Ownership is explicitly non-anonymous.
  Every edit is economically attributable via Stripe payment records.

• In case of reported misuse or dispute:
    - edits can be reviewed internally,
    - reverted by NaviGen,
    - and traced to the responsible payor.

Rationale:
Low-cost ownership lowers entry friction, not accountability.
Malicious edits are discouraged by traceability, not by technical barriers.

--------------------------------------------------------------------

Edit Accountability Notice (Mandatory UX)

Before submitting any profile edit, the UI MUST present a clear accountability notice.

The notice MUST state:

• “Profile edits are logged and attributable to the payment used to claim this location.”
• “Edits may be reviewed and reverted in case of misleading, malicious, or wrongful changes.”
• “Ownership does not grant anonymity or permanent control.”

The notice MUST also include a reference to the applicable Terms & Conditions:
• “Edits are subject to NaviGen’s Terms & Conditions.”

UX rules:
• The notice must be shown at least once per ownership period.
• It may be presented as a toast, inline warning, or modal hint.
• It must not be permanently dismissible.

Rationale:
In a no-account system, deterrence relies on explicit accountability,
economic attribution, and clear contractual framing rather than technical prevention.


--------------------------------------------------------------------

92.3.1 Profile Edit API (Owner-Only)

Definitions:
• Profile Edit API: backend endpoint handling owner-initiated profile updates.
• Editable whitelist: the fixed set of fields owners may modify.
• Override record: owner-provided values stored separately from canonical base record `profile_base:<ULID>`.
• Audit log: append-only record of all edit operations.
• Ownership gate: enforcement of exclusiveUntil > now.

--------------------------------------------------------------------

A) Endpoint Definition

• Method: POST
• Path: /api/profile/update
• Auth requirement: active ownership (exclusiveUntil > now)
• Input format: JSON
• Side effects: writes override + audit records only

Client UI must never attempt local profile mutation.

--------------------------------------------------------------------

B) Ownership Gate (Mandatory)

The API Worker MUST verify before processing any edit:

• ownership:<ULID>.exclusiveUntil > now

If the check fails:
• Request is rejected (403 Forbidden).
• No partial writes occur.

Cookies, Restore Access, or UI state must never bypass this check.

--------------------------------------------------------------------

C) Editable Field Whitelist

Owners MAY edit only the following fields:

• description
• contact.phone
• contact.email
• contact.website
• contact.whatsapp
• contact.telegram
• contact.messenger
• links.social (facebook, instagram, tiktok, youtube, spotify, etc.)
• openingHours
• media.coverImage
• media.images[]

All other fields are immutable.

--------------------------------------------------------------------

D) Hard Non-Editable Fields

The following fields MUST NEVER be editable via this API:

• locationID / slug
• ULID / alias mappings
• coordinates (lat, lng)
• sectorKey / groupKey / subgroupKey
• context
• tags
• finance mappings
• campaign definitions or metadata
• QA flags or internal diagnostics
• sources / provenance metadata

Requests attempting to modify these fields must be rejected.

--------------------------------------------------------------------

E) Validation Rules

• URLs must be https:// and syntactically valid.
• Email must match basic RFC format.
• Phone numbers must contain ≥7 digits after normalization.
• Images:
    - allowed types: jpg, png, webp
    - max file size: 2 MB
    - max count: implementation-defined (recommended ≤8)
• Text fields must respect length limits and pass basic profanity filtering.

Validation failures return a structured error response.

--------------------------------------------------------------------

F) Storage Model (Non-Destructive)

Profile edits MUST NOT mutate `profile_base:<ULID>`.

Instead, the API Worker writes:

• override:<ULID>           // current effective override snapshot
• override_log:<ULID>:<ts>  // append-only audit entry

Rules:
• overrides shadow canonical base profile fields at read time.
• `profile_base:<ULID>` remains immutable in normal owner edit flows.
• override deletion or rollback is possible internally.

--------------------------------------------------------------------

G) Audit & Attribution

Each audit entry MUST include:
• ULID
• edited fields
• timestamp
• payment_intent.id (from ownership record)
• initiationType for audit attribution MUST be sourced from the persisted `plan:<payment_intent.id>` record; publish MUST NOT call Stripe to recover it.

Audit logs are internal-only and never exposed in UI.

--------------------------------------------------------------------

H) Non-Goals (Explicit)

The Profile Edit API does NOT:
• allow partial ownership or delegation
• support draft or pending edits via /api/profile/update (drafts are handled separately by /api/location/draft)
• permit bulk or cross-location edits
• expose edit history to merchants
• bypass ingestion or QA pipelines

Profile editing is a controlled, owner-only capability.

--------------------------------------------------------------------

92.3.2 Plan & Publish Capacity (Location Scope Control)

Definitions:
• Plan: A prepaid Stripe purchase (campaign or multi-location tier)
  that grants campaign capability and publish capacity.
• Publish Capacity: The maximum number of locations that may be published under one Plan.
• Published Location: A location with an active override layer promoted to public state.
• KV allocation key: plan_alloc:<payment_intent.id> → { ulids: [<ULID>, ...] }  // published locations counted toward this Plan
• KV plan record: plan:<payment_intent.id> → { priceId, tier, maxPublishedLocations, purchasedAt, expiresAt, initiationType, campaignPreset }

Owner-facing tier contract (authoritative)

Owner-facing Plan labels and capacities are:

• Standard → 1 location
• Multi → up to 3 locations
• Large → up to 10 locations
• Network → “10+ locations” in UI; backend capacity is >10 or contract-defined

The API Worker derives these tiers exclusively from Stripe price.id mapping.
The UI MUST treat the resolved tier as authoritative and MUST NOT invent
additional owner-facing capacity labels for campaign Plans.

Plan purchase grants:

• Campaign capability (per-location, per-campaign as defined in Section 8.4)
• Publish Capacity (maximum number of locations that may be activated)

Cross-phase quota rule:
• The same resolved Plan tier / `maxPublishedLocations` parameter governs both:
  - 7A multi-location campaign scope eligibility
  - Phase 8 publish capacity
• These are NOT one shared mutable counter.
• 7A uses the resolved parameter as campaign-scope eligibility / capacity logic.
• Phase 8 uses `plan_alloc:<payment_intent.id>` + `PlanAllocDO` as the only authoritative published-location counter.

UI gating rule:
• If maxPublishedLocations = 1, Campaign Management MUST expose only “This location only”.
• If maxPublishedLocations > 1, Campaign Management MUST expose:
  - “This location only”
  - “Selected locations”
  - “All my locations”
  
Plans DO NOT:
• Grant legal ownership
• Grant exclusivity over physical addresses
• Restrict draft creation
• Create multi-account authority

Until production Stripe Price IDs are finalized, the mapping may contain placeholder IDs.
Unknown price.id MUST resolve to maxPublishedLocations = 0 (fail closed).

--------------------------------------------------------------------

Publish Capacity Rules (Authoritative)

1) Each Plan defines:
   • maxPublishedLocations (integer)
   • tier identifier (Standard / Multi / Large / Network)

Authoritative tier source:
• maxPublishedLocations MUST be derived server-side from Stripe line item Price ID (price.id).
• The API Worker MUST maintain an internal mapping: price.id → { tier, maxPublishedLocations }.
• The client MUST NOT supply tier or maxPublishedLocations via request parameters or Stripe metadata.

Authoritative priceId source:
• price.id MUST be extracted server-side from Stripe Checkout Session line items at payment reconciliation time.
• The API Worker MUST persist plan:<payment_intent.id> during webhook processing and during /owner/stripe-exchange and /owner/restore reconciliation.
• /api/location/publish MUST NOT call Stripe.
• If plan:<payment_intent.id> is missing, publish MUST be rejected (fail closed).

If price.id is not recognized by the mapping, publish MUST be rejected (fail closed).

2) A location consumes publish capacity when:
   • Its override is promoted to active published state.

3) Re-publishing the same ULID under the same Plan does NOT consume additional capacity.

4) Publish attempts exceeding maxPublishedLocations MUST be rejected.
Concurrency invariant:
• Publish capacity enforcement MUST be serialized.
• plan_alloc:<payment_intent.id> in KV is not sufficient for atomic enforcement.
• A Durable Object (PlanAllocDO) keyed by payment_intent.id MUST be used to reserve allocation atomically.
• KV plan_alloc remains a best-effort mirror and MUST NOT be treated as authoritative for enforcement.

5) Publish authority exists only while the Plan is active.

--------------------------------------------------------------------

Expiry Interaction

Plan expiry invariant: plan:<payment_intent.id>.expiresAt MUST equal ownership:<ULID>.exclusiveUntil for the same payment event (lastEventId).

When Plan expires:

• Active campaigns self-expire (Section 8.4.3)
• Discoverability transitions follow Section 92.4.3 (Courtesy Visibility Model)
• Publish rights are frozen until a new Plan is purchased
• Profile data remains stored

--------------------------------------------------------------------

92.3.3 Publish Validation Rules

A location MUST satisfy minimum completeness before publish.

--------------------------------------------------------------------

A) Minimum Publish Requirements

All of the following MUST be satisfied:

• Minimum 3 images  
• Description length ≥ 200 characters  
• At least one valid website OR social link  

Drafts may exist without meeting publish requirements.

--------------------------------------------------------------------

B) Field Binding (Authoritative; Published Profile Schema Compatibility)

Validation binds to the following JSON paths:

Images:
• Count = (media.coverImage present ? 1 : 0) + length(media.images[])
• Google Places photos do not count toward the ≥3 image requirement unless the BO provides rights-compatible media independently of Google Places.

Description:
• Field: description (top-level string)
• Requirement: length(description) ≥ 200

Website / Social Presence:
• Website qualifies if contact.website is present (https://...)
• Social qualifies if any links.social.* field is present AND matches the recognized social domain allowlist
• Requirement: website OR social

--------------------------------------------------------------------

C) Recognized Social Domains (Authoritative Allowlist)

Social fields accept only recognized domains.

Allowed domains (case-insensitive; subdomains allowed):

• facebook.com, fb.com, fb.me, m.me  
• instagram.com  
• tiktok.com  
• youtube.com, youtu.be  
• spotify.com, open.spotify.com  
• pinterest.com  
• linkedin.com  
• x.com, twitter.com  

Rules:
• Subdomains are allowed (e.g., m.facebook.com).
• URL shorteners other than the listed ones are NOT allowed in social fields.
• Non-social URLs MUST be rejected in social fields but may be placed in the primary website field.
• General website URLs are accepted only in contact.website.

--------------------------------------------------------------------

D) Structural Invariants

• Slug is immutable after publish.
• Geo changes do NOT regenerate slug.
• Publish validation is structural only (no ownership verification of URLs).
• Publish validation MUST evaluate the prospective effective published profile, not the raw draft payload.
• Existing-location route validates current effective published state merged with draft changes.
• Brand-new route validates the first-publish materialized profile derived from draft and optional provider hydration.
• Draft state alone is never publicly authoritative.

--------------------------------------------------------------------

F) Classification & Context Contract (Owner Platform)

During draft / publish authoring:

• BO chooses `groupKey` directly from the controlled platform group list.
• `subgroupKey` MUST be chosen from the selected group’s subgroup list only.
• A location has exactly one `groupKey` and exactly one `subgroupKey`.
• `context` MUST be chosen only from existing `contexts.json` shells.
• Multi-select `context` membership is allowed.
• BOs MUST NOT create new contexts, free-type contexts, or submit out-of-catalog values.
• `context` membership drives `ContextShardDO` indexing exclusively.
• `tags` MAY be captured as search-match terms, but only in validated normalized form.

After publish:

• `groupKey`, `subgroupKey`, `context`, and `tags` are immutable in normal owner edit flows.
• Correction requires retire + recreate under Appendix H.6. 

--------------------------------------------------------------------

92.3.4 Location Draft & Publish APIs (Owner Platform)

This section defines the two endpoints required for Locations Project authoring:

• Draft save (non-authoritative, non-visible)  
• Publish (promotes draft to authoritative public override)  

These APIs do not change campaign logic.  
Campaign lifecycle remains KV-authoritative and per-location (Section 8.4).

--------------------------------------------------------------------

A) Draft Save API (Create / Update Draft / Private Shell)

Purpose:
• Persist a server-side private shell for a location without publishing.
• Support three authoring routes:
  – existing location draft by `locationID`
  – new manual shell
  – new Google-import shell using internal `place_id` / `googlePlaceId`
• Drafts are not indexed and have no discoverability effect.

Method: POST  
Path: /api/location/draft  
Auth requirement: none (draft existence does not imply authority)

Draft Identity (actorKey Contract)

• actorKey MUST be a server-issued `draftSessionId` (opaque, random, unguessable).
• On first draft creation, API Worker returns `draftSessionId`.
• Client MUST store `draftSessionId` locally and include it in subsequent draft saves.
• Draft storage key: `override_draft:<ULID>:<draftSessionId>`
• `draftSessionId` is not an account identifier and grants no authority.

Input (conceptual)

• `locationID?` (slug) — existing-location route
• `draftULID?` — brand-new draft reference
• `googlePlaceId?` — optional internal Google `place_id` / `googlePlaceId` for Google-import shell; in normal UX this MUST come from embedded lookup, not BO-visible paste
• `draft` — partial profile object compatible with the published profile schema

Behavior (authoritative)

1) If `locationID` is provided:
   • Resolve slug → ULID via `alias:<slug>`
   • Write `override_draft:<ULID>:<draftSessionId>`

2) If `draftULID` is provided:
   • Require `draftSessionId`
   • Write `override_draft:<draftULID>:<draftSessionId>`
   • MUST NOT mint a new `draftULID`
   • Slug + alias are NOT minted during draft

3) If `locationID` is absent and `draftULID` is absent and `googlePlaceId` is absent:
   • Mint new `draftULID`
   • Mint new `draftSessionId`
   • Write `override_draft:<draftULID>:<draftSessionId>`
   • Slug + alias are NOT minted during draft

4) If `locationID` is absent and `draftULID` is absent and Google import is requested:
   • Receive internal `place_id` from embedded Google lookup
   • Check same-device duplicate draft by `ng_dev + place_id`
   • If duplicate exists, reopen / update the same draft
   • Check place_id cache
   • Check unpaid unique-place quota
   • If allowed, perform or reuse full Places API New hydration
   • Mint new `draftULID` and `draftSessionId` only when no same-device draft exists
   • Write `override_draft:<draftULID>:<draftSessionId>` with the hydrated draft payload
   • Slug + alias are NOT minted during draft

Self-Creation Field Contract (normative)

• Manual self-creation route accepts structured draft content compatible with
  the published profile schema:
  – Business information: `locationName`, address, `city`, `countryCode`
    (2-letter), `groupKey`, `subgroupKey`, optional `tags`
  – Context information: one to three `context` values chosen from existing
    `contexts.json` shells only
  – Business description: optional `descriptions`
  – Links to the business: optional `links.official`, `links.facebook`,
    `links.instagram`, `links.bookingUrl`
  – Media: optional BO-provided `media.cover` + gallery image URLs; Google Places photos are provider-sourced display candidates only and do not become NaviGen-owned media
  – Coordinates: optional during draft; if present they are validated and
    normalized to 6 decimals at publish
• Google import route receives `place_id` internally from embedded Google lookup.
  When import policy allows, full Places API New hydration pre-fills the Create Location draft upfront.
  The BO reviews and edits all fields before checkout / plan activation.
  The published profile is the BO-approved final profile.
• Draft UI MAY show a generated slug preview derived from current
  `locationName` + current draft coordinates
• The preview is advisory only; final slug is stamped only at publish

Draft Invariants

• Draft records are unlimited
• Draft writes MUST NOT trigger DO index updates
• Draft writes MUST NOT create ownership or publish authority

Response

• Existing-location route:
  `{ ok: true, locationID: <slug>, draftSessionId: <string> }`
• New-shell routes:
  `{ ok: true, draftULID: <ULID>, draftSessionId: <string> }`
• 404 if `locationID` cannot be resolved
• 400 on invalid payload

--------------------------------------------------------------------

A2) Google Import Hydration API

Purpose:
• Import provider-backed Google business details into a Create Location draft.
• Support upfront full Places API New hydration when import policy allows.
• Reuse cached place_id payloads where available.
• Keep Google lookup / provider data as onboarding acceleration, not bulk export.

Method: POST
Path: /api/location/hydrate

Auth / policy requirement:
• upfront import may proceed without paid entitlement only within import policy limits
• import policy checks same-device quota, IP quota, place_id cache, and duplicate draft state
• after quota, checkout / plan activation is required before more unique full imports
• paid owner entitlement may lift or extend quota according to plan

Input:
• internal `place_id`
• optional `draftULID`
• optional `draftSessionId`
• draft context where available

Behavior:
1) Receive internal `place_id` from embedded Google lookup.
2) Check same-device duplicate draft by `ng_dev + place_id`.
3) Check place_id cache.
4) Check unpaid unique-place quota.
5) If cache hit is usable, reuse normalized provider payload.
6) If cache miss and policy allows, call Places API New Place Details using server-only `GOOGLE_PLACES_API_KEY`.
7) Normalize imported provider payload into draft fields.
8) Create or update the private draft.
9) Return the hydrated draft.

Imported provider-backed fields:
• display name
• formatted address
• city / country code where derivable
• phone
• website
• Google Maps URL
• coordinates
• rating / rating count
• business status
• Google types

Rating UI rule:
• Create Location MUST show imported Google rating and rating count as a source-labeled provider rating when present.
• LPM MUST show imported Google rating and rating count as a source-labeled provider rating where the LPM rating line is enabled for that profile.
• Google provider rating is not a NaviGen visitor rating.
• NaviGen visitor ratings remain separate.
• If both Google provider rating and NaviGen visitor rating exist, UI must not merge them into one ambiguous number.
• Google rating is not BO-editable as a provider rating.

Media rule:
• Google Places photos are not imported into NaviGen-owned `media.coverImage`
  or `media.images[]` by default.
• Google photo resources may be displayed only through a compliant provider-photo
  flow with required Google / author attribution.
• BO-owned uploaded/provided media remains the source for publish image requirements.

Response:
• `{ ok:true, hydrated:true, draft:<draft>, hydratedAt:<iso> }`
• `{ ok:true, hydrated:false, error:<object>, draft:<draft>, hydratedAt:"" }`

--------------------------------------------------------------------

B) Publish API (Promote Private Shell → Published Override)

Purpose:
• Promote draft into authoritative published state (`profile_base:<ULID>` + `override:<ULID>`)
• Enforce publish capacity via `PlanAllocDO`
• Stamp final slug only at publish
• Trigger DO index updates

Method: POST  
Path: /api/location/publish  

Auth requirements:

• Valid Operator Session (`op_sess → opsess:<id>`) bound to the target ULID
• Active ownership window (`ownership:<ULID>.exclusiveUntil > now`)
• Active Plan aligned with ownership

Brand-new private-shell rule:
• Before slug exists, the target ULID is the `draftULID`.
• Operator Session and ownership MAY bind to `draftULID` before publish.
• Slug stamping does not change ULID; it only creates the public alias / identity.

Input (conceptual)

• Existing-location route:
  – `locationID` (slug)
• Brand-new route:
  – `draftULID`
  – `draftSessionId`
• `sourceDraftActorKey?` — optional (defaults to caller’s `draftSessionId`)

Publish Steps (authoritative order)

1) Resolve target ULID
   • Existing-location route: resolve `locationID` → ULID via `alias:<slug>`
   • Brand-new route: require valid `draftULID` + `draftSessionId`

2) Validate Operator Session

3) Validate ownership window

4) Validate Plan (KV-based only)
   • `payment_intent.id = ownership.lastEventId`
   • Read `plan:<payment_intent.id>`
   • Require plan exists
   • Require `now < plan.expiresAt`
   • Require `plan.expiresAt == ownership.exclusiveUntil`
   • Extract `maxPublishedLocations`
   • Publish MUST NOT call Stripe

5) Load draft payload
   • From `override_draft:<ULID>:<draftSessionId>`

6) Google import draft handling
   • Google import uses embedded lookup and internal `place_id`
   • upfront full Places API New hydration creates the Create Location draft when policy allows
   • publish consumes the BO-reviewed draft
   • BO review/edit is the final approval step before checkout / plan activation
   • Google Places photos are not treated as NaviGen-owned media by default

7) Validate publish rules (Section 92.3.3)

8) Capacity enforcement (serialized)
   • Reserve via `PlanAllocDO(payment_intent.id)`
   • If rejected → 403 (no writes)
   • If accepted → proceed with provisional hold only
   • `plan_alloc:<pi>` is mirror only

9) Slug handling
   • Existing-location route:
     – preserve the current canonical slug
     – MUST NOT mint a new slug or rewrite alias identity
   • Brand-new route:
     – Normalize coordinates to 6 decimals
     – Compute slug from current `locationName` + geo suffix using Appendix G / Appendix H
     – Enforce collision handling
     – Write `alias:<slug> → { locationID: <ULID> }`
     – Set `profile_base:<ULID>.locationID = <slug>`

10) Commit (authoritative)
   • On first publish, materialize `profile_base:<ULID>` as the canonical published base record.
   • `override:<ULID>` represents only the active published delta relative to `profile_base:<ULID>` and MAY be empty on first publish.
   • On re-publish, `profile_base:<ULID>` remains the canonical base and published changes are expressed through `override:<ULID>`.
   • Write `override_log:<ULID>:<timestamp>`.
   • After KV commit succeeds, finalize the PlanAllocDO hold
   • If any step fails before KV commit succeeds, release the provisional hold

11) Index update (best-effort)
   • Send DO IndexUpsert to SearchShardDO + ContextShardDO
   • DO failure MUST NOT rollback KV commit

Response

• `200 { ok: true, locationID: <slug> }`
• `401 { ok:false, reason:"session_required" }`
• `403 { ok:false, reason:"ownership_inactive" | "plan_inactive" | "plan_missing" | "capacity_exceeded" | "validation_failed" }`
• `404 { ok:false, reason:"not_found" }`  

--------------------------------------------------------------------

C) Relationship to /api/profile/update

• `/api/profile/update` remains the owner-only edit API (Section 92.3.1).  
• `/api/location/publish` is the only endpoint that promotes draft to public state under Plan capacity rules.  
• Draft save is fully decoupled from ownership and public state.  

--------------------------------------------------------------------

Error Response Schema (Authoritative)

All write endpoints MUST return:

• `{ ok: true, ... }` on success  
• `{ ok: false, reason: <string>, fields?: [<string>], details?: object }` on failure  

Standard reasons:

• `session_required` (401)  
• `ownership_inactive` (403)  
• `plan_inactive` (403)  
• `plan_missing` (403)  
• `capacity_exceeded` (403)  
• `validation_failed` (403)  
• `not_found` (404)  
• `bad_request` (400)  

For `validation_failed`:
• `fields` MUST list failing areas (e.g., ["media","description","links"]).  

--------------------------------------------------------------------

92.4 Ownership Duration, Expiry, and Reversion

Ownership is always prepaid and time-limited.

Ownership duration is determined exclusively by the active paid Plan window.

Rules:
• The active ownership / campaign-control window is 30 days per paid Plan purchase.
• After the active window ends, courtesy visibility lasts 60 days.
• Courtesy visibility does NOT extend ownership, Dash access, analytics access, or exclusive control.
• There is no standalone €5 extension product.

--------------------------------------------------------------------
Expiry Rule

When the active ownership / campaign window ends:

• CampaignEntitled becomes false.
• Ownership-based capabilities are revoked immediately.
• Dash access becomes blocked for that LPM (no analytics shown).
• Profile editing is disabled.
• Campaign control (pause/resume/finish) is disabled.
• Courtesy visibility begins automatically.

Rationale:
Campaign authority is prepaid and time-limited.
Courtesy visibility is goodwill, not an ownership extension.

--------------------------------------------------------------------
Discoverability After Campaign Ends (Courtesy Visibility)

NaviGen manages discoverability inside the NaviGen app independently of web indexing.

Rules (business-first):
• During an active campaign, the LPM is promoted and discoverable.
• After a campaign ends, the LPM remains discoverable inside NaviGen for a courtesy period of 60 days (Y = 2).
• After the courtesy period ends, the LPM becomes not discoverable inside NaviGen:
    - removed from search results and discovery lists
    - not shown in context lists (Popular / Accordion / Search-in-context)
• Direct link access may still open the LPM. Direct link access does not imply discoverability.
• Creation does not imply discoverability. Discoverability is granted by time-bounded participation.

Preferential visibility inside NaviGen (v1.1, authoritative)

During an active campaign (visibilityState="promoted"), NaviGen MUST provide
preferential visibility inside NaviGen discovery surfaces only.

This is implemented as deterministic ordering at the API Worker list boundary:

Endpoint:
• GET /api/data/list?context=<ctx>&limit=<n>

Ordering rule (deterministic, lightweight):
• promoted items first
• then visible items
• hidden items excluded

No external ranking/ads/SEO are implied or claimed.
This is strictly in-product ordering inside NaviGen lists (Popular / Accordion / context lists).

--------------------------------------------------------------------

92.4.1 Expiry Reminders & Renewal UX

A) One-time email reminder (D-5)
• A single reminder email is sent 5 days before exclusiveUntil.
• The email contains the active-until date, the location reference, and the Payment ID (pi_...) of the current Plan purchase for restore/reference.
• The email does not assume an action link.
• No recurring reminders are sent (no D-1, no sequences).

B) Always-visible UI countdown (only while Owned)
• Dash displays:
    “Active Plan until <date>” + “Renew in #x”.
• LPM displays an emoji-style badge showing “#x” days remaining.
  The badge may be publicly visible.
• Countdown is always visible while the LPM is owned.

All effects of ownership expiry MUST be communicated clearly in advance,
including the transition of analytics from private to public visibility.

C) Campaign control area
• Displays the same expiry line and “Renew in #x” action.

All renewal actions are initiated from NaviGen and route to Plan selection / Stripe Checkout.
No accounts or login flows are required.

--------------------------------------------------------------------

92.4.2 Dash Access Without Accounts (Stripe Exchange / Payment ID Restore → Cookie Session)

Purpose:
Enable owner-only Dash access without user accounts, using payment-derived authority.

Core principle:
• Ownership state (exclusiveUntil > now) is authoritative.
• Stripe exchange, Payment ID (pi_...) restore, and cookies are access mechanisms only; they do not define ownership.

--------------------------------------------------------------------
A) Policy Overview

• Same-device owner access begins immediately after successful Stripe Checkout via /owner/stripe-exchange.
• Cross-device or later recovery begins when the owner provides a Stripe PaymentIntent ID (pi_...) in Restore Access.
• No signed links or email action links are used.
• Dash URLs remain clean (no long-lived tokens in query strings).
• Cookie may persist while ownership is active but becomes invalid when ownership expires.
• Owner-only access is never inferred from public navigation.

--------------------------------------------------------------------
B) Entry Points & Where Owners Find Access

Primary (real-time, same device)

• Immediately after successful Stripe Checkout, the app redirects through /owner/stripe-exchange.
• The server verifies the completed Checkout Session and sets an owner session (op_sess).
• The browser is redirected back into the app.
• If Checkout originated from Campaign Funding or Campaign Management,
  the return target MUST be the first incomplete owner step for that flow (Section 8.4.9), not a blind redirect to Dash.
• If no pending owner flow exists, the default return MAY open Dash for the bound location.
• If ownership:<ULID> is missing or lastEventId does not match the Checkout Session’s payment_intent.id,
  the API Worker MUST reconcile ownership idempotently and persist lastEventId = payment_intent.id before minting the session.
• During /owner/stripe-exchange reconciliation, the API Worker MUST also persist plan:<payment_intent.id> from Stripe Checkout Session line items.

Secondary (Payment ID recovery)

• Restore Access accepts the Stripe PaymentIntent ID (pi_...) from the Stripe receipt, invoice, or payment confirmation email.
• The API Worker performs a server-side lookup of the associated Checkout Session.
• The API Worker validates payment_status="paid" AND status="complete".
• If ownership:<ULID> is missing or lastEventId != pi_...,
  the API Worker MUST reconcile ownership idempotently and persist lastEventId = pi_... before minting the session.
• The API Worker resolves metadata.locationID → ULID, persists plan:<pi_...> from Checkout Session line items, mints op_sess, and redirects into the app.
• No Owner access email or action link is required.

--------------------------------------------------------------------
C) Restore Access Contract (Payment ID, Exact)

Input:
• Payment ID (pi_...)

Server-side steps:
• lookup PaymentIntent / Checkout Session association
• require payment_status="paid" AND status="complete"
• resolve metadata.locationID → ULID
• reconcile ownership:<ULID> and plan:<pi_...> idempotently if needed
• mint op_sess cookie and opsess:<sessionId>
• redirect with a clean URL to either:
    - the first incomplete Campaign Funding / Campaign Management step, or
    - /dash/<location> when no pending owner flow exists

Rules:
• Clients MUST NOT supply ULIDs directly.
• Payment ID lookup is server-side only.
• Restore Access is session recovery only; it does not create a new purchase or extend a Plan.

--------------------------------------------------------------------
D) Cookie Contract (Owner Session Cookie)

Cookie name:
• op_sess

Cookie contents:
• A random, unguessable session id (opaque string). No ULID is stored in the cookie.

Cookie attributes (mandatory):
• HttpOnly
• Secure
• SameSite=Lax
• Path=/
• Max-Age: bounded by session expiry (see below)

Cookie purpose:
• Preserve owner access on the current device/browser without accounts.

--------------------------------------------------------------------
E) Owner Session Record (Server-Side, KV-backed)

Session record key:
• opsess:<sessionId>

Session record value (JSON):
• ver: number                 // session schema version (start at 1)
• ulid: <ULID>                // single location scope for this session
• createdAt: ISO-8601
• expiresAt: ISO-8601         // MUST NOT exceed ownership.exclusiveUntil
• lastSeenAt?: ISO-8601       // optional (for audit/ops only)

Session creation rules:
• On successful /owner/stripe-exchange or /owner/restore, API Worker creates opsess:<sessionId>.
• expiresAt MUST be computed as:
    expiresAt = min(ownership:<ULID>.exclusiveUntil, createdAt + sessionMaxAge)
  Where sessionMaxAge may be set equal to ownership window (default) unless overridden.

Session validation rules (enforcement):
• Any owner-only request MUST be allowed only if:
    - op_sess cookie is present, AND
    - opsess:<sessionId> exists, AND
    - now < opsess.expiresAt, AND
    - ownership:<ULID>.exclusiveUntil > now

If ownership expires, the session MUST be treated as invalid even if cookie/session still exists.

--------------------------------------------------------------------
F) Normal Flow (Happy Path)

1) Owner completes Stripe Checkout.
2) App redirects through /owner/stripe-exchange.
3) API Worker verifies the completed Checkout Session, reconciles ownership / plan, and sets op_sess.
4) API Worker redirects with a clean URL to either:
   • the first incomplete Campaign Funding / Campaign Management step, or
   • /dash/<location> when no pending owner flow exists.
5) Owner uses Dash normally while ownership is active.

--------------------------------------------------------------------
G) Owner Access Recovery (Guided, No Resend)

NaviGen does not provide Owner-access links or a resend endpoint.

Recovery is performed with the Stripe PaymentIntent ID (pi_...) from the Stripe receipt, invoice, or payment confirmation email.

Supported recovery cases:
• session missing on another device
• original checkout tab is gone
• owner wants to open Dash on a different device later

Recovery guidance shown to the user:
• “Use Restore Access with the Payment ID (pi_...) from your Stripe receipt or payment email.”
• “Tip: search your inbox for ‘Stripe’ if you need to find the payment.”

Rationale:
• Stripe emails are already delivered, searchable, and tied to payment authority.
• NaviGen does not implement identity or payment recovery flows.
• Avoids spam, probing, and account-like recovery abuse vectors.

Restore Access may create a new device registry entry on the current device, making the restored location appear in Owner Center on that device.

--------------------------------------------------------------------
H) Session Revocation (Device-Local)

Owner-only surfaces should provide:
• “Sign out on this device”

Behavior:
• Clears the op_sess cookie on the current device/browser.
• API Worker deletes opsess:<sessionId> (best-effort).
• Does not affect ownership state or other devices.

--------------------------------------------------------------------
I) Non-Goals (Explicit)

This mechanism does NOT:
• create user accounts
• create persistent identities
• permit cross-location access within one session (single location scope)
• define ownership authority (exclusiveUntil remains authoritative)

--------------------------------------------------------------------

92.4.3 Discoverability After Campaign Ends (Courtesy Visibility)

--------------------------------------------------------------------

## Timeline management with NaviGen-level tools (not search engines)

### What we control today (the real levers)

Inside NaviGen, we control only **in-product discoverability and attention**, not external indexing.

**Discoverability**
- Appears in search results and lists
- Appears in “Popular”, “Nearby”, and similar surfaces
- Appears while users browse NaviGen

**Ranking / prominence**
- Order in results
- Featured vs buried placement

**Capabilities**
- Campaigns
- Analytics
- Dash access
- Owner CTAs

**UI messaging**
- What the owner sees
- What the public sees

That is sufficient to manage visibility and value.

--------------------------------------------------------------------

## The finalized timeline (internal operations view)

Phases are named by **what the system does**, not how it feels to the user.

--------------------------------------------------------------------

### Phase 1 — Active Plan  
*(30 days)*

**System behavior**
- LPM discoverable: **true**
- Ranking: **boosted**
- Campaigns: **enabled**
- Analytics: **enabled**
- Exclusive operation: **enforced**

**Owner message**
> “Your business is actively present on NaviGen.”

**Public**
- Sees the business everywhere it should appear

Notes:
- The owner may choose **Visibility only** or **Promotion**.
- Visibility only keeps the same paid rights while disabling Promo QR / redeem flows.

--------------------------------------------------------------------

### Phase 2 — Courtesy visibility  
*(free, 60 days)*

**System behavior**
- LPM discoverable: **true**
- Ranking: **reduced (natural fall)**
- Campaigns: **disabled**
- Analytics: **disabled**
- Exclusive operation: **off**

**Owner message**
> “Your active Plan ended, but we’re keeping your business visible so customers can still find you.”

**Public**
- Still finds the business
- It is less prominent

--------------------------------------------------------------------

### Phase 3 — Not discoverable  
*(after courtesy ends)*

**System behavior**
- LPM discoverable: **false**
- Removed from:
  - search results
  - lists
  - browsing

**Direct link**
- May still open the LPM initially
- Does not appear anywhere organically

**Owner message**
> “Your business is currently inactive on NaviGen.  
> Start a new Plan anytime to become visible again.”

**Public**
- Will not encounter the business organically

This solves:
- orphaned LPM cost
- clutter
- false presence

No deletion is required.

--------------------------------------------------------------------

## Why this works without “indexing”

NaviGen does not control Google.  
NaviGen controls **attention inside the product**.

From a business owner’s perspective:
- “Visible on NaviGen” = valuable
- “Hidden on NaviGen” = effectively gone

Whether a direct link technically works is irrelevant unless:
- it is shared intentionally, and
- someone already knows it

That is acceptable free residue, not value leakage.

--------------------------------------------------------------------

## One subtle but important rule (prevents abuse)

**Discoverability is granted by time-bounded participation, not by existence.**

This means:
- Creating an LPM does **not** guarantee visibility
- Visibility is earned by activity (campaign or courtesy)
- Inactivity leads to quiet removal

This is fair, intuitive, and scalable.

--------------------------------------------------------------------

92.5 Abuse, Safety, and Auditability

The Owner Platform is designed to be abuse-resistant by construction.

Safety mechanisms include:

• Payment-gated authority:
    Editing and control require real economic cost.

• Attribution:
    All ownership actions and edits are linked to a verified payment trail.

• Immediate suspension:
    If a location reports an unintended campaign or misuse:
      - ownership is suspended
      - campaigns are paused
      - editing rights are revoked

• No anonymous control:
    Unpaid actors cannot edit, override, or suppress content.

• Internal audit:
    All edits and ownership changes are logged internally.
    QA and ops teams may review and revert changes if necessary.

The platform assumes good intent but enforces accountability by design.

--------------------------------------------------------------------

92.6 Out-of-Scope
  • Admin Portal workflows (Section 93)
  • Billing computation details (Section 5)
  • Worker logic (Section 9)
  • QA diagnostics (Section 90.x)

--------------------------------------------------------------------

END 90.x EXTENSION ARCHITECTURE

APPENDIX A — MODAL INVENTORY (SYSTEM-WIDE)

A. Promotion & QR Modals
  1. Promotion Modal  
       • Shows active promotion details for a business  
       • Entry point to promo QR flow

  2. Promotion QR Modal  
       • Displays campaign QR for the customer  
       • Triggers ARMED event  

  3. Redeem Confirmation Modal (Cashier)  
       • Shown after successful redeem  
       • Captures cashier confirmation metric

  4. Redeem Confirmation Modal (Customer)  
       • Triggered via redeem-token polling  
       • Captures customer confirmation metric

B. Support & Monetization Modals
  5. Donation Modal — Stage 1  
       • “Support the Vibe” intro  

  6. Donation Modal — Stage 2  
       • Donation tier selector  

  7. Donation Modal — Stage 3  
       • Thank-you / repeat-support modal  

C. Install Flow Modals
  8. Pinned / Install Instructions Modal  
       • App-provided fallback when OS does not fire BIP  

D. Navigation & Shell Modals
  9. Language Modal  
       • Manual language selector  

 10. Help Modal  
       • Basic instructions  

 11. Social Modal  
       • Links to social platforms  

 12. My Stuff Modal  
       • User toolbox modal (data, purchases, terms, rating, etc.)

 13. Favorites Modal  
       • Displays saved locations  

E. Data & Policy Modals
 14. Data Modal  
       • Data policy summary  
       • Export/reset tools  

 15. Terms Modal  
       • Conditions of use  

F. Sharing / Outreach Modals
 16. Share Location Modal  
       • Provides share links for active business  

G. Dashboard Modals (when present)
 17. Copy/Export Modal  
       • Copies Analytics report content to clipboard  

H. Utility Modals
 18. System Alert / Error Modal  
       • Used for unexpected recoverable errors  
       • Rarely seen by end users

--------------------------------------------------------------------

APPENDIX — Locations Project State Transitions (Audit)

Source sections (audit list; update if numbering changes):
• 8.3.5 (Forward Migration: Locations Project — KV-Based Authority)
• 92.3.2 (Plan & Publish Capacity)
• 92.3.3 (Publish Validation Rules)
• 92.4 (Ownership Duration, Expiry, and Reversion)
• 92.4.3 (Discoverability After Campaign Ends — Courtesy Visibility)
• 13.12 (Search Index Architecture — Durable Objects)

| State | Publicly visible | Indexed in DO | Preconditions | Allowed actions | Storage keys affected | Exit condition(s) |
|---|---:|---:|---|---|---|---|
| Draft | No | No | None (draft may exist without payment) | Write draft; discard draft | override_draft:<ULID>:<actorKey> | Publish succeeds |
| Published | Yes (effective profile) | Yes | (a) Plan active, (b) plan_alloc capacity not exceeded, (c) publish validation passes (≥3 images, ≥200 chars, website/social) | Update via profile edit API (if ownership active); publish updated override | override:<ULID>, override_log:<ULID>:<ts>, DO upsert | Plan expires → Frozen; or owner updates and republishes |
| Expired (campaign window ended) | Yes (courtesy) | Yes (while discoverable) | Campaign ends; courtesy window begins | No campaign actions unless renewed; visibility decays per timeline | campaigns:byUlid:<ULID> unchanged; status:<ULID> updates derived; ordering changes | Courtesy ends |
| Frozen (Plan inactive) | Stored; discoverability follows 92.4.3 | If still in courtesy then yes; otherwise no | Plan expired | Cannot publish new locations under that Plan; publish rights frozen; existing published override remains | No new plan_alloc entries; no publish writes; existing override remains | New Plan purchase restores publish ability |
| Not discoverable | Direct link may open; not shown in lists | No | After extended inactivity per 92.4.3 | Start campaign to become visible again | visibilityState derived; list endpoints exclude | Campaign starts |

Notes:
• “Expired” is campaign-lifecycle. “Frozen” is Plan-lifecycle. These are orthogonal.
• Draft state has no visibility, no indexing, and no authority effect.

--------------------------------------------------------------------

APPENDIX — KV Namespace Inventory & Collision Audit

KV binding layout (KV_STATUS/KV_ALIASES/KV_OVERRIDES/KV_STATS) is repo-defined (wrangler.toml authoritative). This appendix defines key families only.

This table lists key families referenced by the spec. It is a collision audit and a namespace inventory.

| Namespace / Prefix | Purpose | Authority | Notes |
|---|---|---|---|
| alias:<slug> | slug → ULID mapping | API Worker | Canonical identity spine |
| ownership:<ULID> | ownership window (exclusiveUntil) | API Worker (webhook) | Establishes owner capabilities |
| opsess:<sessionId> | operator session record | API Worker | Cookie op_sess points here |
| profile_base:<ULID> | KV canonical profile (profiles.json schema) | API Worker | Locations Project authority |
| override:<ULID> | published override delta relative to `profile_base:<ULID>` | API Worker | Non-destructive edits |
| override_log:<ULID>:<ts> | append-only edit audit trail | API Worker | Internal-only |
| override_draft:<ULID>:<actorKey> | draft overrides | API Worker | Unlimited; never indexed |
| campaigns:byUlid:<ULID> | campaign rows array | API Worker | Campaign authority |
| status:<ULID> | derived entitlement + QA flags | API Worker | Includes campaignEntitled, activeCampaignKeys, qaFlags |
| redeem:<token> | promo token state | API Worker | Single-use token economy |
| stats:<ULID>:<YYYY-MM-DD>:<metric> | daily counters | API Worker | Append-only integer counters |
| qrlog:<ULID>:<YYYY-MM-DD>:<scanId> | per-event QR log | API Worker | Append-only event objects |
| billing:<token> | billing record per redeem token | API Worker | Internal-only |
| agent_attribution:<agentId>:<ULID> | agent attribution & cap tracking | API Worker | Internal-only |
| plan_alloc:<payment_intent.id> | published locations counted toward a Plan | API Worker | { ulids: [<ULID>, ...] }; used to enforce maxPublishedLocations |
| plan:<payment_intent.id> | Plan record (priceId, tier, maxPublishedLocations, purchasedAt, expiresAt, initiationType, campaignPreset) | API Worker | Authoritative source for publish capacity and publish/audit provenance |

Collision assessment:
• No prefix collisions detected among the listed families.
• plan_alloc:* is a new namespace; no existing family uses plan_* prefixes.

--------------------------------------------------------------------

APPENDIX — Stripe → Ownership → Publish Lifecycle (Sequence)

Source sections (audit list; update if numbering changes):
• 91.4 (Operational Authority Model)
• 91.4.1 (Ownership Record)
• 91.4.2 (Stripe Metadata Contract)
• 92.3.2 (Plan & Publish Capacity)
• 92.4.2 (Stripe Exchange / Payment ID Restore → Cookie Session)
• 8.3.5 (Locations Project — KV Authority)
• 13.12 (Search Index Architecture — DO)

User (BO) ── choose plan ──> choose campaign scope ──> choose locations ──> Stripe Checkout
   │                                                                          │
   │                                                                          └─ checkout.session.completed
   │                                                                                  │
   │                                                                                  v
   │                                                                        API Worker / webhook processor
   │                                                                        - verify Stripe signature
   │                                                                        - resolve target identity route:
   │                                                                          • existing-location → locationID via alias:<slug> → ULID
   │                                                                          • brand-new private shell → draftULID + draftSessionId → ULID   
   │                                                                        - write/extend ownership:<ULID>
   │                                                                        - (if applicable) activate campaign row(s)
   │                                                                        - persist plan tier for publish capacity
   │                                                                                  │
   │                                                                                  v
   │                                                                        Owner Exchange (/owner/stripe-exchange)
   │                                                                        - mint op_sess cookie + opsess:<id>
   │                                                                        - restore first incomplete owner step when flow state exists
   │                                                                                  │
   v                                                                                  v
Owner UI (wizard / CM) ── publish request ──> API Worker (publish endpoint)
                                          - verify Plan active
                                          - enforce maxPublishedLocations via plan_alloc:<pi_...>
                                          - validate publish rules (images/desc/link)
                                          - write override:<ULID> + override_log:<ULID>:<ts>
                                          - DO upsert for search/index
                                          - return merged effective profile
                                   
--------------------------------------------------------------------

APPENDIX — Durable Objects Search/Index Sharding (Naming, Partition Keys, Message Format)

Source sections (audit list; update if numbering changes):
• 13.12 (Search Index Architecture — Durable Objects)
• 8.3.5 (Locations Project — KV Authority)
• 8.3.4 (Profile Override Model — Merge/Audit)
• 92.3.2 (Plan & Publish Capacity)
• 92.3.3 (Publish Validation Rules)

Durable Objects store index metadata only.
KV (profile_base:<ULID> + override:<ULID>) remains the sole profile authority.

--------------------------------------------------------------------

A) Durable Object Classes

1) SearchShardDO
Purpose:
• SYB search token lookup
• slug → ULID lookup fast path (non-authoritative convenience)

2) ContextShardDO
Purpose:
• contextKey → ordered ULID list for browse surfaces

--------------------------------------------------------------------

B) Shard Naming & Partition Keys

SearchShardDO instance id (deterministic):
    search:<countryCode>:<bucket>

Where:
• countryCode = effectiveProfile.contact.countryCode (or "XX" if unknown)
• bucket = first character of normalized slug (locationID) in [a-z0-9], else "_"
Bucket function is NOT a hash: bucket = first character of normalized slug in [a-z0-9], else "_".

Examples:
• search:DE:h
• search:DE:0
• search:XX:_

ContextShardDO instance id (deterministic):
    ctx:<contextKey>

Examples:
• ctx:souvenirs/germany/berlin
• ctx:restaurants/germany

Partition invariants:
• A location belongs to exactly one SearchShardDO (derived from slug bucket + countryCode).
• A location may belong to multiple ContextShardDO instances only if its context field contains multiple semicolon-delimited entries.
• Draft overrides are never indexed and must not generate DO updates.

--------------------------------------------------------------------

C) Indexed Field Normalization Rules (Deterministic)

Normalization must be deterministic and locale-neutral:

• Lowercase
• Trim whitespace
• Replace repeated whitespace with single space
• Remove diacritics (accent-insensitive)
• Strip punctuation except internal hyphens for slug tokens

Token sources (current):
• locationName.* and listedName
• address, listedAddress
• postalCode
• city, adminArea
• tags
• slug (locationID)

Additional invariants:
• No stopword removal is performed (language-neutral).
• Tokens max length: 32 characters; longer tokens are truncated.
• Max tokens per upsert: 64 (excess tokens discarded deterministically after sorting).
• Token list MUST be sorted lexicographically before hashing indexedFieldsHash.

Notes:
• Tokenization is for index matching only; it must not change display rendering.
• Tokenization does not implement ranking, personalization, or fuzzy matching beyond normalization.

--------------------------------------------------------------------

D) DO Storage Model (Conceptual, Non-Authoritative)

SearchShardDO storage keys (conceptual):
• slug:<slug> → <ULID>                       // convenience lookup
• tok:<token> → [<ULID>, ...]                // postings (implementation may compress)
• meta:<ULID> → { city, postalCode, name }   // minimal card hints (optional)

ContextShardDO storage keys (conceptual):
• ulids → [<ULID>, ...]                      // ordered list

Ordering in context list:
• promoted first
• then visible
• hidden excluded
(Visibility ordering remains enforced at API list boundary; DO may store raw ULIDs and let API apply ordering.)

--------------------------------------------------------------------

E) Index Update Message Format (Authoritative Contract)

All index updates are sent from API Worker to DO instances as a single upsert envelope.

Message: IndexUpsert v1

{
  "ver": 1,
  "op": "upsert",
  "ulid": "01H...",                 // canonical ULID
  "slug": "example-slug-1234",      // locationID
  "countryCode": "DE",              // or "XX"
  "contexts": ["souvenirs/germany/berlin"],  // derived from context field (split by ';', trimmed)
  "tokens": ["aby", "miles", "berlin", "21051"], // normalized tokens
  "indexedFieldsHash": "sha256:...", // optional idempotency hint for DO (recommended)
  "ts": "2026-02-23T12:00:00Z"
}         
   
Message rules:
• Sent only after KV write succeeds.
• Sent for:
  - base record writes (profile_base)
  - published override writes (override) if and only if indexed fields changed.
• NOT sent for draft writes.
• contexts[] MUST be derived exclusively from the context field.
• tokens[] MUST be derived from indexed fields only (current list in Section C).
• indexedFieldsHash SHOULD be computed from the normalized indexed field bundle to allow DO to no-op identical updates.

Delete/Unindex message (optional, v1):
Used when a location becomes not discoverable and should be removed from browse/search.   

{
  "ver": 1,
  "op": "delete",
  "ulid": "01H...",
  "slug": "example-slug-1234",
  "countryCode": "DE",
  "contexts": ["souvenirs/germany/berlin"],
  "ts": "2026-02-23T12:00:00Z"
}

Delete rules:
• Used only for discoverability transitions to “not discoverable” (Phase 4).
• Not required for Plan expiry (Frozen) if courtesy visibility still applies.

--------------------------------------------------------------------

F) Consistency Model

• KV remains authoritative for profile reads.
• DO is an eventually-consistent index.
• List and search endpoints may tolerate brief lag between KV write and index visibility.
• Draft state is never visible via DO.

--------------------------------------------------------------------

G) Failure Handling

If DO update fails:
• KV write MUST remain committed (authority preserved).
• System SHOULD retry asynchronously using an implementation-defined queue;
  retries MUST be deduped by indexedFieldsHash (or ulid+ts) and MUST NOT block publish.
• Search/list may temporarily miss the updated entry until DO catches up.

--------------------------------------------------------------------

APPENDIX H — Geo & Slug Stamping Contract (Creation-Time Identity)

Purpose:
Define how coordinates (lat/lng at 6 decimals) are obtained, validated,
and “stamped” into a location identity (slug) during creation.

This appendix complements:
• Appendix G (Slug Generation Contract)
and makes geo handling enforceable and deterministic.

--------------------------------------------------------------------

H.1 Core Invariants

1) Address is optional.
   Coordinates are required.

2) Slug is minted only when coordinates are finalized at publish time.

3) Coordinates are editable before publish.
   Coordinates are immutable after publish.

4) Slug is immutable after publish.

Rationale:
• Avoids requiring external geocoding services.
• Allows BOs to correct “wrong entrance” during onboarding.
• Preserves QR/link stability after publish.

--------------------------------------------------------------------

H.2 Input Model (Owner Platform)

The creation wizard MUST accept:

A) Address (optional)
• Free-form address string(s)
• May be incomplete or absent (e.g., farms, festivals, wilderness locations)

B) Coordinates (required)
• Latitude and Longitude
• Must be provided in enforced format:
    - decimal degrees
    - exactly 6 decimal places (normalized server-side)
    - valid ranges: lat ∈ [-90, 90], lng ∈ [-180, 180]

C) Name (required)
• Used for normalized-name segment in slug

--------------------------------------------------------------------

H.3 Coordinate Format Enforcement

API Worker MUST enforce coordinate normalization:

Given input lat/lng:
1) Parse as float
2) Validate ranges:
   • -90 ≤ lat ≤ 90
   • -180 ≤ lng ≤ 180
3) Normalize to exactly 6 decimal places:
   • latNorm = round(lat, 6)
   • lngNorm = round(lng, 6)
4) Persist only normalized values

Invalid coordinates MUST be rejected (400).

--------------------------------------------------------------------

H.4 Draft Phase Behavior (Pre-publish)

During draft phase:
• Coordinates MAY be updated unlimited times.
• `locationName` MAY be updated unlimited times.
• Draft saves MUST NOT mint the final slug.
• Draft saves MUST NOT trigger DO indexing.

Draft storage:
• `override_draft:<ULID>:<actorKey>` MAY include coordinates, `locationName`,
  `groupKey`, `subgroupKey`, `context`, `tags`, and provider references such as `googlePlaceId`.

UI behavior:
• Owner Platform MAY show a generated slug preview during draft.
• The preview MUST be derived from the current draft `locationName` + current draft coordinates.
• The preview is advisory only and MUST NOT create alias mappings or public identity.
• BO does not type the authoritative slug directly.

Note:
Draft ULID is internal and not exposed as public identity.
Public identity (slug) is not stamped until publish.

This Appendix supersedes any earlier draft flow text that implies slug or alias minting during draft creation.

--------------------------------------------------------------------

H.5 Publish-Time “Stamping” (Slug Mint)

First publish of a brand-new location performs the canonical stamping step.

Existing published locations preserve their current slug on re-publish and MUST NOT re-stamp public identity.

Inputs required for first publish:
• current draft `locationName`
• normalized coordinates (6 decimals)

Steps:
1) Compute slug using Appendix G from current `locationName` + geo suffix.
2) Enforce collision resolution (Appendix G.6).
3) Create alias mapping:
       alias:<slug> → { locationID: <ULID> }
4) Set profile_base:<ULID>.locationID = <slug>
5) Promote override as override:<ULID> (published state)
6) Trigger DO index update.

Once this completes:
• slug is immutable
• coordinates are immutable

--------------------------------------------------------------------

H.6 Retire + Recreate Policy (Post-publish Geo / Taxonomy Correction)

Correction is permitted only before publish:

• If BO selects incorrect coordinates during draft:
   → BO edits coordinates
   → publish stamps final slug based on corrected coordinates

After publish:
• Coordinate edits are forbidden in owner edit API (/api/profile/update whitelist).
• `groupKey`, `subgroupKey`, and `context` edits are forbidden in normal owner edit flows.
• The system does not support “move slug to new geo”.

If a post-publish geo or taxonomy correction is required:
• The BO MUST use retire + recreate.
• A new location must be created and published separately.
• The retiring location may be set not discoverable by normal timeline rules.
• A replacement private shell MAY be prefilled from the retiring location’s content only.
• Content carry-over MAY include name, description, media, contacts, links, tags,
  `groupKey`, `subgroupKey`, `context`, and draft coordinates.
• Identity and history MUST NOT carry over:
  – ULID
  – slug
  – alias mappings
  – ownership history
  – campaigns
  – stats / qrlog / billing history

This preserves identity stability and prevents link/QR breakage.

--------------------------------------------------------------------

H.7 UI Messaging Requirement (Geo explanation)

Owner Platform UI MUST explain why coordinates are required:

• NaviGen is a geo-based platform.
• Large sites / parks may require multiple internal locations for navigation.
• Coordinates determine stable identity (slug) and reliable customer routing.
• The UI SHOULD make the link between `locationName` + coordinates and the generated slug preview visible before publish.

UI must present coordinates input in a user-friendly manner
(e.g., “Paste from Google Maps” guidance or Google `place_id` lookup guidance),
but the authoritative contract remains server-side.

--------------------------------------------------------------------

H.8 Non-Goals

This appendix does NOT require:
• external geocoding services
• address verification
• postal validation
• map-provider dependency

It defines deterministic enforcement and identity stamping only.

--------------------------------------------------------------------

END OF SPEC

--------------------------------------------------------------------

📘 NaviGen — Developer Reference (Engineering Summary)


1. Core Architecture (What NaviGen is)

NaviGen is a location-centric, QR-driven promotion and analytics platform, implemented as:

App Shell (PWA) — the client UI (LPM, MSM, Promo flow, donation, etc.)

Dashboard (Dash) — merchant/internal analytics

Pages Worker — routing, QR redirect, app hosting

API Worker — all business logic: token issuance, redeem, stats, QA

Dataset Layer — KV-backed runtime profile authority plus finance.json, contexts.json, and i18n bundles

KV Stores — stats counters, qrlog entries, redeem tokens, alias mappings, QA flags

Translation Engine (i18n) — t(key) across all UI

Everything in NaviGen is event-driven, stateless per request, deterministic, and privacy-safe.

2. Identity Resolution

Every location uses:

Slug — human identifier (URL-safe)

ULID — canonical internal identity

Workers map slug → ULID using KV_ALIASES, ensuring:

QR codes never break

Changing slugs is safe

All analytics and tokens rely on ULID

3. QR System (Section 2)

Two QR types:

A) Info QR → Business profile
/<ctx>?lp=<locationID>


Worker logs: SCAN
App opens LPM.

B) Promo QR → Secure token redeem
/out/qr-redeem/<slug>?camp=<key>&rt=<token>


Backend logs:

ARMED (customer displays Promo QR)

SCAN (cashier scans it)

REDEEM (first token use)

INVALID (reuse/expired)

This chain is the foundation of promo integrity, analytics, and billing.

4. Promo System (Section 3)

Promo lifecycle:

Customer opens promo modal

App calls /api/promo-qr → token created

ARMED event logged

Customer displays QR (contains rt token)

Cashier scans the QR

API Worker consumes token → REDEEM or INVALID

Cashier confirmation modal appears

Customer confirmation modal appears once token becomes redeemed

This 6-point flow cannot be spoofed:

Token = single use

Confirmations = human verification

Merchant cannot bypass scanning

Customers cannot redeem twice

Window-shift behavior (>100% compliance) is expected and handled

5. Dashboard Model (Section 4)

Dash displays 4 views:

Click Info — app interaction metrics

QR Info — SCAN/ARMED/REDEEM/INVALID

Campaigns — merchant-safe counts only

Analytics — narrative + QA analysis

Merchant-facing views never show ratios or compliance %.
Internal diagnostics appear only in Analytics → QA block.

All dashboard data is returned by:

GET /api/stats?locationID=<UID>&from=<date>&to=<date>

6. Confirmation Metrics

Two additional signals:

redeem-confirmation-cashier

redeem-confirmation-customer

These refine QA diagnostics (cashierCoverage, customerCoverage).
They never influence billing.

7. Billing (Section 5)

Billing is triggered only by REDEEM events.

Billing ignores:

INVALID

confirmation metrics

UI state

Billing depends solely on:

finance.json

campaign sectorKey/countryCode

REDEEM timestamp & token metadata

This ensures full anti-circumvention.

8. Data Model (Section 8)

Workers maintain:

A) stats bucket (per day):
stats:<ULID>:<YYYY-MM-DD>:<metric> = integer

B) qrlog (per event):

Contains:

signal

device/browser/lang

scan ID

campaignKey

timestamp

C) redeem:<token>:
{ status: "fresh" | "ok" | "invalid", uid, campaignKey }

D) status:<ULID>:
{ qaFlags:[...], qaUpdatedAt }

9. Workers (Section 9)
Pages Worker

Serves UI shell, manifest, SW

Handles Info QR + Promo QR redirects

Logs /hit/* events

Does no logic

API Worker

Issues promo tokens

Validates redeem

Updates stats, logs, QA flags

Provides /api/stats

Generates billing records

Normalizes slug → ULID

This is the central logic engine.

10. Visitor Model (Section 10)

Anonymous

Local-only visitorID (if applicable)

No PII

No user accounts

No cross-device identity

Used only for aggregate patterns (repeat visitor, etc.)

11. Test Mode (Section 11)

Test Mode enables developers/QA to:

Simulate ARMED/SCAN/REDEEM/INVALID

Validate confirmation flows

Verify Analytics + QA text

Ensure PWA behavior

Confirm token correctness

Test Mode never pollutes production stats or billing.

12. UI Modules (Section 6)

Major UI components:

LPM (central business view)

MSM (favorites, purchases, language, data)

Promo modals (promo modal, QR modal, confirmations)

Donation modals (👋)

Install flow (📌)

Search UI

Navigation components

All text uses t(key).
All UI actions are stateless and strictly client-side.

13. PWA Lifecycle (Section 6.5 + 1.9)

Browser mode:

header = 📌

tapping → OS install prompt (if BIP) or fallback modal

Standalone mode:

header = 👋

behaves like native app

offline-capable

donation replaces install

Promo flows require online backend.
Info QR + LPM fully functional offline via cached bundles.

14. Modal Architecture (Section 12)

All modals share:

unified structure (top bar, body, actions)

tap-out-close

ESC handling

no stacking except system alerts

translation keys for all UI text

Sections 3 & 6 define content; Section 12 defines mechanics.

15. Search (Section 13)

Search is:

context-based

client-side filtered

non-global

non-personalized

multilingual

No ranking, no fuzzy matching, no query logging.

16. QA System (90.x)

QA flags indicate internal operational health:

low-scan-discipline

high-invalid-attempts

low-cashier-coverage

low-customer-confirmation

qa-ok

Used only for internal dashboards and audits, not merchant UI.

⭐ ENGINEERING PRINCIPLES (Summary)

Backend decides everything: redeem validity, billing, QA.

Client is presentational only: no business logic, no trust.

QRs encode no logic: always route through Workers.

Promo tokens are single-use: irreversible, non-forgeable.

Stats are append-only: never mutated.

Privacy-first: no PII, no tracking, no cookies.

Consistency across browser/PWA: same flows, same guarantees.

Merchant-safety: no ratios, no sensitive diagnostics, no internals exposed.

PWA-mode adds value, not risk: install → support lifecycle.

Dash is read-only: transforms Worker data into narratives.

--------------------------------------------------------------------

MERCHANT TERMS — VERIFICATION & BILLING

1. Merchant Verification by Payment
By completing a payment through Stripe Checkout, the payor represents and
warrants that they are authorized to operate, manage, or promote the business
location associated with the selected campaign. Stripe payment constitutes
authentication and verification for the purposes of NaviGen’s merchant features.

2. Campaign Activation
Campaigns become active immediately upon successful payment. NaviGen may
suspend or disable a campaign if:
   (a) misuse is reported by the business location,
   (b) payment is disputed or reversed,
   (c) the campaign violates platform policy.

3. Unauthorized Campaigns
If a business reports an unintended campaign, NaviGen will pause the campaign
and contact the payor. Refund eligibility is determined at NaviGen’s discretion,
particularly in cases involving misrepresentation.

4. Billing & Prepaid Balance
All campaigns operate on a prepaid basis. Redemption events consume from the
merchant’s campaign balance according to NaviGen’s fee schedule. When the
balance reaches zero, the campaign pauses automatically.

5. Stripe Invoicing & VAT
Invoices for campaigns are issued directly by Stripe. Tax treatment, including
VAT, follows Stripe’s billing and tax configuration based on the billing address
and tax information provided by the payor.

6. No Fiduciary Responsibility
NaviGen does not act as an agent or financial intermediary for tax collection
beyond what Stripe performs. The merchant is solely responsible for providing
accurate billing and tax information.

7. Limitation of Liability
NaviGen is not responsible for losses, damages, or disputes arising from:
   • campaigns activated by unauthorized individuals,
   • misinformation supplied by the payor,
   • merchant failure to train or notify staff,
   • misconfigured or incomplete campaign information.

8. Data Accuracy
The merchant agrees to maintain accurate business, billing, and tax information.
NaviGen may update merchant data based on authoritative or publicly available
sources.

9. Prohibited Use
Merchants may not:
   • impersonate another business,
   • run misleading promotions,
   • attempt to circumvent the prepaid model,
   • misuse QR codes in ways that endanger customer trust.

10. Termination
NaviGen may suspend accounts, campaigns, or entities that violate these terms
or exhibit harmful behavior.

--------------------------------------------------------------------

✅ OWNER PLATFORM — BUSINESS EDITION

Simple ownership. Real-world control. No accounts.

NaviGen lets any business take control of its location on the platform in minutes.
No sign-up forms. No waiting. No dashboards to configure.

If your location exists on NaviGen, you can operate it.

--------------------------------------------------------------------

How it works

Many business locations already exist on NaviGen.
We build them from public data so customers can discover places instantly.

When you want to run a promotion or take control of your information:

• Find your location  
• Choose “Run Campaign” or “Protect This Location”  
• Complete payment via Stripe  

That’s it.

Your payment establishes you as the current operator of that location.

--------------------------------------------------------------------

What ownership means

While you are the Owner of a location:

• Your analytics are private  
• You control promotions  
• You can update your business information  
• No one else can operate or interfere  

Ownership is time-based and tied to real activity.
There are no permanent accounts and no hidden commitments.

When ownership ends, analytics access is lost and the location returns to normal public discoverability rules.

--------------------------------------------------------------------

Safe by design

NaviGen does not rely on usernames or passwords.

Control is established by real payment and enforced by the system.
This prevents impersonation, prank edits, and misuse.

If someone mistakenly starts a campaign for your location:

• Your staff can report it instantly  
• The campaign is frozen immediately  
• We contact the payor directly  

Because control requires real payment, abuse is extremely rare.

--------------------------------------------------------------------

Predictable costs

NaviGen uses a prepaid model.

• You fund a campaign budget upfront  
• Each redeemed promotion deducts a small, fixed fee  
• When the budget runs out, the campaign pauses automatically  

No subscriptions.
No long-term contracts.
No surprise invoices.

Stripe handles all payments and invoices.

--------------------------------------------------------------------

Why this works

Traditional ads spend money on clicks.
NaviGen only charges when real customers redeem offers.

You get:

• Customer-facing QR promotions  
• Verifiable redemptions  
• Clear, merchant-safe analytics  
• Control over your public presence  

All without accounts, paperwork, or setup friction.

--------------------------------------------------------------------

NaviGen is built for the real world:
places, people, and promotions that actually happen.

--------------------------------------------------------------------

Authority Notice

This appendix documents Stripe integration mechanics only.

The authoritative rules for ownership, attribution, idempotency, and access
are defined in Sections 91.4.1–91.4.3.

In case of discrepancy, Sections 91.4.x take precedence.

APPENDIX B — STRIPE INTEGRATION SPEC

B1. Stripe Objects Used
  • Checkout Session
  • PaymentIntent
  • Customer
  • Invoice / InvoiceItem
  • Tax ID Collection (optional)
  • Webhooks:
      - checkout.session.completed
      - payment_intent.succeeded
      - invoice.paid (optional if using Stripe Tax)

B2. Required Checkout Configuration
  mode: "payment"
  customer_creation: "if_required"
  billing_address_collection: "auto" | "required"
  tax_id_collection:
      enabled: true   // optional but recommended
  metadata:
      campaignKey
      initiationType: "owner" | "agent" | "platform"
      campaignPreset: "visibility" | "promotion"
      navigenVersion

      // exactly one target identity route:
      // Existing-location route:
      locationID (slug)

      // Brand-new private-shell route:
      draftULID
      draftSessionId

  Existing-location checkout resolves `locationID` server-side to a canonical ULID via the alias system.
  Brand-new checkout resolves `draftULID` + `draftSessionId` as the authoritative pre-slug target identity.
  Arbitrary ULIDs must never be supplied by clients or Stripe metadata.

B3. Webhook Processing (checkout.session.completed → API Worker)

The Stripe webhook receiver is implemented in the API Worker.

Endpoint:
• POST /api/stripe/webhook

Rules:
• Stripe signature verification is mandatory.
• The webhook receiver MUST be idempotent using payment_intent.id.
• Ownership and ledger writes occur only inside this endpoint.
• No client-initiated request may establish ownership.
  Extract:
    • stripeCustomerId
    • email
    • billing_details.name
    • billing_details.address.country
    • tax_ids (if any)
    • amount_total, currency
    • payment_intent
• Stripe-provided email may be used to send owner reminder or recovery emails that reference Payment ID (pi_...), but MUST NOT be stored in NaviGen KV/logs/datasets.

  Steps:
    1. Validate one valid target identity route in metadata:
         • existing-location: locationID
         • brand-new private shell: draftULID + draftSessionId
    2. Resolve canonical ULID:
         • existing-location route → from locationID via the alias system
         • brand-new private-shell route → from server-issued draftULID after validating draftSessionId
    3. Resolve ownership record for the canonical ULID
    4. Extend ownership window for the purchased Plan and persist the selected campaignPreset
       When persisting plan:<payment_intent.id>, set expiresAt = ownership:<ULID>.exclusiveUntil (post-extension value).
    5. Persist Plan record:
        write plan:<payment_intent.id> = { priceId, tier, maxPublishedLocations, purchasedAt, expiresAt, initiationType, campaignPreset }
    6. Write billing ledger TopUp entry
    7. Activate campaign if applicable
    8. Write agent attribution record if agentId present

B4. VAT & Tax Handling
  • Country derived from billing_details.address.country
  • VAT ID (if entered):
       - auto-insert into entity.billingProfile
       - visible only internally
  • Stripe Tax determines:
       - VAT inclusion/deduction
       - jurisdictional tax rules
  • NaviGen never processes VAT manually.

B5. Idempotency
  • payment_intent.id is the idempotency key
  • All top-ups and ledger writes require idempotent operations

B6. Error States
  • incomplete or expired checkout sessions → ignored
  • payment_intent.payment_failed → no activation
  • webhook retries must remain fully idempotent

B7. Security Boundaries
  • NaviGen stores no card data
  • All sensitive fields handled by Stripe
  • Customer email is the only personal identifier used by NaviGen

B8. Recommended Logging
  • sessionId
  • paymentIntentId
  • locationID (slug)
  • resolvedULID (internal)
  • campaignKey
  • initiationType
  • ownershipSource
  • agentId (if present)
  • amount / currency
  • VAT/tax metadata (optional)

  locationID is logged as received; resolvedULID is logged for internal traceability only.

--------------------------------------------------------------------
Appendix D — LPM Creation, Ownership & Attribution

1. Unified Creation Mechanism

All Location Profile Modals (LPMs) are created using NaviGen’s automated
platform tools.

There is no manual, privileged, or offline creation process.

LPMs may be initiated by:
• the business owner
• an authorized agent
• NaviGen personnel acting in a facilitation role

All initiators use the same platform interfaces and data requirements.

--------------------------------------------------------------------
2. Ownership Establishment

Ownership of an LPM is established exclusively through payment.

• Creation alone does not grant ownership.
• Ownership begins only after successful campaign payment.
• Ownership is time-limited and revocable.
• Ownership always belongs to the business operator.

--------------------------------------------------------------------
3. Role of Agents

Agents may:
• introduce businesses to NaviGen
• initiate LPM creation on behalf of businesses
• assist businesses during onboarding
• be compensated via referral or revenue-sharing agreements

Agents never acquire ownership rights.

Agent attribution is recognized only if recorded before or at payment time.

--------------------------------------------------------------------
4. Role of NaviGen

NaviGen may:
• provide platform tools for automated LPM creation
• facilitate onboarding using the same tools available to others
• ensure data quality, QA, and platform integrity

NaviGen does not claim ownership of LPMs it facilitates.

--------------------------------------------------------------------
5. No Preferential Treatment

All LPMs, regardless of who initiated creation:
• follow the same ownership rules
• require the same payment thresholds
• are subject to the same pricing and visibility policies

There is no preferential access, pricing, or reservation.

--------------------------------------------------------------------
6. Data Responsibility

All information provided during LPM creation must be accurate.

The business operator remains responsible for the correctness of submitted data,
regardless of who assisted in entering it.

--------------------------------------------------------------------

Appendix E — Owner Access UX Contracts

Access-Required Interstitial (Owner Recovery)

When ownership is active (exclusiveUntil > now) but the requester lacks
a valid owner cookie, the system MUST present a dedicated access-required interstitial.

Primary message:
• “Owner settings”

Secondary message:
• “To open the Owner Dash, use Restore Access with the Payment ID (pi_...) from your Stripe receipt or payment email.”

Primary action:
• “Restore access”

Secondary actions:
• “See example dashboards”
• “Sign out on this device”

Secondary guidance text:
• “Tip: search your inbox for ‘Stripe’ if you need to find the payment.”

Rules:
• The interstitial must not reveal owner-only data.
• The interstitial must not infer or grant ownership.
• No resend mechanism exists; recovery uses the Payment ID (pi_...) from the Stripe receipt, invoice, or payment confirmation email.
• No login, account creation, or identity prompt is permitted.

--------------------------------------------------------------------

Access-Blocked (Unowned LPM — LPM Entry)

When a user attempts to open Dash for an unowned LPM via the LPM 📈 entry,
the system MUST NOT render analytics or an analytics interstitial.

Instead, the App MUST open the “Owner settings” modal (Section 6.2.8),
providing contextual actions:
• Run campaign
• See example dashboards (Example Locations only)

--------------------------------------------------------------------

Title:
Analytics access required

--------------------------------------------------------------------

Body:
Analytics for this location are available to its active operator.

To view real analytics, activate ownership by purchasing a paid Plan.

--------------------------------------------------------------------

Primary action:
Activate analytics for this location

Behavior:
• Routes to Owner Platform onboarding for the requested LPM.
• Initiates Plan selection and checkout.

--------------------------------------------------------------------

Secondary action:
See how analytics look for other locations

Behavior:
• Opens the Example Dash selector.
• Does not grant access to analytics for the requested LPM.

--------------------------------------------------------------------

UI Note (mandatory):
Example analytics shown here belong to other locations
and are not related to this business.

--------------------------------------------------------------------

Example Dash Selector (UX Contract)

• Displays a list of designated Example Locations.
• Uses real Dash views and real analytics data.
• Shows no more than 3–6 example cards at a time.
• Uses the same card visual language as the Promotion modal.
• Cards are presented as a simple vertical list (no grouping required).

Each card MUST include:
• Location name
• Sector label (translated)
• “Example” badge

Card action:
Open analytics

Behavior:
• Routes to /dash/<example-location>.
• Displays the real Dash for that Example Location.

--------------------------------------------------------------------

Rules:
• The interstitial MUST NOT reveal any analytics for the requested LPM.
• The interstitial MUST NOT display synthetic or fake data.
• Example Dash routing MUST NOT imply endorsement or performance guarantees.
• Ownership rules remain unchanged by viewing Example Dash locations.

--------------------------------------------------------------------

Appendix F — Implementation Map (Spec → Code)

This appendix maps specification sections to concrete implementation artifacts.
It exists to clarify what is already implemented, what is partially implemented,
and what is still planned.

This appendix is non-normative:
• It does not define behavior.
• It documents conformance and readiness only.

The authoritative rules remain in Sections 1–13, 91.x, and 92.x.

(See Appendix F table for spec → app.js / dash.js / Pages Worker / API Worker mapping.)

| Spec area                                        | Runtime component         | Entry points in code                                                                                              | Storage / keys                                                 | Authority              | Status                                                                                  |
| ------------------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| LPM open from `?lp=`                             | App Shell                 | `app.js` reads `?lp=...`, opens LPM via `showLocationProfileModal()`                                              | none                                                           | App Shell              | ✅ implemented                                                                          |
| LPM modal composition                            | App Shell                 | `modal-injector.js`: `createLocationProfileModal()`, `showLocationProfileModal()`, `wireLocationProfileModal()`   | localStorage (UI state only)                                   | App Shell              | ✅ implemented                                                                          |
| Info QR tracking                                 | Pages Worker + API Worker | `_worker.js` → /out/qr-scan, `index.ts` → /hit/qr-scan                                                            | `KV_STATS`                                                     | API Worker             | ✅ layered implementation (Pages = routing/logging, API = authoritative state)          |
| Promo QR issuance                                | API Worker                | `index.ts`: `GET /api/promo-qr?locationID=...`                                                                    | `redeem:<token>`, `qrlog:*`, `stats:*`                         | API Worker             | ✅ implemented (needs status enum alignment)                                            |
| Promo redeem redirect                            | Pages Worker              | `_worker.js`: `/out/qr-redeem/:slug` forwards token headers to API Worker                                         | none                                                           | API Worker             | ✅ implemented                                                                          |
| Token consumption + redeem/invalid               | API Worker                | `index.ts`: `POST /hit/qr-redeem/:id` consumes `redeem:<token>` and logs redeem/invalid                           | `redeem:<token>`, `qrlog:*`, `stats:*`                         | API Worker             | ✅ implemented (campaignKey reselected server-side; must be bound to token metadata)    |
| Customer confirmation                            | App Shell                 | `modal-injector.js`: polls `/api/redeem-status`; sends `/hit/redeem-confirmation-customer/:id`                    | `stats:*`                                                      | API Worker             | ✅ implemented                                                                          |
| Cashier confirmation                             | App Shell                 | `app.js` shows modal; `modal-injector.js` sends `/hit/redeem-confirmation-cashier/:id`                            | `stats:*`                                                      | API Worker             | ✅ implemented                                                                          |
| Dash stats aggregation                           | API Worker                | `index.ts`: `GET /api/stats?locationID&from&to` aggregates stats + qrlog + campaigns                              | `stats:*`, `qrlog:*`, `status:*`                               | API Worker             | ✅ implemented (QA tagging included)                                                    |
| Dash routing canonicalization                    | Pages Worker              | `_worker.js` canonicalizes `/dash?locationID=...` → `/dash/<ULID>`                                                | `KV_ALIASES`                                                   | Pages Worker           | ✅ implemented                                                                          |
| Dataset list by context                          | App Shell → API           | `app.js` calls `API_BASE /api/data/list?context=...`                                                              | dataset JSON                                                   | API Worker             | ✅ implemented                                                                          |
| Modal system                                     | App Shell                 | `modal-injector.js`: `injectModal/showModal/hideModal/setupTapOutClose`                                           | DOM                                                            | App Shell              | ✅ implemented                                                                          |
| Translations                                     | Pages Worker + App Shell  | `_worker.js` sets `<html lang>`; `app.js` loads i18n bundles                                                      | `/data/i18n/*.json`, localStorage `lang`                       | Pages Worker / App     | ✅ implemented                                                                          |
| Donation purchases (MSM “myPurchases”)           | App Shell                 | `app.js` handles Stripe return `?sid=...`; `modal-injector.js` renders history                                    | `localStorage.myPurchases`                                     | App Shell              | ✅ implemented (donations only; not billing)                                            |
| Billing ledger (per redeem / prepaid)            | API Worker                | `index.ts` contains `writeBillingRecord()` stub                                                                   | `billing:*` (KV)                                               | API Worker             | ❌ not implemented end-to-end                                                           |
| Owner Platform ownership KV (`ownership:<ULID>`) | —                         | not present in these code files                                                                                   | `ownership:<ULID>`                                             | API Worker             | ❌ not implemented yet (spec-only)                                                      |
| Stripe exchange / Payment ID restore → cookie session | —                    | not present in these code files                                                                                   | HttpOnly cookie                                                | API Worker             | ❌ not implemented yet (spec-only)                                                      |
| Profile edit API `/api/profile/update`           | —                         | not present in these code files                                                                                   | `override:*`, `override_log:*`                                 | API Worker             | ❌ not implemented yet (spec-only)                                                      |
| Agent attribution KV + cap tracking              | —                         | not present in these code files                                                                                   | `agent_attribution:*`                                          | API Worker             | ❌ not implemented yet (spec-only)                                                      |

--------------------------------------------------------------------

APPENDIX G — Slug Generation Contract (Canonical Identity Rules)

Purpose:
This appendix defines the deterministic rules for generating, validating,
and preserving location slugs (locationID).

Slug stability is critical because:

• Public URLs use slug
• KV_ALIASES maps slug → ULID
• QR codes embed slug
• Dash routing accepts slug
• Historical analytics depend on ULID resolved from slug

Slug generation MUST be deterministic, reproducible, and collision-safe.

--------------------------------------------------------------------

G.1 Definitions

• Slug (locationID):
    Human-readable, URL-safe identifier of a location.

• ULID:
    Canonical internal identifier. All analytics, tokens, billing,
    and ownership records are keyed by ULID.

• Alias:
    KV entry mapping slug → ULID.

Key:
    alias:<slug> → { locationID: <ULID> }

Slug is public identity.
ULID is authoritative identity.

--------------------------------------------------------------------

G.2 Slug Immutability Rule

Once a slug is created and mapped to a ULID:

• The slug MUST NEVER change.
• The ULID MUST NEVER change.
• Historical analytics must remain bound to ULID.

If a business name or geo changes:
• Slug remains unchanged.
• profile_base or override updates handle display changes.

No slug regeneration is permitted after creation.

--------------------------------------------------------------------

G.3 Slug Structure (Canonical Format)

Slug format:

    <normalized-name>-<geo-suffix>

Example:
    hd-hachaturyan-9457

Where:

1) normalized-name:
   • lowercase
   • diacritics removed
   • whitespace → single hyphen
   • punctuation removed except hyphen
   • trimmed
   • max length recommended ≤ 48 chars

2) geo-suffix:
   • derived from coordinates
   • based on latitude/longitude to 6 decimals
   • last 4 digits of normalized coordinate composite
   • numeric only
   • fixed width (recommended 4 digits)

This structure ensures:

• human readability
• relative uniqueness
• stability across imports

--------------------------------------------------------------------

G.4 Normalization Rules (Deterministic)

Given input business name:

Step 1: Unicode normalization (NFKD)
Step 2: Remove diacritics
Step 3: Lowercase
Step 4: Replace all whitespace sequences with "-"
Step 5: Remove all characters not in [a-z0-9-]
Step 6: Collapse consecutive hyphens
Step 7: Trim leading/trailing hyphens

Example:

"Aby Miles – Hachaturyan"
→ "aby-miles-hachaturyan"

--------------------------------------------------------------------

G.5 Geo Suffix Generation

Given latitude and longitude:

1) Round both to 6 decimal places.
2) Concatenate as:
       abs(lat * 1e6) + abs(lng * 1e6)
3) Convert to integer string.
4) Take last 4 digits.

Example:
    lat = 57.560123
    lng = 29.029457
    composite = "5756012329029457"
    suffix = "9457"

Slug:
    aby-miles-hachaturyan-9457

This approach:

• avoids external geo-hash dependency
• remains deterministic
• provides local uniqueness within dense urban zones

--------------------------------------------------------------------

G.6 Collision Handling

If a generated slug already exists:

1) Check KV:
       alias:<slug>

2) If no entry:
       assign slug.

3) If entry exists and maps to same ULID:
       accept (idempotent).

4) If entry exists and maps to different ULID:
       append incrementing counter:

       <slug>-2
       <slug>-3
       etc.

Counter is numeric, appended after geo-suffix.

Example:
    aby-miles-9457
    aby-miles-9457-2

Collision resolution must be deterministic and logged.

--------------------------------------------------------------------

G.7 Seeded vs Owner-Created Slugs

Slug generation rules apply equally to:

• Seeded (Ch0) locations
• Owner-created locations
• Agent-created locations

No privileged slug formats exist.

Slug format MUST NOT encode:

• ownership
• plan tier
• campaign state
• agent identity
• timestamps

Slug is purely identity.

--------------------------------------------------------------------

G.8 Slug Validation (Server-Side)

API Worker MUST validate slug:

• matches regex:
      ^[a-z0-9]+(-[a-z0-9]+)*$

• length ≤ 64 characters

Invalid slugs MUST be rejected at creation time.

--------------------------------------------------------------------

G.9 Migration Invariant

For existing profiles.json entries:

• Their current slug is authoritative.
• New KV-based profile_base entries MUST reuse existing slug.
• alias:<slug> must always resolve to the same ULID as historical records.

No re-slugging is permitted during migration.

--------------------------------------------------------------------

G.10 Non-Goals

Slug generation does NOT:

• Guarantee global uniqueness across the planet
• Represent legal identity
• Replace business registration numbers
• Encode ranking or context

Slug exists solely for:

• stable routing
• QR encoding
• human readability
• KV alias mapping

--------------------------------------------------------------------

APPENDIX — PlanAllocDO (Serialized Publish Capacity Enforcement)

Purpose:
Provide atomic, serialized enforcement of publish capacity under concurrency.
KV plan_alloc is not sufficient for race-free enforcement.

--------------------------------------------------------------------

A) Durable Object Class

Class:
• PlanAllocDO

Instance id (deterministic):
• planalloc:<payment_intent.id>

This DO is authoritative for capacity reservation.
KV plan_alloc:<payment_intent.id> is a best-effort mirror only.

--------------------------------------------------------------------

B) Authoritative State

PlanAllocDO stores:
• ulids: set of <ULID> allocated under this plan purchase

Invariants:
• Allocation is idempotent per ULID.
• Allocation never exceeds maxPublishedLocations.
• Concurrency is serialized by DO single-threaded execution per instance.

--------------------------------------------------------------------

C) Message Contract

Reserve request (v1):

{
  "ver": 1,
  "op": "reserve",
  "pi": "pi_...",
  "ulid": "01H...",
  "max": 3,
  "ts": "ISO-8601"
}

Reserve response (v1):

{
  "ok": true,
  "alreadyAllocated": false,
  "allocatedCount": 3,
  "max": 3,
  "reservationState": "held"
}

Rejection response (v1):

{
  "ok": false,
  "reason": "capacity_exceeded",
  "allocatedCount": 3,
  "max": 3
}

Commit request (v1):

{
  "ver": 1,
  "op": "commit",
  "pi": "pi_...",
  "ulid": "01H...",
  "ts": "ISO-8601"
}

Release request (v1):

{
  "ver": 1,
  "op": "release",
  "pi": "pi_...",
  "ulid": "01H...",
  "ts": "ISO-8601"
}

Rules:
• If ulid is already fully allocated → reserve MAY return ok:true, alreadyAllocated:true.
• If capacity would be exceeded → reserve returns ok:false, reason:"capacity_exceeded".
• `reserve` creates a provisional hold only.
• `commit` finalizes the held allocation after authoritative KV publish commit succeeds.
• `release` removes a provisional hold when validation fails or a later publish write aborts before commit.
• The API Worker MUST treat ok:false as a publish rejection (403) with no side effects.

Optional snapshot request (v1, non-authoritative UI/debug only):

{
  "ver": 1,
  "op": "snapshot",
  "pi": "pi_..."
}

Snapshot response returns ulids[] and counts.
Snapshot MUST NOT be required for publish.

--------------------------------------------------------------------

D) Integration Rules

Publish flow:
• MUST complete structural validation before finalizing capacity consumption.
• API Worker MAY call PlanAllocDO reserve before final KV writes only if it also supports commit / release.
• If reserve succeeds and a later publish step fails before authoritative KV commit, API Worker MUST call release.
• After authoritative KV commit succeeds, API Worker MUST call commit for the held allocation.
• MUST NOT call Stripe in publish.

Mirroring:
• After a successful commit, API Worker MAY update KV plan_alloc:<pi> as a best-effort mirror.
• Mirror failures MUST NOT rollback publish.

--------------------------------------------------------------------