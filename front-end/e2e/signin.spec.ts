import { expect, test } from "@playwright/test";
import { SEED_USER } from "./fixtures/auth";

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

  test("connecte un Utilisateur valide et redirige vers /profil", async ({ page }) => {
    await page.getByLabel("Email").fill(SEED_USER.email);
    await page.getByLabel("Mot de passe").fill(SEED_USER.password);
    await page.getByRole("button", { name: "Valider" }).click();

    await page.waitForURL((url) => !url.pathname.endsWith("/signin"));
    await page.goto("/profil");
    await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
  });

  test("rejette un mot de passe invalide et reste sur /signin", async ({ page }) => {
    await page.getByLabel("Email").fill(SEED_USER.email);
    await page.getByLabel("Mot de passe").fill("wrong-password");
    await page.getByRole("button", { name: "Valider" }).click();

    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole("heading", { name: "Connection" })).toBeVisible();
  });
});
