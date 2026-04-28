import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { ZodError } from "zod";
import { connectDb } from "./db";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "./errors";

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

export function errorToResponse(err: unknown): { status: number; body: ApiErrorBody } {
  if (err instanceof ZodError) {
    return { status: 400, body: { error: "Validation error", details: err.issues } };
  }
  if (err instanceof BadRequestError) return { status: 400, body: { error: err.message } };
  if (err instanceof UnauthorizedError) return { status: 401, body: { error: err.message } };
  if (err instanceof NotFoundError) return { status: 404, body: { error: err.message } };
  if (err instanceof ConflictError) return { status: 409, body: { error: err.message } };
  console.error("[api] unexpected error:", err);
  return { status: 500, body: { error: "Internal Server Error" } };
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type Handlers = Partial<Record<Method, NextApiHandler>>;

export function withMethods(handlers: Handlers): NextApiHandler {
  const allowed = Object.keys(handlers) as Method[];
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = (req.method ?? "GET") as Method;
    const handler = handlers[method];
    if (!handler) {
      res.setHeader("Allow", allowed.join(", "));
      res.status(405).json({ error: `Method ${method} not allowed` });
      return;
    }
    try {
      await connectDb();
      await handler(req, res);
    } catch (err) {
      const { status, body } = errorToResponse(err);
      res.status(status).json(body);
    }
  };
}
