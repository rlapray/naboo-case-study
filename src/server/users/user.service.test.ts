// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearTestDb, startTestDb, stopTestDb } from "../__tests__/helpers/test-db";
import { userService } from "./user.service";

describe("userService", () => {
  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it("creates a user and fetches it back by id", async () => {
    const email = `${randomUUID()}@test.com`;
    const created = await userService.createUser({
      email,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
    });

    const fetched = await userService.getById(created._id.toString());

    expect(fetched).toMatchObject({
      email,
      firstName: "firstName",
      lastName: "lastName",
    });
  });

  it("returns null when looking up a non-existent email via findByEmail", async () => {
    const result = await userService.findByEmail("missing@test.com");
    expect(result).toBeNull();
  });
});
