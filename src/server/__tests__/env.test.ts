// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetEnvCacheForTests, getEnv } from "@/server/env";

describe("getEnv", () => {
  const original = { ...process.env };

  beforeEach(() => {
    __resetEnvCacheForTests();
    // Wipe to a known minimal state so defaults & required checks are deterministic.
    for (const key of ["NODE_ENV", "MONGO_URI", "JWT_SECRET", "JWT_EXPIRATION_TIME"]) {
      delete (process.env as Record<string, string | undefined>)[key];
    }
  });

  afterEach(() => {
    process.env = { ...original };
    __resetEnvCacheForTests();
  });

  it("rejects boot when JWT_SECRET is missing", () => {
    process.env.MONGO_URI = "mongodb://x";
    expect(() => getEnv()).toThrow(/JWT_SECRET/);
  });

  it("rejects boot when MONGO_URI is missing", () => {
    process.env.JWT_SECRET = "x".repeat(32);
    expect(() => getEnv()).toThrow(/MONGO_URI/);
  });

  it("rejects a weak JWT_SECRET in production", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    process.env.JWT_SECRET = "dev_jwt_secret";
    process.env.MONGO_URI = "mongodb://x";
    expect(() => getEnv()).toThrow(/at least 32 characters/);
  });

  it("accepts a JWT_SECRET of exactly 32 characters in production (boundary)", () => {
    // Kills EqualityOperator `< → <=` on length check (line 31).
    (process.env as Record<string, string>).NODE_ENV = "production";
    process.env.JWT_SECRET = "x".repeat(32);
    process.env.MONGO_URI = "mongodb://x";
    expect(() => getEnv()).not.toThrow();
  });

  it("accepts a short JWT_SECRET outside production", () => {
    // Kills ConditionalExpression `true` on the production gate (line 31):
    // if forced true, this test would throw.
    (process.env as Record<string, string>).NODE_ENV = "test";
    process.env.JWT_SECRET = "short";
    process.env.MONGO_URI = "mongodb://x";
    expect(() => getEnv()).not.toThrow();
  });

  it("returns a typed and parsed env on success", () => {
    (process.env as Record<string, string>).NODE_ENV = "test";
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    process.env.JWT_EXPIRATION_TIME = "7200";
    const env = getEnv();
    expect(env.JWT_EXPIRATION_TIME).toBe(7200);
    expect(env.MONGO_URI).toBe("mongodb://x");
    expect(env.NODE_ENV).toBe("test");
  });

  it("defaults NODE_ENV to 'development' when unset", () => {
    // Kills StringLiteral mutation on `.default("development")` (line 4).
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    expect(getEnv().NODE_ENV).toBe("development");
  });

  it("accepts 'development' as a valid NODE_ENV (enum membership)", () => {
    // Kills StringLiteral mutation on enum entry "development" (line 4):
    // if removed, parsing would fail.
    (process.env as Record<string, string>).NODE_ENV = "development";
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    expect(getEnv().NODE_ENV).toBe("development");
  });

  it("defaults JWT_EXPIRATION_TIME to 86400 seconds when unset", () => {
    // Kills StringLiteral mutation on `.default("86400")` (line 9).
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    expect(getEnv().JWT_EXPIRATION_TIME).toBe(86400);
  });

  it("rejects a non-numeric JWT_EXPIRATION_TIME", () => {
    // Kills ConditionalExpression `false` and LogicalOperator `|| → &&` on line 12
    // (the !isFinite branch) by tripping the `!isFinite` side alone.
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    process.env.JWT_EXPIRATION_TIME = "not-a-number";
    expect(() => getEnv()).toThrow(/JWT_EXPIRATION_TIME/);
  });

  it("rejects JWT_EXPIRATION_TIME=0 (boundary, must be strictly positive)", () => {
    // Kills EqualityOperator `<= → <` on line 12: with `<`, 0 would pass.
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    process.env.JWT_EXPIRATION_TIME = "0";
    expect(() => getEnv()).toThrow(/JWT_EXPIRATION_TIME/);
  });

  it("rejects a negative JWT_EXPIRATION_TIME", () => {
    // Kills ConditionalExpression `false` on the n<=0 branch (line 12)
    // and LogicalOperator `|| → &&` (negative is finite, so only the right side fires).
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    process.env.JWT_EXPIRATION_TIME = "-1";
    expect(() => getEnv()).toThrow(/JWT_EXPIRATION_TIME/);
  });

  it("caches the parsed env across calls", () => {
    // Kills ConditionalExpression `if (cached) → false` (line 24): without the
    // short-circuit, the second call would re-read process.env and throw.
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    const first = getEnv();
    // Mutate process.env to invalid state — a non-cached implementation would crash.
    delete process.env.JWT_SECRET;
    delete process.env.MONGO_URI;
    const second = getEnv();
    expect(second).toBe(first);
  });

  it("__resetEnvCacheForTests forces a fresh parse on next call", () => {
    // Kills BlockStatement mutation that empties the reset body (line 41):
    // without the reset, the second call would still return the stale env.
    process.env.JWT_SECRET = "first";
    process.env.MONGO_URI = "mongodb://first";
    expect(getEnv().MONGO_URI).toBe("mongodb://first");
    process.env.JWT_SECRET = "second";
    process.env.MONGO_URI = "mongodb://second";
    __resetEnvCacheForTests();
    expect(getEnv().MONGO_URI).toBe("mongodb://second");
  });

  it("includes the offending variable name in the aggregated error message", () => {
    // Kills StringLiteral mutations on the issue formatter (line 27, the "."
    // path separator) and the wrapper prefix (line 28): if either is "", the
    // assembled message would no longer contain "JWT_SECRET".
    process.env.MONGO_URI = "mongodb://x";
    expect(() => getEnv()).toThrow(/Invalid server environment:.*JWT_SECRET/);
  });
});
