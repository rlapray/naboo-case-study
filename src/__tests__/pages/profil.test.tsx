// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Profile } from "@/pages/profil";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { FavoriteDto } from "@/types/favorite";
import type { UserDto } from "@/types/user";

vi.mock("@/services/api", () => ({
  api: {
    reorderFavorites: vi.fn(),
  },
}));

vi.mock("@/components", async (orig) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await orig<typeof import("@/components")>();
  return {
    ...actual,
    FavoritesReorderableList: ({
      onReorder,
      favorites,
    }: {
      favorites: FavoriteDto[];
      onReorder: (ids: string[]) => void;
    }) => (
      <div>
        {favorites.map((f) => (
          <span key={f.id}>{f.activity.name}</span>
        ))}
        <button onClick={() => onReorder(["f-3", "f-1", "f-2"])}>
          trigger reorder
        </button>
      </div>
    ),
  };
});

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

  it("affiche les 3 favoris dans l'ordre de position via FavoritesReorderableList", () => {
    const favs = [
      makeFav("f-1", "a-1", "Yoga", 0),
      makeFav("f-2", "a-2", "Escalade", 1),
      makeFav("f-3", "a-3", "Natation", 2),
    ];
    renderWithProviders(<Profile initialFavorites={favs} />, {
      auth: { user, favoriteIds: new Set(["a-1", "a-2", "a-3"]) },
    });
    expect(screen.getByText("Yoga")).toBeInTheDocument();
    expect(screen.getByText("Escalade")).toBeInTheDocument();
    expect(screen.getByText("Natation")).toBeInTheDocument();
  });

  it("liste vide : message affiché, FavoritesReorderableList non rendu", () => {
    renderWithProviders(<Profile initialFavorites={[]} />, { auth: { user } });
    expect(screen.getByText(/pas encore de favoris/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /trigger reorder/i })).not.toBeInTheDocument();
  });

  describe("optimistic update & rollback", () => {
    const favA = makeFav("f-1", "a-1", "Yoga", 0);
    const favB = makeFav("f-2", "a-2", "Escalade", 1);
    const favC = makeFav("f-3", "a-3", "Natation", 2);
    const initialFavs = [favA, favB, favC];

    it("applique l'ordre optimiste avant que l'API réponde", async () => {
      const { api } = await import("@/services/api");
      vi.mocked(api.reorderFavorites).mockReturnValue(new Promise(() => {}));

      const userEvt = userEvent.setup();
      renderWithProviders(<Profile initialFavorites={initialFavs} />, { auth: { user } });

      await userEvt.click(screen.getByRole("button", { name: /trigger reorder/i }));

      // Le mock rend les noms dans l'ordre du tableau favorites — après optimistic, f-3 en premier
      const spans = screen.getAllByText(/Yoga|Escalade|Natation/);
      expect(spans[0]).toHaveTextContent("Natation");
      expect(spans[1]).toHaveTextContent("Yoga");
      expect(spans[2]).toHaveTextContent("Escalade");
    });

    it("applique l'ordre renvoyé par le serveur après succès API", async () => {
      const { api } = await import("@/services/api");
      const serverOrder = [
        { ...favC, position: 0 },
        { ...favA, position: 1 },
        { ...favB, position: 2 },
      ];
      vi.mocked(api.reorderFavorites).mockResolvedValue({ items: serverOrder });

      const userEvt = userEvent.setup();
      renderWithProviders(<Profile initialFavorites={initialFavs} />, { auth: { user } });

      await userEvt.click(screen.getByRole("button", { name: /trigger reorder/i }));

      const spans = await screen.findAllByText(/Yoga|Escalade|Natation/);
      expect(spans[0]).toHaveTextContent("Natation");
      expect(spans[1]).toHaveTextContent("Yoga");
      expect(spans[2]).toHaveTextContent("Escalade");
    });

    it("revient à l'ordre initial et appelle snackbar.error sur erreur API", async () => {
      const { api } = await import("@/services/api");
      vi.mocked(api.reorderFavorites).mockRejectedValue(new Error("Network error"));

      const snackbarError = vi.fn();
      const userEvt = userEvent.setup();
      renderWithProviders(<Profile initialFavorites={initialFavs} />, {
        auth: { user },
        snackbar: { error: snackbarError },
      });

      await userEvt.click(screen.getByRole("button", { name: /trigger reorder/i }));

      const spans = await screen.findAllByText(/Yoga|Escalade|Natation/);
      expect(spans[0]).toHaveTextContent("Yoga");
      expect(spans[1]).toHaveTextContent("Escalade");
      expect(spans[2]).toHaveTextContent("Natation");
      expect(snackbarError).toHaveBeenCalledWith(
        "Une erreur est survenue lors du réordonnancement.",
      );
    });
  });
});
