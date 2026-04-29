import { IconUserCircle } from "@tabler/icons-react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { MenuItem } from "./MenuItem";

describe("le composant MenuItem", () => {
  it("rend un lien direct quand route est une string sans icône", () => {
    renderWithProviders(
      <MenuItem label="Explorer" route="/explorer" />,
    );

    const link = screen.getByRole("link", { name: "Explorer" });
    expect(link).toHaveAttribute("href", "/explorer");
  });

  it("rend une icône cliquable quand route est une string avec icône", () => {
    renderWithProviders(
      <MenuItem label="Profil" route="/profil" icon={IconUserCircle} />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/profil");
  });

  it("rend un menu déroulant qui expose chaque sous-route au survol", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MenuItem
        label="Compte"
        route={[
          { link: "/signin", label: "Connexion" },
          { link: "/signup", label: "Inscription" },
        ]}
      />,
    );

    await user.hover(screen.getByText("Compte"));

    const items = await screen.findAllByRole("menuitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Connexion");
    expect(items[0]).toHaveAttribute("href", "/signin");
    expect(items[1]).toHaveTextContent("Inscription");
    expect(items[1]).toHaveAttribute("href", "/signup");
  });

  it("affiche l'icône dans le trigger du menu déroulant quand icon est fourni", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <MenuItem
        label="Compte"
        icon={IconUserCircle}
        route={[
          { link: "/signin", label: "Connexion" },
          { link: "/signup", label: "Inscription" },
        ]}
      />,
    );

    // Le label texte n'est PAS rendu dans le trigger (branche icon).
    expect(screen.queryByText("Compte")).not.toBeInTheDocument();

    // Le menu reste fonctionnel : on hover sur le svg de l'icône via son
    // conteneur p.classes.link rendu par Mantine.
    const triggers = document.querySelectorAll("svg");
    expect(triggers.length).toBeGreaterThan(0);
    await user.hover(triggers[0]);

    const items = await screen.findAllByRole("menuitem");
    expect(items).toHaveLength(2);
  });
});
