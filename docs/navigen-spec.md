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
  • NaviGen may transiently process Stripe-provided email solely to deliver Owner access emails.
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
  • Updates to datasets (profiles.json, campaigns.json, finance.json, contexts.json)
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
       profiles.json / campaigns.json / finance.json / contexts.json updates
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

Owner Exchange is the server-side step that follows a successful payment
or signed owner access link.

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

### Restore Access

Restore Access is the recovery of a missing or expired Operator Session.

Restore Access:
- is free
- does not modify ownership
- does not extend campaigns
- only restores authentication

Restore Access — Cross-device recovery (Payment ID)

When restoring access on a different device, the owner may not have a usable
Checkout Session link (cs_...) in their email.

Therefore, NaviGen MUST support recovery using the Stripe PaymentIntent ID:

• Owner provides: Payment ID (pi_...)
• System performs: server-side lookup of the associated Checkout Session
• System validates: payment_status="paid" AND status="complete"
• System resolves: metadata.locationID → ULID
• System mints: op_sess cookie and opsess:<sessionId> record
• System redirects: /dash/<ULID>

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

It is derived from the active campaign window.

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

| Situation | Primary message | Secondary clarification |
|---------|-----------------|-------------------------|
| Owned + no Operator Session | “Owner access required” | “Use your most recent Owner access email or Stripe receipt.” |
| Owned + session + no Campaign Entitlement | “Campaign required for analytics” | “Analytics are collected, but dashboard access requires an active campaign.” |
| Unowned | “Analytics access required” | “Activate ownership by running a campaign.” |

Rules:
• Messages must be factual, non-salesy, and non-alarming.  
• UI MUST NOT suggest data loss when analytics are merely gated.

--------------------------------------------------------------------

1. CORE SYSTEM OVERVIEW

1.1 Architectural Intent

NaviGen is a multi-tenant, location-centric platform for presenting business
profiles, running promotions, generating verifiable QR-based redemptions,
and producing analytics and operational diagnostics. It is implemented as:

  • A PWA-capable client (App shell + Dash)
  • A Pages Worker (routing, QR redirect, static hosting)
  • An API Worker (stats, token handling, campaign logic, QA tagging)
  • A small, controlled dataset (profiles.json, campaigns.json, finance.json, contexts.json)
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
Signed links and cookies provide access continuity only.
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

1) **Dataset Layer (Read-Only JSON)**  
   Data governing locations, campaigns, contexts, and pricing:
     • profiles.json  
     • campaigns.json  
     • finance.json  
     • contexts.json  
   All are static files deployed with the site. Workers read them as immutable inputs.

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
     • Emits /hit/qr-redeem/<ULID> (Pages → API Worker)
     • Forwards redeem token via header
     • Redirects cashier device to:
          /?lp=<slug>&redeemed=1&camp=<key>
     • Does NOT determine success or validity; backend decides

Redirects are instantaneous and idempotent.  
QR system never assumes state solely from URL parameters.

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
   2. Pages Worker emits qr-redeem hit to API Worker  
   3. API Worker consumes token:
        - fresh → status:"ok" → REDEEM  
        - used/expired → status:"invalid" → INVALID  
   4. Cashier device redirected with redeemed=1  
   5. Cashier confirmation modal shown → CONFIRM_CASH

Promo QR flow enables multi-actor integrity without authentication.

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
   Triggered after redeem redirect (/redeemed=1).  
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
  2. Worker emits /hit/qr-redeem/<UID> with token header
  3. Backend consumes the token:
       • status = "ok" → REDEEM event
       • status = "invalid" → INVALID event (reused/expired token)
  4. Pages Worker redirects the cashier device to:
       /?lp=<slug>&redeemed=1&camp=<campaignKey>

This URL signals the app shell to open both the LPM and the cashier confirmation modal.

3.6 Cashier Redeem Confirmation Modal

Upon arriving with `redeemed=1`, the cashier device shows a mandatory modal:

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
    1. Build Owner Platform (Section 92) with signed link access + Stripe checkout  
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

B) **Campaign metadata (campaigns.json)**
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
    - instruction: use most recent Owner access email / Stripe receipt
    - CTA: opens Restore Access modal
• See example dashboards
    - CTA: opens Example Dashboards modal (3–6 example cards)

No campaign purchase actions are shown in this state.

--------------------------------------------------------------------
C) Unowned LPM

• Dash access is blocked.
• 📈 MUST open the “Owner settings” modal (not a redirect).

“Owner settings” modal (unowned) MUST include:
• Run campaign
    - CTA: opens Campaign Setup modal (contextual to this LPM)
