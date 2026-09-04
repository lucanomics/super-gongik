# Historical rule references

SUPER GONGIK may keep historical documents as development fixtures, but a historical document never becomes a current production rule merely because its numbers resemble a current table.

## 2011 annual-leave HWP reference

A development reference titled `연가일수(20110101)` states that it applies to public-service workers called up on or after 2011-01-01 and contains the former `공익근무요원` terminology.

The captured table includes, among other durations:

- 24 months: 15 days within the first year + 16 days after the first year = 31 ordinary days.
- 21 months: 15 days within the first year + 13 days after the first year = 28 ordinary days.
- 13 months: 15 days within the first year + 2 days after the first year = 17 ordinary days.
- 12 months: 16 days over the whole service period.
- 3 months: 4 days over the whole service period.

The complete captured table lives in `packages/rules/fixtures/historical/annual-leave-2011-01-01.json`.

### Safety boundary

This fixture has `productionSelectable: false` and `requiresPrimarySourceReverification: true`.

Current entitlement calculations must continue to use the currently verified rule bundle selected by effective date. The historical HWP is useful for provenance, regression comparison, migration, and document-import testing. It is not permitted to override a current National Law Information Center or Military Manpower Administration source.

## Imported policy documents versus personal records

HWP/HWPX support in the record importer is intentionally conservative. A document must expose a recognizable personal service-record or leave-balance table before it can enter the import preview. Policy tables, manuals, notices, and general guidance are rejected as personal usage records rather than being converted into invented events.
