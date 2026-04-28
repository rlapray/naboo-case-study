import { expect, test } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

test.describe("Déconnexion", () => {
  test("ferme la session, redirige vers l'accueil et reverrouille les pages protégées", async ({
    page,
  }) => {
    await signInAs(page);

    await page.goto("/logout");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/profil");
    await expect(page).toHaveURL(/\/signin$/);
  });
});
