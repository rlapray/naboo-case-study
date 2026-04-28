import { expect, test } from "@playwright/test";

test.describe("Accueil — dernières Activités", () => {
  test("affiche le bloc des dernières activités et un raccourci vers la découverte", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Accueil/);
    await expect(page.getByRole("heading", { name: "Accueil" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Découvrez les dernières activités" }),
    ).toBeVisible();

    const cardLinks = page.getByRole("link", { name: "Voir plus" });
    await expect(cardLinks.first()).toBeVisible();
    expect(await cardLinks.count()).toBeGreaterThanOrEqual(3);
  });
});
