// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { City } from "./City";

describe("le composant City", () => {
  it("affiche le nom de la ville", () => {
    renderWithProviders(<City city="Bordeaux" />);

    expect(screen.getByText("Bordeaux")).toBeInTheDocument();
  });

  it("expose un lien vers l'explorateur de la ville", () => {
    renderWithProviders(<City city="Bordeaux" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/explorer/Bordeaux");
  });
});
