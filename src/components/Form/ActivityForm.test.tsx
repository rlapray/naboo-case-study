import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import ActivityForm from "./ActivityForm";

const back = vi.fn();
const push = vi.fn();
const createActivity = vi.fn();
const searchCity = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({ back, push }),
}));

vi.mock("@/services/api", () => ({
  api: {
    createActivity: (...args: unknown[]): unknown => createActivity(...args),
  },
}));

vi.mock("@/services/cities", () => ({
  searchCity: (...args: unknown[]): unknown => searchCity(...args),
}));

describe("ActivityForm", () => {
  beforeEach(() => {
    back.mockReset();
    push.mockReset();
    createActivity.mockReset();
    searchCity.mockReset();
  });

  it("affiche les erreurs de validation et n'appelle pas l'API si on soumet vide", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivityForm />);

    await user.click(screen.getByRole("button", { name: /valider/i }));

    expect(await screen.findByText(/nom requis/i)).toBeInTheDocument();
    expect(screen.getByText(/description requise/i)).toBeInTheDocument();
    expect(screen.getByText(/localisation requise/i)).toBeInTheDocument();
    expect(
      screen.getByText(/prix requis et supérieur à 0/i),
    ).toBeInTheDocument();
    expect(createActivity).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });

  it("ne déclenche searchCity qu'après le debounce de 300ms et affiche les options", async () => {
    const user = userEvent.setup();
    searchCity.mockResolvedValue([{ nom: "Paris", code: "75056" }]);

    renderWithProviders(<ActivityForm />);

    const cityInput = screen.getByRole("combobox", { name: /localisation/i });
    await user.click(cityInput);
    await user.type(cityInput, "Pari");

    // Avant le debounce (300ms), searchCity ne doit pas avoir été appelé.
    expect(searchCity).not.toHaveBeenCalled();

    // Après le debounce, searchCity est appelé exactement une fois avec la requête.
    await vi.waitFor(() => {
      expect(searchCity).toHaveBeenCalledTimes(1);
    });
    expect(searchCity).toHaveBeenCalledWith("Pari");

    const option = await screen.findByRole(
      "option",
      { name: /paris/i, hidden: true },
    );
    expect(option).toBeInTheDocument();
  });

  it("soumet le formulaire valide, appelle l'API avec le payload et revient en arrière", async () => {
    const user = userEvent.setup();
    searchCity.mockResolvedValue([{ nom: "Paris", code: "75056" }]);
    createActivity.mockResolvedValue(undefined);

    renderWithProviders(<ActivityForm />);

    await user.type(
      screen.getByRole("textbox", { name: /nom de l'activité/i }),
      "Yoga",
    );
    await user.type(
      screen.getByRole("textbox", { name: /description/i }),
      "Session yoga matinale",
    );

    const cityInput = screen.getByRole("combobox", { name: /localisation/i });
    await user.click(cityInput);
    await user.type(cityInput, "Pari");

    const parisOption = await screen.findByRole(
      "option",
      { name: /paris/i, hidden: true },
    );
    await user.click(parisOption);

    const priceInput = screen.getByRole("spinbutton", { name: /prix/i });
    await user.clear(priceInput);
    await user.type(priceInput, "30");

    await user.click(screen.getByRole("button", { name: /valider/i }));

    await vi.waitFor(() => {
      expect(createActivity).toHaveBeenCalledTimes(1);
    });
    expect(createActivity).toHaveBeenCalledWith({
      name: "Yoga",
      description: "Session yoga matinale",
      city: "Paris",
      price: 30,
    });
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("déclenche le snackbar d'erreur si la création d'activité échoue", async () => {
    const user = userEvent.setup();
    const snackbarError = vi.fn();
    searchCity.mockResolvedValue([{ nom: "Paris", code: "75056" }]);
    createActivity.mockRejectedValue(new Error("api down"));

    renderWithProviders(<ActivityForm />, {
      snackbar: { error: snackbarError },
    });

    await user.type(
      screen.getByRole("textbox", { name: /nom de l'activité/i }),
      "Yoga",
    );
    await user.type(
      screen.getByRole("textbox", { name: /description/i }),
      "Session yoga matinale",
    );

    const cityInput = screen.getByRole("combobox", { name: /localisation/i });
    await user.click(cityInput);
    await user.type(cityInput, "Pari");
    const parisOption = await screen.findByRole(
      "option",
      { name: /paris/i, hidden: true },
    );
    await user.click(parisOption);

    const priceInput = screen.getByRole("spinbutton", { name: /prix/i });
    await user.clear(priceInput);
    await user.type(priceInput, "30");

    await user.click(screen.getByRole("button", { name: /valider/i }));

    await vi.waitFor(() => {
      expect(snackbarError).toHaveBeenCalledWith("Une erreur est survenue");
    });
    expect(back).not.toHaveBeenCalled();
  });

  it("affiche le message d'erreur de searchCity quand la recherche échoue", async () => {
    const user = userEvent.setup();
    const snackbarError = vi.fn();
    searchCity.mockRejectedValue(new Error("network down"));

    renderWithProviders(<ActivityForm />, {
      snackbar: { error: snackbarError },
    });

    const cityInput = screen.getByRole("combobox", { name: /localisation/i });
    await user.click(cityInput);
    await user.type(cityInput, "Pari");

    await vi.waitFor(() => {
      expect(snackbarError).toHaveBeenCalledWith("network down");
    });
  });

  it("retombe sur un message générique si searchCity rejette une non-Error", async () => {
    const user = userEvent.setup();
    const snackbarError = vi.fn();
    searchCity.mockRejectedValue("boom");

    renderWithProviders(<ActivityForm />, {
      snackbar: { error: snackbarError },
    });

    const cityInput = screen.getByRole("combobox", { name: /localisation/i });
    await user.click(cityInput);
    await user.type(cityInput, "Pari");

    await vi.waitFor(() => {
      expect(snackbarError).toHaveBeenCalledWith("Une erreur est survenue");
    });
  });
});
