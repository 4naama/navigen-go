NaviGen Platform – Complete Specification
(App, Workers, Dash, QR System, Campaigns, Billing, MSM/LPM, Translations, CSS, UX Patterns)

1. CORE SYSTEM OVERVIEW

NaviGen consists of:

1.1 Pages Application (Frontend)

LPM (Location Profile Modal)

MSM (My Stuff Modal)

Dash (Analytics UI)

Promotions Modal & QR Modal

Business Card Modal

Navigation Modal

Embedded QR generation (client-side)

Language translation engine (t(key))

1.2 Backend (navigen-api Worker)

/hit/<event>/<id>: all event logging

/api/stats: aggregated Click Info, QR Info, Campaigns

/api/qr: Info QR generator

/api/promo-qr: Promotion QR generator

Billing ledger writing

Campaign loading (campaigns.json)

Finance loading (finance.json)

QR-log (qrlog) storage

Alias resolution (KV_ALIASES)

Visitor hashing

Campaign matching logic

Token creation and consumption for redeem

1.3 Pages Worker (Routing)

/out/qr-scan/:slug → logs scan & redirects

/out/qr-redeem/:slug → logs redeem & redirects to LPM

Serves frontend assets / HTML shell

Must forward UA/Lang for redeems

1.4 Data Sources (from GSheets)

profiles.json

campaigns.json

finance.json

contexts.json

entity.json (future)

translation .json per language

1.5 NaviGen File Ecosystem

frontend:

/scripts/modal-injector.js

/scripts/app.js

/styles/navi-style.css

/dash/dash.js

backend:

/backend/worker/src/index.ts

2. QR SYSTEM
2.1 Info QR

Purpose: General discovery, sharing, physical stickers, posters.

Format:

https://navigen.io/<context>?lp=<locationID>


Logged as:
/hit/qr-scan/<locationID> → signal="scan"

Signals:

scan

2.2 Promotion QR (Campaign Redemption)

Generated via:
GET /api/promo-qr?locationID=<slug>

Returns:

{
  "qrUrl": "https://navigen.io/out/qr-redeem/<slug>?camp=<key>&rt=<token>",
  "campaignName": "...",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "eligibilityType": "...",
  "discountKind": "...",
  "discountValue": <number>
}


Used inside Promotion Modal → “Redeem Coupon” QR modal.

Logged as:
/hit/qr-redeem/<ULID> + token
→ signal="redeem" or signal="invalid"

Signals:

scan

redeem

invalid

Security:

Redeem tokens stored as redeem:<token> in KV

consumeRedeemToken() ensures one-time use

Campaign validity checked via date range

2.3 QR-log Schema

Stored in KV as:

qrlog:<ULID>:<YYYY-MM-DD>:<scanId>


Entry shape:

{
  "time": "ISO",
  "locationID": "<ULID>",
  "day": "YYYY-MM-DD",
  "ua": "...",
  "lang": "...",
  "country": "HU",
  "city": "Budapest",
  "source": "qr-scan | qr-redeem | qr-print",
  "signal": "scan | redeem | invalid",
  "visitor": "v-xxxxxx",
  "campaignKey": "2001"
}

3. PROMOTION UX FLOWS
3.1 LPM Footer “🏷 Promotion”

When tapped:

Step 1 → Promotion Modal

Header:
Promotion

Content fields:

promotion.offer-line →
{{discount}} at {{locationName}}
Example: “10% off your purchase at World of Souvenir Deák”

promotion.period-label →
“The offer runs:”

promotion.period-range →
YYYY-MM-DD → YYYY-MM-DD

promotion.period-expires →
“Expires in {{days}}”

promotion.eligibility-label →
“Eligibility: Everyone”

promotion.code-note →
“Each code is valid for one purchase.”

promotion.show-qr →
“Show this QR code to the cashier when paying.”

campaign.redeem-terms →
“By redeeming, I agree to the offer terms.”

Button:
🔳 Redeem Coupon
(campaign.redeem-button)

Step 2 → Promotion QR Modal

Header:
Promotion QR Code
(qr.role.campaign-redeem-label)

Appearance:

same modal shell as Business Card (modal-top-bar, sticky header)

QR image only, centered, 80% width

No footer, no extra buttons

Footer text (not displayed, but used for accessibility):

qr.role.campaign-redeem-desc

qr.role.campaign-redeem-warning

3.2 Promotion QR Scan Landing

When scanning Promo QR on cashier device:

Pages Worker /out/qr-redeem/<slug>

Logs event → /hit/qr-redeem/<ULID>

Redirects user to:

