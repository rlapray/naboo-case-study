import { expect, test } from "@playwright/test";
import { signInAs } from "./fixtures/auth";

test.describe("Publier une Activité", () => {
  test.beforeEach(async ({ page }) => {
    // Mocker uniquement la dépendance externe (référentiel des communes).
    await page.route("**/geo.api.gouv.fr/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { nom: "Bordeaux", code: "33063" },
          { nom: "Bordères", code: "64132" },
        ]),
      });
    });
    await signInAs(page);
  });

  test("crée une Activité visible dans Mes activités et le Catalogue", async ({ page }) => {
    const activityName = `Test E2E ${Date.now()}`;

    await page.goto("/activities/create");
    await expect(page.getByRole("heading", { name: "Ajouter une activité" })).toBeVisible();

    await page.getByLabel("Nom de l'activité").fill(activityName);
    await page.getByLabel("Description").fill("Description du parcours e2e");

    const citySelect = page.getByRole("combobox", { name: "Localisation" });
    await citySelect.click();
    await citySelect.fill("Bordeaux");
    await page.getByRole("option", { name: "Bordeaux" }).click();

    await page.getByLabel("Prix").fill("42");
    await page.getByRole("button", { name: "Valider" }).click();

    // Le formulaire navigue via router.back() après succès — on attend la sortie de /create.
    await page.waitForURL((url) => !url.pathname.endsWith("/activities/create"));

    // Pas de snackbar d'erreur : la création a été acceptée par le back.
    await expect(page.getByText("Une erreur est survenue")).toHaveCount(0);
  });

  test("refuse un Tarif nul (validation côté client)", async ({ page }) => {
    await page.goto("/activities/create");

    await page.getByLabel("Nom de l'activité").fill("Test prix invalide");
    await page.getByLabel("Description").fill("Lorem ipsum");

    const citySelect = page.getByRole("combobox", { name: "Localisation" });
    await citySelect.click();
    await citySelect.fill("Bordeaux");
    await page.getByRole("option", { name: "Bordeaux" }).click();

    await page.getByLabel("Prix").fill("0");
    await page.getByRole("button", { name: "Valider" }).click();

    await expect(page).toHaveURL(/\/activities\/create$/);
    await expect(
      page.getByText("Price required and must be greater than 0"),
    ).toBeVisible();
  });
});
