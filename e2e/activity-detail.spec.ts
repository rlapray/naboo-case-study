import { expect, test } from "@playwright/test";

test.describe("Fiche d'une Activité", () => {
  test("clic sur Voir plus depuis l'explorer ouvre la fiche complète", async ({ page }) => {
    await page.goto("/explorer/Paris");

    const yogaRow = page
      .locator("div")
      .filter({ hasText: "Yoga à Paris" })
      .filter({ has: page.getByRole("link", { name: "Voir plus" }) })
      .last();

    await yogaRow.getByRole("link", { name: "Voir plus" }).click();

    await expect(page).toHaveURL(/\/activities\/[^/]+$/);
    await expect(page).toHaveTitle(/Yoga à Paris \| CDTR/);
    await expect(page.getByRole("heading", { name: "Yoga à Paris" })).toBeVisible();
    await expect(page.getByText("25€/j")).toBeVisible();
    await expect(page.getByText(/Ajouté par .+/)).toBeVisible();
  });
});
