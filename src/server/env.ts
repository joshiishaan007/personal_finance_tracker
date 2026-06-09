import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  // Overridable via GEMINI_MODEL in .env.local. Verify the exact model ID in
  // Google AI Studio → "My models" or the model card URL slug.
  // gemini-2.5-flash: generous free RPD, fast. gemma-3-27b-it: unlimited RPD.
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  // Bearer secret Vercel Cron sends with scheduled invocations. Optional so a
  // missing value never 500s the whole app — but the cron route fails CLOSED
  // (401) when it is absent, so the endpoint can never run unauthenticated.
  CRON_SECRET: z.string().min(16).optional(),
  // Web-push VAPID keys (server-only). Optional: push is a progressive feature.
  VAPID_PUBLIC_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_EMAIL: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

// Lazy + throwing (serverless has no process.exit lifecycle). Validated on first server use.
export function getEnv(): Env {
  if (cached) return cached;
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(result.error.format())}`,
    );
  }
  cached = result.data;
  return cached;
}
