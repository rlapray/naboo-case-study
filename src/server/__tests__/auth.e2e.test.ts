// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import loginHandler from "@/pages/api/auth/login";
import registerHandler from "@/pages/api/auth/register";
import meHandler from "@/pages/api/me";
import { callHandler, extractCookie } from "./helpers/mock-http";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

describe("auth e2e (register → login → me)", () => {
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
  });

  it("registers, logs in and returns the current user via /api/me", async () => {
    const email = `${randomUUID()}@test.com`;
    const password = randomUUID();

    const register = await callHandler(registerHandler, {
      method: "POST",
      body: { email, password, firstName: "firstName", lastName: "lastName" },
    });
    expect(register.status).toBe(201);
    expect(register.body).toMatchObject({ email });

    const login = await callHandler(loginHandler, {
      method: "POST",
      body: { email, password },
    });
    expect(login.status).toBe(200);
    const token = extractCookie(login.headers, "jwt");
    expect(token).toBeTruthy();

    const me = await callHandler(meHandler, {
      method: "GET",
      cookies: { jwt: token! },
    });
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({
      email,
      firstName: "firstName",
      lastName: "lastName",
    });
  });

  it("rejects /api/me without a cookie", async () => {
    const res = await callHandler(meHandler, { method: "GET" });
    expect(res.status).toBe(401);
  });
});