• (Deferred) Keep visible
    - CTA: extends courtesy visibility for 30 days (pricing deferred)
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
Resource Class                     | Cache Policy
--------------------------------------------------------------------
App shell (index.html)              | Network-first
JS bundles (app.js, dash.js, etc.)  | Network-first with versioning
CSS / images / fonts                | Cache-first (hashed assets only)
Translation bundles (/data/i18n)    | Cache-first with version bump
--------------------------------------------------------------------
/api/* endpoints                    | Network-only (no cache)
/dash/* routes                      | Network-only (no cache)
/owner/* endpoints                  | Network-only (no cache)
--------------------------------------------------------------------
Owner interstitial responses        | Network-only
Signed-link exchange (/owner/exchange) | Network-only
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
• Run campaign → opens Campaign Setup modal
• Protect this location → opens Exclusive Operation Period modal (€5/30)
• Restore access → opens Restore Access modal (email guidance)
• See example dashboards → opens Example Dashboards modal
• (Optional) Find my location → location selector / search helper

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

All files described here are generated from controlled datasets (GSheets or
internal pipelines) and consumed client-side or server-side as read-only resources.

--------------------------------------------------------------------

8.2 File Overview

The platform loads a small number of structured JSON files:

  1) profiles.json      – business metadata (per location)
  2) campaigns.json     – active/past promotions per location
  3) finance.json       – sector/country pricing metadata
  4) contexts.json      – navigation context hierarchy (URL structure)
  5) i18n bundles       – /data/i18n/<lang>.json (see Section 7)

These files are immutable at runtime; updates are applied by redeploying the dataset.

--------------------------------------------------------------------

8.3 profiles.json (Location Profiles)

Each profile corresponds to a single location and includes:

  • locationID (slug)                          – human identifier
  • locationName (multilingual)
  • groupKey / subgroupKey                     – high-level grouping
  • context                                    – primary navigation path (e.g. souvenirs/hungary/budapest)
  • coordinates                                – lat/lng
  • contact info                               – phone, email, website, socials
  • detailSlug                                 – optional extra slug for custom landing
  • qrUrl (optional override)                  – custom fallback for Info QR landing
  • media                                      – images, icons, banners
  • visibility & priority flags
  • any business-specific extensions

Profiles do **not** store campaign, QA, or stats information.  
They are pure metadata.

--------------------------------------------------------------------

8.3.1 Canonical Profile Schema & Source Attribution

profiles.json is the canonical, UI-facing representation of a location profile.
It defines the normalized field names and shapes consumed by:

• App Shell (LPM)
• Dashboard (Dash)
• Pages Worker routing (qrUrl, context)
• API Worker list/profile endpoints

External datasets (e.g., OpenStreetMap/OSM, commercial directories, manual research)
are treated as ingestion sources, not parallel schemas.

NaviGen does not expose OSM tag structures to the UI layer.
OSM tags and geometries are mapped into the normalized profiles.json fields.

--------------------------------------------------------------------
Minimal sources structure (non-redundant)

Each profile may include an optional `sources` object containing provenance only.
This block must not duplicate normalized profile fields.

Example (conceptual):

sources: {
  osm?: {
    id: string,                // e.g., "way/11643310" or "node/..."
    type?: string,             // optional: "node" | "way" | "relation"
    fetchedAt: ISO-8601,       // when ingested
    license: string,           // e.g., "ODbL"
    rawTagsRef?: string        // optional pointer/ref to raw tag archive, not in profiles.json
  },
  other?: [
    { name: string, ref?: string, fetchedAt?: ISO-8601 }
  ]
}

Rules:
• sources are metadata only (provenance + audit).
• Normalized profile fields remain single-source-of-truth for the UI.
• Raw OSM tags are not embedded in profiles.json; they may be stored separately if needed.
• Attribution and licensing requirements must be satisfied via sources metadata.

--------------------------------------------------------------------

8.3.1.1 Example Location Flag (Analytics Showcase)

NaviGen may designate certain locations as Example Locations
for the purpose of analytics demonstration.

Example Location flag:
• is a boolean attribute set internally by NaviGen.
• is not editable by Owners.
• is not derived from campaign or ownership state.

Rules:
• Only locations explicitly flagged as Example Locations
  may be used for Example Dash routing.
• Example Locations use real analytics and real campaigns (if any).
• Example Locations MUST NOT imply endorsement or performance guarantees.
• Example Locations MUST be visually marked as examples in the UI.

Example Location designation exists solely for onboarding
and product demonstration purposes.

--------------------------------------------------------------------

8.3.2 Profile Override Model (Owner Edits)

NaviGen supports owner-provided profile edits via a non-destructive override layer.

Overrides allow Owners to modify a limited subset of profile fields
without mutating the base profiles.json dataset.

--------------------------------------------------------------------
A) Override Storage Model

Overrides are stored per location as server-side KV entries.

Keys:
• override:<ULID>                // current effective override snapshot
• override_log:<ULID>:<ts>       // append-only audit trail

The base profile (profiles.json) is immutable at runtime.

--------------------------------------------------------------------
B) Override Schema (Partial, Field-Level)

The override object is a **partial structure** matching the shape of profiles.json,
restricted to the editable whitelist defined in Section 92.3.

Rules:
• Overrides MAY include only whitelisted fields.
• Overrides MUST NOT include fields outside the editable whitelist.
• Missing fields in override do NOT imply deletion.

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

The effective profile is computed server-side using a deterministic merge:

effectiveProfile = deepMerge(baseProfile, override)

Rules:
• Base profile fields remain the default.
• Override fields replace corresponding base fields.
• Nested objects are deep-merged.
• Arrays in override REPLACE base arrays entirely.
• Null values are NOT permitted to remove base fields.

Deletion semantics:
• Owners cannot delete base fields.
• To “remove” optional data, owners must set the field to an empty value
  allowed by validation (e.g. empty string or empty array).

--------------------------------------------------------------------
D) Read Path (Authoritative)

All profile reads MUST return the merged effective profile.

Authoritative read path:
• App Shell: /api/data/profile?id=<slug>
• Dash:     /api/data/profile?id=<slug>

Rules:
• API Worker performs the merge before returning profile data.
• Clients MUST NOT attempt to merge base and override themselves.
• Clients MUST NOT access override KV entries directly.

--------------------------------------------------------------------
E) Consistency & Caching Rules

• Overrides take effect immediately after successful write.
• No client-side caching of merged profiles is permitted beyond
  normal HTTP caching rules for API responses.
• Service Worker MUST NOT cache profile responses that include overrides.

--------------------------------------------------------------------
F) Audit & Safety

• Every override write MUST produce an override_log entry.
• Override logs are append-only and timestamped.
• Logs include:
    - ULID
    - edited fields
    - timestamp
    - payment_intent.id
    - initiationType

Override logs are internal-only and never exposed in UI.

--------------------------------------------------------------------
G) Non-Goals (Explicit)

Profile overrides do NOT:
• create new profile fields
• allow deletion or mutation of base data
• permit bulk edits across locations
• expose edit history to Owners
• bypass QA, ingestion, or normalization pipelines
• affect location existence, public accessibility, or navigation inclusion
• suppress discoverability or materially disadvantage competing locations

Overrides exist solely to allow accountable, reversible presentation-layer edits
by an economically attributable Owner.

--------------------------------------------------------------------

8.4 campaigns.json (Campaign Definitions)

Structure (per row):

  • locationID                                  – slug referencing profiles.json
  • campaignKey                                 – unique ID per location
  • campaignName                                – quoted in UI (“10% off your purchase”)
  • brandKey                                    – branding reference
  • context (optional)                          – override for promo injection
  • sectorKey                                   – lookup into finance.json
  • startDate / endDate                         – active window
  • status                                      – Active | Paused | Finished | Suspended
  • discountKind, discountValue                 – percent, fixed, BOGO, etc.
  • eligibilityType / notes                     – optional restrictions
  • metadata (utmSource, utmCampaign, notes)    – analytics enrichment only

Campaign status semantics are enforced server-side and interpreted consistently
across promo issuance, redeem validation, billing, and dashboard rendering.

• Active  
  Campaign is eligible for promo QR issuance and redeem within its time window.

• Paused  
  Owner-initiated temporary stop. Campaign remains defined but is not eligible
  for promo QR issuance or redeem until resumed by the Owner.

• Finished  
  Terminal end state reached after campaign completion. Finished campaigns
  are never eligible for promo QR issuance or redeem.

• Suspended  
  Owner-initiated freeze, typically triggered by dispute or waiver. Suspended
  campaigns are hard-blocked until explicitly reactivated by the Owner.

NaviGen does not automatically suspend campaigns due to payment disputes.
Campaign status is authoritative only when enforced by the API Worker.

Campaigns.json defines **what** can be promoted; the actual promo/redeem events are logged elsewhere.

--------------------------------------------------------------------

8.4.1 Campaign Entitlement Spine (authoritative)

### Campaign row interpretation (source-of-truth)

A campaign row is considered **entitling** (i.e., contributes to `CampaignEntitled=true`) when:

- `status` is `Active`
- `statusOverride` does not force-disable the campaign (override rules are authoritative)
- today is within `[startDate, endDate]` (inclusive)

If multiple rows exist for a location:
- the location is CampaignEntitled if **any** row is entitling
- only **one** row should be presented as the “primary active campaign” in UI (choose the one with the earliest `endDate` or newest `startDate`, but keep the rule deterministic)

### Ownership vs Campaign vs Session (hard gate)

- Ownership (`exclusiveUntil`) controls who is allowed to operate the listing.
- Campaign entitlement controls whether Dash analytics + promotion surfaces are enabled.
- Operator session controls whether the current device is authorized for owner tools.

Dash access requires: `OwnedNow AND SessionValid AND CampaignEntitled`.

### Visibility states (backend-computed)

- `promoted` when CampaignEntitled is true
- `visible` when courtesy window (post-campaign) or hold-visibility window is active
- `hidden` when neither is active

These are presentation states only; they do not grant owner permissions.

--------------------------------------------------------------------

### campaignKey (naming contract)

`campaignKey` must be stable, deterministic, and namespace-safe. Recommended structure:

`<brandKey>/<locationID>/<campaignType>/<YYYYMMDD-start>`

Rules:
- `brandKey` is mandatory when a brand exists
- `locationID` is the canonical slug (not ULID) for human readability; backend resolves to ULID
- `campaignType` comes from the controlled vocabulary
- start date ensures uniqueness for repeats without random IDs

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
  • souvenirs/hungary
  • souvenirs/hungary/budapest
  • giftshops/hungary/budapest
  • restaurants/hungary/budapest

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
   • URLs like /souvenirs/hungary/budapest resolve into the main app shell,
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
     1. Emits /hit/qr-redeem/<ULID> to the API Worker.
     2. Includes redeem-token header for backend verification.
     3. Redirects cashier device to:
           /?lp=<slug>&redeemed=1&camp=<key>
        which triggers the cashier confirmation modal.

   Pages Worker **never** evaluates redeem validity; it simply forwards signals.

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

B) **Dataset Loading**
   • Reads profiles.json, campaigns.json, finance.json, contexts.json.
   • All campaign resolution happens from these definitions.

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

API Worker receives Stripe webhook events and performs authoritative, idempotent state transitions for:
• ownership:<ULID>
• prepaid ledger top-ups
• agent attribution records (if applicable)

Webhook processing is the only source of truth for ownership establishment and renewal.

Note:
Stripe webhook processing is not performed by Pages Worker.
Ownership and prepaid balance updates originate only from the Stripe webhook processor,
which may run outside the Worker stack. API Worker consumes the resulting state for enforcement.

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

All auxiliary endpoints are read-only and have no side effects.

--------------------------------------------------------------------
9.4 Hit Logging Endpoints

Uniform structure:

    /hit/<metric>/<ULID>

Used for:
  • click metrics (e.g. save, share, map)
  • qr-scan events when triggered from app
  • qr-redeem events from Pages Worker (via token header forwarding)
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
  4. Cashier device hits /out/qr-redeem → Pages Worker → /hit/qr-redeem  
  5. API Worker consumes token and updates stats/qrlog  
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
       arrives via promo QR redirect (/out/qr-redeem → /?lp=...&redeemed=1).  
       Immediately presented with cashier confirmation modal.

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
   2. Worker validates token  
   3. Cashier device receives redirected LPM with `redeemed=1`  
   4. Cashier submits confirmation  

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

  • Data sources (profiles.json, campaigns.json) include test-only entries.
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

There are **three categories** of search:

A) **Context-Based Search (Primary)**  
   Activated when the user navigates into a context such as:
     • souvenirs/hungary/budapest
     • restaurants/hungary
     • giftshops/hungary/budapest
     • pharmacies/hungary/budapest

   The app requests:
       /api/data/list?context=<ctx>

   The server returns only the locations mapped to that context.
   Search then only filters/sorts these results locally.

B) **Name-Based Search (Local Filter)**  
   The search bar filters the **already loaded** list of locations by:

     • locationName (localized)  
     • detailSlug (optional)  
     • transliteration-safe matching (accents removed)  

   The app does **not** request new data while typing.

C) **Category / Tag Search (Context-Aware)**  
   Categories are surfaced by contexts.json and profiles.json attributes.
   User may filter within a context by:
     • sectorKey
     • tags
     • business type

--------------------------------------------------------------------
13.3 Search Data Sources

Search uses only two data surfaces:

  • profiles.json (location metadata)  
  • contexts.json (hierarchical structure + labels)

Workers never perform dynamic text search; they only return structured subsets.

Search uses:
  • translated display names  
  • t(key) for categories  
  • locationName in the active language  

No ranking, boosting, or behavioral personalization is applied.

--------------------------------------------------------------------
13.4 Search Behavior in the App Shell

Search adopts these rules:

  • Case-insensitive  
  • Accent-insensitive  
  • Matches prefixes and contained fragments  
  • Multilingual names included (if provided in profiles.json)  
  • Fallback to English if translation missing  
  • Input does not alter URL unless context changes  

The app never loads more data than the context-scope dataset already fetched.

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
Everything originates either from profiles.json or translation bundles.

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
  • context (primary landing path, e.g. souvenirs/hungary/budapest)  
  • coordinates  
  • contact & media fields  
  • QR URL override (optional; Info QR defaults to <context>?lp=<id>)  

(B) campaign_data → campaigns.json  
  • locationID  
  • campaignKey + campaignName  
  • brandKey, context override (optional)  
  • startDate, endDate, status  
  • discountKind, campaignDiscountValue  
  • eligibilityType  
  • UTM metadata (optional)  

(C) finance_data → finance.json  
  • sectorKey + countryCode  
  • currency  
  • campFee, campFeeRate  

(D) contexts_data → contexts.json  
  Defines all valid navigational URL shells:
    /souvenirs
    /souvenirs/hungary  
    /souvenirs/hungary/budapest  
    /giftshops/hungary/budapest  
  Each context row includes visibility flag, title, languages, ordering.

90.5.2 JSON Export Pipeline

A scheduled Apps Script exports the four sheets into:
  • /data/profiles.json  
  • /data/campaigns.json  
  • /data/finance.json  
  • /data/contexts.json  

Workers always operate on these files.

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

A merchant entity in NaviGen is any legal or natural person who funds a campaign
through Stripe Checkout.

The payor is recognized as the authorized operator of that campaign and its
associated location for the duration of the ownership window.

This model avoids traditional KYC friction while preserving clear economic
responsibility.

--------------------------------------------------------------------

91.3 Onboarding Entry Points

Onboarding defines how a Location Profile Modal (LPM) is created and how
operational authority is established.

An LPM may be created through three entry paths.
All paths share the same invariant:

• No LPM is created without a paid campaign.
• Payment establishes ownership.
• Creation method does not affect authority.

--------------------------------------------------------------------

A) Owner Platform Creation (Automated)

Description:
A Location Profile Modal (LPM) is created through NaviGen’s automated
Owner Platform using structured input provided for the business.

This flow may be initiated by:
• the business owner
• an agent acting on behalf of the owner
• NaviGen personnel acting in a facilitation or outreach role

All initiators use the same platform tools and data requirements.

Required inputs (standardized):
• business name
• address
• contact details (phone, email)
• website or reference links
• social links (optional)
• images (optional, within limits)

Flow:
1) Initiator completes the Owner Platform creation form.
2) Owner completes Stripe Checkout for a campaign.
3) LPM is created automatically.
4) Ownership is established immediately.
5) Campaign activates.

Notes:
• There is exactly one LPM creation mechanism.
• Creation method does not affect ownership rules.
• Authority is established only through payment.

--------------------------------------------------------------------

C) Agent-Initiated Creation (Referral / Deal Flow)

Description:
An Agent introduces a store to NaviGen and initiates the onboarding process.

Flow:
1) Agent initiates LPM creation for a store.
2) Agent attribution is recorded.
3) Store completes Stripe Checkout for a campaign.
4) LPM is created.
5) Ownership is established for the store.
6) Campaign activates.
7) Agent becomes eligible for referral compensation.

Notes:
• Agents never gain ownership.
• Agent attribution must be captured before or at payment time.
• Leads without payment are not recognized.

--------------------------------------------------------------------
Convergence Rules (Non-Negotiable)

• Campaign payment is required for all LPM creation.
• Ownership always belongs to the store operator.
• Creation path (self, assisted, agent) does not alter authority.
• There is no free, reserved, or pending LPM state.
• All onboarding paths converge at payment-based ownership.

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
• Billing profile data is available from Stripe
• ownership record (ownership:<ULID>) is created or updated
• internal ownership mapping assigns the payor as Owner/Operator

Authority is established only by verified backend payment events.

--------------------------------------------------------------------

B) Authority Rules (Invariants)

• Payment establishes operational authority.
• Authority is time-limited and revocable.
• Authority is capability-based, not identity-based.
• Authority is enforced exclusively by backend logic.

Operational authority may be established through:
• an active campaign, or
• a paid Exclusive Operation Period

Both mechanisms are time-limited and equivalent in authority.

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

By completing a prepaid campaign payment, the payor asserts authorization to:
• operate the selected campaign opportunity
• act on behalf of the associated business location

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

Ownership may be established through either of the following prepaid paths:

1) Campaign-Based Ownership
• Starting a paid campaign establishes ownership automatically.
• Minimum campaign buy-in is defined by finance and product policy (e.g. €50).
• Campaign budget size does NOT determine ownership duration beyond the planned campaign calendar.

2) Exclusive Operation Period (Non-Campaign)
• Ownership may be acquired without running a campaign.
• Price: €5 per 30-day period.
• Grants operational authority, analytics privacy, and profile editing.
• Does NOT include promotional exposure or redeem eligibility.

Rationale:
This admits cautious operators who wish to observe and prepare before
committing to promotional spend, without weakening authority guarantees.

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
• source: "campaign" | "exclusive"    // what established/extended ownership
• lastEventId: string                 // idempotency anchor (Stripe payment_intent.id)
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
• Cookies and signed links provide access continuity, not authority.
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

• locationID (slug)     // external identifier; resolved server-side to a canonical ULID
• initiationType        // "owner" | "agent" | "platform"
• ownershipSource       // "campaign" | "exclusive"
• navigenVersion        // spec/app version for audit/debug

Rules:
• locationID (slug) is the only external identifier and MUST be resolved
  server-side to a canonical ULID via the alias system.
• Clients and Stripe metadata must never supply ULIDs directly.
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
• Selecting “Run Campaign” or “Protect This Location” initiates ownership.
• Successful payment establishes ownership immediately.

This model treats *operation* as proof of authority.

B) New LPM Creation (Owner-Initiated)

• An actor creates a new location via the Owner Platform.
• Minimal required inputs:
    - business name
    - address
    - reference link or website
    - one image (free tier)
• Ownership is not granted until payment completes.
• After payment:
    - LPM is created
    - ownership is established
    - analytics and editing become exclusive

There is no concept of “reserved” or “pending” ownership without payment.

--------------------------------------------------------------------
Exclusive Operation Period (Non-Campaign)

An Exclusive Operation Period is a paid, time-limited state that grants an
actor exclusive operational authority over a Location Profile Modal (LPM)
without requiring an active promotion campaign.

It exists to:
• prevent unauthorized edits or interference
• establish accountable control without running ads
• discourage malicious or speculative claims

An Exclusive Operation Period:
• does not imply legal ownership
• does not create an account
• does not grant permanence
• is equivalent in authority to an active campaign

Operational authority during this period is enforced identically to campaign-based ownership.

Duration & Expiry

Each Exclusive Operation Period has a fixed duration of **30 days**.

• Duration is fixed and non-configurable
• Periods are measured in full calendar days
• Expiry is enforced server-side

Exclusive Operation Periods are never permanent.

--------------------------------------------------------------------

92.3 Ownership Capabilities

Ownership grants a bounded set of exclusive capabilities for a specific LPM
while ownership is active (exclusiveUntil > now).

Capabilities are payment-derived, time-limited, and enforced server-side.
No capability exists outside an active ownership window.

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
• Campaign definitions remain constrained by campaigns.json and finance.json.
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
• sectorKey
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
• Cookies or signed links provide access continuity, not authority.
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

• No owner action can remove an LPM from public access.
• No owner action can suppress a competitor’s discoverability.
• No owner action can erase historical analytics, QR logs, or stats.
• No owner action can alter navigation contexts or ranking logic.

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
• Override record: owner-provided values stored separately from base profiles.json.
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

Cookies, signed links, or UI state must never bypass this check.

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

Profile edits MUST NOT mutate profiles.json.

Instead, the API Worker writes:

• override:<ULID>           // current effective override snapshot
• override_log:<ULID>:<ts>  // append-only audit entry

Rules:
• overrides shadow base profile fields at read time.
• base profiles.json remains immutable.
• override deletion or rollback is possible internally.

--------------------------------------------------------------------

G) Audit & Attribution

Each audit entry MUST include:
• ULID
• edited fields
• timestamp
• payment_intent.id (from ownership record)
• initiationType ("owner" | "agent" | "platform")

Audit logs are internal-only and never exposed in UI.

--------------------------------------------------------------------

H) Non-Goals (Explicit)

The Profile Edit API does NOT:
• allow partial ownership or delegation
• support draft or pending edits
• permit bulk or cross-location edits
• expose edit history to merchants
• bypass ingestion or QA pipelines

Profile editing is a controlled, owner-only capability.

--------------------------------------------------------------------

92.4 Ownership Duration, Expiry, and Reversion

Ownership is always prepaid and time-limited.

Ownership duration is determined by:
• the planned campaign calendar at creation time, or
• the sum of purchased Exclusive Operation Periods.

Ownership duration is measured in fixed 30-day periods.

--------------------------------------------------------------------
Hybrid Rule: Ownership Expiry During Active Campaign

If ownership expires while a campaign is still active:

• The campaign MAY continue serving customers.
• Promo issuance, redeem, and billing remain unaffected.
• Ownership-based capabilities are revoked immediately.

Effects of ownership expiry:
• Dash access becomes blocked for that LPM (no analytics shown).
• Profile editing is disabled.
• Campaign control (pause/resume/finish) is disabled.

Owner choice:
• The Owner may explicitly extend ownership (€5 per 30 days)
  at any time to restore privacy and control.
• No extension is automatic or implicit.

Rationale:
Campaign delivery must not be interrupted by authority expiry.
Privacy and control remain prepaid privileges.

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
• The email contains one Stripe Checkout link that renews +30 days.
• No recurring reminders are sent (no D-1, no sequences).

B) Always-visible UI countdown (only while Owned)
• Dash displays:
    “Exclusive operation active until <date>” + “Extend in #x”.
• LPM displays an emoji-style badge showing “#x” days remaining.
  The badge may be publicly visible.
• Countdown is always visible while the LPM is owned.

All effects of ownership expiry MUST be communicated clearly in advance,
including the transition of analytics from private to public visibility.

C) Campaign control area
• Displays the same expiry line and “Extend in #x” action.

All renewal actions route directly to Stripe Checkout.
No accounts or login flows are required.

--------------------------------------------------------------------

92.4.2 Dash Access Without Accounts (Signed Link → Cookie Session)

Purpose:
Enable owner-only Dash access without user accounts, using payment-derived authority.

Core principle:
• Ownership state (exclusiveUntil > now) is authoritative.
• Signed links and cookies are access mechanisms only; they do not define ownership.

--------------------------------------------------------------------
A) Policy Overview

• Access is initiated via a time-limited signed link.
• Signed link is exchanged server-side for an HttpOnly cookie scoped to owner-only surfaces.
• Dash URLs remain clean (no long-lived tokens in query strings).
• Cookie may persist while ownership is active but becomes invalid when ownership expires.
• Owner-only access is never inferred from public navigation.

--------------------------------------------------------------------
B) Entry Points & Where Owners Find Access

Primary (real-time, same device)

• Immediately after successful Stripe Checkout, the app redirects through /owner/stripe-exchange.
• The server verifies the completed Checkout Session and sets an owner session (op_sess).
• The browser is redirected back into the app and the dashboard opens without waiting for email.

Secondary (email-based recovery)

Owners receive “Owner access” via email:
• Immediately after successful payment confirmation.
• Once at D-5 before expiry (per reminder policy).

Each message contains:
• “Open Owner Dash” (signed link)
• “Extend exclusive operation” (Stripe link, when applicable)

Fallback reference:
• Stripe receipt/invoice email for the same payment (audit trail + location reference).

--------------------------------------------------------------------
C) Signed Link Token Contract (Exact)

Signed link format (conceptual):
• https://navigen.io/owner/exchange?tok=<TOKEN>&sig=<SIGNATURE>

Signature:
• HMAC-SHA256 over the token payload using a secret stored only in the API Worker.
• Signature is URL-safe base64 (or hex) encoded.

Token payload fields (logical contents; serialization is implementation-defined):
• ver: number                 // token schema version (start at 1)
• ulid: <ULID>                // canonical location identity
• iat: unixSeconds            // issued-at timestamp (server time)
• exp: unixSeconds            // expiry timestamp; exp = iat + 15 minutes
• jti: string                 // unique token id (random or ULID), required for single-use
• purpose: "owner-dash"       // fixed value; prevents token reuse for other purposes

Validity rules:
• Token is valid only if:
    - signature verifies, AND
    - now <= exp, AND
    - purpose == "owner-dash", AND
    - token has not been consumed (single-use), AND
    - ownership:<ULID>.exclusiveUntil > now

Timing rule:
• “15 minutes” is measured from iat (issue time), not from email open.

Single-use enforcement (KV key):
• ownerlink_used:<jti> = { ulid, usedAt }
Rules:
• On successful exchange, API Worker MUST write ownerlink_used:<jti>.
• If ownerlink_used:<jti> already exists, exchange MUST be denied.

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
• On successful signed-link exchange, API Worker creates opsess:<sessionId>.
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

1) Owner clicks “Open Owner Dash” from the email.
2) Link opens the exchange endpoint (/owner/exchange).
3) API Worker validates signature + expiry + single-use + ownership active.
4) API Worker creates opsess:<sessionId> and sets cookie op_sess=<sessionId>.
5) API Worker redirects to /dash/<location> with a clean URL (no token visible).
6) Owner uses Dash normally while ownership is active.

--------------------------------------------------------------------
G) Owner Access Recovery (Guided, No Resend)

NaviGen does not provide a “resend owner access link” endpoint.

Instead, recovery is handled through guided instructions using existing,
authoritative Stripe emails.

Supported recovery cases:
• Signed link expired before use.
• Signed link already consumed on another device.
• Owner wants to open Dash on a different device later.

Recovery guidance shown to the user:
• “Use the most recent Owner access email sent after payment.”
• “You can also find your Stripe receipt or invoice email and open the
   ‘Open Owner Dash’ link from there.”

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

### Phase 1 — Active campaign  
*(€50 / 30 days)*

**System behavior**
- LPM discoverable: **true**
- Ranking: **boosted**
- Campaigns: **enabled**
- Analytics: **enabled**
- Exclusive operation: **enforced**

**Owner message**
> “Your business is actively promoted.”

**Public**
- Sees the business everywhere it should appear

--------------------------------------------------------------------

### Phase 2 — Courtesy visibility  
*(free, Y × 30 days; Y = 2)*

**System behavior**
- LPM discoverable: **true**
- Ranking: **reduced (natural fall)**
- Campaigns: **disabled**
- Analytics: **disabled**
- Exclusive operation: **off** (no one else promoted yet)

**Owner message**
> “Your campaign ended, but we’re keeping your business visible so customers can still find you.”

**Public**
- Still finds the business
- It is less prominent

This is the “nice guy” phase.

--------------------------------------------------------------------

### Phase 3 — Held visibility  
*(€5 / 30 days, optional)*

This is **not protection**.  
This is **holding a place**.

**System behavior**
- LPM discoverable: **true**
- Ranking: **stabilized** (no further decay)
- Campaigns: **disabled**
- Analytics: **disabled**

**Owner message**
> “If you’d like to keep your place visible while you decide what’s next, you can hold it for a little longer.”

**Public**
- Business still appears
- Not promoted
- Not highlighted

**Important**
- If the owner does nothing, the system proceeds to Phase 4 automatically.

--------------------------------------------------------------------

### Phase 4 — Not discoverable  
*(after long inactivity, e.g. 6–12 months)*

This is the decisive state.

> “We simply set the LPM to not discoverable.”

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
> Start a campaign anytime to become visible again.”

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


END OF SPEC

--------------------------------------------------------------------

📘 NaviGen — Developer Reference (Engineering Summary)


1. Core Architecture (What NaviGen is)

NaviGen is a location-centric, QR-driven promotion and analytics platform, implemented as:

App Shell (PWA) — the client UI (LPM, MSM, Promo flow, donation, etc.)

Dashboard (Dash) — merchant/internal analytics

Pages Worker — routing, QR redirect, app hosting

API Worker — all business logic: token issuance, redeem, stats, QA

Dataset Layer — profiles.json, campaigns.json, finance.json, contexts.json

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

When ownership ends, the location simply becomes public again.

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
      locationID (slug)
      campaignKey
      initiationType: "owner" | "agent" | "platform"
      ownershipSource: "campaign" | "exclusive"
      navigenVersion

  locationID (slug) is resolved server-side to a canonical ULID via the alias system.
  ULIDs must never be supplied by clients or Stripe metadata.

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
• Stripe-provided email may be used to send Owner access emails but MUST NOT be stored in NaviGen KV/logs/datasets.

  Steps:
    1. Validate required metadata (locationID, initiationType, ownershipSource)
    2. Resolve canonical ULID from locationID via the alias system
    3. Resolve ownership record for the canonical ULID
    4. Extend ownership window based on ownershipSource
    5. Write billing ledger TopUp entry
    6. Activate campaign if applicable
    7. Write agent attribution record if agentId present

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

When ownership is active (exclusiveUntil > now) but the requester lacks:
• a valid owner cookie, and
• a valid signed-link exchange,

the system MUST present a dedicated access-required interstitial.

Primary message:
• “Owner access required.”

Secondary message:
• “This location is currently under exclusive operation.”
• “To open the Owner Dash, use your most recent Owner access email.”

Primary action:
• “Find your Owner access email”

Secondary guidance text:
• “Search your inbox for your Stripe receipt or NaviGen payment email.”
• “The Owner Dash link is included in that message.”

Rules:
• The interstitial must not reveal owner-only data.
• The interstitial must not infer or grant ownership.
• No resend mechanism exists; recovery is guided via the most recent Owner access email / Stripe receipt.
• No login, account creation, or identity prompt is permitted.

--------------------------------------------------------------------

Access-Blocked (Unowned LPM — LPM Entry)

When a user attempts to open Dash for an unowned LPM via the LPM 📈 entry,
the system MUST NOT render analytics or an analytics interstitial.

Instead, the App MUST open the “Owner settings” modal (Section 6.2.8),
providing contextual actions:
• Run campaign
• (Deferred) Keep visible
• See example dashboards (Example Locations only)

--------------------------------------------------------------------

Title:
Analytics access required

--------------------------------------------------------------------

Body:
Analytics for this location are available to its active operator.

To view real analytics, activate ownership by running a campaign
or starting an exclusive operation period.

--------------------------------------------------------------------

Primary action:
Activate analytics for this location

Behavior:
• Routes to Owner Platform onboarding for the requested LPM.
• Initiates either campaign setup or Exclusive Operation Period purchase.

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
| Signed link → cookie exchange                    | —                         | not present in these code files                                                                                   | HttpOnly cookie                                                | API Worker             | ❌ not implemented yet (spec-only)                                                      |
| Profile edit API `/api/profile/update`           | —                         | not present in these code files                                                                                   | `override:*`, `override_log:*`                                 | API Worker             | ❌ not implemented yet (spec-only)                                                      |
| Agent attribution KV + cap tracking              | —                         | not present in these code files                                                                                   | `agent_attribution:*`                                          | API Worker             | ❌ not implemented yet (spec-only)                                                      |
