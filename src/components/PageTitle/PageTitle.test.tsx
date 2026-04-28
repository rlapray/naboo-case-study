import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { PageTitle } from "./PageTitle";

function wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const getTitle = () =>
  screen.getByRole("heading", {
    name: /Title/i,
  });

const getButton = () => screen.queryByRole("button");
const getLink = () => screen.queryByRole("link");

describe("le composant PageTitle", () => {
  it("affiche uniquement le titre si prevPath n'est pas défini", () => {
    render(<PageTitle title="Title" />, { wrapper });

    expect(getTitle()).toBeInTheDocument();
    expect(getButton()).not.toBeInTheDocument();
    expect(getLink()).not.toBeInTheDocument();
  });

  it("affiche uniquement le titre et le composant Link si prevPath est une string", () => {
    render(<PageTitle title="Title" prevPath="/" />, { wrapper });

    expect(getTitle()).toBeInTheDocument();
    expect(getButton()).toBeInTheDocument();
    expect(getLink()).toBeInTheDocument();
  });

  it("affiche uniquement le titre et l'icon si prevPath est une fonction", async () => {
    const goBack = vi.fn();
    render(<PageTitle title="Title" prevPath={goBack} />, { wrapper });

    expect(getTitle()).toBeInTheDocument();
    expect(getLink()).not.toBeInTheDocument();

    const buttonLink = getButton();
    expect(buttonLink).toBeInTheDocument();

    await userEvent.click(buttonLink!);

    await waitFor(() => expect(goBack).toHaveBeenCalled());
  });
});
