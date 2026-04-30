// @vitest-environment jsdom
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import type { UserDto } from "@/types/user";
import { DebugCreatedAt } from "./DebugCreatedAt";

const adminUser: UserDto = {
  id: "u-admin",
  role: "admin",
  email: "a@b.c",
  firstName: "A",
  lastName: "B",
};

const standardUser: UserDto = {
  id: "u-1",
  role: "user",
  email: "u@b.c",
  firstName: "U",
  lastName: "B",
};

const activity = { createdAt: "2026-04-30T14:32:00.000Z" };

describe("DebugCreatedAt", () => {
  it("admin — affiche la date au format dd/MM/yyyy HH:mm", () => {
    renderWithProviders(<DebugCreatedAt activity={activity} />, {
      auth: { user: adminUser },
    });

    expect(
      screen.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/),
    ).toBeInTheDocument();
  });

  it("user standard — ne rend rien", () => {
    renderWithProviders(<DebugCreatedAt activity={activity} />, {
      auth: { user: standardUser },
    });

    expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).toBeNull();
  });

  it("visiteur non connecté — ne rend rien", () => {
    renderWithProviders(<DebugCreatedAt activity={activity} />, {
      auth: { user: null },
    });

    expect(screen.queryByText(/\d{2}\/\d{2}\/\d{4}/)).toBeNull();
  });
});
