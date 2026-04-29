// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import latestHandler from "@/pages/api/activities/latest";
import { ActivityModel } from "@/server/activities/activity.schema";
import { userService } from "@/server/users/user.service";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

async function createOwner() {
  return userService.createUser({
    email: `owner-${randomUUID()}@test.com`,
    password: "pw1",
    firstName: "F",
    lastName: "L",
  });
}

describe("GET /api/activities/latest", () => {
  useServerTestEnv({ rateLimit: false });

  it("returns at most three activities ordered by descending createdAt", async () => {
    const owner = await createOwner();
    const base = Date.now();
    await ActivityModel.insertMany([
      { name: "A", city: "Paris", description: "d", price: 10, owner: owner._id, createdAt: new Date(base + 1) },
      { name: "B", city: "Paris", description: "d", price: 10, owner: owner._id, createdAt: new Date(base + 2) },
      { name: "C", city: "Paris", description: "d", price: 10, owner: owner._id, createdAt: new Date(base + 3) },
      { name: "D", city: "Paris", description: "d", price: 10, owner: owner._id, createdAt: new Date(base + 4) },
    ]);

    const res = await callHandler(latestHandler);

    expect(res.status).toBe(200);
    const body = res.body as Array<{ name: string }>;
    expect(body.map((a) => a.name)).toEqual(["D", "C", "B"]);
  });

  it("returns an empty list when no activity exists", async () => {
    const res = await callHandler(latestHandler);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
