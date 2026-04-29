// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Profile } from "@/pages/profil";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { FavoriteDto } from "@/types/favorite";
import type { UserDto } from "@/types/user";

const user: UserDto = {
  id: "u-1",
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Dupont",
  role: "user",
};

const makeActivity = (id: string, name: string) => ({
  id,
  name,
  city: "Paris",
  description: "Une activité sympa",
  price: 25,
  createdAt: "2026-04-29T10:00:00.000Z",
  owner: { id: "u-2", role: "user" as const, firstName: "Bob", lastName: "M" },
});

const makeFav = (
  id: string,
  activityId: string,
  name: string,
  position: number,
): FavoriteDto => ({
  id,
  activity: makeActivity(activityId, name),
  position,
  createdAt: "2026-04-29T10:00:00.000Z",
});

describe("Profile page", () => {
  it("affiche le message vide quand initialFavorites est vide", () => {
    renderWithProviders(<Profile initialFavorites={[]} />, {
      auth: { user },
    });
    expect(
      screen.getByText(/pas encore de favoris/i),
    ).toBeInTheDocument();
  });

  it("affiche l'avatar et l'email du user (régression)", () => {
    renderWithProviders(<Profile initialFavorites={[]} />, {
      auth: { user },
    });
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("affiche les 3 favoris dans l'ordre de position", () => {
    const favs = [
      makeFav("f-1", "a-1", "Yoga", 0),
      makeFav("f-2", "a-2", "Escalade", 1),
      makeFav("f-3", "a-3", "Natation", 2),
    ];
    renderWithProviders(<Profile initialFavorites={favs} />, {
      auth: { user, favoriteIds: new Set(["a-1", "a-2", "a-3"]) },
    });
    const links = screen.getAllByRole("link");
    const names = links.map((l) => l.textContent);
    expect(names[0]).toContain("Yoga");
    expect(names[1]).toContain("Escalade");
    expect(names[2]).toContain("Natation");
  });

  it("chaque entrée affiche un FavoriteToggle 'Retirer des favoris'", () => {
    const favs = [
      makeFav("f-1", "a-1", "Yoga", 0),
      makeFav("f-2", "a-2", "Escalade", 1),
      makeFav("f-3", "a-3", "Natation", 2),
    ];
    renderWithProviders(<Profile initialFavorites={favs} />, {
      auth: { user, favoriteIds: new Set(["a-1", "a-2", "a-3"]) },
    });
    const btns = screen.getAllByRole("button", { name: /retirer des favoris/i });
    expect(btns).toHaveLength(3);
  });
});
