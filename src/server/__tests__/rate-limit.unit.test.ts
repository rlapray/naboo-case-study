// @vitest-environment node
import type { NextApiRequest } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooManyRequestsError } from "@/server/errors";
import {
  __resetRateLimitForTests,
  getClientIp,
  rateLimit,
  type RateLimitOptions,
} from "@/server/rate-limit";

// Opaque tokens (not real IPs) — the SUT only treats these as bucket-key strings.
const IP_A = "client-a";
const IP_B = "client-b";
const IP_C = "client-c";
const IP_PROXY_CHAIN = "client-a, edge-1, edge-2";

type ReqInit = {
  headers?: Record<string, string | string[]>;
  remoteAddress?: string;
};

function makeReq({ headers = {}, remoteAddress }: ReqInit = {}): NextApiRequest {
  return {
    headers,
    socket: remoteAddress === undefined ? undefined : { remoteAddress },
  } as unknown as NextApiRequest;
}

const opts = (over: Partial<RateLimitOptions> = {}): RateLimitOptions => ({
  bucket: "test",
  max: 3,
  windowMs: 60_000,
  ...over,
});

describe("getClientIp", () => {
  it("returns the x-forwarded-for header value when present", () => {
    const ip = getClientIp(makeReq({ headers: { "x-forwarded-for": IP_A } }));
    expect(ip).toBe(IP_A);
  });

  it("returns only the first IP from a comma-separated x-forwarded-for chain", () => {
    const ip = getClientIp(makeReq({ headers: { "x-forwarded-for": IP_PROXY_CHAIN } }));
    expect(ip).toBe(IP_A);
  });

  it("trims whitespace around the first forwarded IP", () => {
    const ip = getClientIp(
      makeReq({ headers: { "x-forwarded-for": `   ${IP_A}   ,${IP_B}` } }),
    );
    expect(ip).toBe(IP_A);
  });

  it("uses the first entry when x-forwarded-for is provided as an array", () => {
    const ip = getClientIp(
      makeReq({ headers: { "x-forwarded-for": [`${IP_A}, ${IP_B}`, "ignored"] } }),
    );
    expect(ip).toBe(IP_A);
  });

  it("falls back to socket.remoteAddress when no x-forwarded-for header is present", () => {
    const ip = getClientIp(makeReq({ remoteAddress: IP_C }));
    expect(ip).toBe(IP_C);
  });

  it("returns the literal 'unknown' when neither header nor socket address is available", () => {
    const ip = getClientIp(makeReq({}));
    expect(ip).toBe("unknown");
  });
});

describe("rateLimit — boundaries and isolation", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetRateLimitForTests();
  });

  const req = (ip: string = IP_A) => makeReq({ headers: { "x-forwarded-for": ip } });

  it("allows exactly max calls and rejects the (max+1)th within the window", () => {
    const o = opts({ max: 3 });
    expect(() => rateLimit(req(), o)).not.toThrow(); // n=1
    expect(() => rateLimit(req(), o)).not.toThrow(); // n=2
    expect(() => rateLimit(req(), o)).not.toThrow(); // n=3 (== max)
    expect(() => rateLimit(req(), o)).toThrow(TooManyRequestsError); // n=4
  });

  it("isolates buckets: hitting limit on bucket A does not affect bucket B", () => {
    const a = opts({ bucket: "alpha", max: 2 });
    const b = opts({ bucket: "beta", max: 2 });
    rateLimit(req(), a);
    rateLimit(req(), a);
    expect(() => rateLimit(req(), a)).toThrow(TooManyRequestsError);
    expect(() => rateLimit(req(), b)).not.toThrow();
    expect(() => rateLimit(req(), b)).not.toThrow();
    expect(() => rateLimit(req(), b)).toThrow(TooManyRequestsError);
  });

  it("isolates IPs: a different client gets a fresh budget", () => {
    const o = opts({ max: 2 });
    rateLimit(req(IP_A), o);
    rateLimit(req(IP_A), o);
    expect(() => rateLimit(req(IP_A), o)).toThrow(TooManyRequestsError);
    expect(() => rateLimit(req(IP_B), o)).not.toThrow();
  });

  it("resets the window once resetAt is in the past (now > resetAt)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const o = opts({ max: 1, windowMs: 1000 });
    rateLimit(req(), o);
    expect(() => rateLimit(req(), o)).toThrow(TooManyRequestsError);
    vi.setSystemTime(new Date("2026-01-01T00:00:01.001Z"));
    expect(() => rateLimit(req(), o)).not.toThrow();
  });

  it("resets the window when now equals resetAt exactly (boundary: <= comparison)", () => {
    vi.useFakeTimers();
    const start = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const o = opts({ max: 1, windowMs: 1000 });
    rateLimit(req(), o); // resetAt = start + 1000
    expect(() => rateLimit(req(), o)).toThrow(TooManyRequestsError);
    vi.setSystemTime(new Date(start.getTime() + 1000));
    expect(() => rateLimit(req(), o)).not.toThrow();
  });

  it("does NOT reset just before resetAt (now = resetAt - 1 still blocks)", () => {
    vi.useFakeTimers();
    const start = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const o = opts({ max: 1, windowMs: 1000 });
    rateLimit(req(), o);
    vi.setSystemTime(new Date(start.getTime() + 999));
    expect(() => rateLimit(req(), o)).toThrow(TooManyRequestsError);
  });
});

