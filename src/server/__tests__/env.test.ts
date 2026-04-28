// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetEnvCacheForTests, getEnv } from "@/server/env";

describe("getEnv", () => {
  const original = { ...process.env };

  beforeEach(() => {
    __resetEnvCacheForTests();
  });

  afterEach(() => {
    process.env = { ...original };
    __resetEnvCacheForTests();
  });

  it("rejects boot when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET;
    process.env.MONGO_URI = "mongodb://x";
    expect(() => getEnv()).toThrow(/JWT_SECRET/);
  });

  it("rejects boot when MONGO_URI is missing", () => {
    process.env.JWT_SECRET = "x".repeat(32);
    delete process.env.MONGO_URI;
    expect(() => getEnv()).toThrow(/MONGO_URI/);
  });

  it("rejects a weak JWT_SECRET in production", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    process.env.JWT_SECRET = "dev_jwt_secret";
    process.env.MONGO_URI = "mongodb://x";
    expect(() => getEnv()).toThrow(/at least 32 characters/);
  });

  it("returns a typed and parsed env on success", () => {
    (process.env as Record<string, string>).NODE_ENV = "test";
    process.env.JWT_SECRET = "ok";
    process.env.MONGO_URI = "mongodb://x";
    process.env.JWT_EXPIRATION_TIME = "7200";
    const env = getEnv();
    expect(env.JWT_EXPIRATION_TIME).toBe(7200);
    expect(env.MONGO_URI).toBe("mongodb://x");
  });
});
