# NaviGen — Payment Plan & Commercial Model

## Core positioning

**NaviGen is an ad platform for time-limited active presence inside NaviGen.  
During your active Plan window, you are the exclusive operator of your listing.**

NaviGen is not “hosting a page”.  
It is **keeping a business present in people’s awareness**, with optional promotion mechanics when the owner chooses to run them.

--------------------------------------------------------------------

## How visibility feels (human mental model)

| Phase    | What NaviGen is doing    | What the owner feels                 |
| -------- | ------------------------ | ------------------------------------ |
| Promote  | Actively prioritizing me | “I’m actively present”               |
| Remember | Keeping me present       | “People can still find me”           |
| Inactive | Stopping discovery       | “I need a new Plan to return”        |

These phases describe **attention**, not ownership.

--------------------------------------------------------------------

## Who pays
Only **business owners / operators**.

End users (visitors) never pay.

--------------------------------------------------------------------

## What can exist without payment
- Google import before payment may perform full Places API New hydration within import policy limits; this creates only a private draft and does not grant publish, visibility, ownership, analytics, Dash access, or campaign rights.
- That draft is not a published LPM and is not a public “parking” state.
- Unpaid Google import is limited by import policy:
  • 3 unique full Google imports per device before checkout / first publish trigger
  • 10 unique full hydrations per IP per rolling 24h
  • same place_id retry does not count again
  • same-device same place_id reopens / updates the same private draft
- After quota, NaviGen prompts checkout / plan activation and preserves existing drafts.
- Plan activation arms publication and, where applicable, network continuation.
- NaviGen does **not** grant unpaid visibility or unpaid discoverability merely because a BO entered data.
- First publication requires an active paid Plan.
- An already published LPM may later remain addressable as an expired record, but its visibility is restored only through a new paid Plan window.

--------------------------------------------------------------------

## Google import and outlet drafts before payment

Google import and outlet spin-off may create private BO drafts before payment.

These drafts:
- are not published LPMs
- are not publicly discoverable
- do not create ownership authority
- do not open Dash access
- do not create campaign entitlement
- do not reserve plan capacity until checkout / plan activation

Import from Google:
- uses embedded Google business lookup
- receives place_id internally
- may run full Places API New hydration within import policy limits
- opens Create Location for BO review/edit

Create an outlet:
- uses an existing source profile or embedded Google lookup
- creates a separate outlet draft
- requires separate outlet physical details
- requires confirmation that outlet is physically separate from the source business

Checkout / plan activation is the commercial step that arms publish and continuation.

--------------------------------------------------------------------

## Primary product: Paid Plan (campaign-capable)

A paid Plan purchase is the only commercial token that authorizes:

• first publication of a BO-created location  
• restoration of visibility for an already published but expired location  
• optional campaign setup within the same paid window

For most BOs, the same paid window will be used together with a campaign.
However, NaviGen also allows a BO to publish / remain visible without a promotion
offer by choosing **Visibility only**.

The selected tier (Standard / Multi / Large / Network) determines:

• publish capacity (maximum number of locations that may be published under this Plan)  
• campaign capability (if the owner chooses to use it)

This does NOT introduce a second pricing dimension.

Campaign behavior remains location-scoped:

• Campaigns are announced via selected locations (LPMs).
• Scope is explicitly chosen by the business:
    – Single location  
    – Selected locations  
    – All published locations (if desired)  
• Multiple campaigns per location are allowed.
• Campaign lifecycle and redeem logic remain unchanged.
• Redeem validation is token-based and not geographically restricted.

The tier defines how many locations may be covered under the same Plan.
It does not automatically propagate campaigns across locations.

### Paid Plans (launch schedule, gross amounts)

| Tier     | Gross price | Included locations |
|----------|-------------|--------------------|
| Standard | €79         | 1 location         |
| Multi    | €179        | up to 3 locations  |
| Large    | €349        | up to 10 locations |
| Network  | €749        | 10+ locations      |

Network is presented to owners as **10+ locations**.
Backend enforcement remains a fixed numeric capacity mapped from the Plan record.

One paid Plan purchase buys:
- the right to publish or restore visibility for covered locations
- 30 days of active paid presence
- followed automatically by 60 days of courtesy visibility

| Aspect          | Details                                                               |
|-----------------|-----------------------------------------------------------------------|
| Active duration | 30 days                                                               |
| Payment timing  | Upfront                                                               |
| Discoverability | High (search, lists, browse) — preferential visibility inside NaviGen |
| Analytics       | Enabled during the active 30-day window                               |
| Dash access     | Enabled during the active 30-day window                               |
| Operation       | **Exclusive** during the active 30-day window                         |
| UI status       | “Active campaign”                                                     |

**Owner mental model**
> “I buy a Plan and get 30 days of active presence, then 60 more days of courtesy visibility.”

Campaign execution preset (owner choice, no pricing difference):

- **Visibility only**
- **Promotion**

Preset rules:
- Both presets use the same tier, same price, same ownership rights, and the same 30-day active + 60-day courtesy timeline.
- **Visibility only** disables Promo QR / cashier / redeem setup in Campaign Management.
- **Promotion** enables the full Promo QR / redeem path.
- The campaign offer is optional within an active campaign.

