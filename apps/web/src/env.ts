import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "production"])
    .optional(),
});

export function validateEnvironment(raw: Record<string, string | undefined>) {
  return environmentSchema.parse(raw);
}

export const environment = validateEnvironment({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
});
