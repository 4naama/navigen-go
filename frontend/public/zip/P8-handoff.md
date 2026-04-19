# Phase 8 handoff for the team

## P8 status

Phase 8 is no longer in design mode. The core contract is implemented and the repo has moved to the new runtime model: private-shell draft flow via `/api/location/draft`, authoritative publish via `/api/location/publish`, KV-backed runtime profile authority, and DO-backed list/search authority. The current implementation plan also treats these as the locked P8 targets, with no runtime `profiles.json` fallback once Phase 8 is enabled.

Operationally, the migration steps have also been exercised:
- legacy rows were preseeded into `profile_base:<ULID>`
- DO backfill was run for search/context indexes
- browser checks showed context pages and LPM opening working again after backfill
- Access gating is tester-only on `navigen.io`, with the narrow `/data/profiles.json` bypass only needed temporarily if preseed is rerun

So the project is past the “can P8 work?” stage. It is now in the “stabilize, polish, and lock down product behavior” stage.

## What lives where

### Backend authority
`backend/worker/src/index.ts` is the Phase 8 authority layer.

This file now owns:
- dual-identity Stripe/ownership bridge (`locationID` or `draftULID + draftSessionId`)
- `/api/location/draft`
- `/api/location/publish`
- `profile_base:<ULID>`, `override:<ULID>`, `override_draft:<ULID>:<actorKey>`, `override_log:<ULID>:<ts>`
- `PlanAllocDO`, `SearchShardDO`, `ContextShardDO`
- KV-authoritative `/api/data/profile`, `/api/data/item`, `/api/data/contact`
- KV+DO `/api/data/list?context=<ctx>`
- preseed and DO backfill admin routes
- retire + recreate enforcement logic

This matches the current P8 storage/runtime plan: `profile_base`, `override`, `override_log`, `override_draft`, and plan allocation state live in `KV_STATUS`; alias continuity lives in `KV_ALIASES`; search and context membership live in DOs.

### Pages / frontend edge shell
`frontend/public/_worker.js` is host/routing glue only.

It should stay limited to:
- serving the shell/assets
- same-origin proxying of authoritative API routes
- keeping public data endpoints routed to the API Worker
- serving static `contexts.json` where intentionally allowed

It is not the source of truth for ownership, draft, publish, or list logic.

### Frontend UI
`frontend/public/modal-injector.js` now carries most of the BO-side P8 UX:
- Select your business
- Request a listing / Create a location
- campaign management modal
- publish button for signed-in BOs
- private-shell draft save path
- basic validation and field wiring

`frontend/public/app.js` carries:
- shell bootstrap
- context path handling
- list fetching
- campaign-return handling and reopen flow

`frontend/public/navi-style.css` carries:
- modal shell/body/footer behavior
- request-listing field styling
- location card wrapping
- footer and loader polish

### Static catalogs / legacy data
`frontend/public/data/contexts.json` is the controlled context catalog.  
`frontend/public/data/structure.json` is the controlled group/subgroup/keyword catalog.  
`frontend/public/data/profiles.json` is now a **legacy migration/admin seed input**, not the runtime authority.

That distinction matters: runtime reads are KV/DO; `profiles.json` is only relevant when intentionally reseeding legacy rows.

## What is complete

These P8 elements are effectively in place:

- Private-shell create/update flow.
- Authoritative publish flow with slug-at-publish, existing-slug preservation, and post-publish immutability.
- Capacity enforcement via `PlanAllocDO`.
- DO-backed search/context indexing.
- KV-authoritative profile/item/contact reads.
- DO-backed context list reads with promoted/visible/hidden handling.
- Legacy preseed route and DO backfill route.
- Browser-facing context pages and LPM open path functioning again after backfill.
- Retire + recreate as the correction model for wrong geo / wrong taxonomy.

This aligns with the current implementation plan’s locked P8 scope and ship-gate direction.

## What is still missing or still open

### 1) Request Listing UX is not finished
The current Request Listing / Create a location flow is functional, but not final-quality.