This is the **main and mandatory** monetization path.

**Why campaigns are not automatic**
Ownership expresses **control** (exclusive operation + privacy). Campaigns express **intent** (marketing action).  
Payment unlocks the ability to run campaigns; the owner explicitly starts/renews campaigns to avoid “campaigns appear out of the blue.”

Campaign execution is performed via the Campaign Management interface.

“Run campaign” may refer to:
• Campaign funding (claim / unowned flows), or
• Campaign Management (owned locations with valid operator session).

Campaign Management allows Owners to:
• prepare and edit drafts,
• initiate checkout,
• activate, pause, or finish campaigns,
• choose **Visibility only** or **Promotion** for the active Plan window.

Payment is a step within Campaign Management, not a standalone product.

--------------------------------------------------------------------

## After the active Plan window ends (no payment yet)

### Courtesy visibility (free)

| Aspect          | Details                                                                  |
|-----------------|--------------------------------------------------------------------------|
| Duration        | 60 days (Y = 2)                                                          |
| Cost            | Free                                                                     |
| Discoverability | Yes (still discoverable, but without preferential ordering)              |
| Promotion       | Preferential visibility: Disabled (no ordering advantage inside NaviGen) |
| Analytics       | Collected (internal) / Disabled (owner-facing)                           |
| Dash access     | Disabled (no owner access outside active campaign)                       |
| Operation       | Not exclusive                                                            |
| UI status       | “Still visible”                                                          |

**Owner mental model**
> “My active Plan ended, but NaviGen is not dropping me immediately.”

Purpose:
- Avoid sudden disappearance
- Preserve goodwill
- Reduce hostile churn

--------------------------------------------------------------------

## No paid hold phase

NaviGen does not sell a separate Hold Visibility or €5 visibility-extension product.

If the owner wants to continue after the active 30-day Plan window and the automatic 60-day courtesy window, the next step is to buy a new Plan.

There is no cheaper intermediate paid state between Courtesy visibility and Inactive.

--------------------------------------------------------------------

## Restore visibility for an expired published location

- An expired published LPM is not re-published for free.
- The only way to restore discoverability is to start a new paid Plan window through the owner commercial flow surfaced as **Run campaign** / **Renew visibility**.
- Within that new paid window, the owner may choose **Visibility only** or **Promotion**.
- Restore Access alone never restores visibility; it only restores the owner session when an active paid window already exists.

--------------------------------------------------------------------

## Long-term inactivity

### Inactive / Not discoverable

| Aspect                     | Details                                                                 |
|----------------------------|-------------------------------------------------------------------------|
| When                       | After the 30-day active window and 60-day courtesy visibility end       |
| Discoverability            | No                                                                      |
| Appears in search/lists    | No (NaviGen public discovery surfaces; not promoted for search engines) |
| Appears in owner selection | Yes (Select your business / claim flows)                                |
| Direct link                | May still open                                                          |
| Analytics                  | Collected (internal) / Disabled (owner-facing)                          |
| Dash access                | No                                                                      |
| UI status                  | “Inactive”                                                              |

**Owner mental model**
> “My business is paused on NaviGen. I can restart anytime.”

This solves:
- Orphaned listings
- Infrastructure cost leakage
- Discovery clutter

No deletion is required.

--------------------------------------------------------------------

## Restore access (not a product)

| Aspect        | Details                                                                                      |
|---------------|----------------------------------------------------------------------------------------------|
| Cost          | Free                                                                                         |
| Purpose       | Session recovery                                                                             |
| When          | Ownership exists but session is missing                                                      |
| How           | Via Payment ID (pi_...) from Stripe receipt, invoice, or payment confirmation email          |
| What it gives | Restores owner access on this device (Dash + owner tools during the active campaign window)  |

Restore is a **support / recovery path**, never a paid product (state-of-the-art convenience for no-sign-in operation).

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

Campaign Entitlement is computed exclusively from KV-backed campaign records,
not directly from payment events.

Notes:

• “Restore access” recovers a missing or mismatched Operator Session only.
  It does NOT create ownership and does NOT activate campaigns.

• Campaign renewal or activation is required when ownership exists
  but CampaignEntitled is false (campaign inactive, ended, paused, or suspended).

• Dash MUST NOT open unless ALL of the following are true:
    – OwnedNow
    – SessionValid (op_sess bound to this ULID)
    – CampaignEntitled

--------------------------------------------------------------------

### Campaign → Payment → Entitlement (Authoritative Flow)

The Campaign lifecycle is governed by three distinct but connected layers:

1. Campaign Definition (KV-backed)
2. Payment Events (Stripe)
3. Campaign Entitlement (Derived)

These layers MUST NOT be conflated.

--------------------------------------------------------------------

#### 1) Campaign Definition (Authoritative)

Campaigns are defined and stored in KV as campaign rows:

campaigns:byUlid:<ULID> → CampaignRow[]


