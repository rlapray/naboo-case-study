// @vitest-environment node
import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/errors";
import { FavoriteModel } from "@/server/favorites/favorite.schema";
import { FAVORITES_CAP, favoriteService } from "@/server/favorites/favorite.service";
import { userService } from "@/server/users/user.service";
import { makeActivities, ownerId, seedActivities } from "./helpers/factories";
import { useServerTestEnv } from "./helpers/setup";

async function createUser(firstName = "Ada", lastName = "Lovelace") {
  return userService.createUser({
    email: `user-${randomUUID()}@test.com`,
    password: "pw1",
    firstName,
    lastName,
  });
}

describe("favoriteService", () => {
  useServerTestEnv({ rateLimit: false, jwt: false });

  describe("add", () => {
    it("inserts a favorite at position 0 when the user list is empty", async () => {
      // Arrange
      const user = await createUser();
      const [activity] = await seedActivities([{ name: "Yoga" }]);

      // Act
      const created = await favoriteService.add(
        user._id.toString(),
        activity._id.toString(),
      );

      // Assert
      expect(created.position).toBe(0);
      expect(created.userId.toString()).toBe(user._id.toString());
      expect(created.activityId._id.toString()).toBe(activity._id.toString());
    });

    it("inserts the new favorite at position 0 and shifts existing ones", async () => {
      // Arrange
      const user = await createUser();
      const [activityA, activityB] = await seedActivities([
        { name: "A" },
        { name: "B" },
      ]);

      // Act
      await favoriteService.add(user._id.toString(), activityA._id.toString());
      await favoriteService.add(user._id.toString(), activityB._id.toString());

      // Assert
      const favorites = await FavoriteModel.find({ userId: user._id })
        .sort({ position: 1 })
        .exec();
      expect(favorites).toHaveLength(2);
      expect(favorites[0].activityId.toString()).toBe(activityB._id.toString());
      expect(favorites[0].position).toBe(0);
      expect(favorites[1].activityId.toString()).toBe(activityA._id.toString());
      expect(favorites[1].position).toBe(1);
    });

    it("rejects with ConflictError when the (userId, activityId) pair already exists", async () => {
      // Arrange
      const user = await createUser();
      const [activity] = await seedActivities([{ name: "Yoga" }]);
      await favoriteService.add(user._id.toString(), activity._id.toString());

      // Act + Assert
      await expect(
        favoriteService.add(user._id.toString(), activity._id.toString()),
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("rejects with BadRequestError when the user already has FAVORITES_CAP favorites", async () => {
      // Arrange
      const user = await createUser();
      const activities = await seedActivities(
        makeActivities(FAVORITES_CAP + 1).map((a, i) => ({
          ...a,
          name: `Activity ${i}`,
        })),
      );
      for (let i = 0; i < FAVORITES_CAP; i += 1) {
        await favoriteService.add(
          user._id.toString(),
          activities[i]._id.toString(),
        );
      }

      // Act + Assert
      await expect(
        favoriteService.add(
          user._id.toString(),
          activities[FAVORITES_CAP]._id.toString(),
        ),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it("rejects with NotFoundError when the activityId is not a valid ObjectId", async () => {
      // Arrange
      const user = await createUser();

      // Act + Assert
      await expect(
        favoriteService.add(user._id.toString(), "not-an-id"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("rejects with NotFoundError when the activityId is a well-formed but unknown ObjectId", async () => {
      // Arrange
      const user = await createUser();

      // Act + Assert
      await expect(
        favoriteService.add(user._id.toString(), "000000000000000000000000"),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("keeps two users' position sequences independent for the same activity", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [activity] = await seedActivities([{ name: "Shared" }]);

      // Act
      const favA = await favoriteService.add(
        userA._id.toString(),
        activity._id.toString(),
      );
      const favB = await favoriteService.add(
        userB._id.toString(),
        activity._id.toString(),
      );

      // Assert — each user gets position 0 independently (updateMany uses userId filter)
      expect(favA.position).toBe(0);
      expect(favB.position).toBe(0);
      // loadHydrated must return a doc with the correct userId, not the other user's
      expect(favA.userId.toString()).toBe(userA._id.toString());
      expect(favB.userId.toString()).toBe(userB._id.toString());
    });

    it("adding for userA does not shift positions of userB's favorites (updateMany uses userId filter)", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [actA1, actA2, actB1] = await seedActivities([
        { name: "A1" },
        { name: "A2" },
        { name: "B1" },
      ]);
      // userB already has one favorite at position 0
      await favoriteService.add(userB._id.toString(), actB1._id.toString());
      // userA adds two favorites
      await favoriteService.add(userA._id.toString(), actA1._id.toString());
      await favoriteService.add(userA._id.toString(), actA2._id.toString());

      // Assert — userB's favorite must still be at position 0 (not shifted by userA's adds)
      const bFavs = await FavoriteModel.find({ userId: userB._id }).exec();
      expect(bFavs).toHaveLength(1);
      expect(bFavs[0].position).toBe(0);
    });

    it("cap (countDocuments) is per user: userA at 100 favorites does not block userB", async () => {
      // Arrange — userA fills up to CAP favorites
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      // We need FAVORITES_CAP + 1 activities (CAP for userA, 1 for userB)
      const activities = await seedActivities(
        Array.from({ length: FAVORITES_CAP + 1 }, (_, i) => ({ name: `Act${i}` })),
      );
      for (let i = 0; i < FAVORITES_CAP; i += 1) {
        await favoriteService.add(userA._id.toString(), activities[i]._id.toString());
      }

      // Act — userB tries to add the last activity (not in userA's list)
      const result = await favoriteService.add(
        userB._id.toString(),
        activities[FAVORITES_CAP]._id.toString(),
      );

      // Assert — userB can add even though userA is at cap
      expect(result.position).toBe(0);
      expect(result.userId.toString()).toBe(userB._id.toString());
    });

    it("allows the activity owner to favorite their own activity", async () => {
      // Arrange
      const owner = await createUser();
      const [activity] = await seedActivities([
        { owner: owner._id, name: "Own" },
      ]);

      // Act
      const created = await favoriteService.add(
        owner._id.toString(),
        activity._id.toString(),
      );

      // Assert
      expect(created.position).toBe(0);
    });

    it("returns the favorite with its activity hydrated (and owner populated)", async () => {
      // Arrange
      const user = await createUser();
      const activityOwner = await createUser("Grace", "Hopper");
      const [activity] = await seedActivities([
        { owner: activityOwner._id, name: "Yoga" },
      ]);

      // Act
      const created = await favoriteService.add(
        user._id.toString(),
        activity._id.toString(),
      );

      // Assert
      const populatedActivity = created.activityId as unknown as {
        name?: string;
        owner?: { firstName?: string };
      };
      expect(populatedActivity.name).toBe("Yoga");
      expect(populatedActivity.owner?.firstName).toBe("Grace");
    });
  });

  describe("remove", () => {
    it("does not throw when removing a favorite that does not exist (idempotent)", async () => {
      // Arrange
      const user = await createUser();
      const [activity] = await seedActivities([{ name: "Never favorited" }]);

      // Act + Assert
      await expect(
        favoriteService.remove(user._id.toString(), activity._id.toString()),
      ).resolves.toBeUndefined();
    });

    it("does not throw when the activityId is not a valid ObjectId (idempotent)", async () => {
      // Arrange
      const user = await createUser();

      // Act + Assert
      await expect(
        favoriteService.remove(user._id.toString(), "not-an-id"),
      ).resolves.toBeUndefined();
    });

    it("remove for userA does not touch userB's favorite of the same activity", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [activity] = await seedActivities([{ name: "Shared" }]);
      await favoriteService.add(userA._id.toString(), activity._id.toString());
      await favoriteService.add(userB._id.toString(), activity._id.toString());

      // Act — only userA removes
      await favoriteService.remove(userA._id.toString(), activity._id.toString());

      // Assert — userA's favorite is gone, userB's is untouched
      const aFavs = await FavoriteModel.find({ userId: userA._id }).exec();
      const bFavs = await FavoriteModel.find({ userId: userB._id }).exec();
      expect(aFavs).toHaveLength(0);
      expect(bFavs).toHaveLength(1);
      expect(bFavs[0].activityId.toString()).toBe(activity._id.toString());
      expect(bFavs[0].position).toBe(0);
    });

    it("compacts positions after removal so the sequence stays contiguous", async () => {
      // Arrange
      const user = await createUser();
      // Use direct seeding to control positions deterministically.
      const [a1, a2, a3] = await seedActivities([
        { name: "A" },
        { name: "B" },
        { name: "C" },
      ]);
      // After 3 add: ordered C(0), B(1), A(2)
      await favoriteService.add(user._id.toString(), a1._id.toString());
      await favoriteService.add(user._id.toString(), a2._id.toString());
      await favoriteService.add(user._id.toString(), a3._id.toString());

      // Act — remove the middle one (B at position 1).
      await favoriteService.remove(user._id.toString(), a2._id.toString());

      // Assert — remaining favorites must be at positions 0 and 1 (no gap).
      const remaining = await FavoriteModel.find({ userId: user._id })
        .sort({ position: 1 })
        .exec();
      expect(remaining).toHaveLength(2);
      expect(remaining.map((f) => f.position)).toEqual([0, 1]);
      // Order preserved: C is still first, A is still last.
      expect(remaining[0].activityId.toString()).toBe(a3._id.toString());
      expect(remaining[1].activityId.toString()).toBe(a1._id.toString());
    });
  });

  describe("findByUser", () => {
    it("returns favorites sorted by ascending position (latest first)", async () => {
      // Arrange
      const user = await createUser();
      const [a, b, c] = await seedActivities([
        { name: "A" },
        { name: "B" },
        { name: "C" },
      ]);
      await favoriteService.add(user._id.toString(), a._id.toString());
      await favoriteService.add(user._id.toString(), b._id.toString());
      await favoriteService.add(user._id.toString(), c._id.toString());

      // Act
      const result = await favoriteService.findByUser(user._id.toString());

      // Assert — last added comes first.
      const activityIds = result.map((f) => f.activityId._id.toString());
      expect(activityIds).toEqual([
        c._id.toString(),
        b._id.toString(),
        a._id.toString(),
      ]);
      expect(result.map((f) => f.position)).toEqual([0, 1, 2]);
    });

    it("hydrates the activity with its owner populated", async () => {
      // Arrange
      const user = await createUser();
      const activityOwner = await createUser("Grace", "Hopper");
      const [activity] = await seedActivities([
        { owner: activityOwner._id, name: "Yoga" },
      ]);
      await favoriteService.add(user._id.toString(), activity._id.toString());

      // Act
      const result = await favoriteService.findByUser(user._id.toString());

      // Assert
      const populated = result[0].activityId as unknown as {
        name?: string;
        owner?: { firstName?: string };
      };
      expect(populated.name).toBe("Yoga");
      expect(populated.owner?.firstName).toBe("Grace");
    });

    it("does not leak favorites from other users", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [activity] = await seedActivities([{ name: "Shared" }]);
      await favoriteService.add(userA._id.toString(), activity._id.toString());

      // Act
      const result = await favoriteService.findByUser(userB._id.toString());

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("findIdsByUser", () => {
    it("returns activityIds as strings sorted by ascending position", async () => {
      // Arrange
      const user = await createUser();
      const [a, b, c] = await seedActivities([
        { name: "A" },
        { name: "B" },
        { name: "C" },
      ]);
      await favoriteService.add(user._id.toString(), a._id.toString());
      await favoriteService.add(user._id.toString(), b._id.toString());
      await favoriteService.add(user._id.toString(), c._id.toString());

      // Act
      const ids = await favoriteService.findIdsByUser(user._id.toString());

      // Assert
      expect(ids).toEqual([
        c._id.toString(),
        b._id.toString(),
        a._id.toString(),
      ]);
      expect(ids.every((id) => typeof id === "string")).toBe(true);
    });

    it("returns an empty array when the user has no favorites", async () => {
      // Arrange
      const user = await createUser();

      // Act
      const ids = await favoriteService.findIdsByUser(user._id.toString());

      // Assert
      expect(ids).toEqual([]);
    });

    it("does not leak other users' activity ids (find uses userId filter)", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [actA, actB] = await seedActivities([{ name: "ActA" }, { name: "ActB" }]);
      await favoriteService.add(userA._id.toString(), actA._id.toString());
      await favoriteService.add(userB._id.toString(), actB._id.toString());

      // Act
      const idsA = await favoriteService.findIdsByUser(userA._id.toString());
      const idsB = await favoriteService.findIdsByUser(userB._id.toString());

      // Assert — each user sees only their own activity id
      expect(idsA).toHaveLength(1);
      expect(idsA[0]).toBe(actA._id.toString());
      expect(idsB).toHaveLength(1);
      expect(idsB[0]).toBe(actB._id.toString());
    });
  });

  describe("reorder", () => {
    it("rewrites all positions according to the provided id order and returns favorites hydrated and sorted", async () => {
      // Arrange
      const user = await createUser();
      const [a, b, c] = await seedActivities([
        { name: "A" },
        { name: "B" },
        { name: "C" },
      ]);
      await favoriteService.add(user._id.toString(), a._id.toString());
      await favoriteService.add(user._id.toString(), b._id.toString());
      await favoriteService.add(user._id.toString(), c._id.toString());
      const current = await favoriteService.findByUser(user._id.toString());
      // Current order: C(0), B(1), A(2). Reverse it -> A, B, C.
      const reversedIds = [...current].reverse().map((f) => f._id.toString());

      // Act
      const result = await favoriteService.reorder(
        user._id.toString(),
        reversedIds,
      );

      // Assert
      expect(result.map((f) => f._id.toString())).toEqual(reversedIds);
      expect(result.map((f) => f.position)).toEqual([0, 1, 2]);
      const populatedFirst = result[0].activityId as unknown as {
        name?: string;
      };
      expect(populatedFirst.name).toBe("A");
    });

    it("rejects with BadRequestError when the payload is missing an existing favorite id", async () => {
      // Arrange
      const user = await createUser();
      const [a, b] = await seedActivities([{ name: "A" }, { name: "B" }]);
      await favoriteService.add(user._id.toString(), a._id.toString());
      await favoriteService.add(user._id.toString(), b._id.toString());
      const current = await favoriteService.findByUser(user._id.toString());

      // Act + Assert
      await expect(
        favoriteService.reorder(user._id.toString(), [
          current[0]._id.toString(),
        ]),
      ).rejects.toBeInstanceOf(BadRequestError);
      const after = await FavoriteModel.find({ userId: user._id })
        .sort({ position: 1 })
        .exec();
      expect(after.map((f) => f.position)).toEqual([0, 1]);
      expect(after.map((f) => f._id.toString())).toEqual(
        current.map((f) => f._id.toString()),
      );
    });

    it("rejects with BadRequestError when the payload contains duplicate ids (Set dedup check)", async () => {
      // Arrange — same id twice: Set.size < ids.length, must be rejected
      const user = await createUser();
      const [a, b] = await seedActivities([{ name: "A" }, { name: "B" }]);
      await favoriteService.add(user._id.toString(), a._id.toString());
      await favoriteService.add(user._id.toString(), b._id.toString());
      const current = await favoriteService.findByUser(user._id.toString());
      const dupIds = [current[0]._id.toString(), current[0]._id.toString()];

      // Act + Assert
      await expect(
        favoriteService.reorder(user._id.toString(), dupIds),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it("rejects with BadRequestError when the payload contains an unknown id", async () => {
      // Arrange
      const user = await createUser();
      const [a, b] = await seedActivities([{ name: "A" }, { name: "B" }]);
      await favoriteService.add(user._id.toString(), a._id.toString());
      await favoriteService.add(user._id.toString(), b._id.toString());
      const current = await favoriteService.findByUser(user._id.toString());
      const stranger = new Types.ObjectId().toString();

      // Act + Assert
      await expect(
        favoriteService.reorder(user._id.toString(), [
          current[0]._id.toString(),
          current[1]._id.toString(),
          stranger,
        ]),
      ).rejects.toBeInstanceOf(BadRequestError);
      const after = await FavoriteModel.find({ userId: user._id })
        .sort({ position: 1 })
        .exec();
      expect(after.map((f) => f.position)).toEqual([0, 1]);
    });

    it("rejects with BadRequestError when the payload references a favorite owned by another user", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [a1, a2, b1] = await seedActivities([
        { name: "A1" },
        { name: "A2" },
        { name: "B1" },
      ]);
      await favoriteService.add(userA._id.toString(), a1._id.toString());
      await favoriteService.add(userA._id.toString(), a2._id.toString());
      await favoriteService.add(userB._id.toString(), b1._id.toString());
      const favsA = await favoriteService.findByUser(userA._id.toString());
      const favsB = await favoriteService.findByUser(userB._id.toString());

      // Act + Assert — userA tries to reorder using one of B's favorite ids.
      await expect(
        favoriteService.reorder(userA._id.toString(), [
          favsA[0]._id.toString(),
          favsB[0]._id.toString(),
        ]),
      ).rejects.toBeInstanceOf(BadRequestError);
      const bAfter = await FavoriteModel.find({ userId: userB._id })
        .sort({ position: 1 })
        .exec();
      expect(bAfter).toHaveLength(1);
      expect(bAfter[0].position).toBe(0);
    });

    it("reorder for userA does not alter positions of userB's favorites (find uses userId filter)", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [a1, a2, b1, b2] = await seedActivities([
        { name: "A1" },
        { name: "A2" },
        { name: "B1" },
        { name: "B2" },
      ]);
      await favoriteService.add(userA._id.toString(), a1._id.toString());
      await favoriteService.add(userA._id.toString(), a2._id.toString());
      await favoriteService.add(userB._id.toString(), b1._id.toString());
      await favoriteService.add(userB._id.toString(), b2._id.toString());
      const favsA = await favoriteService.findByUser(userA._id.toString());
      const bBefore = await FavoriteModel.find({ userId: userB._id })
        .sort({ position: 1 })
        .exec();
      // Reverse userA's order
      const reversedA = [...favsA].reverse().map((f) => f._id.toString());

      // Act
      await favoriteService.reorder(userA._id.toString(), reversedA);

      // Assert — userB's positions are unchanged
      const bAfter = await FavoriteModel.find({ userId: userB._id })
        .sort({ position: 1 })
        .exec();
      expect(bAfter.map((f) => f._id.toString())).toEqual(
        bBefore.map((f) => f._id.toString()),
      );
      expect(bAfter.map((f) => f.position)).toEqual([0, 1]);
    });

    it("is idempotent when the payload matches the current order", async () => {
      // Arrange
      const user = await createUser();
      const [a, b, c] = await seedActivities([
        { name: "A" },
        { name: "B" },
        { name: "C" },
      ]);
      await favoriteService.add(user._id.toString(), a._id.toString());
      await favoriteService.add(user._id.toString(), b._id.toString());
      await favoriteService.add(user._id.toString(), c._id.toString());
      const current = await favoriteService.findByUser(user._id.toString());
      const sameOrder = current.map((f) => f._id.toString());

      // Act
      const result = await favoriteService.reorder(
        user._id.toString(),
        sameOrder,
      );

      // Assert
      expect(result.map((f) => f._id.toString())).toEqual(sameOrder);
      expect(result.map((f) => f.position)).toEqual([0, 1, 2]);
    });

    it("returns only the reordered user's favorites, not those of another user (find uses userId filter)", async () => {
      // Arrange
      const userA = await createUser("Ada");
      const userB = await createUser("Bob");
      const [a1, a2, b1] = await seedActivities([
        { name: "A1" },
        { name: "A2" },
        { name: "B1" },
      ]);
      await favoriteService.add(userA._id.toString(), a1._id.toString());
      await favoriteService.add(userA._id.toString(), a2._id.toString());
      await favoriteService.add(userB._id.toString(), b1._id.toString());
      const favsA = await favoriteService.findByUser(userA._id.toString());
      const reversedA = [...favsA].reverse().map((f) => f._id.toString());

      // Act
      const result = await favoriteService.reorder(userA._id.toString(), reversedA);

      // Assert — result contains ONLY userA's favorites (2 items), not userB's
      expect(result).toHaveLength(2);
      const resultUserIds = result.map((f) => f.userId.toString());
      expect(resultUserIds.every((id) => id === userA._id.toString())).toBe(true);
    });

    it("returns an empty array when the user has no favorites and the payload is empty", async () => {
      // Arrange
      const user = await createUser();

      // Act
      const result = await favoriteService.reorder(user._id.toString(), []);

      // Assert
      expect(result).toEqual([]);
    });
  });

  // Sanity check that prevents a regression on the (userId, activityId)
  // unique index: if it were dropped, the cap would still hold but doublons
  // would silently slip in.
  it("(userId, activityId) is enforced unique at the schema level", async () => {
    const user = await createUser();
    const [activity] = await seedActivities([{ name: "Yoga" }]);
    await favoriteService.add(user._id.toString(), activity._id.toString());
    await expect(
      FavoriteModel.create({
        userId: user._id,
        activityId: activity._id,
        position: 5,
      }),
    ).rejects.toThrow();
    expect(ownerId).toBeDefined(); // imported helper is reachable
    expect(Types.ObjectId.isValid(user._id.toString())).toBe(true);
  });
});
