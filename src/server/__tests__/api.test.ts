// @vitest-environment node
import type { NextApiHandler } from "next";
import { describe, expect, it, vi } from "vitest";
import type { ZodError } from "zod";
import { z } from "zod";
import { errorToResponse, withMethods } from "@/server/api";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/server/errors";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

describe("errorToResponse", () => {
  it("maps a ZodError to 400 with body { error: 'Validation error', details: issues }", () => {
    let zodErr: ZodError;
    try {
      z.object({ name: z.string() }).parse({});
      throw new Error("expected ZodError");
    } catch (e) {
      zodErr = e as ZodError;
    }

    const result = errorToResponse(zodErr);

    expect(result.status).toBe(400);
    // Kills ObjectLiteral on body (`{}`) and StringLiteral on `"Validation error"`.
    expect(result.body).toEqual({ error: "Validation error", details: zodErr.issues });
    expect(result.headers).toBeUndefined();
  });

  it("maps BadRequestError to 400 with the error message in the body", () => {
    const result = errorToResponse(new BadRequestError("bad input"));

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ error: "bad input" });
  });

  it("maps UnauthorizedError to 401 with the error message in the body", () => {
    const result = errorToResponse(new UnauthorizedError("nope"));

    expect(result.status).toBe(401);
    // Kills ObjectLiteral on body → `{}`.
    expect(result.body).toEqual({ error: "nope" });
  });

  it("maps NotFoundError to 404 with the error message in the body", () => {
    const result = errorToResponse(new NotFoundError("missing"));

    expect(result.status).toBe(404);
    // Kills ObjectLiteral on body → `{}`.
    expect(result.body).toEqual({ error: "missing" });
  });

  it("maps ConflictError to 409 with the error message in the body", () => {
    const result = errorToResponse(new ConflictError("dup"));

    expect(result.status).toBe(409);
    // Kills ObjectLiteral on body → `{}`.
    expect(result.body).toEqual({ error: "dup" });
  });

  it("maps TooManyRequestsError to 429 with the error message and a Retry-After header", () => {
    const result = errorToResponse(new TooManyRequestsError(42, "slow down"));

    expect(result.status).toBe(429);
    // Kills ObjectLiteral on body → `{}`.
    expect(result.body).toEqual({ error: "slow down" });
    expect(result.headers).toEqual({ "Retry-After": "42" });
  });

  it("maps an unknown error to 500 with a generic body and logs it", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = errorToResponse(new Error("kaboom"));

    expect(result.status).toBe(500);
    expect(result.body).toEqual({ error: "Internal Server Error" });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

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