A CampaignRow defines:
• campaign identity (campaignKey, campaignName)
• active window (startDate, endDate)
• status (Active, Paused, Finished, Suspended)
• campaign metadata (discounts, eligibility, etc.)

Campaign definitions are authoritative and immutable
except for explicit owner-initiated status transitions.

--------------------------------------------------------------------

#### 2) Payment (Enabling Event, Not Authority)

Payments are processed via Stripe and serve as
**enabling events**, not as entitlement authorities.

Payment effects:
• unlock the ability to promote or extend a campaign
• create or update campaign rows in KV
• never directly grant Dash access

A successful payment:
• DOES NOT itself imply campaign entitlement
• DOES NOT override campaign dates or status
• DOES NOT bypass ownership or session rules

Payment metadata is recorded for audit and billing only.

--------------------------------------------------------------------

#### 3) Campaign Entitlement (Derived, Authoritative)

Campaign Entitlement is computed exclusively by the API Worker
from KV-backed campaign records.

A location is CampaignEntitled when:
• at least one CampaignRow is Active
• statusOverride does not disable it
• today ∈ [startDate, endDate]

Derived entitlement fields:
• campaignEntitled
• activeCampaignKey
• campaignEndsAt

These fields are exposed via:

GET /api/status


Clients MUST treat these fields as authoritative.

--------------------------------------------------------------------

#### End-to-End Control Flow (Summary)

Campaign creation / edit
        ↓
Owner initiates payment (Stripe)
        ↓
API Worker writes / updates CampaignRow in KV
        ↓
API Worker recomputes Campaign Entitlement
        ↓
/api/status reflects entitlement
        ↓
Dash, Promotions, QR, and UI surfaces respond accordingly

At no point does payment directly grant access.
All access decisions are derived from KV-backed campaign state.

--------------------------------------------------------------------

## State & Transition Spine (authoritative)

This section defines the **backend state machine** that governs:
- visibility inside NaviGen (attention),
- ownership (exclusive operation),
- campaign entitlement (analytics + promotion),
- operator session (device access / restore).

### Canonical conditions (computed server-side)

- **OwnedNow**: ownership exists and `exclusiveUntil > now`.
- **SessionValid**: an `op_sess` cookie is present and resolves to a non-expired owner session for the same `locationID`.
- **CampaignEntitled**: there is at least one campaign row for the location where:
  - status is `Active` (and not overridden to a disabling state),
  - and today is within the campaign’s active window (`startDate..endDate`).

### Primary derived outcomes

- **Dash access** requires: `OwnedNow AND SessionValid AND CampaignEntitled`.
- **Promotion (“Active campaign” in the UI)** is true when `CampaignEntitled` is true.
- **Courtesy visibility (“Still visible”)** applies after the active campaign window ends for a limited window, without Dash access.
- **Visibility only** is an owner-selected campaign preset that keeps full paid rights while disabling Promo QR / redeem flows in Campaign Management.

### Phases (operational meaning)

| Phase    | Condition summary       | Discoverability | Promotion | Dash                  | Notes                                      |
|----------|-------------------------|-----------------|-----------|-----------------------|--------------------------------------------|
| Promote  | CampaignEntitled = true | High            | Optional  | Yes (if SessionValid) | Primary paid state (active 30-day window)  |
| Remember | Courtesy window active  | Yes             | No        | No                    | Free goodwill period (60 days)             |
| Inactive | No courtesy             | No              | No        | No                    | Hidden from discovery surfaces             |

### Transitions (what causes state changes)

- **Paid Plan purchase** → sets ownership and creates or activates campaign entitlement for the purchased active window.
- **Campaign window ends** → CampaignEntitled becomes false; Courtesy window begins automatically.
- **Courtesy window ends** → location becomes Inactive for public discovery surfaces.
- **Restore access (pi_...)** → restores SessionValid on the current device only (no entitlement changes).

--------------------------------------------------------------------

## Example dashboards

| Aspect   | Details                                     |
|----------|---------------------------------------------|
| Cost     | Free                                        |
| Audience | Everyone                                    |
| Purpose  | Demonstrate value                           |
| Data     | Real data from designated example locations |

Example locations are **admin-controlled**.

--------------------------------------------------------------------

## Summary (one glance)

| Phase           | Owner pays | Amount                   | What they get                                                            |
|-----------------|------------|--------------------------|--------------------------------------------------------------------------|
| Active Plan     | Yes        | €79 / €179 / €349 / €749 | Preferential visibility (NaviGen), analytics, Dash, exclusive operation  |
| Courtesy        | No         | €0                       | Reduced visibility for 60 days                                           |
| Inactive        | No         | €0                       | Exists but hidden                                                        |
| Restore access  | No         | €0                       | Session recovery                                                         |
| Examples        | No         | €0                       | Demo only                                                                |

--------------------------------------------------------------------

## What NaviGen does NOT sell
- Protection from hijacking
- Permanent ownership
- Account subscriptions
- Access fees
- Fear-based upgrades

--------------------------------------------------------------------

## One-sentence business pitch

**NaviGen lets businesses pay for real, time-limited attention and exclusive operation — nothing more, nothing less.**
