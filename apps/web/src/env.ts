import { z } from "zod";

const appEnvironmentSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/^next_public_app_env\s*=\s*/, "")
      .replace(/^['"]|['"]$/g, "");

    if (normalized === "") {
      return undefined;
    }

    const aliases: Record<string, "development" | "staging" | "production"> = {
      dev: "development",
      development: "development",
      preview: "staging",
      stage: "staging",
      staging: "staging",
      prod: "production",
      production: "production",
    };

    return aliases[normalized] ?? normalized;
  },
  z.enum(["development", "staging", "production"]).optional(),
);

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_APP_ENV: appEnvironmentSchema,
});

export function validateEnvironment(raw: Record<string, string | undefined>) {
  return environmentSchema.parse(raw);
}

export const environment = validateEnvironment({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});
