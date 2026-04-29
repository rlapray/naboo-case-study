// @vitest-environment node
import { describe, expect, it } from "vitest";
import activitiesHandler from "@/pages/api/activities";
import { authenticate } from "./helpers/auth";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

describe("POST /api/activities — input length limits", () => {
  useServerTestEnv();

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
