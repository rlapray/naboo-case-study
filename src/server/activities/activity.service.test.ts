// @vitest-environment node
import { Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearTestDb, startTestDb, stopTestDb } from "../__tests__/helpers/test-db";
import { ActivityModel } from "./activity.schema";
import { activityService } from "./activity.service";

const ownerId = new Types.ObjectId();

const seed = (
  docs: Partial<{
    name: string;
    city: string;
    price: number;
    description: string;
  }>[],
) =>
  ActivityModel.insertMany(
    docs.map((d) => ({
      description: "desc",
      owner: ownerId,
      ...d,
    })),
  );

describe("activityService.findByCity", () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe("diacritic-insensitive search", () => {
    beforeEach(async () => {
      await seed([
        { name: "Crème brûlée", city: "Paris", price: 10 },
        { name: "Creme glacée", city: "Paris", price: 20 },
        { name: "CRÈME pâtissière", city: "Paris", price: 30 },
        { name: "Café", city: "Paris", price: 5 },
      ]);
    });

    it("matches accented names from an unaccented query", async () => {
      const result = await activityService.findByCity("Paris", "creme");
      expect(result).toHaveLength(3);
    });

    it("matches unaccented names from an accented query", async () => {
      const result = await activityService.findByCity("Paris", "crème");
      expect(result).toHaveLength(3);
    });

    it("is case-insensitive", async () => {
      const result = await activityService.findByCity("Paris", "CREME");
      expect(result).toHaveLength(3);
    });

    it("filters out non-matching names", async () => {
      const result = await activityService.findByCity("Paris", "cafe");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Café");
    });

    it("escapes regex special characters instead of crashing", async () => {
      await expect(
        activityService.findByCity("Paris", "crème.*("),
      ).resolves.toEqual([]);
    });

    it("returns all activities of the city when query is empty", async () => {
      const result = await activityService.findByCity("Paris", "");
      expect(result).toHaveLength(4);
    });
  });

  describe("max price cap", () => {
    beforeEach(async () => {
      await seed([
        { name: "A", city: "Lyon", price: 10 },
        { name: "B", city: "Lyon", price: 50 },
        { name: "C", city: "Lyon", price: 51 },
        { name: "D", city: "Lyon", price: 100 },
      ]);
    });

    it("includes activities at the price boundary ($lte, not $lt)", async () => {
      const result = await activityService.findByCity("Lyon", undefined, 50);
      expect(result.map((a) => a.name).sort()).toEqual(["A", "B"]);
    });

    it("excludes activities above the cap", async () => {
      const result = await activityService.findByCity("Lyon", undefined, 50);
      const names = result.map((a) => a.name);
      expect(names).not.toContain("C");
      expect(names).not.toContain("D");
    });

    it("returns everything when no price is provided", async () => {
      const result = await activityService.findByCity("Lyon");
      expect(result).toHaveLength(4);
    });
  });

  describe("combined filters", () => {
    it("intersects search and price filters", async () => {
      await seed([
        { name: "Crème brûlée", city: "Paris", price: 10 },
        { name: "Crème glacée", city: "Paris", price: 100 },
        { name: "Café", city: "Paris", price: 5 },
        { name: "Crème de marron", city: "Lyon", price: 10 },
      ]);

      const result = await activityService.findByCity("Paris", "creme", 50);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Crème brûlée");
    });
  });
});
