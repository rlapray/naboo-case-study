import type { IncomingMessage } from "http";
import { parse } from "cookie";
import type { GetServerSidePropsContext, NextApiRequest } from "next";
import { connectDb } from "../db";
import { UnauthorizedError } from "../errors";
import type { UserDocument } from "../users/user.schema";
import { userService } from "../users/user.service";
import { JWT_COOKIE } from "./cookies";
import type { JwtPayload } from "./jwt";
import { verifyToken } from "./jwt";

type Req = NextApiRequest | IncomingMessage | GetServerSidePropsContext["req"];

function readJwt(req: Req): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parsed = parse(raw);
  return parsed[JWT_COOKIE] ?? null;
}

export function getJwtPayload(req: Req): JwtPayload | null {
  const token = readJwt(req);
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(req: Req): Promise<UserDocument | null> {
  const payload = getJwtPayload(req);
  if (!payload) return null;
  await connectDb();
  try {
    return await userService.getById(payload.id);
  } catch {
    return null;
  }
}

export async function requireUser(req: Req): Promise<UserDocument> {
  const user = await getCurrentUser(req);
  if (!user) throw new UnauthorizedError();
  return user;
}
