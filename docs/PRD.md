# SUPER GONGIK Product Requirements Document

## 1. Product definition

SUPER GONGIK is a personal service operating system for Korean social service personnel. It should help a user understand, record, calculate, and review their entire service period from call-up to discharge.

The product is not a collection of disconnected calculators. The core experience is a single service record that powers the dashboard, calendar, leave ledger, compensation estimates, notifications, and future exports.

## 2. Product principles

1. One input, many consequences: a service event should update all relevant views automatically.
2. Trust before novelty: calculations must be explainable and tied to versioned rules.
3. Local-first: essential features must work without a network connection.
4. Guest-first: account creation must not block first use.
5. User-owned data: backup, sync, and export are first-class capabilities.
6. Minimal collection: only collect data needed to provide the service.
7. Mobile-first: prioritize iPhone-class mobile layouts and PWA installability.
8. No dark patterns: no forced engagement, intrusive ads, or artificial streak mechanics.

## 3. Primary user jobs

- Check how much service time is completed and how much remains.
- Know today's service status and the next important schedule item.
- Record annual leave, sick leave, official leave, special leave, outings, late arrival, and early departure.
- Understand remaining leave in days and minutes.
- Estimate monthly compensation and understand the calculation basis.
- Keep a trustworthy chronological record of service events.
- Recover records after device loss or device replacement.
- Export personal service history when desired.

## 4. Information architecture

Primary navigation should remain limited to four destinations:

### Home

- Service D-Day
- Completion percentage
- Today's status
- Remaining annual leave
- Next event
- Current-month compensation estimate
- Quick actions

### Calendar

- Monthly and agenda views
- Workdays and service events
- Leave entries
- Education and training
- User-created notes

### Money

- Monthly compensation estimate
- Base pay
- Meal allowance
- Transportation allowance
- Other supported allowances
- Calculation explanation and rule source
- Historical payment records

### Me

- Service profile
- Rule version and calculation settings
- Backup and cloud sync
- Data export
- Notifications
- Accessibility
- Help and policy information

## 5. MVP scope

### P0

- Service profile setup
- D-Day and completion calculation
- Service calendar
- Leave ledger
- Rules engine foundation
- Compensation calculator
- Local persistence
- Exportable data model

### P1

- Cloud backup and sync
- Notifications
- Calendar filters
- Accessibility pass
- Compensation history
- Rule update notices

### P2

- Knowledge base using official sources
- Optional AI assistant grounded only in trusted source data
- Native wrapper or Expo client if web/PWA limits become material

## 6. Explicitly out of scope for v1

- Anonymous community
- Workplace reviews
- Direct messaging
- Social graph
- Public rankings
- Engagement streaks
- Unverified user-generated legal or administrative advice

These features create moderation and liability costs without improving the core service-management job.

## 7. Key screens

### Onboarding

Collect only:

- call-up date
- expected discharge date or service duration profile
- workplace/service category where necessary for calculation
- default commute cost when user chooses to use compensation estimates

Do not require sign-in.

### Home dashboard

Must answer within one screen:

- Where am I in my service?
- What is happening today?
- What is next?
- How much leave remains?
- What is this month's expected compensation?

### Leave entry

A single form should support:

- leave type
- date
- start/end time or duration
- memo
- rule-derived deduction preview

### Compensation detail

Must show:

- total estimate
- components
- input assumptions
- active rule version
- effective date
- source metadata

## 8. Data model philosophy

All time-based leave and attendance adjustments should use minutes internally. Day-based presentation is derived from policy and user context. This avoids inconsistent fractional-day logic.

The canonical event record should be `service_event`. Features should derive their state from service events wherever possible instead of maintaining duplicate user inputs.

## 9. Trust requirements

- Every policy-derived calculation must expose the rule version.
- Historical records must preserve the rule version used at the time of calculation.
- Rule changes must not silently rewrite historical user-visible results.
- Estimates must be labeled as estimates when official payroll behavior can differ.
- Official-source metadata should include title, source URL, effective date, and last verified date.

## 10. Reliability requirements

- App remains usable offline for profile, D-Day, calendar, leave, and stored compensation calculations.
- Local write must succeed before sync is attempted.
- Sync conflicts must be deterministic and recoverable.
- User must be able to export all stored personal data.
- Destructive actions require confirmation and should support recovery where feasible.

## 11. Success metrics

Avoid vanity metrics. Initial product quality should be measured by:

- onboarding completion rate
- weekly active users who record at least one service event
- percentage of users with successful backup enabled
- crash-free sessions
- calculation error reports per 1,000 calculations
- successful data restore rate
- median time to record a leave event

## 12. Product positioning

Competitive position:

Existing utility-style apps: separate calculators and community features.

SUPER GONGIK: a trustworthy, integrated, explainable personal service record and management system.
