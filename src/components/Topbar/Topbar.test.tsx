// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { UserDto } from "@/types/user";
import { Topbar } from "./Topbar";
import type { Route } from "./types";

const routes: readonly Route[] = [
  { label: "Explore", route: "/explore" },
  { label: "My account", route: "/me", requiredAuth: true },
  { label: "Sign in", route: "/signin", requiredAuth: false },
];

const authenticatedUser: UserDto = {
  id: "user-1",
  role: "user",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
};

describe("le composant Topbar", () => {
  it("affiche les routes publiques et guest-only quand l'utilisateur n'est pas connecté", () => {
    renderWithProviders(<Topbar routes={routes} />, { auth: { user: null } });

    expect(screen.getByRole("link", { name: "Explore" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "My account" }),
    ).not.toBeInTheDocument();
  });

  it("affiche les routes publiques et auth-only quand l'utilisateur est connecté", () => {
    renderWithProviders(<Topbar routes={routes} />, {
      auth: { user: authenticatedUser },
    });

    expect(screen.getByRole("link", { name: "Explore" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "My account" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Sign in" }),
    ).not.toBeInTheDocument();
  });

  it("expose un lien titre Candidator pointant vers la racine", () => {
    renderWithProviders(<Topbar routes={routes} />, { auth: { user: null } });

    const titleLink = screen.getByRole("link", { name: /Candidator/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", "/");
  });
});
