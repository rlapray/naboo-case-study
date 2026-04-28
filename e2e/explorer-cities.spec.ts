import { expect, test } from "@playwright/test";

test.describe("Explorer les Villes", () => {
  test("liste les Villes distinctes du Catalogue", async ({ page }) => {
    await page.goto("/explorer");

    await expect(page).toHaveTitle(/Explorer/);
    await expect(
      page.getByRole("heading", { name: "Trouvez une activité dans votre ville" }),
    ).toBeVisible();

    for (const city of ["Paris", "Chamonix", "Saint-Malo", "Versailles"]) {
      await expect(page.getByRole("link", { name: new RegExp(city) })).toBeVisible();
    }
  });

  test("un clic sur une Ville ouvre la page de cette Ville", async ({ page }) => {
    await page.goto("/explorer");
    await page.getByRole("link", { name: /Paris/ }).click();
    await expect(page).toHaveURL(/\/explorer\/Paris/);
  });
});
