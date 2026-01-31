# NaviGen — Payment Plan & Commercial Model

## Core positioning

**NaviGen is an ad platform where your money is spent at 100% effectiveness.  
You pay for real customer visits, and while your campaign is active, you are the only operator of your listing.**

NaviGen is not “hosting a page”.  
It is **keeping a business present in people’s awareness**.

--------------------------------------------------------------------

## How visibility feels (human mental model)

| Phase    | What NaviGen is doing    | What the owner feels            |
| -------- | ------------------------ | --------------------------------|
| Promote  | Actively bringing people | “I’m running ads”               |
| Remember | Keeping me present       | “People can still find me”      |
| Fade     | Letting me slip back     | “I’m becoming less visible”     |
| Park     | Holding my place         | “I’m paused, not gone”          |

These phases describe **attention**, not ownership.

--------------------------------------------------------------------

## Who pays
Only **business owners / operators**.

End users (visitors) never pay.

--------------------------------------------------------------------

## What can exist without payment
- A Location Profile (LPM) may exist without payment.
- Existence does **not** guarantee discoverability.
- Direct links may still open an LPM, but NaviGen does not amplify unpaid listings.

--------------------------------------------------------------------

## Primary product: Campaign

### €50 Campaign (core revenue)

| Aspect          | Details                                                               |
|-----------------|-----------------------------------------------------------------------|
| Duration        | 30 days                                                               |
| Payment timing  | Upfront                                                               |
| Discoverability | High (search, lists, browse) — preferential visibility inside NaviGen |
| Promotion       | Enabled (preferential visibility inside NaviGen surfaces only)        |
| Analytics       | Enabled                                                               |
| Dash access     | Enabled                                                               |
| Operation       | **Exclusive** (no other operator allowed)                             |
| UI status       | “Active campaign”                                                     |

**Owner mental model**
> “I pay €50 and for 30 days NaviGen keeps my business at the top inside NaviGen.”

Optional add-on within an active campaign:
- The owner may run a **campaign offer** (Promo QR) to make the listing more appealing.
- Example offer types (non-exhaustive):
  - Discount (percent / fixed)
  - Early bird (first N redeemers)
  - Happy hour (time window)
  - Reservations / booking CTA
  - Dash access as an internal operator tool (not a consumer offer)

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
• activate, pause, or finish campaigns.

Payment is a step within Campaign Management, not a standalone product.

--------------------------------------------------------------------

## After campaign ends (no payment yet)

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
> “My campaign ended, but NaviGen is not dropping me immediately.”

Purpose:
- Avoid sudden disappearance
- Preserve goodwill
- Reduce hostile churn

--------------------------------------------------------------------

## Optional extension: Hold visibility

### €5 Hold Visibility (optional, secondary revenue)

| Aspect          | Details                                                        |
|-----------------|----------------------------------------------------------------|
| Duration        | 30 days per purchase                                           |
| Cost            | €5                                                             |
| Discoverability | Yes (restores visibility back to the non-fading baseline)      |
| Promotion       | Preferential visibility: Disabled (no paid ordering advantage) |
| Analytics       | Collected (internal) / Disabled (owner-facing)                 |
| Dash access     | Disabled (campaign required for owner analytics)               |
| UI framing      | “Keep your place visible”                                      |

**Important**
- This is not protection.
- This is not access.
- This is time to decide.

**Owner mental model**
> “I’m not ready to run another campaign, but I don’t want to fade out yet.”

This option may be introduced later.

--------------------------------------------------------------------

## Long-term inactivity

### Inactive / Not discoverable

| Aspect                     | Details                                                                 |
|----------------------------|-------------------------------------------------------------------------|
| When                       | After courtesy + any holds expire                                       |
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

| Aspect        | Details                                                                                     |
|---------------|---------------------------------------------------------------------------------------------|
| Cost          | Free                                                                                        |
| Purpose       | Session recovery                                                                            |
| When          | Ownership exists but session is missing                                                     |
| How           | Via Payment ID (pi_...) from Stripe email, or owner access link                             |
| What it gives | Restores owner access on this device (Dash + owner tools during the active campaign window) |

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
- **Courtesy visibility (“Still visible”)** applies after campaign ends for a limited window, without Dash access.
- **Hold visibility (€5)** extends discoverability only; it does not grant ownership, campaigns, or Dash.

### Phases (operational meaning)

| Phase    | Condition summary       | Discoverability | Promotion | Dash                  | Notes                          |
|----------|-------------------------|-----------------|-----------|-----------------------|--------------------------------|
| Promote  | CampaignEntitled = true | High            | Yes       | Yes (if SessionValid) | Primary paid state (€50)       |
| Remember | Courtesy window active  | Yes             | No        | No                    | Free goodwill period           |
| Park     | Hold visibility active  | Yes             | No        | No                    | €5 “time to decide”            |
| Inactive | No courtesy/hold        | No              | No        | No                    | Hidden from discovery surfaces |

### Transitions (what causes state changes)

- **€50 Campaign payment** → sets/extends ownership and creates or activates campaign entitlement for the purchased window.
- **Campaign window ends** → CampaignEntitled becomes false; Courtesy window begins.
- **€5 Hold payment (optional)** → extends discoverability baseline without campaign entitlement.
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

| Phase           | Owner pays | Amount | What they get                                                     |
|-----------------|------------|--------|-------------------------------------------------------------------|
| Campaign        | Yes        | €50    | Preferential visibility (NaviGen), analytics, exclusive operation |
| Courtesy        | No         | €0     | Reduced visibility                                                |
| Hold visibility | Optional   | €5     | Stay visible without paid ordering advantage (avoid fading out) |
| Inactive        | No         | €0     | Exists but hidden                                                 |
| Restore access  | No         | €0     | Session recovery                                                  |
| Examples        | No         | €0     | Demo only                                                         |

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
