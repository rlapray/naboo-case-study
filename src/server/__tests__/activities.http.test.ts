// @vitest-environment node
import { describe, expect, it } from "vitest";
import activitiesHandler from "@/pages/api/activities";
import activityByIdHandler from "@/pages/api/activities/[id]";
import { authenticate } from "./helpers/auth";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

describe("activities HTTP handlers", () => {
  useServerTestEnv();

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
