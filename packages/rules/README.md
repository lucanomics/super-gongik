# SUPER GONGIK Rule Bundles

These files are policy data, not UI copy.

## Required metadata

Every production bundle must contain:

- `schemaVersion`
- `ruleId`
- `version`
- `effectiveFrom`
- `effectiveUntil`
- `verifiedAt`
- `status`
- `sources`

## Allowed statuses

- `VERIFIED`
- `VERIFIED_CONTEXTUAL`
- `REQUIRES_SOURCE_TABLE`
- `REQUIRES_INSTITUTION_INPUT`
- `DO_NOT_AUTOCALCULATE`

Only `VERIFIED` rules may produce an unconditional automatic numeric result.

`VERIFIED_CONTEXTUAL` rules may calculate only after all required context is present.

Anything else must return an explicit unsupported/pending-verification state.

## Effective-date rule

Rule selection is by the date of the service event or payment period, not by whichever rule bundle happens to be newest.

Example:

- a leave event on 2026-08-27 must use the rule effective on 2026-08-27;
- a leave event on 2026-08-28 may use the bundle effective 2026-08-28.

Never retroactively mutate historical event semantics simply because a law changed later.

## Source rule

Production sources should prioritize:

1. National Law Information Center
2. Military Manpower Administration
3. Ministry of Personnel Management
4. other official government explanatory material

Community posts, blogs, app-store reviews, and search snippets are not legal rule sources.

## Missing-data behavior

Never silently substitute:

- last year's value;
- a national average;
- a blog-reported number;
- a hard-coded 8-hour day;
- an assumed commute fare.

Return a warning/state that tells the UI what the user or maintainer must provide.