Open items:
- Context selection UX is still under discussion. Native multi-select works technically, but product direction is leaning toward a dedicated searchable context picker modal with selected chips and probably a hard cap of 2–3 contexts.
- Tags now use compact clickable chips/pills in Request Listing. Chips wrap across lines, toggle selected/unselected on click, and selected chips change color so state is obvious.
- Some modal polish remains around scroll/spacing/interaction consistency.

This is not a backend blocker anymore. It is a frontend UX/product polish item.

### 2) Translation pass is incomplete
A lot of session-added P8 UI has already been wired, but translation work is not yet fully finished across the whole BO flow. The next work here is a systematic i18n sweep, not piecemeal spot-fixes.

### 3) Popular needs a proper product rule
Current Popular behavior still comes from the published `Priority` field, and the shell renders Popular by filtering rows where `Priority === "Yes"`.

That works today, but the product decision is still open:
- keep it internal/admin-driven for now
- later possibly derive it from a backend score such as recent intent/engagement
- do not monetize it yet

The current recommendation is to keep it, but not expose it as a BO toggle until there is a clear ranking/billing model.

### 4) Preseed summary counter is misleading
The preseed route succeeded, but overwritten rows were being summarized awkwardly. This is cosmetic, not a migration blocker.

### 5) Reruns still depend on legacy source availability
If the team changes legacy dataset rows in `profiles.json` and wants those changes to become live in seeded rows, they must:
- deploy the new `profiles.json`
- temporarily allow the Worker to fetch `/data/profiles.json`
- rerun preseed with `force:true`
- rerun DO backfill
- close that file path again

So runtime no longer depends on `profiles.json`, but **migration refreshes still do**.

## The most important P8 rules to keep in mind

1. **Runtime truth is KV/DO, not `profiles.json`.**  
   `profile_base:<ULID>` + `override:<ULID>` is the public runtime truth. Search/list membership comes from DOs, not dataset scans.

2. **Draft is private and non-authoritative.**  
   Draft writes must never mint aliases, affect public visibility, or touch DOs.

3. **Slug is only minted on first publish.**  
   Existing published locations preserve slug; brand-new locations stamp slug only at publish.

4. **Post-publish geo/taxonomy edits are not normal edits.**  
   Wrong geo or wrong classification must go through retire + recreate, not mutation-in-place.

5. **List/search require DO membership.**  
   Preseed alone is not enough; seeded legacy rows must also be backfilled into `ContextShardDO` / `SearchShardDO` for browse/search to work.

## Practical operating guide from here

### If no legacy dataset changes are made
Do not touch preseed or the `/data/profiles.json` bypass. Leave runtime on KV/DO and continue with frontend polish and product decisions.

### If legacy dataset changes must be refreshed into live P8 state
Use this sequence:
1. update repo `profiles.json`
2. deploy frontend
3. temporarily allow `/data/profiles.json`
4. run preseed with `force:true`
5. run DO backfill
6. restore block on `/data/profiles.json`

### If new locations are created going forward
They should go through:
- BO private shell via `/api/location/draft`
- paid owner flow
- `/api/location/publish`

They should **not** be added to runtime via `profiles.json`.

## Recommended next work order

If the team wants the highest-value next steps:

1. Finish Request Listing / Create a location UX.
2. Do the full i18n sweep for P8-added UI.
3. Lock the Popular policy.
4. Clean up any remaining noisy/non-blocking errors like promo-QR 409 handling.
5. Then do ship-gate QA from the latest implementation plan: profile/item/contact/list, QR, promo, dash, and owner flows.

## Bottom line

P8 is **substantially implemented**.  
The project is no longer missing core architecture. The remaining work is mostly:
- frontend UX/product completion,
- translation cleanup,
- and operational discipline around legacy reseeding.

The most important sentence for the team is:

**Do not think in `profiles.json` anymore for runtime. Think in `profile_base + override + DO indexes`.**