https://navigen.io/?lp=<slug>


(LPM opens automatically)

Future versions may open Promotion modal automatically.

4. DASHBOARD (Dash)
4.1 Click Info

Shows CTA interactions (events from /api/track):

lpm-open

call, email, whatsapp, telegram, messenger

official, booking, newsletter

facebook…youtube

share, save, map

qr-view, qr-print

qr-scan (count from /api/track)

rating-sum

rating-average

Note: qr-redeem is not shown in Click Info.

4.2 QR Info

Shows individual scan/redeem events from qrlog.

Columns:

Time

Source (qr-scan, qr-redeem)

Location (CF)

Device (UA-bucket)

Browser

Language

Scan ID

Visitor (v-xxxxxx)

Campaign

Signal (scan, redeem, invalid)

4.3 Campaigns

Aggregation per campaign from qrlog.

Fields:

Campaign ID

Campaign Name

Target (context)

Brand

Campaign period

Scans

Redemptions

Efficiency % (= redemptions/scans)

Invalid attempts

Unique visitors

Repeat %

New redeemers

Repeat redeemers

Locations (distinct countries)

Devices/Languages/Signals columns are removed from UI.

✏️ UPDATED LINE — Scan compliance column removed from UI
The “Scan compliance %” field previously visible in Campaigns is removed from the dashboard table.
It exists only as an internal value consumed by the Analytics QA Block and must not appear in merchant views.

4.4 Analytics View (Written Report Mode)
The Analytics view is a fourth dashboard mode in addition to Click Info, QR Info, and Campaigns.
It provides a narrative, human-readable business report constructed entirely on the client side from the same /api/stats payload.

Components of the Analytics Report

Header Block

Displays the selected date range

Shows location or entity name

Uses translation engine (t(key))

Prefixed with NaviGen Business Report header and timestamp

Click Analytics Summary

Aggregated description of core interaction categories

No ratios or compliance metrics

QR Analytics Summary

Narrative summary derived from QR Info data

Highlights meaningful patterns such as increases in scans or redeems

Does not include compliance or operational diagnostics

Campaigns Summary (Merchant-Safe)
(Replaces the older behavior with compliance in the merchant-facing narrative.)

✏️ UPDATED LINE — Removed mention of scan-compliance from merchant narrative

Only neutral counts are presented:

Promo QR shown (armed)

Redemptions

Invalid attempts

No ratios (e.g., compliance %, invalid %)

No anomaly language

Per-campaign mini-table and stacked bars remain as descriptive (redeemed/armed)

4.5 Quality Assurance Analysis (QA Block)
A dedicated diagnostic block only in Analytics mode, positioned after the Campaigns Summary.
This block is not shown in Click Info, QR Info, or Campaigns views.

Purpose

The QA block interprets operational quality, not merchant performance.
It evaluates internal process discipline using ratios that must not appear in merchant-facing sections.

Inputs

Computed globally across the chosen date window:

totalArmed (promo QR shown events)

totalRedeems

totalInvalid

totalAttempts = totalRedeems + totalInvalid

compliance = totalRedeems / totalArmed (when totalArmed > 0)

invalidRatio = totalInvalid / totalAttempts

Diagnostics & Required Behaviors

Neutral QA Message

When compliance ≥ ~70%

And invalidRatio not elevated

Example:
“QA: Promo scanning appears within a normal range.”

Low Scan Discipline Warning (⚠)
Trigger conditions:

compliance < 0.7

Armed > 0
Content:

Operational guidance

No merchant-blaming

Includes approximate % value

Invalid Attempt Warning (⚠)
Trigger conditions:

invalidRatio > 0.1

AND totalInvalid ≥ 3
Meaning:

Indicates expired/used/out-of-window QR usage patterns

>100% Compliance Interpretation (⚠)
Trigger conditions:

compliance > 1.05
Meaning:

Time-window misalignment (QR armed earlier than current reporting window)

Never interpreted as “excellent performance”

No Activity Case
If no promo activity recorded:
“QA: No promotion QR activity recorded; scan discipline cannot be evaluated.”

Placement

Always the last analytical block before the footer

Never shown in tables or TSV exports

Included when copying the Analytics report via ⧉

4.6 Export Behavior (⧉ Copy Button)
The dashboard includes a unified copy/export button used across all views.

Required Behaviors

Click Info / QR Info / Campaigns

⧉ copies the visible table as TSV

Column order matches the rendered DOM

Analytics View

⧉ copies the full written Analytics report as plain text

Includes:

Header

Click Summary

QR Summary

Campaigns Summary

