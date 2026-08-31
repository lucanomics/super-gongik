import {
  compareDateOnly,
  differenceInCalendarDays,
  type DateOnly,
} from "./date-only";
import type { ServiceProfile } from "./profile";

export type ServiceState = "NOT_STARTED" | "IN_SERVICE" | "COMPLETED";

export type ServiceProgress = {
  state: ServiceState;
  today: DateOnly;
  totalServiceDays: number;
  elapsedDays: number;
  remainingDays: number;
  dDay: number;
  completionPercentage: number;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateServiceProgress(
  profile: Pick<ServiceProfile, "callUpDate" | "expectedDischargeDate">,
  today: DateOnly,
): ServiceProgress {
  if (compareDateOnly(profile.callUpDate, profile.expectedDischargeDate) > 0) {
    throw new RangeError("Call-up date must not be after discharge date.");
  }

  const totalServiceDays = Math.max(
    0,
    differenceInCalendarDays(profile.expectedDischargeDate, profile.callUpDate),
  );
  const beforeCallUp = compareDateOnly(today, profile.callUpDate) < 0;
  const onOrAfterDischarge =
    compareDateOnly(today, profile.expectedDischargeDate) >= 0;

  if (beforeCallUp) {
    return {
      state: "NOT_STARTED",
      today,
      totalServiceDays,
      elapsedDays: 0,
      remainingDays: totalServiceDays,
      dDay: differenceInCalendarDays(profile.expectedDischargeDate, today),
      completionPercentage: 0,
    };
  }

  if (onOrAfterDischarge || totalServiceDays === 0) {
    return {
      state: "COMPLETED",
      today,
      totalServiceDays,
      elapsedDays: totalServiceDays,
      remainingDays: 0,
      dDay: 0,
      completionPercentage: 100,
    };
  }

  const elapsedDays = clamp(
    differenceInCalendarDays(today, profile.callUpDate),
    0,
    totalServiceDays,
  );
  const remainingDays = totalServiceDays - elapsedDays;

  return {
    state: "IN_SERVICE",
    today,
    totalServiceDays,
    elapsedDays,
    remainingDays,
    dDay: remainingDays,
    completionPercentage: Number(
      ((elapsedDays / totalServiceDays) * 100).toFixed(1),
    ),
  };
}

export function calculateServiceMonthIndex(
  callUpDate: DateOnly,
  asOfDate: DateOnly,
): number {
  if (compareDateOnly(asOfDate, callUpDate) < 0) {
    throw new RangeError(
      "Service month is unavailable before the call-up date.",
    );
  }

  const [callUpYear, callUpMonth] = callUpDate.split("-").map(Number);
  const [asOfYear, asOfMonth] = asOfDate.split("-").map(Number);
  return (asOfYear - callUpYear) * 12 + asOfMonth - callUpMonth;
}

export function isPartialServiceMonth(
  profile: Pick<ServiceProfile, "callUpDate" | "expectedDischargeDate">,
  asOfDate: DateOnly,
): boolean {
  const month = asOfDate.slice(0, 7);
  return (
    profile.callUpDate.slice(0, 7) === month ||
    profile.expectedDischargeDate.slice(0, 7) === month
  );
}
