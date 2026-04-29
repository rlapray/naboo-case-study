// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import mineHandler from "@/pages/api/activities/mine";
import { ActivityModel } from "@/server/activities/activity.schema";
import { signToken } from "@/server/auth/jwt";
import { userService } from "@/server/users/user.service";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

async function createOwnerWithJwt() {
  const email = `owner-${randomUUID()}@test.com`;
  const user = await userService.createUser({
    email,
    password: "pw1",
    firstName: "F",
    lastName: "L",
  });
  const jwt = signToken({ id: user._id.toString(), email, firstName: "F", lastName: "L" });
  return { user, jwt };
}

describe("GET /api/activities/mine", () => {
  useServerTestEnv({ rateLimit: false });

  it("returns 401 when the caller is not authenticated", async () => {
    const res = await callHandler(mineHandler);
    expect(res.status).toBe(401);
  });

  it("returns only the authenticated user's activities", async () => {
    const me = await createOwnerWithJwt();
    const other = await createOwnerWithJwt();

    await ActivityModel.create([
      { name: "Mine A", city: "Paris", description: "d", price: 10, owner: me.user._id },
      { name: "Mine B", city: "Paris", description: "d", price: 10, owner: me.user._id },
      { name: "Theirs", city: "Paris", description: "d", price: 10, owner: other.user._id },
    ]);

    const res = await callHandler(mineHandler, { cookies: { jwt: me.jwt } });

    expect(res.status).toBe(200);
    const { items } = res.body as { items: Array<{ name: string }> };
    expect(items.map((i) => i.name).sort((a, b) => a.localeCompare(b))).toEqual([
      "Mine A",
      "Mine B",
    ]);
  });
});
