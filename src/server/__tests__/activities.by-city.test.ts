// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import byCityHandler from "@/pages/api/activities/by-city";
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

describe("GET /api/activities/by-city", () => {
  useServerTestEnv({ rateLimit: false });

  it("returns only activities matching the requested city", async () => {
    const owner = await createOwner();
    await ActivityModel.create([
      { name: "Yoga", city: "Paris", description: "d", price: 10, owner: owner._id },
      { name: "Surf", city: "Lyon", description: "d", price: 10, owner: owner._id },
    ]);

    const res = await callHandler(byCityHandler, { query: { city: "Paris" } });

    expect(res.status).toBe(200);
    const { items } = res.body as { items: Array<{ city: string; name: string }> };
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ city: "Paris", name: "Yoga" });
  });

  it("filters by activity name case-insensitively and ignoring diacritics", async () => {
    const owner = await createOwner();
    await ActivityModel.create([
      { name: "Café Pilates", city: "Paris", description: "d", price: 10, owner: owner._id },
      { name: "Yoga", city: "Paris", description: "d", price: 10, owner: owner._id },
    ]);

    const res = await callHandler(byCityHandler, {
      query: { city: "Paris", activity: "cafe" },
    });

    const { items } = res.body as { items: Array<{ name: string }> };
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Café Pilates");
  });

  it("filters by maximum price", async () => {
    const owner = await createOwner();
    await ActivityModel.create([
      { name: "Cheap", city: "Paris", description: "d", price: 5, owner: owner._id },
      { name: "Expensive", city: "Paris", description: "d", price: 50, owner: owner._id },
    ]);

    const res = await callHandler(byCityHandler, {
      query: { city: "Paris", price: "10" },
    });

    const { items } = res.body as { items: Array<{ name: string }> };
    expect(items.map((i) => i.name)).toEqual(["Cheap"]);
  });

  it("returns 400 when the city query parameter is missing", async () => {
    const res = await callHandler(byCityHandler, { query: {} });
    expect(res.status).toBe(400);
  });

  it("paginates results via the cursor", async () => {
    const owner = await createOwner();
    const docs = Array.from({ length: 3 }, (_, i) => ({
      name: `A${i}`,
      city: "Paris",
      description: "d",
      price: 10,
      owner: owner._id,
    }));
    await ActivityModel.insertMany(docs);

    const page1 = await callHandler(byCityHandler, {
      query: { city: "Paris", limit: "2" },
    });
    const body1 = page1.body as { items: unknown[]; nextCursor?: string };
    expect(body1.items).toHaveLength(2);
    expect(body1.nextCursor).toBeDefined();

    const page2 = await callHandler(byCityHandler, {
      query: { city: "Paris", limit: "2", cursor: body1.nextCursor! },
    });
    const body2 = page2.body as { items: unknown[]; nextCursor?: string };
    expect(body2.items).toHaveLength(1);
    expect(body2.nextCursor).toBeUndefined();
  });
});
