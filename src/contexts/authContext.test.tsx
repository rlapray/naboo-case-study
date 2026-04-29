// @vitest-environment jsdom
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/contexts/authContext";
import type * as hooksModule from "@/hooks";
import { useAuth } from "@/hooks";

// Mocks à la frontière HTTP uniquement
vi.mock("@/services/api", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    details?: unknown;
    constructor(status: number, message: string, details?: unknown) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.details = details;
    }
  },
  api: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getFavoriteIds: vi.fn(),
    getFavorites: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
  },
}));

vi.mock("next/router", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const mockSnackbarError = vi.fn();
const mockSnackbarSuccess = vi.fn();

vi.mock("@/hooks", async (importOriginal) => {
  const original = await importOriginal<typeof hooksModule>();
  return {
    ...original,
    useSnackbar: () => ({ error: mockSnackbarError, success: mockSnackbarSuccess }),
  };
});

// Import api after mock setup
const { api, ApiError } = await import("@/services/api");

const fakeUser = { id: "u1", email: "test@test.com", firstName: "Alice", lastName: "Doe" };

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthContext — favoriteIds", () => {
  it("1. au mount si getMe réussit, loadFavoriteIds est appelé et favoriteIds est peuplé", async () => {
    vi.mocked(api.getMe).mockResolvedValue(fakeUser as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: ["act1", "act2"] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.getFavoriteIds).toHaveBeenCalledTimes(1);
    expect(result.current.favoriteIds).toEqual(new Set(["act1", "act2"]));
  });

  it("2. au mount si getMe rejette (401), favoriteIds reste vide ET getFavoriteIds n'est PAS appelé", async () => {
    vi.mocked(api.getMe).mockRejectedValue(new ApiError(401, "Unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(api.getFavoriteIds).not.toHaveBeenCalled();
    expect(result.current.favoriteIds).toEqual(new Set());
  });

  it("3. handleSignin réussi recharge favoriteIds", async () => {
    vi.mocked(api.getMe).mockRejectedValue(new ApiError(401, "Unauthorized"));
    vi.mocked(api.login).mockResolvedValue({ user: fakeUser } as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: ["act3"] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.getFavoriteIds).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleSignin({ email: "test@test.com", password: "secret" });
    });

    expect(api.getFavoriteIds).toHaveBeenCalledTimes(1);
    expect(result.current.favoriteIds).toEqual(new Set(["act3"]));
  });

  it("4. handleLogout remet favoriteIds à un Set vide", async () => {
    vi.mocked(api.getMe).mockResolvedValue(fakeUser as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: ["act1"] });
    vi.mocked(api.logout).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.favoriteIds).toEqual(new Set(["act1"])));

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(result.current.favoriteIds).toEqual(new Set());
  });

  it("5. addFavoriteId met à jour le Set de manière optimistic", async () => {
    vi.mocked(api.getMe).mockResolvedValue(fakeUser as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: [] });
    let resolveAdd!: () => void;
    vi.mocked(api.addFavorite).mockReturnValue(
      new Promise<never>((res) => { resolveAdd = res as () => void; }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      void result.current.addFavoriteId("newAct");
    });

    expect(result.current.favoriteIds).toEqual(new Set(["newAct"]));

    resolveAdd();
  });

  it("6. addFavoriteId rollback + snackbar.error sur échec API générique", async () => {
    vi.mocked(api.getMe).mockResolvedValue(fakeUser as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: ["existing"] });
    vi.mocked(api.addFavorite).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.favoriteIds).toEqual(new Set(["existing"])));

    await act(async () => {
      await result.current.addFavoriteId("newAct");
    });

    expect(result.current.favoriteIds).toEqual(new Set(["existing"]));
    expect(mockSnackbarError).toHaveBeenCalledWith("Une erreur est survenue");
  });

  it("7. addFavoriteId snackbar.error spécifique cap atteint sur ApiError 400", async () => {
    vi.mocked(api.getMe).mockResolvedValue(fakeUser as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: [] });
    vi.mocked(api.addFavorite).mockRejectedValue(new ApiError(400, "limit reached"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.addFavoriteId("newAct");
    });

    expect(mockSnackbarError).toHaveBeenCalledWith("Vous avez atteint la limite de 100 favoris.");
  });

  it("8. removeFavoriteId optimistic (l'ID est retiré immédiatement)", async () => {
    vi.mocked(api.getMe).mockResolvedValue(fakeUser as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: ["act1", "act2"] });
    let resolveRemove!: () => void;
    vi.mocked(api.removeFavorite).mockReturnValue(
      new Promise<never>((res) => { resolveRemove = res as () => void; }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.favoriteIds).toEqual(new Set(["act1", "act2"])));

    act(() => {
      void result.current.removeFavoriteId("act1");
    });

    expect(result.current.favoriteIds).toEqual(new Set(["act2"]));

    resolveRemove();
  });

  it("9. removeFavoriteId rollback + snackbar.error sur échec API", async () => {
    vi.mocked(api.getMe).mockResolvedValue(fakeUser as never);
    vi.mocked(api.getFavoriteIds).mockResolvedValue({ ids: ["act1", "act2"] });
    vi.mocked(api.removeFavorite).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.favoriteIds).toEqual(new Set(["act1", "act2"])));

    await act(async () => {
      await result.current.removeFavoriteId("act1");
    });

    expect(result.current.favoriteIds).toEqual(new Set(["act1", "act2"]));
    expect(mockSnackbarError).toHaveBeenCalledWith("Une erreur est survenue");
  });
});
