// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import SignupForm from "./SignupForm";

describe("le composant SignupForm", () => {
  it("affiche les erreurs de validation et n'appelle pas handleSignup quand le formulaire est vide", async () => {
    const user = userEvent.setup();
    const handleSignup = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<SignupForm />, {
      auth: { handleSignup, isLoading: false },
    });

    await user.click(screen.getByRole("button", { name: "Valider" }));

    expect(await screen.findByText("Email invalide")).toBeInTheDocument();
    expect(screen.getByText("Mot de passe requis")).toBeInTheDocument();
    expect(screen.getByText("Prénom requis")).toBeInTheDocument();
    expect(screen.getByText("Nom requis")).toBeInTheDocument();
    expect(handleSignup).not.toHaveBeenCalled();
  });

  it("appelle handleSignup avec les valeurs saisies quand le formulaire est valide", async () => {
    const user = userEvent.setup();
    const handleSignup = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<SignupForm />, {
      auth: { handleSignup, isLoading: false },
    });

    await user.type(screen.getByLabelText(/Email/), "jane@example.com");
    await user.type(screen.getByLabelText(/Mot de passe/), "secret123");
    await user.type(screen.getByLabelText(/First name/), "Jane");
    await user.type(screen.getByLabelText(/Last name/), "Doe");

    await user.click(screen.getByRole("button", { name: "Valider" }));

    expect(handleSignup).toHaveBeenCalledTimes(1);
    expect(handleSignup).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "secret123",
      firstName: "Jane",
      lastName: "Doe",
    });
  });
});
