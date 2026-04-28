// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import loginHandler from "@/pages/api/auth/login";
import logoutHandler from "@/pages/api/auth/logout";
import registerHandler from "@/pages/api/auth/register";
import meHandler from "@/pages/api/me";
import { __resetRateLimitForTests } from "@/server/rate-limit";
import { callHandler, extractCookie } from "./helpers/mock-http";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

describe("auth — error paths", () => {
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

  describe("POST /api/auth/login — mauvais credentials (anti-énumération)", () => {
    it("returns 400 with identical message for an unknown email", async () => {
      const res = await callHandler(loginHandler, {
        method: "POST",
        body: { email: "nobody@example.com", password: "whatever" },
      });
      expect(res.status).toBe(400);
      expect((res.body as { error: string }).error).toBe("Wrong credentials provided");
    });

    it("returns 400 with identical message for a wrong password", async () => {
      const email = `${randomUUID()}@test.com`;
      await callHandler(registerHandler, {
        method: "POST",
        body: { email, password: "correct-pw", firstName: "A", lastName: "B" },
      });
      const res = await callHandler(loginHandler, {
        method: "POST",
        body: { email, password: "wrong-pw" },
      });
      expect(res.status).toBe(400);
      expect((res.body as { error: string }).error).toBe("Wrong credentials provided");
    });
  });

  describe("POST /api/auth/register — email déjà utilisé", () => {
    it("returns 409 when the email is already taken", async () => {
      const email = `${randomUUID()}@test.com`;
      const first = await callHandler(registerHandler, {
        method: "POST",
        body: { email, password: "pw", firstName: "A", lastName: "B" },
      });
      expect(first.status).toBe(201);

      const second = await callHandler(registerHandler, {
        method: "POST",
        body: { email, password: "other", firstName: "C", lastName: "D" },
      });
      expect(second.status).toBe(409);
    });
  });

  describe("GET /api/me — edge cases cookie", () => {
    it("returns 401 with an invalid (garbage) jwt cookie", async () => {
      const res = await callHandler(meHandler, {
        method: "GET",
        cookies: { jwt: "this.is.not.a.valid.jwt" },
      });
      expect(res.status).toBe(401);
    });

    it("returns 401 when the user has been deleted after token issuance", async () => {
      const email = `${randomUUID()}@test.com`;
      await callHandler(registerHandler, {
        method: "POST",
        body: { email, password: "pw", firstName: "A", lastName: "B" },
      });
      const login = await callHandler(loginHandler, {
        method: "POST",
        body: { email, password: "pw" },
      });
      const token = extractCookie(login.headers, "jwt");
      expect(token).toBeTruthy();

      // Simule la suppression du compte
      await clearTestDb();

      const me = await callHandler(meHandler, {
        method: "GET",
        cookies: { jwt: token! },
      });
      expect(me.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the jwt cookie and subsequent /api/me without cookie returns 401", async () => {
      const email = `${randomUUID()}@test.com`;
      await callHandler(registerHandler, {
        method: "POST",
        body: { email, password: "pw", firstName: "A", lastName: "B" },
      });
      const login = await callHandler(loginHandler, {
        method: "POST",
        body: { email, password: "pw" },
      });
      const token = extractCookie(login.headers, "jwt");
      expect(token).toBeTruthy();

      const meBefore = await callHandler(meHandler, {
        method: "GET",
        cookies: { jwt: token! },
      });
      expect(meBefore.status).toBe(200);

      const logout = await callHandler(logoutHandler, {
        method: "POST",
        cookies: { jwt: token! },
      });
      expect(logout.status).toBe(200);
      // Le header Set-Cookie doit être présent (cookie invalidé côté serveur)
      expect(logout.headers["set-cookie"]).toBeDefined();

      // Sans cookie, /api/me doit renvoyer 401
      const meAfter = await callHandler(meHandler, { method: "GET" });
      expect(meAfter.status).toBe(401);
    });
  });
});
