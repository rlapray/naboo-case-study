// @vitest-environment node
import type { NextApiHandler } from "next";
import { describe, expect, it, vi } from "vitest";
import { withMethods } from "@/server/api";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

describe("withMethods", () => {
  useServerTestEnv({ rateLimit: false });

  it("returns 405 with an Allow header listing declared methods when the requested method is not registered", async () => {
    const handler = withMethods({
      GET: (_req, res) => {
        res.status(200).json({ ok: true });
      },
      POST: (_req, res) => {
        res.status(201).json({ ok: true });
      },
    });

    const res = await callHandler(handler, { method: "DELETE" });

    expect(res.status).toBe(405);
    expect(res.headers["allow"]).toBe("GET, POST");
    expect(res.body).toEqual({ error: "Method DELETE not allowed" });
  });

  it("returns 500 with a generic Internal Server Error body when the handler throws an unknown error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const throwing: NextApiHandler = () => {
      throw new Error("kaboom");
    };
    const handler = withMethods({ GET: throwing });

    const res = await callHandler(handler);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal Server Error" });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
