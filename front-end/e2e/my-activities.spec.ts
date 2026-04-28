import { expect, test } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

test.describe("Mes activités", () => {
  test("liste uniquement les Activités du Propriétaire connecté", async ({ page }) => {
    await signInAs(page);
    await page.goto("/my-activities");

    await expect(page).toHaveTitle(/Mes activités/);
    await expect(page.getByRole("heading", { name: "Mes activités" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ajouter une activité" }),
    ).toBeVisible();
  });

  test("redirige un visiteur vers /signin", async ({ page }) => {
    await page.goto("/my-activities");
    await page.waitForURL(/\/signin$/, { timeout: 15000 });
  });
});
