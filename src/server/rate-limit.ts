import type { NextApiRequest } from "next";
import { TooManyRequestsError } from "./errors";

export interface RateLimitOptions {
  bucket: string;
  max: number;
  windowMs: number;
}

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

export function getClientIp(req: NextApiRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const header = Array.isArray(fwd) ? fwd[0] : fwd;
  if (header) return header.split(",")[0]!.trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export function rateLimit(req: NextApiRequest, opts: RateLimitOptions): void {
  const ip = getClientIp(req);
  const key = `${opts.bucket}:${ip}`;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }

  if (existing.count >= opts.max) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new TooManyRequestsError(retryAfter);
  }

  existing.count += 1;
}

// Test-only helper. Not exported in any public path.
export function __resetRateLimitForTests(): void {
  store.clear();
}
