import type {
  StoredLeaveSnapshot,
  StoredServiceEvent,
} from "@/lib/service-record-storage";

export interface AnnualLeaveSummary {
  fullDayEvents: number;
  partialMinutes: number;
  remainingMinutes: number | null;
  institutionSnapshot: StoredLeaveSnapshot | null;
  discrepancyMinutes: number | null;
}

export function getAnnualLeaveSummary(input: {
  events: StoredServiceEvent[];
  snapshots: StoredLeaveSnapshot[];
  entitlementDays: number | null;
  workdayMinutes: number | null;
}): AnnualLeaveSummary {
  const annualEvents = input.events.filter(
    (event) => event.eventType === "ANNUAL_LEAVE" && !event.deletedAt,
  );
  const fullDayEvents = annualEvents.filter(
    (event) => event.allDay && event.durationMinutes === null,
  ).length;
  const partialMinutes = annualEvents.reduce(
    (sum, event) => sum + (event.durationMinutes ?? 0),
    0,
  );

  let remainingMinutes: number | null = null;
  if (input.entitlementDays !== null && input.workdayMinutes !== null) {
    remainingMinutes = Math.max(
      0,
      input.entitlementDays * input.workdayMinutes -
        fullDayEvents * input.workdayMinutes -
        partialMinutes,
    );
  }

  const institutionSnapshot =
    input.snapshots
      .filter(
        (snapshot) =>
          !snapshot.deletedAt && snapshot.leaveType === "ANNUAL_LEAVE",
      )
      .sort((a, b) => {
        const aKey = a.asOfDate ?? a.createdAt;
        const bKey = b.asOfDate ?? b.createdAt;
        return bKey.localeCompare(aKey);
      })[0] ?? null;

  let discrepancyMinutes: number | null = null;
  if (
    remainingMinutes !== null &&
    institutionSnapshot &&
    input.workdayMinutes !== null &&
    (institutionSnapshot.remainingDays !== null ||
      institutionSnapshot.remainingMinutes !== null)
  ) {
    const institutionMinutes =
      (institutionSnapshot.remainingDays ?? 0) * input.workdayMinutes +
      (institutionSnapshot.remainingMinutes ?? 0);
    discrepancyMinutes = remainingMinutes - institutionMinutes;
  }

  return {
    fullDayEvents,
    partialMinutes,
    remainingMinutes,
    institutionSnapshot,
    discrepancyMinutes,
  };
}

export function formatLeaveMinutes(minutes: number, workdayMinutes: number) {
  const safe = Math.max(0, minutes);
  const days = Math.floor(safe / workdayMinutes);
  const remainder = safe % workdayMinutes;
  const hours = Math.floor(remainder / 60);
  const mins = remainder % 60;
  const pieces = [`${days}일`];
  if (hours) pieces.push(`${hours}시간`);
  if (mins) pieces.push(`${mins}분`);
  return pieces.join(" ");
}

export function formatPartialMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}분`;
  if (!mins) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}
