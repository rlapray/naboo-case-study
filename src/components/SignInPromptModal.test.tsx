// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { SignInPromptModal } from "./SignInPromptModal";

describe("SignInPromptModal", () => {
  it("opened: false — le contenu de la modale n'est pas visible", () => {
    renderWithProviders(<SignInPromptModal opened={false} onClose={vi.fn()} />);

    expect(
      screen.queryByText(/connectez-vous pour ajouter des favoris/i),
    ).not.toBeInTheDocument();
  });

  it("opened: true — le titre et les deux CTA sont visibles", async () => {
    renderWithProviders(<SignInPromptModal opened={true} onClose={vi.fn()} />);

    expect(
      await screen.findByText(/connectez-vous pour ajouter des favoris/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /se connecter/i })).toHaveAttribute(
      "href",
      "/signin",
    );
    expect(screen.getByRole("link", { name: /s'inscrire/i })).toHaveAttribute(
      "href",
      "/signup",
    );
  });

  it("clic sur le bouton de fermeture — appelle onClose", async () => {
    const onClose = vi.fn();
    const ue = userEvent.setup();
    renderWithProviders(<SignInPromptModal opened={true} onClose={onClose} />);

    await screen.findByRole("dialog");
    const closeButton = screen.getByRole("button", { name: /fermer/i });
    await ue.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
