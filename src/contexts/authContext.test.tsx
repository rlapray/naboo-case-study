// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, useContext } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks";
import type * as ApiModule from "@/services/api";
import { AuthProvider } from "./authContext";

const getMe = vi.fn();
const login = vi.fn();
const register = vi.fn();
const logout = vi.fn();
const push = vi.fn();
const snackbarError = vi.fn();

vi.mock("@/services/api", async () => {
  const actual = await vi.importActual<typeof ApiModule>("@/services/api");
  return {
    ApiError: actual.ApiError,
    api: {
      getMe: (...args: unknown[]): unknown => getMe(...args),
      login: (...args: unknown[]): unknown => login(...args),
      register: (...args: unknown[]): unknown => register(...args),
      logout: (...args: unknown[]): unknown => logout(...args),
    },
  };
});

vi.mock("@/hooks/useSnackbar", () => ({
  useSnackbar: () => ({ error: snackbarError, success: vi.fn() }),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ push }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <StrictMode>
    <AuthProvider>{children}</AuthProvider>
  </StrictMode>
);

async function renderReadyAuth() {
  const { ApiError } = await import("@/services/api");
  getMe.mockRejectedValue(new ApiError(401, "Unauthorized"));
  const { result } = renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  return result;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    getMe.mockReset();
    login.mockReset();
    register.mockReset();
    logout.mockReset();
    push.mockReset();
    snackbarError.mockReset();
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

  it("handleSignin: stocke l'utilisateur et redirige vers /profil", async () => {
    const result = await renderReadyAuth();
    login.mockResolvedValue({ user: { id: "u-1", email: "a@b.c" } });

    await act(async () => {
      await result.current.handleSignin({ email: "a@b.c", password: "x" });
    });

    expect(result.current.user).toMatchObject({ email: "a@b.c" });
    expect(push).toHaveBeenCalledWith("/profil");
    expect(snackbarError).not.toHaveBeenCalled();
  });

  it("handleSignin: déclenche un snackbar d'erreur en cas d'échec", async () => {
    const result = await renderReadyAuth();
    login.mockRejectedValue(new Error("nope"));

    await act(async () => {
      await result.current.handleSignin({ email: "a@b.c", password: "x" });
    });

    expect(result.current.user).toBeNull();
    expect(snackbarError).toHaveBeenCalledWith("Une erreur est survenue");
  });

  it("handleSignup: redirige vers /signin en cas de succès", async () => {
    const result = await renderReadyAuth();
    register.mockResolvedValue({ id: "u-1" });

    await act(async () => {
      await result.current.handleSignup({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "a@b.c",
        password: "x",
      });
    });

    expect(push).toHaveBeenCalledWith("/signin");
  });

  it("handleLogout: vide l'utilisateur et redirige vers /", async () => {
    getMe.mockResolvedValue({ id: "u-1", email: "a@b.c" });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());
    logout.mockResolvedValue({ ok: true });

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(result.current.user).toBeNull();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("logue l'erreur quand getMe échoue avec autre chose qu'un 401", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    getMe.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    errorSpy.mockRestore();
  });

  it("handleSignup: déclenche un snackbar d'erreur en cas d'échec", async () => {
    const result = await renderReadyAuth();
    register.mockRejectedValue(new Error("nope"));

    await act(async () => {
      await result.current.handleSignup({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "a@b.c",
        password: "x",
      });
    });

    expect(snackbarError).toHaveBeenCalledWith("Une erreur est survenue");
    expect(push).not.toHaveBeenCalledWith("/signin");
  });

  it("expose des handlers par défaut résolvants quand le contexte est consommé sans Provider", async () => {
    const { AuthContext } = await import("./authContext");
    const { result } = renderHook(() => useContext(AuthContext));
    await expect(
      result.current.handleSignin({ email: "", password: "" }),
    ).resolves.toBeUndefined();
    await expect(
      result.current.handleSignup({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      }),
    ).resolves.toBeUndefined();
    await expect(result.current.handleLogout()).resolves.toBeUndefined();
  });

  it("handleLogout: snackbar d'erreur si l'API échoue", async () => {
    const result = await renderReadyAuth();
    logout.mockRejectedValue(new Error("nope"));

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(snackbarError).toHaveBeenCalledWith("Une erreur est survenue");
  });
});
