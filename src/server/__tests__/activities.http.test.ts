// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import activitiesHandler from "@/pages/api/activities";
import activityByIdHandler from "@/pages/api/activities/[id]";
import loginHandler from "@/pages/api/auth/login";
import registerHandler from "@/pages/api/auth/register";
import { __resetRateLimitForTests } from "@/server/rate-limit";
import { callHandler, extractCookie } from "./helpers/mock-http";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

async function authenticate(): Promise<string> {
  const email = `u-${randomUUID()}@example.com`;
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

describe("activities HTTP handlers", () => {
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

  describe("GET /api/activities/[id]", () => {
    it("returns 200 with a DTO that excludes the owner email", async () => {
      const jwt = await authenticate();
      const created = await callHandler(activitiesHandler, {
        method: "POST",
        cookies: { jwt },
        body: { name: "Yoga", city: "Paris", description: "Une session de yoga", price: 20 },
      });
      expect(created.status).toBe(201);
      const { id } = created.body as { id: string };

      const res = await callHandler(activityByIdHandler, {
        method: "GET",
        query: { id },
      });
      expect(res.status).toBe(200);
      const dto = res.body as Record<string, unknown>;
      expect(dto).toMatchObject({ id, name: "Yoga", city: "Paris", price: 20 });
      // Le DTO public ne doit pas exposer l'email du propriétaire
      expect((dto.owner as Record<string, unknown>).email).toBeUndefined();
    });

    it("returns 404 for a malformed id", async () => {
      const res = await callHandler(activityByIdHandler, {
        method: "GET",
        query: { id: "not-an-objectid" },
      });
      expect(res.status).toBe(404);
    });

    it("returns 404 for a well-formed but unknown ObjectId", async () => {
      const res = await callHandler(activityByIdHandler, {
        method: "GET",
        query: { id: "000000000000000000000000" },
      });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/activities — auth guard", () => {
    it("returns 401 without an auth cookie", async () => {
      const res = await callHandler(activitiesHandler, {
        method: "POST",
        body: { name: "Yoga", city: "Paris", description: "Une session", price: 20 },
      });
      expect(res.status).toBe(401);
    });
  });
});