Quality Assurance Analysis

Footer

Does not copy hidden DOM elements or styling

Parity Requirement
All four views (Click Info, QR Info, Campaigns, Analytics) must be equally exportable.

5. BILLING SYSTEM
5.1 Billing Ledger Record

Generated only on valid redeem:

Stored under:

billing:YYYY-MM:<ULID>:<rid>


Record:

{
  "locationID": "<ULID>",
  "campaignKey": "2001",
  "sectorKey": "souvenir-shop",
  "countryCode": "HU",
  "currency": "EUR",
  "timestamp": "ISO",
  "campFee": 1.0,
  "campFeeRate": 0.04
}


Source of fees:

finance.json

matched by (sectorKey, countryCode)

No user identity stored besides visitor (anonymous).

5.2 Billing View (Future, gated)

In My Account:

Period list:

“December 1–31, 2025”

“January 1–31, 2026”

Each opens billing summary:

campaigns

redeems

total fee

export invoice (later)

6. MY STUFF MODAL (MSM)
6.1 Cards

🧩 Community Zone

💳 Purchases

📍 Location history

🌐 Language

🔗 Social links

🔄 Reset app

📄 Data & Privacy

📘 Terms

📴 No-miss

👤 My Account (visible to all, contents gated)

6.2 My Account (current)

Shows:

For business owners:
Manage campaigns and billing once your account is verified.


No active features yet; no queries triggered.

6.3 Future Merchant Gating

After entity verification:

Billing

Campaign creation

Editing location details

Statistical deep views

Uses entity_data sheet fields:

entityID
brand
locationID
locationName
legalName
companyRegistrationNo
companyVatNo
adminPerson
adminPhone
adminEmail
billingCompany
billingTaxId
address
postalCode
city
adminArea
countryCode
first_seen_utc
last_verified_utc
status

7. TRANSLATION KEYS (Promotion + Redeem)
7.1 Promotion Modal
promotion.title
promotion.offer-line
promotion.period-label
promotion.period-range
promotion.period-expires
promotion.eligibility-label
promotion.code-note
promotion.show-qr
campaign.redeem-terms
campaign.redeem-button

7.2 Promotion QR Modal
qr.role.campaign-redeem-label
qr.role.campaign-redeem-desc
qr.role.campaign-redeem-warning

Supported languages

hu, it, he, uk, nl, ro, pl, cs, es
Translations are placed in GSheets and exported to .json files.

8. JSON DATA SPEC
8.1 profiles.json

Source: location_data sheet, exported via Apps Script.

Contains for each location:

locationID

locationName (multilingual)

Visible

Priority

groupKey / subgroupKey

context

detailSlug

coordinates

contact info

QR URL

images

network/contact flags

8.2 campaigns.json

Source: campaign_data sheet → converted to array.

Each entry:

locationID
locationName
sectorKey
campaignKey
campaignName
brandKey
context
campaignType
targetChannels
startDate
endDate
status
offerType
discountKind
campaignDiscountValue
eligibilityType
eligibilityNotes
utmSource
utmMedium
utmCampaign
notes

8.3 finance.json

Source: finance_data sheet.

Fields:

sectorKey
countryCode
currency
minPrice
maxPrice
estMinSpend
estMedianSpend
estMaxSpend
campFee
campFeeRate

9. WORKERS
9.1 navigen-api Worker
Routes:

/hit/<event>/<id>

accepts: lpm-open, share, rating, qr-scan, qr-redeem, etc.

writes stats + qrlog + billing

/api/stats

/api/qr

/api/promo-qr

/api/data/<file>

admin endpoints (seed-alias-ulids, etc.)

Key functions:

resolveUid

logQrScan

logQrRedeem

logQrRedeemInvalid

loadCampaigns

pickCampaignForScan

createRedeemToken

consumeRedeemToken

loadFinance

writeBillingRecord

KV usage:

KV_STATS: stats, qrlog, redeem tokens, billing

KV_ALIASES: slug → ULID

9.2 Pages Worker
Routes:

/out/qr-scan/:slug

logs scan → /hit/qr-scan/<ULID>

redirect to landing

/out/qr-redeem/:slug

logs redeem → /hit/qr-redeem/<ULID>

redirect to /?lp=<slug>

Also:

forwards UA / Lang as X-NG-UA / X-NG-Lang

serves static assets

renders app shell

10. VISITOR MODEL
Visitor ID:

v-xxxxxxx

Derived from:

hash(User-Agent + countryCode)


Used for:

unique visitor sets

repeat visitor sets

unique redeemers / repeat redeemers

No personally identifiable data stored.

