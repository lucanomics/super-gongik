# SUPER GONGIK — 2026 Rule Gap Closure Audit #2

Verified at: 2026-08-30 (Asia/Seoul)

## Purpose

This audit closes several gaps deliberately left open in `docs/VERIFIED_RULES_2026.md`. It also records what remains unsafe to automate.

The rule engine must prefer an explicit unsupported/warning state over a guessed entitlement or payment amount.

## 1. Ordinary annual leave allocation — CLOSED for standard 21-month service

The Enforcement Decree states a statutory ceiling of up to 31 annual-leave days over service, but the actual allocation is delegated to the Enforcement Rule.

`병역법 시행규칙 제39조의2 및 별표 1의2` provides the service-duration allocation table.

For the current standard 21-month social-service term:

- within the first year: 15 days
- after the first year: 13 days
- ordinary allocated total: 28 days

Therefore, SUPER GONGIK must **not** present the 31-day decree ceiling as the standard 21-month ordinary balance.

The current bundle also records the published allocation rows for 3 through 24-or-more months. Durations of one or two months remain unsupported rather than inferred.

### Additional annual leave remains conditional

The low-sick-leave provisions remain separate conditional grants:

- qualifying zero non-duty sick leave: up to 5 additional days
- qualifying non-duty sick leave totaling no more than 2 days: up to 2 additional days

These must not be credited automatically before eligibility is established.

## 2. Half-day annual leave — CLOSED

Current service-management rules allow half-day annual leave.

- morning/afternoon boundary: 14:00
- two half-day annual leaves count as one day

Internally the application should continue storing duration in minutes.

## 3. 2026-08-28 compassionate-leave amendment — CLOSED

The amendment effective 2026-08-28 added compassionate leave for accompanying a spouse to pregnancy medical checkups:

- up to 10 days
- effective from 2026-08-28

The preceding 2026 bundle must therefore exclude this category.

### Effective-date boundary

- event dated 2026-08-27: use `packages/rules/leave/2026-04-23.json`
- event dated 2026-08-28 or later: use `packages/rules/leave/2026-08-28.json`

A boundary fixture is mandatory when the domain implementation is written.

## 4. Historical leave bundle — PARTIALLY CLOSED

A verified historical bundle now covers 2026-04-23 through 2026-08-27, the period where MMA Directive No. 2206 was effective before the August presidential-decree amendment.

Events before 2026-04-23 still require an older management-rule audit if SUPER GONGIK intends to support detailed evidence/administrative semantics for those dates. Do not silently reuse the April bundle backward.

## 5. 2026 meal allowance — STRONGLY CORROBORATED, MMA attachment extraction still open

The MMA officially published `2026년도 사회복무요원 보수 등 지급 기준` with an HWPX attachment.

The attachment has not yet been directly extracted and checksummed in this audit.

However, multiple official 2026 public-budget/accounting documents independently use a social-service-personnel meal rate of:

- KRW 9,000 per eligible day

This is strong official corroboration, but SUPER GONGIK should treat KRW 9,000 as a suggested 2026 profile value until the MMA attachment itself is directly extracted.

### Product behavior

- prefill/suggest KRW 9,000 where appropriate
- label it as a 2026 suggested rate pending direct MMA attachment provenance
- allow institution/user confirmation or override
- do not hide the source/assumption

## 6. Transportation — CLOSED as contextual, not numeric

Transportation is an actual-expense concept and depends on commute/institution context.

A single budget document may contain a representative fare, but that is not a lawful national default for every user.

SUPER GONGIK must require:

- commute fare or institution-approved transport rate
- eligible service days

Walking does not justify hard-coding zero where the governing rule uses the public-transit fare basis.

## 7. Partial-month pay and non-payable days — STRUCTURE VERIFIED, arithmetic still gated

The official management-rule structure supports:

- daily proration for partial first and last months
- non-payment treatment for specified non-service/unauthorized-absence/over-limit absence periods
- duty-related sick leave remaining payable
- non-duty sick leave beyond the cumulative service-count threshold requiring special handling

The rule bundle records this structure but leaves automatic arithmetic disabled until exact current-text divisor/date fixtures are captured.

This is intentional. A payroll UI may explain the pending adjustment but must not return a falsely precise number.

## 8. Still-open production gaps

### P0 before a complete automatic payroll estimator

1. Directly extract and checksum the MMA 2026 HWPX payment-standard attachment.
2. Pin the exact current partial-month daily-rate arithmetic/divisor and add fixtures.
3. Pin exact non-payable-day date accounting and add fixtures.
4. Implement prior-service-credit profile fields and tests under Enforcement Decree Article 62(2).

### P1 historical completeness

5. Add a detailed leave-management bundle for dates before 2026-04-23 if historical users need that period.
6. Capture one- and two-month atypical annual-leave allocation behavior if the product ever supports those service durations.

## 9. Implementation invariants created by this audit

The future domain implementation must test at minimum:

- 21-month standard ordinary leave resolves to 15 + 13 = 28 days
- 31-day statutory cap is never displayed as the standard 21-month allocation
- low-sick-leave bonus remains conditional
- 2026-08-27 excludes spouse pregnancy-checkup accompaniment leave
- 2026-08-28 includes it, capped at 10 days
- transport calculation refuses to run without commute context
- meal estimate visibly exposes whether KRW 9,000 is profile-confirmed or only the suggested 2026 value
- partial-month payroll refuses false precision until the gated rule is enabled
