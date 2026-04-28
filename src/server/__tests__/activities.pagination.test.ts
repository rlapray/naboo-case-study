// @vitest-environment node
import { Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ActivityModel } from "@/server/activities/activity.schema";
import { activityService } from "@/server/activities/activity.service";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/test-db";

const ownerId = new Types.ObjectId();

function makeActivities(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Activity ${i + 1}`,
    city: "TestCity",
    description: "desc",
    price: 10,
    owner: ownerId,
  }));
}

describe("activityService — cursor-based pagination", () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("findAll", () => {
    it("returns 20 items on first page and 10 on second page when 30 exist", async () => {
      await ActivityModel.insertMany(makeActivities(30));

      const page1 = await activityService.findAll();
      expect(page1.items).toHaveLength(20);
      expect(page1.nextCursor).toBeDefined();

      const page2 = await activityService.findAll({ cursor: page1.nextCursor });
      expect(page2.items).toHaveLength(10);
      expect(page2.nextCursor).toBeUndefined();
    });

    it("covers all 30 items without overlap across two pages", async () => {
      await ActivityModel.insertMany(makeActivities(30));

      const page1 = await activityService.findAll();
      const page2 = await activityService.findAll({ cursor: page1.nextCursor });

      const ids1 = new Set(page1.items.map((a) => a._id.toString()));
      const ids2 = page2.items.map((a) => a._id.toString());

      expect(ids1.size + ids2.length).toBe(30);
      expect(ids2.every((id) => !ids1.has(id))).toBe(true);
    });

    it("returns nextCursor: undefined when all items fit on first page", async () => {
      await ActivityModel.insertMany(makeActivities(5));
      const page = await activityService.findAll();
      expect(page.items).toHaveLength(5);
      expect(page.nextCursor).toBeUndefined();
    });

    it("respects the limit option", async () => {
      await ActivityModel.insertMany(makeActivities(10));
      const page = await activityService.findAll({ limit: 3 });
      expect(page.items).toHaveLength(3);
      expect(page.nextCursor).toBeDefined();
    });
  });

  describe("findByUser", () => {
    it("paginates correctly when a user owns 25 activities", async () => {
      await ActivityModel.insertMany(makeActivities(25));

      const page1 = await activityService.findByUser(ownerId.toString());
      expect(page1.items).toHaveLength(20);
      expect(page1.nextCursor).toBeDefined();

      const page2 = await activityService.findByUser(ownerId.toString(), {
        cursor: page1.nextCursor,
      });
      expect(page2.items).toHaveLength(5);
      expect(page2.nextCursor).toBeUndefined();
    });
  });

  describe("findByCity", () => {
    it("paginates correctly when a city has 25 activities", async () => {
      await ActivityModel.insertMany(makeActivities(25));

      const page1 = await activityService.findByCity("TestCity");
      expect(page1.items).toHaveLength(20);
      expect(page1.nextCursor).toBeDefined();

      const page2 = await activityService.findByCity("TestCity", undefined, undefined, {
        cursor: page1.nextCursor,
      });
      expect(page2.items).toHaveLength(5);
      expect(page2.nextCursor).toBeUndefined();
    });

    it("cursor pagination respects active filters", async () => {
      await ActivityModel.insertMany([
        ...Array.from({ length: 25 }, () => ({
          name: "Yoga",
          city: "TestCity",
          description: "desc",
          price: 10,
          owner: ownerId,
        })),
        // These should be excluded by the "yoga" activity filter
        { name: "Pilates", city: "TestCity", description: "desc", price: 10, owner: ownerId },
      ]);

      const page1 = await activityService.findByCity("TestCity", "yoga");
      expect(page1.items).toHaveLength(20);
      expect(page1.nextCursor).toBeDefined();

      const page2 = await activityService.findByCity("TestCity", "yoga", undefined, {
        cursor: page1.nextCursor,
      });
      expect(page2.items).toHaveLength(5);
      expect(page2.nextCursor).toBeUndefined();
    });
  });
});
