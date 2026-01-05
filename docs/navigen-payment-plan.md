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
| Promotion       | Enabled (preferential visibility inside NaviGen surfaces only)             |
| Analytics       | Enabled                                                               |
| Dash access     | Enabled                                                               |
| Operation       | **Exclusive** (no other operator allowed)                             |
| UI status       | “Active campaign”                                                     |

**Owner mental model**
> “I pay €50 and for 30 days NaviGen actively brings customers to my business.”

This is the **main and mandatory** monetization path.

--------------------------------------------------------------------

## After campaign ends (no payment yet)

### Courtesy visibility (free)

| Aspect          | Details                                                                  |
|-----------------|--------------------------------------------------------------------------|
| Duration        | 60 days (Y = 2)                                                          |
| Cost            | Free                                                                     |
| Discoverability | Yes (reduced ranking)                                                    |
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

| Aspect          | Details                                          |
|-----------------|--------------------------------------------------|
| Duration        | 30 days per purchase                             |
| Cost            | €5                                               |
| Discoverability | Yes (ranking stabilized)                         |
| Promotion       | Disabled                                         |
| Analytics       | Collected (internal) / Disabled (owner-facing)   |
| Dash access     | Disabled (campaign required for owner analytics) |
| UI framing      | “Keep your place visible”                        |

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

| Aspect                     | Details                                        |
|----------------------------|------------------------------------------------|
| When                       | After courtesy + any holds expire              |
| Discoverability            | No                                             |
| Appears in search/lists    | No (public discovery surfaces only)            |
| Appears in owner selection | Yes (Select your business / claim flows)       |
| Direct link                | May still open                                 |
| Analytics                  | Collected (internal) / Disabled (owner-facing) |
| Dash access                | No                                             |
| UI status                  | “Inactive”                                     |

**Owner mental model**
> “My business is paused on NaviGen. I can restart anytime.”

This solves:
- Orphaned listings
- Infrastructure cost leakage
- Discovery clutter

No deletion is required.

--------------------------------------------------------------------

## Restore access (not a product)

| Aspect        | Details                                 |
|---------------|-----------------------------------------|
| Cost          | Free                                    |
| Purpose       | Session recovery                        |
| When          | Ownership exists but session is missing |
| How           | Via Stripe receipt or owner access link |
| What it gives | Dash access only                        |

Restore is a **support / recovery path**, never a paid product.

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
| Hold visibility | Optional   | €5     | Keep discoverable without promotion                               |
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
