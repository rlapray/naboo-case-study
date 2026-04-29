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
