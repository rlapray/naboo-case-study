import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRATION_TIME: z
    .string()
    .default("86400")
    .transform((v) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) {
        throw new Error("JWT_EXPIRATION_TIME must be a positive number of seconds");
      }
      return n;
    }),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new Error(`Invalid server environment: ${issues.join("; ")}`);
  }
  // In production, refuse to boot with the well-known dev secret.
  if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters in production (rotate the dev value)",
    );
  }
  cached = parsed.data;
  return cached;
}

// Test-only.
export function __resetEnvCacheForTests(): void {
  cached = null;
}
