// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActivityDetails from "@/pages/activities/[id]";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { ActivityDto } from "@/types/activity";
import type { UserDto } from "@/types/user";

vi.mock("next/router", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

const activity: ActivityDto = {
  id: "a-1",
  name: "Yoga Paris",
  city: "Paris",
  description: "Un super cours de yoga",
  price: 30,
  createdAt: "2026-04-29T10:00:00.000Z",
  owner: { id: "u-2", role: "user", firstName: "Bob", lastName: "M" },
};

const user: UserDto = {
  id: "u-1",
  email: "alice@example.com",
  firstName: "Alice",
  lastName: "Dupont",
  role: "user",
};

describe("ActivityDetails page", () => {
  it("affiche le FavoriteToggle 'Ajouter aux favoris' quand non favori", () => {
    renderWithProviders(<ActivityDetails activity={activity} />, {
      auth: { user, favoriteIds: new Set() },
    });
    expect(
      screen.getByRole("button", { name: /ajouter aux favoris/i }),
    ).toBeInTheDocument();
  });

  it("affiche le nom de l'activité et son owner (régression)", () => {
    renderWithProviders(<ActivityDetails activity={activity} />, {
      auth: { user },
    });
    expect(screen.getByText("Yoga Paris")).toBeInTheDocument();
    expect(screen.getByText(/Bob M/i)).toBeInTheDocument();
  });
});
