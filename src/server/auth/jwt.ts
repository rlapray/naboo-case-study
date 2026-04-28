import { sign, verify } from "jsonwebtoken";

export interface JwtPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
}

function getExpiresIn(): number {
  const raw = process.env.JWT_EXPIRATION_TIME ?? "86400";
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("JWT_EXPIRATION_TIME must be a positive number of seconds");
  }
  return n;
}

export function signToken(payload: JwtPayload): string {
  return sign(payload, getSecret(), { expiresIn: getExpiresIn() });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = verify(token, getSecret());
    if (typeof decoded === "string") return null;
    const { id, email, firstName, lastName } = decoded as JwtPayload;
    if (!id || !email) return null;
    return { id, email, firstName, lastName };
  } catch {
    return null;
  }
}
