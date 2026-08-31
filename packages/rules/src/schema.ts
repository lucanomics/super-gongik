import { compareDateOnly, isDateOnly } from "@super-gongik/domain";
import { z } from "zod";

export const ruleLifecycleStateSchema = z.enum([
  "DRAFT",
  "VERIFIED",
  "SUPERSEDED",
  "RETIRED",
]);

export type RuleLifecycleState = z.infer<typeof ruleLifecycleStateSchema>;

export const ruleAutomationStatusSchema = z.enum([
  "VERIFIED",
  "VERIFIED_CONTEXTUAL",
  "REQUIRES_SOURCE_TABLE",
  "REQUIRES_INSTITUTION_INPUT",
  "DO_NOT_AUTOCALCULATE",
  "DRAFT",
  "SUPERSEDED",
  "RETIRED",
]);

export type RuleAutomationStatus = z.infer<typeof ruleAutomationStatusSchema>;

export const ruleDomainSchema = z.enum(["SERVICE", "LEAVE", "COMPENSATION"]);

export type RuleDomain = z.infer<typeof ruleDomainSchema>;

const dateOnlySchema = z
  .string()
  .refine(isDateOnly, "Rule dates must use a valid YYYY-MM-DD value.");

export const ruleSourceSchema = z
  .object({
    title: z.string().min(1),
    authority: z.string().min(1),
    sourceType: z.string().min(1),
    url: z.string().url(),
  })
  .passthrough();

export const ruleBundleSchema = z
  .object({
    schemaVersion: z.string().min(1),
    ruleId: z.string().min(1),
    version: z.string().min(1),
    effectiveFrom: dateOnlySchema,
    effectiveUntil: dateOnlySchema.nullable(),
    verifiedAt: dateOnlySchema,
    status: ruleAutomationStatusSchema,
    jurisdiction: z.literal("KR"),
    sources: z.array(ruleSourceSchema).min(1),
  })
  .passthrough()
  .superRefine((bundle, context) => {
    if (
      bundle.effectiveUntil !== null &&
      compareDateOnly(bundle.effectiveFrom, bundle.effectiveUntil) > 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["effectiveUntil"],
        message: "A rule cannot end before its effective date.",
      });
    }
  });

export type RuleBundle = z.output<typeof ruleBundleSchema>;

export function parseRuleBundle(value: unknown): RuleBundle {
  return ruleBundleSchema.parse(value);
}

export function getRuleLifecycleState(bundle: RuleBundle): RuleLifecycleState {
  if (
    bundle.status === "DRAFT" ||
    bundle.status === "SUPERSEDED" ||
    bundle.status === "RETIRED"
  ) {
    return bundle.status;
  }

  return "VERIFIED";
}
