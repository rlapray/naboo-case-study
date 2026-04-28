import { expect, test } from "@playwright/test";

test.describe("Filtres sur les Activités d'une Ville", () => {
  test("filtre par nom : restreint la liste et persiste dans l'URL", async ({ page }) => {
    await page.goto("/explorer/Paris");

    await expect(page.getByText("Yoga à Paris")).toBeVisible();
    await expect(page.getByText("Visite du Louvre")).toBeVisible();

    await page.getByPlaceholder("Activité").fill("Yoga");

    await expect(page).toHaveURL(/activity=Yoga/);
    await expect(page.getByText("Yoga à Paris")).toBeVisible();
    await expect(page.getByText("Visite du Louvre")).toHaveCount(0);

    await page.reload();
    await expect(page.getByPlaceholder("Activité")).toHaveValue("Yoga");
    await expect(page.getByText("Yoga à Paris")).toBeVisible();
  });

  test("filtre par Tarif maximum et persiste dans l'URL", async ({ page }) => {
    await page.goto("/explorer/Paris");

    await page.getByPlaceholder("Prix max").fill("30");

    await expect(page).toHaveURL(/price=30/);
    await expect(page.getByText("Yoga à Paris")).toBeVisible();
    await expect(page.getByText("Visite du Louvre")).toHaveCount(0);
  });

  test("combine filtres nom et Tarif", async ({ page }) => {
    await page.goto("/explorer/Paris?activity=Visite&price=100");

    await expect(page.getByPlaceholder("Activité")).toHaveValue("Visite");
    await expect(page.getByText("Visite du Louvre")).toBeVisible();
    await expect(page.getByText("Yoga à Paris")).toHaveCount(0);
  });
});
