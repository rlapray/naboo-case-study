// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import activitiesHandler from "@/pages/api/activities";
import loginHandler from "@/pages/api/auth/login";
import registerHandler from "@/pages/api/auth/register";
import { __resetRateLimitForTests } from "@/server/rate-limit";
import { callHandler, extractCookie } from "./helpers/mock-http";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

async function authenticate(): Promise<string> {
  const email = `u-${Date.now()}@example.com`;
  await callHandler(registerHandler, {
    method: "POST",
    body: { email, password: "pw1", firstName: "F", lastName: "L" },
  });
  const login = await callHandler(loginHandler, {
    method: "POST",
    body: { email, password: "pw1" },
  });
  return extractCookie(login.headers, "jwt")!;
}

describe("POST /api/activities — input length limits", () => {
  beforeAll(async () => {
    await startTestDb();
  });
  afterAll(async () => {
    await stopTestDb();
  });
  beforeEach(async () => {
    await clearTestDb();
    __resetRateLimitForTests();
  });

  it("rejects oversize description with 400 (no DB pollution)", async () => {
    const jwt = await authenticate();
    const res = await callHandler(activitiesHandler, {
      method: "POST",
      cookies: { jwt },
      body: {
        name: "Yoga",
        city: "Rouen",
        description: "x".repeat(5000),
        price: 30,
      },
    });
    expect(res.status).toBe(400);
  });

  it("accepts a payload at the upper limits", async () => {
    const jwt = await authenticate();
    const res = await callHandler(activitiesHandler, {
      method: "POST",
      cookies: { jwt },
      body: {
        name: "x".repeat(120),
        city: "x".repeat(120),
        description: "x".repeat(2000),
        price: 1000,
      },
    });
    expect(res.status).toBe(201);
  });
});
