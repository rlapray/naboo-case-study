// @vitest-environment node
import type { IncomingMessage } from "http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectDb } from "../../db";
import { UnauthorizedError } from "../../errors";
import { userService } from "../../users/user.service";
import { JWT_COOKIE } from "../cookies";
import { verifyToken } from "../jwt";
import { getCurrentUser, getJwtPayload, requireUser } from "../session";

// vi.mock calls are hoisted by Vitest so they apply to the imports above.
vi.mock("../../db", () => ({
  connectDb: vi.fn(async () => undefined),
}));

vi.mock("../../users/user.service", () => ({
  userService: {
    getById: vi.fn(),
  },
}));

vi.mock("../jwt", () => ({
  verifyToken: vi.fn(),
}));

const mockedVerifyToken = vi.mocked(verifyToken);
const mockedGetById = vi.mocked(userService.getById);
const mockedConnectDb = vi.mocked(connectDb);

const PAYLOAD = {
  id: "507f1f77bcf86cd799439011",
  email: "leia@rebellion.org",
  firstName: "Leia",
  lastName: "Organa",
};

function reqWith(cookieHeader?: string): IncomingMessage {
  return {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
  } as unknown as IncomingMessage;
}

describe("session", () => {
  beforeEach(() => {
    mockedVerifyToken.mockReset();
    mockedGetById.mockReset();
    mockedConnectDb.mockReset();
    mockedConnectDb.mockResolvedValue(undefined as never);
  });

  describe("getJwtPayload", () => {
    it("returns null and does not call verifyToken when no cookie header is present", () => {
      const result = getJwtPayload(reqWith());

      expect(result).toBeNull();
      // Kills ConditionalExpression `if (!token) return null` → `if (false) return null`:
      // with the mutant we would fall through and call verifyToken(undefined).
      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("returns null and does not call verifyToken when the cookie header has no jwt entry", () => {
      const result = getJwtPayload(reqWith("foo=bar; baz=qux"));

      expect(result).toBeNull();
      expect(mockedVerifyToken).not.toHaveBeenCalled();
    });

    it("delegates to verifyToken with the parsed jwt cookie value when present", () => {
      mockedVerifyToken.mockReturnValueOnce(PAYLOAD);

      const result = getJwtPayload(reqWith(`${JWT_COOKIE}=abc.def.ghi`));

      expect(mockedVerifyToken).toHaveBeenCalledWith("abc.def.ghi");
      expect(result).toEqual(PAYLOAD);
    });
  });

  describe("getCurrentUser", () => {
    it("returns null and does not connect to the DB when there is no jwt cookie", async () => {
      const result = await getCurrentUser(reqWith());

      expect(result).toBeNull();
      expect(mockedConnectDb).not.toHaveBeenCalled();
      expect(mockedGetById).not.toHaveBeenCalled();
    });

    it("returns null and does not call userService.getById when verifyToken yields null", async () => {
      mockedVerifyToken.mockReturnValueOnce(null);

      const result = await getCurrentUser(reqWith(`${JWT_COOKIE}=garbage`));

      expect(result).toBeNull();
      // Kills ConditionalExpression `if (!payload) return null` → `if (false) return null`:
      // with the mutant we would proceed to userService.getById(undefined).
      expect(mockedGetById).not.toHaveBeenCalled();
    });

    it("connects to the DB and returns the user resolved from the payload id", async () => {
      mockedVerifyToken.mockReturnValueOnce(PAYLOAD);
      const fakeUser = { _id: PAYLOAD.id, email: PAYLOAD.email } as never;
      mockedGetById.mockResolvedValueOnce(fakeUser);

      const result = await getCurrentUser(reqWith(`${JWT_COOKIE}=tok`));

      expect(mockedConnectDb).toHaveBeenCalledTimes(1);
      expect(mockedGetById).toHaveBeenCalledWith(PAYLOAD.id);
      expect(result).toBe(fakeUser);
    });

    it("returns exactly null (not undefined) when userService.getById throws", async () => {
      mockedVerifyToken.mockReturnValueOnce(PAYLOAD);
      mockedGetById.mockRejectedValueOnce(new Error("not found"));

      const result = await getCurrentUser(reqWith(`${JWT_COOKIE}=tok`));

      // Kills BlockStatement on the catch body `return null;` → `{}` which would yield undefined.
      expect(result).toBeNull();
    });
  });

  describe("requireUser", () => {
    it("throws UnauthorizedError when no user is resolved", async () => {
      await expect(requireUser(reqWith())).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("returns the user when authentication succeeds", async () => {
      mockedVerifyToken.mockReturnValueOnce(PAYLOAD);
      const fakeUser = { _id: PAYLOAD.id } as never;
      mockedGetById.mockResolvedValueOnce(fakeUser);

      await expect(requireUser(reqWith(`${JWT_COOKIE}=tok`))).resolves.toBe(fakeUser);
    });
  });
});
