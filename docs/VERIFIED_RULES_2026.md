# SUPER GONGIK — 2026 Verified Rule Audit

Verified at: 2026-08-30 (Asia/Seoul)

## Purpose

This document is the human-readable legal/policy audit for the first production rule bundles. It exists to prevent application code from turning administrative assumptions into fake certainty.

A value may enter a production rule bundle only when its source and effective period are known. Anything not verified is explicitly marked rather than guessed.

## Status vocabulary

- `VERIFIED`: supported by a current primary or authoritative government source and safe to use as a production rule within the stated scope.
- `VERIFIED_CONTEXTUAL`: the legal rule is verified, but the numeric result depends on user/institution context.
- `REQUIRES_SOURCE_TABLE`: a parent rule is verified but a subordinate schedule/table still needs extraction before automatic calculation.
- `REQUIRES_INSTITUTION_INPUT`: a legal payment/entitlement exists, but the value depends on the institution, commute, schedule, or another local fact.
- `DO_NOT_AUTOCALCULATE`: the application must explain the rule but must not return a definitive entitlement/amount automatically.

## Source hierarchy

Production priority:

1. National Law Information Center — statutes, presidential decrees, ministerial rules, MMA administrative rules
2. Military Manpower Administration official/open-data pages
3. Ministry of Personnel Management official compensation tables
4. Korea Easy Law only as an authoritative secondary cross-check, never to override primary law

## 1. Service duration

### Verified

- Standard social service personnel service duration: **21 months**.
- Military training call-up time is included in the service period.
- Service-period/month calculations must be date-based and must not be implemented as a fixed number of calendar days.
- The current Social Service Personnel Service Management Regulation is effective from **2026-04-23** (MMA Directive No. 2206).

### Product consequence

`expectedDischargeDate` must be calculated by a domain function. Do not use `21 * 30` days or any other day-count shortcut.

The system should permit an authoritative/user-confirmed discharge date override because interruptions, non-counted periods, extensions, and transferred prior-service credit can change the result.

## 2. Ordinary work schedule

The Enforcement Decree ties ordinary social-service work hours to the National Public Service Regulations, while permitting institution-specific changes through the prescribed process.

### Product consequence

Do **not** treat 09:00–18:00 as an immutable user-level legal fact. Store a profile schedule and use the ordinary public-employee schedule only as a suggested default where appropriate.

Status: `VERIFIED_CONTEXTUAL`.

## 3. Annual leave

Current Enforcement Decree Article 59 provides:

- annual leave over the service period: **up to 31 days in total**;
- where the person has no relevant service-duty violation and, from call-up until 30 days before discharge, uses no non-duty-related sick leave: up to **5 additional annual-leave days**;
- where such sick leave totals no more than 2 days: up to **2 additional annual-leave days**.

The detailed allocation of ordinary annual leave by service period is delegated to a subordinate rule/table.

### Product consequence

- `31 days total` may be shown as verified.
- Do **not** invent or silently hard-code a year-by-year allocation until the currently effective subordinate allocation table is independently captured and fixture-tested.
- Additional leave for low sick-leave use must be represented as conditional eligibility, not as an unconditional balance credited on day one.

Status of total: `VERIFIED`.
Status of period-by-period allocation: `REQUIRES_SOURCE_TABLE`.

## 4. Sick leave

Current rules distinguish duty-related and non-duty-related illness/injury.

- Duty-related illness/injury: sick leave for the period the person cannot perform duties.
- Non-duty-related illness/injury: sick leave for the period the person cannot perform duties.
- Where non-duty-related sick leave exceeds **30 days in total**, the excess is not counted in the service period.

The current management-regulation evidence rules include:

- less than one day, including sick-late-arrival / sick-early-departure: no evidence document required;
- sick leave of 3 days or less: one of medical-treatment confirmation, prescription, or medical opinion, except that evidence may be omitted within the permitted total 6-day no-document range;
- more than 3 days: medical diagnosis, plus admission/discharge confirmation if hospitalization occurred;
- unexpected illness/injury may be requested first by phone or similar means and documented afterward as required.

### Approval semantics

The product must not label a sick-leave entry as “legally guaranteed approval.” The service institution decides the leave request in context. SUPER GONGIK records, estimates, and explains; it does not impersonate the institution’s approving authority.

Status: `VERIFIED`, with `approvalRequired: true`.

## 5. Compassionate/family-related leave — current as of 2026-08-28

The Enforcement Decree was amended in August 2026, so this domain is versioned by **effective date**, not merely by calendar year.

Current categories include:

- own marriage: up to **5 days**;
- death of spouse or own/spouse’s parent: up to **5 days**;
- death of direct descendant or own/spouse’s grandparent/maternal grandparent: up to **3 days**;
- death of own/spouse’s sibling: **3 days**;
- spouse gives birth: up to **20 days**, or **25 days** for birth of two or more children at once;
- spouse suffers miscarriage/stillbirth: **3 days**;
- prescribed child/family-care reasons: up to **10 days per year** in total;
- where the person has a child aged 8 or younger or in grade 2 of elementary school or below: childcare time of up to **2 hours per day**, subject to the MMA use rules;
- disaster damage affecting the person or prescribed family: generally up to **5 days**, or up to **10 days** for a large-scale disaster requiring long recovery where recognized by the institution head;
- sperm collection for infertility treatment such as artificial insemination or IVF: **1 day**.

