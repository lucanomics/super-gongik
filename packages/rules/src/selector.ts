import {
  compareDateOnly,
  isDateOnly,
  type DateOnly,
} from "@super-gongik/domain";

import {
  getRuleLifecycleState,
  type RuleBundle,
  type RuleDomain,
} from "./schema";

export type RuleSelection<TBundle extends RuleBundle> =
  | {
      status: "SUPPORTED";
      domain: RuleDomain;
      calculationDate: DateOnly;
      rule: TBundle;
      warnings: string[];
    }
  | {
      status: "UNSUPPORTED_NO_APPLICABLE_RULE" | "UNSUPPORTED_AMBIGUOUS_RULES";
      domain: RuleDomain;
      calculationDate: DateOnly;
      candidateRuleVersions: string[];
      warnings: string[];
    };

export function selectRuleByDate<TBundle extends RuleBundle>(
  domain: RuleDomain,
  bundles: readonly TBundle[],
  calculationDate: DateOnly,
): RuleSelection<TBundle> {
  if (!isDateOnly(calculationDate)) {
    throw new RangeError("Rule selection requires a valid date-only value.");
  }

  const applicable = bundles.filter((bundle) => {
    const isActive = getRuleLifecycleState(bundle) === "VERIFIED";
    const began = compareDateOnly(bundle.effectiveFrom, calculationDate) <= 0;
    const hasNotEnded =
      bundle.effectiveUntil === null ||
      compareDateOnly(calculationDate, bundle.effectiveUntil) <= 0;

    return isActive && began && hasNotEnded;
  });

  if (applicable.length === 0) {
    return {
      status: "UNSUPPORTED_NO_APPLICABLE_RULE",
      domain,
      calculationDate,
      candidateRuleVersions: [],
      warnings: [
        `${calculationDate}에 적용 가능한 검증 규칙이 없습니다. 다른 연도 규칙으로 대체하지 않았습니다.`,
      ],
    };
  }

  if (applicable.length > 1) {
    return {
      status: "UNSUPPORTED_AMBIGUOUS_RULES",
      domain,
      calculationDate,
      candidateRuleVersions: applicable.map((bundle) => bundle.version),
      warnings: ["같은 날짜에 둘 이상의 규칙이 적용되어 계산을 중단했습니다."],
    };
  }

  return {
    status: "SUPPORTED",
    domain,
    calculationDate,
    rule: applicable[0],
    warnings: [],
  };
}