11. TEST MODE & SCENARIOS
Info QR test
POST /hit/qr-scan/<slug>

Promo QR test
GET /api/promo-qr?locationID=<slug>

Redeem test

Scan returned qrUrl on another device:

out/qr-redeem/<slug>?camp=2001&rt=XXXX

Dash checks

Click Info → QR scan increments

QR Info → scan / redeem rows

Campaigns → Scans, Redemptions, Efficiency, Unique/Repeat, Invalids

12. POPULAR COMPONENTS & UX PATTERNS
12.1 Sticky Modals

All modals use:

<div class="modal">
  <div class="modal-content modal-layout">
    <div class="modal-top-bar">...</div>
    <div class="modal-body">...</div>
  </div>
</div>


Defined in navi-style.css:

.modal-top-bar → sticky header

.modal-body → scrollable body

.modal-layout → consistent spacing

.modal-body-button → blue CTA buttons

.qr-wrapper → center QR

.qr-image → respects max-width for mobile friendliness

12.2 Accordion Behavior

Used in MSM, Terms, Data & Privacy:

.accordion-header toggles

.accordion-content collapses/expands

no JS rewriting needed: CSS uses max-height transitions

consistent with navi-style.css styles

12.3 Dash table scroller

Dash uses:

<div id="dash-table-scroller">
  <table class="stats-table">...</table>
</div>


with horizontal scroll enabled on mobile.

13. SEARCH CAPABILITIES (UPDATED)
13.1 Current Search – Location-First Navigation

The main shell includes a universal search bar:

🔍 “Type Destination…”

The search engine supports:

Location name search (stages, venues, facilities, shops, services)

Tag/keyword search (e.g., “toilet”, “first aid”, “vegan”, “merch”)

Context-aware ranking: top results prioritize the user’s current area and frequently accessed locations

Instant LPM open upon selection

Search is optimized for:

Fast fuzzy matching

Multi-language input

Festival-scale result sets (hundreds of dynamic places)

13.2 AI-Augmented Search (in progress)
A) Main-Shell AI Assistant (🤖 bottom band)

The AI assistant will enhance search with contextual reasoning:

Understands broad festival questions:
“Hol találok most jó ételt?”, “Mi van hozzám legközelebb?”, “Hol a következő koncert?”

Provides information about the current festival context (e.g., today’s program, important updates)

Allows dynamic context switching (e.g., food-only, music-only, emergency-only modes)

Combines search + natural language + navigation into a single interface

The assistant acts as a 0–24 walkie-talkie, answering instantly without menus.

B) LPM-Level AI Search & Knowledge

Each Location Profile Modal (LPM) receives its own AI layer:

AI can answer:

Questions about that specific location

“Mi lesz itt a következő program?”, “Mikor kezdődik a következő fellépő?”

Describe the history / role / type of that stage or service

Explain ongoing promotions, how to redeem, expiry, availability

Suggest nearby related locations based on tags (food, drink, emergency, transport, attractions)

The assistant speaks the user’s chosen language automatically.

13.3 MSM – Search-Related User Tools

The “My Stuff” area (MSM) supports several features linked to search relevance:

🌐 Language Settings

Full multilingual UI

Search results are ranked and displayed according to the user’s chosen language

💳 Purchase History

Future integration: searchable/filterable record of purchases, tickets, services

📄 Data & Privacy Center

Manages search data retention preferences

Clear display of what data impacts personalized search

📍 My Location History

Search-adaptive: frequently visited or scanned locations surface higher

Helps AI ranking

🧩 Community Zone

Topics the user cares about influence search prioritization
(music genres, food preferences, accessibility needs, etc.)

13.4 Bottom-Band Tools That Extend Search

The bottom band and overflow menu contribute additional search domains:

☎️ Emergency Call / Help Modal

Always-available quick action

Anchors search in safety-related contexts

AI uses it to prioritize emergency responses when needed

📅 Context-Specific Agenda / Timetable

Allows looking up daily schedules

Search understands queries like:
“Mikor kezdődik a következő élményprogram?”
“Hol játszik ma ez az előadó?”

ℹ️ My Contact Card (QR-Based)

Allows quick self-identification or sharing

AI can refer to the user’s general profile (never personal data) to personalize search suggestions

📣 List of Alerts

Search results deprioritize closed / unavailable locations

AI can explain active alerts (e.g., weather, crowded area alerts)

📈 My Stats

Not a search function itself, but informs ranking

Frequently interacted locations are boosted in the result list

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

END 90.x EXTENSION ARCHITECTURE

END OF SPEC
