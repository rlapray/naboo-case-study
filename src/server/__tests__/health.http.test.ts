// @vitest-environment node
import { describe, expect, it } from "vitest";
import healthHandler from "@/pages/api/health";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

describe("GET /api/health", () => {
  useServerTestEnv({ rateLimit: false });

  it("returns 200 with status ok when called via GET", async () => {
    const res = await callHandler(healthHandler);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("rejects non-GET methods with 405 and an Allow header", async () => {
    const res = await callHandler(healthHandler, { method: "POST" });

    expect(res.status).toBe(405);
    expect(res.headers["allow"]).toBe("GET");
  });
});
