// @vitest-environment node
import { describe, expect, it } from "vitest";
import { activityService } from "@/server/activities/activity.service";
import { NotFoundError } from "@/server/errors";
import { seedActivities } from "./helpers/factories";
import { useServerTestEnv } from "./helpers/setup";

describe("activityService", () => {
  useServerTestEnv({ rateLimit: false, jwt: false });

  describe("findOne", () => {
    it("throws NotFoundError when the id is not a valid ObjectId (no CastError leak)", async () => {
      await expect(activityService.findOne("badid")).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws NotFoundError when the id is a well-formed but unknown ObjectId", async () => {
      await expect(
        activityService.findOne("000000000000000000000000"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("findByCity — diacritic-insensitive search", () => {
    const seedParis = () =>
      seedActivities([
        { name: "Crème brûlée", city: "Paris", price: 10 },
        { name: "Creme glacée", city: "Paris", price: 20 },
        { name: "CRÈME pâtissière", city: "Paris", price: 30 },
        { name: "Café", city: "Paris", price: 5 },
      ]);

    it("matches accented names from an unaccented query", async () => {
      await seedParis();
      const result = await activityService.findByCity("Paris", "creme");
      expect(result.items).toHaveLength(3);
    });

    it("matches unaccented names from an accented query", async () => {
      await seedParis();
      const result = await activityService.findByCity("Paris", "crème");
      expect(result.items).toHaveLength(3);
    });

    it("is case-insensitive", async () => {
      await seedParis();
      const result = await activityService.findByCity("Paris", "CREME");
      expect(result.items).toHaveLength(3);
    });

    it("filters out non-matching names", async () => {
      await seedParis();
      const result = await activityService.findByCity("Paris", "cafe");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Café");
    });

    it("escapes regex special characters instead of crashing", async () => {
      await seedParis();
      const result = await activityService.findByCity("Paris", "crème.*(");
      expect(result.items).toEqual([]);
    });

    it("returns all activities of the city when query is empty", async () => {
      await seedParis();
      const result = await activityService.findByCity("Paris", "");
      expect(result.items).toHaveLength(4);
    });
  });

  describe("findByCity — max price cap", () => {
    const seedLyon = () =>
      seedActivities([
        { name: "A", city: "Lyon", price: 10 },
        { name: "B", city: "Lyon", price: 50 },
        { name: "C", city: "Lyon", price: 51 },
        { name: "D", city: "Lyon", price: 100 },
      ]);

    it("includes activities at the price boundary ($lte, not $lt)", async () => {
      await seedLyon();
      const result = await activityService.findByCity("Lyon", undefined, 50);
      expect(result.items.map((a) => a.name).sort((a, b) => a.localeCompare(b))).toEqual([
        "A",
        "B",
      ]);
    });

    it("excludes activities above the cap", async () => {
      await seedLyon();
      const result = await activityService.findByCity("Lyon", undefined, 50);
      const names = result.items.map((a) => a.name);
      expect(names).not.toContain("C");
      expect(names).not.toContain("D");
    });

    it("returns everything when no price is provided", async () => {
      await seedLyon();
      const result = await activityService.findByCity("Lyon");
      expect(result.items).toHaveLength(4);
    });
  });

  describe("findByCity — combined filters", () => {
    it("intersects search and price filters", async () => {
      await seedActivities([
        { name: "Crème brûlée", city: "Paris", price: 10 },
        { name: "Crème glacée", city: "Paris", price: 100 },
        { name: "Café", city: "Paris", price: 5 },
        { name: "Crème de marron", city: "Lyon", price: 10 },
      ]);

      const result = await activityService.findByCity("Paris", "creme", 50);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Crème brûlée");
    });
  });
});
