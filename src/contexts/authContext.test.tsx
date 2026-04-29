import { renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks";
import type * as ApiModule from "@/services/api";
import { AuthProvider } from "./authContext";

const getMe = vi.fn();

vi.mock("@/services/api", async () => {
  const actual = await vi.importActual<typeof ApiModule>("@/services/api");
  return {
    ApiError: actual.ApiError,
    api: { getMe: (...args: unknown[]): unknown => getMe(...args) },
  };
});

vi.mock("@/hooks/useSnackbar", () => ({
  useSnackbar: () => ({ error: vi.fn(), success: vi.fn() }),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StrictMode>
    <AuthProvider>{children}</AuthProvider>
  </StrictMode>
);

describe("AuthProvider", () => {
  beforeEach(() => {
    getMe.mockReset();
  });

  it("flips isLoading to false after getMe resolves under StrictMode", async () => {
    getMe.mockResolvedValue({ id: "1", email: "a@b.c" });
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toMatchObject({ email: "a@b.c" });
  });

  it("flips isLoading to false on 401 (unauthenticated user)", async () => {
    const { ApiError } = await import("@/services/api");
    getMe.mockRejectedValue(new ApiError(401, "Unauthorized"));
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

});
