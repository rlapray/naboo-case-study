import { expect, test } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

test.describe("Garde de session — pages protégées (visiteur)", () => {
  for (const path of ["/profil", "/my-activities", "/activities/create"]) {
    test(`${path} redirige un visiteur vers /signin`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/signin$/, { timeout: 15000 });
    });
  }
});

test.describe("Garde de session — pages d'auth (utilisateur connecté)", () => {
  test("/signin redirige un Utilisateur connecté vers l'accueil", async ({ page }) => {
    await signInAs(page);
    await page.goto("/signin");
    await expect(page).toHaveURL(/\/$/);
  });

  test("/signup redirige un Utilisateur connecté vers l'accueil", async ({ page }) => {
    await signInAs(page);
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/$/);
  });
});
