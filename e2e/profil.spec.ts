import { expect, test } from "@playwright/test";
import { SEED_USER, signInAs } from "./fixtures/auth";

test.describe("Consultation du Profil", () => {
  test("affiche prénom, nom et email de l'Utilisateur connecté", async ({ page }) => {
    await signInAs(page);
    await page.goto("/profil");

    await expect(page.getByRole("heading", { name: "Mon profil" })).toBeVisible();
    await expect(page.getByText(SEED_USER.email)).toBeVisible();
    await expect(page.getByText(SEED_USER.firstName, { exact: true })).toBeVisible();
    await expect(page.getByText(SEED_USER.lastName, { exact: true })).toBeVisible();
  });
});
