import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext, SnackbarProvider } from "./snackbarContext";

function Trigger({ kind, message }: Readonly<{ kind: "error" | "success"; message: string }>) {
  const snackbar = useContext(SnackbarContext);
  return (
    <button type="button" onClick={() => snackbar[kind](message)}>
      trigger
    </button>
  );
}

function renderWithProvider(ui: React.ReactNode) {
  return render(
    <MantineProvider>
      <SnackbarProvider>{ui}</SnackbarProvider>
    </MantineProvider>,
  );
}

describe("SnackbarProvider", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays the success message after calling success()", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger kind="success" message="Saved!" />);

    await user.click(screen.getByRole("button", { name: "trigger" }));

    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("displays the error message and logs it on error()", async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderWithProvider(<Trigger kind="error" message="Boom" />);
    await user.click(screen.getByRole("button", { name: "trigger" }));

    expect(screen.getByText("Boom")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith("Boom");
  });

  it("efface automatiquement la notification après 1s", async () => {
    const user = userEvent.setup();
    renderWithProvider(<Trigger kind="success" message="Saved!" />);

    await user.click(screen.getByRole("button", { name: "trigger" }));
    expect(screen.getByText("Saved!")).toBeInTheDocument();

    // Le composant utilise un setTimeout natif de 1s ; on attend qu'il
    // disparaisse via findBy* + assertion d'absence.
    await waitFor(
      () => {
        expect(screen.queryByText("Saved!")).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
