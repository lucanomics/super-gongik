# SUPER GONGIK Architecture

## 1. Architecture goals

The architecture must optimize for four things before feature breadth:

1. correctness of service and compensation calculations
2. offline usability
3. recoverable user data
4. portability between web/PWA and a future native client

The UI framework must not own policy logic.

## 2. Proposed repository layout

```text
super-gongik/
  apps/
    web/

  packages/
    domain/
      service/
      leave/
      compensation/
      calendar/

    rules/
      service/
      leave/
      compensation/

    db/
    ui/
    validation/

  docs/
    PRD.md
    ARCHITECTURE.md
    DATA_MODEL.md
    RULE_ENGINE.md
    ROADMAP.md
```

## 3. Recommended stack

Initial implementation:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL via Supabase
- PWA support
- Vercel deployment

The stack is replaceable. The domain package is not.

## 4. Domain boundary

Policy and business rules live under `packages/domain` and `packages/rules`.

The following must never depend directly on React or Next.js:

- service completion calculation
- leave balance calculation
- service-event normalization
- compensation calculation
- rule selection by effective date
- historical calculation replay

This allows a later Expo/native client to reuse identical logic.

## 5. Canonical event architecture

`service_event` is the center of the system.

Examples:

- annual leave
- sick leave
- official leave
- outing
- late arrival
- early departure
- training
- education
- workday override
- service status change

One event may affect multiple projections:

```text
service_event
   |
   +--> calendar projection
   +--> leave projection
   +--> attendance projection
   +--> compensation projection
   +--> dashboard projection
```

This prevents users from entering the same fact multiple times.

## 6. Local-first write flow

Preferred behavior:

```text
User action
  -> validate
  -> write local record
  -> update local projections
  -> render success
  -> enqueue sync
  -> sync to cloud when available
```

The UI must not wait for network success to confirm ordinary local actions.

## 7. Sync model

For v1, avoid clever distributed-system behavior.

Every mutable user record should include:

- id
- user_id or local profile id
- created_at
- updated_at
- deleted_at nullable
- revision integer
- device_id

Conflict policy should be explicit per record type.

Recommended initial conflict handling:

- append-only event records: union by immutable id
- editable metadata: latest valid revision wins
- destructive conflicts: preserve both versions and surface recovery path

## 8. Authentication model

Guest-first.

Initial local profile does not require authentication.
Authentication exists to enable:

- cloud backup
- cross-device restore
- optional sync

Preferred providers later:

- Sign in with Apple
- Google

Account deletion must not be required for local-only use.

## 9. Data ownership

Users must be able to:

- export personal data
- remove cloud copy
- continue local-only use where technically feasible
- understand what data is stored remotely

Recommended export formats:

- JSON as complete machine-readable backup
- CSV for human-readable event and compensation history

## 10. Rules architecture

Rules are data, not scattered conditionals.

```text
packages/rules/
  compensation/
    2026.json
    2027.json
  leave/
    2026.json
  service/
    2026.json
```

Rules are selected by effective date and applicable profile context.

## 11. Calculation snapshots

Whenever a policy-derived calculation matters to the user, persist a calculation snapshot containing:

- inputs
- selected rule id/version
- result
- generated_at

Historical views can then explain why a past result differed from today's rules.

## 12. Security principles

- no secrets in client bundles
- row-level security for cloud user data
- no public exposure of private service records
- minimize personal identifiers
- encryption in transit
- secure provider-managed authentication
- audit sensitive destructive operations

Avoid collecting resident registration numbers, detailed health records, or unnecessary workplace-sensitive information.

## 13. Observability

Before public release:

- client error tracking
- server error tracking
- structured calculation error events without sensitive payloads
- deployment health checks

Do not log private user notes or raw personal service records.

## 14. Testing strategy

### Unit tests

Mandatory for:

- D-Day calculation
- completion percentage
- leave duration normalization
- leave balance
- rule effective-date selection
- compensation components
- historical rule replay

### Integration tests

- create/edit/delete service event
- event changes leave balance
- event changes compensation projection where applicable
- offline write then sync
- backup then restore

### End-to-end tests

- first-run onboarding
- record leave
- inspect monthly compensation
- export data

## 15. Non-goals

Do not introduce microservices, event brokers, or distributed infrastructure at this stage. The event-centered model is a domain model, not an excuse to build a miniature bank backend for a service tracker.
