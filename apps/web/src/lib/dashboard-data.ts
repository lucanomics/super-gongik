import {
  calculateServiceMonthIndex,
  calculateServiceProgress,
  isPartialServiceMonth,
  type DateOnly,
  type ServiceProfile,
} from "@super-gongik/domain";
import {
  calculateAnnualLeaveAllocation,
  calculateMonthlyBasePay,
  calculateTransportAllowance,
  evaluateCompensationSafetyGate,
  evaluateMealAllowance,
} from "@super-gongik/rules";

export type CompensationPreview = {
  status: "READY_FOR_CONTEXT" | "GATED" | "UNSUPPORTED";
  basePay: number | null;
  suggestedMealRate: number | null;
  transportConfigured: boolean;
  message: string;
  ruleVersion: string | null;
};

export function getDashboardProjection(
  profile: ServiceProfile,
  today: DateOnly,
) {
  const progress = calculateServiceProgress(profile, today);
  const annualLeave = calculateAnnualLeaveAllocation(21).value;

  return {
    progress,
    annualLeaveDays: annualLeave?.ordinaryTotalDays ?? null,
    compensation: getCompensationPreview(profile, today),
  };
}

export function getCompensationPreview(
  profile: ServiceProfile,
  today: DateOnly,
): CompensationPreview {
  const calendarYear = Number(today.slice(0, 4));

  try {
    const gate = evaluateCompensationSafetyGate({
      calendarYear,
      partialMonth: isPartialServiceMonth(profile, today),
    });

    if (gate.status !== "SUPPORTED") {
      return {
        status: "GATED",
        basePay: null,
        suggestedMealRate: null,
        transportConfigured: profile.defaultCommuteCost !== null,
        message:
          "첫·마지막 달 보수 산식은 검증이 끝나기 전까지 자동 계산하지 않아요.",
        ruleVersion: gate.ruleVersion,
      };
    }

    const serviceMonthIndex = calculateServiceMonthIndex(
      profile.callUpDate,
      today,
    );
    const basePay = calculateMonthlyBasePay({
      calendarYear,
      serviceMonthIndex,
    });
    const meal = evaluateMealAllowance({
      calendarYear,
      mealRateConfirmedByProfile: false,
    });
    const transport = calculateTransportAllowance({
      calendarYear,
      commuteFareOrInstitutionApprovedTransportRate: profile.defaultCommuteCost,
      eligibleServiceDays: 0,
    });

    return {
      status: "READY_FOR_CONTEXT",
      basePay: basePay.value?.monthlyBasePay ?? null,
      suggestedMealRate:
        typeof meal.breakdown.suggestedDailyMealRate === "number"
          ? meal.breakdown.suggestedDailyMealRate
          : null,
      transportConfigured: transport.status === "SUPPORTED",
      message:
        "중식비는 제안값 확인, 교통비는 통근비 입력 뒤에만 추정에 포함합니다.",
      ruleVersion: basePay.ruleVersion,
    };
  } catch {
    return {
      status: "UNSUPPORTED",
      basePay: null,
      suggestedMealRate: null,
      transportConfigured: profile.defaultCommuteCost !== null,
      message: `${calendarYear}년에는 적용 가능한 검증 보수 규칙이 없습니다.`,
      ruleVersion: null,
    };
  }
}
