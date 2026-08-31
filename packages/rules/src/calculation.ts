import type { RuleBundle, RuleDomain } from "./schema";

export type RuleSourceReference = {
  title: string;
  authority: string;
  url: string;
};

export type CalculationResult<TValue, TStatus extends string = "SUPPORTED"> = {
  domain: RuleDomain;
  status: TStatus;
  value: TValue | null;
  ruleId: string;
  ruleVersion: string;
  effectiveDate: string;
  verifiedAt: string;
  inputs: Record<string, unknown>;
  breakdown: Record<string, unknown>;
  assumptions: string[];
  warnings: string[];
  sources: RuleSourceReference[];
};

export type CalculationSnapshot<TValue, TStatus extends string = string> = {
  id: string;
  generatedAt: string;
  result: CalculationResult<TValue, TStatus>;
};

type ResultInput<TValue, TStatus extends string> = {
  domain: RuleDomain;
  status: TStatus;
  value: TValue | null;
  bundle: RuleBundle;
  inputs: Record<string, unknown>;
  breakdown?: Record<string, unknown>;
  assumptions?: string[];
  warnings?: string[];
};

export function createCalculationResult<
  TValue,
  TStatus extends string = "SUPPORTED",
>({
  domain,
  status,
  value,
  bundle,
  inputs,
  breakdown = {},
  assumptions = [],
  warnings = [],
}: ResultInput<TValue, TStatus>): CalculationResult<TValue, TStatus> {
  return {
    domain,
    status,
    value,
    ruleId: bundle.ruleId,
    ruleVersion: bundle.version,
    effectiveDate: bundle.effectiveFrom,
    verifiedAt: bundle.verifiedAt,
    inputs,
    breakdown,
    assumptions,
    warnings,
    sources: bundle.sources.map((source) => ({
      title: source.title,
      authority: source.authority,
      url: source.url,
    })),
  };
}

export function createCalculationSnapshot<
  TValue,
  TStatus extends string = string,
>(
  result: CalculationResult<TValue, TStatus>,
  metadata: { id: string; generatedAt: string },
): CalculationSnapshot<TValue, TStatus> {
  return {
    id: metadata.id,
    generatedAt: metadata.generatedAt,
    result,
  };
}
