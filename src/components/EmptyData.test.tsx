import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { EmptyData } from "./EmptyData";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

describe("le composant EmptyData", () => {
  it("affiche le message vide et l'illustration accessible", () => {
    renderWithProviders(<EmptyData />);

    expect(
      screen.getByText(/aucune donnée pour le moment/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /no data/i })).toBeInTheDocument();
  });
});
