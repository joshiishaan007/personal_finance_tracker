import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  // Overridable so you can point at whichever model has free-tier quota on your
  // key (gemini-2.0-flash's free tier can be 0). Verify in Google AI Studio.
  GEMINI_MODEL: z.string().min(1).default('gemini-2.0-flash-lite'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

// Lazy + throwing (serverless has no process.exit lifecycle). Validated on first server use.
export function getEnv(): Env {
  if (cached) return cached;
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${JSON.stringify(result.error.format())}`);
  }
  cached = result.data;
  return cached;
}
