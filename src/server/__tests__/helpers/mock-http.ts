import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";

interface CallOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
}

interface CallResult {
  status: number;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export async function callHandler(
  handler: NextApiHandler,
  opts: CallOptions = {},
): Promise<CallResult> {
  const cookieHeader = opts.cookies
    ? Object.entries(opts.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ")
    : undefined;

  const req = {
    method: opts.method ?? "GET",
    body: opts.body,
    query: opts.query ?? {},
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  } as unknown as NextApiRequest;

  let statusCode = 200;
  let jsonBody: unknown = undefined;
  const headers: Record<string, string | string[] | undefined> = {};

  const res = {
    status(code: number) {
      statusCode = code;
      return this as unknown as NextApiResponse;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return this as unknown as NextApiResponse;
    },
    setHeader(name: string, value: string | string[]) {
      headers[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    end() {
      return this as unknown as NextApiResponse;
    },
  } as unknown as NextApiResponse;

  await handler(req, res);

  return { status: statusCode, body: jsonBody, headers };
}

export function extractCookie(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return null;
  const value = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
  const match = new RegExp(`${name}=([^;]+)`).exec(value);
  return match ? match[1] : null;
}
