// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from "@/server/errors";

describe("server errors", () => {
  describe("NotFoundError", () => {
    it("defaults message to 'Not found' and exposes the class name", () => {
      const err = new NotFoundError();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Not found");
      expect(err.name).toBe("NotFoundError");
    });

    it("propagates a custom message", () => {
      expect(new NotFoundError("activity missing").message).toBe("activity missing");
    });
  });

  describe("UnauthorizedError", () => {
    it("defaults message to 'Unauthorized' and exposes the class name", () => {
      const err = new UnauthorizedError();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Unauthorized");
      expect(err.name).toBe("UnauthorizedError");
    });

    it("propagates a custom message", () => {
      expect(new UnauthorizedError("bad token").message).toBe("bad token");
    });
  });

  describe("BadRequestError", () => {
    it("defaults message to 'Bad request' and exposes the class name", () => {
      const err = new BadRequestError();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Bad request");
      expect(err.name).toBe("BadRequestError");
    });

    it("propagates a custom message", () => {
      expect(new BadRequestError("invalid payload").message).toBe("invalid payload");
    });
  });

  describe("ConflictError", () => {
    it("defaults message to 'Conflict' and exposes the class name", () => {
      const err = new ConflictError();
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Conflict");
      expect(err.name).toBe("ConflictError");
    });

    it("propagates a custom message", () => {
      expect(new ConflictError("email already used").message).toBe("email already used");
    });
  });

  describe("TooManyRequestsError", () => {
    it("defaults message to 'Too many requests', exposes the class name and stores retryAfterSeconds", () => {
      const err = new TooManyRequestsError(42);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Too many requests");
      expect(err.name).toBe("TooManyRequestsError");
      expect(err.retryAfterSeconds).toBe(42);
    });

    it("propagates a custom message and preserves retryAfterSeconds", () => {
      const err = new TooManyRequestsError(7, "slow down");
      expect(err.message).toBe("slow down");
      expect(err.retryAfterSeconds).toBe(7);
    });
  });
});
