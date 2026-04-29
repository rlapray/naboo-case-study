import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import SigninForm from "./SigninForm";

describe("le composant SigninForm", () => {
  it("affiche les erreurs de validation et n'appelle pas handleSignin si le formulaire est soumis vide", async () => {
    const user = userEvent.setup();
    const handleSignin = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<SigninForm />, { auth: { handleSignin } });

    await user.click(screen.getByRole("button", { name: /valider/i }));

    expect(await screen.findByText("Email invalide")).toBeInTheDocument();
    expect(screen.getByText("Mot de passe requis")).toBeInTheDocument();
    expect(handleSignin).not.toHaveBeenCalled();
  });

  it("affiche l'erreur d'email invalide et n'appelle pas handleSignin si l'email est mal formé", async () => {
    const user = userEvent.setup();
    const handleSignin = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<SigninForm />, { auth: { handleSignin } });

    await user.type(screen.getByLabelText(/email/i), "pasunemail");
    await user.type(screen.getByLabelText(/mot de passe/i), "secret123");
    await user.click(screen.getByRole("button", { name: /valider/i }));

    expect(await screen.findByText("Email invalide")).toBeInTheDocument();
    expect(handleSignin).not.toHaveBeenCalled();
  });

  it("appelle handleSignin avec les valeurs saisies si email et mot de passe sont valides", async () => {
    const user = userEvent.setup();
    const handleSignin = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<SigninForm />, { auth: { handleSignin } });

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/mot de passe/i), "secret123");
    await user.click(screen.getByRole("button", { name: /valider/i }));

    expect(handleSignin).toHaveBeenCalledTimes(1);
    expect(handleSignin).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "secret123",
    });
  });
});
