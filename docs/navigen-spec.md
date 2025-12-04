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

END OF SPEC