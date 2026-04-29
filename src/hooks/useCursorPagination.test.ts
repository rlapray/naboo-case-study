// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ActivityDto, PaginatedActivitiesResponse } from "@/types/activity";
import { useCursorPagination } from "./useCursorPagination";

const dto = (id: string): ActivityDto => ({
  id,
  name: id,
  city: "Paris",
  description: "",
  price: 0,
  owner: { id: "u", role: "user", firstName: "U", lastName: "U" },
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("useCursorPagination", () => {
  it("appends fetched items and advances the cursor", async () => {
    const fetchPage = vi.fn(
      async (): Promise<PaginatedActivitiesResponse> => ({
        items: [dto("b"), dto("c")],
        nextCursor: "next",
      }),
    );
    const { result } = renderHook(() =>
      useCursorPagination({
        initial: [dto("a")],
        initialCursor: "cursor-1",
        fetchPage,
      }),
    );

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchPage).toHaveBeenCalledWith("cursor-1");
    expect(result.current.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(result.current.cursor).toBe("next");
  });

  it("clears the cursor when the server stops returning one", async () => {
    const fetchPage = vi.fn(
      async (): Promise<PaginatedActivitiesResponse> => ({ items: [dto("b")] }),
    );
    const { result } = renderHook(() =>
      useCursorPagination({ initial: [dto("a")], initialCursor: "c", fetchPage }),
    );

    await act(async () => { await result.current.loadMore(); });
    expect(result.current.cursor).toBeNull();
  });

  it("is a no-op when there is no cursor", async () => {
    const fetchPage = vi.fn();
    const { result } = renderHook(() =>
      useCursorPagination({ initial: [], initialCursor: null, fetchPage }),
    );

    await act(async () => { await result.current.loadMore(); });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("starts with loading=false and toggles true → false across an in-flight fetch", async () => {
    let resolve!: (v: PaginatedActivitiesResponse) => void;
    const fetchPage = vi.fn(
      () => new Promise<PaginatedActivitiesResponse>((r) => (resolve = r)),
    );
    const { result } = renderHook(() =>
      useCursorPagination({ initial: [], initialCursor: "c", fetchPage }),
    );

    expect(result.current.loading).toBe(false);

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.loadMore();
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolve({ items: [dto("b")], nextCursor: "next" });
      await pending;
    });
    expect(result.current.loading).toBe(false);
  });

  it("releases the in-flight guard after success so the next loadMore is accepted", async () => {
    const fetchPage = vi
      .fn<() => Promise<PaginatedActivitiesResponse>>()
      .mockResolvedValueOnce({ items: [dto("b")], nextCursor: "c2" })
      .mockResolvedValueOnce({ items: [dto("c")], nextCursor: undefined });
    const { result } = renderHook(() =>
      useCursorPagination({ initial: [dto("a")], initialCursor: "c1", fetchPage }),
    );

    await act(async () => { await result.current.loadMore(); });
    expect(result.current.cursor).toBe("c2");
    expect(result.current.loading).toBe(false);

    await act(async () => { await result.current.loadMore(); });
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, "c1");
    expect(fetchPage).toHaveBeenNthCalledWith(2, "c2");
    expect(result.current.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(result.current.cursor).toBeNull();
  });

  it("guards re-entrant calls while a fetch is in flight", async () => {
    const fetchPage = vi.fn(
      async (): Promise<PaginatedActivitiesResponse> => ({
        items: [dto("x")],
        nextCursor: undefined,
      }),
    );
    const { result } = renderHook(() =>
      useCursorPagination({ initial: [], initialCursor: "c", fetchPage }),
    );

    await act(async () => {
      await Promise.all([result.current.loadMore(), result.current.loadMore()]);
    });

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it("reset replaces items and cursor (filter navigation)", () => {
    const { result } = renderHook(() =>
      useCursorPagination({
        initial: [dto("a")],
        initialCursor: "c",
        fetchPage: vi.fn(),
      }),
    );

    act(() => { result.current.reset([dto("z")], null); });
    expect(result.current.items.map((i) => i.id)).toEqual(["z"]);
    expect(result.current.cursor).toBeNull();
  });
});
