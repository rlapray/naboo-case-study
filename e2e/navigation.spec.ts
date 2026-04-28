import { expect, test } from "@playwright/test";

test.describe("Titres de page (régression template literal)", () => {
  test("page explorer/[city] interpole bien le nom de la ville", async ({ page }) => {
    await page.goto("/explorer/Paris");
    await expect(page).toHaveTitle(/^Paris \| CDTR$/);
    await expect(page).not.toHaveTitle(/\$\{/);
  });
});

test.describe("Topbar — items du menu cliquables sur toute leur surface", () => {
  // Le trigger du menu Utilisateur est rendu en icône-only par la Topbar : pas de nom
  // accessible, on le cible via l'attribut ARIA exposé par Mantine Menu.Target.
  const userMenuTrigger = '[aria-haspopup="menu"]';

  test("clic sur un item du dropdown navigue vers la route", async ({ page }) => {
    await page.goto("/");

    await page.locator(userMenuTrigger).hover();
    await page.getByRole("menuitem", { name: "Inscription" }).click();

    await expect(page).toHaveURL(/\/signup$/);
  });

  test("l'item du menu expose un seul lien (pas de <a> imbriqué)", async ({ page }) => {
    await page.goto("/");
    await page.locator(userMenuTrigger).hover();

    const item = page.getByRole("menuitem", { name: "Connection" });
    await expect(item).toHaveAttribute("href", "/signin");
  });
});
