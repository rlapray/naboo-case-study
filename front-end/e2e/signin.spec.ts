import { expect, test } from "@playwright/test";

test.describe("Page Signin", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("affiche le formulaire de connexion", async ({ page }) => {
    await expect(page).toHaveTitle(/Connection/);
    await expect(page.getByRole("heading", { name: "Connection" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: "Valider" })).toBeVisible();
  });

  test("propose un lien vers l'inscription", async ({ page }) => {
    await expect(page.getByRole("link", { name: /S'inscrire/ })).toBeVisible();
  });
});