The child/family-care annual 10-day bucket covers prescribed circumstances such as school/childcare closure, official events or teacher consultation, accompanying eligible children for medical care, and care for specified family members due to illness, accident, or old age.

### Product consequence

Every category above must carry:

- `effectiveFrom`;
- max duration;
- whether the duration is a cap rather than an automatic grant;
- eligibility inputs;
- approval/document status.

Historical events must retain the rule version used at the event date.

## 6. Public leave (공가)

Current verified reasons include necessary time for:

- summons by the National Assembly, courts, prosecution, or other state institutions in relation to public duty;
- voting under law;
- inability to attend due to natural disaster, transport interruption, or similar reason;
- movement to a newly redesignated service institution where applicable;
- statutory health examinations/checkups, including the specified occupational, national-health-insurance, and tuberculosis examinations;
- blood donation;
- participation in national events such as the Olympics or National Sports Festival;
- specified vaccination or infection testing relating to Class 1 infectious disease.

### Product consequence

Public leave should be event-driven. Do not maintain a fake finite “공가 balance” where the law provides necessary time by qualifying reason.

Status: `VERIFIED`.

## 7. Special leave

Current verified maximums include:

- exceptionally exemplary performance: up to **5 days per year**;
- commendation for good deeds, etc.: up to **5 days per year**;
- qualifying service at social-welfare facilities or support for special-education students in the specified educational institutions: up to **10 days per year**;
- need for consolation due to specially difficult or poor working conditions outside the preceding field: up to **5 days per year**.

### Product consequence

These are not ordinary annual-leave credits. Model them as conditional/discretionary grants that become spendable only after the institution actually grants them.

Status: `VERIFIED`, `grantSemantics: DISCRETIONARY_OR_CONDITIONAL`.

## 8. Base compensation in calendar year 2026

The social-service pay grade mapping is:

- call-up month through month 2: private second class equivalent;
- months 3–8: private first class equivalent;
- months 9–14: corporal equivalent;
- month 15 and later: sergeant equivalent.

The official 2026 military pay table gives:

- private second class: **750,000 KRW/month**;
- private first class: **900,000 KRW/month**;
- corporal: **1,200,000 KRW/month**;
- sergeant: **1,500,000 KRW/month**.

### Product consequence

Base pay can be calculated automatically after service-month position is known, subject to special prior-service-credit cases and first/last-month or other prorating rules.

Status: `VERIFIED` for ordinary mapping and 2026 monthly figures.

## 9. Meal and transportation payments

The law/management rules verify that meal and transportation costs are paid as actual expenses. Transportation is also paid on the public-transit fare basis where the person walks to and from work.

However, a single nationwide fixed transport number does not exist for a user: it depends on the commute and applicable fare. The MMA separately published a **2026 Social Service Personnel Compensation etc. Payment Standard** attachment on 2026-01-05.

### Product consequence

- Transportation amount: `REQUIRES_INSTITUTION_INPUT` or user commute configuration.
- Meal payment: do not seed an uncited fixed daily number into production merely because blogs repeat it. Extract and verify the current MMA attachment before setting a default.
- UI should distinguish `base salary` from `meal reimbursement` and `transport reimbursement`.

Transport policy status: `VERIFIED_CONTEXTUAL`.
Meal legal basis status: `VERIFIED_CONTEXTUAL`.
Meal default numeric value status: `REQUIRES_SOURCE_TABLE`.

## 10. Calculation safety rules

The application MUST:

1. select rules by event/payment date;
2. expose rule id/version on every derived legal/financial result;
3. show assumptions and missing inputs;
4. return `unsupported` instead of a guessed value where context is missing;
5. preserve historical calculation snapshots;
6. distinguish automatic arithmetic from discretionary institutional approval;
7. never recalculate an old historical record under a newly effective leave rule without explicitly marking it as a refreshed estimate.

## 11. Current source registry

### Primary / official

- Military Manpower Administration, Social Service Personnel call-up/service system — standard 21-month service information.
- National Law Information Center, `병역법 시행령`, current effective version 2026-08-28, including Articles 58, 59, 62.
- National Law Information Center, `사회복무요원 복무관리 규정`, effective 2026-04-23, MMA Directive No. 2206.
- Ministry of Personnel Management, 2026 public-official salary tables, Military Salary Table [Appendix 13].
- Military Manpower Administration Open Information, `2026년도 사회복무요원 보수 등 지급 기준`, posted 2026-01-05 and updated 2026-03-24.

### Authoritative secondary cross-check

- Korea Easy Law, `사회복무요원의 복무`, current summary of Article 59 leave categories.

## 12. Unresolved items before a production-grade v1 calculator

These remain intentionally unresolved rather than hallucinated:

1. Extract the currently effective annual-leave allocation table delegated by the Enforcement Decree / Enforcement Rule and convert it into tested period-allocation fixtures.
2. Extract the MMA 2026 compensation HWPX and verify the exact current meal-payment numeric standard and any edge-case payment instructions.
3. Revalidate first/last-month prorating and non-payable day rules against the current 2026 text before automatic payroll estimates are enabled.
4. Define institution-configurable ordinary workday/minutes so partial-day leave calculations do not assume every workplace uses an identical schedule.
5. Add fixtures for transferred/prior-service-credit cases under Enforcement Decree Article 62(2).

Until these are closed, SUPER GONGIK should display partial calculations with explicit warnings rather than pretend to know more than the source material actually proves.
