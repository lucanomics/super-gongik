import { describe, expect, it } from "vitest";

import historicalAnnualLeave from "../fixtures/historical/annual-leave-2011-01-01.json";
import { LEAVE_RULE_BUNDLES } from "../src/bundles";

describe("historical annual leave references", () => {
  it("preserves the 2011 HWP table without enabling it as a production rule", () => {
    expect(historicalAnnualLeave.productionSelectable).toBe(false);
    expect(historicalAnnualLeave.requiresPrimarySourceReverification).toBe(
      true,
    );
    expect(historicalAnnualLeave.effectiveFromReference).toBe("2011-01-01");
    expect(
      LEAVE_RULE_BUNDLES.some(
        (bundle) =>
          bundle.version === historicalAnnualLeave.effectiveFromReference,
      ),
    ).toBe(false);
  });

  it("captures the uploaded 21-month reference as 15 plus 13 days", () => {
    const allocation = historicalAnnualLeave.allocations.find(
      (item) => item.mandatoryServiceMonths === 21,
    );

    expect(allocation).toMatchObject({
      mandatoryServiceMonths: 21,
      firstYearDays: 15,
      afterFirstYearDays: 13,
      ordinaryTotalDays: 28,
    });
  });

  it("keeps the short-service whole-period values from the historical table", () => {
    expect(
      historicalAnnualLeave.allocations.find(
        (item) => item.mandatoryServiceMonths === 12,
      ),
    ).toMatchObject({ mandatoryServiceMonths: 12, wholeServiceDays: 16 });
    expect(
      historicalAnnualLeave.allocations.find(
        (item) => item.mandatoryServiceMonths === 3,
      ),
    ).toMatchObject({ mandatoryServiceMonths: 3, wholeServiceDays: 4 });
  });
});
