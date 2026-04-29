// @vitest-environment node
import { randomUUID } from "node:crypto";
import { compare } from "bcrypt";
import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/server/errors";
import { useServerTestEnv } from "../__tests__/helpers/setup";
import { userService } from "./user.service";

function uniqueEmail() {
  return `${randomUUID()}@test.com`;
}

describe("userService", () => {
  useServerTestEnv({ rateLimit: false, jwt: false });

  it("creates a user and fetches it back by id", async () => {
    const email = uniqueEmail();
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

  it("hashes the password when creating a user (does not store plaintext)", async () => {
    const created = await userService.createUser({
      email: uniqueEmail(),
      password: "supersecret",
      firstName: "F",
      lastName: "L",
    });

    expect(created.password).not.toBe("supersecret");
    await expect(compare("supersecret", created.password)).resolves.toBe(true);
  });

  it("defaults the role to 'user' when no role is provided", async () => {
    const created = await userService.createUser({
      email: uniqueEmail(),
      password: "pw",
      firstName: "F",
      lastName: "L",
    });
    expect(created.role).toBe("user");
  });

  it("returns null when looking up a non-existent email via findByEmail", async () => {
    const result = await userService.findByEmail("missing@test.com");
    expect(result).toBeNull();
  });

  it("throws NotFoundError when getByEmail does not match", async () => {
    await expect(userService.getByEmail("missing@test.com")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("throws NotFoundError when getById does not match", async () => {
    await expect(userService.getById("000000000000000000000000")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("updateToken persists the token on an existing user", async () => {
    const created = await userService.createUser({
      email: uniqueEmail(),
      password: "pw",
      firstName: "F",
      lastName: "L",
    });

    const updated = await userService.updateToken(created._id.toString(), "new-token");

    expect(updated.token).toBe("new-token");
    const refetched = await userService.getById(created._id.toString());
    expect(refetched.token).toBe("new-token");
  });

  it("updateToken throws NotFoundError when the user does not exist", async () => {
    await expect(
      userService.updateToken("000000000000000000000000", "t"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("countDocuments reflects the number of created users", async () => {
    expect(await userService.countDocuments()).toBe(0);
    await userService.createUser({
      email: uniqueEmail(),
      password: "pw",
      firstName: "F",
      lastName: "L",
    });
    expect(await userService.countDocuments()).toBe(1);
  });
});
