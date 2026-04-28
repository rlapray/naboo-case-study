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
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
