import { expect, test } from "@playwright/test";

test.describe("Activités d'une Ville", () => {
  test("affiche les Activités de Paris (Yoga, Louvre)", async ({ page }) => {
    await page.goto("/explorer/Paris");

    await expect(page).toHaveTitle(/^Paris \| CDTR$/);
    await expect(
      page.getByRole("heading", { name: "Activités pour la ville de Paris" }),
    ).toBeVisible();

    await expect(page.getByText("Yoga à Paris")).toBeVisible();
    await expect(page.getByText("Visite du Louvre")).toBeVisible();
    await expect(page.getByText("Randonnée dans les Alpes")).toHaveCount(0);
  });

  test("affiche un état vide pour une Ville sans Activité", async ({ page }) => {
    await page.goto("/explorer/Lyon");
    await expect(page.getByText("Aucune donnée pour le moment")).toBeVisible();
  });
});
