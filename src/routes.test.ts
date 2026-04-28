import { describe, expect, it } from "vitest";
import { routes } from "./routes";

describe("nav routes — French spelling", () => {
  it("uses 'Connexion' (not 'Connection') for the signin entry", () => {
    const userMenu = routes.find((r) => r.label === "Utilisateur");
    expect(userMenu).toBeDefined();
    const items = Array.isArray(userMenu!.route) ? userMenu!.route : [];
    const signin = items.find((i) => i.link === "/signin");
    expect(signin?.label).toBe("Connexion");
  });
});
