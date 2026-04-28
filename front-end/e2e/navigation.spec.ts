import { expect, test } from "@playwright/test";

test.describe("Titres de page (régression template literal)", () => {
  test("page explorer/[city] interpole bien le nom de la ville", async ({ page }) => {
    await page.goto("/explorer/Paris");
    await expect(page).toHaveTitle(/^Paris \| CDTR$/);
    await expect(page).not.toHaveTitle(/\$\{/);
  });
});

test.describe("Topbar — items du menu cliquables sur toute leur surface", () => {
  test("clic sur un item du dropdown navigue vers la route", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /utilisateur/i }).hover();
    await page.getByRole("menuitem", { name: "Inscription" }).click();

    await expect(page).toHaveURL(/\/signup$/);
  });

  test("l'item du menu expose un seul lien (pas de <a> imbriqué)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /utilisateur/i }).hover();

    const item = page.getByRole("menuitem", { name: "Connection" });
    await expect(item).toHaveAttribute("href", "/signin");
  });
});
