import { Grid } from "@mantine/core";
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { ActivityDto } from "@/types/activity";
import { Activity } from "./Activity";

const renderInGrid = (activity: ActivityDto) =>
  renderWithProviders(
    <Grid>
      <Activity activity={activity} />
    </Grid>,
  );

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
});
