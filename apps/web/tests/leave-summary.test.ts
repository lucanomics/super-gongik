import { describe, expect, it } from "vitest";

import {
  formatLeaveMinutes,
  getAnnualLeaveSummary,
} from "../src/lib/leave-summary";
import type {
  StoredLeaveSnapshot,
  StoredServiceEvent,
} from "../src/lib/service-record-storage";

function event(
  id: string,
  allDay: boolean,
  durationMinutes: number | null,
): StoredServiceEvent {
  return {
    id,
    serviceProfileId: "profile-1",
    eventType: "ANNUAL_LEAVE",
    startsAt: "2026-09-01T00:00:00+09:00",
    endsAt: null,
    durationMinutes,
    allDay,
    title: null,
    note: null,
    status: "CONFIRMED",
    metadata: {},
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    deletedAt: null,
    revision: 1,
    deviceId: "device-1",
  };
}

function snapshot(remainingDays: number): StoredLeaveSnapshot {
  return {
    id: "snapshot-1",
    serviceProfileId: "profile-1",
    importBatchId: "batch-1",
    leaveType: "ANNUAL_LEAVE",
    asOfDate: "2026-09-01",
    grantedDays: 28,
    grantedMinutes: null,
    usedDays: 7,
    usedMinutes: 240,
    remainingDays,
    remainingMinutes: 0,
    confidence: 1,
    sourceRowIndex: 2,
    createdAt: "2026-09-01T00:00:00.000Z",
    deletedAt: null,
  };
}

describe("annual leave summary", () => {
  it("keeps full-day and partial leave separate without a workday setting", () => {
    const summary = getAnnualLeaveSummary({
      events: [event("a", true, null), event("b", false, 240)],
      snapshots: [],
      entitlementDays: 28,
      workdayMinutes: null,
    });

    expect(summary.fullDayEvents).toBe(1);
    expect(summary.partialMinutes).toBe(240);
    expect(summary.remainingMinutes).toBeNull();
  });

  it("reconciles event-derived balance against an institution snapshot", () => {
    const summary = getAnnualLeaveSummary({
      events: [event("a", true, null), event("b", false, 240)],
      snapshots: [snapshot(26)],
      entitlementDays: 28,
      workdayMinutes: 480,
    });

    expect(formatLeaveMinutes(summary.remainingMinutes ?? 0, 480)).toBe(
      "26일 4시간",
    );
    expect(summary.discrepancyMinutes).toBe(240);
  });
});
