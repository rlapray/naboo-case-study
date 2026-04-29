// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { FavoriteDto } from "@/types/favorite";
import type { UserDto } from "@/types/user";
import {
  FavoritesReorderableList,
  computeReorderedIds,
} from "./FavoritesReorderableList";

const loggedUser: UserDto = {
  id: "u-1",
  role: "user",
  email: "a@b.c",
  firstName: "Ada",
  lastName: "L",
};

function makeFavorite(id: string, name: string, position: number): FavoriteDto {
  return {
    id,
    position,
    createdAt: "2026-01-01T00:00:00.000Z",
    activity: {
      id: `act-${id}`,
      name,
      city: "Paris",
      description: "desc",
      price: 42,
      createdAt: "2026-01-01T00:00:00.000Z",
      owner: {
        id: "owner-1",
        role: "user",
        firstName: "Bob",
        lastName: "M",
      },
    },
  };
}

describe("FavoritesReorderableList — rendu", () => {
  const favorites = [
    makeFavorite("f1", "Surf", 0),
    makeFavorite("f2", "Yoga", 1),
    makeFavorite("f3", "Escalade", 2),
  ];

  it("rend une carte par favori dans l'ordre de la prop", () => {
    renderWithProviders(
      <FavoritesReorderableList favorites={favorites} onReorder={vi.fn()} />,
      { auth: { user: loggedUser, favoriteIds: new Set(["act-f1", "act-f2", "act-f3"]) } },
    );

    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Surf", "Yoga", "Escalade"]);
  });

  it("expose une poignée de drag accessible par favori", () => {
    renderWithProviders(
      <FavoritesReorderableList favorites={favorites} onReorder={vi.fn()} />,
      { auth: { user: loggedUser, favoriteIds: new Set() } },
    );

    expect(
      screen.getAllByRole("button", { name: /réordonner ce favori/i }),
    ).toHaveLength(3);
  });

  it("rend un FavoriteToggle par favori", () => {
    renderWithProviders(
      <FavoritesReorderableList favorites={favorites} onReorder={vi.fn()} />,
      {
        auth: {
          user: loggedUser,
          favoriteIds: new Set(["act-f1", "act-f2", "act-f3"]),
        },
      },
    );

    expect(
      screen.getAllByRole("button", { name: /retirer des favoris/i }),
    ).toHaveLength(3);
  });

  it("n'appelle pas onReorder spontanément au montage", () => {
    const onReorder = vi.fn();
    renderWithProviders(
      <FavoritesReorderableList favorites={favorites} onReorder={onReorder} />,
      { auth: { user: loggedUser, favoriteIds: new Set() } },
    );

    expect(onReorder).not.toHaveBeenCalled();
  });

  it("affiche ville et prix de chaque favori", () => {
    renderWithProviders(
      <FavoritesReorderableList favorites={favorites} onReorder={vi.fn()} />,
      { auth: { user: loggedUser, favoriteIds: new Set() } },
    );

    expect(screen.getAllByText("Paris")).toHaveLength(3);
    expect(screen.getAllByText("42€/j")).toHaveLength(3);
  });

  it("chaque carte lie le nom vers /activities/:id", () => {
    renderWithProviders(
      <FavoritesReorderableList favorites={favorites} onReorder={vi.fn()} />,
      { auth: { user: loggedUser, favoriteIds: new Set() } },
    );

    expect(screen.getByRole("link", { name: "Surf" })).toHaveAttribute(
      "href",
      "/activities/act-f1",
    );
  });
});

describe("computeReorderedIds", () => {
  it("déplace activeId à la position de overId (descente)", () => {
    expect(computeReorderedIds(["a", "b", "c"], "a", "b")).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("déplace activeId à la position de overId (montée)", () => {
    expect(computeReorderedIds(["a", "b", "c"], "c", "a")).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("retourne l'ordre identique si activeId === overId", () => {
    expect(computeReorderedIds(["a", "b", "c"], "b", "b")).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("retourne l'ordre identique si un id est inconnu", () => {
    expect(computeReorderedIds(["a", "b", "c"], "x", "a")).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("préserve la longueur de la liste", () => {
    const result = computeReorderedIds(["a", "b", "c", "d"], "d", "a");
    expect(result).toHaveLength(4);
    expect(new Set(result)).toEqual(new Set(["a", "b", "c", "d"]));
  });
});

describe("FavoritesReorderableList — structure DnD", () => {
  it("la poignée du 1er favori est focusable au clavier", () => {
    const favorites = [makeFavorite("f1", "Surf", 0), makeFavorite("f2", "Yoga", 1)];
    renderWithProviders(
      <FavoritesReorderableList favorites={favorites} onReorder={vi.fn()} />,
      { auth: { user: loggedUser, favoriteIds: new Set() } },
    );

    const handles = screen.getAllByRole("button", { name: /réordonner/i });
    handles[0].focus();
    expect(handles[0]).toHaveFocus();
  });

});
