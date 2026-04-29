// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import citiesHandler from "@/pages/api/cities";
import { ActivityModel } from "@/server/activities/activity.schema";
import { userService } from "@/server/users/user.service";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

describe("GET /api/cities", () => {
  useServerTestEnv({ rateLimit: false });

  it("returns the distinct, sorted set of cities that have at least one activity", async () => {
    // Arrange
    const owner = await userService.createUser({
      email: `owner-${randomUUID()}@test.com`,
      password: "pw1",
      firstName: "F",
      lastName: "L",
    });
    await ActivityModel.create([
      { name: "Yoga", city: "Paris", description: "d", price: 10, owner: owner._id },
      { name: "Surf", city: "Biarritz", description: "d", price: 10, owner: owner._id },
      { name: "Pilates", city: "Paris", description: "d", price: 10, owner: owner._id },
    ]);

    // Act
    const res = await callHandler(citiesHandler);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Biarritz", "Paris"]);
  });

  it("returns an empty list when no activity exists", async () => {
    const res = await callHandler(citiesHandler);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("rejects non-GET methods with 405 and an Allow header", async () => {
    const res = await callHandler(citiesHandler, { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers["allow"]).toBe("GET");
  });
});
