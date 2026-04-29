// @vitest-environment node
import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { toActivityDto, toPublicUserDto, toUserDto } from "@/server/serialize";

const userDoc = {
  _id: new Types.ObjectId(),
  role: "user" as const,
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "should-never-leak",
};

describe("serialize", () => {
  it("toPublicUserDto strips email and any sensitive field", () => {
    const dto = toPublicUserDto(userDoc as never);
    expect(dto).toEqual({
      id: userDoc._id.toString(),
      role: "user",
      firstName: "Ada",
      lastName: "Lovelace",
    });
    expect(dto).not.toHaveProperty("email");
    expect(dto).not.toHaveProperty("password");
  });

  it("toUserDto exposes email (used only on authenticated /api/me)", () => {
    expect(toUserDto(userDoc as never).email).toBe("ada@example.com");
  });

  it("toActivityDto uses the public user shape — owner.email is never serialized", () => {
    const activity = {
      _id: new Types.ObjectId(),
      name: "Yoga",
      city: "Rouen",
      description: "Session yoga",
      price: 30,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      owner: userDoc,
    };
    const dto = toActivityDto(activity as never);
    expect(dto.owner).not.toHaveProperty("email");
    expect(dto.owner.firstName).toBe("Ada");
  });
});
