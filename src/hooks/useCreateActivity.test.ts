// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCreateActivity } from "./useCreateActivity";

const createActivity = vi.fn();

vi.mock("@/services/api", () => ({
  api: {
    createActivity: (...args: unknown[]): unknown => createActivity(...args),
  },
}));

const baseInput = {
  name: "Yoga",
  city: "Rouen",
  description: "Session yoga",
  price: 30,
};

describe("useCreateActivity", () => {
  beforeEach(() => {
    createActivity.mockReset();
  });

  it("guards against double-submit even when both calls fire before any state update", async () => {
    let resolve!: () => void;
    createActivity.mockImplementation(
      () => new Promise<void>((r) => (resolve = r)),
    );
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useCreateActivity({ onSuccess, onError }));

    let firstAccepted: boolean | undefined;
    let secondAccepted: boolean | undefined;
    await act(async () => {
      const a = result.current.submit(baseInput);
      const b = result.current.submit(baseInput);
      // The 2nd call is guarded synchronously and resolves immediately to false.
      secondAccepted = await b;
      resolve();
      firstAccepted = await a;
    });

    expect(createActivity).toHaveBeenCalledTimes(1);
    expect(firstAccepted).toBe(true);
    expect(secondAccepted).toBe(false);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("propagates failures to onError without leaving the guard stuck", async () => {
    createActivity.mockRejectedValueOnce(new Error("boom"));
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useCreateActivity({ onSuccess, onError }));

    await act(async () => {
      const ok = await result.current.submit(baseInput);
      expect(ok).toBe(false);
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onSuccess).not.toHaveBeenCalled();
    // Guard must be released after error: a second submit must be accepted.
    expect(result.current.isLoading).toBe(false);
    createActivity.mockResolvedValueOnce(undefined);
    await act(async () => {
      const ok = await result.current.submit(baseInput);
      expect(ok).toBe(true);
    });
    expect(createActivity).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("toggles isLoading: false → true while in-flight → false after success", async () => {
    let resolve!: () => void;
    createActivity.mockImplementation(
      () => new Promise<void>((r) => (resolve = r)),
    );
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useCreateActivity({ onSuccess, onError }));

    expect(result.current.isLoading).toBe(false);

    let pending!: Promise<boolean>;
    act(() => {
      pending = result.current.submit(baseInput);
    });
    // While the promise is in flight, isLoading must be true.
    expect(result.current.isLoading).toBe(true);
    // And re-entrant submits must be rejected.
    const reentrant = await result.current.submit(baseInput);
    expect(reentrant).toBe(false);

    await act(async () => {
      resolve();
      await pending;
    });
    expect(result.current.isLoading).toBe(false);
    expect(createActivity).toHaveBeenCalledTimes(1);
  });

  it("releases the guard after success so a subsequent submit is accepted", async () => {
    createActivity.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useCreateActivity({ onSuccess, onError }));

    await act(async () => {
      expect(await result.current.submit(baseInput)).toBe(true);
    });
    await act(async () => {
      expect(await result.current.submit(baseInput)).toBe(true);
    });
    expect(createActivity).toHaveBeenCalledTimes(2);
    expect(onSuccess).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
  });
});
