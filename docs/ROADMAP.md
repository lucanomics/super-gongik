# SUPER GONGIK Roadmap

## Phase 0 — Product foundation

Status: in progress

Deliverables:

- PRD
- architecture document
- data model
- rules-engine specification
- implementation backlog

Exit criteria:

- core scope and non-goals are explicit
- canonical event model is agreed
- versioned rules strategy is documented

## Phase 1 — Application foundation

Goal: create a reliable shell that can support the domain model.

Tasks:

- initialize Next.js + TypeScript application
- configure Tailwind and component system
- establish workspace/package structure
- add linting, formatting, type-checking, tests
- configure PWA manifest and installability
- establish environment validation
- add CI for lint/typecheck/test/build

Exit criteria:

- clean production build
- preview deployment succeeds
- offline app shell loads

## Phase 2 — Service profile and dashboard

Goal: answer where the user is in their service.

Tasks:

- guest onboarding
- call-up date
- expected discharge date
- service progress calculation
- D-Day calculation
- today/next-event dashboard skeleton
- editable service profile

Mandatory tests:

- same-day boundaries
- leap-year boundaries
- timezone handling in Asia/Seoul
- past/future invalid dates

## Phase 3 — Service calendar

Goal: make the calendar the canonical interaction surface.

Tasks:

- service_event repository
- month view
- agenda view
- create/edit/delete event
- event categories
- filtering
- event conflict validation

Exit criteria:

- every supported service event can be represented once
- downstream features can consume events without duplicate entry

## Phase 4 — Leave ledger

Goal: make leave accounting reliable and explainable.

Tasks:

- leave accounts
- leave credits
- minute-based usage
- annual/sick/official/special/compassionate leave
- outing, late arrival, early leave
- balance projection
- ledger UI
- correction/adjustment flow

Exit criteria:

- balance can be reconstructed entirely from credits + events
- no floating-point day values are sources of truth

## Phase 5 — Rules engine

Goal: isolate policy logic from UI code.

Tasks:

- rule schema validator
- effective-date selector
- verification states
- source metadata
- calculation result contract
- fixtures and unit tests
- unsupported-rule state

Exit criteria:

- no service/leave/compensation policy conditional lives in React components
- every production rule carries source metadata

## Phase 6 — Compensation

Goal: provide transparent monthly estimates.

Tasks:

- compensation rule bundle
- base-pay logic
- meal allowance logic
- transport allowance logic
- monthly event normalization
- breakdown UI
- assumptions/warnings
- calculation snapshots

Exit criteria:

- user can see exactly how the total was calculated
- historical calculation can be replayed using its stored rule version

## Phase 7 — Local-first storage

Goal: make essential use independent of connectivity.

Tasks:

- local persistence layer
- migrations
- optimistic local writes
- offline queue
- cache invalidation strategy
- recovery from corrupted/incomplete local state

Exit criteria:

- profile, calendar, leave, and stored estimates work offline

## Phase 8 — Cloud backup and sync

Goal: eliminate the device-change data-loss failure mode.

Tasks:

- Supabase schema
- row-level security
- optional Apple/Google auth
- guest-to-account migration
- sync state
- conflict handling
- backup status UI
- restore flow

Exit criteria:

- new device can restore complete service records
- local-only users remain supported

## Phase 9 — Export and privacy controls

Tasks:

- JSON export
- CSV event export
- CSV leave export
- CSV compensation export
- cloud-data deletion
- account deletion
- privacy disclosure

## Phase 10 — Notification and quality pass

Tasks:

- next-event reminders
- leave reminders where useful
- rule-update notices
- accessibility audit
- VoiceOver labels
- keyboard navigation where applicable
- reduced-motion support
- error monitoring
- performance audit

## Phase 11 — Knowledge layer

Only after the core product is trustworthy.

Tasks:

- official-source knowledge base
- versioned help articles
- source freshness metadata

Potential later feature:

- grounded AI assistant restricted to verified source material

## Explicitly deferred

Do not build these until there is evidence they improve the core product:

- community
- workplace reviews
- chat
- public profiles
- social feed
- rankings
- streaks

## Recommended implementation order for an agentic coding session

1. repo/workspace bootstrap
2. domain package and schemas
3. unit tests for date/time and rule-selection logic
4. local service profile
5. service events
6. dashboard/calendar UI
7. leave ledger
8. rules engine fixtures
9. compensation
10. local-first persistence
11. cloud sync
12. polish and accessibility

Do not allow an implementation agent to skip straight to decorative UI before domain tests exist.
