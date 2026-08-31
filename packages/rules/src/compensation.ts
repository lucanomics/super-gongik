import type { DateOnly } from "@super-gongik/domain";

import {
  COMPENSATION_RULE_BUNDLES,
  type CompensationRuleBundle,
} from "./bundles";
import { createCalculationResult } from "./calculation";
import { selectRuleByDate } from "./selector";

function requireCompensationRule(calendarYear: number): CompensationRuleBundle {
  const date = `${calendarYear}-01-01` as DateOnly;
  const selection = selectRuleByDate(
    "COMPENSATION",
    COMPENSATION_RULE_BUNDLES,
    date,
  );
  if (selection.status !== "SUPPORTED") {
    throw new RangeError(selection.warnings.join(" "));
  }

  return selection.rule;
}

export function calculateMonthlyBasePay(input: {
  calendarYear: number;
  serviceMonthIndex: number;
}) {
  const bundle = requireCompensationRule(input.calendarYear);
  const band = bundle.basePay.serviceMonthBands.find(
    (candidate) =>
      input.serviceMonthIndex >= candidate.fromServiceMonth &&
      (candidate.toServiceMonth === null ||
        input.serviceMonthIndex <= candidate.toServiceMonth),
  );

  if (!band) {
    throw new RangeError("No verified base-pay band applies.");
  }

  return createCalculationResult({
    domain: "COMPENSATION",
    status: "SUPPORTED" as const,
    value: { monthlyBasePay: band.monthlyAmount },
    bundle,
    inputs: input,
    breakdown: {
      equivalentRank: band.equivalentRank,
      fromServiceMonth: band.fromServiceMonth,
      toServiceMonth: band.toServiceMonth,
    },
    assumptions: ["prior-service credit이 없는 일반 복무월 구간입니다."],
  });
}

export function evaluateMealAllowance(input: {
  calendarYear: number;
  mealRateConfirmedByProfile: boolean;
  eligibleServiceDays?: number;
}) {
  const bundle = requireCompensationRule(input.calendarYear);
  const suggestedRate = bundle.meal.suggestedDailyAmount;

  if (!input.mealRateConfirmedByProfile) {
    return createCalculationResult({
      domain: "COMPENSATION",
      status: "REQUIRES_PROFILE_CONFIRMATION" as const,
      value: null,
      bundle,
      inputs: input,
      breakdown: {
        suggestedDailyMealRate: suggestedRate,
        mustExposeAssumption: true,
      },
      assumptions: ["KRW 9,000은 2026년 제안값이며 기관 확인 전입니다."],
      warnings: [bundle.meal.warning],
    });
  }

  if (input.eligibleServiceDays === undefined) {
    return createCalculationResult({
      domain: "COMPENSATION",
      status: "UNSUPPORTED_MISSING_CONTEXT" as const,
      value: null,
      bundle,
      inputs: input,
      breakdown: { missingFields: ["eligibleServiceDays"] },
      warnings: ["중식비 계산에는 대상 복무일 수가 필요합니다."],
    });
  }

  return createCalculationResult({
    domain: "COMPENSATION",
    status: "SUPPORTED" as const,
    value: {
      dailyMealRate: suggestedRate,
      mealAllowance: suggestedRate * input.eligibleServiceDays,
    },
    bundle,
    inputs: input,
    breakdown: { eligibleServiceDays: input.eligibleServiceDays },
    assumptions: ["프로필에서 2026년 제안 중식비를 확인했습니다."],
  });
}

export function calculateTransportAllowance(input: {
  calendarYear: number;
  commuteFareOrInstitutionApprovedTransportRate: number | null;
  eligibleServiceDays: number;
}) {
  const bundle = requireCompensationRule(input.calendarYear);
  if (input.commuteFareOrInstitutionApprovedTransportRate === null) {
    return createCalculationResult({
      domain: "COMPENSATION",
      status: "UNSUPPORTED_MISSING_CONTEXT" as const,
      value: null,
      bundle,
      inputs: input,
      breakdown: {
        missingFields: ["commuteFareOrInstitutionApprovedTransportRate"],
      },
      warnings: [bundle.transport.warning],
    });
  }

  return createCalculationResult({
    domain: "COMPENSATION",
    status: "SUPPORTED" as const,
    value: {
      transportAllowance:
        input.commuteFareOrInstitutionApprovedTransportRate *
        input.eligibleServiceDays,
    },
    bundle,
    inputs: input,
    breakdown: { eligibleServiceDays: input.eligibleServiceDays },
  });
}

export function evaluateCompensationSafetyGate(input: {
  calendarYear: number;
  partialMonth?: boolean;
  periodType?: string;
  hasPriorServiceCreditCase?: boolean;
}) {
  const bundle = requireCompensationRule(input.calendarYear);

  if (input.hasPriorServiceCreditCase) {
    return createCalculationResult({
      domain: "COMPENSATION",
      status: "UNSUPPORTED_PENDING_PRIOR_SERVICE_PROFILE_MODEL" as const,
      value: null,
      bundle,
      inputs: input,
      breakdown: { mustNotInferCredit: true },
      warnings: [bundle.basePay.priorServiceCredit.reason],
    });
  }

  if (input.partialMonth) {
    return createCalculationResult({
      domain: "COMPENSATION",
      status: "UNSUPPORTED_PENDING_EXACT_PRORATION_ARITHMETIC" as const,
      value: null,
      bundle,
      inputs: input,
      breakdown: { mustNotGuessDivisor: true },
      warnings: [bundle.proration.firstAndLastMonth.reason],
    });
  }

  return createCalculationResult({
    domain: "COMPENSATION",
    status: "SUPPORTED" as const,
    value: { safeToCalculateVerifiedComponents: true },
    bundle,
    inputs: input,
  });
}
