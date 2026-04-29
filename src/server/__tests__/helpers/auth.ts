import { randomUUID } from "node:crypto";
import loginHandler from "@/pages/api/auth/login";
import registerHandler from "@/pages/api/auth/register";
import { callHandler, extractCookie } from "./mock-http";

export async function authenticate(): Promise<string> {
  const email = `u-${randomUUID()}@example.com`;
  await callHandler(registerHandler, {
    method: "POST",
    body: { email, password: "pw1", firstName: "F", lastName: "L" },
  });
  const login = await callHandler(loginHandler, {
    method: "POST",
    body: { email, password: "pw1" },
  });
  return extractCookie(login.headers, "jwt")!;
}
