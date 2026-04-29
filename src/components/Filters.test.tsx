// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { Filters } from "./Filters";

describe("Filters", () => {
  it("propage la saisie d'activité au parent", async () => {
    const user = userEvent.setup();
    const setSearchActivity = vi.fn();
    const setSearchPrice = vi.fn();

    renderWithProviders(
      <Filters
        activity={undefined}
        price={undefined}
        setSearchActivity={setSearchActivity}
        setSearchPrice={setSearchPrice}
      />,
    );

    await user.type(screen.getByPlaceholderText(/activité/i), "Yoga");

    expect(setSearchActivity).toHaveBeenLastCalledWith("Yoga");
    expect(setSearchPrice).not.toHaveBeenCalled();
  });

  it("efface la recherche d'activité quand le champ est vidé", async () => {
    const user = userEvent.setup();
    const setSearchActivity = vi.fn();

    renderWithProviders(
      <Filters
        activity="Yoga"
        price={undefined}
        setSearchActivity={setSearchActivity}
        setSearchPrice={vi.fn()}
      />,
    );

    await user.clear(screen.getByPlaceholderText(/activité/i));

    expect(setSearchActivity).toHaveBeenLastCalledWith(undefined);
  });

  it("propage le prix max au parent en number", async () => {
    const user = userEvent.setup();
    const setSearchPrice = vi.fn();

    renderWithProviders(
      <Filters
        activity={undefined}
        price={undefined}
        setSearchActivity={vi.fn()}
        setSearchPrice={setSearchPrice}
      />,
    );

    await user.type(screen.getByPlaceholderText(/prix max/i), "50");

    expect(setSearchPrice).toHaveBeenLastCalledWith(50);
  });

  it("efface le prix max quand le champ est vidé", async () => {
    const user = userEvent.setup();
    const setSearchPrice = vi.fn();

    renderWithProviders(
      <Filters
        activity={undefined}
        price={50}
        setSearchActivity={vi.fn()}
        setSearchPrice={setSearchPrice}
      />,
    );

    await user.clear(screen.getByPlaceholderText(/prix max/i));

    expect(setSearchPrice).toHaveBeenLastCalledWith(undefined);
  });
});
