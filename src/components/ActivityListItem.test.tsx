// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { ActivityDto } from "@/types/activity";
import { ActivityListItem } from "./ActivityListItem";

const activity: ActivityDto = {
  id: "act-7",
  name: "Escalade",
  city: "Lyon",
  description: "Bloc en salle",
  price: 18,
  createdAt: "2026-01-01T08:00:00.000Z",
  owner: { id: "u-1", role: "user", firstName: "Ada", lastName: "Lovelace" },
};

describe("le composant ActivityListItem", () => {
  it("affiche les champs principaux de l'activité", () => {
    renderWithProviders(<ActivityListItem activity={activity} />);

    expect(screen.getByText("Escalade")).toBeInTheDocument();
    expect(screen.getByText("Lyon")).toBeInTheDocument();
    expect(screen.getByText("Bloc en salle")).toBeInTheDocument();
    expect(screen.getByText("18€/j")).toBeInTheDocument();
  });

  it("expose un lien Voir plus pointant vers la fiche activité", () => {
    renderWithProviders(<ActivityListItem activity={activity} />);

    const link = screen.getByRole("link", { name: /voir plus/i });
    expect(link).toHaveAttribute("href", "/activities/act-7");
  });
});
