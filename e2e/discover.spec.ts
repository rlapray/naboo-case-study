import { expect, test } from "@playwright/test";
import { SEED_ADMIN, signInAs } from "./fixtures/auth";

test.describe("Découvrir toutes les Activités", () => {
  test("liste les Activités du Catalogue (visiteur)", async ({ page }) => {
    await page.goto("/discover");

    await expect(page).toHaveTitle(/Discover/);
    await expect(
      page.getByRole("heading", { name: "Découvrez des activités" }),
    ).toBeVisible();

    const seededActivities = ["Yoga à Paris", "Visite du Louvre", "Randonnée dans les Alpes"];
    for (const name of seededActivities) {
      await expect(page.getByText(name).first()).toBeVisible();
    }
  });

  test("ne propose pas le raccourci de publication à un visiteur", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("link", { name: "Ajouter une activité" })).toHaveCount(0);
  });

  test("propose le raccourci de publication à un Utilisateur connecté", async ({ page }) => {
    await signInAs(page);
    await page.goto("/discover");

    const publishLink = page.getByRole("link", { name: "Ajouter une activité" });
    await expect(publishLink).toBeVisible();
    await expect(publishLink).toHaveAttribute("href", "/activities/create");
  });
});

test.describe("mode debug administrateur sur Découvrir", () => {
  test("un Administrateur voit la date de création sur les cartes", async ({ page }) => {
    await signInAs(page, SEED_ADMIN);
    await page.goto("/discover");

    await expect(
      page.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/).first(),
    ).toBeVisible();
  });

  test("un Utilisateur standard ne voit pas la date de création", async ({ page }) => {
    await signInAs(page);
    await page.goto("/discover");

    await expect(page.getByText("Yoga à Paris").first()).toBeVisible();
    await expect(page.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)).toHaveCount(0);
  });
});
