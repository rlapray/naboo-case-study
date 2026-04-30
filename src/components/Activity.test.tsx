// @vitest-environment jsdom
import { Grid } from "@mantine/core";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { ActivityDto } from "@/types/activity";
import type { UserDto } from "@/types/user";
import { Activity } from "./Activity";

const renderInGrid = (activity: ActivityDto) =>
  renderWithProviders(
    <Grid>
      <Activity activity={activity} />
    </Grid>,
  );

const adminUser: UserDto = {
  id: "u-admin",
  role: "admin",
  firstName: "Alice",
  lastName: "Admin",
  email: "alice@admin.com",
};

const activity: ActivityDto = {
  id: "act-42",
  name: "Yoga matinal",
  city: "Paris",
  description: "Cours de yoga en plein air",
  price: 25,
  createdAt: "2026-01-01T08:00:00.000Z",
  owner: { id: "u-1", role: "user", firstName: "Ada", lastName: "Lovelace" },
};

describe("le composant Activity", () => {
  it("affiche le nom, la ville, le prix et la description", () => {
    renderInGrid(activity);

    expect(screen.getByText("Yoga matinal")).toBeInTheDocument();
    expect(screen.getByText("Paris")).toBeInTheDocument();
    expect(screen.getByText("25€/j")).toBeInTheDocument();
    expect(
      screen.getByText("Cours de yoga en plein air"),
    ).toBeInTheDocument();
  });

  it("expose un lien Voir plus pointant vers la fiche activité", () => {
    renderInGrid(activity);

    const link = screen.getByRole("link", { name: /voir plus/i });
    expect(link).toHaveAttribute("href", "/activities/act-42");
  });

  it("rend un FavoriteToggle en mode 'retirer' quand l'activité est favorite", () => {
    renderWithProviders(
      <Grid>
        <Activity activity={activity} />
      </Grid>,
      { auth: { favoriteIds: new Set(["act-42"]) } },
    );

    expect(
      screen.getByRole("button", { name: /retirer des favoris/i }),
    ).toBeInTheDocument();
  });

  it("rend un FavoriteToggle en mode 'ajouter' quand l'activité n'est pas favorite", () => {
    renderInGrid(activity);

    expect(
      screen.getByRole("button", { name: /ajouter aux favoris/i }),
    ).toBeInTheDocument();
  });

  it("affiche la date de création formatée pour un Administrateur", () => {
    renderWithProviders(
      <Grid>
        <Activity activity={activity} />
      </Grid>,
      { auth: { user: adminUser } },
    );

    expect(
      screen.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/),
    ).toBeInTheDocument();
  });

  it("n'affiche pas de date pour un user standard", () => {
    renderInGrid(activity);

    expect(
      screen.queryByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/),
    ).toBeNull();
  });
});
