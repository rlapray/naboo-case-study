import { sign, verify } from "jsonwebtoken";
import { getEnv } from "../env";

export interface JwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function signToken(payload: JwtPayload): string {
  const env = getEnv();
  return sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRATION_TIME });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = verify(token, getEnv().JWT_SECRET);
    if (typeof decoded === "string") return null;
    const { id, email, firstName, lastName } = decoded as JwtPayload;
    if (!id || !email) return null;
    return { id, email, firstName, lastName };
  } catch {
    return null;
  }
}
