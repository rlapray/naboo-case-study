// @vitest-environment node
import { sign } from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { __resetEnvCacheForTests } from "@/server/env";
import { signToken, verifyToken } from "../jwt";

const PAYLOAD = {
  id: "507f1f77bcf86cd799439011",
  email: "luke@rebellion.org",
  firstName: "Luke",
  lastName: "Skywalker",
};

describe("jwt", () => {
  const original = { ...process.env };

  beforeEach(() => {
    __resetEnvCacheForTests();
    (process.env as Record<string, string>).NODE_ENV = "test";
    process.env.JWT_SECRET = "test-secret-with-enough-length-xx";
    process.env.MONGO_URI = "mongodb://x";
    process.env.JWT_EXPIRATION_TIME = "3600";
  });

  afterEach(() => {
    process.env = { ...original };
    __resetEnvCacheForTests();
  });

  it("returns the original payload when verifying a freshly signed token", () => {
    // Arrange + Act
    const token = signToken(PAYLOAD);
    const decoded = verifyToken(token);

    // Assert
    expect(decoded).toEqual(PAYLOAD);
  });

  it("returns null when the token signature does not match the secret", () => {
    // Arrange
    const otherSecret = ["unrelated", "fake", "value", "for", "tests"].join("-");
    const tokenSignedWithOtherSecret = sign(PAYLOAD, otherSecret, {
      expiresIn: 3600,
    });

    // Act
    const decoded = verifyToken(tokenSignedWithOtherSecret);

    // Assert
    expect(decoded).toBeNull();
  });

  it("returns null when the token is malformed", () => {
    expect(verifyToken("not.a.jwt")).toBeNull();
  });

  it("returns null when the token has expired", () => {
    // Arrange — expiresIn negative => already expired
    const expired = sign(PAYLOAD, process.env.JWT_SECRET as string, { expiresIn: -10 });

    // Act + Assert
    expect(verifyToken(expired)).toBeNull();
  });

  it("returns null when the decoded payload is missing the user id", () => {
    // Arrange
    const tokenWithoutId = sign(
      { email: PAYLOAD.email, firstName: "x", lastName: "y" },
      process.env.JWT_SECRET as string,
      { expiresIn: 3600 },
    );

    // Act + Assert
    expect(verifyToken(tokenWithoutId)).toBeNull();
  });

  it("returns null when the decoded payload is missing the email", () => {
    const tokenWithoutEmail = sign(
      { id: PAYLOAD.id, firstName: "x", lastName: "y" },
      process.env.JWT_SECRET as string,
      { expiresIn: 3600 },
    );

    expect(verifyToken(tokenWithoutEmail)).toBeNull();
  });

  it("returns null when the token is a string-only payload", () => {
    // Arrange — jsonwebtoken allows signing a string; verify() then returns a string.
    const stringToken = sign("just-a-string", process.env.JWT_SECRET as string);

    // Act + Assert
    expect(verifyToken(stringToken)).toBeNull();
  });
});
