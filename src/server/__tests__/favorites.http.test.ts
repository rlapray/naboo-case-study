// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import favoritesHandler from "@/pages/api/me/favorites";
import favoriteByActivityHandler from "@/pages/api/me/favorites/[activityId]";
import favoriteIdsHandler from "@/pages/api/me/favorites/ids";
import { userService } from "@/server/users/user.service";
import type { FavoriteDto, FavoriteIdsResponse, FavoritesListResponse } from "@/types/favorite";
import { authenticate } from "./helpers/auth";
import { seedActivities } from "./helpers/factories";
import { callHandler } from "./helpers/mock-http";
import { useServerTestEnv } from "./helpers/setup";

async function createOwner() {
  return userService.createUser({
    email: `owner-${randomUUID()}@test.com`,
    password: "pw1",
    firstName: "Owner",
    lastName: "User",
  });
}

describe("favorites HTTP handlers", () => {
  useServerTestEnv();

  // ---------------------------------------------------------------------------
  // GET /api/me/favorites
  // ---------------------------------------------------------------------------
  describe("GET /api/me/favorites", () => {
    it("returns 401 when no JWT cookie is provided", async () => {
      // Arrange — no cookie
      // Act
      const res = await callHandler(favoritesHandler, { method: "GET" });
      // Assert
      expect(res.status).toBe(401);
    });

    it("returns empty items array when user has no favorites", async () => {
      // Arrange
      const jwt = await authenticate();
      // Act
      const res = await callHandler(favoritesHandler, {
        method: "GET",
        cookies: { jwt },
      });
      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ items: [] });
    });

    it("returns hydrated FavoriteDtos sorted by position", async () => {
      // Arrange
      const jwt = await authenticate();
      const owner = await createOwner();
      const [activity1, activity2] = await seedActivities([
        { name: "Yoga", city: "Paris", owner: owner._id },
        { name: "Surf", city: "Biarritz", owner: owner._id },
      ]);
      // Add activity1 first (position 0), then activity2 (position 0, activity1 shifts to 1)
      await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity1._id.toString() },
      });
      await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity2._id.toString() },
      });

      // Act
      const res = await callHandler(favoritesHandler, {
        method: "GET",
        cookies: { jwt },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = res.body as FavoritesListResponse;
      expect(body.items).toHaveLength(2);
      // Verify DTO structure for first item
      const first = body.items[0];
      expect(typeof first.id).toBe("string");
      expect(typeof first.activity.id).toBe("string");
      expect(first.activity.owner.firstName).toBe("Owner");
      expect(first.activity.owner.lastName).toBe("User");
      expect(first.position).toBe(0);
      expect(typeof first.createdAt).toBe("string");
      // Items should be sorted by position ascending
      expect(body.items[0].position).toBeLessThan(body.items[1].position);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/me/favorites/ids
  // ---------------------------------------------------------------------------
  describe("GET /api/me/favorites/ids", () => {
    it("returns 401 when no JWT cookie is provided", async () => {
      // Arrange — no cookie
      // Act
      const res = await callHandler(favoriteIdsHandler, { method: "GET" });
      // Assert
      expect(res.status).toBe(401);
    });

    it("returns empty ids array when user has no favorites", async () => {
      // Arrange
      const jwt = await authenticate();
      // Act
      const res = await callHandler(favoriteIdsHandler, {
        method: "GET",
        cookies: { jwt },
      });
      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ids: [] });
    });

    it("returns activity ids sorted by position", async () => {
      // Arrange
      const jwt = await authenticate();
      const owner = await createOwner();
      const [activity1, activity2] = await seedActivities([
        { name: "Yoga", city: "Paris", owner: owner._id },
        { name: "Surf", city: "Biarritz", owner: owner._id },
      ]);
      await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity1._id.toString() },
      });
      await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity2._id.toString() },
      });

      // Act
      const res = await callHandler(favoriteIdsHandler, {
        method: "GET",
        cookies: { jwt },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = res.body as FavoriteIdsResponse;
      expect(body.ids).toHaveLength(2);
      expect(body.ids).toEqual([expect.any(String), expect.any(String)]);
      // Both are valid ObjectId strings
      expect(body.ids[0]).toMatch(/^[a-f\d]{24}$/i);
      expect(body.ids[1]).toMatch(/^[a-f\d]{24}$/i);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/me/favorites/[activityId]
  // ---------------------------------------------------------------------------
  describe("POST /api/me/favorites/[activityId]", () => {
    it("returns 401 when no JWT cookie is provided", async () => {
      // Arrange
      const owner = await createOwner();
      const [activity] = await seedActivities([{ name: "Yoga", city: "Paris", owner: owner._id }]);
      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        query: { activityId: activity._id.toString() },
      });
      // Assert
      expect(res.status).toBe(401);
    });

    it("returns 201 with hydrated FavoriteDto including activity and owner", async () => {
      // Arrange
      const jwt = await authenticate();
      const owner = await createOwner();
      const [activity] = await seedActivities([{ name: "Yoga", city: "Paris", owner: owner._id }]);

      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity._id.toString() },
      });

      // Assert
      expect(res.status).toBe(201);
      const dto = res.body as FavoriteDto;
      expect(typeof dto.id).toBe("string");
      expect(dto.activity.id).toBe(activity._id.toString());
      expect(dto.activity.name).toBe("Yoga");
      expect(dto.activity.city).toBe("Paris");
      expect(dto.activity.owner.firstName).toBe("Owner");
      expect(dto.position).toBe(0);
      expect(typeof dto.createdAt).toBe("string");
    });

    it("returns 409 when adding the same activity twice", async () => {
      // Arrange
      const jwt = await authenticate();
      const owner = await createOwner();
      const [activity] = await seedActivities([{ name: "Yoga", city: "Paris", owner: owner._id }]);
      await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity._id.toString() },
      });

      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity._id.toString() },
      });

      // Assert
      expect(res.status).toBe(409);
    });

    it("returns 404 when activityId is a valid ObjectId but unknown", async () => {
      // Arrange
      const jwt = await authenticate();

      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: "000000000000000000000000" },
      });

      // Assert
      expect(res.status).toBe(404);
    });

    it("returns 400 when activityId is malformed (not a valid ObjectId)", async () => {
      // Arrange
      const jwt = await authenticate();

      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: "not-an-id" },
      });

      // Assert
      expect(res.status).toBe(400);
    });

    it("returns 400 when activityId embeds 24 hex chars inside non-hex characters (anchors ^ and $ required)", async () => {
      // Arrange — a string that contains a valid 24-hex sequence but is NOT a pure 24-hex string.
      // Without the ^ and $ anchors the regex /[a-f\d]{24}/i would match the inner 24 chars.
      const jwt = await authenticate();
      const inner24hex = "a".repeat(24);
      const paddedId = `!!!${inner24hex}@@@`;

      // Act — POST
      const resPost = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: paddedId },
      });

      // Act — DELETE
      const resDelete = await callHandler(favoriteByActivityHandler, {
        method: "DELETE",
        cookies: { jwt },
        query: { activityId: paddedId },
      });

      // Assert — both must be rejected (Zod parse fails → 400)
      expect(resPost.status).toBe(400);
      expect(resDelete.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/me/favorites
  // ---------------------------------------------------------------------------
  describe("PATCH /api/me/favorites", () => {
    it("returns 401 when no JWT cookie is provided", async () => {
      // Arrange — no cookie
      // Act
      const res = await callHandler(favoritesHandler, {
        method: "PATCH",
        body: { ids: [] },
      });
      // Assert
      expect(res.status).toBe(401);
    });

    it("returns 200 with items reordered by new position", async () => {
      // Arrange
      const jwt = await authenticate();
      const owner = await createOwner();
      const [activity1, activity2, activity3] = await seedActivities([
        { name: "Yoga", city: "Paris", owner: owner._id },
        { name: "Surf", city: "Biarritz", owner: owner._id },
        { name: "Vélo", city: "Lyon", owner: owner._id },
      ]);
      // POST all three — activity3 ends at position 0, activity2 at 1, activity1 at 2
      const res1 = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity1._id.toString() },
      });
      const res2 = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity2._id.toString() },
      });
      const res3 = await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity3._id.toString() },
      });
      const favoriteId1 = (res1.body as FavoriteDto).id;
      const favoriteId2 = (res2.body as FavoriteDto).id;
      const favoriteId3 = (res3.body as FavoriteDto).id;
      // Invert: put activity1 first, then activity2, then activity3
      const newOrder = [favoriteId1, favoriteId2, favoriteId3];

      // Act
      const res = await callHandler(favoritesHandler, {
        method: "PATCH",
        cookies: { jwt },
        body: { ids: newOrder },
      });

      // Assert
      expect(res.status).toBe(200);
      const body = res.body as FavoritesListResponse;
      expect(body.items).toHaveLength(3);
      expect(body.items[0].id).toBe(favoriteId1);
      expect(body.items[1].id).toBe(favoriteId2);
      expect(body.items[2].id).toBe(favoriteId3);
      expect(body.items[0].position).toBe(0);
      expect(body.items[1].position).toBe(1);
      expect(body.items[2].position).toBe(2);
    });

    it("returns 400 when ids payload does not match the user favorites set", async () => {
      // Arrange
      const jwt = await authenticate();
      const owner = await createOwner();
      const [activity1] = await seedActivities([
        { name: "Yoga", city: "Paris", owner: owner._id },
      ]);
      await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity1._id.toString() },
      });
      // A valid ObjectId that is NOT in the user's favorites
      const foreignId = "aaaaaaaaaaaaaaaaaaaaaaaa";

      // Act
      const res = await callHandler(favoritesHandler, {
        method: "PATCH",
        cookies: { jwt },
        body: { ids: [foreignId] },
      });

      // Assert
      expect(res.status).toBe(400);
    });

    it("returns 400 when ids contains a malformed ObjectId", async () => {
      // Arrange
      const jwt = await authenticate();

      // Act
      const res = await callHandler(favoritesHandler, {
        method: "PATCH",
        cookies: { jwt },
        body: { ids: ["not-an-objectid"] },
      });

      // Assert
      expect(res.status).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/me/favorites/[activityId]
  // ---------------------------------------------------------------------------
  describe("DELETE /api/me/favorites/[activityId]", () => {
    it("returns 401 when no JWT cookie is provided", async () => {
      // Arrange
      const owner = await createOwner();
      const [activity] = await seedActivities([{ name: "Yoga", city: "Paris", owner: owner._id }]);
      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "DELETE",
        query: { activityId: activity._id.toString() },
      });
      // Assert
      expect(res.status).toBe(401);
    });

    it("returns 204 when removing an existing favorite", async () => {
      // Arrange
      const jwt = await authenticate();
      const owner = await createOwner();
      const [activity] = await seedActivities([{ name: "Yoga", city: "Paris", owner: owner._id }]);
      await callHandler(favoriteByActivityHandler, {
        method: "POST",
        cookies: { jwt },
        query: { activityId: activity._id.toString() },
      });

      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "DELETE",
        cookies: { jwt },
        query: { activityId: activity._id.toString() },
      });

      // Assert
      expect(res.status).toBe(204);
    });

    it("returns 204 when removing a favorite that does not exist (idempotent)", async () => {
      // Arrange
      const jwt = await authenticate();

      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "DELETE",
        cookies: { jwt },
        query: { activityId: "000000000000000000000000" },
      });

      // Assert
      expect(res.status).toBe(204);
    });

    it("returns 400 when activityId is malformed (not a valid ObjectId)", async () => {
      // Arrange
      const jwt = await authenticate();

      // Act
      const res = await callHandler(favoriteByActivityHandler, {
        method: "DELETE",
        cookies: { jwt },
        query: { activityId: "not-an-id" },
      });

      // Assert
      expect(res.status).toBe(400);
    });
  });
});
