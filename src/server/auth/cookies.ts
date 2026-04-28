import { parse, serialize } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

export const JWT_COOKIE = "jwt";

export function readJwtCookie(req: NextApiRequest): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parsed = parse(raw);
  return parsed[JWT_COOKIE] ?? null;
}

export function setJwtCookie(res: NextApiResponse, token: string, maxAgeSeconds: number): void {
  const cookie = serialize(JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
    secure: process.env.NODE_ENV === "production",
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearJwtCookie(res: NextApiResponse): void {
  const cookie = serialize(JWT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  res.setHeader("Set-Cookie", cookie);
}
