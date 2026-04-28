// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import loginHandler from "@/pages/api/auth/login";
import registerHandler from "@/pages/api/auth/register";
import { __resetRateLimitForTests } from "@/server/rate-limit";
import { callHandler } from "./helpers/mock-http";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

describe("auth routes — rate limiting", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRATION_TIME = "3600";
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    __resetRateLimitForTests();
  });

  it("returns 429 with Retry-After once the login burst exceeds 10 attempts", async () => {
    const attempt = () =>
      callHandler(loginHandler, {
        method: "POST",
        body: { email: "nobody@example.com", password: "x" },
      });

    // 10 attempts within the window: each fails on credentials (400) but is allowed.
    for (let i = 0; i < 10; i++) {
      const r = await attempt();
      expect(r.status).toBe(400);
    }

    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("rate-limits register independently with a stricter budget (5/min)", async () => {
    const attempt = (i: number) =>
      callHandler(registerHandler, {
        method: "POST",
        body: {
          email: `u${i}@example.com`,
          password: "password1",
          firstName: "A",
          lastName: "B",
        },
      });

    for (let i = 0; i < 5; i++) {
      const r = await attempt(i);
      expect(r.status).toBe(201);
    }

    const blocked = await attempt(99);
    expect(blocked.status).toBe(429);
  });
});
