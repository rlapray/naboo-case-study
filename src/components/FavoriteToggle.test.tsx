// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { UserDto } from "@/types/user";
import { FavoriteToggle } from "./FavoriteToggle";

const loggedInUser: UserDto = {
  id: "u-1",
  role: "user",
  email: "a@b.c",
  firstName: "Ada",
  lastName: "L",
};

describe("FavoriteToggle", () => {
  it("visiteur non connecté — clic ouvre la modale et n'appelle pas addFavoriteId", async () => {
    const addFavoriteId = vi.fn();
    const ue = userEvent.setup();
    renderWithProviders(<FavoriteToggle activityId="act-42" />, {
      auth: { user: null, favoriteIds: new Set(), addFavoriteId },
    });

    await ue.click(screen.getByRole("button", { name: /ajouter aux favoris/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(addFavoriteId).not.toHaveBeenCalled();
  });

  it("visiteur — la modale propose un lien vers /signin", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<FavoriteToggle activityId="act-42" />, {
      auth: { user: null, favoriteIds: new Set() },
    });

    await ue.click(screen.getByRole("button", { name: /ajouter aux favoris/i }));
    await screen.findByRole("dialog");

    expect(screen.getByRole("link", { name: /se connecter/i })).toHaveAttribute(
      "href",
      "/signin",
    );
  });

  it("visiteur — la modale propose un lien vers /signup", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<FavoriteToggle activityId="act-42" />, {
      auth: { user: null, favoriteIds: new Set() },
    });

    await ue.click(screen.getByRole("button", { name: /ajouter aux favoris/i }));
    await screen.findByRole("dialog");

    expect(screen.getByRole("link", { name: /s'inscrire/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("connecté + non-favori — clic appelle addFavoriteId avec l'activityId", async () => {
    const addFavoriteId = vi.fn();
    const ue = userEvent.setup();
    renderWithProviders(<FavoriteToggle activityId="act-42" />, {
      auth: { user: loggedInUser, favoriteIds: new Set(), addFavoriteId },
    });

    await ue.click(screen.getByRole("button", { name: /ajouter aux favoris/i }));

    expect(addFavoriteId).toHaveBeenCalledWith("act-42");
  });

  it("connecté + favori — clic appelle removeFavoriteId avec l'activityId", async () => {
    const removeFavoriteId = vi.fn();
    const ue = userEvent.setup();
    renderWithProviders(<FavoriteToggle activityId="act-42" />, {
      auth: {
        user: loggedInUser,
        favoriteIds: new Set(["act-42"]),
        removeFavoriteId,
      },
    });

    await ue.click(screen.getByRole("button", { name: /retirer des favoris/i }));

    expect(removeFavoriteId).toHaveBeenCalledWith("act-42");
  });

  it("connecté + favori — l'aria-label reflète l'état favori", () => {
    renderWithProviders(<FavoriteToggle activityId="act-42" />, {
      auth: { user: loggedInUser, favoriteIds: new Set(["act-42"]) },
    });

    expect(
      screen.getByRole("button", { name: /retirer des favoris/i }),
    ).toBeInTheDocument();
  });
});
