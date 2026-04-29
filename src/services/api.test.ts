import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api } from "./api";

interface FetchCall {
  url: string;
  init: RequestInit;
}

function mockFetchOnce(response: {
  ok?: boolean;
  status?: number;
  body?: unknown;
}): FetchCall[] {
  const calls: FetchCall[] = [];
  const status = response.status ?? 200;
  const ok = response.ok ?? (status >= 200 && status < 300);
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init = {}) => {
    calls.push({ url: String(input), init });
    return {
      ok,
      status,
      statusText: "Status",
      json: async () => response.body ?? {},
    } as unknown as Response;
  });
  return calls;
}

describe("services/api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("posts JSON credentials to /api/auth/login and returns the parsed body", async () => {
      const calls = mockFetchOnce({
        body: { user: { id: "u1", email: "a@b.co", firstName: "A", lastName: "B", role: "user" } },
      });

      const result = await api.login({ email: "a@b.co", password: "pw" });

      expect(calls).toHaveLength(1);
      expect(calls[0].url).toBe("/api/auth/login");
      expect(calls[0].init.method).toBe("POST");
      expect(calls[0].init.body).toBe(JSON.stringify({ email: "a@b.co", password: "pw" }));
      expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe(
        "application/json",
      );
      expect(calls[0].init.credentials).toBe("same-origin");
      expect(result).toEqual({
        user: { id: "u1", email: "a@b.co", firstName: "A", lastName: "B", role: "user" },
      });
    });

    it("throws ApiError carrying the status and the server-provided message", async () => {
      mockFetchOnce({ ok: false, status: 401, body: { error: "Invalid credentials" } });

      await expect(api.login({ email: "a@b.co", password: "pw" })).rejects.toMatchObject({
        name: "ApiError",
        status: 401,
        message: "Invalid credentials",
      });
    });

    it("falls back to statusText when the error body is not JSON", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("not json");
        },
      } as unknown as Response);

      const err: unknown = await api
        .login({ email: "a@b.co", password: "pw" })
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(500);
      expect((err as ApiError).message).toBe("Internal Server Error");
    });
  });

  describe("logout", () => {
    it("returns undefined when the server replies 204", async () => {
      mockFetchOnce({ status: 204 });
      const result = await api.logout();
      expect(result).toBeUndefined();
    });
  });

  describe("getActivity", () => {
    it("encodes the activity id in the URL path", async () => {
      const calls = mockFetchOnce({ body: { id: "abc/def" } });

      await api.getActivity("abc/def");

      expect(calls[0].url).toBe("/api/activities/abc%2Fdef");
    });
  });

  describe("getActivitiesByCity", () => {
    it("includes activity and price filters in the query string when provided", async () => {
      const calls = mockFetchOnce({ body: { items: [], nextCursor: undefined } });

      await api.getActivitiesByCity({ city: "Paris", activity: "yoga", price: 30 });

      const url = new URL(calls[0].url, "http://localhost");
      expect(url.pathname).toBe("/api/activities/by-city");
      expect(url.searchParams.get("city")).toBe("Paris");
      expect(url.searchParams.get("activity")).toBe("yoga");
      expect(url.searchParams.get("price")).toBe("30");
    });

    it("omits optional filters that are undefined to avoid empty filter values", async () => {
      const calls = mockFetchOnce({ body: { items: [], nextCursor: undefined } });

      await api.getActivitiesByCity({ city: "Paris" });

      const url = new URL(calls[0].url, "http://localhost");
      expect(url.searchParams.get("city")).toBe("Paris");
      expect(url.searchParams.has("activity")).toBe(false);
      expect(url.searchParams.has("price")).toBe(false);
      expect(url.searchParams.has("cursor")).toBe(false);
      expect(url.searchParams.has("limit")).toBe(false);
    });

    it("returns the paginated response shape from the server", async () => {
      mockFetchOnce({
        body: { items: [{ id: "a1" }], nextCursor: "cur-1" },
      });

      const result = await api.getActivitiesByCity({ city: "Paris" });

      expect(result.nextCursor).toBe("cur-1");
      expect(result.items).toHaveLength(1);
    });

    it("forwards cursor and limit when paginating", async () => {
      const calls = mockFetchOnce({ body: { items: [], nextCursor: undefined } });

      await api.getActivitiesByCity({ city: "Paris", cursor: "c", limit: 5 });

      const url = new URL(calls[0].url, "http://localhost");
      expect(url.searchParams.get("cursor")).toBe("c");
      expect(url.searchParams.get("limit")).toBe("5");
    });
  });

  describe("register", () => {
    it("posts JSON to /api/auth/register and returns the parsed user", async () => {
      const calls = mockFetchOnce({
        body: { id: "u1", email: "a@b.co", firstName: "A", lastName: "B", role: "user" },
      });

      const result = await api.register({
        email: "a@b.co",
        password: "pw",
        firstName: "A",
        lastName: "B",
      });

      expect(calls[0].url).toBe("/api/auth/register");
      expect(calls[0].init.method).toBe("POST");
      expect((result as { id: string }).id).toBe("u1");
    });
  });

  describe("getMe", () => {
    it("requests /api/me and returns the current user", async () => {
      const calls = mockFetchOnce({
        body: { id: "u1", email: "a@b.co", firstName: "A", lastName: "B", role: "user" },
      });

      const result = await api.getMe();

      expect(calls[0].url).toBe("/api/me");
      expect(calls[0].init.method).toBeUndefined();
      expect((result as { id: string }).id).toBe("u1");
    });
  });

  describe("getLatestActivities", () => {
    it("requests /api/activities/latest and returns the activity list", async () => {
      const calls = mockFetchOnce({ body: [{ id: "a1" }, { id: "a2" }] });

      const result = await api.getLatestActivities();

      expect(calls[0].url).toBe("/api/activities/latest");
      expect(result).toHaveLength(2);
    });
  });

  describe("getCities", () => {
    it("requests /api/cities and returns the city list", async () => {
      const calls = mockFetchOnce({ body: ["Biarritz", "Paris"] });

      const result = await api.getCities();

      expect(calls[0].url).toBe("/api/cities");
      expect(result).toEqual(["Biarritz", "Paris"]);
    });
  });

  describe("createActivity", () => {
    it("posts JSON activity input to /api/activities and returns the created activity", async () => {
      const calls = mockFetchOnce({ body: { id: "a1", name: "Yoga" } });

      const result = await api.createActivity({
        name: "Yoga",
        city: "Paris",
        description: "d",
        price: 10,
      });

      expect(calls[0].url).toBe("/api/activities");
      expect(calls[0].init.method).toBe("POST");
      expect(calls[0].init.body).toBe(
        JSON.stringify({ name: "Yoga", city: "Paris", description: "d", price: 10 }),
      );
      expect((result as { id: string }).id).toBe("a1");
    });
  });

  describe("getActivities and getMyActivities", () => {
    it("getActivities returns the paginated response and forwards cursor/limit", async () => {
      const calls = mockFetchOnce({
        body: { items: [], nextCursor: "next" },
      });

      const result = await api.getActivities({ cursor: "c", limit: 10 });

      const url = new URL(calls[0].url, "http://localhost");
      expect(url.pathname).toBe("/api/activities");
      expect(url.searchParams.get("cursor")).toBe("c");
      expect(url.searchParams.get("limit")).toBe("10");
      expect(result.nextCursor).toBe("next");
    });

    it("getActivities omits the query string when no params are provided", async () => {
      const calls = mockFetchOnce({ body: { items: [], nextCursor: undefined } });

      await api.getActivities();

      expect(calls[0].url).toBe("/api/activities");
    });

    it("getMyActivities returns the paginated response", async () => {
      const calls = mockFetchOnce({
        body: { items: [{ id: "a1" }], nextCursor: undefined },
      });

      const result = await api.getMyActivities();

      expect(calls[0].url).toBe("/api/activities/mine");
      expect(result.items).toHaveLength(1);
    });
  });
});
