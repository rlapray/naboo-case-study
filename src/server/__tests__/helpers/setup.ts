import { afterAll, beforeAll, beforeEach } from "vitest";
import { __resetRateLimitForTests } from "@/server/rate-limit";
import { clearTestDb, startTestDb, stopTestDb } from "./test-db";

export function useServerTestEnv(opts: { rateLimit?: boolean; jwt?: boolean } = {}) {
  const { rateLimit = true, jwt = true } = opts;

  beforeAll(async () => {
    if (jwt) {
      process.env.JWT_SECRET = "test_secret";
      process.env.JWT_EXPIRATION_TIME = "3600";
    }
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    if (rateLimit) __resetRateLimitForTests();
  });
}
