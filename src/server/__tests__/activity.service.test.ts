// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ActivityModel } from "@/server/activities/activity.schema";
import { activityService } from "@/server/activities/activity.service";
import { NotFoundError } from "@/server/errors";
import { userService } from "@/server/users/user.service";
import { makeActivities, ownerId, seedActivities } from "./helpers/factories";
import { useServerTestEnv } from "./helpers/setup";

async function createNamedOwner() {
  return userService.createUser({
    email: `owner-${randomUUID()}@test.com`,
    password: "pw1",
    firstName: "Ada",
    lastName: "Lovelace",
  });
}

describe("activityService", () => {
  useServerTestEnv({ rateLimit: false, jwt: false });

  describe("findOne", () => {
    it("throws NotFoundError when the id is not a valid ObjectId (no CastError leak)", async () => {
      await expect(activityService.findOne("badid")).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws NotFoundError with the 'Activity not found' message for malformed id", async () => {
      await expect(activityService.findOne("badid")).rejects.toThrow("Activity not found");
    });

    it("throws NotFoundError when the id is a well-formed but unknown ObjectId", async () => {
      await expect(
        activityService.findOne("000000000000000000000000"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws NotFoundError with the 'Activity not found' message for unknown id", async () => {
      await expect(
        activityService.findOne("000000000000000000000000"),
      ).rejects.toThrow("Activity not found");
    });

    it("populates the owner on findOne (not just the ObjectId reference)", async () => {
      const owner = await createNamedOwner();
      const [doc] = await seedActivities([{ owner: owner._id, name: "Solo" }]);
      const found = await activityService.findOne(doc._id.toString());
      const populatedOwner = found.owner as unknown as { firstName?: string };
      expect(populatedOwner.firstName).toBe("Ada");
    });
  });

  describe("countDocuments", () => {
    it("returns 0 when no activity exists", async () => {
      await expect(activityService.countDocuments()).resolves.toBe(0);
    });

    it("returns the number of inserted activities", async () => {
      await ActivityModel.insertMany(makeActivities(7));
      await expect(activityService.countDocuments()).resolves.toBe(7);
    });
  });

  describe("populates owner on listing endpoints", () => {
    it("findAll populates owner with firstName", async () => {
      const owner = await createNamedOwner();
      await seedActivities([{ owner: owner._id }]);
      const page = await activityService.findAll();
      const populated = page.items[0].owner as unknown as { firstName?: string };
      expect(populated.firstName).toBe("Ada");
    });

    it("findLatest populates owner with firstName", async () => {
      const owner = await createNamedOwner();
      await seedActivities([{ owner: owner._id }]);
      const items = await activityService.findLatest();
      const populated = items[0].owner as unknown as { firstName?: string };
      expect(populated.firstName).toBe("Ada");
    });

    it("findByUser populates owner with firstName", async () => {
      const owner = await createNamedOwner();
      await seedActivities([{ owner: owner._id }]);
      const page = await activityService.findByUser(owner._id.toString());
      const populated = page.items[0].owner as unknown as { firstName?: string };
      expect(populated.firstName).toBe("Ada");
    });

    it("findByCity populates owner with firstName", async () => {
      const owner = await createNamedOwner();
      await seedActivities([{ owner: owner._id, city: "Brest" }]);
      const page = await activityService.findByCity("Brest");
      const populated = page.items[0].owner as unknown as { firstName?: string };
      expect(populated.firstName).toBe("Ada");
    });
  });

  describe("cursor pagination boundary (hasMore)", () => {
    it("returns nextCursor undefined when exactly `limit` items exist", async () => {
      // Boundary test: docs.length === limit. With `>=` mutation, hasMore would
      // be incorrectly true and the last item would be popped.
      await ActivityModel.insertMany(makeActivities(5));
      const page = await activityService.findAll({ limit: 5 });
      expect(page.items).toHaveLength(5);
      expect(page.nextCursor).toBeUndefined();
    });

    it("returns nextCursor defined when exactly `limit + 1` items exist", async () => {
      await ActivityModel.insertMany(makeActivities(6));
      const page = await activityService.findAll({ limit: 5 });
      expect(page.items).toHaveLength(5);
      expect(page.nextCursor).toBeDefined();
    });

    it("findByUser returns nextCursor undefined at the exact limit boundary", async () => {
      await ActivityModel.insertMany(makeActivities(5, { owner: ownerId }));
      const page = await activityService.findByUser(ownerId.toString(), { limit: 5 });
      expect(page.items).toHaveLength(5);
      expect(page.nextCursor).toBeUndefined();
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

    it("matches a literal special character via the escape branch", async () => {
      // Ensures the `+= "\\" + ch` escape branch actually builds the regex
      // (kills AssignmentOperator mutation that turns `+=` into `-=`).
      await seedActivities([
        { name: "Yoga (intense)", city: "Paris" },
        { name: "Yoga doux", city: "Paris" },
      ]);
      const result = await activityService.findByCity("Paris", "(intense)");
      expect(result.items.map((a) => a.name)).toEqual(["Yoga (intense)"]);
    });

    // Each subtest seeds two names: one containing the accented letter, one
    // without. The query is the bare letter. With the original group regex
    // only the accented name matches. With the mutated empty group ("") the
    // regex degenerates to empty and matches BOTH names, which kills the
    // mutation via the length assertion.
    it.each([
      ["a", "Àpple", "Zzz", "a"],
      ["c", "Çedar", "Zzz", "c"],
      ["i", "Pïne", "Zzz", "i"],
      // Use "Piña" (no plain "n") so the mutated empty group can't fall back to
      // the literal "n" character that would otherwise still match "Cañon".
      ["n", "Piña", "Zzz", "n"],
      ["o", "Föx", "Zzz", "o"],
      ["u", "Pürr", "Zzz", "u"],
      ["y", "Ýes", "Zzz", "y"],
    ])(
      "diacritic group '%s' restricts matches to accented variants",
      async (_group, accentedName, plainName, query) => {
        await seedActivities([
          { name: accentedName, city: "Paris" },
          { name: plainName, city: "Paris" },
        ]);
        const result = await activityService.findByCity("Paris", query);
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe(accentedName);
      },
    );

    it("diacritic group 'e' restricts matches to names containing an e-variant", async () => {
      await seedActivities([
        { name: "Crème", city: "Paris" },
        { name: "Café", city: "Paris" },
        { name: "Fête", city: "Paris" },
        { name: "Noël", city: "Paris" },
        // Contains no e-variant — must NOT match query "e" with the real group.
        // With empty-group mutation the regex degenerates and matches this too.
        { name: "Zzz", city: "Paris" },
      ]);
      const result = await activityService.findByCity("Paris", "e");
      expect(result.items).toHaveLength(4);
      expect(result.items.map((a) => a.name)).not.toContain("Zzz");
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