describe("rateLimit — TooManyRequestsError.retryAfterSeconds", () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
    __resetRateLimitForTests();
  });

  const req = () => makeReq({ headers: { "x-forwarded-for": IP_A } });

  it("computes retryAfter as ceil((resetAt - now) / 1000) seconds", () => {
    vi.useFakeTimers();
    const start = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const o = opts({ max: 1, windowMs: 60_000 });
    rateLimit(req(), o);
    vi.setSystemTime(new Date(start.getTime() + 30_000));
    try {
      rateLimit(req(), o);
      throw new Error("expected TooManyRequestsError");
    } catch (e) {
      expect(e).toBeInstanceOf(TooManyRequestsError);
      expect((e as TooManyRequestsError).retryAfterSeconds).toBe(30);
    }
  });

  it("rounds up sub-second remaining time (ceil), not down", () => {
    vi.useFakeTimers();
    const start = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const o = opts({ max: 1, windowMs: 5000 });
    rateLimit(req(), o);
    vi.setSystemTime(new Date(start.getTime() + 3500));
    try {
      rateLimit(req(), o);
      throw new Error("expected TooManyRequestsError");
    } catch (e) {
      expect((e as TooManyRequestsError).retryAfterSeconds).toBe(2);
    }
  });

  it("clamps retryAfter to a floor of 1 second when remaining time is sub-second", () => {
    vi.useFakeTimers();
    const start = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const o = opts({ max: 1, windowMs: 1000 });
    rateLimit(req(), o);
    vi.setSystemTime(new Date(start.getTime() + 999));
    try {
      rateLimit(req(), o);
      throw new Error("expected TooManyRequestsError");
    } catch (e) {
      expect((e as TooManyRequestsError).retryAfterSeconds).toBe(1);
    }
  });

  it("returns retryAfter > 1 when more than 1 second remains (kills Math.min mutant)", () => {
    vi.useFakeTimers();
    const start = new Date("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(start);
    const o = opts({ max: 1, windowMs: 60_000 });
    rateLimit(req(), o);
    vi.setSystemTime(new Date(start.getTime() + 5000)); // 55s remaining
    try {
      rateLimit(req(), o);
      throw new Error("expected TooManyRequestsError");
    } catch (e) {
      // With Math.min(1, 55) = 1; with Math.max(1, 55) = 55. Asserting 55 kills Math.min.
      expect((e as TooManyRequestsError).retryAfterSeconds).toBe(55);
    }
  });
});

describe("rateLimit — RATE_LIMIT_DISABLED bypass", () => {
  const original = process.env.RATE_LIMIT_DISABLED;
  beforeEach(() => {
    __resetRateLimitForTests();
  });
  afterEach(() => {
    if (original === undefined) delete process.env.RATE_LIMIT_DISABLED;
    else process.env.RATE_LIMIT_DISABLED = original;
    __resetRateLimitForTests();
  });

  it("bypasses the limit entirely when RATE_LIMIT_DISABLED is 'true'", () => {
    process.env.RATE_LIMIT_DISABLED = "true";
    const o = opts({ max: 1 });
    const r = makeReq({ headers: { "x-forwarded-for": IP_A } });
    for (let i = 0; i < 50; i++) {
      expect(() => rateLimit(r, o)).not.toThrow();
    }
  });

  it("does not bypass for any value other than the literal 'true'", () => {
    process.env.RATE_LIMIT_DISABLED = "1";
    const o = opts({ max: 1 });
    const r = makeReq({ headers: { "x-forwarded-for": IP_A } });
    rateLimit(r, o);
    expect(() => rateLimit(r, o)).toThrow(TooManyRequestsError);
  });
});

describe("__resetRateLimitForTests", () => {
  it("clears in-memory state so subsequent calls start a fresh window", () => {
    const r = makeReq({ headers: { "x-forwarded-for": IP_C } });
    const o = opts({ max: 1 });
    rateLimit(r, o);
    expect(() => rateLimit(r, o)).toThrow(TooManyRequestsError);
    __resetRateLimitForTests();
    expect(() => rateLimit(r, o)).not.toThrow();
  });
});
