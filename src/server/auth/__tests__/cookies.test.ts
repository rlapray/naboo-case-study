// @vitest-environment node
import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearJwtCookie, JWT_COOKIE, readJwtCookie, setJwtCookie } from "../cookies";

function fakeRes() {
  const headers: Record<string, string | string[] | undefined> = {};
  return {
    setHeader(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
  } as unknown as NextApiResponse & {
    getHeader: (name: string) => string | string[] | undefined;
  };
}

function fakeReq(cookieHeader?: string): NextApiRequest {
  return { headers: cookieHeader ? { cookie: cookieHeader } : {} } as NextApiRequest;
}

describe("jwt cookie helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("readJwtCookie returns null when no cookie header is present", () => {
    expect(readJwtCookie(fakeReq())).toBeNull();
  });

  it("readJwtCookie returns null when the jwt cookie is missing among others", () => {
    expect(readJwtCookie(fakeReq("foo=bar; baz=qux"))).toBeNull();
  });

  it("readJwtCookie returns the jwt token when present", () => {
    expect(readJwtCookie(fakeReq(`${JWT_COOKIE}=abc.def.ghi`))).toBe("abc.def.ghi");
  });

  it("setJwtCookie issues a HttpOnly Lax cookie scoped to / with the given Max-Age", () => {
    const res = fakeRes();
    setJwtCookie(res, "token123", 3600);

    const cookie = res.getHeader("Set-Cookie") as string;
    expect(cookie).toContain(`${JWT_COOKIE}=token123`);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=3600/);
  });

  it("setJwtCookie does not mark the cookie Secure outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    const res = fakeRes();
    setJwtCookie(res, "t", 60);
    expect(res.getHeader("Set-Cookie") as string).not.toMatch(/Secure/i);
  });

  it("setJwtCookie marks the cookie Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = fakeRes();
    setJwtCookie(res, "t", 60);
    expect(res.getHeader("Set-Cookie") as string).toMatch(/Secure/i);
  });

  it("clearJwtCookie expires the cookie immediately with Max-Age=0 and HttpOnly Lax / scope, empty value", () => {
    const res = fakeRes();
    clearJwtCookie(res);
    const cookie = res.getHeader("Set-Cookie") as string;
    // Empty token value (kills StringLiteral on serialize value arg)
    expect(cookie).toMatch(new RegExp(`^${JWT_COOKIE}=;`));
    expect(cookie).toMatch(/Max-Age=0/);
    expect(cookie).toMatch(/HttpOnly/i);
    // SameSite=Lax (kills StringLiteral on sameSite)
    expect(cookie).toMatch(/SameSite=Lax/i);
    // Path=/ (kills StringLiteral on path)
    expect(cookie).toMatch(/Path=\//);
  });

  it("clearJwtCookie does not mark the cookie Secure outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    const res = fakeRes();
    clearJwtCookie(res);
    expect(res.getHeader("Set-Cookie") as string).not.toMatch(/Secure/i);
  });

  it("clearJwtCookie marks the cookie Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = fakeRes();
    clearJwtCookie(res);
    expect(res.getHeader("Set-Cookie") as string).toMatch(/Secure/i);
  });
});
